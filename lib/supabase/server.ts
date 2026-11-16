import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Creates a server-side Supabase client for Server Components, Route Handlers,
 * and Server Actions.
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY if available on the server to avoid JWT mismatches
 * between Clerk asymmetric tokens and Supabase PostgREST. All server actions
 * enforce strict tenant isolation via .eq("user_id", userId).
 */
export async function createServerSupabaseClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");

  // 1. If service role key is present, use it for reliable server-side operations
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey) {
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  // 2. Otherwise try Clerk's Supabase JWT template (if configured in Clerk Dashboard)
  const { getToken } = await auth();
  let token: string | null = null;
  try {
    token = await getToken({ template: "supabase" });
  } catch {
    // DO NOT fallback to raw getToken() as Supabase PostgREST cannot decode Clerk's default RS256 token
    token = null;
  }

  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
