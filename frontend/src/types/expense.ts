export type SplitType =
  | "equal"
  | "exact"
  | "percentage";


export type MoneyValue =
  | string
  | number;


export interface ExpenseSplit {
  user_id: string;
  name: string;
  amount: MoneyValue;
  percentage: MoneyValue | null;
}


export interface Expense {
  id: string;
  group_id: string;
  title: string;
  description: string | null;
  total_amount: MoneyValue;
  currency: string;
  split_type: SplitType;
  paid_by_id: string;
  paid_by_name: string;
  created_by_id: string;
  expense_date: string;
  splits: ExpenseSplit[];
  created_at: string;
  updated_at: string;
}


export interface ExpenseSplitInput {
  user_id: string;
  amount: number | null;
  percentage: number | null;
}


export interface CreateExpensePayload {
  title: string;
  description: string;
  total_amount: number;
  paid_by_id: string;
  split_type: SplitType;
  participant_ids: string[];
  splits: ExpenseSplitInput[];
  expense_date: string;
}
export interface DebtSuggestion {
  from_user_id: string;
  from_user_name: string;
  to_user_id: string;
  to_user_name: string;
  amount: MoneyValue;
}


export interface GroupDebtSimplification {
  group_id: string;
  currency: string;
  suggestions: DebtSuggestion[];
}