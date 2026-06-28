import datetime
import uuid
from sqlalchemy import String, DateTime, ForeignKey, Float, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

_utcnow = lambda: datetime.datetime.now(datetime.timezone.utc)


class CodeReview(Base):
    __tablename__ = "code_reviews"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    score_overall: Mapped[float] = mapped_column(Float, default=0.0)
    score_security: Mapped[float] = mapped_column(Float, default=0.0)
    score_performance: Mapped[float] = mapped_column(Float, default=0.0)
    score_readability: Mapped[float] = mapped_column(Float, default=0.0)
    score_maintainability: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="reviews")
    issues: Mapped[list["ReviewIssue"]] = relationship(back_populates="review", cascade="all, delete-orphan")


class ReviewIssue(Base):
    __tablename__ = "review_issues"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    review_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("code_reviews.id", ondelete="CASCADE"), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    line_number: Mapped[int] = mapped_column(Integer, default=0)
    severity: Mapped[str] = mapped_column(String(50), default="warning")  # "critical", "warning", "info"
    category: Mapped[str] = mapped_column(String(100), default="smell")  # "security", "performance", "style", "bug"
    description: Mapped[str] = mapped_column(Text, nullable=False)
    suggested_fix: Mapped[str] = mapped_column(Text, nullable=True)

    # Relationships
    review: Mapped["CodeReview"] = relationship(back_populates="issues")
