import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chart Analyzer",
  description: "Production-ready candlestick analysis toolkit"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface text-slate-100">
        {children}
      </body>
    </html>
  );
}
