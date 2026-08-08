import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/sitemap.xml")({
  GET: async () => {
    const baseUrl = process.env.PUBLIC_URL || "https://twilightstrand.gg";

    const staticPages = [
      { url: baseUrl, priority: "1.0", changefreq: "daily" },
      { url: `${baseUrl}/community`, priority: "0.8", changefreq: "hourly" },
    ];

    let buildPages: Array<{ url: string; lastmod: string; priority: string; changefreq: string }> = [];

    try {
      const { db } = await import("@/db");
      const { builds } = await import("@/db/schema");
      const { eq, desc } = await import("drizzle-orm");

      const sharedBuilds = await db
        .select({ id: builds.id, updatedAt: builds.updatedAt })
        .from(builds)
        .where(eq(builds.shared, true))
        .orderBy(desc(builds.updatedAt))
        .limit(500);

      buildPages = sharedBuilds.map((build) => ({
        url: `${baseUrl}/build/${build.id}`,
        lastmod: build.updatedAt ? new Date(build.updatedAt).toISOString() : new Date().toISOString(),
        priority: "0.6",
        changefreq: "weekly",
      }));
    } catch {
      // DB not configured
    }

    const urls = [...staticPages, ...buildPages]
      .map(
        (p) => `  <url>
    <loc>${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>${"lastmod" in p ? `\n    <lastmod>${(p as { lastmod: string }).lastmod}</lastmod>` : ""}
  </url>`,
      )
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return new Response(xml, {
      headers: { "Content-Type": "application/xml" },
    });
  },
});
