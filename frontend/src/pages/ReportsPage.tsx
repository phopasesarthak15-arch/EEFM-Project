import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  FinancialSummary,
  CategorySpendingItem,
  Budget,
  OptimizerRecommendation
} from '../types';
import { formatINR, formatPercentage } from '../utils/formatters';
import {
  Printer,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { selectedMonth, selectedYear, refreshCount } = useApp();

  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [categories, setCategories] = useState<CategorySpendingItem[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizerRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = months[selectedMonth - 1];

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getSummary(selectedMonth, selectedYear),
      api.getCategories(selectedMonth, selectedYear),
      api.getBudgets(selectedMonth, selectedYear),
      api.getRecommendations(selectedMonth, selectedYear)
    ])
      .then(([s, c, b, r]) => {
        setSummary(s);
        setCategories(c.categories);
        setBudgets(b);
        setRecommendations(r);
      })
      .catch(err => console.error('Failed to load report data:', err))
      .finally(() => setLoading(false));
  }, [selectedMonth, selectedYear, refreshCount]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    window.open(`/api/transactions/export-csv`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar (no-print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Monthly Financial Statement & Report</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official monthly audit report for {monthName} {selectedYear}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Raw CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
        {/* Formal Report Header */}
        <div className="border-b-2 border-slate-900 pb-5 mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              STUDENT EXPENSE OPTIMIZER
            </h2>
            <div className="text-xs font-bold uppercase tracking-wider text-teal-700 mt-1">
              Monthly Financial Statement & Performance Audit
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Period: {monthName} {selectedYear} | Currency: Indian Rupee (INR, ₹)
            </div>
          </div>

          <div className="text-right text-xs text-slate-500">
            <div>Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            <div className="font-semibold text-slate-800">Status: Verified Academic Prototype</div>
          </div>
        </div>

        {/* Executive Financial Summary */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            1. Executive Financial Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">Total Inflows</span>
              <span className="font-extrabold text-slate-900 text-sm">{formatINR(summary?.total_income)}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">Total Outflows</span>
              <span className="font-extrabold text-slate-900 text-sm">{formatINR(summary?.total_expenses)}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">Net Surplus / Deficit</span>
              <span className={`font-extrabold text-sm ${(summary?.net_savings ?? 0) >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>
                {formatINR(summary?.net_savings)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">Savings Rate</span>
              <span className="font-extrabold text-slate-900 text-sm">
                {summary?.savings_rate !== null && summary?.savings_rate !== undefined
                  ? `${summary.savings_rate.toFixed(1)}%`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Budget vs Actual Adherence */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            2. Category Budget Adherence Table
          </h3>
          {budgets.length > 0 ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5 text-right">Planned Cap</th>
                    <th className="p-2.5 text-right">Actual Spent</th>
                    <th className="p-2.5 text-right">Remaining Buffer</th>
                    <th className="p-2.5 text-center">Utilization</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {budgets.map(b => (
                    <tr key={b.id}>
                      <td className="p-2.5 font-medium text-slate-900">{b.category}</td>
                      <td className="p-2.5 text-right text-slate-700">{formatINR(b.planned_amount)}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">{formatINR(b.actual_spending)}</td>
                      <td className={`p-2.5 text-right font-bold ${b.remaining_amount >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>
                        {formatINR(b.remaining_amount)}
                      </td>
                      <td className="p-2.5 text-center">{b.utilization_percentage.toFixed(0)}%</td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.status === 'overspent' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {b.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 text-slate-400 text-xs rounded-xl">No budgets configured for this period.</div>
          )}
        </div>

        {/* Category Breakdown Table */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            3. Detailed Expense Distribution
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5 text-right">Expenditure</th>
                  <th className="p-2.5 text-right">Portfolio Share</th>
                  <th className="p-2.5 text-center">Transaction Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map(c => (
                  <tr key={c.category}>
                    <td className="p-2.5 font-medium text-slate-900">{c.category}</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{formatINR(c.actual_amount)}</td>
                    <td className="p-2.5 text-right text-slate-600">{c.share_percentage.toFixed(1)}%</td>
                    <td className="p-2.5 text-center text-slate-500">{c.transaction_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Optimization Findings Summary */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            4. Optimizer Audit & Action Items
          </h3>
          {recommendations.length > 0 ? (
            <div className="space-y-2 text-xs">
              {recommendations.slice(0, 4).map(r => (
                <div key={r.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900">{r.title}</strong>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                      {r.priority} Priority
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1">{r.pattern_explanation}</p>
                  <p className="text-slate-800 font-semibold mt-1">Suggested: {r.suggested_action}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 text-slate-400 text-xs rounded-xl">No active warnings detected.</div>
          )}
        </div>

        {/* Formal Sign-off footer */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <div>Student Expense Optimizer Academic Platform</div>
          <div>Report Page 1 of 1</div>
        </div>
      </div>
    </div>
  );
};
