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
  opening_balance?: number;
  opening_balance_date?: string;
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
  receipt_url?: string | null;
  location_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  import_batch_id?: string | null;
  created_at: string;
  account?: {
    id?: string;
    name: string;
    type: AccountType;
    institution_name?: string | null;
    color?: string | null;
    mask_last4?: string | null;
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
  opening_balance?: number;
  opening_balance_date?: string;
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
  opening_balance?: number;
  opening_balance_date?: string;
}

export interface ReconcileAccountBalanceDTO {
  account_id: string;
  target_balance: number;
  reconciliation_date?: string;
  notes?: string;
}

export interface CreateTransactionDTO {
  account_id: string;
  person_id?: string | null;
  title: string;
  amount: number;
  type: TransactionType;
  category?: string;
  date?: string;
  receipt_url?: string | null;
  location_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  import_batch_id?: string | null;
}

export interface UpdateTransactionDTO {
  id: string;
  account_id: string;
  person_id?: string | null;
  title: string;
  amount: number;
  type: TransactionType;
  category?: string;
  date?: string;
  receipt_url?: string | null;
  location_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ParsedImportRow {
  raw_row_index: number;
  date: string; // ISO string
  formatted_date: string; // Clean readable date
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  person_name?: string | null;
  is_valid: boolean;
  error_message?: string;
}

export interface ColumnMapping {
  date: string;
  title: string;
  amount: string;
  type?: string;
  category?: string;
  person?: string;
}

export interface BulkImportPayload {
  batch_id: string;
  default_account_id: string;
  rows: ParsedImportRow[];
}

export interface ImportBatchResult {
  success: boolean;
  batch_id: string;
  inserted_count: number;
  accounts_impacted: string[];
  message?: string;
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
  person_id?: string;
  person_ids?: string[];
  split_mode?: "equal_split" | "exact_per_person";
  type: DebtType;
  total_amount: number;
  date?: string; // Occurrence date (ISO string or YYYY-MM-DD)
  due_date?: string; // Optional expected settlement date
  description?: string;
}

// ==========================================
// Phase 6: Stats & Analytics Engine Types
// ==========================================

export interface CashFlowTrendPoint {
  label: string; // "Mon", "Tue" or "Week 1" or "Nov"
  date: string;
  income: number;
  expense: number;
  net: number;
}

export interface CategoryAnalytics {
  category: string;
  amount: number;
  percentage: number;
  count: number;
  color: string;
}

export interface PersonSpendingAnalytics {
  person_id: string;
  name: string;
  relationship?: string | null;
  avatar_url?: string | null;
  total_amount: number;
  transaction_count: number;
  percentage_of_total_expense: number;
}

export interface AccountUsageAnalytics {
  account_id: string;
  name: string;
  type: AccountType;
  institution_name?: string | null;
  logo_url?: string | null;
  color?: string | null;
  total_spent: number;
  percentage: number;
  transaction_count: number;
}

export interface AnalyticsSummaryMetrics {
  total_spent: number;
  previous_total_spent: number;
  spent_change_percentage: number; // e.g. +12.5 or -5.2
  total_earned: number;
  previous_total_earned: number;
  earned_change_percentage: number;
  net_savings_rate: number; // (Income - Expense) / Income * 100
  top_spending_category: {
    name: string;
    amount: number;
    percentage: number;
  } | null;
}

export interface AnalyticsData {
  timeframe: TimeframeOption;
  selectedAccountId: string;
  date_range_label: string;
  summary: AnalyticsSummaryMetrics;
  trends: CashFlowTrendPoint[];
  categories: CategoryAnalytics[];
  people_spending: PersonSpendingAnalytics[];
  account_distribution: AccountUsageAnalytics[];
  accounts: Account[];
  people: Person[];
}
