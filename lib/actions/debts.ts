"use server";

import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  CreateDebtDTO,
  CreateDebtSettlementDTO,
  Debt,
  DebtSettlement,
  DebtSummaryMetrics,
} from "@/types";
import { revalidatePath } from "next/cache";

// Demo in-memory fallback debts for preview
let demoDebtsStore: Debt[] = [
  {
    id: "debt-1",
    user_id: "demo-user",
    person_id: "p-1",
    type: "lend",
    total_amount: 500.0,
    settled_amount: 200.0,
    due_date: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
    status: "partially_settled",
    description: "Weekend road trip cabin rental share",
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    person: {
      id: "p-1",
      user_id: "demo-user",
      name: "Alex Johnson",
      relationship: "Friend",
      avatar_url: null,
      created_at: new Date().toISOString(),
    },
    settlements: [
      {
        id: "set-1",
        debt_id: "debt-1",
        amount: 200.0,
        settlement_date: new Date(Date.now() - 86400000 * 3).toISOString(),
        notes: "Bank transfer partial",
      },
    ],
  },
  {
    id: "debt-2",
    user_id: "demo-user",
    person_id: "p-2",
    type: "lend",
    total_amount: 350.0,
    settled_amount: 350.0,
    due_date: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: "settled",
    description: "Dinner split for family reunion",
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    person: {
      id: "p-2",
      user_id: "demo-user",
      name: "Sarah Miller",
      relationship: "Family",
      avatar_url: null,
      created_at: new Date().toISOString(),
    },
    settlements: [
      {
        id: "set-2",
        debt_id: "debt-2",
        amount: 350.0,
        settlement_date: new Date(Date.now() - 86400000 * 2).toISOString(),
        notes: "Full settlement via Venmo",
      },
    ],
  },
  {
    id: "debt-3",
    user_id: "demo-user",
    person_id: "p-3",
    type: "borrow",
    total_amount: 400.0,
    settled_amount: 150.0,
    due_date: new Date(Date.now() + 86400000 * 14).toISOString(), // 14 days from now
    status: "partially_settled",
    description: "Borrowed for concert tickets presale",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    person: {
      id: "p-3",
      user_id: "demo-user",
      name: "Michael Chen",
      relationship: "Colleague",
      avatar_url: null,
      created_at: new Date().toISOString(),
    },
    settlements: [
      {
        id: "set-3",
        debt_id: "debt-3",
        amount: 150.0,
        settlement_date: new Date(Date.now() - 86400000 * 1).toISOString(),
        notes: "Cash payment",
      },
    ],
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

function calculateDebtMetrics(debts: Debt[]): DebtSummaryMetrics {
  let totalLentPending = 0;
  let totalLentOriginal = 0;
  let totalLentRecovered = 0;
  let totalBorrowedPending = 0;
  let activeLendCount = 0;
  let activeBorrowCount = 0;

  for (const d of debts) {
    const total = Number(d.total_amount);
    const settled = Number(d.settled_amount);
    const remaining = Math.max(0, total - settled);

    if (d.type === "lend") {
      totalLentOriginal += total;
      totalLentRecovered += settled;
      totalLentPending += remaining;
      if (d.status !== "settled") activeLendCount++;
    } else if (d.type === "borrow") {
      totalBorrowedPending += remaining;
      if (d.status !== "settled") activeBorrowCount++;
    }
  }

  const recovery_percentage =
    totalLentOriginal > 0
      ? Math.round((totalLentRecovered / totalLentOriginal) * 100)
      : 100;

  return {
    total_lent: totalLentPending,
    total_borrowed: totalBorrowedPending,
    total_lent_recovered: totalLentRecovered,
    recovery_percentage,
    active_lend_count: activeLendCount,
    active_borrow_count: activeBorrowCount,
  };
}

/**
 * Fetch all debts with joined counterparty person and settlement history
 */
export async function getDebtsAction(): Promise<{
  debts: Debt[];
  metrics: DebtSummaryMetrics;
}> {
  const { userId } = await auth();

  if (!isSupabaseConfigured() || !userId) {
    return {
      debts: demoDebtsStore,
      metrics: calculateDebtMetrics(demoDebtsStore),
    };
  }

  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("debts")
      .select("*, person:people(*), settlements:debt_settlements(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase fetch debts notice:", error.message);
      return {
        debts: demoDebtsStore,
        metrics: calculateDebtMetrics(demoDebtsStore),
      };
    }

    const debts: Debt[] = (data || []).map((d) => ({
      ...d,
      total_amount: Number(d.total_amount),
      settled_amount: Number(d.settled_amount),
      settlements: (d.settlements || []).map((s: any) => ({
        ...s,
        amount: Number(s.amount),
      })),
    }));

    return {
      debts,
      metrics: calculateDebtMetrics(debts),
    };
  } catch (err) {
    console.error("Exception fetching debts:", err);
    return {
      debts: demoDebtsStore,
      metrics: calculateDebtMetrics(demoDebtsStore),
    };
  }
}

/**
 * Create a new Lend or Borrow record (supports single or multiple counterparties)
 */
export async function createDebtAction(dto: CreateDebtDTO) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Support single person or multiple people
  const targetPersonIds: string[] =
    dto.person_ids && dto.person_ids.length > 0
      ? dto.person_ids
      : dto.person_id
      ? [dto.person_id]
      : [];

  if (targetPersonIds.length === 0) {
    throw new Error("At least one counterparty person is required");
  }

  if (!dto.total_amount || dto.total_amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const isMulti = targetPersonIds.length > 1;
  const amountPerPerson =
    isMulti && dto.split_mode !== "exact_per_person"
      ? Math.round((dto.total_amount / targetPersonIds.length) * 100) / 100
      : dto.total_amount;

  const recordDate = dto.date ? new Date(dto.date).toISOString() : new Date().toISOString();
  const dueDate = dto.due_date ? new Date(dto.due_date).toISOString() : null;

  const recordsToInsert = targetPersonIds.map((pId) => ({
    user_id: userId,
    person_id: pId,
    type: dto.type,
    total_amount: amountPerPerson,
    settled_amount: 0,
    due_date: dueDate,
    description: dto.description || null,
    status: "pending" as const,
    created_at: recordDate,
  }));

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("debts")
        .insert(recordsToInsert)
        .select("*, person:people(*)");

      if (!error && data) {
        revalidatePath("/settings/lend-borrow");
        return { success: true, debts: data as Debt[], debt: (data[0] || null) as Debt };
      }
      console.warn("Supabase createDebtAction fallback:", error?.message);
    } catch (err) {
      console.warn("Supabase createDebtAction exception:", err);
    }
  }

  const createdDebts: Debt[] = targetPersonIds.map((pId, idx) => ({
    id: `debt-${Date.now()}-${idx}`,
    user_id: userId,
    person_id: pId,
    type: dto.type,
    total_amount: amountPerPerson,
    settled_amount: 0,
    due_date: dueDate,
    status: "pending",
    description: dto.description || null,
    created_at: recordDate,
    settlements: [],
  }));

  demoDebtsStore = [...createdDebts, ...demoDebtsStore];
  revalidatePath("/settings/lend-borrow");
  return { success: true, debts: createdDebts, debt: createdDebts[0] };
}

/**
 * Log a partial or full payment settlement
 */
export async function createDebtSettlementAction(dto: CreateDebtSettlementDTO) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!dto.amount || dto.amount <= 0) {
    throw new Error("Settlement amount must be greater than 0");
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("debt_settlements")
        .insert({
          debt_id: dto.debt_id,
          amount: dto.amount,
          settlement_date: dto.settlement_date || new Date().toISOString(),
          notes: dto.notes || null,
        })
        .select()
        .single();

      if (!error && data) {
        revalidatePath("/settings/lend-borrow");
        return { success: true, settlement: data as DebtSettlement };
      }
      console.warn("Supabase createDebtSettlementAction fallback:", error?.message);
    } catch (err) {
      console.warn("Supabase createDebtSettlementAction exception:", err);
    }
  }

  const target = demoDebtsStore.find((d) => d.id === dto.debt_id);
  if (!target) throw new Error("Debt record not found");

  const newSettled = Number(target.settled_amount) + Number(dto.amount);
  const newStatus =
    newSettled >= target.total_amount
      ? "settled"
      : newSettled > 0
      ? "partially_settled"
      : "pending";

  const newSettlement: DebtSettlement = {
    id: `set-${Date.now()}`,
    debt_id: dto.debt_id,
    amount: dto.amount,
    settlement_date: dto.settlement_date || new Date().toISOString(),
    notes: dto.notes || null,
  };

  demoDebtsStore = demoDebtsStore.map((d) =>
    d.id === dto.debt_id
      ? {
          ...d,
          settled_amount: newSettled,
          status: newStatus,
          settlements: [newSettlement, ...(d.settlements || [])],
        }
      : d
  );

  revalidatePath("/settings/lend-borrow");
  return { success: true, settlement: newSettlement };
}

/**
 * Delete a debt record and its settlements
 */
export async function deleteDebtAction(id: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase
        .from("debts")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (!error) {
        demoDebtsStore = demoDebtsStore.filter((d) => d.id !== id);
        revalidatePath("/settings/lend-borrow");
        return { success: true };
      }
      console.warn("Supabase deleteDebtAction fallback:", error?.message);
    } catch (err) {
      console.warn("Supabase deleteDebtAction exception:", err);
    }
  }

  demoDebtsStore = demoDebtsStore.filter((d) => d.id !== id);
  revalidatePath("/settings/lend-borrow");
  return { success: true };
}
