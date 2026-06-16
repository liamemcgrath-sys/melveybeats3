"use client";

import { useState } from "react";
import BeatCard from "./BeatCard";
import UploadBeatButton from "./UploadBeatButton";
import type { DisplayBeat } from "@/lib/beats";

export default function HomeClient({
  initialBeats,
}: {
  initialBeats: DisplayBeat[];
}) {
  const [beats, setBeats] = useState(initialBeats);
  const [password, setPassword] = useState("");
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRemove = (id: string) => {
    setPendingRemovalId(id);
    setPassword("");
    setError("");
  };

  const closeModal = () => {
    setPendingRemovalId(null);
    setPassword("");
    setError("");
    setLoading(false);
  };

  const handleConfirmRemoval = async () => {
    if (!pendingRemovalId) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/delete-beat", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: pendingRemovalId,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to delete beat");
        setLoading(false);
        return;
      }

      setBeats((current) =>
        current.filter((beat) => beat.id !== pendingRemovalId),
      );

      closeModal();
    } catch {
      setError("Network error");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.95),transparent_24%),linear-gradient(135deg,#020617_0%,#0f172a_35%,#1d4ed8_100%)] px-6 py-10 text-slate-900 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="overflow-hidden rounded-[32px] border border-sky-200/80 bg-gradient-to-br from-slate-950 via-blue-700 to-cyan-500 p-8 text-white shadow-[0_30px_90px_-25px_rgba(37,99,235,0.6)] sm:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-bold sm:text-5xl">Melvey Beats</h1>
              <p className="mt-3 max-w-xl text-sm text-sky-50 sm:text-base">
                Premium beats curated for your next release.
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <UploadBeatButton />
            </div>
          </div>
        </section>

        {pendingRemovalId && (
          <section className="rounded-[24px] border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Password required
                </p>
                <p className="text-sm text-slate-500">
                  Enter the owner password to remove this beat.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 outline-none"
                />

                <button
                  type="button"
                  onClick={handleConfirmRemoval}
                  disabled={loading || !password}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {loading ? "Removing..." : "Remove beat"}
                </button>

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
          </section>
        )}

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {beats.length === 0 ? (
            <div className="col-span-full rounded-[24px] border border-dashed border-slate-300/60 bg-white/70 p-8 text-center text-slate-600 shadow-sm">
              No beats available right now.
            </div>
          ) : (
            beats.map((beat) => (
              <BeatCard
                key={beat.id}
                beat={beat}
                onRemove={() => handleRemove(beat.id)}
              />
            ))
          )}
        </section>
      </div>
    </main>
  );
}

