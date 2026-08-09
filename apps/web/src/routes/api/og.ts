import { createFileRoute } from "@tanstack/react-router";

function fmtNum(n: string): string {
  const num = parseInt(n);
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${Math.round(num / 1e3)}k`;
  return String(num);
}

let fontCache: ArrayBuffer | null = null;

async function loadFont(): Promise<ArrayBuffer> {
  if (fontCache) return fontCache;
  const res = await fetch(
    "https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-400-normal.woff",
  );
  fontCache = await res.arrayBuffer();
  return fontCache;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export const Route = createFileRoute("/api/og")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const name = url.searchParams.get("name") || "Unnamed Build";
        const cls = url.searchParams.get("class") || "";
        const asc = url.searchParams.get("ascendancy") || "";
        const level = url.searchParams.get("level") || "1";
        const dps = url.searchParams.get("dps") || "0";
        const life = url.searchParams.get("life") || "0";
        const es = url.searchParams.get("es") || "0";

        const statParts: string[] = [];
        if (parseInt(dps) > 0) statParts.push(`${fmtNum(dps)} DPS`);
        if (parseInt(life) > 1) statParts.push(`${fmtNum(life)} Life`);
        if (parseInt(es) > 0) statParts.push(`${fmtNum(es)} ES`);

        try {
          const satori = (await import("satori")).default;
          const { Resvg } = await import("@resvg/resvg-js");
          const fontData = await loadFont();

          const element = {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, #050810 0%, #0a1628 50%, #050810 100%)",
                fontFamily: "JetBrains Mono",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: { color: "#06b6d4", fontSize: 24, marginBottom: 16 },
                    children: "Twilight Strand",
                  },
                },
                {
                  type: "div",
                  props: {
                    style: { color: "white", fontSize: 48, fontWeight: "bold", marginBottom: 12, textAlign: "center", padding: "0 40px" },
                    children: name,
                  },
                },
                {
                  type: "div",
                  props: {
                    style: { color: "#9ca3af", fontSize: 28, marginBottom: 40 },
                    children: `${asc || cls} Level ${level}`,
                  },
                },
                ...(statParts.length > 0
                  ? [{
                      type: "div",
                      props: {
                        style: { color: "#06b6d4", fontSize: 32 },
                        children: statParts.join("  ·  "),
                      },
                    }]
                  : []),
              ],
            },
          };

          const svg = await satori(element as any, {
            width: 1200,
            height: 630,
            fonts: [{
              name: "JetBrains Mono",
              data: fontData,
              weight: 400,
              style: "normal" as const,
            }],
          });

          const resvg = new Resvg(svg, {
            fitTo: { mode: "width" as const, value: 1200 },
          });
          const png = resvg.render().asPng();

          return new Response(new Uint8Array(png), {
            headers: {
              "Content-Type": "image/png",
              "Cache-Control": "public, max-age=86400",
            },
          });
        } catch (err) {
          console.error("OG PNG generation failed, falling back to SVG:", err);

          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#050810"/>
      <stop offset="50%" stop-color="#0a1628"/>
      <stop offset="100%" stop-color="#050810"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="600" y="220" text-anchor="middle" fill="#06b6d4" font-family="monospace" font-size="24">Twilight Strand</text>
  <text x="600" y="290" text-anchor="middle" fill="white" font-family="monospace" font-size="48" font-weight="bold">${escapeXml(name)}</text>
  <text x="600" y="340" text-anchor="middle" fill="#9ca3af" font-family="monospace" font-size="28">${escapeXml(asc || cls)} Level ${escapeXml(level)}</text>
  <text x="600" y="420" text-anchor="middle" fill="#06b6d4" font-family="monospace" font-size="32">${escapeXml(statParts.join("  ·  "))}</text>
</svg>`;

          return new Response(svg, {
            headers: {
              "Content-Type": "image/svg+xml",
              "Cache-Control": "public, max-age=86400",
            },
          });
        }
      },
    },
  },
});
