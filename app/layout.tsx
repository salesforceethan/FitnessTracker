import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stride | Fitness Tracker",
  description:
    "Log physical activity, track your progress, and compare momentum with your crew.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
