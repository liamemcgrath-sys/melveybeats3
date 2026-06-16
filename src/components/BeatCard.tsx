"use client";

import Image from "next/image";
import { useState } from "react";
import type { DisplayBeat } from "@/lib/beats";

const artStyles = [
  "from-slate-950 via-cyan-800 to-teal-400",
  "from-slate-950 via-indigo-800 to-fuchsia-500",
  "from-slate-950 via-emerald-800 to-lime-400",
  "from-slate-950 via-rose-800 to-orange-400",
];

export default function BeatCard({
  beat,
  index = 0,
  onRemove,
}: {
  beat: DisplayBeat;
  index?: number;
  onRemove?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const artStyle = artStyles[index % artStyles.length];

  const buyBeat = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ beatId: beat.id }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Checkout failed");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-xl">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
        {beat.coverUrl ? (
          <Image
            src={beat.coverUrl}
            alt={beat.title}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            unoptimized
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className={`grid h-full w-full place-items-center bg-gradient-to-br ${artStyle}`}
          >
            <div className="grid h-24 w-24 place-items-center rounded-full border border-white/30 bg-white/10 text-5xl font-black text-white shadow-2xl backdrop-blur">
              M
            </div>
          </div>
        )}
        <div className="absolute left-3 top-3 rounded-md bg-white/90 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-900 shadow-sm">
          Beat
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-xl font-black text-slate-950">
              {beat.title}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Instant preview and checkout
            </p>
          </div>
          <p className="shrink-0 rounded-md bg-slate-950 px-3 py-2 text-sm font-black text-white">
            ${beat.price.toFixed(2)}
          </p>
        </div>

        {beat.audioUrl ? (
          <audio controls className="mt-4 w-full">
            <source src={beat.audioUrl} />
          </audio>
        ) : (
          <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
            Audio unavailable
          </p>
        )}

        <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
          <button
            onClick={buyBeat}
            disabled={loading || !beat.audioUrl}
            className="h-11 rounded-md bg-cyan-600 px-4 text-sm font-black text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? "Opening checkout..." : "Buy beat"}
          </button>

          {onRemove && (
            <button
              onClick={onRemove}
              className="h-11 rounded-md border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-700 transition hover:bg-rose-100"
            >
              Delete
            </button>
          )}
        </div>

        {error && <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p>}
      </div>
    </article>
  );
}

