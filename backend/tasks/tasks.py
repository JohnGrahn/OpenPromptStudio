import traceback
from sqlalchemy.orm import Session
import functools
import asyncio
from datetime import datetime, timedelta

from routers.project_socket import project_managers
from db.models import Stack, PreparedSandbox, Project
from sandbox.sandbox import DevSandbox


def task_handler():
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                print(f"Error in {func.__name__}: {e}\n{traceback.format_exc()}")
                return None

        return wrapper

    return decorator


@task_handler()
async def cleanup_inactive_project_managers():
    to_remove = []
    for project_id, manager in project_managers.items():
        if manager.is_inactive():
            to_remove.append(project_id)

    for project_id in to_remove:
        await project_managers[project_id].kill()
        del project_managers[project_id]
        print(f"Cleaned up inactive project manager for project {project_id}")


@task_handler()
async def maintain_prepared_sandboxes(db: Session):
    """Maintain a pool of prepared sandboxes for each stack"""
    # Get all stacks
    stacks = db.query(Stack).all()
    
    for stack in stacks:
        # Count existing prepared sandboxes for this stack
        existing_count = db.query(PreparedSandbox).filter(
            PreparedSandbox.stack_id == stack.id
        ).count()
        
        # Create new sandboxes if needed (maintain 2 prepared sandboxes per stack)
        while existing_count < 2:
            try:
                sandbox, sandbox_id = await DevSandbox.prepare_sandbox(stack)
                prepared = PreparedSandbox(
                    sandbox_id=sandbox_id,
                    stack_id=stack.id,
                    created_at=datetime.utcnow()
                )
                db.add(prepared)
                db.commit()
                existing_count += 1
                print(f"Created new prepared sandbox {sandbox_id} for stack {stack.id}")
            except Exception as e:
                print(f"Failed to create prepared sandbox for stack {stack.id}: {e}")
                break


@task_handler()
async def clean_up_project_resources(db: Session):
    """Clean up resources for deleted or inactive projects"""
    # Find projects that have been inactive for more than 7 days
    cutoff = datetime.utcnow() - timedelta(days=7)
    inactive_projects = db.query(Project).filter(
        Project.last_accessed < cutoff
    ).all()
    
    for project in inactive_projects:
        try:
            await DevSandbox.terminate_project_resources(project)
            print(f"Cleaned up resources for inactive project {project.id}")
        except Exception as e:
            print(f"Failed to clean up project {project.id}: {e}")