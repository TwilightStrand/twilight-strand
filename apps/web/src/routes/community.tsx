import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BuildCard } from "@/components/shell/BuildCard";
import { NinjaBuilds } from "@/components/shell/NinjaBuilds";

const CLASSES = ["All", "Marauder", "Ranger", "Witch", "Duelist", "Templar", "Shadow", "Scion"];

interface LeaderboardBuild {
  id: string;
  name: string;
  className: string | null;
  ascendancy: string | null;
  level: number | null;
  totalDps: number | null;
  life: number | null;
  energyShield: number | null;
  pobCode: string;
  createdAt: string;
  authorName: string | null;
  authorImage: string | null;
}

export const Route = createFileRoute("/community")({
  component: CommunityPage,
});

function CommunityPage() {
  const [view, setView] = useState<"shared" | "ladder">("shared");
  const [builds, setBuilds] = useState<LeaderboardBuild[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("dps");
  const [classFilter, setClassFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ sort, limit: "30" });
    if (classFilter) params.set("class", classFilter);
    fetch(`/api/builds/leaderboard?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setBuilds(data.builds || []);
        setLoading(false);
      })
      .catch(() => {
        setBuilds([]);
        setLoading(false);
      });
  }, [sort, classFilter]);

  return (
    <div className="min-h-dvh bg-bg-deep text-text-primary">
      <header className="h-14 border-b border-border-divider bg-bg-surface/60 backdrop-blur-sm flex items-center px-4 gap-4">
        <a href="/" className="text-accent font-display text-lg font-bold tracking-tight">
          Twilight Strand
        </a>
        <span className="text-border-card">|</span>
        <span className="text-sm font-mono text-text-dim">Community Builds</span>
        <div className="flex-1" />
        <a href="/" className="text-xs font-mono text-text-dim hover:text-accent transition-colors">
          Back to planner
        </a>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setView("shared")}
            className={`text-sm font-mono px-3 py-1.5 rounded transition-colors ${
              view === "shared"
                ? "bg-accent/20 text-accent border border-accent/30"
                : "text-text-dim hover:text-text-primary border border-transparent"
            }`}
          >
            Community Builds
          </button>
          <button
            onClick={() => setView("ladder")}
            className={`text-sm font-mono px-3 py-1.5 rounded transition-colors ${
              view === "ladder"
                ? "bg-accent/20 text-accent border border-accent/30"
                : "text-text-dim hover:text-text-primary border border-transparent"
            }`}
          >
            poe.ninja Ladder
          </button>
        </div>

        {view === "ladder" && <NinjaBuilds />}

        {view === "shared" && (
          <>
            <h2 className="text-sm font-mono text-text-dim mb-3">Leaderboard</h2>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-[10px] font-mono text-text-dim mr-1">Sort:</span>
              <div className="flex gap-1">
                {(["dps", "life", "es", "recent"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={`text-[10px] font-mono px-2.5 py-1 rounded transition-colors ${
                      sort === s
                        ? "bg-accent/20 text-accent border border-accent/30"
                        : "text-text-dim hover:text-text-primary border border-transparent"
                    }`}
                  >
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>

              <span className="text-border-card mx-1 hidden sm:inline">|</span>

              <span className="text-[10px] font-mono text-text-dim mr-1">Class:</span>
              <div className="flex gap-1 flex-wrap">
                {CLASSES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setClassFilter(c === "All" ? "" : c)}
                    className={`text-[10px] font-mono px-2 py-1 rounded transition-colors ${
                      (c === "All" && !classFilter) || classFilter === c
                        ? "bg-accent/20 text-accent border border-accent/30"
                        : "text-text-dim hover:text-text-primary border border-transparent"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {loading && (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 bg-bg-card/50 rounded animate-pulse" />
                ))}
              </div>
            )}

            {!loading && builds.length === 0 && (
              <div className="text-center py-16">
                <p className="text-text-dim font-mono text-sm mb-2">No shared builds yet</p>
                <p className="text-text-dim/60 text-xs font-mono">
                  Import a build, then click Share to add it to the leaderboard.
                </p>
              </div>
            )}

            {!loading && builds.length > 0 && (
              <div className="space-y-1.5">
                {builds.map((build, i) => (
                  <a key={build.id} href={`/#${build.pobCode}`} className="block">
                    <div className="flex items-center gap-3 px-3 py-2.5 bg-bg-card border border-border-card rounded hover:border-accent/30 transition-colors">
                      <span className="text-text-dim/40 font-mono text-sm w-6 text-right tabular-nums">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <BuildCard
                          name={build.name}
                          className={build.className || ""}
                          ascendancy={build.ascendancy || ""}
                          level={build.level || 1}
                          dps={build.totalDps ?? undefined}
                          life={build.life ?? undefined}
                          es={build.energyShield ?? undefined}
                          compact
                        />
                      </div>
                      {build.authorName && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {build.authorImage && (
                            <img src={build.authorImage} alt="" className="w-4 h-4 rounded-full" />
                          )}
                          <span className="text-[9px] font-mono text-text-dim/40">{build.authorName}</span>
                        </div>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
