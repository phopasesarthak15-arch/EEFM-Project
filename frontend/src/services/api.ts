import {
  Profile,
  Transaction,
  TransactionCreate,
  Budget,
  BudgetCreate,
  SavingsGoal,
  SavingsGoalCreate,
  FinancialSummary,
  CategorySpendingItem,
  SpendingTrendItem,
  DailySpendingItem,
  BreakdownTypes,
  OptimizerRecommendation,
  ForecastResponse,
  ForecastEvaluation
} from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errMsg = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data && data.detail) {
        errMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      }
    } catch (_) {
      // ignore json parse error
    }
    throw new Error(errMsg);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Profile
  getProfile: (): Promise<Profile> =>
    fetch(`${API_BASE}/profile`).then(handleResponse<Profile>),

  updateProfile: (data: Partial<Profile>): Promise<Profile> =>
    fetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse<Profile>),

  // Transactions
  getTransactions: (params?: {
    start_date?: string;
    end_date?: string;
    category?: string;
    transaction_type?: string;
    search?: string;
    order_by?: string;
    order_dir?: string;
    limit?: number;
  }): Promise<Transaction[]> => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') query.append(k, String(v));
      });
    }
    return fetch(`${API_BASE}/transactions?${query.toString()}`).then(handleResponse<Transaction[]>);
  },

  createTransaction: (data: TransactionCreate): Promise<Transaction> =>
    fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse<Transaction>),

  updateTransaction: (id: number, data: Partial<TransactionCreate>): Promise<Transaction> =>
    fetch(`${API_BASE}/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse<Transaction>),

  deleteTransaction: (id: number): Promise<{ message: string; id: number }> =>
    fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' }).then(handleResponse<{ message: string; id: number }>),

  previewCSV: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE}/transactions/import-csv/preview`, {
      method: 'POST',
      body: formData,
    }).then(handleResponse<any>);
  },

  commitCSV: (rows: TransactionCreate[]) =>
    fetch(`${API_BASE}/transactions/import-csv/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows),
    }).then(handleResponse<any>),

  // Budgets
  getBudgets: (month?: number, year?: number): Promise<Budget[]> => {
    const query = new URLSearchParams();
    if (month) query.append('month', month.toString());
    if (year) query.append('year', year.toString());
    return fetch(`${API_BASE}/budgets?${query.toString()}`).then(handleResponse<Budget[]>);
  },

  createBudget: (data: BudgetCreate): Promise<Budget> =>
    fetch(`${API_BASE}/budgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse<Budget>),

  updateBudget: (id: number, data: Partial<BudgetCreate>): Promise<Budget> =>
    fetch(`${API_BASE}/budgets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse<Budget>),

  deleteBudget: (id: number): Promise<{ message: string; id: number }> =>
    fetch(`${API_BASE}/budgets/${id}`, { method: 'DELETE' }).then(handleResponse<{ message: string; id: number }>),

  // Savings Goals
  getSavingsGoals: (): Promise<SavingsGoal[]> =>
    fetch(`${API_BASE}/savings-goals`).then(handleResponse<SavingsGoal[]>),

  createSavingsGoal: (data: SavingsGoalCreate): Promise<SavingsGoal> =>
    fetch(`${API_BASE}/savings-goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse<SavingsGoal>),

  updateSavingsGoal: (id: number, data: Partial<SavingsGoalCreate>): Promise<SavingsGoal> =>
    fetch(`${API_BASE}/savings-goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse<SavingsGoal>),

  deleteSavingsGoal: (id: number): Promise<{ message: string; id: number }> =>
    fetch(`${API_BASE}/savings-goals/${id}`, { method: 'DELETE' }).then(handleResponse<{ message: string; id: number }>),

  recordContribution: (id: number, data: { date: string; amount: number; note?: string }): Promise<SavingsGoal> =>
    fetch(`${API_BASE}/savings-goals/${id}/contribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse<SavingsGoal>),

  // Analytics
  getSummary: (month: number, year: number): Promise<FinancialSummary> =>
    fetch(`${API_BASE}/analytics/summary?month=${month}&year=${year}`).then(handleResponse<FinancialSummary>),

  getCategories: (month: number, year: number): Promise<{ month: number; year: number; total_expense: number; categories: CategorySpendingItem[] }> =>
    fetch(`${API_BASE}/analytics/categories?month=${month}&year=${year}`).then(handleResponse<{ month: number; year: number; total_expense: number; categories: CategorySpendingItem[] }>),

  getTrends: (monthsCount = 6): Promise<SpendingTrendItem[]> =>
    fetch(`${API_BASE}/analytics/trends?months_count=${monthsCount}`).then(handleResponse<SpendingTrendItem[]>),

  getDailySpending: (month: number, year: number): Promise<DailySpendingItem[]> =>
    fetch(`${API_BASE}/analytics/daily-spending?month=${month}&year=${year}`).then(handleResponse<DailySpendingItem[]>),

  getBreakdownTypes: (month: number, year: number): Promise<BreakdownTypes> =>
    fetch(`${API_BASE}/analytics/breakdown-types?month=${month}&year=${year}`).then(handleResponse<BreakdownTypes>),

  // Optimizer
  getRecommendations: (month: number, year: number, includeDismissed = false): Promise<OptimizerRecommendation[]> =>
    fetch(`${API_BASE}/optimizer/recommendations?month=${month}&year=${year}&include_dismissed=${includeDismissed}`).then(handleResponse<OptimizerRecommendation[]>),

  updateOptimizerStatus: (rule_key: string, status: string): Promise<any> =>
    fetch(`${API_BASE}/optimizer/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rule_key, status }),
    }).then(handleResponse),

  applyProposedBudget: (category: string, proposed_budget: number, month: number, year: number): Promise<any> =>
    fetch(`${API_BASE}/optimizer/apply-budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, proposed_budget, month, year }),
    }).then(handleResponse),

  // Forecast
  getForecast: (): Promise<ForecastResponse> =>
    fetch(`${API_BASE}/forecast`).then(handleResponse<ForecastResponse>),

  trainForecast: (): Promise<ForecastResponse> =>
    fetch(`${API_BASE}/forecast/train`, { method: 'POST' }).then(handleResponse<ForecastResponse>),

  getEvaluation: (): Promise<ForecastEvaluation> =>
    fetch(`${API_BASE}/forecast/evaluation`).then(handleResponse<ForecastEvaluation>),

  // Demo
  loadDemo: (): Promise<{ status: string; message: string; transactions_generated: number }> =>
    fetch(`${API_BASE}/demo/load`, { method: 'POST' }).then(handleResponse<{ status: string; message: string; transactions_generated: number }>),

  resetDemo: (): Promise<{ status: string; message: string }> =>
    fetch(`${API_BASE}/demo/reset-demo`, { method: 'POST' }).then(handleResponse<{ status: string; message: string }>),

  resetAll: (): Promise<{ status: string; message: string }> =>
    fetch(`${API_BASE}/demo/reset-all`, { method: 'POST' }).then(handleResponse<{ status: string; message: string }>),
};
