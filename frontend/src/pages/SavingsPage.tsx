import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { SavingsGoal, SavingsGoalCreate } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import {
  Target,
  Plus,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Trash2,
  Edit3,
  Coins,
  History
} from 'lucide-react';

export const SavingsPage: React.FC = () => {
  const { refreshCount, triggerRefresh } = useApp();

  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // Goal Create/Edit Modal
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [formData, setFormData] = useState<SavingsGoalCreate>({
    name: 'Emergency Fund',
    target_amount: 15000,
    current_saved: 0,
    target_date: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    description: ''
  });

  // Contribute Modal
  const [contributeGoal, setContributeGoal] = useState<SavingsGoal | null>(null);
  const [contribAmount, setContribAmount] = useState('');
  const [contribNote, setContribNote] = useState('');
  const [isWithdrawal, setIsWithdrawal] = useState(false);

  // History Drawer Modal
  const [historyGoal, setHistoryGoal] = useState<SavingsGoal | null>(null);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const data = await api.getSavingsGoals();
      setGoals(data);
    } catch (err) {
      console.error('Failed to fetch savings goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [refreshCount]);

  const handleOpenCreate = () => {
    setEditingGoal(null);
    setFormData({
      name: 'Emergency Fund',
      target_amount: 15000,
      current_saved: 0,
      target_date: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      description: ''
    });
    setGoalModalOpen(true);
  };

  const handleOpenEdit = (g: SavingsGoal) => {
    setEditingGoal(g);
    setFormData({
      name: g.name,
      target_amount: g.target_amount,
      current_saved: g.current_saved,
      target_date: g.target_date,
      description: g.description || ''
    });
    setGoalModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGoal) {
        await api.updateSavingsGoal(editingGoal.id, formData);
      } else {
        await api.createSavingsGoal(formData);
      }
      setGoalModalOpen(false);
      triggerRefresh();
    } catch (err: any) {
      alert(err.message || 'Error saving savings goal');
    }
  };

  const handleDeleteGoal = async (id: number) => {
    if (!confirm('Are you sure you want to delete this savings goal?')) return;
    try {
      await api.deleteSavingsGoal(id);
      triggerRefresh();
    } catch (err: any) {
      alert(err.message || 'Error deleting goal');
    }
  };

  const handleRecordContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeGoal) return;
    const num = parseFloat(contribAmount);
    if (!num || num <= 0) return alert('Please enter a positive amount');

    const finalAmount = isWithdrawal ? -num : num;
    try {
      await api.recordContribution(contributeGoal.id, {
        date: new Date().toISOString().split('T')[0],
        amount: finalAmount,
        note: contribNote || (isWithdrawal ? 'Withdrawal' : 'Deposit')
      });
      setContributeGoal(null);
      setContribAmount('');
      setContribNote('');
      setIsWithdrawal(false);
      triggerRefresh();
    } catch (err: any) {
      alert(err.message || 'Error recording contribution');
    }
  };

  const totalSavedAcrossGoals = goals.reduce((acc, g) => acc + g.current_saved, 0);
  const totalTargetAcrossGoals = goals.reduce((acc, g) => acc + g.target_amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Savings Goals Tracker</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Define target milestones, calculate required monthly deposits, and monitor goal progress
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Savings Goal
        </button>
      </div>

      {/* Aggregate Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Saved</span>
          <div className="text-2xl font-extrabold text-teal-700 mt-1">{formatINR(totalSavedAcrossGoals)}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Aggregate Target</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{formatINR(totalTargetAcrossGoals)}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Goals</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{goals.length}</div>
        </div>
      </div>

      {/* Goals Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading savings goals...</div>
      ) : goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(g => {
            const isCompleted = g.progress_percentage >= 100;

            return (
              <div
                key={g.id}
                className={`bg-white p-5 rounded-2xl border transition shadow-2xs fin-card ${
                  g.is_at_risk ? 'border-amber-300 ring-1 ring-amber-100' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{g.name}</h3>
                    {g.description && <p className="text-xs text-slate-500 mt-0.5">{g.description}</p>}
                  </div>
                  {isCompleted ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Completed
                    </span>
                  ) : g.is_at_risk ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Overdue Target
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                      On Track
                    </span>
                  )}
                </div>

                {/* Progress Stats */}
                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-500">Saved: </span>
                    <span className="font-extrabold text-slate-900 text-lg">{formatINR(g.current_saved)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500">Target: </span>
                    <span className="font-semibold text-slate-700 text-sm">{formatINR(g.target_amount)}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-3 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-teal-600'
                    }`}
                    style={{ width: `${Math.min(100, g.progress_percentage)}%` }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                  <span>Progress: <strong className="text-slate-900">{g.progress_percentage.toFixed(1)}%</strong></span>
                  <span>Target Date: <strong className="text-slate-900">{formatDate(g.target_date)}</strong></span>
                </div>

                {/* Mathematical Requirement Formula Callout */}
                {!isCompleted && (
                  <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-slate-500">Required: </span>
                      <span className="font-bold text-teal-700">{formatINR(g.required_monthly_savings)}/month</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {g.months_remaining > 0 ? `${g.months_remaining} months left` : 'Due this month'}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setContributeGoal(g)}
                      className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold rounded-lg flex items-center gap-1 transition"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      Deposit / Withdraw
                    </button>
                    <button
                      onClick={() => setHistoryGoal(g)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg flex items-center gap-1 transition"
                    >
                      <History className="w-3.5 h-3.5" />
                      Ledger ({g.contributions.length})
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(g)}
                      className="p-1.5 rounded text-slate-400 hover:text-teal-600 hover:bg-slate-100"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(g.id)}
                      className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
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
          No savings goals created yet. Click "Create Savings Goal" to set a milestone.
        </div>
      )}

      {/* Goal Create / Edit Modal */}
      {goalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingGoal ? 'Edit Savings Goal' : 'Create New Savings Goal'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Set target amount and completion deadline</p>

            <form onSubmit={handleSaveGoal} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Goal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Laptop Upgrade / Emergency Fund"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Target Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    step="100"
                    required
                    value={formData.target_amount}
                    onChange={e => setFormData({ ...formData, target_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Starting Saved (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    disabled={!!editingGoal}
                    value={formData.current_saved}
                    onChange={e => setFormData({ ...formData, current_saved: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Target Date</label>
                <input
                  type="date"
                  required
                  value={formData.target_date}
                  onChange={e => setFormData({ ...formData, target_date: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGoalModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribution / Withdrawal Modal */}
      {contributeGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {isWithdrawal ? 'Withdraw Funds' : 'Deposit Savings'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">{contributeGoal.name}</p>

            <form onSubmit={handleRecordContribution} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawal(false)}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                    !isWithdrawal ? 'bg-teal-50 text-teal-700 border-teal-300' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  Deposit (+)
                </button>
                <button
                  type="button"
                  onClick={() => setIsWithdrawal(true)}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                    isWithdrawal ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  Withdraw (−)
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  step="10"
                  required
                  placeholder="500"
                  value={contribAmount}
                  onChange={e => setContribAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Allowance surplus transfer"
                  value={contribNote}
                  onChange={e => setContribNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setContributeGoal(null)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                >
                  Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Ledger Modal */}
      {historyGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 max-h-[85vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">{historyGoal.name} — Contribution Ledger</h3>
            <p className="text-xs text-slate-500 mb-4">Complete chronological deposit and withdrawal records</p>

            {historyGoal.contributions?.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Note</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyGoal.contributions.map(c => (
                      <tr key={c.id}>
                        <td className="p-2.5 text-slate-600">{formatDate(c.date)}</td>
                        <td className="p-2.5 font-medium text-slate-800">{c.note || 'Transfer'}</td>
                        <td className={`p-2.5 text-right font-bold ${c.amount >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>
                          {c.amount >= 0 ? '+' : ''}{formatINR(c.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">No contributions recorded yet.</div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setHistoryGoal(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
