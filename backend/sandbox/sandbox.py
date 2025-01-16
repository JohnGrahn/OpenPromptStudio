import os
import asyncio
import base64
import datetime
import shutil
import uuid
from typing import List, Optional, Tuple, AsyncGenerator, Union
from asyncio import Lock
from functools import lru_cache
import subprocess
import aiofiles

from db.database import get_db
from db.models import Project, PreparedSandbox, Stack

SANDBOX_ROOT = "/tmp/promptstudio/sandboxes"
IGNORE_PATHS = ["node_modules", ".git", ".next", "build", "git.log", "tmp"]

@lru_cache()
def _get_project_lock(project_id: int) -> Lock:
    return Lock()

class SandboxNotReadyException(Exception):
    pass

def _unique_id():
    return str(uuid.uuid4())

def _ensure_sandbox_dir():
    os.makedirs(SANDBOX_ROOT, exist_ok=True)

def _get_sandbox_path(sandbox_id: str) -> str:
    return os.path.join(SANDBOX_ROOT, sandbox_id)

async def _is_url_up(url: str) -> bool:
    # Local dev always returns True since we're not using real sandboxes
    return True

def _ends_with_ignore_path(path: str):
    path_parts = path.split("/")
    return any(
        part == ignore_path for ignore_path in IGNORE_PATHS for part in path_parts
    )

async def _get_paths(root_path: str) -> List[str]:
    paths = []
    for root, _, files in os.walk(root_path):
        for file in files:
            full_path = os.path.join(root, file)
            if not _ends_with_ignore_path(full_path):
                paths.append(os.path.relpath(full_path, root_path))
    return sorted(paths)

def _strip_app_prefix(path: str) -> str:
    if path.startswith("/app/"):
        return path[len("/app/"):]
    return path

class DevSandbox:
    def __init__(self, project_id: int, sandbox_id: str):
        self.project_id = project_id
        self.sandbox_id = sandbox_id
        self.sandbox_path = _get_sandbox_path(sandbox_id)
        self.ready = True
        _ensure_sandbox_dir()

    async def is_up(self):
        return True

    async def wait_for_up(self):
        self.ready = True

    async def get_file_paths(self) -> List[str]:
        paths = await _get_paths(self.sandbox_path)
        return ["/app/" + path for path in paths]

    async def run_command(self, command: str, workdir: Optional[str] = None) -> str:
        work_dir = workdir or self.sandbox_path
        proc = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=work_dir
        )
        stdout, stderr = await proc.communicate()
        return (stdout or b"").decode() + (stderr or b"").decode()

    async def run_command_stream(
        self, command: str, workdir: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        work_dir = workdir or self.sandbox_path
        proc = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=work_dir
        )
        async for line in proc.stderr:
            yield line.decode()

    async def write_file_contents_and_commit(
        self, files: List[Tuple[str, str]], commit_message: str
    ):
        for path, content in files:
            full_path = os.path.join(self.sandbox_path, _strip_app_prefix(path))
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, 'w') as f:
                f.write(content)
        
        await self.run_command("git add -A")
        await self.run_command(f'git commit -m "{commit_message}"')
        await self.run_command('git log --pretty="%h|%s|%aN|%aE|%aD" -n 50 > git.log')

    async def read_file_contents(self, path: str, does_not_exist_ok: bool = False) -> str:
        full_path = os.path.join(self.sandbox_path, _strip_app_prefix(path))
        try:
            with open(full_path, 'r') as f:
                return f.read()
        except FileNotFoundError as e:
            if does_not_exist_ok:
                return ""
            raise e

    async def stream_file_contents(self, path: str, binary_mode: bool = False) -> AsyncGenerator[Union[str, bytes], None]:
        full_path = os.path.join(self.sandbox_path, _strip_app_prefix(path))
        try:
            mode = 'rb' if binary_mode else 'r'
            with open(full_path, mode) as f:
                while chunk := f.read(8192):
                    yield chunk
        except FileNotFoundError as e:
            raise e

    @classmethod
    async def terminate_project_resources(cls, project: Project):
        if project.sandbox_id:
            sandbox_path = _get_sandbox_path(project.sandbox_id)
            if os.path.exists(sandbox_path):
                shutil.rmtree(sandbox_path)

    @classmethod
    async def get_project_file_contents(
        cls, project: Project, path: str
    ) -> Optional[bytes]:
        if project.sandbox_id:
            full_path = os.path.join(_get_sandbox_path(project.sandbox_id), _strip_app_prefix(path))
            try:
                with open(full_path, 'rb') as f:
                    return f.read()
            except FileNotFoundError:
                return None
        return None

    @classmethod
    async def destroy_project_resources(cls, project: Project):
        await cls.terminate_project_resources(project)

    @classmethod
    async def get_or_create(
        cls, project_id: int, create_if_missing: bool = True
    ) -> "DevSandbox":
        lock = _get_project_lock(project_id)
        try:
            await lock.acquire()
            db = next(get_db())
            project = db.query(Project).filter(Project.id == project_id).first()
            stack = db.query(Stack).filter(Stack.id == project.stack_id).first()
            if not project or not stack:
                raise SandboxNotReadyException(
                    f"Project or stack not found (project={project_id})"
                )

            if not project.sandbox_id:
                if not create_if_missing:
                    raise SandboxNotReadyException(
                        f"No sandbox found for project (project={project_id})"
                    )
                
                # Create new sandbox
                sandbox_id = _unique_id()
                project.sandbox_id = sandbox_id
                db.commit()

                # Initialize sandbox
                sandbox = cls(project_id, sandbox_id)
                sandbox_path = _get_sandbox_path(sandbox_id)
                os.makedirs(sandbox_path, exist_ok=True)
                await sandbox.run_command("git init")
                return sandbox
            
            return cls(project_id, project.sandbox_id)
        finally:
            lock.release()

    @classmethod
    async def prepare_sandbox(cls, stack: Stack) -> Tuple["DevSandbox", str]:
        sandbox_id = _unique_id()
        sandbox = cls(-1, sandbox_id)  # Use -1 as project_id for prepared sandboxes
        
        # Create sandbox directory
        sandbox_path = _get_sandbox_path(sandbox_id)
        os.makedirs(sandbox_path, exist_ok=True)
        
        # Initialize sandbox with stack
        await sandbox.run_command("git init")
        if stack.sandbox_init_cmd:
            await sandbox.run_command(stack.sandbox_init_cmd)
        
        return sandbox, sandbox_id