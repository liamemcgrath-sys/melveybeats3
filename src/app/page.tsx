export default function HomePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24 text-center">
      <h1 className="text-6xl font-black tracking-tight text-slate-900">
        Melvey Beats
      </h1>

      <p className="mt-6 text-xl text-slate-600">
        Cool Beats you can buy if u want
      </p>

      <a
        href="/beats"
        className="inline-block mt-10 px-8 py-4 text-lg font-semibold rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition"
      >
        Browse Catalog
      </a>
    </main>
  );
}
