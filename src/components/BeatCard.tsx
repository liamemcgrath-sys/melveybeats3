"use client";

import Image from "next/image";
import { useState } from "react";
import type { DisplayBeat } from "@/lib/beats";

export default function BeatCard({
  beat,
  onRemove,
}: {
  beat: DisplayBeat;
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
    <div className="p-4 border rounded-xl shadow-md bg-white">
      <h2 className="text-xl font-bold">{beat.title}</h2>

      {beat.coverUrl ? (
        <Image
          src={beat.coverUrl}
          alt={beat.title}
          width={640}
          height={360}
          unoptimized
          className="mt-3 h-48 w-full rounded object-cover"
        />
      ) : null}

      {beat.audioUrl ? (
        <audio controls className="w-full mt-2">
          <source src={beat.audioUrl} />
        </audio>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Audio unavailable</p>
      )}

      <p className="mt-2 font-semibold">${beat.price.toFixed(2)}</p>

      <button
        onClick={buyBeat}
        disabled={loading || !beat.audioUrl}
        className="mt-3 w-full bg-blue-600 text-white py-2 rounded disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {loading ? "Loading..." : "Buy Beat"}
      </button>

      {onRemove && (
        <button
          onClick={onRemove}
          className="mt-2 w-full bg-red-500 text-white py-2 rounded"
        >
          Delete Beat
        </button>
      )}

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
