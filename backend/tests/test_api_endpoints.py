import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Use isolated test database
os.environ["DATABASE_URL"] = "sqlite:///./test_expense_optimizer.db"

from app.database import Base, get_db
from app.main import app
from app.models.all_models import Profile, Transaction, Budget, SavingsGoal

# Setup test DB
test_engine = create_engine("sqlite:///./test_expense_optimizer.db", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_expense_optimizer.db"):
        try:
            os.remove("./test_expense_optimizer.db")
        except Exception:
            pass

@pytest.fixture
def client():
    return TestClient(app)

def test_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_profile_read_and_update(client):
    res = client.get("/api/profile")
    assert res.status_code == 200
    data = res.json()
    assert "student_name" in data

    up_res = client.put("/api/profile", json={
        "student_name": "Rohan Verma",
        "monthly_allowance": 18000.0,
        "is_onboarded": True
    })
    assert up_res.status_code == 200
    assert up_res.json()["student_name"] == "Rohan Verma"
    assert up_res.json()["monthly_allowance"] == 18000.0
    assert up_res.json()["is_onboarded"] is True

def test_transaction_crud_and_validations(client):
    # 1. Invalid positive amount validation
    bad_res = client.post("/api/transactions", json={
        "date": "2026-10-15",
        "description": "Invalid Negative Expense",
        "amount": -50.0,
        "transaction_type": "expense",
        "category": "Food and Mess"
    })
    assert bad_res.status_code == 422 # Pydantic validation error

    # 2. Invalid transaction type
    bad_type = client.post("/api/transactions", json={
        "date": "2026-10-15",
        "description": "Invalid Type",
        "amount": 250.0,
        "transaction_type": "investment", # not allowed
        "category": "Food and Mess"
    })
    assert bad_type.status_code == 422

    # 3. Create valid Expense
    exp_res = client.post("/api/transactions", json={
        "date": "2026-10-10",
        "description": "Hostel Mess Advance",
        "amount": 2800.0,
        "transaction_type": "expense",
        "category": "Food and Mess",
        "payment_method": "UPI"
    })
    assert exp_res.status_code == 201
    exp_id = exp_res.json()["id"]
    assert exp_res.json()["amount"] == 2800.0

    # 4. Create valid Income
    inc_res = client.post("/api/transactions", json={
        "date": "2026-10-01",
        "description": "Family Allowance",
        "amount": 15000.0,
        "transaction_type": "income",
        "category": "Pocket Money",
        "payment_method": "Net Banking"
    })
    assert inc_res.status_code == 201

    # 5. Read transactions list
    list_res = client.get("/api/transactions")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 2

    # 6. Read single transaction
    get_res = client.get(f"/api/transactions/{exp_id}")
    assert get_res.status_code == 200
    assert get_res.json()["description"] == "Hostel Mess Advance"

    # 7. Update transaction
    up_res = client.put(f"/api/transactions/{exp_id}", json={
        "amount": 3000.0,
        "notes": "Added late night canteen fee"
    })
    assert up_res.status_code == 200
    assert up_res.json()["amount"] == 3000.0
    assert up_res.json()["notes"] == "Added late night canteen fee"

    # 8. Delete transaction
    del_res = client.delete(f"/api/transactions/{exp_id}")
    assert del_res.status_code == 200

    # Verify deleted
    not_found = client.get(f"/api/transactions/{exp_id}")
    assert not_found.status_code == 404

def test_budget_crud_and_duplicate_prevention(client):
    # 1. Create budget
    b_res = client.post("/api/budgets", json={
        "category": "Food and Mess",
        "planned_amount": 4000.0,
        "month": 10,
        "year": 2026,
        "description": "Food and canteen monthly limit"
    })
    assert b_res.status_code == 201
    b_id = b_res.json()["id"]

    # 2. Duplicate prevention for same category & month/year
    dup_res = client.post("/api/budgets", json={
        "category": "Food and Mess",
        "planned_amount": 4500.0,
        "month": 10,
        "year": 2026
    })
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"]

    # 3. Read budgets with actual spending calculation
    b_list = client.get("/api/budgets?month=10&year=2026")
    assert b_list.status_code == 200
    assert len(b_list.json()) >= 1
    assert "actual_spending" in b_list.json()[0]
    assert "remaining_amount" in b_list.json()[0]
    assert "utilization_percentage" in b_list.json()[0]

    # 4. Update budget
    up_res = client.put(f"/api/budgets/{b_id}", json={
        "planned_amount": 4200.0
    })
    assert up_res.status_code == 200
    assert up_res.json()["planned_amount"] == 4200.0

    # 5. Delete budget
    del_res = client.delete(f"/api/budgets/{b_id}")
    assert del_res.status_code == 200

def test_savings_goals_and_contributions(client):
    # 1. Create goal
    g_res = client.post("/api/savings-goals", json={
        "name": "Course Certification Exam",
        "target_amount": 5000.0,
        "current_saved": 1500.0,
        "target_date": "2026-12-31",
        "description": "Cloud certification exam fee"
    })
    assert g_res.status_code == 201
    g_id = g_res.json()["id"]
    assert g_res.json()["progress_percentage"] == 30.0

    # 2. Record contribution
    c_res = client.post(f"/api/savings-goals/{g_id}/contribute", json={
        "date": "2026-10-20",
        "amount": 1000.0,
        "note": "Savings from tutoring"
    })
    assert c_res.status_code == 200
    assert c_res.json()["current_saved"] == 2500.0
    assert c_res.json()["progress_percentage"] == 50.0

    # 3. Delete goal
    del_res = client.delete(f"/api/savings-goals/{g_id}")
    assert del_res.status_code == 200

def test_demo_data_loading_and_idempotency(client):
    # Load demo data
    res1 = client.post("/api/demo/load")
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["transactions_generated"] > 50

    # Reload demo data again -> must be idempotent, no duplicates
    res2 = client.post("/api/demo/load")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["transactions_generated"] == data1["transactions_generated"]

    # Verify analytics returns populated numbers
    summary = client.get("/api/analytics/summary?month=10&year=2026")
    assert summary.status_code == 200
    assert summary.json()["total_income"] > 0
    assert summary.json()["total_expenses"] > 0
    assert summary.json()["financial_health_score"] > 0

    # Verify optimizer produces actionable recommendations
    recs = client.get("/api/optimizer/recommendations?month=10&year=2026")
    assert recs.status_code == 200
    assert isinstance(recs.json(), list)

    # Clean demo data
    reset_res = client.post("/api/demo/reset-demo")
    assert reset_res.status_code == 200
