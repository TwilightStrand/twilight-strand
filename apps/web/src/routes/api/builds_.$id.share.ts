import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/builds/$id/share")({
  POST: async ({ request, params }) => {
    try {
      const { auth } = await import("@/lib/auth");
      const { db } = await import("@/db");
      const { builds } = await import("@/db/schema");
      const { eq, and } = await import("drizzle-orm");

      const session = await auth();
      if (!session?.user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { shared } = await request.json();

      await db
        .update(builds)
        .set({ shared: !!shared, updatedAt: new Date() })
        .where(and(eq(builds.id, params.id), eq(builds.userId, session.user.id)));

      return Response.json({ ok: true });
    } catch {
      return Response.json(
        { error: "Database not configured. Set DATABASE_URL in .env" },
        { status: 503 },
      );
    }
  },
});
