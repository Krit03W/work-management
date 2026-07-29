from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NoteBase(BaseModel):
    project_id: int | None = None
    title: str | None = None
    content: str


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    project_id: int | None = None
    title: str | None = None
    content: str | None = None


class NoteRead(NoteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
