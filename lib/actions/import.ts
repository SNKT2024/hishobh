"use server";

import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BulkImportPayload, ImportBatchResult, Transaction } from "@/types";
import { revalidatePath } from "next/cache";
import { getPeopleAction } from "./people";
import { getAccountsAction } from "./accounts";

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

// In-memory demo store for fallback testing
let demoImportBatches: Record<string, Transaction[]> = {};

/**
 * Bulk imports transactions from parsed rows with automatic counterparty linkage.
 */
export async function bulkImportTransactionsAction(
  payload: BulkImportPayload
): Promise<ImportBatchResult> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized: Please sign in to import transactions.");
  }

  const validRows = payload.rows.filter((r) => r.is_valid);
  if (validRows.length === 0) {
    throw new Error("No valid transactions found in the imported dataset.");
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();

      // 1. Fetch existing people & create any newly mentioned counterparties
      const existingPeople = await getPeopleAction();
      const personMap: Record<string, string> = {};
      for (const p of existingPeople) {
        personMap[p.name.trim().toLowerCase()] = p.id;
      }

      // Identify distinct new people in dataset
      const newPersonNames = new Set<string>();
      for (const row of validRows) {
        if (row.person_name) {
          const norm = row.person_name.trim().toLowerCase();
          if (!personMap[norm]) {
            newPersonNames.add(row.person_name.trim());
          }
        }
      }

      // Auto-insert any newly referenced people
      if (newPersonNames.size > 0) {
        const peopleToInsert = Array.from(newPersonNames).map((name) => ({
          user_id: userId,
          name,
          relationship: "Other",
        }));

        const { data: createdPeople, error: peopleErr } = await supabase
          .from("people")
          .insert(peopleToInsert)
          .select();

        if (!peopleErr && createdPeople) {
          for (const p of createdPeople) {
            personMap[p.name.trim().toLowerCase()] = p.id;
          }
        }
      }

      // 2. Prepare transaction records for bulk insertion
      const recordsToInsert = validRows.map((r) => ({
        user_id: userId,
        account_id: payload.default_account_id,
        person_id: r.person_name
          ? personMap[r.person_name.trim().toLowerCase()] || null
          : null,
        title: r.title.trim(),
        amount: Math.abs(r.amount),
        type: r.type,
        category: r.category || "General",
        date: r.date,
        import_batch_id: payload.batch_id,
      }));

      // Insert in chunks of 250 for optimal database batch throughput
      const CHUNK_SIZE = 250;
      let insertedCount = 0;
      for (let i = 0; i < recordsToInsert.length; i += CHUNK_SIZE) {
        const chunk = recordsToInsert.slice(i, i + CHUNK_SIZE);
        let { error: insertErr } = await supabase
          .from("transactions")
          .insert(chunk);

        // Fallback resilience: If import_batch_id column is not in schema cache, retry without it
        if (
          insertErr &&
          (insertErr.message?.includes("import_batch_id") ||
            insertErr.code === "PGRST204" ||
            insertErr.message?.includes("schema cache"))
        ) {
          console.warn(
            "import_batch_id column not in Supabase schema cache, retrying without it..."
          );
          const fallbackChunk = chunk.map(
            ({ import_batch_id, ...rest }) => rest
          );
          const retryRes = await supabase
            .from("transactions")
            .insert(fallbackChunk);
          insertErr = retryRes.error;
        }

        if (insertErr) {
          console.error("Bulk insert chunk failed:", insertErr.message);
          throw new Error(`Failed during bulk import: ${insertErr.message}`);
        }
        insertedCount += chunk.length;
      }

      // Revalidate affected views
      revalidatePath("/dashboard");
      revalidatePath("/accounts");
      revalidatePath(`/accounts/${payload.default_account_id}`);
      revalidatePath("/stats");
      revalidatePath("/settings/people");

      return {
        success: true,
        batch_id: payload.batch_id,
        inserted_count: insertedCount,
        accounts_impacted: [payload.default_account_id],
      };
    } catch (err: any) {
      console.warn("Supabase bulk import exception, falling back:", err);
      if (!err.message?.includes("fetch")) {
        throw err;
      }
    }
  }

  // Fallback demo in-memory storage
  const mockInserted: Transaction[] = validRows.map((r, i) => ({
    id: `tx-import-${payload.batch_id}-${i}`,
    user_id: userId,
    account_id: payload.default_account_id,
    person_id: null,
    title: r.title,
    amount: r.amount,
    type: r.type,
    category: r.category || "General",
    date: r.date,
    import_batch_id: payload.batch_id,
    created_at: new Date().toISOString(),
  }));

  demoImportBatches[payload.batch_id] = mockInserted;

  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath(`/accounts/${payload.default_account_id}`);
  revalidatePath("/stats");

  return {
    success: true,
    batch_id: payload.batch_id,
    inserted_count: mockInserted.length,
    accounts_impacted: [payload.default_account_id],
  };
}

/**
 * Rollback an imported batch by deleting all transactions matching the batch ID.
 */
export async function rollbackImportBatchAction(batchId: string) {
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
        .eq("import_batch_id", batchId)
        .eq("user_id", userId);

      if (
        error &&
        !error.message?.includes("import_batch_id") &&
        !error.message?.includes("schema cache")
      ) {
        throw new Error(`Rollback failed: ${error.message}`);
      }
    } catch (err: any) {
      console.warn("Supabase rollback error:", err);
    }
  }

  delete demoImportBatches[batchId];

  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath("/stats");

  return { success: true, rolled_back_batch_id: batchId };
}
