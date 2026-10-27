from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.all_models import SavingsGoal, SavingsContribution
from app.schemas.all_schemas import (
    SavingsGoalCreate,
    SavingsGoalUpdate,
    SavingsGoalResponse,
    SavingsContributionCreate,
    SavingsContributionResponse
)
from app.services.financial_calc import calculate_savings_goal_metrics

router = APIRouter(prefix="/api/savings-goals", tags=["Savings Goals"])

def enrich_goal(goal: SavingsGoal) -> SavingsGoalResponse:
    metrics = calculate_savings_goal_metrics(
        target_amount=goal.target_amount,
        current_saved=goal.current_saved,
        target_date=goal.target_date
    )

    conts = [
        SavingsContributionResponse(
            id=c.id,
            goal_id=c.goal_id,
            date=c.date,
            amount=c.amount,
            note=c.note,
            created_at=c.created_at
        ) for c in sorted(goal.contributions, key=lambda x: x.date, reverse=True)
    ]

    return SavingsGoalResponse(
        id=goal.id,
        name=goal.name,
        target_amount=goal.target_amount,
        current_saved=goal.current_saved,
        target_date=goal.target_date,
        description=goal.description,
        is_demo=goal.is_demo,
        progress_percentage=metrics["progress_percentage"],
        remaining_amount=metrics["remaining_amount"],
        required_monthly_savings=metrics["required_monthly_savings"],
        months_remaining=metrics["months_remaining"],
        is_at_risk=metrics["is_at_risk"],
        contributions=conts,
        created_at=goal.created_at
    )

@router.get("", response_model=List[SavingsGoalResponse])
def get_savings_goals(db: Session = Depends(get_db)):
    goals = db.query(SavingsGoal).order_by(SavingsGoal.target_date.asc()).all()
    return [enrich_goal(g) for g in goals]

@router.post("", response_model=SavingsGoalResponse, status_code=201)
def create_savings_goal(data: SavingsGoalCreate, db: Session = Depends(get_db)):
    g = SavingsGoal(
        name=data.name,
        target_amount=data.target_amount,
        current_saved=data.current_saved,
        target_date=data.target_date,
        description=data.description,
        is_demo=False
    )
    db.add(g)
    db.commit()
    db.refresh(g)

    # If starting current_saved > 0, log an initial contribution
    if data.current_saved > 0:
        c = SavingsContribution(
            goal_id=g.id,
            date=date.today(),
            amount=data.current_saved,
            note="Initial opening balance"
        )
        db.add(c)
        db.commit()
        db.refresh(g)

    return enrich_goal(g)

@router.put("/{id}", response_model=SavingsGoalResponse)
def update_savings_goal(id: int, data: SavingsGoalUpdate, db: Session = Depends(get_db)):
    g = db.query(SavingsGoal).filter(SavingsGoal.id == id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Savings goal not found")

    update_dict = data.model_dump(exclude_unset=True)
    for key, val in update_dict.items():
        setattr(g, key, val)

    db.commit()
    db.refresh(g)
    return enrich_goal(g)

@router.delete("/{id}", status_code=200)
def delete_savings_goal(id: int, db: Session = Depends(get_db)):
    g = db.query(SavingsGoal).filter(SavingsGoal.id == id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Savings goal not found")

    db.delete(g)
    db.commit()
    return {"message": "Savings goal deleted successfully", "id": id}

@router.post("/{id}/contribute", response_model=SavingsGoalResponse)
def record_contribution(id: int, data: SavingsContributionCreate, db: Session = Depends(get_db)):
    g = db.query(SavingsGoal).filter(SavingsGoal.id == id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Savings goal not found")

    # Update goal current_saved
    new_saved = round(max(0.0, g.current_saved + data.amount), 2)
    g.current_saved = new_saved

    contrib = SavingsContribution(
        goal_id=g.id,
        date=data.date,
        amount=data.amount,
        note=data.note
    )
    db.add(contrib)
    db.commit()
    db.refresh(g)
    return enrich_goal(g)
