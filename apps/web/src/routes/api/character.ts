import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/character")({
  server: {
    handlers: {
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const account = url.searchParams.get("account");
    const character = url.searchParams.get("character");
    const realm = url.searchParams.get("realm") || "pc";

    if (!account) {
      return Response.json({ error: "Missing account parameter" }, { status: 400 });
    }

    try {
      if (!character) {
        const resp = await fetch(
          `https://www.pathofexile.com/character-window/get-characters?accountName=${encodeURIComponent(account)}&realm=${realm}`,
          { headers: { "User-Agent": "TwilightStrand/1.0" } },
        );
        if (!resp.ok) {
          return Response.json(
            { error: `PoE API returned ${resp.status}` },
            { status: resp.status === 403 ? 403 : 502 },
          );
        }
        const characters = await resp.json();
        return Response.json({ characters });
      }

      const [itemsResp, passivesResp] = await Promise.all([
        fetch(
          `https://www.pathofexile.com/character-window/get-items?accountName=${encodeURIComponent(account)}&character=${encodeURIComponent(character)}&realm=${realm}`,
          { headers: { "User-Agent": "TwilightStrand/1.0" } },
        ),
        fetch(
          `https://www.pathofexile.com/character-window/get-passive-skills?accountName=${encodeURIComponent(account)}&character=${encodeURIComponent(character)}&realm=${realm}`,
          { headers: { "User-Agent": "TwilightStrand/1.0" } },
        ),
      ]);

      if (!itemsResp.ok || !passivesResp.ok) {
        return Response.json(
          { error: "Failed to fetch character data. Profile may be private." },
          { status: 502 },
        );
      }

      const items = await itemsResp.json();
      const passives = await passivesResp.json();

      return Response.json({ items, passives });
    } catch (e) {
      return Response.json(
        { error: e instanceof Error ? e.message : "Unknown error" },
        { status: 500 },
      );
    }
  },
    },
  },
});
