"use server";

import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Account, CreateAccountDTO, UpdateAccountDTO } from "@/types";
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
    currency: "USD",
    initial_balance: 1500.0,
    balance: 1900.0,
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
    currency: "USD",
    initial_balance: 0.0,
    balance: -280.0,
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
    currency: "USD",
    initial_balance: 340.0,
    balance: 340.0,
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
    currency: "USD",
    initial_balance: 150.0,
    balance: -70.0,
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

    // 1. Fetch user accounts
    let { data: accountsData, error: accError } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: true });

    if (accError) {
      console.error("Error fetching accounts:", accError);
      return demoAccountsStore;
    }

    if (!accountsData || accountsData.length === 0) {
      // Seed default accounts
      const defaultAccounts = [
        {
          user_id: userId,
          name: "Main Checking",
          type: "bank",
          institution_name: "Chase",
          color: "#1170cf",
          currency: "USD",
          mask_last4: "4321",
        },
        {
          user_id: userId,
          name: "Cash Wallet",
          type: "cash",
          institution_name: "Physical Cash",
          color: "#10b981",
          currency: "USD",
        },
        {
          user_id: userId,
          name: "Credit Card",
          type: "card",
          institution_name: "Visa",
          color: "#1a1f71",
          currency: "USD",
          mask_last4: "9876",
        },
      ];

      const { data: seeded } = await supabase
        .from("accounts")
        .insert(defaultAccounts)
        .select();

      accountsData = seeded || [];
    }

    // 2. Fetch all transactions to compute running balances
    const { data: txs } = await supabase
      .from("transactions")
      .select("account_id, amount, type");

    const txList = txs || [];

    const accountsWithBalances: Account[] = (accountsData || []).map((acc) => {
      const accTxs = txList.filter((t) => t.account_id === acc.id);
      const inc = accTxs
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const exp = accTxs
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const initial = Number(acc.initial_balance || 0);

      return {
        ...acc,
        currency: acc.currency || "USD",
        total_income: inc,
        total_expense: exp,
        balance: initial + inc - exp,
      };
    });

    return accountsWithBalances;
  } catch (err) {
    console.error("Failed to get accounts:", err);
    return demoAccountsStore;
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

  if (!isSupabaseConfigured()) {
    const newAcc: Account = {
      id: `acc-${Date.now()}`,
      user_id: userId,
      name: dto.name.trim(),
      type: dto.type,
      institution_name: dto.institution_name || null,
      logo_url: dto.logo_url || null,
      color: dto.color || null,
      mask_last4: dto.mask_last4 || null,
      currency: dto.currency || "USD",
      initial_balance: Number(dto.initial_balance || 0),
      balance: Number(dto.initial_balance || 0),
      created_at: new Date().toISOString(),
    };
    demoAccountsStore = [...demoAccountsStore, newAcc];
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    return { success: true, account: newAcc };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("accounts")
    .insert({
      user_id: userId,
      name: dto.name.trim(),
      type: dto.type,
      institution_name: dto.institution_name || null,
      logo_url: dto.logo_url || null,
      color: dto.color || null,
      mask_last4: dto.mask_last4 || null,
      initial_balance: Number(dto.initial_balance || 0),
      currency: dto.currency || "USD",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating account:", error);
    throw new Error(error.message);
  }

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return { success: true, account: data as Account };
}

/**
 * Update an existing account
 */
export async function updateAccountAction(dto: UpdateAccountDTO) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!isSupabaseConfigured()) {
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
            initial_balance: Number(dto.initial_balance || 0),
          }
        : acc
    );
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    return { success: true };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("accounts")
    .update({
      name: dto.name.trim(),
      type: dto.type,
      institution_name: dto.institution_name || null,
      logo_url: dto.logo_url || null,
      color: dto.color || null,
      mask_last4: dto.mask_last4 || null,
      initial_balance: Number(dto.initial_balance || 0),
    })
    .eq("id", dto.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating account:", error);
    throw new Error(error.message);
  }

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return { success: true, account: data as Account };
}

/**
 * Delete an account
 */
export async function deleteAccountAction(id: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!isSupabaseConfigured()) {
    demoAccountsStore = demoAccountsStore.filter((acc) => acc.id !== id);
    revalidatePath("/accounts");
    revalidatePath("/dashboard");
    return { success: true };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("accounts").delete().eq("id", id);

  if (error) {
    console.error("Error deleting account:", error);
    throw new Error(error.message);
  }

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return { success: true };
}
