from enum import Enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class TeamRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"

class UserType(str, Enum):
    USER = "user"
    ADMIN = "admin"
    WEB_DESIGNER = "web_designer"
    LEARNING_TO_CODE = "learning_to_code"
    EXPERT_DEVELOPER = "expert_developer"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    user_type = Column(String, default=UserType.USER)
    team_memberships = relationship("TeamMember", back_populates="user")
    chats = relationship("Chat", back_populates="user")
    projects = relationship("Project", back_populates="owner", foreign_keys="Project.user_id")

class Team(Base):
    __tablename__ = "teams"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    created_at = Column(DateTime)
    credits = Column(Integer, default=0)
    members = relationship("TeamMember", back_populates="team")

class TeamMember(Base):
    __tablename__ = "team_members"
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String, default=TeamRole.MEMBER)
    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="team_memberships")

class TeamInvite(Base):
    __tablename__ = "team_invites"
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"))
    email = Column(String)
    role = Column(String, default=TeamRole.MEMBER)
    created_at = Column(DateTime)
    team = relationship("Team")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    last_accessed = Column(DateTime)
    description = Column(Text, nullable=True)
    custom_instructions = Column(Text, nullable=True)
    modal_never_cleanup = Column(Boolean, default=False)
    sandbox_id = Column(String, nullable=True)
    team_id = Column(Integer, ForeignKey("teams.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    stack_id = Column(Integer, ForeignKey("stacks.id"))
    chats = relationship("Chat", back_populates="project")
    owner = relationship("User", foreign_keys=[user_id], back_populates="projects")
    stack = relationship("Stack", back_populates="projects")

class Chat(Base):
    __tablename__ = "chats"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    is_public = Column(Boolean, default=False)
    public_share_id = Column(String, nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    team_id = Column(Integer, ForeignKey("teams.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    project = relationship("Project", back_populates="chats")
    messages = relationship("Message", back_populates="chat")
    user = relationship("User", back_populates="chats")

class Stack(Base):
    __tablename__ = "stacks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, unique=True)
    description = Column(Text)
    from_registry = Column(String)
    sandbox_init_cmd = Column(String)
    sandbox_start_cmd = Column(String)
    prompt = Column(Text)
    pack_hash = Column(String)
    setup_time_seconds = Column(Integer)
    prepared_sandboxes = relationship("PreparedSandbox", back_populates="stack")
    projects = relationship("Project", back_populates="stack")

class PreparedSandbox(Base):
    __tablename__ = "prepared_sandboxes"
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime)
    pack_hash = Column(String)
    modal_sandbox_id = Column(String)
    modal_volume_label = Column(String)
    stack_id = Column(Integer, ForeignKey("stacks.id"))
    stack = relationship("Stack", back_populates="prepared_sandboxes")

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    role = Column(String)
    content = Column(Text)
    created_at = Column(DateTime)
    chat_id = Column(Integer, ForeignKey("chats.id"))
    chat = relationship("Chat", back_populates="messages")