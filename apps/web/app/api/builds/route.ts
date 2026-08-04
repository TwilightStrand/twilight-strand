import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { builds } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userBuilds = await db.select()
    .from(builds)
    .where(eq(builds.userId, session.user.id))
    .orderBy(desc(builds.updatedAt))
    .limit(50);

  return NextResponse.json({ builds: userBuilds });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, pobCode, className, ascendancy, level, totalDps, life, energyShield, treeVersion } = body;

  if (!pobCode) {
    return NextResponse.json({ error: "Missing pobCode" }, { status: 400 });
  }

  const [build] = await db.insert(builds).values({
    userId: session.user.id,
    name: name || "Unnamed Build",
    pobCode,
    className,
    ascendancy,
    level,
    totalDps: Math.round(totalDps || 0),
    life: Math.round(life || 0),
    energyShield: Math.round(energyShield || 0),
    treeVersion,
  }).returning();

  return NextResponse.json({ build });
}
