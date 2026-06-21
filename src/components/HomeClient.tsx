"use client";

import { useState } from "react";
import BeatCard from "./BeatCard";
import UploadBeatButton from "./UploadBeatButton";
import type { DisplayBeat } from "@/types";

export default function HomeClient({
  initialBeats,
}: {
  initialBeats: DisplayBeat[];
}) {
  const [beats, setBeats] = useState(initialBeats);

  // DELETE MODAL STATE
  const [password, setPassword] = useState("");
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ADMIN LOGIN STATE
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD as string;

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPassword("");
    } else {
      alert("Incorrect admin password");
    }
  };

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
        body: JSON.stringify({
          id: pendingRemovalId,
          password: isAdmin ? "ADMIN_BYPASS" : password,
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
    <div className="w-full relative z-10">

      {/* TOP BAR — CLEAN, NO WHITE BOX */}
      <div className="w-full max-w-6xl mx-auto px-4 pt-4 flex items-center justify-end">
        {!isAdmin ? (
          <button
            onClick={() => setShowAdminLogin(true)}
            className="btn-primary"
          >
            Admin Login
          </button>
        ) : (
          <button
            onClick={() => setIsAdmin(false)}
            className="btn-secondary"
          >
            Exit Admin
          </button>
        )}
      </div>

      {/* TITLE */}
      <div className="w-full max-w-6xl mx-auto px-4 mt-2">
        <h1 className="text-3xl font-bold text-cyan-800">Melvey Beats</h1>
      </div>

      {/* ADMIN MODE BANNER */}
      {isAdmin && (
        <div className="w-full bg-gradient-to-r from-cyan-600 to-green-500 text-white text-center py-2 text-sm font-bold shadow">
          Admin Mode Active
        </div>
      )}

      {/* ADMIN LOGIN MODAL */}
      {showAdminLogin && (
        <section className="border-y border-cyan-300 bg-cyan-50">
          <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-cyan-800">Admin Login</p>
              <p className="text-sm text-cyan-700">
                Enter the admin password to unlock upload mode.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Admin password"
                className="input"
              />

              <button onClick={handleAdminLogin} className="btn-primary">
                Login
              </button>

              <button
                onClick={() => setShowAdminLogin(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ADMIN UPLOAD BUTTON */}
      {isAdmin && (
        <div className="max-w-6xl mx-auto px-4 mb-10">
          <UploadBeatButton isAdmin={isAdmin} />
        </div>
      )}

      {/* DELETE MODAL */}
      {pendingRemovalId && (
        <section className="border-y border-rose-300 bg-rose-50">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <p className="font-bold text-rose-700">Confirm Delete</p>

            {!isAdmin && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Owner password"
                className="input mt-2 border-rose-300 focus:border-rose-500 focus:ring-rose-400"
              />
            )}

            {error && (
              <p className="mt-2 text-sm font-semibold text-rose-700">
                {error}
              </p>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleConfirmRemoval}
                disabled={loading}
                className="btn-danger disabled:opacity-50"
              >
                {loading ? "Deleting..." : "Delete"}
              </button>

              <button onClick={closeModal} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </section>
      )}

      {/* BEAT GRID */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        {beats.length === 0 ? (
          <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-cyan-300 bg-white p-8 text-center">
            <div>
              <h3 className="mt-5 text-xl font-black text-cyan-800">
                No beats available yet
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-cyan-700">
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
                isAdmin={isAdmin}
                onRemove={isAdmin ? () => handleRemove(beat.id) : undefined}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
