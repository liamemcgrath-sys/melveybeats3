import HomeClient from "@/components/HomeClient";
import { toDisplayBeat } from "@/lib/beats";
import type { Database } from "@/lib/database";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return <HomeClient initialBeats={[]} />;
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

  const { data: beats, error } = await supabase
    .from("beats")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">Error loading beats</h1>
        <p className="text-red-600">{error.message}</p>
      </main>
    );
  }

  const displayBeats = (beats ?? []).map(toDisplayBeat);

  return <HomeClient initialBeats={displayBeats} />;
}
