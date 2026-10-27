import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Budget, BudgetCreate, EXPENSE_CATEGORIES } from '../types';
import { formatINR } from '../utils/formatters';
import {
  WalletCards,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  AlertCircle,
  HelpCircle,
  Layers
} from 'lucide-react';

export const BudgetsPage: React.FC = () => {
  const { selectedMonth, selectedYear, refreshCount, triggerRefresh } = useApp();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState<BudgetCreate>({
    category: 'Food and Mess',
    planned_amount: 3000,
    month: selectedMonth,
    year: selectedYear,
    description: ''
  });

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const data = await api.getBudgets(selectedMonth, selectedYear);
      setBudgets(data);
    } catch (err) {
      console.error('Failed to fetch budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth, selectedYear, refreshCount]);

  const handleOpenCreate = () => {
    setEditingBudget(null);
    setFormData({
      category: 'Food and Mess',
      planned_amount: 3000,
      month: selectedMonth,
      year: selectedYear,
      description: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (b: Budget) => {
    setEditingBudget(b);
    setFormData({
      category: b.category,
      planned_amount: b.planned_amount,
      month: b.month,
      year: b.year,
      description: b.description || ''
    });
    setModalOpen(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBudget) {
        await api.updateBudget(editingBudget.id, {
          planned_amount: formData.planned_amount,
          description: formData.description
        });
      } else {
        await api.createBudget({
          ...formData,
          month: selectedMonth,
          year: selectedYear
        });
      }
      setModalOpen(false);
      triggerRefresh();
    } catch (err: any) {
      alert(err.message || 'Error saving budget');
    }
  };

  const handleDeleteBudget = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category budget?')) return;
    try {
      await api.deleteBudget(id);
      triggerRefresh();
    } catch (err: any) {
      alert(err.message || 'Error deleting budget');
    }
  };

  const totalPlanned = budgets.reduce((acc, b) => acc + b.planned_amount, 0);
  const totalActual = budgets.reduce((acc, b) => acc + b.actual_spending, 0);
  const totalRemaining = totalPlanned - totalActual;
  const overallUtil = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;
  const overspentCount = budgets.filter(b => b.status === 'overspent').length;

  const getStatusBadge = (status: Budget['status']) => {
    switch (status) {
      case 'on_track':
        return { label: 'On Track', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'approaching':
        return { label: 'Approaching Limit', class: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'near_limit':
        return { label: 'Near / At Limit', class: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'overspent':
        return { label: 'Overspent', class: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
  };

  const getProgressBarColor = (status: Budget['status']) => {
    switch (status) {
      case 'on_track': return 'bg-emerald-500';
      case 'approaching': return 'bg-teal-500';
      case 'near_limit': return 'bg-amber-500';
      case 'overspent': return 'bg-rose-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Budget Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Set and track monthly category caps with automated spending status alerts
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Category Budget
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Planned</span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{formatINR(totalPlanned)}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actual Spent</span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{formatINR(totalActual)}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Remaining Buffer</span>
          <div className={`text-xl font-extrabold mt-1 ${totalRemaining >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>
            {formatINR(totalRemaining)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Utilization</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-extrabold text-slate-900">{overallUtil.toFixed(1)}%</span>
            {overspentCount > 0 && (
              <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-1.5 py-0.5 rounded border border-rose-200">
                {overspentCount} Overspent
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Thresholds Explanation Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="text-xs font-bold text-slate-700 mb-2">Academic Budget Adherence Thresholds:</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2 bg-emerald-50/70 border border-emerald-100 rounded-lg">
            <span className="font-bold text-emerald-800">&lt; 75%:</span> <span className="text-emerald-700">On Track</span>
          </div>
          <div className="p-2 bg-teal-50/70 border border-teal-100 rounded-lg">
            <span className="font-bold text-teal-800">75% - 89%:</span> <span className="text-teal-700">Approaching Limit</span>
          </div>
          <div className="p-2 bg-amber-50/70 border border-amber-100 rounded-lg">
            <span className="font-bold text-amber-800">90% - 100%:</span> <span className="text-amber-700">Near / At Limit</span>
          </div>
          <div className="p-2 bg-rose-50/70 border border-rose-100 rounded-lg">
            <span className="font-bold text-rose-800">&gt; 100%:</span> <span className="text-rose-700">Overspent</span>
          </div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading budgets...</div>
      ) : budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map(b => {
            const badge = getStatusBadge(b.status);
            const progressColor = getProgressBarColor(b.status);
            const progressWidth = Math.min(100, b.utilization_percentage);

            return (
              <div
                key={b.id}
                className={`bg-white p-5 rounded-2xl border transition shadow-2xs fin-card ${
                  b.status === 'overspent' ? 'border-rose-300 ring-1 ring-rose-100' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{b.category}</h3>
                    {b.description && (
                      <p className="text-xs text-slate-400 mt-0.5">{b.description}</p>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.class}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Numbers */}
                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-500">Spent: </span>
                    <span className="font-bold text-slate-900 text-sm">{formatINR(b.actual_spending)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500">Budget: </span>
                    <span className="font-semibold text-slate-700 text-xs">{formatINR(b.planned_amount)}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                    style={{ width: `${progressWidth}%` }}
                  />
                </div>

                {/* Footer stats & actions */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Remaining: </span>
                    <span className={`font-bold ${b.remaining_amount >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>
                      {formatINR(b.remaining_amount)}
                    </span>
                    <span className="text-slate-400 ml-1.5">({b.utilization_percentage.toFixed(0)}%)</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(b)}
                      title="Edit Budget"
                      className="p-1 rounded text-slate-400 hover:text-teal-600 hover:bg-slate-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBudget(b.id)}
                      title="Delete Budget"
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400 shadow-2xs">
          No category budgets configured for {selectedMonth}/{selectedYear}. Click "Add Category Budget" to allocate funds.
        </div>
      )}

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingBudget ? 'Edit Budget' : 'Add Category Budget'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Allocate planned spending cap for {selectedMonth}/{selectedYear}
            </p>

            <form onSubmit={handleSaveBudget} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                <select
                  disabled={!!editingBudget}
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-100"
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Planned Monthly Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  step="50"
                  required
                  value={formData.planned_amount}
                  onChange={e => setFormData({ ...formData, planned_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description / Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Canteen lunch limit"
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
