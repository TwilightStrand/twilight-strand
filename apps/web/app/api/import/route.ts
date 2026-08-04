import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    let codeUrl: string;

    if (url.includes("pobb.in/")) {
      const id = url.split("pobb.in/").pop()?.split(/[?#]/)[0];
      if (!id) throw new Error("Invalid pobb.in URL");
      codeUrl = `https://pobb.in/pob/${id}`;
    } else if (url.includes("pastebin.com/")) {
      const id = url.split("pastebin.com/").pop()?.replace("raw/", "").split(/[?#]/)[0];
      if (!id) throw new Error("Invalid pastebin URL");
      codeUrl = `https://pastebin.com/raw/${id}`;
    } else {
      return NextResponse.json({ error: "Unsupported URL" }, { status: 400 });
    }

    const resp = await fetch(codeUrl, {
      headers: { "User-Agent": "TwilightStrand/1.0" },
    });

    if (!resp.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${resp.status}` },
        { status: 502 }
      );
    }

    const code = await resp.text();
    return NextResponse.json({ code: code.trim() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
