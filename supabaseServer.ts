import Link from "next/link";

export default function CancelPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
      <div className="w-full max-w-xl rounded-[24px] border border-slate-200 bg-white p-8 text-center shadow-[0_16px_50px_-20px_rgba(15,23,42,0.2)]">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
          Payment canceled
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          No problem.
        </h1>
        <p className="mt-3 text-slate-600">
          Your checkout was canceled. You can return to the beat catalog
          anytime.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Back to beats
        </Link>
      </div>
    </main>
  );
}

