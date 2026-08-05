import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Twilight Strand - PoE Build Planner",
  description: "Open-source Path of Exile build planner. Import PoB codes for instant DPS, defence, and tree analysis.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Twilight Strand",
  },
};

export const viewport: Viewport = {
  themeColor: "#050810",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("tsc-theme");if(t&&t!=="dark"){document.documentElement.setAttribute("data-theme",t);document.documentElement.className=t}var p=localStorage.getItem("tsc-perf");if(p==="true"){document.documentElement.classList.add("perf-mode")}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-dvh antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ("serviceWorker" in navigator) {
                window.addEventListener("load", function () {
                  navigator.serviceWorker.register("/sw.js");
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
