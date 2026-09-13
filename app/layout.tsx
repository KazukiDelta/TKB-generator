import type { Metadata } from "next";
import "./globals.css";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&family=Itim&family=JetBrains+Mono:wght@400;500;600;700&family=Mali:wght@400;600;700&family=Patrick+Hand&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased bg-[#fdfbf7] dark:bg-[#0e1117] text-[#2d2d2d] dark:text-[#f1f5f9] selection:bg-[#ff4d4d]/25 selection:text-[#2d2d2d]">
        {/* Invisible font warmup element to force browser to download Vietnamese unicode range (U+1EA0-1EF9) immediately */}
        <div
          aria-hidden="true"
          className="sr-only fixed -top-96 -left-96 opacity-0 pointer-events-none select-none"
          tabIndex={-1}
        >
          <span style={{ fontFamily: "'Mali', cursive" }}>THỜI KHÓA BIỂU Sinh Hoạt Đầu Tuần Ngữ văn Vật lí Lịch sử 1234567890</span>
          <span style={{ fontFamily: "'Patrick Hand', cursive" }}>THỜI KHÓA BIỂU Sinh Hoạt Đầu Tuần Ngữ văn Vật lí Lịch sử 1234567890</span>
          <span style={{ fontFamily: "'Baloo 2', cursive" }}>THỜI KHÓA BIỂU Sinh Hoạt Đầu Tuần Ngữ văn Vật lí Lịch sử 1234567890</span>
          <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>THỜI KHÓA BIỂU Sinh Hoạt Đầu Tuần Ngữ văn Vật lí Lịch sử 1234567890</span>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>THỜI KHÓA BIỂU Sinh Hoạt Đầu Tuần Ngữ văn Vật lí Lịch sử 1234567890</span>
          <span style={{ fontFamily: "'Itim', cursive" }}>THỜI KHÓA BIỂU Sinh Hoạt Đầu Tuần Ngữ văn Vật lí Lịch sử 1234567890</span>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 paper-texture opacity-90 dark:opacity-20"
        />
        {children}
      </body>
    </html>
  );
}
