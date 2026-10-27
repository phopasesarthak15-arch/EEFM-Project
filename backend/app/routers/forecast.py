from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.all_schemas import ForecastResponse, ForecastEvaluation
from app.ml.forecasting import train_and_forecast_expenses

router = APIRouter(prefix="/api/forecast", tags=["Machine Learning Forecast"])

@router.get("", response_model=ForecastResponse)
def get_forecast(db: Session = Depends(get_db)):
    return train_and_forecast_expenses(db)

@router.post("/train", response_model=ForecastResponse)
def trigger_training(db: Session = Depends(get_db)):
    return train_and_forecast_expenses(db)

@router.get("/evaluation", response_model=ForecastEvaluation)
def get_evaluation(db: Session = Depends(get_db)):
    res = train_and_forecast_expenses(db)
    return res.evaluation
