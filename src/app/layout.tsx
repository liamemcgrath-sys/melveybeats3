import "./globals.css";
import { ReactNode } from "react";
import { AnalyticsClient } from "@/components/AnalyticsClient";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body className="relative z-0 min-h-screen text-slate-900">

        {/* TOP GRADIENT BAR */}
        <div className="h-1 w-full bg-gradient-to-r from-cyan-600 to-green-500" />

        {children}

        {/* CLIENT‑SIDE ANALYTICS */}
        <AnalyticsClient />

        <footer className="mt-20 border-t border-cyan-200 py-10 text-center text-sm text-cyan-700">
          © {new Date().getFullYear()} Melvey Beats — All rights reserved
        </footer>
      </body>
    </html>
  );
}
