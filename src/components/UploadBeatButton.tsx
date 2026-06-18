"use client";

import { useRef, useState } from "react";

export default function UploadBeatButton({ isAdmin }: { isAdmin: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [price, setPrice] = useState("0");
  const [error, setError] = useState("");

  const openPicker = () => fileRef.current?.click();

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("audio", file);
      formData.append("title", file.name);
      formData.append("price", price);
      formData.append("password", isAdmin ? "ADMIN_BYPASS" : password);

      const res = await fetch("/api/add-beat", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Upload failed");

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload error");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="card w-full p-5">
      <h3 className="text-lg font-black text-cyan-800">Upload Beat</h3>

      <div className="mt-4 grid gap-4">
        {!isAdmin && (
          <label className="grid gap-1 text-sm font-semibold text-cyan-700">
            Owner Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </label>
        )}

        <label className="grid gap-1 text-sm font-semibold text-cyan-700">
          Price (USD)
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="input"
          />
        </label>
      </div>

      <button
        onClick={openPicker}
        disabled={loading || (!isAdmin && !password)}
        className="btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Choose Beat File"}
      </button>

      <input
        ref={fileRef}
        type="file"
        accept=".mp3,.wav,audio/mpeg,audio/mp3,audio/wav,audio/x-wav"
        className="hidden"
        onChange={upload}
      />

      {error && (
        <p className="mt-3 rounded-md bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
