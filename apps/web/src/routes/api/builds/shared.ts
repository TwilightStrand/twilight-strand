import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/builds/shared")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { db } = await import("@/db");
          const { builds, users } = await import("@/db/schema");
          const { eq, desc } = await import("drizzle-orm");

          const url = new URL(request.url);
          const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "20"));
          const offset = parseInt(url.searchParams.get("offset") || "0");

          const sharedBuilds = await db
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
            .orderBy(desc(builds.createdAt))
            .limit(limit)
            .offset(offset);

          return Response.json({ builds: sharedBuilds });
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
