import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  FinancialSummary,
  CategorySpendingItem,
  SpendingTrendItem,
  DailySpendingItem,
  BreakdownTypes,
  Transaction
} from '../types';
import { formatINR, formatPercentage, formatDate } from '../utils/formatters';
import {
  TrendingUp,
  BarChart2,
  PieChart as PieIcon,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0d9488', '#059669', '#3b82f6', '#6366f1', '#ec4899', '#f59e0b', '#64748b'];

export const AnalyticsPage: React.FC = () => {
  const { selectedMonth, selectedYear, refreshCount } = useApp();

  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [categories, setCategories] = useState<CategorySpendingItem[]>([]);
  const [trends, setTrends] = useState<SpendingTrendItem[]>([]);
  const [dailyData, setDailyData] = useState<DailySpendingItem[]>([]);
  const [breakdown, setBreakdown] = useState<BreakdownTypes | null>(null);
  const [largestTransactions, setLargestTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      api.getSummary(selectedMonth, selectedYear),
      api.getCategories(selectedMonth, selectedYear),
      api.getTrends(6),
      api.getDailySpending(selectedMonth, selectedYear),
      api.getBreakdownTypes(selectedMonth, selectedYear),
      api.getTransactions({
        transaction_type: 'expense',
        order_by: 'amount',
        order_dir: 'desc',
        limit: 8
      })
    ])
      .then(([s, c, t, d, b, txs]) => {
        if (!isMounted) return;
        setSummary(s);
        setCategories(c.categories);
        setTrends(t);
        setDailyData(d);
        setBreakdown(b);
        setLargestTransactions(txs);
      })
      .catch(err => console.error('Failed to load analytics:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedMonth, selectedYear, refreshCount]);

  const essentialPieData = breakdown ? [
    { name: 'Essential (Needs)', value: breakdown.essential_amount, color: '#0d9488' },
    { name: 'Discretionary (Wants)', value: breakdown.discretionary_amount, color: '#f59e0b' }
  ] : [];

  const fixedPieData = breakdown ? [
    { name: 'Fixed (Recurring)', value: breakdown.fixed_amount, color: '#6366f1' },
    { name: 'Variable', value: breakdown.variable_amount, color: '#3b82f6' }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h1 className="text-xl font-bold text-slate-900">Expense Analytics & Financial Insights</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          In-depth mathematical breakdown of student expenditure patterns, variance, and categories
        </p>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs fin-card">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Daily Spending</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {formatINR(summary?.avg_daily_spending)}/day
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total expenses / Days in month</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs fin-card">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Savings Rate Trend</span>
          <div className="text-2xl font-extrabold text-teal-700 mt-2">
            {summary?.savings_rate !== null && summary?.savings_rate !== undefined
              ? `${summary.savings_rate.toFixed(1)}%`
              : 'N/A'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Benchmark: 20%+ target</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs fin-card">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">MoM Spending Velocity</span>
          <div className={`text-2xl font-extrabold mt-2 ${
            (summary?.mom_expense_change_pct ?? 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
          }`}>
            {summary?.mom_expense_change_pct !== null && summary?.mom_expense_change_pct !== undefined
              ? formatPercentage(summary.mom_expense_change_pct)
              : 'Baseline'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Compared to previous month</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs fin-card">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tracked Categories</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {categories.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Active expense categories</p>
        </div>
      </div>

      {/* Dual Classification: Essential vs Discretionary & Fixed vs Variable */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Essential vs Discretionary */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Essential vs Discretionary Spending</h3>
          <p className="text-xs text-slate-500 mb-4">
            Mess, rent, books & basics vs entertainment & shopping
          </p>

          <div className="h-52 flex items-center">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie data={essentialPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                  {essentialPieData.map((e, idx) => (
                    <Cell key={idx} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatINR(Number(v))} />
              </PieChart>
            </ResponsiveContainer>

            <div className="w-1/2 space-y-2 text-xs">
              <div>
                <span className="font-semibold text-teal-800">Essential (Needs):</span>
                <div className="text-slate-900 font-bold">{formatINR(breakdown?.essential_amount)}</div>
                <div className="text-slate-500 text-[10px]">{breakdown?.essential_percentage}% of total</div>
              </div>
              <div>
                <span className="font-semibold text-amber-800">Discretionary (Wants):</span>
                <div className="text-slate-900 font-bold">{formatINR(breakdown?.discretionary_amount)}</div>
                <div className="text-slate-500 text-[10px]">{breakdown?.discretionary_percentage}% of total</div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed vs Variable */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Fixed vs Variable Outflows</h3>
          <p className="text-xs text-slate-500 mb-4">
            Recurring monthly commitments vs ad-hoc daily purchases
          </p>

          <div className="h-52 flex items-center">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie data={fixedPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                  {fixedPieData.map((e, idx) => (
                    <Cell key={idx} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatINR(Number(v))} />
              </PieChart>
            </ResponsiveContainer>

            <div className="w-1/2 space-y-2 text-xs">
              <div>
                <span className="font-semibold text-indigo-800">Fixed Commitments:</span>
                <div className="text-slate-900 font-bold">{formatINR(breakdown?.fixed_amount)}</div>
                <div className="text-slate-500 text-[10px]">{breakdown?.fixed_percentage}% of total</div>
              </div>
              <div>
                <span className="font-semibold text-blue-800">Variable Daily:</span>
                <div className="text-slate-900 font-bold">{formatINR(breakdown?.variable_amount)}</div>
                <div className="text-slate-500 text-[10px]">{breakdown?.variable_percentage}% of total</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown Table with Budget Variance */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Category Spending & Variance Matrix</h3>
        <p className="text-xs text-slate-500 mb-4">
          Detailed comparison between actual spending and planned budget allowances
        </p>

        {categories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Actual Spent</th>
                  <th className="py-2.5 px-3 text-right">Share (%)</th>
                  <th className="py-2.5 px-3 text-right">Planned Budget</th>
                  <th className="py-2.5 px-3 text-right">Variance (Actual − Budget)</th>
                  <th className="py-2.5 px-3 text-center">Tx Count</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map(c => (
                  <tr key={c.category} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{c.category}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatINR(c.actual_amount)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{c.share_percentage.toFixed(1)}%</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {c.planned_budget > 0 ? formatINR(c.planned_budget) : '—'}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${
                      c.budget_variance > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
                      {c.planned_budget > 0 ? formatINR(c.budget_variance) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-500">{c.transaction_count}</td>
                    <td className="py-2.5 px-3 text-center">
                      {c.is_overspent ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Over Budget
                        </span>
                      ) : c.planned_budget > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Within Limit
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Uncapped</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">No expense records found.</div>
        )}
      </div>

      {/* Largest Transactions Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Top Expenditures</h3>
        <p className="text-xs text-slate-500 mb-4">
          Highest individual transactions recorded on your ledger
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {largestTransactions.map(tx => (
            <div key={tx.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] text-slate-400">{formatDate(tx.date)}</div>
              <div className="text-xs font-bold text-slate-900 mt-1 truncate">{tx.description}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{tx.category}</div>
              <div className="text-base font-extrabold text-slate-900 mt-2">{formatINR(tx.amount)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
