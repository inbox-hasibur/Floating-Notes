import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Floating Notes",
  description: "Your personal productivity companion with un-docking, resizing, and always-on-top features.",
  openGraph: {
    title: "Floating Notes",
    description: "Your personal productivity companion with un-docking, resizing, and always-on-top features.",
    url: "https://floatingnotes.app", // Adjust domain later
    siteName: "Floating Notes",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Floating Notes",
    description: "Your personal productivity companion with un-docking, resizing, and always-on-top features.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
