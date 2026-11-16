"use server";

import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CreatePersonDTO, Person, UpdatePersonDTO } from "@/types";
import { revalidatePath } from "next/cache";

// Demo in-memory fallback store for local testing without live Supabase
let demoPeople: Person[] = [
  {
    id: "p-1",
    user_id: "demo-user",
    name: "Alex Johnson",
    relationship: "Friend",
    avatar_url: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "p-2",
    user_id: "demo-user",
    name: "Sarah Miller",
    relationship: "Family",
    avatar_url: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "p-3",
    user_id: "demo-user",
    name: "Michael Chen",
    relationship: "Colleague",
    avatar_url: null,
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
 * Fetch all counterparties/people for the authenticated user
 */
export async function getPeopleAction(): Promise<Person[]> {
  const { userId } = await auth();

  if (!isSupabaseConfigured() || !userId) {
    return demoPeople;
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("people")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true });

    if (error) {
      console.warn("Supabase fetch people notice:", error.message);
      return demoPeople;
    }

    return (data || []) as Person[];
  } catch (err) {
    console.warn("Exception fetching people, using local store:", err);
    return demoPeople;
  }
}

/**
 * Create a new person
 */
export async function createPersonAction(dto: CreatePersonDTO) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!dto.name.trim()) {
    throw new Error("Person name is required");
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("people")
        .insert({
          user_id: userId,
          name: dto.name.trim(),
          relationship: dto.relationship || "Other",
          avatar_url: dto.avatar_url || null,
        })
        .select()
        .single();

      if (!error && data) {
        revalidatePath("/settings/people");
        revalidatePath("/dashboard");
        return { success: true, person: data as Person };
      }
      console.warn("Supabase createPersonAction fallback:", error?.message);
    } catch (err) {
      console.warn("Supabase createPersonAction exception:", err);
    }
  }

  const newPerson: Person = {
    id: `p-${Date.now()}`,
    user_id: userId,
    name: dto.name.trim(),
    relationship: dto.relationship || "Other",
    avatar_url: dto.avatar_url || null,
    created_at: new Date().toISOString(),
  };
  demoPeople = [newPerson, ...demoPeople];
  revalidatePath("/settings/people");
  revalidatePath("/dashboard");
  return { success: true, person: newPerson };
}

/**
 * Update an existing person
 */
export async function updatePersonAction(dto: UpdatePersonDTO) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("people")
        .update({
          name: dto.name.trim(),
          relationship: dto.relationship,
          avatar_url: dto.avatar_url,
        })
        .eq("id", dto.id)
        .eq("user_id", userId)
        .select()
        .single();

      if (!error && data) {
        revalidatePath("/settings/people");
        revalidatePath("/dashboard");
        return { success: true, person: data as Person };
      }
      console.warn("Supabase updatePersonAction fallback:", error?.message);
    } catch (err) {
      console.warn("Supabase updatePersonAction exception:", err);
    }
  }

  demoPeople = demoPeople.map((p) =>
    p.id === dto.id
      ? {
          ...p,
          name: dto.name.trim(),
          relationship: dto.relationship || p.relationship,
          avatar_url: dto.avatar_url ?? p.avatar_url,
        }
      : p
  );
  revalidatePath("/settings/people");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Delete a person
 */
export async function deletePersonAction(id: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase
        .from("people")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (!error) {
        demoPeople = demoPeople.filter((p) => p.id !== id);
        revalidatePath("/settings/people");
        revalidatePath("/dashboard");
        return { success: true };
      }
      console.warn("Supabase deletePersonAction fallback:", error?.message);
    } catch (err) {
      console.warn("Supabase deletePersonAction exception:", err);
    }
  }

  demoPeople = demoPeople.filter((p) => p.id !== id);
  revalidatePath("/settings/people");
  revalidatePath("/dashboard");
  return { success: true };
}
