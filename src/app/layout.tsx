import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDF Conversational",
  description: "Chat with PDFs using citation-aware retrieval.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
