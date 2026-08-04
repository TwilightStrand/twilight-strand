import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth } = await import("@/lib/auth");
    const { db } = await import("@/db");
    const { builds } = await import("@/db/schema");
    const { eq, and } = await import("drizzle-orm");

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { shared } = await req.json();

    await db
      .update(builds)
      .set({ shared: !!shared, updatedAt: new Date() })
      .where(and(eq(builds.id, id), eq(builds.userId, session.user.id)));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Database not configured. Set DATABASE_URL in .env" },
      { status: 503 }
    );
  }
}
