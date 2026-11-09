import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase admin client using the Service Role Key.
 * CAUTION: Bypasses Row-Level Security (RLS). Use only in server-side
 * operations where administrative privilege is strictly needed.
 */
export function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin client initialization.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
