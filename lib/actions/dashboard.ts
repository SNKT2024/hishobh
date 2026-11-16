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
  Person,
  TimeframeOption,
  Transaction,
  UpdateTransactionDTO,
} from "@/types";
import { revalidatePath } from "next/cache";
import { getPeopleAction } from "./people";
import { getAccountsAction, createAccountAction as createAccountActionDirect } from "./accounts";

let demoTransactionsStore: Transaction[] = [
  {
    id: "tx-1",
    user_id: "demo-user",
    account_id: "acc-bank-1",
    person_id: null,
    title: "Monthly Salary",
    amount: 2350.0,
    type: "income",
    category: "Salary",
    date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    account: { name: "Chase Checking", type: "bank", institution_name: "Chase" },
  },
  {
    id: "tx-2",
    user_id: "demo-user",
    account_id: "acc-bank-1",
    person_id: "p-1",
    title: "Grocery Split",
    amount: 450.0,
    type: "expense",
    category: "Groceries",
    date: new Date(Date.now() - 86400000 * 1).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    account: { name: "Chase Checking", type: "bank", institution_name: "Chase" },
    person: { id: "p-1", name: "Alex Johnson", relationship: "Friend" },
  },
  {
    id: "tx-3",
    user_id: "demo-user",
    account_id: "acc-card-3",
    person_id: null,
    title: "Electric & Water Bill",
    amount: 280.0,
    type: "expense",
    category: "Utilities",
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    account: { name: "Apple Card", type: "card", institution_name: "Apple / Goldman" },
  },
  {
    id: "tx-4",
    user_id: "demo-user",
    account_id: "acc-cash-2",
    person_id: "p-2",
    title: "Dinner with Sarah",
    amount: 220.0,
    type: "expense",
    category: "Food",
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    account: { name: "Cash Wallet", type: "cash", institution_name: "Physical Cash" },
    person: { id: "p-2", name: "Sarah Miller", relationship: "Family" },
  },
];

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

function calculateMetrics(
  transactions: Transaction[],
  selectedAccountId: string
): OverviewMetrics {
  let totalIncome = 0;
  let totalExpense = 0;

  for (const t of transactions) {
    if (selectedAccountId === "all" || t.account_id === selectedAccountId) {
      if (t.type === "income") totalIncome += Number(t.amount);
      if (t.type === "expense") totalExpense += Number(t.amount);
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
 * Fetches dashboard data: accounts, transactions, people, and calculated metrics
 */
export async function getDashboardData(
  timeframe: TimeframeOption = "monthly",
  selectedAccountId: string = "all"
): Promise<DashboardData> {
  const { userId } = await auth();
  const { startDate, endDate } = getTimeframeRange(timeframe);

  if (!isSupabaseConfigured() || !userId) {
    const [people, accounts] = await Promise.all([
      getPeopleAction(),
      getAccountsAction(),
    ]);

    if (accounts.length === 0) {
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
        people,
      };
    }

    // Filter transactions by timeframe
    const filteredByDate = demoTransactionsStore.filter((t) => {
      const d = new Date(t.date);
      return d >= startDate && d <= endDate;
    });

    const accountsWithMetrics = accounts.map((acc) => {
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

    const visibleTransactions =
      selectedAccountId === "all"
        ? filteredByDate
        : filteredByDate.filter((t) => t.account_id === selectedAccountId);

    const metrics = calculateMetrics(filteredByDate, selectedAccountId);

    return {
      timeframe,
      selectedAccountId,
      metrics,
      accounts: accountsWithMetrics,
      transactions: visibleTransactions,
      people,
    };
  }

  // --- Real Supabase Query with RLS (All executed concurrently via Promise.all) ---
  try {
    const supabase = await createServerSupabaseClient();

    // Fetch people, accounts, and transactions simultaneously in PARALLEL
    const [people, accounts, txResult] = await Promise.all([
      getPeopleAction(),
      getAccountsAction(),
      supabase
        .from("transactions")
        .select("*, account:accounts(id, name, type, institution_name), person:people(id, name, relationship)")
        .eq("user_id", userId)
        .gte("date", startDate.toISOString())
        .lte("date", endDate.toISOString())
        .order("date", { ascending: false }),
    ]);

    if (txResult.error) {
      console.warn("Supabase fetch transactions notice:", txResult.error.message);
    }

    if (accounts.length === 0) {
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
        people,
      };
    }

    const transactions: Transaction[] = (txResult.data || []).map((t) => ({
      ...t,
      amount: Number(t.amount),
    }));

    // Compute per-account metrics
    const accountsWithMetrics = accounts.map((acc) => {
      const accTxs = transactions.filter((t) => t.account_id === acc.id);
      const inc = accTxs
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const exp = accTxs
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const initial = Number(acc.initial_balance || 0);
      return {
        ...acc,
        total_income: inc,
        total_expense: exp,
        balance: initial + inc - exp,
      };
    });

    // Compute global/selected metrics
    const metrics = calculateMetrics(transactions, selectedAccountId);

    // Filter transactions for the recent list
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
      people,
    };
  } catch (err) {
    console.error("Dashboard data fetch exception:", err);
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
      people: [],
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

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const insertPayload: Record<string, any> = {
        user_id: userId,
        account_id: dto.account_id,
        person_id: dto.person_id || null,
        title: dto.title,
        amount: dto.amount,
        type: dto.type,
        category: dto.category || "General",
        date: dto.date || new Date().toISOString(),
      };

      if (dto.receipt_url !== undefined) insertPayload.receipt_url = dto.receipt_url;
      if (dto.location_name !== undefined) insertPayload.location_name = dto.location_name;
      if (dto.latitude !== undefined) insertPayload.latitude = dto.latitude;
      if (dto.longitude !== undefined) insertPayload.longitude = dto.longitude;
      if (dto.import_batch_id !== undefined) insertPayload.import_batch_id = dto.import_batch_id;

      let { data, error } = await supabase
        .from("transactions")
        .insert(insertPayload)
        .select()
        .single();

      // Resilience: If optional columns are not yet in remote Supabase schema cache
      if (error && (error.code === "PGRST204" || error.message?.includes("schema cache"))) {
        console.warn("Retrying transaction insert with baseline schema...");
        const basePayload = {
          user_id: userId,
          account_id: dto.account_id,
          person_id: dto.person_id || null,
          title: dto.title,
          amount: dto.amount,
          type: dto.type,
          category: dto.category || "General",
          date: dto.date || new Date().toISOString(),
        };
        const retryRes = await supabase.from("transactions").insert(basePayload).select().single();
        data = retryRes.data;
        error = retryRes.error;
      }

      if (!error && data) {
        revalidatePath("/dashboard");
        revalidatePath("/accounts");
        revalidatePath(`/accounts/${dto.account_id}`);
        revalidatePath("/stats");
        return { success: true, transaction: data };
      }
      console.warn("Supabase createTransactionAction fallback:", error?.message);
    } catch (err) {
      console.warn("Supabase createTransactionAction exception:", err);
    }
  }

  const userAccounts = await getAccountsAction();
  const acc = userAccounts.find((a) => a.id === dto.account_id);
  const newTx: Transaction = {
    id: `tx-${Date.now()}`,
    user_id: userId,
    account_id: dto.account_id,
    person_id: dto.person_id || null,
    title: dto.title,
    amount: dto.amount,
    type: dto.type,
    category: dto.category || "General",
    date: dto.date || new Date().toISOString(),
    receipt_url: dto.receipt_url || null,
    location_name: dto.location_name || null,
    latitude: dto.latitude || null,
    longitude: dto.longitude || null,
    import_batch_id: dto.import_batch_id || null,
    created_at: new Date().toISOString(),
    account: acc
      ? {
          name: acc.name,
          type: acc.type,
          institution_name: acc.institution_name,
        }
      : null,
  };
  demoTransactionsStore = [newTx, ...demoTransactionsStore].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath(`/accounts/${dto.account_id}`);
  revalidatePath("/stats");
  return { success: true, transaction: newTx };
}

/**
 * Server Action: Update Transaction
 */
export async function updateTransactionAction(dto: UpdateTransactionDTO) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized: Please sign in to update transactions.");
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const updatePayload: Record<string, any> = {
        account_id: dto.account_id,
        person_id: dto.person_id || null,
        title: dto.title.trim(),
        amount: dto.amount,
        type: dto.type,
        category: dto.category || "General",
        date: dto.date || new Date().toISOString(),
      };

      if (dto.receipt_url !== undefined) updatePayload.receipt_url = dto.receipt_url;
      if (dto.location_name !== undefined) updatePayload.location_name = dto.location_name;
      if (dto.latitude !== undefined) updatePayload.latitude = dto.latitude;
      if (dto.longitude !== undefined) updatePayload.longitude = dto.longitude;

      let { data, error } = await supabase
        .from("transactions")
        .update(updatePayload)
        .eq("id", dto.id)
        .eq("user_id", userId)
        .select(
          `*, account:accounts(id, name, type, institution_name), person:people(id, name, relationship)`
        )
        .single();

      // Resilience: If optional columns are not yet in remote Supabase schema cache
      if (error && (error.code === "PGRST204" || error.message?.includes("schema cache"))) {
        console.warn("Retrying transaction update with baseline schema...");
        const basePayload = {
          account_id: dto.account_id,
          person_id: dto.person_id || null,
          title: dto.title.trim(),
          amount: dto.amount,
          type: dto.type,
          category: dto.category || "General",
          date: dto.date || new Date().toISOString(),
        };
        const retryRes = await supabase
          .from("transactions")
          .update(basePayload)
          .eq("id", dto.id)
          .eq("user_id", userId)
          .select(
            `*, account:accounts(id, name, type, institution_name), person:people(id, name, relationship)`
          )
          .single();
        data = retryRes.data;
        error = retryRes.error;
      }

      if (!error && data) {
        revalidatePath("/dashboard");
        revalidatePath("/accounts");
        revalidatePath(`/accounts/${dto.account_id}`);
        revalidatePath("/stats");
        return { success: true, transaction: data as Transaction };
      }
      console.warn("Supabase updateTransactionAction fallback:", error?.message);
    } catch (err) {
      console.warn("Supabase updateTransactionAction exception:", err);
    }
  }

  const userAccounts = await getAccountsAction();
  const acc = userAccounts.find((a) => a.id === dto.account_id);
  const people = await getPeopleAction();
  const person = dto.person_id
    ? people.find((p) => p.id === dto.person_id)
    : null;

  demoTransactionsStore = demoTransactionsStore.map((t) => {
    if (t.id === dto.id) {
      return {
        ...t,
        account_id: dto.account_id,
        person_id: dto.person_id || null,
        title: dto.title.trim(),
        amount: dto.amount,
        type: dto.type,
        category: dto.category || "General",
        date: dto.date || t.date,
        receipt_url: dto.receipt_url !== undefined ? dto.receipt_url : t.receipt_url,
        location_name: dto.location_name !== undefined ? dto.location_name : t.location_name,
        latitude: dto.latitude !== undefined ? dto.latitude : t.latitude,
        longitude: dto.longitude !== undefined ? dto.longitude : t.longitude,
        account: acc
          ? {
              name: acc.name,
              type: acc.type,
              institution_name: acc.institution_name,
            }
          : t.account,
        person: person
          ? {
              id: person.id,
              name: person.name,
              relationship: person.relationship,
            }
          : null,
      };
    }
    return t;
  });

  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath(`/accounts/${dto.account_id}`);
  revalidatePath("/stats");
  const updated = demoTransactionsStore.find((t) => t.id === dto.id);
  return { success: true, transaction: updated };
}

export async function createAccountAction(dto: CreateAccountDTO) {
  return await createAccountActionDirect(dto);
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
    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transactionId)
        .eq("user_id", userId);

      if (!error) {
        demoTransactionsStore = demoTransactionsStore.filter((t) => t.id !== transactionId);
        revalidatePath("/dashboard");
        revalidatePath("/accounts");
        revalidatePath("/stats");
        return { success: true };
      }
      console.warn("Supabase deleteTransactionAction fallback:", error?.message);
    } catch (err) {
      console.warn("Supabase deleteTransactionAction exception:", err);
    }
  }

  demoTransactionsStore = demoTransactionsStore.filter((t) => t.id !== transactionId);
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath("/stats");
  return { success: true };
}
