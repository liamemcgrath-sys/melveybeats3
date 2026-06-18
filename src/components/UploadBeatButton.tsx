"use client";

import { useState } from "react";

export default function UploadBeatButton({ isAdmin }: { isAdmin: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");

  async function upload() {
    if (!file) return alert("Select a file first");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("price", price);
    formData.append("password", "ADMIN_BYPASS");

    const res = await fetch("/api/add-beat", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error);

    alert("Beat uploaded!");
  }

  return (
    <div className="card p-6 space-y-4">
      <input
        type="file"
        accept=".mp3,.wav"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <input
        className="input"
        placeholder="Beat title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        className="input"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <button className="btn-primary" onClick={upload}>
        Upload Beat
      </button>
    </div>
  );
}
