import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const account = req.nextUrl.searchParams.get("account");
  const character = req.nextUrl.searchParams.get("character");
  const realm = req.nextUrl.searchParams.get("realm") || "pc";

  if (!account) {
    return NextResponse.json({ error: "Missing account parameter" }, { status: 400 });
  }

  try {
    if (!character) {
      const resp = await fetch(
        `https://www.pathofexile.com/character-window/get-characters?accountName=${encodeURIComponent(account)}&realm=${realm}`,
        { headers: { "User-Agent": "TwilightStrand/1.0" } }
      );
      if (!resp.ok) {
        return NextResponse.json(
          { error: `PoE API returned ${resp.status}` },
          { status: resp.status === 403 ? 403 : 502 }
        );
      }
      const characters = await resp.json();
      return NextResponse.json({ characters });
    }

    const [itemsResp, passivesResp] = await Promise.all([
      fetch(
        `https://www.pathofexile.com/character-window/get-items?accountName=${encodeURIComponent(account)}&character=${encodeURIComponent(character)}&realm=${realm}`,
        { headers: { "User-Agent": "TwilightStrand/1.0" } }
      ),
      fetch(
        `https://www.pathofexile.com/character-window/get-passive-skills?accountName=${encodeURIComponent(account)}&character=${encodeURIComponent(character)}&realm=${realm}`,
        { headers: { "User-Agent": "TwilightStrand/1.0" } }
      ),
    ]);

    if (!itemsResp.ok || !passivesResp.ok) {
      return NextResponse.json(
        { error: "Failed to fetch character data. Profile may be private." },
        { status: 502 }
      );
    }

    const items = await itemsResp.json();
    const passives = await passivesResp.json();

    return NextResponse.json({ items, passives });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
