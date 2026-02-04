import type { Metadata } from "next";
import "./globals.css";
import LenisScroll from "./LenisScroll";

export const metadata: Metadata = {
  title: "TKB Generator - Professional Schedule Creator",
  description:
    "Create beautiful, professional timetables from Excel files with customizable themes and export options",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10"
        >
          <div className="absolute inset-0 bg-[radial-gradient(1100px_circle_at_18%_12%,rgba(34,211,238,0.14),transparent_60%),radial-gradient(900px_circle_at_82%_28%,rgba(168,85,247,0.16),transparent_60%),radial-gradient(1000px_circle_at_50%_92%,rgba(236,72,153,0.12),transparent_60%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/70 to-slate-950" />
          <div className="absolute inset-0 bg-noise opacity-[0.06] mix-blend-overlay" />
        </div>
        <LenisScroll />
        {children}
      </body>
    </html>
  );
}
