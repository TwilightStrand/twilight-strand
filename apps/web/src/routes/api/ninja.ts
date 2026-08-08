import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/ninja")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "builds";
    const league = url.searchParams.get("league") || "Settlers";
    const classParam = url.searchParams.get("class") || "";

    try {
      let apiUrl: string;
      if (type === "builds") {
        apiUrl = `https://poe.ninja/api/data/builds?league=${encodeURIComponent(league)}&type=exp`;
        if (classParam) apiUrl += `&class=${encodeURIComponent(classParam)}`;
      } else {
        return Response.json({ error: "Unsupported type" }, { status: 400 });
      }

      const resp = await fetch(apiUrl, {
        headers: { "User-Agent": "TwilightStrand/1.0" },
      });

      if (!resp.ok) {
        return Response.json({ error: `poe.ninja returned ${resp.status}` }, { status: 502 });
      }

      const data = await resp.json();

      const builds = (data.entries || []).slice(0, 50).map((entry: Record<string, unknown>) => {
        const account = entry.account as Record<string, unknown> | undefined;
        const character = entry.character as Record<string, unknown> | undefined;
        return {
          account: account?.name ?? "",
          character: character?.name ?? "",
          class: character?.class ?? "",
          level: character?.level ?? 0,
          life: entry.life ?? 0,
          energyShield: entry.energyShield ?? 0,
          depth: entry.depth ?? 0,
          treeNodes: entry.hashes,
          skills: entry.skills,
        };
      });

      return Response.json({
        builds,
        total: (data.total as number) || builds.length,
      });
    } catch (e) {
      return Response.json(
        { error: e instanceof Error ? e.message : "Unknown error" },
        { status: 500 },
      );
    }
  },
});
