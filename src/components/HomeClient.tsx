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

  // DELETE MODAL STATE
  const [password, setPassword] = useState("");
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ADMIN LOGIN STATE
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  useEffect(() => {
    const flag = localStorage.getItem("isAdmin");
    if (flag === "true") {
      setIsAdmin(true);
    }
  }, []);

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      localStorage.setItem("isAdmin", "true");
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
      {/* ADMIN LOGIN BUTTON (if not admin) */}
      {!isAdmin && (
        <div className="max-w-6xl mx-auto px-4 mb-6">
          <button
            onClick={() => setShowAdminLogin(true)}
            className="h-11 rounded-md bg-slate-900 px-5 text-sm font-black text-white hover:bg-slate-800 transition"
          >
            Admin Login
          </button>
        </div>
      )}

      {/* ADMIN LOGIN MODAL */}
      {showAdminLogin && (
        <section className="border-y border-slate-300 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Admin Login</p>
              <p className="text-sm text-slate-600">
                Enter the admin password to unlock upload mode.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Admin password"
                className="h-11 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none focus:border-cyan-500"
              />

              <button
                onClick={handleAdminLogin}
                className="h-11 rounded-md bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-800 transition"
              >
                Login
              </button>

              <button
                onClick={() => setShowAdminLogin(false)}
                className="h-11 rounded-md border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
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
          <UploadBeatButton />
        </div>
      )}

      {/* ⭐ EXIT ADMIN BUTTON (NEW) */}
      {isAdmin && (
        <div className="max-w-6xl mx-auto px-4 mb-6">
          <button
            onClick={() => {
              localStorage.removeItem("isAdmin");
              setIsAdmin(false);
            }}
            className="h-11 rounded-md border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            Exit Admin
          </button>
        </div>
      )}

      {/* DELETE MODAL */}
      {pendingRemovalId && (
        <section className="border-y border-rose-200 bg-rose-50">
          {/* ... unchanged ... */}
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
