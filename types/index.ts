/**
 * Global TypeScript definitions for Hishobh (Expense Tracker)
 * Phase 1: Accounts, Transactions, Timeframes, and Overview Metrics
 */

export type AccountType =
  | "bank"
  | "cash"
  | "credit_card"
  | "savings"
  | "lend_borrow";

export type TransactionType =
  | "income"
  | "expense"
  | "transfer"
  | "lend"
  | "borrow";

export type TimeframeOption =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "6months"
  | "yearly";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  currency: string;
  created_at: string;
  // Computed / summary fields
  balance?: number;
  total_income?: number;
  total_expense?: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category?: string | null;
  date: string;
  created_at: string;
  account?: {
    id?: string;
    name: string;
    type: AccountType;
  } | null;
}

export interface OverviewMetrics {
  total_income: number;
  total_expense: number;
  balance: number;
  income_percentage: number;
  expense_percentage: number;
}

export interface DashboardData {
  timeframe: TimeframeOption;
  selectedAccountId: string; // "all" or specific UUID
  metrics: OverviewMetrics;
  accounts: Account[];
  transactions: Transaction[];
}

export interface CreateAccountDTO {
  name: string;
  type: AccountType;
  currency?: string;
}

export interface CreateTransactionDTO {
  account_id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category?: string;
  date?: string;
}
