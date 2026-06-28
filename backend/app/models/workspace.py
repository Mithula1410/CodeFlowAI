import datetime
import uuid
from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

_utcnow = lambda: datetime.datetime.now(datetime.timezone.utc)


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    # Relationships
    owner: Mapped["User"] = relationship(back_populates="workspaces")
    projects: Mapped[list["Project"]] = relationship(back_populates="workspace", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    # Relationships
    workspace: Mapped["Workspace"] = relationship(back_populates="projects")
    files: Mapped[list["File"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    chats: Mapped[list["Chat"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    reviews: Mapped[list["CodeReview"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    documents: Mapped[list["Document"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    repositories: Mapped[list["GithubRepository"]] = relationship(back_populates="project", cascade="all, delete-orphan")


class File(Base):
    __tablename__ = "files"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    path: Mapped[str] = mapped_column(String(500), nullable=False)  # Relative path like "src/index.js"
    content: Mapped[str] = mapped_column(Text, default="")
    language: Mapped[str] = mapped_column(String(100), default="javascript")
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow
    )

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="files")
