import enum
from datetime import date, datetime

from sqlalchemy import String, Text, Date, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ProjectCategory(str, enum.Enum):
    FULL_TIME = "full_time"
    FREELANCE = "freelance"
    SOLOPRENEUR = "solopreneur"


class ProjectStatus(str, enum.Enum):
    LEAD = "lead"
    QUOTED = "quoted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int | None] = mapped_column(ForeignKey("clients.id", ondelete="SET NULL"))

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[ProjectCategory] = mapped_column(
        Enum(ProjectCategory, name="project_category"), default=ProjectCategory.FREELANCE
    )
    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus, name="project_status"), default=ProjectStatus.LEAD
    )
    description: Mapped[str | None] = mapped_column(Text)
    start_date: Mapped[date | None] = mapped_column(Date)
    deadline: Mapped[date | None] = mapped_column(Date)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    client: Mapped["Client"] = relationship(back_populates="projects")
    notes: Mapped[list["Note"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    quotations: Mapped[list["Quotation"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    requirement_docs: Mapped[list["RequirementDoc"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
