import { redirect } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const { db } = await import("@/db");
    const { builds } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const [build] = await db.select()
      .from(builds)
      .where(eq(builds.id, id))
      .limit(1);

    if (!build) return { title: "Build Not Found - Twilight Strand" };

    const desc = [
      build.ascendancy || build.className,
      `Level ${build.level}`,
      build.totalDps ? `${Math.round(build.totalDps / 1000)}k DPS` : "",
      build.life ? `${build.life} Life` : "",
      build.energyShield ? `${build.energyShield} ES` : "",
    ].filter(Boolean).join(" - ");

    return {
      title: `${build.name} - ${build.ascendancy || build.className} Lv ${build.level} - Twilight Strand`,
      description: desc,
      openGraph: {
        title: `${build.name} - Twilight Strand`,
        description: `${build.ascendancy || build.className} Level ${build.level} PoE Build`,
        type: "website",
      },
    };
  } catch {
    return { title: "Twilight Strand" };
  }
}

export default async function BuildPage({ params }: Props) {
  const { id } = await params;
  try {
    const { db } = await import("@/db");
    const { builds } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const [build] = await db.select()
      .from(builds)
      .where(eq(builds.id, id))
      .limit(1);

    if (!build || !build.shared) {
      redirect("/");
    }

    redirect(`/#${build.pobCode}`);
  } catch {
    redirect("/");
  }
}
