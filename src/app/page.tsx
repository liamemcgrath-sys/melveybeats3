export default function HomePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24 text-center">
      <h1 className="text-6xl font-black tracking-tight text-slate-900">
        Melvey Beats
      </h1>

      <p className="mt-6 text-xl text-slate-600">
        Cool beats you can buy if u want
      </p>

      <a
        href="/beats"
        className="inline-block mt-10 px-8 py-4 text-lg font-semibold rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition"
      >
        Browse Catalog
      </a>

      {/* Free Beat of the Week */}
      <section className="mt-24 bg-gradient-to-r from-blue-600 to-green-500 text-white py-12 px-6 rounded-2xl shadow-xl">
        <h2 className="text-4xl font-bold mb-4">Free Beat of the Week</h2>
        <p className="text-lg opacity-90 mb-6">
          Download this week’s featured beat completely free.
        </p>

        <div className="bg-white text-black p-6 rounded-xl shadow-md">
          <h3 className="text-2xl font-semibold mb-3">🔥 Your Free Beat Title</h3>

          <audio controls className="w-full mb-4">
            <source src="/free-beat-preview.mp3" type="audio/mpeg" />
          </audio>

          <a
            href="/free-beat-full.wav"
            download
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-5 rounded-lg transition"
          >
            Download Full Beat (Free)
          </a>
        </div>
      </section>
    </main>
  );
}
