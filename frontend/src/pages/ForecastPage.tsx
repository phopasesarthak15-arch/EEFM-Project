import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { ForecastResponse, ForecastDataPoint } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import {
  Sparkles,
  BrainCircuit,
  TrendingUp,
  RefreshCw,
  Info,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Layers,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export const ForecastPage: React.FC = () => {
  const { refreshCount, triggerRefresh } = useApp();

  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [activeHorizon, setActiveHorizon] = useState<'7d' | '30d'>('7d');

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const data = await api.getForecast();
      setForecastData(data);
    } catch (err) {
      console.error('Failed to fetch ML forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [refreshCount]);

  const handleRetrain = async () => {
    setTraining(true);
    try {
      const updated = await api.trainForecast();
      setForecastData(updated);
      alert('RandomForestRegressor model successfully retrained on chronological expense observations!');
    } catch (err: any) {
      alert(err.message || 'Error training forecasting model');
    } finally {
      setTraining(false);
    }
  };

  const handleLoadDemoForML = async () => {
    setTraining(true);
    try {
      await api.loadDemo();
      triggerRefresh();
    } catch (err: any) {
      alert(err.message || 'Error loading demo data');
    } finally {
      setTraining(false);
    }
  };

  const evalMetrics = forecastData?.evaluation;
  const isSufficient = forecastData?.has_sufficient_data;

  // Format chart data combining historical and forecast points
  const chartPoints = forecastData?.historical_and_forecast_trend || [];
  const activeForecastList = activeHorizon === '7d'
    ? forecastData?.daily_forecast_7d || []
    : forecastData?.daily_forecast_30d || [];

  const totalForecastSum = activeForecastList.reduce((acc, p) => acc + p.forecast_amount, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Machine Learning Expense Forecasting</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                  scikit-learn
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Recursive multi-step time series regression predicting upcoming student expenditure
              </p>
            </div>
          </div>

          <button
            onClick={handleRetrain}
            disabled={training || !isSufficient}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${training ? 'animate-spin' : ''}`} />
            <span>{training ? 'Retraining...' : 'Retrain ML Model'}</span>
          </button>
        </div>
      </div>

      {/* Insufficient Data State */}
      {!isSufficient && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-slate-800 space-y-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-900">Insufficient Continuous Historical Data</h3>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                {forecastData?.message || 'A minimum of 21 days of continuous daily historical expenditure is required to engineer lagged features and train a defensible regression model.'}
              </p>
            </div>
          </div>

          <div className="bg-white/80 p-4 rounded-xl border border-amber-200 text-xs space-y-2">
            <div className="font-bold text-slate-900">Academic Integrity Standard:</div>
            <p className="text-slate-600">
              Rather than presenting hardcoded or fabricated forecasts, this application enforces strict minimum sample sizes before fitting scikit-learn models.
            </p>
            <button
              onClick={handleLoadDemoForML}
              disabled={training}
              className="mt-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs shadow-xs cursor-pointer"
            >
              Load 90-Day Synthetic Student Dataset to Test ML
            </button>
          </div>
        </div>
      )}

      {/* ML Evaluation Metrics Grid (When data is sufficient) */}
      {isSufficient && evalMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs fin-card">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Model MAE vs Baseline</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              ₹{evalMetrics.model_mae.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Baseline MAE: ₹{evalMetrics.baseline_mae.toFixed(2)}
              {evalMetrics.improvement_pct !== null && evalMetrics.improvement_pct !== undefined && (
                <span className="text-emerald-600 font-bold ml-1">
                  ({evalMetrics.improvement_pct > 0 ? `+${evalMetrics.improvement_pct}%` : `${evalMetrics.improvement_pct}%`})
                </span>
              )}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs fin-card">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Hold-out Test RMSE</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              ₹{evalMetrics.model_rmse.toFixed(2)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Baseline RMSE: ₹{evalMetrics.baseline_rmse.toFixed(2)}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs fin-card">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Training Observations</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {evalMetrics.train_size} Days
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Holdout Test: {evalMetrics.test_size} days chronological
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs fin-card">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Forecast Total ({activeHorizon})</span>
            <div className="text-2xl font-extrabold text-teal-700 mt-1">
              {formatINR(totalForecastSum)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Estimated next {activeHorizon === '7d' ? '7 days' : '30 days'}
            </p>
          </div>
        </div>
      )}

      {/* Main Combined Forecast Chart */}
      {isSufficient && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Historical Spending & Machine Learning Forecast
              </h3>
              <p className="text-xs text-slate-500">
                Solid blue represents actual records; dotted teal shows multi-step regression predictions with error bands
              </p>
            </div>

            {/* Horizon Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveHorizon('7d')}
                className={`px-3 py-1 rounded-lg transition ${
                  activeHorizon === '7d' ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Next 7 Days
              </button>
              <button
                onClick={() => setActiveHorizon('30d')}
                className={`px-3 py-1 rounded-lg transition ${
                  activeHorizon === '30d' ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Next 30 Days
              </button>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartPoints} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                <Tooltip
                  formatter={(val: any, name: any) => [formatINR(Number(val)), name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                {/* Actual Historical Line */}
                <Line
                  type="monotone"
                  dataKey="actual_amount"
                  name="Recorded Spending"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                />

                {/* Forecast Line */}
                <Line
                  type="monotone"
                  dataKey="forecast_amount"
                  name="ML Predicted (Estimate)"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#0d9488' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Forecast Table & Category Expectations */}
      {isSufficient && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Day by Day Forecast Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Upcoming Daily Projections ({activeHorizon})
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Point estimates with calculated confidence limits (± 1 RMSE)
            </p>

            <div className="max-h-72 overflow-y-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase sticky top-0">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5 text-right">Predicted Amount</th>
                    <th className="p-2.5 text-right">Confidence Band</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeForecastList.map(pt => (
                    <tr key={pt.date} className="hover:bg-slate-50">
                      <td className="p-2.5 font-medium text-slate-700">{formatDate(pt.date)}</td>
                      <td className="p-2.5 text-right font-bold text-teal-700">{formatINR(pt.forecast_amount)}</td>
                      <td className="p-2.5 text-right text-slate-400 text-[11px]">
                        {formatINR(pt.lower_bound)} – {formatINR(pt.upper_bound)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Category Estimated 30-Day Outflow */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Estimated 30-Day Category Allocation
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Predicted share distributed across primary expense categories
            </p>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {Object.entries(forecastData?.category_forecasts || {}).map(([cat, amt]) => (
                <div key={cat} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{cat}</span>
                  <span className="font-bold text-teal-800">{formatINR(amt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Model Transparency & Academic Methodology */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-teal-600" />
          Model Transparency & Academic Methodology
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
          <div className="space-y-2">
            <div className="font-bold text-slate-800">1. Algorithm & Feature Engineering:</div>
            <p>
              Employs a scikit-learn <code>RandomForestRegressor</code> (100 estimators, max depth 6) trained on daily continuous historical time series. Input features are strictly past-lagged (<code>lag_1, lag_2, lag_7</code>) and moving averages (<code>roll_mean_7, roll_mean_14</code>) to eliminate future lookahead data leakage.
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-slate-800">2. Time-Based Train / Test Split:</div>
            <p>
              Unlike random k-fold shuffling, validation uses chronological forward-chaining hold-out testing. The model is tested on the final chronological days to simulate real-world prospective forecasting.
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-slate-800">3. Evaluation Benchmarks:</div>
            <p>
              Evaluated against a 7-day moving average baseline. Performance is measured via Mean Absolute Error (MAE) and Root Mean Squared Error (RMSE).
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-slate-800">4. Limitations & Integrity:</div>
            <p>
              Student expense patterns are volatile (exams, semester fees, festivals). All model outputs are labeled as statistical approximations rather than guaranteed expenditures.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
