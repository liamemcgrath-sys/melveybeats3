"use client";

import React from "react";

export default function FreeBeatOfTheWeek() {
  return (
    <section className="w-full bg-gradient-to-r from-blue-600 to-green-500 text-white py-12 px-6 rounded-xl shadow-lg mt-12">
      <h2 className="text-3xl font-bold mb-4">Free Beat of the Week</h2>
      <p className="text-lg mb-6 opacity-90">
        Download this week’s featured beat completely free. New beat drops every Monday.
      </p>

      <div className="bg-white text-black p-6 rounded-lg shadow-md">
        <h3 className="text-2xl font-semibold mb-2">🔥 Beat Title Here</h3>
        <audio controls className="w-full mb-4">
          <source src="/free-beat-preview.mp3" type="audio/mpeg" />
        </audio>

        <a
          href="/free-beat-full.wav"
          download
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          Download Full Beat (Free)
        </a>
      </div>
    </section>
  );
}
