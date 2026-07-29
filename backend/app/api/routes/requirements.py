from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.requirement import RequirementDoc
from app.schemas.requirement import RequirementDocCreate, RequirementDocRead, RequirementDocUpdate

router = APIRouter(prefix="/requirement-docs", tags=["requirement-docs"])


@router.get("", response_model=list[RequirementDocRead])
def list_requirement_docs(project_id: int | None = None, db: Session = Depends(get_db)):
    stmt = select(RequirementDoc).order_by(RequirementDoc.created_at.desc())
    if project_id is not None:
        stmt = stmt.where(RequirementDoc.project_id == project_id)
    return db.execute(stmt).scalars().all()


@router.post("", response_model=RequirementDocRead, status_code=201)
def create_requirement_doc(payload: RequirementDocCreate, db: Session = Depends(get_db)):
    doc = RequirementDoc(**payload.model_dump())
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/{doc_id}", response_model=RequirementDocRead)
def get_requirement_doc(doc_id: int, db: Session = Depends(get_db)):
    doc = db.get(RequirementDoc, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Requirement doc not found")
    return doc


@router.patch("/{doc_id}", response_model=RequirementDocRead)
def update_requirement_doc(doc_id: int, payload: RequirementDocUpdate, db: Session = Depends(get_db)):
    doc = db.get(RequirementDoc, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Requirement doc not found")
    data = payload.model_dump(exclude_unset=True)
    if "content" in data:
        doc.version += 1
    for field, value in data.items():
        setattr(doc, field, value)
    db.commit()
    db.refresh(doc)
    return doc


@router.delete("/{doc_id}", status_code=204)
def delete_requirement_doc(doc_id: int, db: Session = Depends(get_db)):
    doc = db.get(RequirementDoc, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Requirement doc not found")
    db.delete(doc)
    db.commit()
