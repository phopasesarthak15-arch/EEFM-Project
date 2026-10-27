from datetime import date, datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.all_models import Transaction, Budget, SavingsGoal, OptimizationStatus, Profile
from app.schemas.all_schemas import OptimizerRecommendation
from app.services.financial_calc import calculate_savings_goal_metrics

def generate_optimization_recommendations(
    db: Session,
    month: int,
    year: int
) -> List[OptimizerRecommendation]:
    recommendations: List[OptimizerRecommendation] = []

    # Get dismissed/reviewed statuses
    status_records = db.query(OptimizationStatus).all()
    status_map = {s.rule_key: s.status for s in status_records}

    # Current month date bounds
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)

    # Previous month date bounds
    if month == 1:
        prev_month = 12
        prev_year = year - 1
    else:
        prev_month = month - 1
        prev_year = year
    prev_start_date = date(prev_year, prev_month, 1)
    prev_end_date = start_date

    # 1. Fetch current month expense transactions
    curr_expenses = db.query(Transaction).filter(
        Transaction.date >= start_date,
        Transaction.date < end_date,
        Transaction.transaction_type == "expense"
    ).all()

    # Previous month expense transactions
    prev_expenses = db.query(Transaction).filter(
        Transaction.date >= prev_start_date,
        Transaction.date < prev_end_date,
        Transaction.transaction_type == "expense"
    ).all()

    # Active budgets for current month
    budgets = db.query(Budget).filter(
        Budget.month == month,
        Budget.year == year
    ).all()
    budget_map = {b.category: b.planned_amount for b in budgets}

    # Sum current month spending by category
    curr_cat_spending: Dict[str, float] = {}
    curr_cat_counts: Dict[str, int] = {}
    for tx in curr_expenses:
        curr_cat_spending[tx.category] = round(curr_cat_spending.get(tx.category, 0.0) + tx.amount, 2)
        curr_cat_counts[tx.category] = curr_cat_counts.get(tx.category, 0) + 1

    # Sum previous month spending by category
    prev_cat_spending: Dict[str, float] = {}
    for tx in prev_expenses:
        prev_cat_spending[tx.category] = round(prev_cat_spending.get(tx.category, 0.0) + tx.amount, 2)

    total_expense = sum(curr_cat_spending.values())

    # --- RULE 1: Budget Overrun ---
    for cat, planned in budget_map.items():
        actual = curr_cat_spending.get(cat, 0.0)
        rule_key = f"budget_overrun_{cat}_{year}_{month}"
        current_status = status_map.get(rule_key, "active")

        if actual > planned:
            overrun = round(actual - planned, 2)
            pct_over = round(((actual - planned) / planned) * 100.0, 1) if planned > 0 else 100.0
            recommendations.append(OptimizerRecommendation(
                id=f"rec_overrun_{cat}",
                rule_key=rule_key,
                title=f"Budget Overrun in {cat}",
                category=cat,
                pattern_explanation=f"Spending in {cat} is ₹{actual:,.2f}, exceeding your monthly planned budget of ₹{planned:,.2f} by ₹{overrun:,.2f} (+{pct_over}%).",
                supporting_figures={
                    "planned_budget": planned,
                    "actual_spending": actual,
                    "overrun_amount": overrun,
                    "transaction_count": curr_cat_counts.get(cat, 0)
                },
                suggested_action=f"Trim discretionary purchases in {cat} for the remainder of the month, or adjust your budget baseline to reflect actual necessities.",
                estimated_potential_monthly_savings=overrun,
                priority="High",
                confidence_level="High",
                status=current_status,
                proposed_budget_change={
                    "category": cat,
                    "current_budget": planned,
                    "proposed_budget": round(actual * 1.05, 0),
                    "action": "realign_budget"
                }
            ))

    # --- RULE 2: Significant Month-over-Month Spike in Discretionary Spending ---
    discretionary_categories = ["Food and Mess", "Shopping", "Entertainment", "Social Activities", "Miscellaneous"]
    for cat in discretionary_categories:
        curr_amt = curr_cat_spending.get(cat, 0.0)
        prev_amt = prev_cat_spending.get(cat, 0.0)
        rule_key = f"mom_spike_{cat}_{year}_{month}"
        current_status = status_map.get(rule_key, "active")

        if prev_amt > 500 and curr_amt > prev_amt * 1.25: # >25% spike
            diff = round(curr_amt - prev_amt, 2)
            pct = round(((curr_amt - prev_amt) / prev_amt) * 100.0, 1)
            estimated_savings = round(diff * 0.5, 2) # Potential 50% curtailment
            recommendations.append(OptimizerRecommendation(
                id=f"rec_spike_{cat}",
                rule_key=rule_key,
                title=f"Spending Surge in {cat}",
                category=cat,
                pattern_explanation=f"Expenditure in {cat} jumped by ₹{diff:,.2f} (+{pct}%) compared to previous month (₹{prev_amt:,.2f} vs ₹{curr_amt:,.2f}).",
                supporting_figures={
                    "previous_month_spending": prev_amt,
                    "current_month_spending": curr_amt,
                    "absolute_increase": diff,
                    "percentage_increase": pct
                },
                suggested_action=f"Investigate high-value or frequent casual transactions in {cat}. Bringing spending back to last month's level could yield immediate savings.",
                estimated_potential_monthly_savings=estimated_savings,
                priority="Medium",
                confidence_level="High",
                status=current_status
            ))

    # --- RULE 3: Recurring Subscriptions Audit ---
    subs_transactions = [tx for tx in curr_expenses if tx.category == "Subscriptions" or tx.is_recurring]
    if subs_transactions:
        total_subs = sum(tx.amount for tx in subs_transactions)
        rule_key = f"subscriptions_audit_{year}_{month}"
        current_status = status_map.get(rule_key, "active")

        if total_subs >= 499.0:
            rec_savings = round(total_subs * 0.35, 2) # e.g. cancelling 1 or 2 unused services
            recommendations.append(OptimizerRecommendation(
                id="rec_subscriptions",
                rule_key=rule_key,
                title="Recurring Subscriptions Review",
                category="Subscriptions",
                pattern_explanation=f"You currently have {len(subs_transactions)} recurring or subscription charges totaling ₹{total_subs:,.2f} this month.",
                supporting_figures={
                    "total_subscription_cost": total_subs,
                    "active_subscriptions_count": len(subs_transactions),
                    "services": [f"{tx.description} (₹{tx.amount:,.2f})" for tx in subs_transactions[:5]]
                },
                suggested_action="Review your active digital memberships (streaming, cloud storage, music). Consider student plan discounts or pausing services you haven't used this week.",
                estimated_potential_monthly_savings=rec_savings,
                priority="Medium",
                confidence_level="Moderate",
                status=current_status
            ))

    # --- RULE 4: Potential Duplicate Transactions Detector ---
    # Find transactions with identical amount, category, and within 48 hours
    sorted_txs = sorted(curr_expenses, key=lambda x: (x.date, x.amount))
    potential_duplicates = []
    seen_ids = set()
    for i in range(len(sorted_txs)):
        for j in range(i + 1, len(sorted_txs)):
            t1, t2 = sorted_txs[i], sorted_txs[j]
            if t1.id in seen_ids or t2.id in seen_ids:
                continue
            if t1.amount == t2.amount and t1.category == t2.category and abs((t2.date - t1.date).days) <= 1:
                potential_duplicates.append((t1, t2))
                seen_ids.add(t1.id)
                seen_ids.add(t2.id)

    if potential_duplicates:
        rule_key = f"duplicate_txs_{year}_{month}"
        current_status = status_map.get(rule_key, "active")
        dup_sum = sum(pair[1].amount for pair in potential_duplicates)
        recommendations.append(OptimizerRecommendation(
            id="rec_duplicates",
            rule_key=rule_key,
            title="Potential Duplicate Charges Detected",
            category="Audit",
            pattern_explanation=f"Detected {len(potential_duplicates)} pair(s) of charges with identical amounts and categories occurring within 24–48 hours.",
            supporting_figures={
                "duplicate_pairs_count": len(potential_duplicates),
                "total_duplicate_amount": dup_sum,
                "samples": [f"₹{p[0].amount:,.2f} on {p[0].date} & {p[1].date} ({p[0].description})" for p in potential_duplicates[:3]]
            },
            suggested_action="Verify your bank/UPI statement to confirm whether these are legitimate repeat purchases or duplicate debit errors.",
            estimated_potential_monthly_savings=dup_sum,
            priority="High",
            confidence_level="Moderate",
            status=current_status
        ))

    # --- RULE 5: Savings Goal Shortfall / Deadlines ---
    goals = db.query(SavingsGoal).all()
    for goal in goals:
        metrics = calculate_savings_goal_metrics(goal.target_amount, goal.current_saved, goal.target_date)
        rule_key = f"savings_goal_shortfall_{goal.id}"
        current_status = status_map.get(rule_key, "active")

        if metrics["is_at_risk"] or (metrics["months_remaining"] > 0 and metrics["required_monthly_savings"] > 3000):
            recommendations.append(OptimizerRecommendation(
                id=f"rec_goal_{goal.id}",
                rule_key=rule_key,
                title=f"Savings Target at Risk: {goal.name}",
                category="Savings Goals",
                pattern_explanation=f"'{goal.name}' requires ₹{metrics['required_monthly_savings']:,.2f}/month across {metrics['months_remaining']} remaining months to reach ₹{goal.target_amount:,.2f}. Currently at {metrics['progress_percentage']}%.",
                supporting_figures={
                    "target_amount": goal.target_amount,
                    "current_saved": goal.current_saved,
                    "remaining_amount": metrics["remaining_amount"],
                    "required_monthly_savings": metrics["required_monthly_savings"],
                    "target_date": str(goal.target_date)
                },
                suggested_action=f"Automate a ₹{metrics['required_monthly_savings']:,.2f} transfer at the start of each month or extend the target date to ease monthly pressure.",
                estimated_potential_monthly_savings=None,
                priority="High" if metrics["is_at_risk"] else "Medium",
                confidence_level="High",
                status=current_status
            ))

    # --- RULE 6: Successful Spending Curtailment (Positive Reinforcement) ---
    for cat in ["Food and Mess", "Shopping", "Entertainment", "Groceries"]:
        curr_amt = curr_cat_spending.get(cat, 0.0)
        prev_amt = prev_cat_spending.get(cat, 0.0)
        rule_key = f"spending_decline_{cat}_{year}_{month}"
        current_status = status_map.get(rule_key, "active")

        if prev_amt >= 1000 and curr_amt > 0 and curr_amt < prev_amt * 0.8: # >20% reduction
            saved_amt = round(prev_amt - curr_amt, 2)
            pct_saved = round((saved_amt / prev_amt) * 100.0, 1)
            recommendations.append(OptimizerRecommendation(
                id=f"rec_decline_{cat}",
                rule_key=rule_key,
                title=f"Great Progress: {cat} Expenses Down {pct_saved}%",
                category=cat,
                pattern_explanation=f"Your spending in {cat} decreased from ₹{prev_amt:,.2f} last month to ₹{curr_amt:,.2f} this month, saving ₹{saved_amt:,.2f}.",
                supporting_figures={
                    "previous_month_spending": prev_amt,
                    "current_month_spending": curr_amt,
                    "savings_achieved": saved_amt,
                    "percentage_drop": pct_saved
                },
                suggested_action=f"Consider channeling the ₹{saved_amt:,.2f} surplus directly into your active savings goal.",
                estimated_potential_monthly_savings=None,
                priority="Low",
                confidence_level="High",
                status=current_status
            ))

    # --- RULE 7: Category with Unusually High Share (>40% of Total Student Spending) ---
    if total_expense > 2000:
        for cat, amt in curr_cat_spending.items():
            rule_key = f"dominant_cat_{cat}_{year}_{month}"
            current_status = status_map.get(rule_key, "active")
            share = (amt / total_expense) * 100.0
            if share >= 40.0 and cat not in ["Accommodation and Rent", "Education and Books"]:
                savings_target = round(amt * 0.15, 2)
                recommendations.append(OptimizerRecommendation(
                    id=f"rec_dominant_{cat}",
                    rule_key=rule_key,
                    title=f"High Expense Concentration in {cat}",
                    category=cat,
                    pattern_explanation=f"{cat} accounts for {share:.1f}% (₹{amt:,.2f}) of your total monthly expenditures, leaving less flexibility for other needs.",
                    supporting_figures={
                        "category_amount": amt,
                        "total_monthly_spending": total_expense,
                        "share_percentage": round(share, 1)
                    },
                    suggested_action=f"Target a 15% reduction in {cat} to rebalance your spending portfolio. This could free up approx ₹{savings_target:,.2f}/month.",
                    estimated_potential_monthly_savings=savings_target,
                    priority="Medium",
                    confidence_level="Moderate",
                    status=current_status
                ))

    return recommendations
