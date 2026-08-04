"use client";

import { useState } from "react";
import { useBuildStore } from "@/stores/build-store";
import { CLUSTER_NOTABLES, CLUSTER_BASES, type ClusterBase } from "@/data/cluster-notables";

function fmtNum(n: number): string {
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(Math.round(n));
}

interface ClusterResult {
  base: ClusterBase;
  rolled: string[];
  taken: string[];
  skipped: string;
  pointCost: number;
  dpsGain: number;
  ehpGain: number;
  dpsPerPoint: number;
  estimatedPrice: number;
  rarity: number;
  mods: Array<{ stat: string; value: number; mod_type: string }>;
}

function calcRarity(notableNames: string[]): number {
  let weightProduct = 1;
  for (const name of notableNames) {
    const notable = CLUSTER_NOTABLES[name];
    weightProduct *= notable?.weight || 100;
  }
  return Math.max(1, Math.min(5, Math.round((6 - Math.log10(Math.max(1, weightProduct))) * 10) / 10));
}

interface StackResult {
  large: ClusterResult;
  medium1: ClusterResult;
  medium2: ClusterResult;
  totalDps: number;
  totalEhp: number;
  totalPoints: number;
  dpsPerPoint: number;
  totalPrice: number;
  notableCount: number;
}

export function ClusterSearch() {
  const stats = useBuildStore((s) => s.stats);
  const [results, setResults] = useState<ClusterResult[]>([]);
  const [stackResults, setStackResults] = useState<StackResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [sortBy, setSortBy] = useState<"dps_per_point" | "dps" | "rarity">("dps_per_point");
  const [enchantFilter, setEnchantFilter] = useState(8);
  const [typeFilter, setTypeFilter] = useState<"all" | "large" | "medium" | "small">("all");
  const [searchMode, setSearchMode] = useState<"individual" | "stack">("individual");

  const search = async () => {
    if (!stats) return;
    setSearching(true);

    try {
      const { isRustEngineReady, evaluateBuildRust, parseStatLine } =
        await import("@/engine/rust-bridge");

      const useRust = isRustEngineReady();
      const baseDps = stats.total_dps || 0;

      const baseInput = useRust
        ? {
            level: stats.level,
            class_id: 0,
            base_str: 20,
            base_dex: 20,
            base_int: 20,
            modifiers: [] as Array<{ stat: string; value: number; mod_type: string }>,
            allocated_keystones: [] as string[],
            main_skill_id: "",
            ascendancy_name: stats.ascendancy || "",
            enemy_level: 83,
            enemy_fire_res: 0,
            enemy_cold_res: 0,
            enemy_lightning_res: 0,
            enemy_chaos_res: 0,
            enemy_is_boss: false,
          }
        : null;

      const baseOutput = baseInput ? evaluateBuildRust(baseInput) : null;

      function parseMods(statLines: string[]): Array<{ stat: string; value: number; mod_type: string }> {
        if (!useRust) return [];
        return statLines.flatMap((s) => {
          try {
            const parsed = parseStatLine(s);
            if (typeof parsed === "string") return JSON.parse(parsed) as Array<{ stat: string; value: number; mod_type: string }>;
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        });
      }

      function evalMods(mods: Array<{ stat: string; value: number; mod_type: string }>): { dps: number; ehp: number } {
        if (!useRust || !baseInput || !baseOutput) {
          return { dps: 0, ehp: 0 };
        }
        const result = evaluateBuildRust({
          ...baseInput,
          modifiers: [...baseInput.modifiers, ...mods],
        });
        if (!result) return { dps: 0, ehp: 0 };
        return {
          dps: result.total_dps - baseOutput.total_dps,
          ehp: result.total_ehp - baseOutput.total_ehp,
        };
      }

      function heuristicDps(statLines: string[]): number {
        let gain = 0;
        for (const stat of statLines) {
          const lower = stat.toLowerCase();
          const numMatch = stat.match(/(\d+)/);
          const num = numMatch ? parseInt(numMatch[1]) : 0;
          if (lower.includes("damage") && lower.includes("increased")) gain += num * baseDps * 0.01;
          if (lower.includes("cast speed") || lower.includes("attack speed")) gain += num * baseDps * 0.01;
          if (lower.includes("critical strike chance")) gain += num * baseDps * 0.005;
          if (lower.includes("critical strike multiplier")) gain += num * baseDps * 0.008;
          if (lower.includes("cold resistance") && lower.includes("enemies")) gain += num * baseDps * 0.01;
          if (lower.includes("elemental resistances") && lower.includes("enemies")) gain += num * baseDps * 0.008 * 3;
        }
        return gain;
      }

      const allResults: ClusterResult[] = [];
      const filteredBases = CLUSTER_BASES.filter(
        (b) => typeFilter === "all" || b.type === typeFilter
      );

      for (const base of filteredBases) {
        const pool = base.notablePool.filter((n) => n in CLUSTER_NOTABLES);
        const pointCost = base.pointCostByEnchant[enchantFilter] ?? base.pointCostByEnchant[base.optimalPassives] ?? 5;
        const smallMods = parseMods([base.smallPassiveStat]);

        if (base.type === "large" && base.notableSlots === 3) {
          // Large clusters: roll 3 notables, pick best 2
          // Generate all C(pool, 3) rolls
          for (let i = 0; i < pool.length; i++) {
            for (let j = i + 1; j < pool.length; j++) {
              for (let k = j + 1; k < pool.length; k++) {
                const rolled = [pool[i], pool[j], pool[k]];
                const pairs: [string, string, string][] = [
                  [pool[i], pool[j], pool[k]],
                  [pool[i], pool[k], pool[j]],
                  [pool[j], pool[k], pool[i]],
                ];

                let bestTaken: string[] = [pool[i], pool[j]];
                let bestSkipped = pool[k];
                let bestDps = -Infinity;
                let bestEhp = 0;

                for (const [a, b, skip] of pairs) {
                  const n1 = CLUSTER_NOTABLES[a];
                  const n2 = CLUSTER_NOTABLES[b];
                  const allStats = [...n1.stats, ...n2.stats];
                  // 2 entrance small passives + 2 notables
                  const allMods = [
                    ...parseMods(n1.stats),
                    ...parseMods(n2.stats),
                    ...smallMods,
                    ...smallMods,
                  ];

                  let dps: number;
                  let ehp: number;
                  if (useRust && allMods.length > 0) {
                    const result = evalMods(allMods);
                    dps = result.dps;
                    ehp = result.ehp;
                  } else {
                    dps = heuristicDps([...allStats, base.smallPassiveStat, base.smallPassiveStat]);
                    ehp = 0;
                  }

                  if (dps > bestDps) {
                    bestDps = dps;
                    bestEhp = ehp;
                    bestTaken = [a, b];
                    bestSkipped = skip;
                  }
                }

                const price = estimatePrice(bestTaken);
                const n1b = CLUSTER_NOTABLES[bestTaken[0]];
                const n2b = CLUSTER_NOTABLES[bestTaken[1]];
                const bestMods = [...parseMods(n1b.stats), ...parseMods(n2b.stats), ...smallMods, ...smallMods];

                allResults.push({
                  base,
                  rolled,
                  taken: bestTaken,
                  skipped: bestSkipped,
                  pointCost,
                  dpsGain: bestDps,
                  ehpGain: bestEhp,
                  dpsPerPoint: pointCost > 0 ? bestDps / pointCost : bestDps,
                  estimatedPrice: price,
                  rarity: calcRarity(bestTaken),
                  mods: bestMods,
                });
              }
            }
          }
        } else if (base.type === "medium" && base.notableSlots === 2) {
          // Medium clusters: roll 2 notables, take both
          for (let i = 0; i < pool.length; i++) {
            for (let j = i + 1; j < pool.length; j++) {
              const n1 = CLUSTER_NOTABLES[pool[i]];
              const n2 = CLUSTER_NOTABLES[pool[j]];
              const allMods = [
                ...parseMods(n1.stats),
                ...parseMods(n2.stats),
                ...smallMods,
              ];

              let dps: number;
              let ehp: number;
              if (useRust && allMods.length > 0) {
                const result = evalMods(allMods);
                dps = result.dps;
                ehp = result.ehp;
              } else {
                dps = heuristicDps([...n1.stats, ...n2.stats, base.smallPassiveStat]);
                ehp = 0;
              }

              allResults.push({
                base,
                rolled: [pool[i], pool[j]],
                taken: [pool[i], pool[j]],
                skipped: "",
                pointCost,
                dpsGain: dps,
                ehpGain: ehp,
                dpsPerPoint: pointCost > 0 ? dps / pointCost : dps,
                estimatedPrice: estimatePrice([pool[i], pool[j]]),
                rarity: calcRarity([pool[i], pool[j]]),
                mods: allMods,
              });
            }
          }
        } else if (base.type === "small") {
          // Small clusters: 1 notable
          for (const name of pool) {
            const notable = CLUSTER_NOTABLES[name];
            const allMods = [...parseMods(notable.stats), ...smallMods, ...smallMods];

            let dps: number;
            let ehp: number;
            if (useRust && allMods.length > 0) {
              const result = evalMods(allMods);
              dps = result.dps;
              ehp = result.ehp;
            } else {
              dps = heuristicDps([...notable.stats, base.smallPassiveStat, base.smallPassiveStat]);
              ehp = 0;
            }

            allResults.push({
              base,
              rolled: [name],
              taken: [name],
              skipped: "",
              pointCost,
              dpsGain: dps,
              ehpGain: ehp,
              dpsPerPoint: pointCost > 0 ? dps / pointCost : dps,
              estimatedPrice: estimatePrice([name]),
              rarity: calcRarity([name]),
              mods: allMods,
            });
          }
        }
      }

      allResults.sort((a, b) => {
        if (sortBy === "dps") return b.dpsGain - a.dpsGain;
        if (sortBy === "rarity") return b.rarity - a.rarity;
        return b.dpsPerPoint - a.dpsPerPoint;
      });

      setResults(allResults.slice(0, 20));

      // Build full stacks: Large + 2 Mediums
      if (searchMode === "stack") {
        const larges = allResults.filter((r) => r.base.type === "large").slice(0, 8);
        const mediums = allResults.filter((r) => r.base.type === "medium").slice(0, 8);

        const stacks: StackResult[] = [];
        for (const large of larges) {
          for (let m1 = 0; m1 < mediums.length; m1++) {
            for (let m2 = m1 + 1; m2 < mediums.length; m2++) {
              const med1 = mediums[m1];
              const med2 = mediums[m2];
              const combinedMods = [...large.mods, ...med1.mods, ...med2.mods];

              let totalDps = 0;
              let totalEhp = 0;
              if (useRust && baseInput && baseOutput && combinedMods.length > 0) {
                const result = evalMods(combinedMods);
                totalDps = result.dps;
                totalEhp = result.ehp;
              } else {
                totalDps = large.dpsGain + med1.dpsGain + med2.dpsGain;
                totalEhp = large.ehpGain + med1.ehpGain + med2.ehpGain;
              }

              const totalPoints = large.pointCost + med1.pointCost + med2.pointCost;
              const totalPrice = large.estimatedPrice + med1.estimatedPrice + med2.estimatedPrice;

              stacks.push({
                large,
                medium1: med1,
                medium2: med2,
                totalDps,
                totalEhp,
                totalPoints,
                dpsPerPoint: totalPoints > 0 ? totalDps / totalPoints : totalDps,
                totalPrice,
                notableCount: large.taken.length + med1.taken.length + med2.taken.length,
              });
            }
          }
        }

        stacks.sort((a, b) => b.dpsPerPoint - a.dpsPerPoint);
        setStackResults(stacks.slice(0, 10));
      } else {
        setStackResults([]);
      }
    } catch (e) {
      console.warn("Cluster search error:", e);
    } finally {
      setSearching(false);
    }
  };

  if (!stats || stats.total_dps === 0) return null;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-mono uppercase tracking-widest text-text-dim">
          Cluster Jewel Search
        </h2>
        <button
          onClick={search}
          disabled={searching}
          className="text-[10px] font-mono px-3 py-0.5 rounded bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 disabled:opacity-40 transition-colors"
        >
          {searching ? "Computing..." : "Search"}
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="flex gap-1">
          <span className="text-[9px] font-mono text-text-dim mr-0.5">Mode:</span>
          {(["individual", "stack"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setSearchMode(m)}
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${searchMode === m ? "bg-accent/20 text-accent" : "text-text-dim hover:text-text-primary"}`}
            >
              {m === "individual" ? "Individual" : "Full Stack"}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          <span className="text-[9px] font-mono text-text-dim mr-0.5">Type:</span>
          {(["all", "large", "medium", "small"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${typeFilter === t ? "bg-accent/20 text-accent" : "text-text-dim hover:text-text-primary"}`}
            >
              {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          <span className="text-[9px] font-mono text-text-dim mr-0.5">Enchant:</span>
          {[8, 10, 12].map((n) => (
            <button
              key={n}
              onClick={() => setEnchantFilter(n)}
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${enchantFilter === n ? "bg-accent/20 text-accent" : "text-text-dim hover:text-text-primary"}`}
            >
              {n}p
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          <span className="text-[9px] font-mono text-text-dim mr-0.5">Sort:</span>
          {(["dps_per_point", "dps", "rarity"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${sortBy === s ? "bg-accent/20 text-accent" : "text-text-dim hover:text-text-primary"}`}
            >
              {s === "dps_per_point" ? "DPS/pt" : s === "dps" ? "DPS" : "Rarity"}
            </button>
          ))}
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-1 max-w-3xl">
          <div className="flex text-[9px] font-mono text-text-dim/50 px-3 mb-0.5">
            <span className="w-5">#</span>
            <span className="flex-1">Cluster (take 2, skip 1 on large)</span>
            <span className="w-16 text-right">DPS</span>
            <span className="w-10 text-right">pts</span>
            <span className="w-14 text-right">DPS/pt</span>
            <span className="w-10 text-right">rarity</span>
          </div>
          {results.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-1 px-3 py-2 bg-bg-card border border-border-card rounded text-[10px] font-mono"
            >
              <span className="w-5 text-text-dim/40 tabular-nums shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-text-primary truncate">
                  {r.taken.join(" + ")}
                </div>
                <div className="text-[8px] text-text-dim/50">
                  {r.base.name} {r.base.type} ({enchantFilter}p, {r.pointCost}pt)
                  {r.skipped && (
                    <span className="text-text-dim/30 ml-1">
                      skip: {r.skipped}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`w-16 text-right tabular-nums shrink-0 ${r.dpsGain > 0 ? "text-accent" : "text-text-dim/40"}`}
              >
                {r.dpsGain > 0 ? `+${fmtNum(r.dpsGain)}` : "-"}
              </span>
              <span className="w-10 text-right tabular-nums text-text-dim shrink-0">
                {r.pointCost}pt
              </span>
              <span
                className={`w-14 text-right tabular-nums shrink-0 ${r.dpsPerPoint > 0 ? "text-amber-400" : "text-text-dim/40"}`}
              >
                {r.dpsPerPoint > 0 ? `${fmtNum(r.dpsPerPoint)}/pt` : "-"}
              </span>
              <span className="w-10 text-right tabular-nums text-purple-400/70 shrink-0" title={`Rarity: ${r.rarity}/5 (higher = rarer)`}>
                R{r.rarity}
              </span>
            </div>
          ))}
        </div>
      )}

      {searchMode === "stack" && stackResults.length > 0 && (
        <div className="space-y-2 max-w-3xl mt-3">
          <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-accent/70 mb-1">
            Full Stacks (Large + 2 Mediums = 6 notables)
          </div>
          {stackResults.map((s, i) => (
            <div
              key={i}
              className="px-3 py-2.5 bg-bg-card border border-border-card rounded text-xs font-mono"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-text-dim/40">#{i + 1}</span>
                <span className="text-accent tabular-nums">
                  +{fmtNum(s.totalDps)} DPS
                </span>
                <span className="text-[9px] text-accent/60 tabular-nums">
                  {Math.round(s.dpsPerPoint)}/pt
                </span>
                <span className="text-text-dim tabular-nums">
                  {s.totalPoints}pt ({s.notableCount} notables)
                </span>
                <span className="text-amber-400 tabular-nums">
                  ~{s.totalPrice}c
                </span>
                <button
                  onClick={async () => {
                    const { priceCheckClusterJewel } = await import(
                      "@/lib/trade"
                    );
                    const [p1, p2, p3] = await Promise.all([
                      priceCheckClusterJewel(s.large.taken, 8),
                      priceCheckClusterJewel(s.medium1.taken, 4),
                      priceCheckClusterJewel(s.medium2.taken, 4),
                    ]);
                    const total =
                      (p1?.median || 0) + (p2?.median || 0) + (p3?.median || 0);
                    const { useToastStore } = await import(
                      "@/components/shell/Toast"
                    );
                    useToastStore
                      .getState()
                      .addToast(
                        `Real price: ~${total}c (L:${p1?.median || "?"}c + M:${p2?.median || "?"}c + M:${p3?.median || "?"}c)`,
                        "info"
                      );
                  }}
                  className="text-[9px] text-amber-400/60 hover:text-amber-400 transition-colors"
                >
                  Check $
                </button>
              </div>
              <div className="space-y-0.5 text-[10px]">
                <div className="text-text-dim/80">
                  <span className="text-amber-400/60 font-bold mr-1">L</span>
                  <span className="text-text-dim/50 mr-1">
                    {s.large.base.name}:
                  </span>
                  <span className="text-text-primary">
                    {s.large.taken.join(" + ")}
                  </span>
                  {s.large.skipped && (
                    <span className="text-text-dim/30 ml-1">
                      (skip {s.large.skipped})
                    </span>
                  )}
                </div>
                <div className="text-text-dim/80">
                  <span className="text-accent/60 font-bold mr-1">M</span>
                  <span className="text-text-dim/50 mr-1">
                    {s.medium1.base.name}:
                  </span>
                  <span className="text-text-primary">
                    {s.medium1.taken.join(" + ")}
                  </span>
                </div>
                <div className="text-text-dim/80">
                  <span className="text-accent/60 font-bold mr-1">M</span>
                  <span className="text-text-dim/50 mr-1">
                    {s.medium2.base.name}:
                  </span>
                  <span className="text-text-primary">
                    {s.medium2.taken.join(" + ")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && stackResults.length === 0 && !searching && (
        <p className="text-xs font-mono text-text-dim/60 text-center py-6">
          Click Search to find the best cluster jewels for your build.
          <br />
          Large clusters roll 3 notables; you path to the best 2 (cheapest on 8-passive).
          <br />
          Includes 2 entrance small passives in DPS calculation.
        </p>
      )}
    </div>
  );
}

function estimatePrice(notables: string[]): number {
  let total = 0;
  for (const name of notables) {
    const notable = CLUSTER_NOTABLES[name];
    if (notable) {
      total += Math.round((50 / notable.weight) * 100);
    }
  }
  return Math.max(5, total);
}
