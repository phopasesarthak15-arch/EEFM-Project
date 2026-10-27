import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { OptimizerRecommendation } from '../types';
import { formatINR } from '../utils/formatters';
import {
  Zap,
  CheckCircle,
  XCircle,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Layers,
  AlertTriangle,
  Info,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';

export const OptimizerPage: React.FC = () => {
  const { selectedMonth, selectedYear, refreshCount, triggerRefresh } = useApp();

  const [recommendations, setRecommendations] = useState<OptimizerRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'reviewed' | 'dismissed'>('active');

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const data = await api.getRecommendations(selectedMonth, selectedYear, true);
      setRecommendations(data);
    } catch (err) {
      console.error('Failed to load optimizer recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [selectedMonth, selectedYear, refreshCount]);

  const handleUpdateStatus = async (rule_key: string, newStatus: string) => {
    try {
      await api.updateOptimizerStatus(rule_key, newStatus);
      fetchRecommendations();
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  const handleApplyBudget = async (rec: OptimizerRecommendation) => {
    if (!rec.proposed_budget_change) return;
    const { category, proposed_budget } = rec.proposed_budget_change;

    if (!confirm(`Apply budget update for '${category}' to ₹${proposed_budget.toLocaleString('en-IN')} for ${selectedMonth}/${selectedYear}?`)) {
      return;
    }

    try {
      const res = await api.applyProposedBudget(category, proposed_budget, selectedMonth, selectedYear);
      alert(res.message);
      await api.updateOptimizerStatus(rec.rule_key, 'reviewed');
      triggerRefresh();
    } catch (err: any) {
      alert(err.message || 'Error applying proposed budget');
    }
  };

  const filteredRecs = recommendations.filter(r => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  const activeRecs = recommendations.filter(r => r.status === 'active');
  const estimatedTotalPotentialSavings = activeRecs.reduce((acc, r) => acc + (r.estimated_potential_monthly_savings || 0), 0);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Expense Optimizer Engine</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                  Core Project Feature
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Rule-driven financial optimization detecting leakage, duplicate debits, and surplus opportunities
              </p>
            </div>
          </div>

          <button
            onClick={fetchRecommendations}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Re-evaluate
          </button>
        </div>

        {/* Academic Disclosure Banner */}
        <div className="mt-4 p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl flex items-start gap-3">
          <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <div className="text-xs text-teal-900">
            <strong>Evidence-Based Methodology:</strong> Every suggestion below is generated from your actual recorded transactions and configured category caps. Potential savings are conservative mathematical approximations and are non-additive where category scopes overlap.
          </div>
        </div>
      </div>

      {/* KPI Highlight Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Opportunities</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{activeRecs.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Estimated Potential Savings</span>
          <div className="text-2xl font-extrabold text-teal-700 mt-1">{formatINR(estimatedTotalPotentialSavings)}/mo</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Optimization Rules</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">7 Active Rules</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs">
        <span className="font-semibold text-slate-500 mr-2">Filter Status:</span>
        <button
          onClick={() => setStatusFilter('active')}
          className={`px-3 py-1.5 rounded-lg font-bold transition ${
            statusFilter === 'active' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Active ({recommendations.filter(r => r.status === 'active').length})
        </button>
        <button
          onClick={() => setStatusFilter('reviewed')}
          className={`px-3 py-1.5 rounded-lg font-bold transition ${
            statusFilter === 'reviewed' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Reviewed ({recommendations.filter(r => r.status === 'reviewed').length})
        </button>
        <button
          onClick={() => setStatusFilter('dismissed')}
          className={`px-3 py-1.5 rounded-lg font-bold transition ${
            statusFilter === 'dismissed' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Dismissed ({recommendations.filter(r => r.status === 'dismissed').length})
        </button>
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-bold transition ${
            statusFilter === 'all' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All
        </button>
      </div>

      {/* Recommendations Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Evaluating optimization models...</div>
      ) : filteredRecs.length > 0 ? (
        <div className="space-y-4">
          {filteredRecs.map(rec => (
            <div
              key={rec.id}
              className={`bg-white rounded-2xl p-5 border transition shadow-2xs ${
                rec.status === 'dismissed' ? 'opacity-60 border-slate-200' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {rec.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getPriorityBadge(rec.priority)}`}>
                      {rec.priority} Priority
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      Confidence: {rec.confidence_level}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-2">{rec.title}</h3>
                </div>

                {rec.estimated_potential_monthly_savings && (
                  <div className="bg-teal-50 border border-teal-200 rounded-xl px-3 py-1.5 text-right shrink-0">
                    <span className="text-[10px] font-bold text-teal-800 uppercase block">Est. Savings</span>
                    <span className="text-sm font-extrabold text-teal-700">
                      ~{formatINR(rec.estimated_potential_monthly_savings)}/mo
                    </span>
                  </div>
                )}
              </div>

              {/* Pattern Explanation */}
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                {rec.pattern_explanation}
              </p>

              {/* Supporting Figures Box */}
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[11px] font-bold text-slate-700 mb-1.5">Supporting Transaction Evidence:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {Object.entries(rec.supporting_figures).map(([k, v]) => {
                    if (Array.isArray(v)) {
                      return (
                        <div key={k} className="col-span-2 sm:col-span-4 text-[11px] text-slate-600">
                          <strong>{k.replace(/_/g, ' ')}:</strong> {v.join(', ')}
                        </div>
                      );
                    }
                    return (
                      <div key={k}>
                        <span className="text-slate-400 capitalize text-[10px] block">{k.replace(/_/g, ' ')}:</span>
                        <span className="font-bold text-slate-800">
                          {typeof v === 'number' && (k.includes('amount') || k.includes('cost') || k.includes('spending') || k.includes('budget'))
                            ? formatINR(v)
                            : String(v)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Suggested Action */}
              <div className="mt-3 text-xs bg-slate-100/70 p-3 rounded-xl border border-slate-200 flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div className="text-slate-800">
                  <span className="font-bold">Recommended Action: </span>
                  {rec.suggested_action}
                </div>
              </div>

              {/* Action Controls */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  {rec.proposed_budget_change && rec.status !== 'dismissed' && (
                    <button
                      onClick={() => handleApplyBudget(rec)}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Apply Proposed Budget (₹{rec.proposed_budget_change.proposed_budget.toLocaleString('en-IN')})
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {rec.status === 'active' ? (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(rec.rule_key, 'reviewed')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1 transition"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
                        Mark Reviewed
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(rec.rule_key, 'dismissed')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 font-medium rounded-lg flex items-center gap-1 transition"
                      >
                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                        Dismiss
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(rec.rule_key, 'active')}
                      className="px-3 py-1.5 text-teal-600 hover:underline font-semibold"
                    >
                      Restore to Active
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400 shadow-2xs">
          No suggestions matching status filter '{statusFilter}'. Your finances are well balanced!
        </div>
      )}
    </div>
  );
};
