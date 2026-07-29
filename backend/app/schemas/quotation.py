from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.quotation import QuotationStatus


class QuotationItemBase(BaseModel):
    description: str
    quantity: Decimal = Decimal("1")
    unit_price: Decimal = Decimal("0")
    sort_order: int = 0


class QuotationItemCreate(QuotationItemBase):
    pass


class QuotationItemRead(QuotationItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class QuotationBase(BaseModel):
    project_id: int
    quotation_number: str
    status: QuotationStatus = QuotationStatus.DRAFT
    issue_date: date | None = None
    valid_until: date | None = None
    notes: str | None = None


class QuotationCreate(QuotationBase):
    items: list[QuotationItemCreate] = []


class QuotationUpdate(BaseModel):
    quotation_number: str | None = None
    status: QuotationStatus | None = None
    issue_date: date | None = None
    valid_until: date | None = None
    notes: str | None = None
    items: list[QuotationItemCreate] | None = None


class QuotationRead(QuotationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    items: list[QuotationItemRead]
    total: Decimal
    created_at: datetime
    updated_at: datetime
