"use server";

import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
 * Server Action: Uploads a bill/receipt photo to Supabase Storage.
 * Falls back safely to a Data URL if bucket is not yet provisioned.
 */
export async function uploadReceiptAction(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized: Please sign in to attach receipt photos.");
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, error: "No file was selected for upload." };
  }

  // Max 10MB size guard
  if (file.size > 10 * 1024 * 1024) {
    return {
      success: false,
      error: "File is too large. Receipt photos must be under 10MB.",
    };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileExt = file.name ? file.name.split(".").pop()?.toLowerCase() || "jpg" : "jpg";
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  // 1. Upload to Supabase Storage if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();

      // Ensure bucket exists or upload directly
      const { data, error: uploadErr } = await supabase.storage
        .from("receipts")
        .upload(fileName, buffer, {
          contentType: file.type || "image/jpeg",
          upsert: true,
        });

      if (!uploadErr && data) {
        const { data: publicUrlData } = supabase.storage
          .from("receipts")
          .getPublicUrl(fileName);

        if (publicUrlData?.publicUrl) {
          return { success: true, url: publicUrlData.publicUrl };
        }
      }

      console.warn("Supabase storage upload notice:", uploadErr?.message);
    } catch (err: any) {
      console.warn("Supabase storage exception, using fallback:", err);
    }
  }

  // 2. Resilient Fallback: Base64 Data URL (stored in database record directly)
  const mimeType = file.type || "image/jpeg";
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  return { success: true, url: dataUrl };
}

