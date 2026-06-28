import datetime
import uuid
from sqlalchemy import String, DateTime, ForeignKey, Integer, Float, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class UsageAnalytics(Base):
    __tablename__ = "usage_analytics"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action_type: Mapped[str] = mapped_column(String(100), nullable=False)  # "chat", "generate", "review", "docs"
    language: Mapped[str] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

class APIUsage(Base):
    __tablename__ = "api_usages"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider: Mapped[str] = mapped_column(String(100), nullable=False)  # "gemini", "openai", "claude", "mock"
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    prompt_tokens: Mapped[int] = mapped_column(Integer, default=0)
    completion_tokens: Mapped[int] = mapped_column(Integer, default=0)
    estimated_cost: Mapped[float] = mapped_column(Float, default=0.0)
    response_time_ms: Mapped[int] = mapped_column(Integer, default=0)  # Execution time in ms
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=True)  # Nullable for system tasks or failures
    action: Mapped[str] = mapped_column(String(255), nullable=False)  # "login", "register", "create_workspace", "admin_action"
    details: Mapped[str] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    # Relationship
    user: Mapped["User"] = relationship(back_populates="audit_logs")
