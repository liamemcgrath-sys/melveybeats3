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

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const audio = e.currentTarget;
    if (audio.currentTime > 30) {
      audio.currentTime = 0;
      audio.pause();
    }
  };

  const handleSeeking = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const audio = e.currentTarget;
    if (audio.currentTime > 30) {
      audio.currentTime = 0;
      audio.pause();
    }
  };

  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
        {beat.coverUrl && (
          <Image
            src={beat.coverUrl}
            alt={beat.title}
            fill
            unoptimized
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="truncate text-lg font-black text-slate-950">
            {beat.title}
          </h3>

          <p className="shrink-0 rounded-md bg-slate-950 px-3 py-1.5 text-sm font-black text-white">
            ${beat.price.toFixed(2)}
          </p>
        </div>

        {beat.audioUrl ? (
          <div className="mt-4">
            <p className="mb-1 text-xs font-semibold text-slate-500">
              Preview (30 seconds)
            </p>

            <audio
              controls
              className="w-full"
              onTimeUpdate={handleTimeUpdate}
              onSeeking={handleSeeking}
            >
              <source src={beat.audioUrl} type="audio/mpeg" />
            </audio>
          </div>
        ) : (
          <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
            Audio unavailable
          </p>
        )}

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

        {error && (
          <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p>
        )}
      </div>
    </article>
  );
}
