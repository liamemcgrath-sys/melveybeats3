"use client";

import Image from "next/image";
import { useState, useRef } from "react";
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
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

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

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    const progress = progressRef.current;
    if (!audio || !progress) return;

    const percent = (audio.currentTime / 30) * 100;
    progress.style.width = `${Math.min(percent, 100)}%`;

    if (audio.currentTime >= 30) {
      audio.pause();
      audio.currentTime = 0;
      progress.style.width = "0%";
      setIsPlaying(false);
    }
  };

  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg">
      {/* Cover Art */}
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

      {/* Content */}
      <div className="p-5">
        {/* Title + Price */}
        <div className="flex items-start justify-between gap-4">
          <h3 className="truncate text-lg font-black text-slate-950">
            {beat.title}
          </h3>

          <p className="shrink-0 rounded-md bg-slate-950 px-3 py-1.5 text-sm font-black text-white">
            ${beat.price.toFixed(2)}
          </p>
        </div>

        {/* Custom Audio Preview */}
        {beat.audioUrl ? (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-slate-500">
              Preview • 30 seconds
            </p>

            {/* Progress Bar */}
            <div className="relative w-full rounded-md bg-slate-200 h-3 overflow-hidden">
              <div
                ref={progressRef}
                className="h-full bg-slate-900 transition-all duration-100"
                style={{ width: "0%" }}
              />
            </div>

            {/* Hidden Audio Element */}
            <audio
              ref={audioRef}
              className="hidden"
              onTimeUpdate={handleTimeUpdate}
            >
              <source src={beat.audioUrl} type="audio/mpeg" />
            </audio>

            {/* Play Button */}
            <button
              onClick={togglePlay}
              className="mt-3 w-full h-10 rounded-md bg-slate-900 text-white text-sm font-black hover:bg-slate-800 transition"
            >
              {isPlaying ? "Pause Preview" : "Play Preview"}
            </button>
          </div>
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
