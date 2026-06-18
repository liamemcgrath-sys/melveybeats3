"use client";

import { useState, useRef } from "react";
import { generatePreview } from "@/client/audio";

export default function UploadBeatButton({ isAdmin }: { isAdmin: boolean }) {
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
      // ⭐ Generate preview (ensure it's small)
      const preview = await generatePreview(file);

      if (!preview || preview.size === 0) {
        setError("Preview generation failed");
        setLoading(false);
        return;
      }

      // ⭐ Build form data
      const formData = new FormData();
      formData.append("full", file);
      formData.append("preview", preview);
      formData.append("title", title.trim());
      formData.append("price", price);
      formData.append("password", isAdmin ? "ADMIN_BYPASS" : password);

      // ⭐ Upload
      const res = await fetch("/api/add-beat", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }

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
        {!isAdmin && (
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Owner Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </label>
        )}

        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
          />
        </label>

        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Price
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="input"
          />
        </label>
      </div>

      <button
        onClick={openPicker}
        disabled={loading}
        className="mt-5 h-12 w-full rounded-md bg-gradient-to-br from-cyan-600 to-green-500 text-white text-sm font-black"
      >
        Choose File
      </button>

      <input
        ref={fileRef}
        type="file"
        accept=".mp3,.wav"
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      {file && (
        <button
          onClick={upload}
          disabled={loading}
          className="mt-4 h-12 w-full rounded-md bg-slate-900 text-white text-sm font-black"
        >
          {loading ? "Uploading..." : "Upload Beat"}
        </button>
      )}

      {error && (
        <p className="mt-3 rounded-md bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
