"use client";

import { useMemo, useState } from "react";
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

  const beatCount = beats.length;
  const catalogTotal = useMemo(
    () => beats.reduce((sum, beat) => sum + beat.price, 0),
    [beats],
  );

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
    <main className="min-h-screen bg-[#0b0e13] text-slate-950">
      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#111827_0%,#102a43_42%,#0e7490_100%)] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_380px] lg:items-end lg:py-12">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">
              Melvey Beats
            </p>
            <h1 className="mt-4 max-w-2xl text-5xl font-black leading-[0.95] sm:text-7xl">
              Beat store built for clean previews.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-200">
              Browse, preview, upload, and sell your catalog from one focused
              storefront.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-4 shadow-2xl shadow-slate-950/25 backdrop-blur">
            <UploadBeatButton />
          </div>
        </div>
      </section>

      <section className="bg-[#f5f7fb]">
        <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Tracks
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {beatCount}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Catalog
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                ${catalogTotal.toFixed(0)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Checkout
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                Live
              </p>
            </div>
          </div>
        </div>
      </section>

      {pendingRemovalId && (
        <section className="border-y border-rose-200 bg-rose-50">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold text-rose-950">
                Confirm removal
              </p>
              <p className="text-sm text-rose-800">
                Enter the owner password to remove this beat from the catalog.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="h-11 min-w-0 rounded-md border border-rose-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-rose-500"
              />

              <button
                type="button"
                onClick={handleConfirmRemoval}
                disabled={loading || !password}
                className="h-11 rounded-md bg-rose-600 px-5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {loading ? "Removing..." : "Remove beat"}
              </button>

              <button
                type="button"
                onClick={closeModal}
                className="h-11 rounded-md border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>

          {error && (
            <div className="mx-auto max-w-7xl px-5 pb-4 text-sm text-rose-700 sm:px-8">
              {error}
            </div>
          )}
        </section>
      )}

      <section className="bg-[#f5f7fb]">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                Catalog
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Available beats
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              Preview tracks before checkout.
            </p>
          </div>

          {beats.length === 0 ? (
            <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
              <div>
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-lg bg-[linear-gradient(135deg,#0f172a,#0891b2)] text-3xl font-black text-white">
                  M
                </div>
                <h3 className="mt-5 text-xl font-black text-slate-950">
                  No beats available yet
                </h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Once a beat is uploaded, it will appear here with its player,
                  price, and checkout action.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {beats.map((beat, index) => (
                <BeatCard
                  key={beat.id}
                  beat={beat}
                  index={index}
                  onRemove={() => handleRemove(beat.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

