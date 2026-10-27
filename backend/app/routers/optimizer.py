from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.all_models import OptimizationStatus, Budget
from app.schemas.all_schemas import OptimizerRecommendation
from app.services.optimizer_service import generate_optimization_recommendations

router = APIRouter(prefix="/api/optimizer", tags=["Optimizer"])

class StatusUpdatePayload(BaseModel):
    rule_key: str
    status: str # "reviewed" or "dismissed"

class ApplyBudgetPayload(BaseModel):
    category: str
    proposed_budget: float
    month: int
    year: int

@router.get("/recommendations", response_model=List[OptimizerRecommendation])
def get_recommendations(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020, le=2050),
    include_dismissed: bool = False,
    db: Session = Depends(get_db)
):
    recs = generate_optimization_recommendations(db, month=month, year=year)
    if not include_dismissed:
        recs = [r for r in recs if r.status != "dismissed"]
    return recs

@router.post("/status")
def update_recommendation_status(data: StatusUpdatePayload, db: Session = Depends(get_db)):
    if data.status not in ["reviewed", "dismissed", "active"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'reviewed', 'dismissed', or 'active'.")

    record = db.query(OptimizationStatus).filter(OptimizationStatus.rule_key == data.rule_key).first()
    if not record:
        record = OptimizationStatus(rule_key=data.rule_key, status=data.status)
        db.add(record)
    else:
        record.status = data.status

    db.commit()
    return {"message": f"Updated status for '{data.rule_key}' to '{data.status}'."}

@router.post("/apply-budget")
def apply_proposed_budget(data: ApplyBudgetPayload, db: Session = Depends(get_db)):
    if data.proposed_budget <= 0:
        raise HTTPException(status_code=400, detail="Proposed budget must be positive.")

    budget = db.query(Budget).filter(
        Budget.category == data.category,
        Budget.month == data.month,
        Budget.year == data.year
    ).first()

    if budget:
        budget.planned_amount = round(data.proposed_budget, 2)
    else:
        budget = Budget(
            category=data.category,
            planned_amount=round(data.proposed_budget, 2),
            month=data.month,
            year=data.year,
            description=f"Auto-aligned via Optimizer recommendation"
        )
        db.add(budget)

    db.commit()
    return {
        "message": f"Successfully updated budget for {data.category} to ₹{data.proposed_budget:,.2f} for {data.month}/{data.year}.",
        "category": data.category,
        "planned_amount": round(data.proposed_budget, 2)
    }
