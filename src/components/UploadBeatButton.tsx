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

      alert("Beat uploaded!");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload error");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Owner password"
          className="min-w-0 rounded border border-slate-300 px-3 py-2 text-sm text-slate-900"
        />
        <input
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          placeholder="Price"
          className="min-w-0 rounded border border-slate-300 px-3 py-2 text-sm text-slate-900"
        />
      </div>

      <button
        onClick={openPicker}
        disabled={loading || !password}
        className="rounded bg-blue-500 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {loading ? "Uploading..." : "Upload Beat"}
      </button>

      <input
        ref={fileRef}
        type="file"
        accept=".mp3,.wav,audio/mpeg,audio/mp3,audio/wav,audio/x-wav"
        className="hidden"
        onChange={upload}
      />

      {error ? <p className="mt-3 text-sm text-red-100">{error}</p> : null}
    </>
  );
}
