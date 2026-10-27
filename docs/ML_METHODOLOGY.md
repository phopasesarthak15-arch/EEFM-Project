# MACHINE LEARNING METHODOLOGY & TIME SERIES FORECASTING PROTOCOL

**Module Path**: `backend/app/ml/forecasting.py`  
**Dependencies**: `scikit-learn 1.7.2`, `pandas 2.3.3`, `numpy 1.26.4`, `joblib 1.6.0`  
**Primary Model**: `RandomForestRegressor`  
**Baseline Model**: 7-Day Moving Average (`roll_mean_7`)

---

## 1. OBJECTIVE & PROBLEM FORMULATION

In student personal finance, expenditure patterns exhibit severe short-term volatility compounded by weekly seasonality (weekend canteen treats, leisure outings) and monthly cyclicity (mobile recharges, room rent).

The machine learning module formulates expenditure forecasting as a **supervised regression task over an engineered continuous time series**. The goal is to generate:
1. Prospective daily expenditure estimates for a short horizon (7 days).
2. Prospective daily expenditure estimates for a medium horizon (30 days).
3. Prediction intervals ($\pm 1 \text{ RMSE}$) representing statistical uncertainty.

---

## 2. DATA PREPARATION & CALENDAR RE-INDEXING

Raw financial records consist of timestamped transactions. To prepare valid input for chronological time series modeling:
1. **Filtering**: Strictly filter for transactions where `transaction_type == 'expense'`. Incomes are excluded to prevent target pollution.
2. **Daily Aggregation**: Sum all expense transactions occurring on the same date:
   $$Y_t = \sum_{i \in \text{txs on date } t} \text{amount}_i$$
3. **Continuous Calendar Re-Indexing**:
   A common flaw in naive financial ML is skipping days with zero recorded expenses. If a student spends nothing on Tuesday, dropping Tuesday artificially distorts rolling averages and lag correlations. The pipeline re-indexes the series across a continuous date range:
   $$t \in [\min(\text{date}), \max(\text{date})], \quad \text{freq} = \text{'1D'}$$
   Missing calendar days are imputed with true zero values ($0.0$).

---

## 3. FEATURE ENGINEERING & LEAKAGE PREVENTION

To prevent future lookahead data leakage, all features for predicting period $t$ must be strictly computed from observations prior to $t$.

| Feature Name | Formulation | Academic Rationale |
| :--- | :--- | :--- |
| `time_index` | $t \in [0, 1, 2, \dots, N-1]$ | Captures overall chronological trend and inflation velocity. |
| `day_of_week` | $\text{date.weekday()} \in [0, 6]$ | Encodes weekly spending cycles (Mon vs Sun). |
| `day_of_month` | $\text{date.day} \in [1, 31]$ | Captures monthly allowance arrival timing (early vs late month). |
| `month` | $\text{date.month} \in [1, 12]$ | Captures seasonal semester cycles (exam months vs breaks). |
| `is_weekend` | $\mathbb{I}(\text{day\_of\_week} \in [5, 6])$ | Binary indicator for weekend social leisure spikes. |
| `lag_1` | $Y_{t-1} = \text{shift}(1)$ | Immediate autocorrelation from yesterday's expenditure. |
| `lag_2` | $Y_{t-2} = \text{shift}(2)$ | Short-term inertia. |
| `lag_7` | $Y_{t-7} = \text{shift}(7)$ | Weekly seasonality correlation (last week's corresponding day). |
| `roll_mean_7` | $\frac{1}{7} \sum_{i=1}^{7} Y_{t-i}$ | Smoothed weekly burn rate (strictly shifted by 1). |
| `roll_std_7` | $\sigma(Y_{t-7}, \dots, Y_{t-1})$ | Volatility and unpredictability of spending. |
| `roll_mean_14` | $\frac{1}{14} \sum_{i=1}^{14} Y_{t-i}$ | Bi-weekly baseline expenditure level. |

---

## 4. VALIDATION STRATEGY: CHRONOLOGICAL HOLD-OUT

Standard random k-fold cross-validation is fundamentally invalid for chronological time series because shuffling points allows the model to predict the past using features computed from the future.

The system implements **Chronological Forward-Chain Hold-Out Testing**:
- **Clean Observations**: $N$ rows after dropping initial NaN lag rows.
- **Test Size**: $K = \min(14, \max(5, \lfloor 0.2 \times N \rfloor))$ days.
- **Train Split**: Chronological indices $[0, N - K - 1]$.
- **Test Split**: Chronological indices $[N - K, N - 1]$.

---

## 5. RECURSIVE MULTI-STEP FORECASTING

For future horizons exceeding 1 day (e.g. 7-day or 30-day ahead predictions), true future lags ($Y_{t+1}$) do not yet exist. The pipeline implements **Recursive Multi-Step Autoregressive Forecasting**:
1. Predict $t+1$ using historical observations.
2. Append predicted value $\hat{Y}_{t+1}$ to the series.
3. Dynamically re-compute lagged features (`lag_1 = \hat{Y}_{t+1}`, updated `roll_mean_7`) for period $t+2$.
4. Recursively repeat across the 30-step forecast horizon.
5. Apply non-negative bounding: $\hat{Y} = \max(0.0, \hat{Y})$.

---

## 6. EMPIRICAL BENCHMARKS & EVALUATION METRICS

### 6.1 Evaluation Formulations
- **Mean Absolute Error (MAE)**:
  $$\text{MAE} = \frac{1}{K} \sum_{i=1}^{K} |Y_i - \hat{Y}_i|$$
- **Root Mean Squared Error (RMSE)**:
  $$\text{RMSE} = \sqrt{\frac{1}{K} \sum_{i=1}^{K} (Y_i - \hat{Y}_i)^2}$$
- **Percentage Improvement over Baseline**:
  $$\text{Improvement (\%)} = \left(\frac{\text{Baseline MAE} - \text{Model MAE}}{\text{Baseline MAE}}\right) \times 100$$

### 6.2 Empirical Results on Synthetic Student Dataset
- **Evaluation Period**: 12 Oct 2026 to 25 Oct 2026 (14 hold-out test days)
- **Baseline (7-Day Moving Average)**:
  - Baseline MAE: **₹148.76**
  - Baseline RMSE: **₹177.26**
- **Machine Learning Model (RandomForestRegressor)**:
  - Model MAE: **₹120.02**
  - Model RMSE: **₹134.62**
  - **Error Reduction**: **+19.32% improvement** over empirical moving average.

---

## 7. DATA SUFFICIENCY & TRANSPARENCY ENFORCEMENT

- **Threshold**: Minimum 21 continuous calendar days.
- If total continuous days $< 21$, the API transparently returns:
  `has_sufficient_data: false`
- The user interface explicitly informs the student that reliable statistical learning cannot yet take place and offers to load the 90-day synthetic dataset for academic examination.
