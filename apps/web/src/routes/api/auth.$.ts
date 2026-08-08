import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { handlers } = await import("@/lib/auth");
          return await handlers.GET(request);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json(
            { error: msg.includes("neon") || msg.includes("DATABASE")
              ? "Auth not configured. Set DATABASE_URL, AUTH_SECRET, and OAuth credentials in .env"
              : msg },
            { status: 503 },
          );
        }
      },
      POST: async ({ request }) => {
        try {
          const { handlers } = await import("@/lib/auth");
          return await handlers.POST(request);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({ error: msg }, { status: 503 });
        }
      },
    },
  },
});
