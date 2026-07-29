from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.quotation import Quotation, QuotationItem
from app.schemas.quotation import QuotationCreate, QuotationRead, QuotationUpdate

router = APIRouter(prefix="/quotations", tags=["quotations"])


@router.get("", response_model=list[QuotationRead])
def list_quotations(project_id: int | None = None, db: Session = Depends(get_db)):
    stmt = select(Quotation).order_by(Quotation.created_at.desc())
    if project_id is not None:
        stmt = stmt.where(Quotation.project_id == project_id)
    return db.execute(stmt).scalars().all()


@router.post("", response_model=QuotationRead, status_code=201)
def create_quotation(payload: QuotationCreate, db: Session = Depends(get_db)):
    data = payload.model_dump(exclude={"items"})
    quotation = Quotation(**data)
    quotation.items = [QuotationItem(**item.model_dump()) for item in payload.items]
    db.add(quotation)
    db.commit()
    db.refresh(quotation)
    return quotation


@router.get("/{quotation_id}", response_model=QuotationRead)
def get_quotation(quotation_id: int, db: Session = Depends(get_db)):
    quotation = db.get(Quotation, quotation_id)
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return quotation


@router.patch("/{quotation_id}", response_model=QuotationRead)
def update_quotation(quotation_id: int, payload: QuotationUpdate, db: Session = Depends(get_db)):
    quotation = db.get(Quotation, quotation_id)
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")

    data = payload.model_dump(exclude_unset=True, exclude={"items"})
    for field, value in data.items():
        setattr(quotation, field, value)

    if payload.items is not None:
        quotation.items = [QuotationItem(**item.model_dump()) for item in payload.items]

    db.commit()
    db.refresh(quotation)
    return quotation


@router.delete("/{quotation_id}", status_code=204)
def delete_quotation(quotation_id: int, db: Session = Depends(get_db)):
    quotation = db.get(Quotation, quotation_id)
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    db.delete(quotation)
    db.commit()
