"use client";

import { useState } from "react";
import { DisplayBeat } from "@/types";
import PreviewPlayer from "@/components/PreviewPlayer"; // ⭐ ADD THIS

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
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  async function handleCheckout() {
    if (checkoutLoading) return;

    setCheckoutLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          beatId: beat.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Checkout failed");
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert("No checkout URL returned");
      }
    } catch (err) {
      console.error(err);
      alert("Network error during checkout");
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handleDelete() {
    if (!onRemove) return;
    if (!confirm(`Delete "${beat.title}"?`)) return;

    setLoading(true);

    try {
      const res = await fetch("/api/delete-beat", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: beat.id,
          password: "ADMIN_BYPASS",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Delete failed");
        return;
      }

      onRemove();
    } catch (err) {
      console.error(err);
      alert("Delete error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative rounded-xl border border-cyan-200 bg-white p-5 shadow-sm hover:shadow-md transition">

      {/* TITLE */}
      <h2 className="text-lg font-black text-slate-900">
        {beat.title}
      </h2>

      {/* CUSTOM PREVIEW PLAYER */}
      <PreviewPlayer src={beat.preview_url || beat.audio_url} />

      {/* PRICE */}
      <p className="mt-3 text-sm font-semibold text-slate-700">
        ${beat.price.toFixed(2)}
      </p>

      {/* BUY BUTTON */}
      <button
        onClick={handleCheckout}
        disabled={checkoutLoading}
        className="mt-4 block h-11 w-full rounded-md bg-gradient-to-br from-cyan-600 to-green-500 text-center text-white text-sm font-black hover:opacity-90 transition disabled:opacity-50"
      >
        {checkoutLoading ? "Redirecting..." : "Buy Now"}
      </button>

      {/* ADMIN DELETE */}
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
