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
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-white">Add a beat</p>
          <p className="text-xs text-cyan-100">MP3 or WAV</p>
        </div>
        <p className="rounded-md bg-white/15 px-3 py-1 text-xs font-bold text-cyan-50">
          Owner
        </p>
      </div>

      <div className="grid gap-3">
        <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.16em] text-cyan-100">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Owner password"
            className="h-11 rounded-md border border-white/15 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-cyan-300"
          />
        </label>

        <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.16em] text-cyan-100">
          Price
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="Price"
            className="h-11 rounded-md border border-white/15 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-950 outline-none focus:border-cyan-300"
          />
        </label>
      </div>

      <button
        onClick={openPicker}
        disabled={loading || !password}
        className="mt-4 h-12 w-full rounded-md bg-white text-sm font-black text-slate-950 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
      >
        {loading ? "Uploading..." : "Choose beat file"}
      </button>

      <input
        ref={fileRef}
        type="file"
        accept=".mp3,.wav,audio/mpeg,audio/mp3,audio/wav,audio/x-wav"
        className="hidden"
        onChange={upload}
      />

      {error ? (
        <p className="mt-3 rounded-md bg-rose-500/15 px-3 py-2 text-sm font-semibold text-rose-100">
          {error}
        </p>
      ) : null}
    </div>
  );
}

