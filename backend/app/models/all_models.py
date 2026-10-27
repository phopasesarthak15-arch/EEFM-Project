from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    student_name = Column(String(100), default="Aarav Sharma")
    monthly_allowance = Column(Float, default=15000.0)
    part_time_income = Column(Float, default=3000.0)
    scholarship_income = Column(Float, default=0.0)
    monthly_savings_target = Column(Float, default=2500.0)
    living_arrangement = Column(String(50), default="hostel")
    fixed_monthly_expenses = Column(Float, default=4500.0)
    is_onboarded = Column(Boolean, default=False)
    currency = Column(String(10), default="INR")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    description = Column(String(200), nullable=False)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String(20), nullable=False) # "income" or "expense"
    category = Column(String(100), nullable=False, index=True)
    payment_method = Column(String(50), default="UPI")
    notes = Column(Text, nullable=True)
    is_recurring = Column(Boolean, default=False)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(100), nullable=False, index=True)
    planned_amount = Column(Float, nullable=False)
    month = Column(Integer, nullable=False) # 1-12
    year = Column(Integer, nullable=False)
    description = Column(String(255), nullable=True)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    target_amount = Column(Float, nullable=False)
    current_saved = Column(Float, default=0.0)
    target_date = Column(Date, nullable=False)
    description = Column(Text, nullable=True)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    contributions = relationship("SavingsContribution", back_populates="goal", cascade="all, delete-orphan")

class SavingsContribution(Base):
    __tablename__ = "savings_contributions"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("savings_goals.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, default=date.today)
    amount = Column(Float, nullable=False) # Positive for contribution, negative for withdrawal
    note = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    goal = relationship("SavingsGoal", back_populates="contributions")

class OptimizationStatus(Base):
    __tablename__ = "optimization_statuses"

    id = Column(Integer, primary_key=True, index=True)
    rule_key = Column(String(150), unique=True, nullable=False)
    status = Column(String(50), nullable=False) # "reviewed" or "dismissed"
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
