import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") || "builds";
  const league = req.nextUrl.searchParams.get("league") || "Settlers";
  const classParam = req.nextUrl.searchParams.get("class") || "";

  try {
    let url: string;
    if (type === "builds") {
      url = `https://poe.ninja/api/data/builds?league=${encodeURIComponent(league)}&type=exp`;
      if (classParam) url += `&class=${encodeURIComponent(classParam)}`;
    } else {
      return NextResponse.json({ error: "Unsupported type" }, { status: 400 });
    }

    const resp = await fetch(url, {
      headers: { "User-Agent": "TwilightStrand/1.0" },
      next: { revalidate: 300 },
    });

    if (!resp.ok) {
      return NextResponse.json(
        { error: `poe.ninja returned ${resp.status}` },
        { status: 502 }
      );
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

    return NextResponse.json({
      builds,
      total: (data.total as number) || builds.length,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
