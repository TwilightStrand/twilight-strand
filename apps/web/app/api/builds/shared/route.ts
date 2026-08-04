import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { builds, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const limit = Math.min(50, parseInt(req.nextUrl.searchParams.get("limit") || "20"));
  const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");

  try {
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
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}
