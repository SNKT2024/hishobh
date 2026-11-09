"use client";

import { useSession } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { useMemo } from "react";

/**
 * React hook to get a Supabase client automatically configured
 * with the active Clerk user's session token for client-side RLS queries.
 */
export function useSupabase() {
  const { session } = useSession();

  const supabase = useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        async accessToken() {
          if (!session) return null;
          try {
            return await session.getToken({ template: "supabase" });
          } catch {
            return await session.getToken();
          }
        },
      }
    );
  }, [session]);

  return supabase;
}
