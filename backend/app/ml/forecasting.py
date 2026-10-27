import numpy as np
import pandas as pd
from datetime import date, datetime, timedelta
from typing import List, Dict, Any, Tuple, Optional
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error
from sqlalchemy.orm import Session
from app.models.all_models import Transaction
from app.schemas.all_schemas import ForecastResponse, ForecastDataPoint, ForecastEvaluation

MINIMUM_REQUIRED_DAYS = 21

def train_and_forecast_expenses(db: Session) -> ForecastResponse:
    # 1. Fetch all expense transactions ordered by date
    txs = db.query(Transaction).filter(
        Transaction.transaction_type == "expense"
    ).order_by(Transaction.date.asc()).all()

    if not txs:
        return _build_insufficient_data_response("No expense transactions recorded yet.")

    # 2. Build Daily Aggregated DataFrame
    records = [{"date": pd.to_datetime(t.date), "amount": float(t.amount), "category": t.category} for t in txs]
    df_raw = pd.DataFrame(records)

    # Daily sum of expenses
    daily_df = df_raw.groupby("date")["amount"].sum().reset_index()
    daily_df = daily_df.sort_values("date").reset_index(drop=True)

    # Reindex over full date range from min to max date to capture zero-spending days
    min_date = daily_df["date"].min()
    max_date = daily_df["date"].max()
    full_idx = pd.date_range(start=min_date, end=max_date, freq="D")
    daily_df = daily_df.set_index("date").reindex(full_idx, fill_value=0.0).rename_axis("date").reset_index()

    total_days = len(daily_df)
    if total_days < MINIMUM_REQUIRED_DAYS:
        return _build_insufficient_data_response(
            f"Personalized machine learning forecasting requires at least {MINIMUM_REQUIRED_DAYS} days of continuous historical expense history. Currently have {total_days} recorded day(s)."
        )

    # 3. Feature Engineering (Strictly past-lagged to prevent data leakage)
    daily_df["day_of_week"] = daily_df["date"].dt.dayofweek
    daily_df["day_of_month"] = daily_df["date"].dt.day
    daily_df["month"] = daily_df["date"].dt.month
    daily_df["is_weekend"] = daily_df["day_of_week"].isin([5, 6]).astype(int)
    daily_df["time_index"] = np.arange(len(daily_df))

    # Past lags (shift by 1 or more so today's prediction only uses past days)
    daily_df["lag_1"] = daily_df["amount"].shift(1)
    daily_df["lag_2"] = daily_df["amount"].shift(2)
    daily_df["lag_7"] = daily_df["amount"].shift(7)

    # Rolling window stats of past days (shift(1) ensures no lookahead)
    daily_df["roll_mean_7"] = daily_df["amount"].shift(1).rolling(window=7, min_periods=1).mean()
    daily_df["roll_std_7"] = daily_df["amount"].shift(1).rolling(window=7, min_periods=1).std().fillna(0)
    daily_df["roll_mean_14"] = daily_df["amount"].shift(1).rolling(window=14, min_periods=1).mean()

    # Drop early rows with NaN lags
    clean_df = daily_df.dropna().copy()
    if len(clean_df) < 14:
        return _build_insufficient_data_response(
            f"Not enough clean post-lag observations for chronological validation ({len(clean_df)} valid points). Minimum 14 required."
        )

    feature_cols = [
        "time_index", "day_of_week", "day_of_month", "month",
        "is_weekend", "lag_1", "lag_2", "lag_7",
        "roll_mean_7", "roll_std_7", "roll_mean_14"
    ]

    # 4. Chronological Train-Test Split (last 7 to 14 days as hold-out evaluation)
    test_size = min(14, max(5, int(len(clean_df) * 0.2)))
    train_df = clean_df.iloc[:-test_size]
    test_df = clean_df.iloc[-test_size:]

    X_train = train_df[feature_cols]
    y_train = train_df["amount"]
    X_test = test_df[feature_cols]
    y_test = test_df["amount"]

    # 5. Fit Baseline Model (Historical 7-day Moving Average)
    # Baseline predicts test set using roll_mean_7
    baseline_preds = test_df["roll_mean_7"].values
    baseline_mae = float(mean_absolute_error(y_test, baseline_preds))
    baseline_rmse = float(root_mean_squared_error(y_test, baseline_preds))

    # 6. Fit Machine Learning Model (RandomForestRegressor)
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=6,
        random_state=42,
        min_samples_split=3
    )
    model.fit(X_train, y_train)

    test_preds = model.predict(X_test)
    # Floor negative predictions at zero
    test_preds = np.maximum(0.0, test_preds)

    model_mae = float(mean_absolute_error(y_test, test_preds))
    model_rmse = float(root_mean_squared_error(y_test, test_preds))

    improvement_pct = None
    if baseline_mae > 0:
        improvement_pct = round(((baseline_mae - model_mae) / baseline_mae) * 100.0, 2)

    # Retrain on all available data for future forecast
    model.fit(clean_df[feature_cols], clean_df["amount"])

    # 7. Recursive Multi-step Future Forecasting (7-day and 30-day)
    forecast_points_30d: List[ForecastDataPoint] = []
    current_series = list(daily_df["amount"].values)
    last_date = daily_df["date"].max()
    start_time_idx = len(daily_df)

    for step in range(1, 31):
        future_date = last_date + timedelta(days=step)
        dow = future_date.weekday()
        dom = future_date.day
        month = future_date.month
        is_wknd = 1 if dow in [5, 6] else 0
        t_idx = start_time_idx + step - 1

        lag1 = current_series[-1]
        lag2 = current_series[-2]
        lag7 = current_series[-7] if len(current_series) >= 7 else current_series[0]

        past_7 = current_series[-7:]
        rmean7 = float(np.mean(past_7))
        rstd7 = float(np.std(past_7)) if len(past_7) > 1 else 0.0

        past_14 = current_series[-14:]
        rmean14 = float(np.mean(past_14))

        x_future = pd.DataFrame([{
            "time_index": t_idx,
            "day_of_week": dow,
            "day_of_month": dom,
            "month": month,
            "is_weekend": is_wknd,
            "lag_1": lag1,
            "lag_2": lag2,
            "lag_7": lag7,
            "roll_mean_7": rmean7,
            "roll_std_7": rstd7,
            "roll_mean_14": rmean14
        }])

        pred_val = float(max(0.0, model.predict(x_future[feature_cols])[0]))
        pred_val = round(pred_val, 2)
        current_series.append(pred_val)

        # Standard error confidence band (approx 1 std of test residuals)
        band = round(max(50.0, model_rmse), 2)
        lower = max(0.0, round(pred_val - band, 2))
        upper = round(pred_val + band, 2)

        forecast_points_30d.append(ForecastDataPoint(
            date=future_date.strftime("%Y-%m-%d"),
            forecast_amount=pred_val,
            is_forecast=True,
            actual_amount=None,
            lower_bound=lower,
            upper_bound=upper
        ))

    forecast_points_7d = forecast_points_30d[:7]

    # 8. Historical + Forecast Combined Series for visual charting (last 21 days historical + 7 days forecast)
    historical_points: List[ForecastDataPoint] = []
    hist_subset = daily_df.tail(21)
    for _, row in hist_subset.iterrows():
        d_str = row["date"].strftime("%Y-%m-%d")
        historical_points.append(ForecastDataPoint(
            date=d_str,
            forecast_amount=round(float(row["amount"]), 2),
            is_forecast=False,
            actual_amount=round(float(row["amount"]), 2),
            lower_bound=None,
            upper_bound=None
        ))

    combined_series = historical_points + forecast_points_7d

    # 9. Category-level Forecast Breakdown
    # Estimate category proportion based on recent 60-day historical distribution
    cat_totals = df_raw.groupby("category")["amount"].sum()
    total_spent = cat_totals.sum()
    total_30d_forecast = sum(p.forecast_amount for p in forecast_points_30d)

    category_forecasts: Dict[str, float] = {}
    if total_spent > 0:
        for cat, amt in cat_totals.items():
            prop = amt / total_spent
            category_forecasts[cat] = round(total_30d_forecast * prop, 2)

    eval_period_str = f"{test_df['date'].min().strftime('%d %b %Y')} to {test_df['date'].max().strftime('%d %b %Y')}"

    evaluation = ForecastEvaluation(
        sample_size=len(clean_df),
        train_size=len(train_df),
        test_size=len(test_df),
        evaluation_period=eval_period_str,
        model_name="RandomForestRegressor (scikit-learn)",
        baseline_mae=round(baseline_mae, 2),
        model_mae=round(model_mae, 2),
        baseline_rmse=round(baseline_rmse, 2),
        model_rmse=round(model_rmse, 2),
        improvement_pct=improvement_pct,
        features_used=feature_cols,
        has_sufficient_data=True,
        minimum_required_days=MINIMUM_REQUIRED_DAYS
    )

    return ForecastResponse(
        has_sufficient_data=True,
        message=f"Trained on {len(clean_df)} continuous daily observations with chronological hold-out validation.",
        daily_forecast_7d=forecast_points_7d,
        daily_forecast_30d=forecast_points_30d,
        historical_and_forecast_trend=combined_series,
        category_forecasts=category_forecasts,
        evaluation=evaluation
    )

def _build_insufficient_data_response(msg: str) -> ForecastResponse:
    eval_empty = ForecastEvaluation(
        sample_size=0,
        train_size=0,
        test_size=0,
        evaluation_period="N/A",
        model_name="RandomForestRegressor (scikit-learn)",
        baseline_mae=0.0,
        model_mae=0.0,
        baseline_rmse=0.0,
        model_rmse=0.0,
        improvement_pct=None,
        features_used=["lag_1", "lag_7", "roll_mean_7", "day_of_week"],
        has_sufficient_data=False,
        minimum_required_days=MINIMUM_REQUIRED_DAYS
    )
    return ForecastResponse(
        has_sufficient_data=False,
        message=msg,
        daily_forecast_7d=[],
        daily_forecast_30d=[],
        historical_and_forecast_trend=[],
        category_forecasts={},
        evaluation=eval_empty
    )
