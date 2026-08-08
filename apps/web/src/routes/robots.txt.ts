import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/robots.txt")({
  GET: async () => {
    const baseUrl = process.env.PUBLIC_URL || "https://twilightstrand.gg";
    const body = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;
    return new Response(body, {
      headers: { "Content-Type": "text/plain" },
    });
  },
});
