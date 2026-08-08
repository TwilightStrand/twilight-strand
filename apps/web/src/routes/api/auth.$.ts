import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/auth/$")({
  GET: async ({ request }) => {
    try {
      const { handlers } = await import("@/lib/auth");
      return handlers.GET(request);
    } catch {
      return Response.json(
        { error: "Auth not configured. Set DATABASE_URL and OAuth credentials in .env" },
        { status: 503 },
      );
    }
  },
  POST: async ({ request }) => {
    try {
      const { handlers } = await import("@/lib/auth");
      return handlers.POST(request);
    } catch {
      return Response.json({ error: "Auth not configured." }, { status: 503 });
    }
  },
});
