"use server";

import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  Account,
  CreateAccountDTO,
  ReconcileAccountBalanceDTO,
  Transaction,
  UpdateAccountDTO,
} from "@/types";
import { revalidatePath } from "next/cache";

// Demo in-memory fallback accounts for preview / testing
let demoAccountsStore: Account[] = [
  {
    id: "acc-bank-1",
    user_id: "demo-user",
    name: "Chase Checking",
    type: "bank",
    institution_name: "Chase",
    logo_url: "/logos/chase.svg",
    color: "#1170cf",
    mask_last4: "8492",
    currency: "INR",
    initial_balance: 15000.0,
    opening_balance: 15000.0,
    opening_balance_date: new Date(Date.now() - 86400000 * 30).toISOString(),
    balance: 19000.0,
    created_at: new Date().toISOString(),
  },
  {
    id: "acc-card-2",
    user_id: "demo-user",
    name: "Apple Card",
    type: "card",
    institution_name: "Apple / Goldman",
    logo_url: "/logos/apple.svg",
    color: "#475569",
    mask_last4: "1049",
    currency: "INR",
    initial_balance: 0.0,
    opening_balance: 0.0,
    opening_balance_date: new Date(Date.now() - 86400000 * 30).toISOString(),
    balance: -2800.0,
    created_at: new Date().toISOString(),
  },
  {
    id: "acc-wallet-3",
    user_id: "demo-user",
    name: "PayPal Balance",
    type: "wallet",
    institution_name: "PayPal",
    logo_url: "/logos/paypal.svg",
    color: "#003087",
    mask_last4: null,
    currency: "INR",
    initial_balance: 3400.0,
    opening_balance: 3400.0,
    opening_balance_date: new Date(Date.now() - 86400000 * 30).toISOString(),
    balance: 3400.0,
    created_at: new Date().toISOString(),
  },
  {
    id: "acc-cash-4",
    user_id: "demo-user",
    name: "Cash Wallet",
    type: "cash",
    institution_name: "Physical Cash",
    logo_url: null,
    color: "#10b981",
    mask_last4: null,
    currency: "INR",
    initial_balance: 1500.0,
    opening_balance: 1500.0,
    opening_balance_date: new Date(Date.now() - 86400000 * 30).toISOString(),
    balance: -700.0,
    created_at: new Date().toISOString(),
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

/**
 * Fetch all user accounts with computed balances
 */
export async function getAccountsAction(): Promise<Account[]> {
  const { userId } = await auth();

  if (!isSupabaseConfigured() || !userId) {
    return demoAccountsStore;
  }

  try {
    const supabase = await createServerSupabaseClient();

    // 1 & 2. Fetch user accounts and transactions IN PARALLEL for maximum speed
    const [accountsRes, txsRes] = await Promise.all([
      supabase
        .from("accounts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("transactions")
        .select("account_id, amount, type, date")
        .eq("user_id", userId),
    ]);

    if (accountsRes.error) {
      console.error("Supabase fetch accounts error:", accountsRes.error.message);
      return [];
    }

    const accountsList = accountsRes.data || [];
    if (accountsList.length === 0) {
      return [];
    }

    const txList = txsRes.data || [];

    const accountsWithBalances: Account[] = accountsList.map((acc) => {
      const accTxs = txList.filter((t) => t.account_id === acc.id);
      
      const openingBal = Number(acc.initial_balance ?? 0);

      const totalInc = accTxs
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const totalExp = accTxs
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        ...acc,
        currency: acc.currency || "INR",
        initial_balance: openingBal,
        opening_balance: openingBal,
        opening_balance_date: acc.created_at,
        total_income: totalInc,
        total_expense: totalExp,
        balance: openingBal + totalInc - totalExp,
      };
    });

    return accountsWithBalances;
  } catch (err) {
    console.error("Failed to get accounts:", err);
    return [];
  }
}

/**
 * Create a new account
 */
export async function createAccountAction(dto: CreateAccountDTO) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!dto.name.trim()) {
    throw new Error("Account name is required");
  }

  const openingBal = Number(dto.opening_balance ?? dto.initial_balance ?? 0);

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const insertPayload: Record<string, any> = {
        user_id: userId,
        name: dto.name.trim(),
        type: dto.type,
        institution_name: dto.institution_name || null,
        logo_url: dto.logo_url || null,
        color: dto.color || null,
        mask_last4: dto.mask_last4 || null,
        initial_balance: openingBal,
        currency: dto.currency || "INR",
      };

      const { data, error } = await supabase
        .from("accounts")
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        console.error("Supabase createAccountAction error:", error.message);
        throw new Error(error.message || "Failed to create account in database");
      }

      if (data) {
        revalidatePath("/accounts");
        revalidatePath("/dashboard");
        revalidatePath("/stats");
        return {
          success: true,
          account: {
            ...data,
            currency: data.currency || "INR",
            initial_balance: openingBal,
            opening_balance: openingBal,
            opening_balance_date: data.created_at,
            total_income: 0,
            total_expense: 0,
            balance: openingBal,
          } as Account,
        };
      }
    } catch (err: any) {
      console.error("Supabase createAccountAction exception:", err);
      throw err;
    }
  }

  // Fallback for unconfigured preview environment only
  const newAcc: Account = {
    id: `acc-${Date.now()}`,
    user_id: userId,
    name: dto.name.trim(),
    type: dto.type,
    institution_name: dto.institution_name || null,
    logo_url: dto.logo_url || null,
    color: dto.color || null,
    mask_last4: dto.mask_last4 || null,
    currency: dto.currency || "INR",
    initial_balance: openingBal,
    opening_balance: openingBal,
    opening_balance_date: new Date().toISOString(),
    balance: openingBal,
    created_at: new Date().toISOString(),
  };
  demoAccountsStore = [...demoAccountsStore, newAcc];
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
  return { success: true, account: newAcc };
}

/**
 * Update an existing account
 */
export async function updateAccountAction(dto: UpdateAccountDTO) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const openingBal = Number(dto.opening_balance ?? dto.initial_balance ?? 0);

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const updatePayload: Record<string, any> = {
        name: dto.name.trim(),
        type: dto.type,
        institution_name: dto.institution_name || null,
        logo_url: dto.logo_url || null,
        color: dto.color || null,
        mask_last4: dto.mask_last4 || null,
        initial_balance: openingBal,
      };

      const { data, error } = await supabase
        .from("accounts")
        .update(updatePayload)
        .eq("id", dto.id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        console.error("Supabase updateAccountAction error:", error.message);
        throw new Error(error.message || "Failed to update account in database");
      }

      if (data) {
        revalidatePath("/accounts");
        revalidatePath(`/accounts/${dto.id}`);
        revalidatePath("/dashboard");
        revalidatePath("/stats");
        return {
          success: true,
          account: {
            ...data,
            initial_balance: openingBal,
            opening_balance: openingBal,
            opening_balance_date: data.created_at,
          } as Account,
        };
      }
    } catch (err: any) {
      console.error("Supabase updateAccountAction exception:", err);
      throw err;
    }
  }

  demoAccountsStore = demoAccountsStore.map((acc) =>
    acc.id === dto.id
      ? {
          ...acc,
          name: dto.name.trim(),
          type: dto.type,
          institution_name: dto.institution_name || null,
          logo_url: dto.logo_url || null,
          color: dto.color || null,
          mask_last4: dto.mask_last4 || null,
          initial_balance: openingBal,
          opening_balance: openingBal,
        }
      : acc
  );
  revalidatePath("/accounts");
  revalidatePath(`/accounts/${dto.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/stats");
  return { success: true };
}

/**
 * Delete an account
 */
export async function deleteAccountAction(id: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();

      // Delete associated transactions first so foreign key constraints do not block
      await supabase
        .from("transactions")
        .delete()
        .eq("account_id", id)
        .eq("user_id", userId);

      const { error } = await supabase
        .from("accounts")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        console.error("Supabase deleteAccountAction error:", error.message);
        throw new Error(error.message || "Failed to delete account from database");
      }

      demoAccountsStore = demoAccountsStore.filter((acc) => acc.id !== id);
      revalidatePath("/accounts");
      revalidatePath("/dashboard");
      revalidatePath("/stats");
      return { success: true };
    } catch (err: any) {
      console.error("Supabase deleteAccountAction exception:", err);
      throw err;
    }
  }

  demoAccountsStore = demoAccountsStore.filter((acc) => acc.id !== id);
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
  return { success: true };
}

/**
 * Fetch a single account with computed balances
 */
export async function getAccountByIdAction(id: string): Promise<Account | null> {
  const accounts = await getAccountsAction();
  return accounts.find((a) => a.id === id) || null;
}

/**
 * Fetch all transactions for a specific account sorted strictly by date DESC
 */
export async function getAccountTransactionsAction(
  accountId: string
): Promise<Transaction[]> {
  const { userId } = await auth();

  if (isSupabaseConfigured() && userId) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("transactions")
        .select(
          `*, account:accounts(id, name, type, institution_name, color), person:people(id, name, relationship, avatar_url)`
        )
        .eq("user_id", userId)
        .eq("account_id", accountId)
        .order("date", { ascending: false });

      if (!error && data) {
        return (data || []).map((t) => ({
          ...t,
          amount: Number(t.amount),
        })) as Transaction[];
      }
    } catch (err) {
      console.warn("Supabase fetch account transactions exception:", err);
    }
  }

  return [];
}

/**
 * Balance Reconciliation Action:
 * Adjusts account to match real-world bank/wallet balance automatically by recording a reconciliation transaction.
 */
export async function reconcileAccountBalanceAction(
  dto: ReconcileAccountBalanceDTO
) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const account = await getAccountByIdAction(dto.account_id);
  if (!account) {
    throw new Error("Account not found");
  }

  const currentBalance = Number(account.balance || 0);
  const targetBalance = Number(dto.target_balance);
  const diff = Math.round((targetBalance - currentBalance) * 100) / 100;

  if (Math.abs(diff) < 0.01) {
    return {
      success: true,
      adjustment: 0,
      message: "Balance is already reconciled and matches target.",
    };
  }

  const adjustmentType: "income" | "expense" = diff > 0 ? "income" : "expense";
  const absAmount = Math.abs(diff);
  const title = dto.notes?.trim() || "Balance Reconciliation Adjustment";
  const date = dto.reconciliation_date || new Date().toISOString();

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          account_id: dto.account_id,
          person_id: null,
          title,
          amount: absAmount,
          type: adjustmentType,
          category: "Adjustment",
          date,
        })
        .select()
        .single();

      if (!error && data) {
        revalidatePath("/accounts");
        revalidatePath(`/accounts/${dto.account_id}`);
        revalidatePath("/dashboard");
        revalidatePath("/stats");
        return { success: true, adjustment: diff, transaction: data };
      }
      console.warn(
        "Supabase reconcileAccountBalanceAction fallback:",
        error?.message
      );
    } catch (err) {
      console.warn("Supabase reconcileAccountBalanceAction exception:", err);
    }
  }

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${dto.account_id}`);
  revalidatePath("/dashboard");
  revalidatePath("/stats");
  return { success: true, adjustment: diff };
}
