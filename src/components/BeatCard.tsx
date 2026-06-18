"use client";

import { useState, useRef } from "react";

export default function UploadBeatButton() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("0");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openPicker = () => fileRef.current?.click();

  async function upload() {
    if (!file) {
      setError("Select a file first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("price", price);
      formData.append("password", password || ""); // admin bypass handled server-side

      const res = await fetch("/api/add-beat", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }

      // Refresh page to show new beat
      window.location.reload();
    } catch (err) {
      setError("Upload error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full rounded-xl border border-cyan-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-black text-slate-900">Upload Beat</h3>

      <div className="mt-4 grid gap-4">
        {/* PASSWORD */}
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Owner Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="input"
          />
        </label>

        {/* TITLE */}
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Beat title"
            className="input"
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
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="input"
          />
        </label>
      </div>

      {/* BUTTON */}
      <button
        onClick={openPicker}
        disabled={loading || !password}
        className="mt-5 h-12 w-full rounded-md bg-gradient-to-br from-cyan-600 to-green-500 text-white text-sm font-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {loading ? "Uploading..." : "Choose Beat File"}
      </button>

      {/* HIDDEN FILE INPUT */}
      <input
        ref={fileRef}
        type="file"
        accept=".mp3,.wav"
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      {/* ERROR */}
      {error && (
        <p className="mt-3 rounded-md bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}

      {/* UPLOAD BUTTON */}
      {file && (
        <button
          onClick={upload}
          disabled={loading}
          className="mt-4 h-12 w-full rounded-md bg-slate-900 text-white text-sm font-black transition hover:bg-slate-800 disabled:bg-slate-400"
        >
          {loading ? "Uploading..." : "Upload Beat"}
        </button>
      )}
    </div>
  );
}
