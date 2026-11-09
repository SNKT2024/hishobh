/**
 * Global TypeScript definitions for Hishobh (Expense Tracker)
 * Architecture:
 * - Strict Account Types: cash, bank, wallet, card with institution branding
 * - Centralized People entity
 * - Isolated Debts ledger (Lend & Borrow)
 */

export type AccountType = "cash" | "bank" | "wallet" | "card";

export type TransactionType = "income" | "expense" | "transfer";

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
  institution_name?: string | null;
  logo_url?: string | null;
  color?: string | null;
  mask_last4?: string | null;
  initial_balance?: number;
  created_at: string;
  // Computed / summary fields
  balance?: number;
  total_income?: number;
  total_expense?: number;
}

export interface Person {
  id: string;
  user_id: string;
  name: string;
  relationship?: string | null; // "Friend" | "Family" | "Colleague" | "Partner" | "Work" | "Other"
  avatar_url?: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  person_id?: string | null;
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
    institution_name?: string | null;
  } | null;
  person?: {
    id: string;
    name: string;
    relationship?: string | null;
  } | null;
}

export type DebtType = "lend" | "borrow";
export type DebtStatus = "pending" | "partially_settled" | "settled";

export interface Debt {
  id: string;
  user_id: string;
  person_id: string;
  type: DebtType;
  total_amount: number;
  settled_amount: number;
  due_date?: string | null;
  status: DebtStatus;
  description?: string | null;
  created_at: string;
  person?: Person | null;
  settlements?: DebtSettlement[];
}

export interface DebtSettlement {
  id: string;
  debt_id: string;
  amount: number;
  settlement_date: string;
  notes?: string | null;
}

export interface CreateDebtSettlementDTO {
  debt_id: string;
  amount: number;
  settlement_date?: string;
  notes?: string;
}

export interface DebtSummaryMetrics {
  total_lent: number;
  total_borrowed: number;
  total_lent_recovered: number;
  recovery_percentage: number;
  active_lend_count: number;
  active_borrow_count: number;
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
  people: Person[];
}

export interface CreateAccountDTO {
  name: string;
  type: AccountType;
  currency?: string;
  institution_name?: string;
  logo_url?: string;
  color?: string;
  mask_last4?: string;
  initial_balance?: number;
}

export interface UpdateAccountDTO {
  id: string;
  name: string;
  type: AccountType;
  currency?: string;
  institution_name?: string;
  logo_url?: string;
  color?: string;
  mask_last4?: string;
  initial_balance?: number;
}

export interface CreateTransactionDTO {
  account_id: string;
  person_id?: string | null;
  title: string;
  amount: number;
  type: TransactionType;
  category?: string;
  date?: string;
}

export interface CreatePersonDTO {
  name: string;
  relationship?: string;
  avatar_url?: string;
}

export interface UpdatePersonDTO {
  id: string;
  name: string;
  relationship?: string;
  avatar_url?: string;
}

export interface CreateDebtDTO {
  person_id: string;
  type: DebtType;
  total_amount: number;
  due_date?: string;
  description?: string;
}
