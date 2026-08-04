import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { db } = await import("@/db");
    const { builds, users } = await import("@/db/schema");
    const { eq, desc } = await import("drizzle-orm");

    const limit = Math.min(50, parseInt(req.nextUrl.searchParams.get("limit") || "20"));
    const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");

    const sharedBuilds = await db
      .select({
        id: builds.id,
        name: builds.name,
        className: builds.className,
        ascendancy: builds.ascendancy,
        level: builds.level,
        totalDps: builds.totalDps,
        life: builds.life,
        energyShield: builds.energyShield,
        pobCode: builds.pobCode,
        createdAt: builds.createdAt,
        authorName: users.name,
        authorImage: users.image,
      })
      .from(builds)
      .leftJoin(users, eq(builds.userId, users.id))
      .where(eq(builds.shared, true))
      .orderBy(desc(builds.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ builds: sharedBuilds });
  } catch {
    return NextResponse.json(
      { error: "Database not configured. Set DATABASE_URL in .env" },
      { status: 503 }
    );
  }
}
