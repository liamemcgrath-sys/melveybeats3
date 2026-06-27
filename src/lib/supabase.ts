import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Create ONE shared client instance
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
);
