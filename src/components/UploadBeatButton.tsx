"use client";

import { useRef, useState } from "react";

export default function UploadBeatButton() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [price, setPrice] = useState("0");
  const [error, setError] = useState("");

  const openPicker = () => {
    fileRef.current?.click();
  };

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
      formData.append("password", password);

      const res = await fetch("/api/add-beat", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Upload failed");
      }

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload error");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-black text-slate-900">Upload Beat</h3>

      <div className="mt-4 grid gap-4">
        {/* PASSWORD */}
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Owner Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-cyan-500"
          />
        </label>

        {/* PRICE */}
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Price (USD)
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="0.00"
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-green-500"
          />
        </label>
      </div>

      {/* BUTTON */}
      <button
        onClick={openPicker}
        disabled={loading || !password}
        className="mt-5 h-12 w-full rounded-md bg-gradient-to-r from-cyan-600 to-green-500 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {loading ? "Uploading..." : "Choose Beat File"}
      </button>

      {/* HIDDEN FILE INPUT */}
      <input
        ref={fileRef}
        type="file"
        accept=".mp3,.wav,audio/mpeg,audio/mp3,audio/wav,audio/x-wav"
        style={{ display: "none" }}
        onChange={upload}
      />

      {/* ERROR */}
      {error && (
        <p className="mt-3 rounded-md bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
