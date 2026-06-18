import "./globals.css";

import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-[#eef7ff] via-[#dbeafe] to-[#93c5fd] text-slate-900">
        {children}

        <footer className="mt-20 border-t border-slate-200 py-10 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Melvey Beats — All rights reserved
        </footer>
      </body>
    </html>
  );
}

