import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  FinancialSummary,
  CategorySpendingItem,
  SpendingTrendItem,
  DailySpendingItem,
  Transaction,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES
} from '../types';
import { formatINR, formatPercentage, formatDate } from '../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  PieChart as PieIcon,
  ShieldCheck,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Receipt,
  Layers,
  ChevronRight
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { Link } from 'react-router-dom';

const CATEGORY_COLORS = [
  '#0d9488', '#059669', '#3b82f6', '#6366f1', '#8b5cf6',
  '#ec4899', '#f59e0b', '#10b981', '#14b8a6', '#f97316',
  '#64748b', '#0284c7'
];

export const DashboardPage: React.FC = () => {
  const { selectedMonth, selectedYear, refreshCount, triggerRefresh } = useApp();

  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [categories, setCategories] = useState<CategorySpendingItem[]>([]);
  const [trends, setTrends] = useState<SpendingTrendItem[]>([]);
  const [dailyData, setDailyData] = useState<DailySpendingItem[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Action Modal States
  const [modalType, setModalType] = useState<'expense' | 'income' | null>(null);
  const [txForm, setTxForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    category: 'Food and Mess',
    payment_method: 'UPI',
    notes: '',
    is_recurring: false
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      api.getSummary(selectedMonth, selectedYear),
      api.getCategories(selectedMonth, selectedYear),
      api.getTrends(6),
      api.getDailySpending(selectedMonth, selectedYear),
      api.getTransactions({ limit: 6 })
    ])
      .then(([sData, cData, tData, dData, txData]) => {
        if (!isMounted) return;
        setSummary(sData);
        setCategories(cData.categories);
        setTrends(tData);
        setDailyData(dData);
        setRecentTransactions(txData);
      })
      .catch(err => {
        console.error('Failed to load dashboard data:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedMonth, selectedYear, refreshCount]);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalType) return;
    setSubmitting(true);
    try {
      await api.createTransaction({
        date: txForm.date,
        description: txForm.description,
        amount: parseFloat(txForm.amount),
        transaction_type: modalType,
        category: txForm.category,
        payment_method: txForm.payment_method,
        notes: txForm.notes || undefined,
        is_recurring: txForm.is_recurring
      });
      setModalType(null);
      setTxForm({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        category: 'Food and Mess',
        payment_method: 'UPI',
        notes: '',
        is_recurring: false
      });
      triggerRefresh();
    } catch (err: any) {
      alert(err.message || 'Error recording transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const donutData = categories.map((c, i) => ({
    name: c.category,
    value: c.actual_amount,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
  }));

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'Excellent':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Good':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Fair':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Overview Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time financial performance and budget adherence indicators
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setModalType('expense');
              setTxForm(prev => ({ ...prev, category: 'Food and Mess' }));
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-rose-600" />
            Add Expense
          </button>
          <button
            onClick={() => {
              setModalType('income');
              setTxForm(prev => ({ ...prev, category: 'Pocket Money' }));
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            Add Income
          </button>
          <Link
            to="/optimizer"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 text-white hover:bg-teal-700 text-xs font-semibold rounded-xl transition cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Optimizer
          </Link>
        </div>
      </div>

      {/* 4 Core Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs fin-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Income</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {formatINR(summary?.total_income)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
              <span>Recorded student inflows</span>
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs fin-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Expenses</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {formatINR(summary?.total_expenses)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
              {summary?.mom_expense_change_pct !== null && summary?.mom_expense_change_pct !== undefined ? (
                <span className={`font-semibold ${summary.mom_expense_change_pct > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatPercentage(summary.mom_expense_change_pct)} MoM
                </span>
              ) : (
                <span>First month baseline</span>
              )}
            </div>
          </div>
        </div>

        {/* Net Savings & Savings Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs fin-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Savings</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-extrabold ${(summary?.net_savings ?? 0) >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>
              {formatINR(summary?.net_savings)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
              <span>Savings Rate:</span>
              <span className="font-bold text-slate-700">
                {summary?.savings_rate !== null && summary?.savings_rate !== undefined
                  ? `${summary.savings_rate.toFixed(1)}%`
                  : 'N/A (No income)'}
              </span>
            </div>
          </div>
        </div>

        {/* Remaining Budget & Utilization */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs fin-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Budget Status</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-extrabold ${(summary?.remaining_budget ?? 0) >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              {formatINR(summary?.remaining_budget)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
              <span>Utilization:</span>
              <span className="font-bold text-slate-700">
                {summary?.overall_budget_utilization !== null && summary?.overall_budget_utilization !== undefined
                  ? `${summary.overall_budget_utilization.toFixed(1)}%`
                  : 'No budgets'}
              </span>
              {(summary?.remaining_budget ?? 0) < 0 && (
                <span className="text-rose-600 font-bold ml-1">(Overspent)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Health Summary Scorecard */}
      {summary && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0">
                <span className="text-2xl font-black text-teal-300">
                  {summary.financial_health_score}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">Financial Health Assessment</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getHealthBadge(summary.financial_health_status)}`}>
                    {summary.financial_health_status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Academic index evaluating savings rate, budget variance, and spending velocity (Non-commercial metric)
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-300 border-l border-slate-700/60 pl-4 space-y-1">
              {summary.health_factors.slice(0, 2).map((factor, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                  <span>{factor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Visual Analytics Grid: Donut + Income vs Expense Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category Donut */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Spending by Category</h3>
              <p className="text-xs text-slate-500">Breakdown of current monthly expenditures</p>
            </div>
            <Link to="/analytics" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {donutData.length > 0 ? (
            <div className="h-64 flex flex-col sm:flex-row items-center">
              <div className="w-full sm:w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => formatINR(Number(value))}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Category Legend list */}
              <div className="w-full sm:w-1/2 max-h-56 overflow-y-auto space-y-1.5 pr-2">
                {categories.slice(0, 6).map((c, idx) => (
                  <div key={c.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate max-w-[130px]">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                      />
                      <span className="text-slate-700 truncate">{c.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-slate-900">{formatINR(c.actual_amount)}</span>
                      <span className="text-[10px] text-slate-400 ml-1">({c.share_percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <PieIcon className="w-8 h-8 mb-2 stroke-1 text-slate-300" />
              <span>No expense records for this month</span>
            </div>
          )}
        </div>

        {/* 6-Month Income vs Expense Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Income vs Expenses (6 Months)</h3>
              <p className="text-xs text-slate-500">Historical cash-flow trajectory</p>
            </div>
            <Link to="/analytics" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center">
              Trends <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month_label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
                <Tooltip
                  formatter={(val: any) => formatINR(Number(val))}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="income" name="Income" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Daily Spending Trend Line Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Daily Spending Velocity</h3>
            <p className="text-xs text-slate-500">Cumulative expenditure throughout the month</p>
          </div>
          <div className="text-xs font-semibold text-slate-700">
            Avg Daily: <span className="text-teal-600 font-bold">{formatINR(summary?.avg_daily_spending)}/day</span>
          </div>
        </div>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip
                formatter={(val: any) => formatINR(Number(val))}
                labelFormatter={d => `Day ${d}`}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Line
                type="monotone"
                dataKey="daily_amount"
                name="Daily Spent"
                stroke="#0d9488"
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions Table Preview */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Transactions</h3>
            <p className="text-xs text-slate-500">Latest activity recorded on your ledger</p>
          </div>
          <Link to="/transactions" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center">
            View All Ledger <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 text-slate-600 font-medium whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {tx.description}
                      {tx.is_recurring && (
                        <span className="ml-1.5 text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">Recurring</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{tx.payment_method}</td>
                    <td className={`py-2.5 px-3 text-right font-bold whitespace-nowrap ${
                      tx.transaction_type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                    }`}>
                      {tx.transaction_type === 'income' ? '+' : '-'}{formatINR(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            No transactions found. Click "Add Expense" or "Load Demo Data" above.
          </div>
        )}
      </div>

      {/* Quick Transaction Modal Dialog */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Add {modalType === 'expense' ? 'Expense' : 'Income'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Record a new student financial transaction
            </p>

            <form onSubmit={handleCreateTransaction} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={txForm.date}
                  onChange={e => setTxForm({ ...txForm, date: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description / Merchant</label>
                <input
                  type="text"
                  required
                  placeholder={modalType === 'expense' ? 'e.g., Campus Mess Lunch' : 'e.g., Monthly Family Pocket Money'}
                  value={txForm.description}
                  onChange={e => setTxForm({ ...txForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    placeholder="250.00"
                    value={txForm.amount}
                    onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={txForm.category}
                    onChange={e => setTxForm({ ...txForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {(modalType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={txForm.payment_method}
                    onChange={e => setTxForm({ ...txForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={txForm.is_recurring}
                      onChange={e => setTxForm({ ...txForm, is_recurring: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Monthly recurring</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
