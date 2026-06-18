"use client";

import { useEffect, useState } from "react";
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

  // NEW: Admin flag
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const flag = localStorage.getItem("isAdmin");
    if (flag === "true") {
      setIsAdmin(true);
    }
  }, []);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pendingRemovalId, password }),
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
    <div className="w-full">
      {/* ADMIN UPLOAD BUTTON */}
      {isAdmin && (
        <div className="max-w-6xl mx-auto px-4 mb-10">
          <UploadBeatButton />
        </div>
      )}

      {/* DELETE MODAL */}
      {pendingRemovalId && (
        <section className="border-y border-rose-200 bg-rose-50">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold text-rose-950">Confirm removal</p>
              <p className="text-sm text-rose-800">
                Enter the owner password to remove this beat.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="h-11 rounded-md border border-rose-300 bg-white px-4 text-sm text-slate-900 outline-none focus:border-rose-500"
              />

              <button
                type="button"
                onClick={handleConfirmRemoval}
                disabled={loading || !password}
                className="h-11 rounded-md bg-rose-600 px-5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:bg-slate-400"
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
            <div className="mx-auto max-w-6xl px-4 pb-4 text-sm text-rose-700">
              {error}
            </div>
          )}
        </section>
      )}

      {/* BEAT GRID */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        {beats.length === 0 ? (
          <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <div>
              <h3 className="mt-5 text-xl font-black text-slate-950">
                No beats available yet
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Upload a beat to get started.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
      </section>
    </div>
  );
}
