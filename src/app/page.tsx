import { toDisplayBeat } from "@/lib/beats";
import type { Database } from "@/lib/database";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

import HomeClient from "@/components/HomeClient";


export default async function Home() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <main className="relative z-10 max-w-6xl mx-auto px-4 pt-16 pb-40">
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
      <main className="relative z-10 max-w-6xl mx-auto px-4 pt-16 pb-40">
        <h1 className="text-4xl font-black text-blue-600 text-center">
          Melvey Beats
        </h1>
        <p className="mt-4 text-red-600 font-semibold">
          Error loading beats: {error.message}
        </p>
      </main>
    );
  }

  const displayBeats = (beats ?? []).map(toDisplayBeat);

  return (
    <main className="relative z-10 max-w-6xl mx-auto px-4 pt-16 pb-40">
      <section className="text-center mb-16">
        <h1 className="text-5xl font-black tracking-tight text-blue-600 text-center">
          Melvey Beats
        </h1>
      </section>

      <HomeClient initialBeats={displayBeats} />
    </main>
  );
}
