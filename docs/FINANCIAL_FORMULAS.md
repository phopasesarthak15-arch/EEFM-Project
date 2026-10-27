# FINANCIAL FORMULAS & CALCULATION SPECIFICATION

This document details the exact mathematical formulas, boundary conditions, edge cases, and rounding policies implemented within the **Student Expense Optimizer** application.

---

## 1. CORE CASH-FLOW INDICATORS

### 1.1 Net Monthly Savings
Quantifies the net capital surplus or deficit accrued by the student during the specified accounting period.

$$\text{Net Savings} = \sum \text{Income Transactions} - \sum \text{Expense Transactions}$$

- **Input Constraints**: Monetary values must be real non-negative numbers.
- **Output Sign**: Positive indicates a cash surplus; negative indicates a deficit.
- **Rounding Policy**: `round(value, 2)`

### 1.2 Savings Rate
Expresses net savings as a percentage of total incoming funds.

$$\text{Savings Rate} = \left(\frac{\text{Net Savings}}{\text{Total Income}}\right) \times 100$$

- **Zero-Income Boundary Condition**: If $\text{Total Income} \le 0$, the function returns `None` (rendered as `N/A (No income)` in the user interface) to eliminate `ZeroDivisionError`.
- **Negative Savings**: When expenses exceed income, the savings rate is legitimately negative, signaling financial distress.

---

## 2. BUDGET ADHERENCE INDICATORS

### 2.1 Budget Utilization Percentage
Measures the percentage of an allocated category cap that has been consumed by actual recorded expense transactions.

$$\text{Budget Utilization} = \left(\frac{\text{Actual Category Spending}}{\text{Planned Budget Cap}}\right) \times 100$$

- **Boundary Condition**: If $\text{Planned Budget} \le 0$, the function safely returns `None`.

### 2.2 Remaining Budget Buffer
Represents the unspent liquidity available within a given category for the remainder of the calendar month.

$$\text{Remaining Budget} = \text{Planned Budget Cap} - \text{Actual Category Spending}$$

- **Overspending Representation**: When $\text{Remaining Budget} < 0$, the negative value explicitly represents the budget overrun magnitude.

### 2.3 Budget Status Tiers & Threshold Rules
The system maps category utilization percentages into four standardized academic risk tiers:

| Tier Identifier | Utilization Range | UI Visual Badge | Semantic Meaning |
| :--- | :--- | :--- | :--- |
| `on_track` | $0.0\% \le \text{Util} < 75.0\%$ | Emerald (`#059669`) | Spending velocity is safe and well below monthly allocation. |
| `approaching` | $75.0\% \le \text{Util} < 90.0\%$ | Teal (`#0d9488`) | Over three-quarters consumed; caution advised. |
| `near_limit` | $90.0\% \le \text{Util} \le 100.0\%$ | Amber (`#f59e0b`) | Approaching exhaustion; discretionary transactions should pause. |
| `overspent` | $\text{Util} > 100.0\%$ | Rose (`#e11d48`) | Limit breached; actionable budget overrun. |

---

## 3. ANALYTICAL INDICATORS

### 3.1 Category Portfolio Share
Calculates the proportional contribution of an individual category to total monthly outlays:

$$\text{Category Share} = \left(\frac{\text{Category Expenditure}}{\text{Total Expenses}}\right) \times 100$$

- **Zero Total Outflow**: If total expenditure is 0, category share returns $0.0\%$.

### 3.2 Average Daily Expenditure
Measures the daily burn rate of capital across the true calendar days of the reporting month:

$$\text{Average Daily Spending} = \frac{\text{Total Month Expenses}}{\text{Calendar Days in Month}}$$

- **Calendar Normalization**: Dynamically computes days in month (28, 29, 30, or 31) using Python's `calendar.monthrange(year, month)[1]`.

### 3.3 Month-over-Month (MoM) Spending Velocity
Measures the percentage acceleration or deceleration in spending compared to the preceding calendar month:

$$\text{MoM Change (\%)} = \left(\frac{\text{Current Month Expenses} - \text{Previous Month Expenses}}{\text{Previous Month Expenses}}\right) \times 100$$

- **Zero Prior Month Baseline**: If $\text{Previous Month Expenses} \le 0$, returns `None` (displayed as `First month baseline`).

---

## 4. SAVINGS GOAL MATHEMATICAL SPECIFICATION

### 4.1 Goal Progress Percentage
$$\text{Progress (\%)} = \min\left(100.0, \max\left(0.0, \left(\frac{\text{Current Saved}}{\text{Target Amount}}\right) \times 100\right)\right)$$

### 4.2 Remaining Milestone Amount
$$\text{Remaining Amount} = \max\left(0.0, \text{Target Amount} - \text{Current Saved}\right)$$

### 4.3 Required Monthly Contribution Schedule
Computes the monthly deposit required to achieve the goal by the specified deadline:

$$\text{Months Remaining} = \max\left(0.0, \frac{\text{Target Date} - \text{As-of Date}}{30.4375}\right)$$

$$\text{Required Monthly Deposit} = \begin{cases}
0.0 & \text{if } \text{Remaining Amount} \le 0 \\
\text{Remaining Amount} & \text{if } \text{Months Remaining} \le 0 \quad (\text{Overdue / Due this month}) \\
\frac{\text{Remaining Amount}}{\text{Months Remaining}} & \text{otherwise}
\end{cases}$$

---

## 5. FINANCIAL HEALTH SCORING MODEL (0–100)

The Financial Health Score is an academic composite index designed to assess student liquidity and discipline without misrepresenting itself as a commercial credit rating:

1. **Baseline Score**: Starts at 50 points.
2. **Savings Rate Factor (up to $\pm 25$ points)**:
   - Savings Rate $\ge 20\%$: $+25$ points (strong discipline)
   - Savings Rate $\ge 10\%$: $+15$ points
   - Savings Rate $\ge 0\%$: $+5$ points
   - Savings Rate $< 0\%$: $-25$ points (monthly deficit)
3. **Budget Adherence Factor (up to $\pm 20$ points)**:
   - Budget Utilization $\le 85\%$: $+20$ points
   - Budget Utilization $\le 100\%$: $+10$ points
   - Budget Utilization $> 100\%$: $-20$ points (overspent)
4. **Savings Goals Adherence (up to $\pm 10$ points)**:
   - Goals active and on track: $+10$ points
   - Goals overdue or behind target: $-5$ points
5. **Score Clamping**: Result is strictly clamped between $[5, 100]$.
   - $80 - 100$: `Excellent`
   - $65 - 79$: `Good`
   - $50 - 64$: `Fair`
   - Below 50: `Needs Attention`
