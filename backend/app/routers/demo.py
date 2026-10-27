from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.demo_data import load_demo_dataset, clear_demo_dataset, reset_all_dataset

router = APIRouter(prefix="/api/demo", tags=["Demo Management"])

@router.post("/load")
def load_demo(db: Session = Depends(get_db)):
    tx_count = load_demo_dataset(db)
    return {
        "status": "success",
        "message": f"Successfully loaded student demo dataset with {tx_count} transactions, active budgets, and savings goals.",
        "transactions_generated": tx_count
    }

@router.post("/reset-demo")
def reset_demo(db: Session = Depends(get_db)):
    clear_demo_dataset(db)
    return {
        "status": "success",
        "message": "Demo data successfully removed. User-created records are preserved."
    }

@router.post("/reset-all")
def reset_all(db: Session = Depends(get_db)):
    reset_all_dataset(db)
    return {
        "status": "success",
        "message": "All database records cleared. Application is now completely fresh and empty."
    }
