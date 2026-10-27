import React from 'react';
import {
  GraduationCap,
  Layers,
  Database,
  Cpu,
  BrainCircuit,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  Workflow,
  Sparkles,
  Info
} from 'lucide-react';

export const ProjectInfoPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
              Academic Project Specification & Defense Documentation
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Student Expense Optimizer
            </h1>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2">
          An end-to-end Personal Financial Management and Student Budget Optimization system engineered for academic evaluation in Finance, Machine Learning, and Full-Stack Software Engineering.
        </p>

        {/* Academic Meta Tags */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Domain</span>
            <strong className="text-slate-800">Financial Management</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Emerging Tech</span>
            <strong className="text-teal-700">Machine Learning (scikit-learn)</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Currency Locale</span>
            <strong className="text-slate-800">INR (₹) / India</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Architecture</span>
            <strong className="text-slate-800">Decoupled RESTful SPA</strong>
          </div>
        </div>
      </div>

      {/* Problem Statement & Objectives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Info className="w-5 h-5 text-teal-600" />
            Problem Statement
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            College students and hostel residents routinely manage finite monthly allowances with irregular timing and high discretionary temptations. Lacking structured daily accounting, spending velocity awareness, and algorithmic forecasting, students suffer mid-month cash deficits, negligible emergency savings, and financial anxiety.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Core Objectives
          </h2>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
            <li>Record and categorize income and expenses with decimal-safe precision.</li>
            <li>Monitor category budget utilization and highlight overspending breaches.</li>
            <li>Detect spending surges, recurring subscriptions, and potential duplicate charges.</li>
            <li>Calculate required periodic contributions for goal milestone attainment.</li>
            <li>Train chronological Machine Learning time series regressions without lookahead leakage.</li>
            <li>Provide rigorous evaluation metrics (MAE & RMSE) against empirical baselines.</li>
          </ul>
        </div>
      </div>

      {/* System Architecture Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Workflow className="w-5 h-5 text-teal-600" />
          Proposed System Architecture
        </h2>

        {/* Visual Flow Representation */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-center font-bold">
            <div className="p-3 bg-white border border-slate-300 rounded-xl shadow-2xs w-full sm:w-auto">
              <span className="text-slate-500 block text-[10px]">Client Layer</span>
              React + TypeScript (Vite + Tailwind)
            </div>
            <span className="text-slate-400 font-normal">→ HTTP JSON →</span>
            <div className="p-3 bg-white border border-slate-300 rounded-xl shadow-2xs w-full sm:w-auto">
              <span className="text-slate-500 block text-[10px]">API Gateway</span>
              FastAPI + Pydantic (Python 3.10)
            </div>
            <span className="text-slate-400 font-normal">→ Services →</span>
            <div className="p-3 bg-white border border-teal-300 bg-teal-50/50 rounded-xl shadow-2xs w-full sm:w-auto text-teal-900">
              <span className="text-teal-600 block text-[10px]">Business & ML Engine</span>
              Financial Rules + scikit-learn
            </div>
            <span className="text-slate-400 font-normal">→ ORM →</span>
            <div className="p-3 bg-white border border-slate-300 rounded-xl shadow-2xs w-full sm:w-auto">
              <span className="text-slate-500 block text-[10px]">Persistence</span>
              SQLite (SQLAlchemy 2.0)
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 mt-2">
          <div className="p-3 bg-slate-50 rounded-lg">
            <strong className="text-slate-800 block mb-1">Frontend Layer:</strong>
            Interactive dashboard, responsive sidebar, Recharts SVG charting, client-side validation, and printable reports.
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <strong className="text-slate-800 block mb-1">Backend REST API:</strong>
            Decoupled FastAPI microservices with parameterized SQLAlchemy models and decimal-safe financial calculations.
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <strong className="text-slate-800 block mb-1">ML Pipeline:</strong>
            Feature extraction with lagged spending (1, 2, 7 days) and rolling statistical windows evaluated via time holdout.
          </div>
        </div>
      </div>

      {/* Machine Learning Methodology Deep Dive */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-teal-600" />
          Machine Learning Methodology & Validation Protocol
        </h2>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-2.5">Pipeline Stage</th>
                <th className="p-2.5">Academic Implementation Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              <tr>
                <td className="p-2.5 font-bold text-slate-900">1. Data Aggregation</td>
                <td className="p-2.5">Daily expense sum aggregation with continuous calendar re-indexing to preserve true zero-spending days.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-900">2. Feature Engineering</td>
                <td className="p-2.5">
                  Lagged variables (<code>lag_1, lag_2, lag_7</code>), rolling metrics (<code>roll_mean_7, roll_std_7, roll_mean_14</code>), calendar indicators (<code>day_of_week, day_of_month, is_weekend</code>). Strictly past-shifted to avoid lookahead data leakage.
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-900">3. Validation Strategy</td>
                <td className="p-2.5">
                  Chronological Forward-Chain Split: The model trains on earlier chronological days and evaluates strictly on holdout future observations. No random row shuffling.
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-900">4. Algorithms</td>
                <td className="p-2.5">
                  Primary: <code>RandomForestRegressor(n_estimators=100, max_depth=6)</code>. Baseline Benchmark: 7-day Moving Average (<code>roll_mean_7</code>).
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-900">5. Evaluation Metrics</td>
                <td className="p-2.5">
                  Mean Absolute Error (MAE) and Root Mean Squared Error (RMSE) comparing model test residuals directly against the historical moving average baseline.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Formulas Reference */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-teal-600" />
          Financial Formulas & Business Rules
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <strong className="text-slate-900 block">Net Savings:</strong>
            <code className="text-teal-700 bg-white px-2 py-0.5 rounded border border-slate-200 mt-1 inline-block">
              Net Savings = Total Inflow − Total Outflow
            </code>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <strong className="text-slate-900 block">Savings Rate:</strong>
            <code className="text-teal-700 bg-white px-2 py-0.5 rounded border border-slate-200 mt-1 inline-block">
              Savings Rate = (Net Savings / Total Inflow) × 100
            </code>
            <p className="text-[11px] text-slate-400 mt-1">Safely returns null if Total Inflow is zero.</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <strong className="text-slate-900 block">Budget Variance:</strong>
            <code className="text-teal-700 bg-white px-2 py-0.5 rounded border border-slate-200 mt-1 inline-block">
              Variance = Actual Category Spending − Planned Budget Cap
            </code>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <strong className="text-slate-900 block">Required Monthly Contribution:</strong>
            <code className="text-teal-700 bg-white px-2 py-0.5 rounded border border-slate-200 mt-1 inline-block">
              Deposit = (Target Amount − Current Saved) / Months Remaining
            </code>
          </div>
        </div>
      </div>

      {/* Limitations and Scope */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <h2 className="text-base font-bold text-slate-900">Project Limitations & Future Scope</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
          <div>
            <h4 className="font-bold text-slate-800 mb-1">Current Academic Prototype Limitations:</h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>Local single-user database architecture without cloud OAuth or bank open-banking APIs.</li>
              <li>Forecasts represent statistical expectations based on past behavioral trends.</li>
              <li>Estimated savings from overlapping optimizer rules are non-additive approximations.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 mb-1">Planned Future Enhancements:</h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>Automated bank statement PDF / SMS parser using lightweight NLP.</li>
              <li>Multi-student hostel expense sharing and split-ledger reconciliation.</li>
              <li>Ensemble forecasting combining ARIMA / Prophet with Gradient Boosting.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
