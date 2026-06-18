

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
