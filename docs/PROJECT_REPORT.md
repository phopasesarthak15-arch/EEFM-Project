# ACADEMIC PROJECT REPORT: STUDENT EXPENSE OPTIMIZER

**Degree / Course**: Bachelor of Technology / Science in Computer Science & Financial Technology  
**Department**: Department of Computer Science & Engineering  
**Institution**: [College / University Name Placeholder]  
**Academic Year**: 2026–2027  
**Candidate Name(s)**: [Student Name Placeholder] (Roll No: [Roll Number Placeholder])  
**Project Guide / Mentor**: [Guide Name Placeholder], Assistant Professor  

---

## ABSTRACT

Personal financial management represents one of the most critical yet neglected disciplines among undergraduate and postgraduate students. Facing fixed allowances, rising living costs, and impulsive digital micro-transactions via unified payment interfaces (UPI), students regularly experience mid-month liquidity shortages, absence of emergency buffers, and budgeting failures. Existing banking applications focus on transaction history without providing contextual behavioral nudges, target-oriented savings schedules, or predictive expenditure modeling.

This project introduces **Student Expense Optimizer**, an academic-grade, decoupled full-stack platform built with React, TypeScript, FastAPI, SQLAlchemy, and scikit-learn. The system provides real-time income and expense tracking, category-based budget utilization with 4-tier risk thresholding, savings goal contribution management, and a rule-based optimization engine that surfaces actionable savings opportunities. Furthermore, an empirical Machine Learning forecasting pipeline using a `RandomForestRegressor` is implemented with strictly chronological hold-out validation, engineering past-lagged and rolling statistical features to predict upcoming daily expenditures. The application demonstrates real financial calculations in Indian Rupees (INR, ₹), provides transparent model evaluation (MAE and RMSE benchmarks), and produces audit-ready financial statements.

---

## 1. INTRODUCTION

### 1.1 Background
The widespread adoption of mobile payment technologies and instant peer-to-peer transfers has drastically reduced the friction of spending money. For college students—especially those living away from home in campus hostels or shared accommodations—the absence of physical cash physical feedback exacerbates discretionary overspending on food delivery, social outings, and digital subscriptions.

### 1.2 Problem Statement
Students frequently find it difficult to manage monthly funds due to three core systemic issues:
1. **Lack of Continuous Accounting**: Failure to record small, repetitive daily purchases that cumulatively overwhelm monthly budgets.
2. **Absence of Proactive Budget Controls**: Conventional budgeting is done retroactively, making it impossible to arrest overspending before month-end.
3. **Absence of Predictive Financial Intelligence**: Students cannot anticipate upcoming cash outflows based on historical velocity and behavioral seasonality.

### 1.3 Project Objectives
The objective of this project is to develop an end-to-end, reproducible software solution that enables students to:
1. Record and classify all financial inflows and outflows with decimal-safe precision.
2. Establish category budgets and track spending utilization dynamically.
3. Quantify financial health using an academic multi-factor scoring model.
4. Detect financial leakage, duplicate charges, and subscription sprawl via automated rule heuristics.
5. Plan, fund, and track milestone savings goals.
6. Train and evaluate an empirical Machine Learning model forecasting upcoming 7-day and 30-day expenditures.
7. Generate exportable financial audit reports and CSV datasets.

---

## 2. LITERATURE SURVEY & EXISTING SYSTEMS

| System Type | Strengths | Critical Limitations |
| :--- | :--- | :--- |
| **Traditional Banking Apps** | High transaction security, authoritative statement access | No predictive forecasting; no student-specific discretionary categorization; no goal tracking. |
| **Commercial Expense Trackers** | Good mobile UI, receipt scanning | Heavily monetized; proprietary closed algorithms; no model transparency; paywalled budgeting features. |
| **Spreadsheets (Excel/Sheets)** | Highly customizable, user-controlled formulas | High manual friction; no automated alerts; lacks machine learning capabilities; poor mobile interaction. |
| **Student Expense Optimizer (Proposed)** | Decoupled web architecture, free local SQLite persistence, empirical ML with chronological validation, transparent formulas | Local deployment prototype; requires manual entry or CSV upload. |

---

## 3. SYSTEM REQUIREMENTS & SPECIFICATIONS

### 3.1 Functional Requirements
- **FR-1**: User profile configuration with living arrangement, allowance, and savings targets.
- **FR-2**: Full CRUD ledger for transactions with merchant, date, amount, category, and payment method.
- **FR-3**: Category-wise monthly budget allocation with automated overspending alerts.
- **FR-4**: Dual classification analytics: Essential (Needs) vs Discretionary (Wants) and Fixed vs Variable.
- **FR-5**: Multi-goal savings ledger with mathematical monthly deposit calculation based on target date.
- **FR-6**: Optimization engine producing evidence-backed recommendations and one-click budget alignment.
- **FR-7**: Machine learning time series regression producing 7-day and 30-day point estimates with confidence intervals.
- **FR-8**: Minimum data sufficiency enforcement (<21 days rejects premature ML training).
- **FR-9**: CSV import preview with row-level validation and CSV export.
- **FR-10**: Printable formal financial statement report.

### 3.2 Non-Functional Requirements
- **NFR-1 (Financial Precision)**: Decimal-safe calculations preventing floating-point rounding errors.
- **NFR-2 (Data Privacy & Integrity)**: 100% local database storage without transmitting financial data to third-party cloud services.
- **NFR-3 (Usability & Accessibility)**: Clean fintech design system following WCAG contrast guidelines and responsive layouts.
- **NFR-4 (Performance)**: Sub-100ms API response times for analytical aggregations on typical student ledgers (<1,000 records).

---

## 4. SYSTEM ARCHITECTURE & DESIGN

```
┌────────────────────────────────────────────────────────┐
│               Client Layer (React 19 + TS)             │
│  - Dashboard   - Ledger CRUD   - Budget Adherence      │
│  - Analytics   - Optimizer UI  - ML Forecast Charts    │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP JSON / REST
┌───────────────────────────▼────────────────────────────┐
│              FastAPI Gateway & Pydantic V2             │
│  - CORS Middleware    - Route Dispatch   - Validation  │
└──────┬────────────────────┬────────────────────┬───────┘
       │                    │                    │
┌──────▼──────┐      ┌──────▼──────┐      ┌──────▼──────┐
│  Financial  │      │ Optimization│      │ ML Pipeline │
│ Calculation │      │ Heuristics  │      │ scikit-learn│
│   Service   │      │   Engine    │      │  RF Model   │
└──────┬──────┘      └──────┬──────┘      └──────┬──────┘
       │                    │                    │
┌──────▼────────────────────▼────────────────────▼───────┐
│               SQLAlchemy 2.0 ORM Layer                 │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                  SQLite Local Database                 │
│  - Profiles  - Transactions  - Budgets  - Goals        │
└────────────────────────────────────────────────────────┘
```

---

## 5. IMPLEMENTATION DETAILS

### 5.1 Financial Core & Decimal Precision
Authoritative calculations are encapsulated in `app/services/financial_calc.py`. All amounts are formatted to 2 decimal places using standard mathematical rounding. Key calculations include:
- **Net Savings**: $\text{Net Savings} = \text{Total Income} - \text{Total Expenses}$
- **Savings Rate**: $\text{Savings Rate} = \left(\frac{\text{Net Savings}}{\text{Total Income}}\right) \times 100$ (safely returns null when income is zero).
- **Budget Utilization**: $\text{Utilization} = \left(\frac{\text{Actual Spending}}{\text{Planned Budget}}\right) \times 100$

### 5.2 Machine Learning Module
The forecasting service (`app/ml/forecasting.py`) aggregates daily expenses and constructs continuous calendar time series. Feature engineering uses strictly past-shifted values:
- Past lags: $t-1, t-2, t-7$
- Rolling statistics: 7-day mean, 7-day standard deviation, 14-day mean
- Calendar features: day of week, day of month, month, weekend indicator

A `RandomForestRegressor(n_estimators=100, max_depth=6)` is trained on the initial chronological period and evaluated against a hold-out test set of the final 14 days.

---

## 6. EXPERIMENTAL RESULTS & MODEL EVALUATION

On a synthetic 90-day student expenditure dataset (84 clean daily observations post-lagging):
- **Train Set**: 70 chronological days
- **Hold-out Test Set**: 14 chronological days
- **Benchmark Baseline (7-Day Moving Average)**:
  - Baseline MAE: ₹148.76
  - Baseline RMSE: ₹177.26
- **Selected Model (RandomForestRegressor)**:
  - Model MAE: ₹120.02
  - Model RMSE: ₹134.62
  - **Improvement over Baseline**: **+19.32%** reduction in prediction error.

---

## 7. CONCLUSION & FUTURE WORK

The Student Expense Optimizer demonstrates that combining transparent financial rules with empirical machine learning produces a significantly more effective personal finance tool than static ledgers. By enforcing strict data integrity, preventing data leakage, and providing actionable optimization advice, the application provides an exemplary prototype for modern student financial literacy.

Future enhancements include OCR receipt parsing, automated SMS/UPI statement ingestion, and multi-user room expense splitting.

---

## REFERENCES
1. McKinney, W. (2010). *Data Structures for Statistical Computing in Python*. Proceedings of the 9th Python in Science Conference.
2. Pedregosa, F., et al. (2011). *Scikit-learn: Machine Learning in Python*. Journal of Machine Learning Research, 12, 2825-2830.
3. Tiangolo, S. (2018). *FastAPI: Modern, Fast (High-Performance) Web Framework for Python*.
4. Facebook Open Source. (2020). *React: A JavaScript Library for Building User Interfaces*.
