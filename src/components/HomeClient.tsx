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

      {/* TOP HEADER */}
      <header className="w-full border-b border-cyan-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">

          {/* LEFT: SITE TITLE */}
          <h1 className="text-3xl font-bold text-cyan-800">Melvey Beats</h1>

          {/* RIGHT: ADMIN LOGIN / EXIT ADMIN */}
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
