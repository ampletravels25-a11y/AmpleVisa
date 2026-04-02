import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AmpleVisa — Corporate Visa Management Platform",
  description:
    "Streamline your company's visa applications. Browse requirements, apply online, track progress — all in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
