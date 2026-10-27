import calendar
from datetime import date, datetime
from typing import List, Dict, Any, Optional, Tuple
from app.models.all_models import Transaction, Budget, SavingsGoal, Profile

def calculate_net_savings(total_income: float, total_expenses: float) -> float:
    return round(float(total_income) - float(total_expenses), 2)

def calculate_savings_rate(total_income: float, total_expenses: float) -> Optional[float]:
    if total_income <= 0:
        return None
    net = float(total_income) - float(total_expenses)
    rate = (net / float(total_income)) * 100.0
    return round(rate, 2)

def calculate_budget_utilization(actual_spending: float, planned_budget: float) -> Optional[float]:
    if planned_budget <= 0:
        return None
    return round((float(actual_spending) / float(planned_budget)) * 100.0, 2)

def calculate_remaining_budget(planned_budget: float, actual_spending: float) -> float:
    return round(float(planned_budget) - float(actual_spending), 2)

def get_budget_status(actual_spending: float, planned_budget: float) -> str:
    if planned_budget <= 0:
        return "overspent" if actual_spending > 0 else "on_track"
    pct = (actual_spending / planned_budget) * 100.0
    if pct < 75.0:
        return "on_track"
    elif pct < 90.0:
        return "approaching"
    elif pct <= 100.0:
        return "near_limit"
    else:
        return "overspent"

def calculate_category_share(category_expense: float, total_expense: float) -> float:
    if total_expense <= 0:
        return 0.0
    return round((float(category_expense) / float(total_expense)) * 100.0, 2)

def calculate_budget_variance(actual_spending: float, planned_budget: float) -> float:
    return round(float(actual_spending) - float(planned_budget), 2)

def calculate_mom_change(current_spending: float, prev_spending: float) -> Optional[float]:
    if prev_spending <= 0:
        return None
    change = ((float(current_spending) - float(prev_spending)) / float(prev_spending)) * 100.0
    return round(change, 2)

def calculate_days_in_month(year: int, month: int) -> int:
    return calendar.monthrange(year, month)[1]

def calculate_savings_goal_metrics(
    target_amount: float,
    current_saved: float,
    target_date: date,
    as_of_date: Optional[date] = None
) -> Dict[str, Any]:
    if as_of_date is None:
        as_of_date = date.today()

    target_amt = float(target_amount)
    curr_saved = float(current_saved)

    progress_pct = 0.0
    if target_amt > 0:
        progress_pct = round(min(100.0, max(0.0, (curr_saved / target_amt) * 100.0)), 2)

    remaining_amount = round(max(0.0, target_amt - curr_saved), 2)

    # Calculate remaining months safely
    days_left = (target_date - as_of_date).days
    months_left = max(0.0, round(days_left / 30.4375, 1))

    if remaining_amount <= 0:
        required_monthly = 0.0
        is_at_risk = False
    elif months_left <= 0:
        required_monthly = remaining_amount
        is_at_risk = True # Expired target date but still money left
    else:
        required_monthly = round(remaining_amount / months_left, 2)
        is_at_risk = False

    return {
        "progress_percentage": progress_pct,
        "remaining_amount": remaining_amount,
        "required_monthly_savings": required_monthly,
        "months_remaining": months_left,
        "is_at_risk": is_at_risk
    }

def calculate_financial_health_score(
    total_income: float,
    total_expenses: float,
    budget_utilization: Optional[float],
    savings_rate: Optional[float],
    has_savings_goal: bool = False,
    goals_on_track: bool = True
) -> Tuple[int, str, List[str]]:
    factors = []
    score = 50 # Baseline starting score

    # 1. Savings Rate factor (up to +/- 25 points)
    if savings_rate is not None:
        if savings_rate >= 20.0:
            score += 25
            factors.append(f"Strong savings rate of {savings_rate:.1f}% exceeds standard student benchmark (20%+).")
        elif savings_rate >= 10.0:
            score += 15
            factors.append(f"Moderate savings rate of {savings_rate:.1f}% indicates positive surplus.")
        elif savings_rate >= 0.0:
            score += 5
            factors.append(f"Low savings rate ({savings_rate:.1f}%). Very little cushion for unexpected expenses.")
        else:
            score -= 25
            factors.append(f"Negative savings rate ({savings_rate:.1f}%): monthly expenses exceed total income.")
    else:
        if total_income == 0 and total_expenses > 0:
            score -= 25
            factors.append("No recorded income for this period while incurring expenses.")
        else:
            factors.append("Insufficient income data to compute savings rate.")

    # 2. Budget adherence (up to +/- 20 points)
    if budget_utilization is not None:
        if budget_utilization <= 85.0:
            score += 20
            factors.append(f"Excellent budget adherence at {budget_utilization:.1f}% of allocated funds.")
        elif budget_utilization <= 100.0:
            score += 10
            factors.append(f"Spending within planned budget limit ({budget_utilization:.1f}%).")
        else:
            over_pct = round(budget_utilization - 100.0, 1)
            score -= 20
            factors.append(f"Budget exceeded by {over_pct}% across tracked categories.")
    else:
        factors.append("No active category budgets configured for this month.")

    # 3. Savings goals adherence (up to +/- 10 points)
    if has_savings_goal:
        if goals_on_track:
            score += 10
            factors.append("Savings goals are active and on track toward target deadlines.")
        else:
            score -= 5
            factors.append("One or more savings goals have overdue deadlines or high required contributions.")

    # Bound score between 0 and 100
    score = max(5, min(100, score))

    if score >= 80:
        status = "Excellent"
    elif score >= 65:
        status = "Good"
    elif score >= 50:
        status = "Fair"
    else:
        status = "Needs Attention"

    return score, status, factors
