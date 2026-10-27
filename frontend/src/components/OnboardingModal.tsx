import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2, RotateCcw } from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const { showOnboarding, setShowOnboarding, refreshProfile, triggerRefresh } = useApp();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    student_name: 'Aarav Sharma',
    monthly_allowance: 15000,
    part_time_income: 3000,
    scholarship_income: 0,
    monthly_savings_target: 2500,
    living_arrangement: 'hostel',
    fixed_monthly_expenses: 3800
  });

  if (!showOnboarding) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateProfile({
        ...formData,
        is_onboarded: true
      });
      await refreshProfile();
      triggerRefresh();
      setShowOnboarding(false);
    } catch (err: any) {
      alert(err.message || 'Error saving profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemo = async () => {
    setLoading(true);
    try {
      await api.loadDemo();
      await refreshProfile();
      triggerRefresh();
      setShowOnboarding(false);
    } catch (err: any) {
      alert(err.message || 'Error loading demo data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartFresh = async () => {
    setLoading(true);
    try {
      await api.resetAll();
      await api.updateProfile({ is_onboarded: true });
      await refreshProfile();
      triggerRefresh();
      setShowOnboarding(false);
    } catch (err: any) {
      alert(err.message || 'Error initializing clean account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 sm:p-8 overflow-y-auto max-h-[90vh] border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Welcome to Student Expense Optimizer</h2>
            <p className="text-sm text-slate-500">Configure your student financial profile or load sample records</p>
          </div>
        </div>

        {/* Quick Demo Option Banner */}
        <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-4 mb-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-teal-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Want an instant demonstration?
              </h4>
              <p className="text-xs text-teal-700 mt-1">
                Load 90 days of realistic student spending, active category budgets, and savings goals to immediately test charts, optimizer suggestions, and ML forecasts.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLoadDemo}
              disabled={loading}
              className="shrink-0 px-3.5 py-2 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition flex items-center gap-1 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Demo Data
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Student / Display Name</label>
              <input
                type="text"
                required
                value={formData.student_name}
                onChange={e => setFormData({ ...formData, student_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Living Arrangement</label>
              <select
                value={formData.living_arrangement}
                onChange={e => setFormData({ ...formData, living_arrangement: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Part-Time / Stipend Income (₹)</label>
              <input
                type="number"
                min="0"
                step="100"
                value={formData.part_time_income}
                onChange={e => setFormData({ ...formData, part_time_income: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Monthly Savings Target (₹)</label>
              <input
                type="number"
                min="0"
                step="100"
                value={formData.monthly_savings_target}
                onChange={e => setFormData({ ...formData, monthly_savings_target: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Fixed Monthly Outflows (₹)</label>
              <input
                type="number"
                min="0"
                step="100"
                value={formData.fixed_monthly_expenses}
                onChange={e => setFormData({ ...formData, fixed_monthly_expenses: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleStartFresh}
              disabled={loading}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Start Completely Fresh (Empty)
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Save & Open Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
