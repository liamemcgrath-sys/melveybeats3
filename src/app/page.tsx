import HomeClient from "@/components/HomeClient";
import { toDisplayBeat } from "@/lib/beats";
import type { Database } from "@/lib/database";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars are missing, render empty UI gracefully
  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-16">
        <p className="mt-2 text-slate-500">No beats available.</p>
      </main>
    );
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

  const { data: beats, error } = await supabase
    .from("beats")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-black text-slate-900">Melvey Beats</h1>
        <p className="mt-4 text-red-600 font-semibold">
          Error loading beats: {error.message}
        </p>
      </main>
    );
  }

  const displayBeats = (beats ?? []).map(toDisplayBeat);

  return (
  <main className="max-w-6xl mx-auto px-4 py-16">
    <section className="text-center mb-16">
      <h1 className="text-5xl font-black tracking-tight text-slate-950">
        Melvey Beats
      </h1>
    </section>

    <HomeClient initialBeats={displayBeats} />
  </main>
);
}

