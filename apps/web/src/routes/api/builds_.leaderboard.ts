import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/builds_/leaderboard")({
  server: {
    handlers: {
  GET: async ({ request }) => {
    try {
      const { db } = await import("@/db");
      const { builds, users } = await import("@/db/schema");
      const { eq, desc } = await import("drizzle-orm");

      const url = new URL(request.url);
      const sortBy = url.searchParams.get("sort") || "dps";
      const classFilter = url.searchParams.get("class") || "";
      const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "20"));

      let orderBy;
      switch (sortBy) {
        case "dps":
          orderBy = desc(builds.totalDps);
          break;
        case "life":
          orderBy = desc(builds.life);
          break;
        case "es":
          orderBy = desc(builds.energyShield);
          break;
        case "recent":
          orderBy = desc(builds.createdAt);
          break;
        default:
          orderBy = desc(builds.totalDps);
      }

      const results = await db
        .select({
          id: builds.id,
          name: builds.name,
          className: builds.className,
          ascendancy: builds.ascendancy,
          level: builds.level,
          totalDps: builds.totalDps,
          life: builds.life,
          energyShield: builds.energyShield,
          pobCode: builds.pobCode,
          createdAt: builds.createdAt,
          authorName: users.name,
          authorImage: users.image,
        })
        .from(builds)
        .leftJoin(users, eq(builds.userId, users.id))
        .where(eq(builds.shared, true))
        .orderBy(orderBy)
        .limit(limit);

      const filtered = classFilter
        ? results.filter(
            (b: { className: string | null; ascendancy: string | null }) =>
              b.className?.toLowerCase() === classFilter.toLowerCase() ||
              b.ascendancy?.toLowerCase() === classFilter.toLowerCase(),
          )
        : results;

      return Response.json({ builds: filtered });
    } catch {
      return Response.json(
        { error: "Database not configured. Set DATABASE_URL in .env" },
        { status: 503 },
      );
    }
  },
    },
  },
});
