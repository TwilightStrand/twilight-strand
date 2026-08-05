"use client";

import { useEffect, useMemo, useState } from "react";

interface NinjaBuild {
  account: string;
  character: string;
  class: string;
  level: number;
  life: number;
  energyShield: number;
  depth: number;
  skills: Array<{ name: string; icon?: string }>;
}

interface MetaData {
  builds: NinjaBuild[];
  total: number;
}

interface ClassCount {
  name: string;
  count: number;
  pct: number;
}

interface SkillCount {
  name: string;
  count: number;
  pct: number;
}

function Bar({ label, value, pct, maxPct }: { label: string; value: number; pct: number; maxPct: number }) {
  const width = maxPct > 0 ? (pct / maxPct) * 100 : 0;
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-[10px] font-mono text-text-primary w-28 truncate shrink-0">{label}</span>
      <div className="flex-1 h-3 bg-bg-inset rounded-sm overflow-hidden">
        <div className="h-full bg-accent/40 rounded-sm transition-all" style={{ width: `${width}%` }} />
      </div>
      <span className="text-[9px] font-mono text-text-dim tabular-nums w-12 text-right shrink-0">
        {value} ({pct.toFixed(0)}%)
      </span>
    </div>
  );
}

export function MetaStats() {
  const [data, setData] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [league, setLeague] = useState("Settlers");
  const [classFilter, setClassFilter] = useState("");

  const [_fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function doFetch() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ league, type: "builds" });
        if (classFilter) params.set("class", classFilter);
        const resp = await fetch(`/api/ninja?${params}`);
        if (cancelled) return;
        if (!resp.ok) throw new Error(`API returned ${resp.status}`);
        const json = await resp.json();
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to fetch");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    doFetch();
    return () => {
      cancelled = true;
    };
  }, [league, classFilter]);

  const classCounts = useMemo<ClassCount[]>(() => {
    if (!data?.builds.length) return [];
    const counts: Record<string, number> = {};
    for (const b of data.builds) {
      counts[b.class] = (counts[b.class] || 0) + 1;
    }
    const total = data.builds.length;
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count, pct: (count / total) * 100 }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const skillCounts = useMemo<SkillCount[]>(() => {
    if (!data?.builds.length) return [];
    const counts: Record<string, number> = {};
    for (const b of data.builds) {
      if (!b.skills) continue;
      for (const s of b.skills) {
        if (s.name) counts[s.name] = (counts[s.name] || 0) + 1;
      }
    }
    const total = data.builds.length;
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count, pct: (count / total) * 100 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [data]);

  const avgStats = useMemo(() => {
    if (!data?.builds.length) return null;
    const n = data.builds.length;
    const sum = data.builds.reduce(
      (acc, b) => ({
        level: acc.level + b.level,
        life: acc.life + b.life,
        es: acc.es + b.energyShield,
        depth: acc.depth + b.depth,
      }),
      { level: 0, life: 0, es: 0, depth: 0 },
    );
    return {
      level: Math.round(sum.level / n),
      life: Math.round(sum.life / n),
      es: Math.round(sum.es / n),
      depth: Math.round(sum.depth / n),
    };
  }, [data]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-text-dim">Meta Statistics</h3>
        <div className="flex items-center gap-1.5">
          <select
            value={league}
            onChange={(e) => setLeague(e.target.value)}
            className="bg-bg-inset border border-border-subtle rounded px-1.5 py-0.5 text-[10px] font-mono text-text-primary"
          >
            <option value="Settlers">Settlers</option>
            <option value="Standard">Standard</option>
          </select>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="bg-bg-inset border border-border-subtle rounded px-1.5 py-0.5 text-[10px] font-mono text-text-primary"
          >
            <option value="">All Classes</option>
            {[
              "Ascendant",
              "Berserker",
              "Champion",
              "Chieftain",
              "Deadeye",
              "Elementalist",
              "Gladiator",
              "Guardian",
              "Hierophant",
              "Inquisitor",
              "Juggernaut",
              "Necromancer",
              "Occultist",
              "Pathfinder",
              "Raider",
              "Saboteur",
              "Slayer",
              "Trickster",
              "Assassin",
            ]
              .sort()
              .map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
          </select>
          <button
            onClick={() => setFetchKey((k) => k + 1)}
            disabled={loading}
            className="text-[9px] font-mono text-accent hover:text-accent/80 disabled:opacity-40 px-1.5 py-0.5 border border-accent/30 rounded"
          >
            {loading ? "..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-[10px] font-mono text-red-400/80 mb-2 bg-red-400/5 border border-red-400/10 rounded px-2 py-1.5">
          <p>{error}</p>
          <p className="text-red-400/50 mt-0.5">
            poe.ninja API may be unavailable or the league name may have changed.
          </p>
        </div>
      )}

      {data && avgStats && (
        <>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: "Avg Level", value: avgStats.level },
              {
                label: "Avg Life",
                value: avgStats.life.toLocaleString(),
              },
              {
                label: "Avg ES",
                value: avgStats.es.toLocaleString(),
              },
              { label: "Avg Depth", value: avgStats.depth },
            ].map((s) => (
              <div key={s.label} className="bg-bg-inset rounded p-2 text-center">
                <div className="text-[9px] font-mono text-text-dim">{s.label}</div>
                <div className="text-sm font-mono text-text-primary tabular-nums">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <h4 className="text-[9px] font-mono font-bold uppercase tracking-widest text-text-dim mb-1.5">
              Class Distribution ({data.builds.length} builds)
            </h4>
            {classCounts.map((c) => (
              <Bar key={c.name} label={c.name} value={c.count} pct={c.pct} maxPct={classCounts[0]?.pct || 1} />
            ))}
          </div>

          <div>
            <h4 className="text-[9px] font-mono font-bold uppercase tracking-widest text-text-dim mb-1.5">
              Top Skills
            </h4>
            {skillCounts.map((s) => (
              <Bar key={s.name} label={s.name} value={s.count} pct={s.pct} maxPct={skillCounts[0]?.pct || 1} />
            ))}
          </div>

          <p className="text-[8px] font-mono text-text-dim/30 mt-3">
            Data from poe.ninja ladder. Top {data.builds.length} of {data.total.toLocaleString()} builds.
          </p>
        </>
      )}

      {!data && !loading && !error && (
        <p className="text-[10px] font-mono text-text-dim/50 text-center py-4">Loading meta statistics...</p>
      )}
    </div>
  );
}
