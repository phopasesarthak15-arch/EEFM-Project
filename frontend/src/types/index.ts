export interface Profile {
  id: number;
  student_name: string;
  monthly_allowance: number;
  part_time_income: number;
  scholarship_income: number;
  monthly_savings_target: number;
  living_arrangement: string;
  fixed_monthly_expenses: number;
  currency: string;
  is_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  transaction_type: 'income' | 'expense';
  category: string;
  payment_method: string;
  notes?: string | null;
  is_recurring: boolean;
  is_demo: boolean;
  created_at: string;
}

export interface TransactionCreate {
  date: string;
  description: string;
  amount: number;
  transaction_type: 'income' | 'expense';
  category: string;
  payment_method: string;
  notes?: string;
  is_recurring?: boolean;
}

export interface Budget {
  id: number;
  category: string;
  planned_amount: number;
  month: number;
  year: number;
  description?: string | null;
  is_demo: boolean;
  actual_spending: number;
  remaining_amount: number;
  utilization_percentage: number;
  status: 'on_track' | 'approaching' | 'near_limit' | 'overspent';
  created_at: string;
}

export interface BudgetCreate {
  category: string;
  planned_amount: number;
  month: number;
  year: number;
  description?: string;
}

export interface SavingsContribution {
  id: number;
  goal_id: number;
  date: string;
  amount: number;
  note?: string | null;
  created_at: string;
}

export interface SavingsGoal {
  id: number;
  name: string;
  target_amount: number;
  current_saved: number;
  target_date: string;
  description?: string | null;
  is_demo: boolean;
  progress_percentage: number;
  remaining_amount: number;
  required_monthly_savings: number;
  months_remaining: number;
  is_at_risk: boolean;
  contributions: SavingsContribution[];
  created_at: string;
}

export interface SavingsGoalCreate {
  name: string;
  target_amount: number;
  current_saved: number;
  target_date: string;
  description?: string;
}

export interface FinancialSummary {
  month: number;
  year: number;
  total_income: number;
  total_expenses: number;
  net_savings: number;
  savings_rate: number | null;
  total_planned_budget: number;
  total_actual_spending_in_budget: number;
  overall_budget_utilization: number | null;
  remaining_budget: number;
  prev_month_income?: number | null;
  prev_month_expenses?: number | null;
  prev_month_net_savings?: number | null;
  mom_expense_change_pct?: number | null;
  avg_daily_spending: number;
  financial_health_score: number;
  financial_health_status: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention';
  health_factors: string[];
}

export interface CategorySpendingItem {
  category: string;
  actual_amount: number;
  transaction_count: number;
  share_percentage: number;
  planned_budget: number;
  budget_variance: number;
  is_overspent: boolean;
}

export interface SpendingTrendItem {
  month: number;
  year: number;
  month_label: string;
  income: number;
  expenses: number;
  net_savings: number;
  savings_rate: number | null;
}

export interface DailySpendingItem {
  date: string;
  day: number;
  daily_amount: number;
  cumulative_amount: number;
}

export interface BreakdownTypes {
  total_expenses: number;
  essential_amount: number;
  discretionary_amount: number;
  essential_percentage: number;
  discretionary_percentage: number;
  fixed_amount: number;
  variable_amount: number;
  fixed_percentage: number;
  variable_percentage: number;
}

export interface OptimizerRecommendation {
  id: string;
  rule_key: string;
  title: string;
  category: string;
  pattern_explanation: string;
  supporting_figures: Record<string, any>;
  suggested_action: string;
  estimated_potential_monthly_savings?: number | null;
  priority: 'High' | 'Medium' | 'Low';
  confidence_level: 'High' | 'Medium' | 'Moderate';
  status: 'active' | 'reviewed' | 'dismissed';
  proposed_budget_change?: {
    category: string;
    current_budget: number;
    proposed_budget: number;
    action: string;
  } | null;
}

export interface ForecastDataPoint {
  date: string;
  forecast_amount: number;
  is_forecast: boolean;
  actual_amount?: number | null;
  lower_bound?: number | null;
  upper_bound?: number | null;
}

export interface ForecastEvaluation {
  sample_size: number;
  train_size: number;
  test_size: number;
  evaluation_period: string;
  model_name: string;
  baseline_mae: number;
  model_mae: number;
  baseline_rmse: number;
  model_rmse: number;
  improvement_pct?: number | null;
  features_used: string[];
  has_sufficient_data: boolean;
  minimum_required_days: number;
}

export interface ForecastResponse {
  has_sufficient_data: boolean;
  message: string;
  daily_forecast_7d: ForecastDataPoint[];
  daily_forecast_30d: ForecastDataPoint[];
  historical_and_forecast_trend: ForecastDataPoint[];
  category_forecasts: Record<string, number>;
  evaluation: ForecastEvaluation;
}

export const EXPENSE_CATEGORIES = [
  "Food and Mess",
  "Groceries",
  "Transportation",
  "Education and Books",
  "Accommodation and Rent",
  "Mobile and Internet",
  "Shopping",
  "Entertainment",
  "Health and Personal Care",
  "Subscriptions",
  "Social Activities",
  "Miscellaneous"
];

export const INCOME_CATEGORIES = [
  "Pocket Money",
  "Part-Time Work",
  "Scholarship",
  "Family Support",
  "Freelancing",
  "Other Income"
];
