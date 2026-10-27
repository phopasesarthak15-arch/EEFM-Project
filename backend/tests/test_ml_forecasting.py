import pytest
from datetime import date, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.all_models import Transaction
from app.ml.forecasting import train_and_forecast_expenses, MINIMUM_REQUIRED_DAYS

ml_test_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
MlSession = sessionmaker(autocommit=False, autoflush=False, bind=ml_test_engine)

@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=ml_test_engine)
    session = MlSession()
    yield session
    session.close()
    Base.metadata.drop_all(bind=ml_test_engine)

def test_forecasting_with_insufficient_data(db_session):
    # Only 3 days of expenses
    today = date(2026, 10, 25)
    for i in range(3):
        db_session.add(Transaction(
            date=today - timedelta(days=i),
            description=f"Day {i} snack",
            amount=120.0,
            transaction_type="expense",
            category="Food and Mess"
        ))
    db_session.commit()

    res = train_and_forecast_expenses(db_session)
    assert res.has_sufficient_data is False
    assert f"requires at least {MINIMUM_REQUIRED_DAYS} days" in res.message
    assert len(res.daily_forecast_7d) == 0
    assert len(res.daily_forecast_30d) == 0

def test_forecasting_with_sufficient_data(db_session):
    # Generate 45 continuous days of expense transactions
    today = date(2026, 10, 25)
    for i in range(45):
        d = today - timedelta(days=45 - i)
        # Weekday vs weekend spending variation
        amt = 350.0 if d.weekday() in [5, 6] else 180.0
        db_session.add(Transaction(
            date=d,
            description="Daily Expense Record",
            amount=amt,
            transaction_type="expense",
            category="Food and Mess" if d.weekday() % 2 == 0 else "Transportation"
        ))
    db_session.commit()

    res = train_and_forecast_expenses(db_session)
    assert res.has_sufficient_data is True
    assert len(res.daily_forecast_7d) == 7
    assert len(res.daily_forecast_30d) == 30
    assert res.evaluation.train_size > 0
    assert res.evaluation.test_size > 0
    assert res.evaluation.model_mae >= 0.0
    assert res.evaluation.model_rmse >= 0.0
    assert len(res.evaluation.features_used) > 0
    assert "lag_1" in res.evaluation.features_used
    assert "roll_mean_7" in res.evaluation.features_used

    # All forecasts must be positive or zero
    for pt in res.daily_forecast_7d:
        assert pt.forecast_amount >= 0.0
        assert pt.is_forecast is True
        assert pt.lower_bound is not None
        assert pt.upper_bound is not None
        assert pt.upper_bound >= pt.lower_bound
