import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/robots/txt")({
  server: {
    handlers: {
      GET: async () => {
        const baseUrl = process.env.PUBLIC_URL || "https://twilightstrand.gg";
        const body = `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
        return new Response(body, { headers: { "Content-Type": "text/plain" } });
      },
    },
  },
});
