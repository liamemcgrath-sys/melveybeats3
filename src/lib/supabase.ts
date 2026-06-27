import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let supabase: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseClient() {
  if (supabase) return supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

  return supabase;
}

