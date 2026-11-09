"use server";

import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTimeframeRange } from "@/lib/date-utils";
import {
  Account,
  CreateAccountDTO,
  CreateTransactionDTO,
  DashboardData,
  OverviewMetrics,
  TimeframeOption,
  Transaction,
} from "@/types";
import { revalidatePath } from "next/cache";

// Initial demo fallback accounts if database is empty or during local onboarding
const DEMO_ACCOUNTS: Account[] = [
  {
    id: "acc-checking-1",
    user_id: "demo-user",
    name: "Main Checking",
    type: "bank",
    currency: "USD",
    created_at: new Date().toISOString(),
  },
  {
    id: "acc-cash-2",
    user_id: "demo-user",
    name: "Cash Wallet",
    type: "cash",
    currency: "USD",
    created_at: new Date().toISOString(),
  },
  {
    id: "acc-card-3",
    user_id: "demo-user",
    name: "Credit Card",
    type: "credit_card",
    currency: "USD",
    created_at: new Date().toISOString(),
  },
  {
    id: "acc-lend-4",
    user_id: "demo-user",
    name: "Friend Loan",
    type: "lend_borrow",
    currency: "USD",
    created_at: new Date().toISOString(),
  },
];

const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    user_id: "demo-user",
    account_id: "acc-checking-1",
    title: "Monthly Salary",
    amount: 2350.0,
    type: "income",
    category: "Salary",
    date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    account: { name: "Main Checking", type: "bank" },
  },
  {
    id: "tx-2",
    user_id: "demo-user",
    account_id: "acc-checking-1",
    title: "Grocery Store",
    amount: 450.0,
    type: "expense",
    category: "Groceries",
    date: new Date(Date.now() - 86400000 * 1).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    account: { name: "Main Checking", type: "bank" },
  },
  {
    id: "tx-3",
    user_id: "demo-user",
    account_id: "acc-card-3",
    title: "Electric & Water Bill",
    amount: 280.0,
    type: "expense",
    category: "Utilities",
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    account: { name: "Credit Card", type: "credit_card" },
  },
  {
    id: "tx-4",
    user_id: "demo-user",
    account_id: "acc-cash-2",
    title: "Dining Out",
    amount: 220.0,
    type: "expense",
    category: "Food",
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    account: { name: "Cash Wallet", type: "cash" },
  },
  {
    id: "tx-5",
    user_id: "demo-user",
    account_id: "acc-lend-4",
    title: "Lent to Alex",
    amount: 300.0,
    type: "lend",
    category: "Lend",
    date: new Date(Date.now() - 86400000 * 4).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    account: { name: "Friend Loan", type: "lend_borrow" },
  },
];

/**
 * Checks if Supabase credentials are valid live credentials
 */
function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      key &&
      !url.includes("your-project-ref") &&
      !key.includes("eyJhbGciOi...")
  );
}

/**
 * Calculate Overview Metrics (Totals & Percentages) according to the Phase 1 rules:
 * - When account is "all", exclude transactions from lend_borrow accounts and lend/borrow types.
 */
function calculateMetrics(
  transactions: Transaction[],
  selectedAccountId: string,
  accountMap: Map<string, Account>
): OverviewMetrics {
  let totalIncome = 0;
  let totalExpense = 0;

  for (const t of transactions) {
    const acc = accountMap.get(t.account_id);
    const isLendBorrow =
      acc?.type === "lend_borrow" || t.type === "lend" || t.type === "borrow";

    if (selectedAccountId === "all") {
      // RULE: strictly exclude lend/borrow accounts and transactions from global overview
      if (isLendBorrow) continue;
      if (t.type === "income") totalIncome += Number(t.amount);
      if (t.type === "expense") totalExpense += Number(t.amount);
    } else {
      // Account specific filter
      if (t.account_id === selectedAccountId) {
        if (t.type === "income") totalIncome += Number(t.amount);
        if (t.type === "expense") totalExpense += Number(t.amount);
      }
    }
  }

  const combined = totalIncome + totalExpense;
  const income_percentage =
    combined > 0 ? Math.round((totalIncome / combined) * 100) : 50;
  const expense_percentage = combined > 0 ? 100 - income_percentage : 50;

  return {
    total_income: totalIncome,
    total_expense: totalExpense,
    balance: totalIncome - totalExpense,
    income_percentage,
    expense_percentage,
  };
}

/**
 * Fetches dashboard data: accounts, transactions, and calculated metrics
 */
export async function getDashboardData(
  timeframe: TimeframeOption = "monthly",
  selectedAccountId: string = "all"
): Promise<DashboardData> {
  const { userId } = await auth();
  const { startDate, endDate } = getTimeframeRange(timeframe);

  if (!isSupabaseConfigured() || !userId) {
    // Return structured demo data
    const accountMap = new Map(DEMO_ACCOUNTS.map((a) => [a.id, a]));

    // Filter transactions by timeframe
    const filteredByDate = DEMO_TRANSACTIONS.filter((t) => {
      const d = new Date(t.date);
      return d >= startDate && d <= endDate;
    });

    // Populate per-account income/expense summaries
    const accountsWithMetrics = DEMO_ACCOUNTS.map((acc) => {
      const accTxs = filteredByDate.filter((t) => t.account_id === acc.id);
      const inc = accTxs
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const exp = accTxs
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return {
        ...acc,
        total_income: inc,
        total_expense: exp,
        balance: inc - exp,
      };
    });

    // Filter transactions for list view
    const visibleTransactions =
      selectedAccountId === "all"
        ? filteredByDate
        : filteredByDate.filter((t) => t.account_id === selectedAccountId);

    const metrics = calculateMetrics(
      filteredByDate,
      selectedAccountId,
      accountMap
    );

    return {
      timeframe,
      selectedAccountId,
      metrics,
      accounts: accountsWithMetrics,
      transactions: visibleTransactions,
    };
  }

  // --- Real Supabase Query with RLS ---
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Fetch user accounts
    let { data: accountsData, error: accError } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: true });

    if (accError) {
      console.error("Error fetching accounts:", accError);
    }

    // Auto-seed default accounts if user has none
    if (!accountsData || accountsData.length === 0) {
      const defaultAccounts = [
        { user_id: userId, name: "Main Checking", type: "bank", currency: "USD" },
        { user_id: userId, name: "Cash Wallet", type: "cash", currency: "USD" },
        { user_id: userId, name: "Credit Card", type: "credit_card", currency: "USD" },
      ];
      const { data: seeded, error: seedError } = await supabase
        .from("accounts")
        .insert(defaultAccounts)
        .select();

      if (!seedError && seeded) {
        accountsData = seeded;
      }
    }

    const accounts: Account[] = (accountsData || []).map((a) => ({
      ...a,
      currency: a.currency || "USD",
    }));

    const accountMap = new Map(accounts.map((a) => [a.id, a]));

    // 2. Fetch transactions in timeframe
    const { data: txData, error: txError } = await supabase
      .from("transactions")
      .select("*, account:accounts(id, name, type)")
      .gte("date", startDate.toISOString())
      .lte("date", endDate.toISOString())
      .order("date", { ascending: false });

    if (txError) {
      console.error("Error fetching transactions:", txError);
    }

    const transactions: Transaction[] = (txData || []).map((t) => ({
      ...t,
      amount: Number(t.amount),
    }));

    // 3. Compute per-account metrics
    const accountsWithMetrics = accounts.map((acc) => {
      const accTxs = transactions.filter((t) => t.account_id === acc.id);
      const inc = accTxs
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const exp = accTxs
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return {
        ...acc,
        total_income: inc,
        total_expense: exp,
        balance: inc - exp,
      };
    });

    // 4. Compute global/selected metrics
    const metrics = calculateMetrics(transactions, selectedAccountId, accountMap);

    // 5. Filter transactions for the recent list
    const visibleTransactions =
      selectedAccountId === "all"
        ? transactions
        : transactions.filter((t) => t.account_id === selectedAccountId);

    return {
      timeframe,
      selectedAccountId,
      metrics,
      accounts: accountsWithMetrics,
      transactions: visibleTransactions,
    };
  } catch (err) {
    console.error("Dashboard data fetch exception:", err);
    // Return graceful fallback
    return {
      timeframe,
      selectedAccountId,
      metrics: {
        total_income: 0,
        total_expense: 0,
        balance: 0,
        income_percentage: 50,
        expense_percentage: 50,
      },
      accounts: [],
      transactions: [],
    };
  }
}

/**
 * Server Action: Create Transaction
 */
export async function createTransactionAction(dto: CreateTransactionDTO) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized: Please sign in to record transactions.");
  }

  if (!isSupabaseConfigured()) {
    // In demo mode without live DB, acknowledge success
    revalidatePath("/dashboard");
    return { success: true, message: "Transaction recorded in demo mode." };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      account_id: dto.account_id,
      title: dto.title,
      amount: dto.amount,
      type: dto.type,
      category: dto.category || "General",
      date: dto.date || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to insert transaction:", error);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  return { success: true, transaction: data };
}

/**
 * Server Action: Create Account
 */
export async function createAccountAction(dto: CreateAccountDTO) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized: Please sign in to create an account.");
  }

  if (!isSupabaseConfigured()) {
    revalidatePath("/dashboard");
    return { success: true, message: "Account created in demo mode." };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("accounts")
    .insert({
      user_id: userId,
      name: dto.name,
      type: dto.type,
      currency: dto.currency || "USD",
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to insert account:", error);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  return { success: true, account: data };
}

/**
 * Server Action: Delete Transaction
 */
export async function deleteTransactionAction(transactionId: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", transactionId);

    if (error) throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  return { success: true };
}
