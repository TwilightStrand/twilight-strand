import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { handlers } = await import("@/lib/auth");
    return handlers.GET(req as never);
  } catch {
    return NextResponse.json({ error: "Auth not configured. Set DATABASE_URL and OAuth credentials in .env" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const { handlers } = await import("@/lib/auth");
    return handlers.POST(req as never);
  } catch {
    return NextResponse.json({ error: "Auth not configured." }, { status: 503 });
  }
}
