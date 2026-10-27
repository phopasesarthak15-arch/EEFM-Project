from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.models.all_models import Profile
from app.routers import (
    profile,
    transactions,
    budgets,
    savings,
    analytics,
    optimizer,
    forecast,
    demo
)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Student Expense Optimizer API",
    description="Finance and Financial Management Academic System with Machine Learning Forecasting and Rule-Based Optimization",
    version="1.0.0"
)

# Enable CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Ensure a default profile exists on startup
    db = SessionLocal()
    try:
        prof = db.query(Profile).first()
        if not prof:
            prof = Profile(
                student_name="Aarav Sharma",
                monthly_allowance=15000.0,
                part_time_income=3000.0,
                scholarship_income=0.0,
                monthly_savings_target=2500.0,
                living_arrangement="hostel",
                fixed_monthly_expenses=3800.0,
                is_onboarded=False,
                currency="INR"
            )
            db.add(prof)
            db.commit()
    finally:
        db.close()

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "Student Expense Optimizer API",
        "version": "1.0.0",
        "currency": "INR (₹)"
    }

# Register all API routers
app.include_router(profile.router)
app.include_router(transactions.router)
app.include_router(budgets.router)
app.include_router(savings.router)
app.include_router(analytics.router)
app.include_router(optimizer.router)
app.include_router(forecast.router)
app.include_router(demo.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
