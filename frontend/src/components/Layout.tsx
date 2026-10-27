import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  LayoutDashboard,
  Receipt,
  WalletCards,
  TrendingUp,
  Target,
  Zap,
  Sparkles,
  FileSpreadsheet,
  GraduationCap,
  Settings,
  Menu,
  X,
  Bell,
  Coins,
  PlusCircle,
  Database,
  Calendar,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export const Layout: React.FC = () => {
  const {
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    profile,
    refreshProfile,
    triggerRefresh,
    budgetAlertsCount
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const location = useLocation();

  const navItems = [
    { to: '/', label: 'Overview Dashboard', icon: LayoutDashboard },
    { to: '/transactions', label: 'Transactions', icon: Receipt },
    { to: '/budgets', label: 'Budgets', icon: WalletCards },
    { to: '/analytics', label: 'Expense Analytics', icon: TrendingUp },
    { to: '/savings', label: 'Savings Goals', icon: Target },
    { to: '/optimizer', label: 'Expense Optimizer', icon: Zap, badge: 'Core AI' },
    { to: '/forecast', label: 'Expense Forecast', icon: Sparkles, badge: 'ML' },
    { to: '/reports', label: 'Reports', icon: FileSpreadsheet },
    { to: '/project-info', label: 'Project Info', icon: GraduationCap },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const months = [
    { num: 1, name: 'January' },
    { num: 2, name: 'February' },
    { num: 3, name: 'March' },
    { num: 4, name: 'April' },
    { num: 5, name: 'May' },
    { num: 6, name: 'June' },
    { num: 7, name: 'July' },
    { num: 8, name: 'August' },
    { num: 9, name: 'September' },
    { num: 10, name: 'October' },
    { num: 11, name: 'November' },
    { num: 12, name: 'December' },
  ];

  const handleQuickLoadDemo = async () => {
    setLoadingDemo(true);
    try {
      await api.loadDemo();
      await refreshProfile();
      triggerRefresh();
    } catch (err: any) {
      alert(err.message || 'Error loading demo data');
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <NavLink to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-xs">
                <Coins className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  Student <span className="text-teal-600">Expense</span>
                </span>
                <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Optimizer
                </span>
              </div>
            </NavLink>
          </div>

          {/* Center: Month & Year Selector */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-teal-600" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(parseInt(e.target.value, 10))}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              {months.map(m => (
                <option key={m.num} value={m.num}>{m.name}</option>
              ))}
            </select>
            <span className="text-slate-400">/</span>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleQuickLoadDemo}
              disabled={loadingDemo}
              title="Reload realistic 90-day student demo dataset"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-100 transition cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-teal-600" />
              <span>{loadingDemo ? 'Loading...' : 'Load Demo Data'}</span>
            </button>

            {/* Profile Avatar / Name */}
            <NavLink
              to="/settings"
              className="flex items-center gap-2 pl-2 pr-3 py-1 bg-slate-100 hover:bg-slate-200/80 rounded-full transition"
            >
              <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">
                {profile?.student_name ? profile.student_name[0] : 'S'}
              </div>
              <span className="text-xs font-medium text-slate-800 hidden sm:inline max-w-[120px] truncate">
                {profile?.student_name || 'Student Profile'}
              </span>
            </NavLink>
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Financial Suite
            </div>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-teal-50 text-teal-700 border border-teal-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}

            {/* Academic Tag */}
            <div className="pt-4 mt-4 border-t border-slate-100 px-3">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-center">
                <span className="text-[11px] font-semibold text-slate-700 block">
                  Academic Prototype
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  ML Forecasting & Optimization
                </span>
                <div className="mt-2 text-[10px] text-teal-700 font-medium bg-teal-50 py-1 rounded-md">
                  Currency: INR (₹)
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[80%] bg-white p-5 flex flex-col shadow-2xl z-10 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="font-bold text-slate-900 text-sm">Navigation Menu</div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Month Picker */}
              <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-semibold">
                <span>Month:</span>
                <div className="flex items-center gap-1">
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(parseInt(e.target.value, 10))}
                    className="bg-transparent font-semibold"
                  >
                    {months.map(m => (
                      <option key={m.num} value={m.num}>{m.name}</option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
                    className="bg-transparent font-semibold"
                  >
                    {[2024, 2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1 overflow-y-auto flex-1">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium ${
                        isActive
                          ? 'bg-teal-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Content View */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
