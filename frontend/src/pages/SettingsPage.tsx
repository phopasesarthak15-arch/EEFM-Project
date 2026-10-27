import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Profile } from '../types';
import { formatINR } from '../utils/formatters';
import {
  Settings,
  Save,
  Database,
  Trash2,
  RotateCcw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { profile, refreshProfile, triggerRefresh } = useApp();

  const [formData, setFormData] = useState({
    student_name: '',
    monthly_allowance: 15000,
    part_time_income: 3000,
    scholarship_income: 0,
    monthly_savings_target: 2500,
    living_arrangement: 'hostel',
    fixed_monthly_expenses: 3800,
    currency: 'INR'
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        student_name: profile.student_name,
        monthly_allowance: profile.monthly_allowance,
        part_time_income: profile.part_time_income,
        scholarship_income: profile.scholarship_income,
        monthly_savings_target: profile.monthly_savings_target,
        living_arrangement: profile.living_arrangement,
        fixed_monthly_expenses: profile.fixed_monthly_expenses,
        currency: profile.currency || 'INR'
      });
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      await api.updateProfile(formData);
      await refreshProfile();
      triggerRefresh();
      setSuccessMsg('Profile settings saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLoadDemo = async () => {
    setSaving(true);
    try {
      const res = await api.loadDemo();
      await refreshProfile();
      triggerRefresh();
      alert(res.message);
    } catch (err: any) {
      alert(err.message || 'Error loading demo data');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemo = async () => {
    if (!confirm('Remove only synthetic demo records? User-created transactions will remain.')) return;
    setSaving(true);
    try {
      const res = await api.resetDemo();
      await refreshProfile();
      triggerRefresh();
      alert(res.message);
    } catch (err: any) {
      alert(err.message || 'Error clearing demo records');
    } finally {
      setSaving(false);
    }
  };

  const handleClearAll = async () => {
    setSaving(true);
    try {
      const res = await api.resetAll();
      await refreshProfile();
      triggerRefresh();
      setConfirmClearOpen(false);
      alert('All transactions, budgets, and savings goals cleared. Application reset to clean empty state.');
    } catch (err: any) {
      alert(err.message || 'Error resetting database');
    } finally {
      setSaving(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      const txs = await api.getTransactions({ limit: 500 });
      const bgs = await api.getBudgets();
      const gls = await api.getSavingsGoals();

      const backup = {
        exported_at: new Date().toISOString(),
        profile,
        transactions: txs,
        budgets: bgs,
        savings_goals: gls
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `student_expense_optimizer_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Error exporting backup');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h1 className="text-xl font-bold text-slate-900">Settings & Data Management</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure financial baselines, currency preferences, and demo database state
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Settings className="w-4 h-4 text-teal-600" />
          <h2 className="text-sm font-bold text-slate-900">Financial Profile & Income Assumptions</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Display Name</label>
              <input
                type="text"
                required
                value={formData.student_name}
                onChange={e => setFormData({ ...formData, student_name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Living Arrangement</label>
              <select
                value={formData.living_arrangement}
                onChange={e => setFormData({ ...formData, living_arrangement: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="hostel">College Hostel</option>
                <option value="with family">Living With Family</option>
                <option value="rented accommodation">Rented Accommodation / PG</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Monthly Pocket Money / Allowance (₹)</label>
              <input
                type="number"
                min="0"
                step="100"
                required
                value={formData.monthly_allowance}
                onChange={e => setFormData({ ...formData, monthly_allowance: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Part-Time / Freelance Income (₹)</label>
              <input
                type="number"
                min="0"
                step="100"
                value={formData.part_time_income}
                onChange={e => setFormData({ ...formData, part_time_income: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Scholarship / Grants (₹)</label>
              <input
                type="number"
                min="0"
                step="100"
                value={formData.scholarship_income}
                onChange={e => setFormData({ ...formData, scholarship_income: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Monthly Savings Goal Target (₹)</label>
              <input
                type="number"
                min="0"
                step="100"
                value={formData.monthly_savings_target}
                onChange={e => setFormData({ ...formData, monthly_savings_target: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Estimated Fixed Monthly Outflows (₹)</label>
              <input
                type="number"
                min="0"
                step="100"
                value={formData.fixed_monthly_expenses}
                onChange={e => setFormData({ ...formData, fixed_monthly_expenses: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Application Currency</label>
              <input
                type="text"
                disabled
                value="Indian Rupee (INR, ₹)"
                className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-100 rounded-lg text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Demonstration Data & Database Management */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Database className="w-4 h-4 text-teal-600" />
          <h2 className="text-sm font-bold text-slate-900">Dataset & Persistence Operations</h2>
        </div>

        <div className="space-y-4 text-xs text-slate-600">
          {/* Load Demo Data Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <strong className="text-slate-900 block text-xs">Load Realistic Student Demo Dataset</strong>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Generates 90 days of reproducible synthetic student transactions, budgets, and savings goals for instant demonstration.
              </p>
            </div>
            <button
              onClick={handleLoadDemo}
              disabled={saving}
              className="px-3.5 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Demo Dataset
            </button>
          </div>

          {/* Reset Demo Data Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <strong className="text-slate-900 block text-xs">Clear Only Demo Records</strong>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Removes all synthetic records (<code>is_demo = true</code>) while safely keeping your personal manual transactions intact.
              </p>
            </div>
            <button
              onClick={handleResetDemo}
              disabled={saving}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition shrink-0 cursor-pointer"
            >
              Clear Demo Data
            </button>
          </div>

          {/* Export JSON Backup */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <strong className="text-slate-900 block text-xs">Export Complete JSON Backup</strong>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Download all profile parameters, transaction ledgers, budgets, and savings goals in JSON format.
              </p>
            </div>
            <button
              onClick={handleExportJSON}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download JSON
            </button>
          </div>

          {/* Danger Zone: Start Fresh / Reset All */}
          <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <strong className="text-rose-900 block text-xs flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Start Fresh (Factory Reset Database)
              </strong>
              <p className="text-rose-700 text-[11px] mt-0.5">
                Clears all records from SQLite database to start completely empty. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setConfirmClearOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition shadow-xs shrink-0 cursor-pointer"
            >
              Reset All Data
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Reset Dialog */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-200 space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              Confirm Database Reset
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete all transactions, budgets, goals, and history? You will begin with a completely empty ledger.
            </p>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmClearOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 rounded-lg"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
