import { createClient } from "@supabase/supabase-js";

/**
 * Creates a browser-side Supabase client with an optional Clerk session token.
 * When a Clerk JWT token is supplied, Supabase requests will contain the Authorization
 * header allowing Row-Level Security (RLS) policies to verify auth.jwt() -> sub.
 */
export function createBrowserSupabaseClient(clerkToken?: string | null) {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: clerkToken ? { Authorization: `Bearer ${clerkToken}` } : {},
    },
  });
}
