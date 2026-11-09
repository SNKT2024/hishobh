import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Creates a server-side Supabase client for Server Components, Route Handlers,
 * and Server Actions. Automatically fetches the authenticated Clerk user's
 * Supabase JWT token and attaches it to the Authorization header for RLS.
 */
export async function createServerSupabaseClient() {
  const { getToken } = await auth();
  
  // Try retrieving with the 'supabase' JWT template, fallback to standard token if template isn't set
  let token: string | null = null;
  try {
    token = await getToken({ template: "supabase" });
  } catch {
    token = await getToken();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
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
