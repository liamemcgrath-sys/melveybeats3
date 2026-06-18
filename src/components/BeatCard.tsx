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

  // Limit preview to 30 seconds
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const audio = e.currentTarget;
    if (audio.currentTime > 30) {
      audio.currentTime = 0;
      audio.pause();
    }
  };

  // Prevent scrubbing past 30 seconds
  const handleSeeking = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const audio = e.currentTarget;
    if (audio.currentTime > 30) {
      audio.currentTime = 0;
      audio.pause();
    }
  };

  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg">
      {/* Cover Art */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
