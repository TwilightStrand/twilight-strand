import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Twilight Strand - PoE Build Planner",
  description:
    "Open-source Path of Exile build planner. Import PoB codes for instant DPS, defence, and tree analysis.",
  themeColor: "#050810",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
