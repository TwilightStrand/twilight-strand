"use client";

import { useState } from "react";
import { useBuildStore } from "@/stores/build-store";
import { CLUSTER_NOTABLES, CLUSTER_BASES } from "@/data/cluster-notables";
import type { ClusterSearchResult } from "@/engine/cluster-types";

function fmtNum(n: number): string {
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(Math.round(n));
}

interface PairResult {
  names: string[];
  baseName: string;
  baseType: string;
  pointCost: number;
  dpsGain: number;
  ehpGain: number;
  dpsPerPoint: number;
  estimatedPrice: number;
  valueScore: number;
}

function findBase(notableName: string) {
  return CLUSTER_BASES.find((b) => b.notablePool.includes(notableName));
}

export function ClusterSearch() {
  const stats = useBuildStore((s) => s.stats);
  const [results, setResults] = useState<ClusterSearchResult[]>([]);
  const [pairs, setPairs] = useState<PairResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [sortBy, setSortBy] = useState<"dps" | "value" | "dps_per_point">("dps_per_point");
  const [searchMode, setSearchMode] = useState<"single" | "pairs">("pairs");

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
          }
        : null;

      const baseOutput = baseInput ? evaluateBuildRust(baseInput) : null;

      // Parse small passive mods for each cluster base (cached)
      const smallModCache = new Map<string, Array<{ stat: string; value: number; mod_type: string }>>();
      for (const base of CLUSTER_BASES) {
        if (useRust) {
          const parsed = parseStatLine(base.smallPassiveStat);
          smallModCache.set(base.name, parsed);
        }
      }

      // --- Singles ---
      const notableResults: ClusterSearchResult[] = [];

      for (const [name, notable] of Object.entries(CLUSTER_NOTABLES)) {
        let dpsGain = 0;
        let ehpGain = 0;
        const base = findBase(name);
        const pointCost = base?.pointCost ?? 5;

        if (useRust && baseInput && baseOutput) {
          const notableMods = notable.stats.flatMap((s) => parseStatLine(s));
          // Include 2 entrance small passives
          const smallMods = base ? (smallModCache.get(base.name) ?? []) : [];
          const allMods = [...notableMods, ...smallMods, ...smallMods]; // 2x small passives

          const withCluster = evaluateBuildRust({
            ...baseInput,
            modifiers: [...baseInput.modifiers, ...allMods],
          });

          if (withCluster) {
            dpsGain = withCluster.total_dps - baseOutput.total_dps;
            ehpGain = withCluster.total_ehp - baseOutput.total_ehp;
          }
        } else {
          for (const stat of notable.stats) {
            const lower = stat.toLowerCase();
            const numMatch = stat.match(/(\d+)/);
            const num = numMatch ? parseInt(numMatch[1]) : 0;
            if (lower.includes("damage") && lower.includes("increased")) dpsGain += num * baseDps * 0.01;
            if (lower.includes("attack speed") || lower.includes("cast speed")) dpsGain += num * baseDps * 0.01;
            if (lower.includes("critical strike chance")) dpsGain += num * baseDps * 0.005;
            if (lower.includes("critical strike multiplier")) dpsGain += num * baseDps * 0.008;
            if (lower.includes("maximum life")) ehpGain += num * 15;
            if (lower.includes("energy shield")) ehpGain += num * 2;
            if (lower.includes("resistance") && !lower.includes("-")) ehpGain += num * 8;
          }
        }

        const estimatedPrice = Math.max(1, Math.round((50 / notable.weight) * 100));
        const dpsPerPoint = pointCost > 0 ? dpsGain / pointCost : dpsGain;

        notableResults.push({
          jewel: {
            name,
            type: base?.type ?? "medium",
            enchant: base ? `${base.name} cluster` : "",
            passiveCount: pointCost,
            notables: [name],
            smallPassiveType: base?.smallPassiveStat ?? "",
          },
          notables: [notable],
          estimatedPrice,
          dpsGain,
          ehpGain,
          valueScore: dpsPerPoint,
        });
      }

      sortResults(notableResults, sortBy);
      setResults(notableResults);

      // --- Pairs: evaluate all 2-notable combos on the same cluster base ---
      if (searchMode === "pairs") {
        const pairResults: PairResult[] = [];

        for (const base of CLUSTER_BASES) {
          const pool = base.notablePool.filter((n) => n in CLUSTER_NOTABLES);
          if (pool.length < 2) continue;

          const smallMods = smallModCache.get(base.name) ?? [];

          for (let i = 0; i < pool.length; i++) {
            for (let j = i + 1; j < pool.length; j++) {
              const n1 = CLUSTER_NOTABLES[pool[i]];
              const n2 = CLUSTER_NOTABLES[pool[j]];
              let dpsGain = 0;
              let ehpGain = 0;

              if (useRust && baseInput && baseOutput) {
                const combinedMods = [
                  ...n1.stats.flatMap((s) => parseStatLine(s)),
                  ...n2.stats.flatMap((s) => parseStatLine(s)),
                  ...smallMods, ...smallMods, // 2 entrance small passives
                ];

                const withBoth = evaluateBuildRust({
                  ...baseInput,
                  modifiers: [...baseInput.modifiers, ...combinedMods],
                });

                if (withBoth) {
                  dpsGain = withBoth.total_dps - baseOutput.total_dps;
                  ehpGain = withBoth.total_ehp - baseOutput.total_ehp;
                }
              } else {
                // Heuristic fallback
                for (const stat of [...n1.stats, ...n2.stats]) {
                  const lower = stat.toLowerCase();
                  const numMatch = stat.match(/(\d+)/);
                  const num = numMatch ? parseInt(numMatch[1]) : 0;
                  if (lower.includes("damage") && lower.includes("increased")) dpsGain += num * baseDps * 0.01;
                  if (lower.includes("cast speed") || lower.includes("attack speed")) dpsGain += num * baseDps * 0.01;
                  if (lower.includes("critical strike chance")) dpsGain += num * baseDps * 0.005;
                  if (lower.includes("critical strike multiplier")) dpsGain += num * baseDps * 0.008;
                }
              }

              const price = Math.max(5, Math.round((50 / n1.weight + 50 / n2.weight) * 100));

              pairResults.push({
                names: [pool[i], pool[j]],
                baseName: base.name,
                baseType: base.type,
                pointCost: base.pointCost,
                dpsGain,
                ehpGain,
                dpsPerPoint: base.pointCost > 0 ? dpsGain / base.pointCost : dpsGain,
                estimatedPrice: price,
                valueScore: price > 0 ? (dpsGain + ehpGain) / price : 0,
              });
            }
          }
        }

        pairResults.sort((a, b) => {
          if (sortBy === "dps") return b.dpsGain - a.dpsGain;
          if (sortBy === "dps_per_point") return b.dpsPerPoint - a.dpsPerPoint;
          return b.valueScore - a.valueScore;
        });

        setPairs(pairResults.slice(0, 15));
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
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-mono uppercase tracking-widest text-text-dim">
          Cluster Jewel Search
        </h2>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setSearchMode("single")}
            className={`text-[10px] font-mono px-2 py-0.5 rounded ${searchMode === "single" ? "bg-accent/20 text-accent" : "text-text-dim"}`}
          >
            Singles
          </button>
          <button
            onClick={() => setSearchMode("pairs")}
            className={`text-[10px] font-mono px-2 py-0.5 rounded ${searchMode === "pairs" ? "bg-accent/20 text-accent" : "text-text-dim"}`}
          >
            Pairs
          </button>
          <span className="text-text-dim/20 mx-0.5">|</span>
          {(["dps_per_point", "dps", "value"] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setSortBy(s);
                setResults((prev) => {
                  const sorted = [...prev];
                  sortResults(sorted, s);
                  return sorted;
                });
              }}
              className={`text-[10px] font-mono px-2 py-0.5 rounded ${sortBy === s ? "bg-accent/20 text-accent" : "text-text-dim"}`}
            >
              {s === "dps_per_point" ? "DPS/pt" : s === "dps" ? "DPS" : "Value"}
            </button>
          ))}
          <button
            onClick={search}
            disabled={searching}
            className="text-[10px] font-mono px-3 py-0.5 rounded bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 disabled:opacity-40 ml-2 transition-colors"
          >
            {searching ? "..." : "Search"}
          </button>
        </div>
      </div>

      {/* Singles */}
      {searchMode === "single" && results.length > 0 && (
        <div className="space-y-1 max-w-2xl">
          <div className="flex text-[9px] font-mono text-text-dim/50 px-3 mb-0.5">
            <span className="w-5">#</span>
            <span className="flex-1">Notable</span>
            <span className="w-14 text-right">DPS</span>
            <span className="w-10 text-right">pts</span>
            <span className="w-14 text-right">DPS/pt</span>
            <span className="w-10 text-right">price</span>
            <span className="w-4" />
          </div>
          {results.slice(0, 15).map((r, i) => (
            <div key={i} className="flex items-center gap-1 px-3 py-1.5 bg-bg-card border border-border-card rounded text-[10px] font-mono">
              <span className="w-5 text-text-dim/40 tabular-nums shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <span className="text-text-primary truncate block">{r.jewel.name}</span>
                <span className="text-[8px] text-text-dim/40">{r.jewel.enchant}</span>
              </div>
              <span className={`w-14 text-right tabular-nums shrink-0 ${r.dpsGain > 0 ? "text-accent" : "text-text-dim/40"}`}>
                {r.dpsGain > 0 ? `+${fmtNum(r.dpsGain)}` : "-"}
              </span>
              <span className="w-10 text-right tabular-nums text-text-dim shrink-0">
                {r.jewel.passiveCount}pt
              </span>
              <span className={`w-14 text-right tabular-nums shrink-0 ${r.valueScore > 0 ? "text-amber-400" : "text-text-dim/40"}`}>
                {r.valueScore > 0 ? `${fmtNum(r.valueScore)}/pt` : "-"}
              </span>
              <span className="w-10 text-right tabular-nums text-amber-400/70 shrink-0">
                ~{r.estimatedPrice}c
              </span>
              <PriceCheckButton
                name={r.jewel.name}
                onPrice={(price) => {
                  setResults((prev) => {
                    const updated = [...prev];
                    const idx = updated.findIndex((u) => u.jewel.name === r.jewel.name);
                    if (idx >= 0) {
                      updated[idx] = { ...updated[idx], estimatedPrice: price };
                    }
                    return updated;
                  });
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Pairs */}
      {searchMode === "pairs" && pairs.length > 0 && (
        <div className="space-y-1 max-w-2xl">
          <div className="flex text-[9px] font-mono text-text-dim/50 px-3 mb-0.5">
            <span className="w-5">#</span>
            <span className="flex-1">Notables (on same cluster)</span>
            <span className="w-14 text-right">DPS</span>
            <span className="w-10 text-right">pts</span>
            <span className="w-14 text-right">DPS/pt</span>
            <span className="w-10 text-right">price</span>
          </div>
          {pairs.map((p, i) => (
            <div key={i} className="flex items-center gap-1 px-3 py-1.5 bg-bg-card border border-border-card rounded text-[10px] font-mono">
              <span className="w-5 text-text-dim/40 tabular-nums shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <span className="text-text-primary truncate block">
                  {p.names.join(" + ")}
                </span>
                <span className="text-[8px] text-text-dim/40">
                  {p.baseName} {p.baseType} cluster (incl. 2 small passives)
                </span>
              </div>
              <span className={`w-14 text-right tabular-nums shrink-0 ${p.dpsGain > 0 ? "text-accent" : "text-text-dim/40"}`}>
                {p.dpsGain > 0 ? `+${fmtNum(p.dpsGain)}` : "-"}
              </span>
              <span className="w-10 text-right tabular-nums text-text-dim shrink-0">
                {p.pointCost}pt
              </span>
              <span className={`w-14 text-right tabular-nums shrink-0 ${p.dpsPerPoint > 0 ? "text-amber-400" : "text-text-dim/40"}`}>
                {p.dpsPerPoint > 0 ? `${fmtNum(p.dpsPerPoint)}/pt` : "-"}
              </span>
              <span className="w-10 text-right tabular-nums text-amber-400/70 shrink-0">
                ~{p.estimatedPrice}c
              </span>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && pairs.length === 0 && !searching && (
        <p className="text-xs font-mono text-text-dim/60 text-center py-6">
          Click Search to find the best cluster jewels for your build.
          Includes 2 entrance small passives in calculations.
          {searchMode === "pairs" ? " Tests all notable combinations per cluster base." : ""}
        </p>
      )}
    </div>
  );
}

function sortResults(arr: ClusterSearchResult[], by: "dps" | "value" | "dps_per_point") {
  arr.sort((a, b) => {
    if (by === "dps") return b.dpsGain - a.dpsGain;
    if (by === "dps_per_point") return b.valueScore - a.valueScore; // valueScore holds dpsPerPoint for singles
    return b.valueScore - a.valueScore;
  });
}

function PriceCheckButton({
  name,
  onPrice,
}: {
  name: string;
  onPrice: (price: number) => void;
}) {
  const [loading, setLoading] = useState(false);

  return (
    <button
      onClick={async () => {
        setLoading(true);
        try {
          const { priceCheckClusterNotable } = await import("@/lib/trade");
          const price = await priceCheckClusterNotable(name);
          if (price) onPrice(price.median);
        } catch {
          // ignore
        } finally {
          setLoading(false);
        }
      }}
      disabled={loading}
      className="w-4 text-[9px] font-mono text-amber-400/60 hover:text-amber-400 disabled:opacity-40 transition-colors shrink-0"
      title="Check real trade price"
    >
      {loading ? "." : "$"}
    </button>
  );
}
