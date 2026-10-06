import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PackRL_ — Fewer boxes. Less air.",
  description:
    "A reinforcement-learning agent that learns where every parcel goes, and decides in under 50 milliseconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolageGrotesque.variable} ${geistSans.variable} ${geistMono.variable} dark`}
    >
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased selection:bg-[var(--teal)]/20 selection:text-[var(--teal)]">
        {children}
      </body>
    </html>
  );
}
