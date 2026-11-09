/**
 * Global TypeScript definitions for Hishobh (Expense Tracker)
 */

export type TransactionType = "income" | "expense" | "transfer";

export interface UserProfile {
  id: string; // Clerk User ID (sub)
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  preferredCurrency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: TransactionType;
  icon?: string;
  color?: string;
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  type: TransactionType;
  date: string;
  description?: string;
  tags?: string[];
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId?: string | null;
  amount: number;
  period: "weekly" | "monthly" | "yearly";
  startDate: string;
  endDate?: string;
}
