import { createFileRoute } from "@tanstack/react-router";

function fmtNum(n: string): string {
  const num = parseInt(n);
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${Math.round(num / 1e3)}k`;
  return String(num);
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
      },
    },
  },
});
