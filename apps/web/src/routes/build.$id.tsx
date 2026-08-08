import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/build/$id")({
  head: async ({ params }) => {
    try {
      const { db } = await import("@/db");
      const { builds } = await import("@/db/schema");
      const { eq } = await import("drizzle-orm");

      const [build] = await db.select().from(builds).where(eq(builds.id, params.id)).limit(1);

      if (!build) {
        return { meta: [{ title: "Build Not Found - Twilight Strand" }] };
      }

      const desc = [build.ascendancy || build.className, `Level ${build.level}`, build.totalDps ? `${Math.round(build.totalDps / 1000)}k DPS` : "", build.life ? `${build.life} Life` : "", build.energyShield ? `${build.energyShield} ES` : ""]
        .filter(Boolean)
        .join(" - ");

      const ogParams = new URLSearchParams({
        name: build.name || "Unnamed Build",
        class: build.className || "",
        ascendancy: build.ascendancy || "",
        level: String(build.level || 1),
        dps: String(build.totalDps || 0),
        life: String(build.life || 0),
        es: String(build.energyShield || 0),
      });

      const title = `${build.name} - ${build.ascendancy || build.className} Lv ${build.level} - Twilight Strand`;

      return {
        meta: [
          { title },
          { name: "description", content: desc },
          { property: "og:title", content: `${build.name} - Twilight Strand` },
          { property: "og:description", content: `${build.ascendancy || build.className} Level ${build.level} PoE Build` },
          { property: "og:type", content: "website" },
          { property: "og:image", content: `/api/og?${ogParams.toString()}` },
          { property: "og:image:width", content: "1200" },
          { property: "og:image:height", content: "630" },
          { name: "twitter:card", content: "summary_large_image" },
          { name: "twitter:title", content: `${build.name} - Twilight Strand` },
          { name: "twitter:description", content: desc },
          { name: "twitter:image", content: `/api/og?${ogParams.toString()}` },
        ],
      };
    } catch {
      return { meta: [{ title: "Twilight Strand" }] };
    }
  },
  loader: async ({ params }) => {
    try {
      const { db } = await import("@/db");
      const { builds } = await import("@/db/schema");
      const { eq } = await import("drizzle-orm");

      const [build] = await db.select().from(builds).where(eq(builds.id, params.id)).limit(1);

      if (!build || !build.shared) {
        throw redirect({ to: "/" });
      }

      throw redirect({ to: "/", hash: build.pobCode });
    } catch (e) {
      if (e instanceof Response || (e && typeof e === "object" && "redirect" in e)) throw e;
      throw redirect({ to: "/" });
    }
  },
  component: () => null,
});
