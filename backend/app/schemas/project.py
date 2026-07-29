from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.project import ProjectCategory, ProjectStatus


class ProjectBase(BaseModel):
    name: str
    client_id: int | None = None
    category: ProjectCategory = ProjectCategory.FREELANCE
    status: ProjectStatus = ProjectStatus.LEAD
    description: str | None = None
    start_date: date | None = None
    deadline: date | None = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: str | None = None
    client_id: int | None = None
    category: ProjectCategory | None = None
    status: ProjectStatus | None = None
    description: str | None = None
    start_date: date | None = None
    deadline: date | None = None


class ProjectRead(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
