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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beatId: beat.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Checkout failed");

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg">
      {/* Cover Art */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
        {beat.coverUrl ? (
          <Image
            src={beat.coverUrl}
            alt={beat.title}
            fill
            unoptimized
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : null}

      {/* Content */}
      <div className="p-5">
        {/* Title + Price */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-black text-slate-950">
              {beat.title}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Instant preview & checkout
            </p>
          </div>

          <p className="shrink-0 rounded-md bg-slate-950 px-3 py-1.5 text-sm font-black text-white">
            ${beat.price.toFixed(2)}
          </p>
        </div>

        {/* Audio Player */}
        {beat.audioUrl ? (
          <audio controls className="mt-4 w-full">
            <source src={beat.audioUrl} type="audio/mpeg" />
          </audio>
        ) : (
          <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
            Audio unavailable
          </p>
        )}

        {/* Buttons */}
        <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
          <button
            onClick={buyBeat}
            disabled={loading || !beat.audioUrl}
            className="h-11 rounded-md bg-slate-900 px-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? "Opening checkout..." : "Buy Beat"}
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

        {/* Error */}
        {error && (
          <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p>
        )}
      </div>
    </article>
  );
}

