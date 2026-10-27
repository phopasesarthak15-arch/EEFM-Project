from datetime import date, timedelta
import calendar
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database import get_db
from app.models.all_models import Transaction, Budget, SavingsGoal, Profile
from app.schemas.all_schemas import FinancialSummaryResponse
from app.services.financial_calc import (
    calculate_net_savings,
    calculate_savings_rate,
    calculate_budget_utilization,
    calculate_remaining_budget,
    calculate_category_share,
    calculate_budget_variance,
    calculate_mom_change,
    calculate_days_in_month,
    calculate_financial_health_score,
    calculate_savings_goal_metrics
)

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/summary", response_model=FinancialSummaryResponse)
def get_financial_summary(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020, le=2050),
    db: Session = Depends(get_db)
):
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)

    # Previous month range
    if month == 1:
        prev_m = 12
        prev_y = year - 1
    else:
        prev_m = month - 1
        prev_y = year
    prev_start_date = date(prev_y, prev_m, 1)
    prev_end_date = start_date

    # Current month sums
    curr_income = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
        Transaction.date >= start_date,
        Transaction.date < end_date,
        Transaction.transaction_type == "income"
    ).scalar()
    curr_income = round(float(curr_income), 2)

    curr_expense = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
        Transaction.date >= start_date,
        Transaction.date < end_date,
        Transaction.transaction_type == "expense"
    ).scalar()
    curr_expense = round(float(curr_expense), 2)

    # Previous month sums
    prev_income = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
        Transaction.date >= prev_start_date,
        Transaction.date < prev_end_date,
        Transaction.transaction_type == "income"
    ).scalar()
    prev_income = round(float(prev_income), 2)

    prev_expense = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
        Transaction.date >= prev_start_date,
        Transaction.date < prev_end_date,
        Transaction.transaction_type == "expense"
    ).scalar()
    prev_expense = round(float(prev_expense), 2)

    # Planned budgets for current month
    budgets = db.query(Budget).filter(Budget.month == month, Budget.year == year).all()
    total_planned = round(sum(b.planned_amount for b in budgets), 2)

    # Spending in budgeted categories only
    budgeted_cats = [b.category for b in budgets]
    if budgeted_cats:
        budget_spending_row = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
            Transaction.date >= start_date,
            Transaction.date < end_date,
            Transaction.transaction_type == "expense",
            Transaction.category.in_(budgeted_cats)
        ).scalar()
        actual_in_budget = round(float(budget_spending_row), 2)
    else:
        actual_in_budget = 0.0

    net_savings = calculate_net_savings(curr_income, curr_expense)
    savings_rate = calculate_savings_rate(curr_income, curr_expense)
    budget_util = calculate_budget_utilization(actual_in_budget, total_planned)
    remaining_b = calculate_remaining_budget(total_planned, actual_in_budget)

    prev_net = calculate_net_savings(prev_income, prev_expense) if (prev_income > 0 or prev_expense > 0) else None
    mom_change = calculate_mom_change(curr_expense, prev_expense)

    days_in_m = calculate_days_in_month(year, month)
    avg_daily = round(curr_expense / days_in_m, 2)

    # Savings goals check for health score
    goals = db.query(SavingsGoal).all()
    has_goals = len(goals) > 0
    goals_ok = True
    for g in goals:
        gm = calculate_savings_goal_metrics(g.target_amount, g.current_saved, g.target_date)
        if gm["is_at_risk"]:
            goals_ok = False
            break

    score, status, factors = calculate_financial_health_score(
        total_income=curr_income,
        total_expenses=curr_expense,
        budget_utilization=budget_util,
        savings_rate=savings_rate,
        has_savings_goal=has_goals,
        goals_on_track=goals_ok
    )

    return FinancialSummaryResponse(
        month=month,
        year=year,
        total_income=curr_income,
        total_expenses=curr_expense,
        net_savings=net_savings,
        savings_rate=savings_rate,
        total_planned_budget=total_planned,
        total_actual_spending_in_budget=actual_in_budget,
        overall_budget_utilization=budget_util,
        remaining_budget=remaining_b,
        prev_month_income=prev_income if prev_income > 0 else None,
        prev_month_expenses=prev_expense if prev_expense > 0 else None,
        prev_month_net_savings=prev_net,
        mom_expense_change_pct=mom_change,
        avg_daily_spending=avg_daily,
        financial_health_score=score,
        financial_health_status=status,
        health_factors=factors
    )

@router.get("/categories")
def get_category_analytics(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020, le=2050),
    db: Session = Depends(get_db)
):
    start_date = date(year, month, 1)
    end_date = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)

    # Expenses grouped by category
    cat_rows = db.query(
        Transaction.category,
        func.sum(Transaction.amount).label("total_amount"),
        func.count(Transaction.id).label("count")
    ).filter(
        Transaction.date >= start_date,
        Transaction.date < end_date,
        Transaction.transaction_type == "expense"
    ).group_by(Transaction.category).all()

    total_expense = sum(float(r.total_amount) for r in cat_rows)

    # Budgets map
    budgets = db.query(Budget).filter(Budget.month == month, Budget.year == year).all()
    b_map = {b.category: b.planned_amount for b in budgets}

    results = []
    for r in cat_rows:
        cat_name = r.category
        amt = round(float(r.total_amount), 2)
        cnt = int(r.count)
        share = calculate_category_share(amt, total_expense)
        planned = b_map.get(cat_name, 0.0)
        variance = calculate_budget_variance(amt, planned) if planned > 0 else 0.0

        results.append({
            "category": cat_name,
            "actual_amount": amt,
            "transaction_count": cnt,
            "share_percentage": share,
            "planned_budget": planned,
            "budget_variance": variance,
            "is_overspent": (amt > planned) if planned > 0 else False
        })

    # Sort descending by actual amount
    results.sort(key=lambda x: x["actual_amount"], reverse=True)
    return {
        "month": month,
        "year": year,
        "total_expense": round(total_expense, 2),
        "categories": results
    }

@router.get("/trends")
def get_spending_trends(
    months_count: int = Query(6, ge=1, le=12),
    db: Session = Depends(get_db)
):
    # Retrieve monthly aggregates for the last N months
    today = date.today()
    trends = []

    for i in range(months_count - 1, -1, -1):
        # Calculate year and month
        y = today.year
        m = today.month - i
        while m <= 0:
            m += 12
            y -= 1

        s_date = date(y, m, 1)
        e_date = date(y + 1, 1, 1) if m == 12 else date(y, m + 1, 1)

        inc = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
            Transaction.date >= s_date,
            Transaction.date < e_date,
            Transaction.transaction_type == "income"
        ).scalar()

        exp = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
            Transaction.date >= s_date,
            Transaction.date < e_date,
            Transaction.transaction_type == "expense"
        ).scalar()

        inc = round(float(inc), 2)
        exp = round(float(exp), 2)
        net = round(inc - exp, 2)
        s_rate = calculate_savings_rate(inc, exp)

        month_label = f"{calendar.month_abbr[m]} {y}"
        trends.append({
            "month": m,
            "year": y,
            "month_label": month_label,
            "income": inc,
            "expenses": exp,
            "net_savings": net,
            "savings_rate": s_rate
        })

    return trends

@router.get("/daily-spending")
def get_daily_spending(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020, le=2050),
    db: Session = Depends(get_db)
):
    start_date = date(year, month, 1)
    end_date = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)

    daily_rows = db.query(
        Transaction.date,
        func.sum(Transaction.amount).label("daily_amount")
    ).filter(
        Transaction.date >= start_date,
        Transaction.date < end_date,
        Transaction.transaction_type == "expense"
    ).group_by(Transaction.date).order_by(Transaction.date.asc()).all()

    daily_map = {r.date: float(r.daily_amount) for r in daily_rows}
    days_count = calculate_days_in_month(year, month)

    timeline = []
    running_total = 0.0
    for day in range(1, days_count + 1):
        d = date(year, month, day)
        amt = round(daily_map.get(d, 0.0), 2)
        running_total = round(running_total + amt, 2)
        timeline.append({
            "date": d.strftime("%Y-%m-%d"),
            "day": day,
            "daily_amount": amt,
            "cumulative_amount": running_total
        })

    return timeline

@router.get("/breakdown-types")
def get_expense_type_breakdowns(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020, le=2050),
    db: Session = Depends(get_db)
):
    start_date = date(year, month, 1)
    end_date = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)

    txs = db.query(Transaction).filter(
        Transaction.date >= start_date,
        Transaction.date < end_date,
        Transaction.transaction_type == "expense"
    ).all()

    # Essential vs Discretionary
    # Essential: Food and Mess, Groceries, Accommodation and Rent, Education and Books, Mobile and Internet, Health and Personal Care
    essential_cats = {
        "Food and Mess", "Groceries", "Accommodation and Rent",
        "Education and Books", "Mobile and Internet", "Health and Personal Care"
    }

    essential_total = 0.0
    discretionary_total = 0.0

    fixed_total = 0.0
    variable_total = 0.0

    for tx in txs:
        amt = float(tx.amount)
        if tx.category in essential_cats:
            essential_total += amt
        else:
            discretionary_total += amt

        if tx.is_recurring:
            fixed_total += amt
        else:
            variable_total += amt

    total = essential_total + discretionary_total

    return {
        "total_expenses": round(total, 2),
        "essential_amount": round(essential_total, 2),
        "discretionary_amount": round(discretionary_total, 2),
        "essential_percentage": round((essential_total / total * 100), 1) if total > 0 else 0,
        "discretionary_percentage": round((discretionary_total / total * 100), 1) if total > 0 else 0,
        "fixed_amount": round(fixed_total, 2),
        "variable_amount": round(variable_total, 2),
        "fixed_percentage": round((fixed_total / total * 100), 1) if total > 0 else 0,
        "variable_percentage": round((variable_total / total * 100), 1) if total > 0 else 0
    }
