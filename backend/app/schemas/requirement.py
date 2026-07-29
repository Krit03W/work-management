from datetime import datetime

from pydantic import BaseModel, ConfigDict


class RequirementDocBase(BaseModel):
    project_id: int
    title: str
    content: str = ""


class RequirementDocCreate(RequirementDocBase):
    pass


class RequirementDocUpdate(BaseModel):
    title: str | None = None
    content: str | None = None


class RequirementDocRead(RequirementDocBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    version: int
    created_at: datetime
    updated_at: datetime
