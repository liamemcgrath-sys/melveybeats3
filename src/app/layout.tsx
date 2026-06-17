

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          fontFamily: "Arial, sans-serif",
          background:
            "linear-gradient(135deg, #eef7ff 0%, #dbeafe 35%, #93c5fd 100%)",
          color: "#0f172a",
        }}
      >
        {/* NAVBAR */}
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight bg-gradient-to-r from-cyan-600 to-green-500 bg-clip-text text-transparent">
              Melvey Beats
            </h2>

            <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
              <a href="/" className="hover:text-slate-900 transition">
                Home
              </a>
              <a href="/contact" className="hover:text-slate-900 transition">
                Contact
              </a>
            </nav>
          </div>
        </header>

        {/* PAGE CONTENT */}
        {children}

        {/* FOOTER */}
        <footer className="mt-20 border-t border-slate-200 py-10 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Melvey Beats — All rights reserved
        </footer>
      </body>
    </html>
  );
}
