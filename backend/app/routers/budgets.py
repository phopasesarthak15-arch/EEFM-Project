from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.all_models import Budget, Transaction
from app.schemas.all_schemas import BudgetCreate, BudgetUpdate, BudgetResponse
from app.services.financial_calc import (
    calculate_budget_utilization,
    calculate_remaining_budget,
    get_budget_status
)

router = APIRouter(prefix="/api/budgets", tags=["Budgets"])

def enrich_budget(b: Budget, db: Session) -> BudgetResponse:
    # Calculate actual spending in this category for that month & year
    start_date = date(b.year, b.month, 1)
    if b.month == 12:
        end_date = date(b.year + 1, 1, 1)
    else:
        end_date = date(b.year, b.month + 1, 1)

    spending_row = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
        Transaction.date >= start_date,
        Transaction.date < end_date,
        Transaction.transaction_type == "expense",
        Transaction.category == b.category
    ).scalar()

    actual = round(float(spending_row), 2)
    planned = float(b.planned_amount)
    util = calculate_budget_utilization(actual, planned) or 0.0
    remaining = calculate_remaining_budget(planned, actual)
    status = get_budget_status(actual, planned)

    return BudgetResponse(
        id=b.id,
        category=b.category,
        planned_amount=planned,
        month=b.month,
        year=b.year,
        description=b.description,
        is_demo=b.is_demo,
        actual_spending=actual,
        remaining_amount=remaining,
        utilization_percentage=util,
        status=status,
        created_at=b.created_at
    )

@router.get("", response_model=List[BudgetResponse])
def get_budgets(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2050),
    db: Session = Depends(get_db)
):
    query = db.query(Budget)
    if month is not None:
        query = query.filter(Budget.month == month)
    if year is not None:
        query = query.filter(Budget.year == year)

    budgets = query.order_by(Budget.category.asc()).all()
    return [enrich_budget(b, db) for b in budgets]

@router.post("", response_model=BudgetResponse, status_code=201)
def create_budget(data: BudgetCreate, db: Session = Depends(get_db)):
    # Check duplicate
    existing = db.query(Budget).filter(
        Budget.category == data.category,
        Budget.month == data.month,
        Budget.year == data.year
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Budget for '{data.category}' in {data.month}/{data.year} already exists. Update it instead."
        )

    b = Budget(
        category=data.category,
        planned_amount=data.planned_amount,
        month=data.month,
        year=data.year,
        description=data.description,
        is_demo=False
    )
    db.add(b)
    db.commit()
    db.refresh(b)
    return enrich_budget(b, db)

@router.put("/{id}", response_model=BudgetResponse)
def update_budget(id: int, data: BudgetUpdate, db: Session = Depends(get_db)):
    b = db.query(Budget).filter(Budget.id == id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Budget not found")

    if data.planned_amount is not None:
        b.planned_amount = data.planned_amount
    if data.description is not None:
        b.description = data.description

    db.commit()
    db.refresh(b)
    return enrich_budget(b, db)

@router.delete("/{id}", status_code=200)
def delete_budget(id: int, db: Session = Depends(get_db)):
    b = db.query(Budget).filter(Budget.id == id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Budget not found")

    db.delete(b)
    db.commit()
    return {"message": "Budget deleted successfully", "id": id}
