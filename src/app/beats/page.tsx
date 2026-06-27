"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import BeatCard from "@/components/BeatCard";
import PreviewPlayer from "@/components/PreviewPlayer";

export default function BeatsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );

  const [beats, setBeats] = useState<any[]>([]);
  const [freeBeat, setFreeBeat] = useState<any | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");

  // Upload Beat Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadPrice, setUploadPrice] = useState<number | "">("");
  const [uploadFull, setUploadFull] = useState<File | null>(null);

  // Delete Beat Modal
  const [deleteBeatId, setDeleteBeatId] = useState<number | null>(null);

  // Free Beat Modal
  const [showFreeBeat, setShowFreeBeat] = useState(false);
  const [freeFull, setFreeFull] = useState<File | null>(null);
  const [freeTitle, setFreeTitle] = useState("");

  // Load beats + free beat
  async function loadBeats() {
    // Paid beats
    const { data: beatsData } = await supabase
      .from("beats")
      .select("*")
      .order("created_at", { ascending: false });

    setBeats(beatsData || []);

    // ⭐ NEWEST free beat
    const { data: freeData } = await supabase
      .from("free_beat")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    setFreeBeat(freeData || null);
  }

  useEffect(() => {
    loadBeats();
  }, []);

  // Admin Login
  function loginAdmin() {
    const correct = process.env.NEXT_PUBLIC_OWNER_PASSWORD;

    if (!adminPassword.trim()) {
      alert("Enter password");
      return;
    }

    if (adminPassword !== correct) {
      alert("Incorrect password");
      return;
    }

    setIsAdmin(true);
  }

  // Upload Beat (ONE FILE)
  async function uploadBeat() {
    if (!uploadFull) {
      alert("Missing audio file");
      return;
    }

    const form = new FormData();
    form.append("title", uploadTitle);
    form.append("price", uploadPrice.toString());
    form.append("password", adminPassword);
    form.append("full", uploadFull);

    const res = await fetch("/api/add-beat", {
      method: "POST",
      body: form,
    });

    const data = await res.json();
    alert(data.error || "Beat uploaded!");

    setShowUploadModal(false);
    setUploadTitle("");
    setUploadPrice("");
    setUploadFull(null);

    loadBeats();
  }

  // Delete Beat
  async function deleteBeat(id: number) {
    const res = await fetch("/api/delete-beat", {
      method: "POST",
      body: JSON.stringify({ id, password: adminPassword }),
    });

    const data = await res.json();
    alert(data.error || "Beat deleted!");

    setDeleteBeatId(null);
    loadBeats();
  }

  // Upload Free Beat (ONE FILE)
  async function uploadFreeBeat() {
    if (!freeFull) {
      alert("Missing audio file");
      return;
    }

    const form = new FormData();
    form.append("password", adminPassword);
    form.append("title", freeTitle);
    form.append("full", freeFull);

    const res = await fetch("/api/set-free-beat", {
      method: "POST",
      body: form,
    });

    const data = await res.json();
    alert(data.error || "Free Beat of the Week updated!");

    setShowFreeBeat(false);
    setFreeFull(null);
    setFreeTitle("");

    loadBeats();
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-black text-blue-600 text-center mb-10">
        Beat Previews
      </h1>

      {/* Admin Login */}
      {!isAdmin && (
        <div className="text-center mb-10">
          <input
            type="password"
            placeholder="Owner Password"
            className="border p-2 rounded mr-2"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
          />
          <button
            onClick={loginAdmin}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Admin Login
          </button>
        </div>
      )}

      {/* Admin Controls */}
      {isAdmin && (
        <div className="flex gap-4 mb-10 justify-center">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Upload Beat
          </button>

          <button
            onClick={() => setShowFreeBeat(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Set Free Beat of the Week
          </button>

          <button
            onClick={() => setIsAdmin(false)}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Exit Admin
          </button>
        </div>
      )}

      {/* ⭐ FREE BEAT OF THE WEEK */}
      {freeBeat && (
        <div className="mb-12 p-6 rounded-xl bg-blue-50 border border-blue-200 shadow">
          <h2 className="text-2xl font-bold text-blue-700 mb-2">
            Free Beat of the Week
          </h2>

          <p className="text-lg font-semibold mb-3">{freeBeat.title}</p>

          <PreviewPlayer src={freeBeat.audio_url} />

          <a
            href={freeBeat.audio_url}
            download
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Download Full Beat (Free)
          </a>
        </div>
      )}

      {/* ⭐ Beat List */}
      <div className="mt-12 space-y-6">
        {beats.map((beat, index) => (
          <BeatCard
            key={beat.id}
            beat={beat}
            index={index}
            isAdmin={isAdmin}
            onRemove={() => setDeleteBeatId(beat.id)}
          />
        ))}
      </div>

      {/* Upload Beat Modal */}
      {showUploadModal && (
        <Modal>
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Upload Beat</h2>

            <input
              type="text"
              placeholder="Title"
              className="w-full p-2 border rounded mb-3"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
            />

            <input
              type="number"
              placeholder="Price"
              className="w-full p-2 border rounded mb-3"
              value={uploadPrice}
              onChange={(e) => setUploadPrice(Number(e.target.value))}
            />

            <input
              type="file"
              accept="audio/*"
              className="w-full p-2 border rounded mb-3"
              onChange={(e) => setUploadFull(e.target.files?.[0] || null)}
            />

            <button
              onClick={uploadBeat}
              className="w-full bg-green-600 text-white py-2 rounded mb-3"
            >
              Upload
            </button>

            <button
              onClick={() => setShowUploadModal(false)}
              className="w-full bg-gray-300 py-2 rounded"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Beat Modal */}
      {deleteBeatId !== null && (
        <Modal>
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Delete Beat?</h2>

            <button
              onClick={() => deleteBeat(deleteBeatId)}
              className="w-full bg-red-600 text-white py-2 rounded mb-3"
            >
              Delete
            </button>

            <button
              onClick={() => setDeleteBeatId(null)}
              className="w-full bg-gray-300 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* Free Beat Modal */}
      {showFreeBeat && (
        <Modal>
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Set Free Beat of the Week</h2>

            <input
              type="file"
              accept="audio/*"
              className="w-full p-2 border rounded mb-3"
              onChange={(e) => setFreeFull(e.target.files?.[0] || null)}
            />

            <input
              type="text"
              placeholder="Beat Title"
              className="w-full p-2 border rounded mb-3"
              value={freeTitle}
              onChange={(e) => setFreeTitle(e.target.value)}
            />

            <button
              onClick={uploadFreeBeat}
              className="w-full bg-blue-600 text-white py-2 rounded mb-3"
            >
              Upload Free Beat
            </button>

            <button
              onClick={() => setShowFreeBeat(false)}
              className="w-full bg-gray-300 py-2 rounded"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}

function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      {children}
    </div>
  );
}
