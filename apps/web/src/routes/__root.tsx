import type { ReactNode } from "react";
import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" },
      { title: "Twilight Strand - PoE Build Planner" },
      { name: "description", content: "Open-source Path of Exile build planner. Import PoB codes for instant DPS, defence, and tree analysis." },
      { name: "theme-color", content: "#050810" },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("tsc-theme");if(t&&t!=="dark"){document.documentElement.setAttribute("data-theme",t);document.documentElement.className=t}var p=localStorage.getItem("tsc-perf");if(p==="true"){document.documentElement.classList.add("perf-mode")}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-dvh antialiased">
        {children}
        <Scripts />
        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker" in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("/sw.js")})}`,
          }}
        />
      </body>
    </html>
  );
}
