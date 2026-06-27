"use server";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let supabaseAdmin: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or URL");
  }

  supabaseAdmin = createClient<Database>(supabaseUrl, serviceKey);

  return supabaseAdmin;
}
