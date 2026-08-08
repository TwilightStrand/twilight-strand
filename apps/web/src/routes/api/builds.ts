import { createFileRoute } from "@tanstack/react-router";

const DB_ERROR = Response.json(
  { error: "Database not configured. Set DATABASE_URL in .env" },
  { status: 503 },
);

export const Route = createFileRoute("/api/builds")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { auth } = await import("@/lib/auth");
          const { db } = await import("@/db");
          const { builds } = await import("@/db/schema");
          const { eq, desc } = await import("drizzle-orm");

          const session = await auth();
          if (!session?.user?.id) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const userBuilds = await db
            .select()
            .from(builds)
            .where(eq(builds.userId, session.user.id))
            .orderBy(desc(builds.updatedAt))
            .limit(50);

          return Response.json({ builds: userBuilds });
        } catch {
          return DB_ERROR;
        }
      },
      POST: async ({ request }) => {
        try {
          const { auth } = await import("@/lib/auth");
          const { db } = await import("@/db");
          const { builds } = await import("@/db/schema");

          const session = await auth();
          if (!session?.user?.id) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const body = await request.json();
          const { name, pobCode, className, ascendancy, level, totalDps, life, energyShield, treeVersion } = body;

          if (!pobCode) {
            return Response.json({ error: "Missing pobCode" }, { status: 400 });
          }

          const [build] = await db
            .insert(builds)
            .values({
              userId: session.user.id,
              name: name || "Unnamed Build",
              pobCode,
              className,
              ascendancy,
              level,
              totalDps: Math.round(totalDps || 0),
              life: Math.round(life || 0),
              energyShield: Math.round(energyShield || 0),
              treeVersion,
            })
            .returning();

          return Response.json({ build });
        } catch {
          return DB_ERROR;
        }
      },
    },
  },
});
