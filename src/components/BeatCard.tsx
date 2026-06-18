"use client";

import { useState } from "react";
import { DisplayBeat } from "@/types";

export default function BeatCard({
  beat,
  index,
  isAdmin,
  onRemove,
}: {
  beat: DisplayBeat;
  index: number;
  isAdmin: boolean;
  onRemove?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!onRemove) return;
    if (!confirm(`Delete "${beat.title}"?`)) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/delete-beat?id=${beat.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Delete failed");
        return;
      }

      onRemove();
    } catch (err) {
      alert("Delete error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-cyan-200 bg-white p-5 shadow-sm hover:shadow-md transition">
      {/* TITLE */}
      <h2 className="text-lg font-black text-slate-900">{beat.title}</h2>

      {/* AUDIO PREVIEW */}
      <audio
        controls
        src={beat.audio_url}
        className="mt-3 w-full"
      />

      {/* PRICE */}
      <p className="mt-3 text-sm font-semibold text-slate-700">
        ${beat.price.toFixed(2)}
      </p>

      {/* BUY BUTTON */}
      <a
        href={`/checkout?beatId=${beat.id}`}
        className="mt-4 block h-11 w-full rounded-md bg-gradient-to-br from-cyan-600 to-green-500 text-center text-white text-sm font-black leading-[44px] hover:opacity-90 transition"
      >
        Buy Now
      </a>

      {/* ADMIN DELETE BUTTON */}
      {isAdmin && (
        <button
          onClick={handleDelete}
          disabled={loading}
          className="mt-3 h-10 w-full rounded-md bg-rose-600 text-white text-sm font-black hover:bg-rose-700 transition disabled:bg-rose-300"
        >
          {loading ? "Deleting..." : "Delete Beat"}
        </button>
      )}
    </div>
  );
}
