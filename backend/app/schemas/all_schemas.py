from datetime import date, datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator

# Profile
class ProfileBase(BaseModel):
    student_name: str = Field(..., min_length=1, max_length=100)
    monthly_allowance: float = Field(..., ge=0)
    part_time_income: float = Field(0.0, ge=0)
    scholarship_income: float = Field(0.0, ge=0)
    monthly_savings_target: float = Field(0.0, ge=0)
    living_arrangement: str = Field("hostel")
    fixed_monthly_expenses: float = Field(0.0, ge=0)
    currency: str = Field("INR")

class ProfileUpdate(BaseModel):
    student_name: Optional[str] = None
    monthly_allowance: Optional[float] = Field(None, ge=0)
    part_time_income: Optional[float] = Field(None, ge=0)
    scholarship_income: Optional[float] = Field(None, ge=0)
    monthly_savings_target: Optional[float] = Field(None, ge=0)
    living_arrangement: Optional[str] = None
    fixed_monthly_expenses: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = None
    is_onboarded: Optional[bool] = None

class ProfileResponse(ProfileBase):
    id: int
    is_onboarded: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Transactions
EXPENSE_CATEGORIES = [
    "Food and Mess",
    "Groceries",
    "Transportation",
    "Education and Books",
    "Accommodation and Rent",
    "Mobile and Internet",
    "Shopping",
    "Entertainment",
    "Health and Personal Care",
    "Subscriptions",
    "Social Activities",
    "Miscellaneous"
]

INCOME_CATEGORIES = [
    "Pocket Money",
    "Part-Time Work",
    "Scholarship",
    "Family Support",
    "Freelancing",
    "Other Income"
]

class TransactionBase(BaseModel):
    date: date
    description: str = Field(..., min_length=1, max_length=200)
    amount: float = Field(..., gt=0, description="Amount must be strictly greater than 0")
    transaction_type: str = Field(..., description="'income' or 'expense'")
    category: str = Field(..., min_length=1)
    payment_method: str = Field("UPI")
    notes: Optional[str] = None
    is_recurring: bool = False

    @field_validator("transaction_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        low = v.strip().lower()
        if low not in ["income", "expense"]:
            raise ValueError("transaction_type must be either 'income' or 'expense'")
        return low

    @field_validator("amount")
    @classmethod
    def validate_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Amount must be greater than zero")
        return round(float(v), 2)

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    date: Optional[date] = None
    description: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    transaction_type: Optional[str] = None
    category: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    is_recurring: Optional[bool] = None

    @field_validator("transaction_type")
    @classmethod
    def validate_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            low = v.strip().lower()
            if low not in ["income", "expense"]:
                raise ValueError("transaction_type must be either 'income' or 'expense'")
            return low
        return v

class TransactionResponse(TransactionBase):
    id: int
    is_demo: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Budgets
class BudgetBase(BaseModel):
    category: str = Field(..., min_length=1)
    planned_amount: float = Field(..., gt=0)
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2020, le=2050)
    description: Optional[str] = None

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    planned_amount: Optional[float] = Field(None, gt=0)
    description: Optional[str] = None

class BudgetResponse(BudgetBase):
    id: int
    is_demo: bool
    actual_spending: float = 0.0
    remaining_amount: float = 0.0
    utilization_percentage: float = 0.0
    status: str = "on_track" # on_track, approaching, near_limit, overspent
    created_at: datetime

    class Config:
        from_attributes = True

# Savings Goal
class SavingsContributionBase(BaseModel):
    date: date
    amount: float
    note: Optional[str] = None

class SavingsContributionCreate(SavingsContributionBase):
    pass

class SavingsContributionResponse(SavingsContributionBase):
    id: int
    goal_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class SavingsGoalBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    target_amount: float = Field(..., gt=0)
    current_saved: float = Field(0.0, ge=0)
    target_date: date
    description: Optional[str] = None

class SavingsGoalCreate(SavingsGoalBase):
    pass

class SavingsGoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = Field(None, gt=0)
    current_saved: Optional[float] = Field(None, ge=0)
    target_date: Optional[date] = None
    description: Optional[str] = None

class SavingsGoalResponse(SavingsGoalBase):
    id: int
    is_demo: bool
    progress_percentage: float = 0.0
    remaining_amount: float = 0.0
    required_monthly_savings: float = 0.0
    months_remaining: float = 0.0
    is_at_risk: bool = False
    contributions: List[SavingsContributionResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True

# Analytics & Summary
class FinancialSummaryResponse(BaseModel):
    month: int
    year: int
    total_income: float
    total_expenses: float
    net_savings: float
    savings_rate: Optional[float] # None if income is 0
    total_planned_budget: float
    total_actual_spending_in_budget: float
    overall_budget_utilization: Optional[float]
    remaining_budget: float
    prev_month_income: Optional[float] = None
    prev_month_expenses: Optional[float] = None
    prev_month_net_savings: Optional[float] = None
    mom_expense_change_pct: Optional[float] = None
    avg_daily_spending: float
    financial_health_score: int # 0 to 100
    financial_health_status: str # Excellent, Good, Fair, Needs Attention
    health_factors: List[str]

# Optimizer
class OptimizerRecommendation(BaseModel):
    id: str
    rule_key: str
    title: str
    category: str
    pattern_explanation: str
    supporting_figures: Dict[str, Any]
    suggested_action: str
    estimated_potential_monthly_savings: Optional[float] = None
    priority: str # "High", "Medium", "Low"
    confidence_level: str # "High", "Medium", "Moderate"
    status: str = "active" # "active", "reviewed", "dismissed"
    proposed_budget_change: Optional[Dict[str, Any]] = None

# Forecast
class ForecastDataPoint(BaseModel):
    date: str
    forecast_amount: float
    is_forecast: bool = True
    actual_amount: Optional[float] = None
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None

class ForecastEvaluation(BaseModel):
    model_config = {"protected_namespaces": ()}
    sample_size: int
    train_size: int
    test_size: int
    evaluation_period: str
    model_name: str
    baseline_mae: float
    model_mae: float
    baseline_rmse: float
    model_rmse: float
    improvement_pct: Optional[float] = None
    features_used: List[str]
    has_sufficient_data: bool
    minimum_required_days: int

class ForecastResponse(BaseModel):
    has_sufficient_data: bool
    message: str
    daily_forecast_7d: List[ForecastDataPoint]
    daily_forecast_30d: List[ForecastDataPoint]
    historical_and_forecast_trend: List[ForecastDataPoint]
    category_forecasts: Dict[str, float]
    evaluation: ForecastEvaluation
