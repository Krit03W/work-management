from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ClientBase(BaseModel):
    name: str
    company: str | None = None
    email: str | None = None
    phone: str | None = None
    tax_id: str | None = None
    address: str | None = None
    notes: str | None = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: str | None = None
    company: str | None = None
    email: str | None = None
    phone: str | None = None
    tax_id: str | None = None
    address: str | None = None
    notes: str | None = None


class ClientRead(ClientBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
