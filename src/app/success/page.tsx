import Link from "next/link";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function SuccessPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = searchParams ? await searchParams : {};
  const sessionId =
    typeof params.session_id === "string" ? params.session_id : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-sky-50 px-6 py-10">
      <div className="w-full max-w-xl rounded-[24px] border border-sky-100 bg-white p-8 text-center shadow-[0_16px_50px_-20px_rgba(2,132,199,0.35)]">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
          Purchase complete
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          Thanks for your order.
        </h1>
        <p className="mt-3 text-slate-600">
          Your beat purchase is ready to enjoy. A confirmation has been prepared
          for your order.
        </p>

        {sessionId && (
          <a
            href={`/api/download-beat?session_id=${sessionId}`}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            Download Full Beat
          </a>
        )}

        <Link
          href="/"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
        >
          Back to beats
        </Link>
      </div>
    </main>
  );
}
