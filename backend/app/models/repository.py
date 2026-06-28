import datetime
import uuid
from sqlalchemy import String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

_utcnow = lambda: datetime.datetime.now(datetime.timezone.utc)


class GithubRepository(Base):
    __tablename__ = "github_repositories"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    repo_name: Mapped[str] = mapped_column(String(255), nullable=False)
    owner: Mapped[str] = mapped_column(String(255), nullable=False)
    html_url: Mapped[str] = mapped_column(String(500), nullable=True)
    is_connected: Mapped[bool] = mapped_column(Boolean, default=True)
    last_scanned_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="repositories")
