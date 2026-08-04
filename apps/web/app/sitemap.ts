import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://twilightstrand.gg";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/community`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
  ];

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

    const buildPages: MetadataRoute.Sitemap = sharedBuilds.map((build) => ({
      url: `${baseUrl}/build/${build.id}`,
      lastModified: build.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [...staticPages, ...buildPages];
  } catch {
    return staticPages;
  }
}
