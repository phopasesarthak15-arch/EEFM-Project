import pytest
from datetime import date, timedelta
from app.services.financial_calc import (
    calculate_net_savings,
    calculate_savings_rate,
    calculate_budget_utilization,
    calculate_remaining_budget,
    get_budget_status,
    calculate_category_share,
    calculate_budget_variance,
    calculate_mom_change,
    calculate_savings_goal_metrics,
    calculate_financial_health_score
)

def test_net_savings():
    assert calculate_net_savings(15000.0, 11200.0) == 3800.0
    assert calculate_net_savings(5000.0, 7500.0) == -2500.0
    assert calculate_net_savings(0.0, 0.0) == 0.0

def test_savings_rate():
    assert calculate_savings_rate(10000.0, 8000.0) == 20.0
    assert calculate_savings_rate(15000.0, 11250.0) == 25.0
    # Zero income case must safely return None
    assert calculate_savings_rate(0.0, 500.0) is None
    # Negative income case must safely return None
    assert calculate_savings_rate(-100.0, 500.0) is None

def test_budget_utilization():
    assert calculate_budget_utilization(1500.0, 2000.0) == 75.0
    assert calculate_budget_utilization(2500.0, 2000.0) == 125.0
    # Zero planned budget must safely return None
    assert calculate_budget_utilization(500.0, 0.0) is None

def test_remaining_budget():
    assert calculate_remaining_budget(5000.0, 3200.0) == 1800.0
    assert calculate_remaining_budget(2000.0, 2800.0) == -800.0

def test_budget_status_thresholds():
    # Below 75% -> on_track
    assert get_budget_status(700.0, 1000.0) == "on_track"
    # 75% to below 90% -> approaching
    assert get_budget_status(750.0, 1000.0) == "approaching"
    assert get_budget_status(890.0, 1000.0) == "approaching"
    # 90% to 100% -> near_limit
    assert get_budget_status(950.0, 1000.0) == "near_limit"
    assert get_budget_status(1000.0, 1000.0) == "near_limit"
    # Above 100% -> overspent
    assert get_budget_status(1050.0, 1000.0) == "overspent"

def test_category_share():
    assert calculate_category_share(2500.0, 10000.0) == 25.0
    # Zero total expenses safely returns 0.0
    assert calculate_category_share(0.0, 0.0) == 0.0
    assert calculate_category_share(500.0, 0.0) == 0.0

def test_budget_variance():
    assert calculate_budget_variance(2400.0, 2000.0) == 400.0
    assert calculate_budget_variance(1800.0, 2000.0) == -200.0

def test_mom_change():
    assert calculate_mom_change(6000.0, 5000.0) == 20.0
    assert calculate_mom_change(4000.0, 5000.0) == -20.0
    # Zero previous spending safely returns None
    assert calculate_mom_change(3000.0, 0.0) is None

def test_savings_goal_metrics():
    today = date(2026, 10, 25)
    target_date = today + timedelta(days=91) # ~3 months

    metrics = calculate_savings_goal_metrics(
        target_amount=15000.0,
        current_saved=9000.0,
        target_date=target_date,
        as_of_date=today
    )
    assert metrics["progress_percentage"] == 60.0
    assert metrics["remaining_amount"] == 6000.0
    assert metrics["required_monthly_savings"] > 0
    assert metrics["is_at_risk"] is False

    # Goal completed
    done_metrics = calculate_savings_goal_metrics(
        target_amount=10000.0,
        current_saved=12000.0,
        target_date=target_date,
        as_of_date=today
    )
    assert done_metrics["progress_percentage"] == 100.0
    assert done_metrics["remaining_amount"] == 0.0
    assert done_metrics["required_monthly_savings"] == 0.0

    # Overdue goal with remaining deficit
    overdue_target = today - timedelta(days=10)
    overdue_metrics = calculate_savings_goal_metrics(
        target_amount=5000.0,
        current_saved=2000.0,
        target_date=overdue_target,
        as_of_date=today
    )
    assert overdue_metrics["is_at_risk"] is True
    assert overdue_metrics["remaining_amount"] == 3000.0

def test_financial_health_score():
    score, status, factors = calculate_financial_health_score(
        total_income=20000.0,
        total_expenses=14000.0,
        budget_utilization=78.0,
        savings_rate=30.0,
        has_savings_goal=True,
        goals_on_track=True
    )
    assert score >= 80
    assert status == "Excellent"
    assert len(factors) > 0

    # Overspent scenario
    bad_score, bad_status, bad_factors = calculate_financial_health_score(
        total_income=10000.0,
        total_expenses=15000.0,
        budget_utilization=130.0,
        savings_rate=-50.0,
        has_savings_goal=False,
        goals_on_track=False
    )
    assert bad_score <= 50
    assert bad_status in ["Fair", "Needs Attention"]
