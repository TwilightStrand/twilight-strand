"use client";

import { useState } from "react";
import { useBuildStore } from "@/stores/build-store";
import { CLUSTER_NOTABLES } from "@/data/cluster-notables";
import type { ClusterSearchResult } from "@/engine/cluster-types";

function fmtNum(n: number): string {
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(Math.round(n));
}

export function ClusterSearch() {
  const stats = useBuildStore((s) => s.stats);
  const [results, setResults] = useState<ClusterSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [sortBy, setSortBy] = useState<"dps" | "value" | "ehp">("value");

  const search = () => {
    if (!stats) return;
    setSearching(true);

    const notableResults: ClusterSearchResult[] = [];

    for (const [name, notable] of Object.entries(CLUSTER_NOTABLES)) {
      let dpsGain = 0;
      let ehpGain = 0;

      for (const stat of notable.stats) {
        const lower = stat.toLowerCase();
        const numMatch = stat.match(/(\d+)/);
        const num = numMatch ? parseInt(numMatch[1]) : 0;

        if (lower.includes("damage") && lower.includes("increased"))
          dpsGain += num * stats.total_dps * 0.01;
        if (lower.includes("attack speed") || lower.includes("cast speed"))
          dpsGain += num * stats.total_dps * 0.01;
        if (lower.includes("critical strike chance"))
          dpsGain += num * stats.total_dps * 0.005;
        if (lower.includes("critical strike multiplier"))
          dpsGain += num * stats.total_dps * 0.008;
        if (lower.includes("resistance") && lower.includes("-"))
          dpsGain += num * stats.total_dps * 0.012;
        if (lower.includes("maximum life")) ehpGain += num * 15;
        if (lower.includes("increased maximum life"))
          ehpGain += num * stats.life * 0.01;
        if (lower.includes("energy shield"))
          ehpGain += num * 2;
        if (lower.includes("resistance") && !lower.includes("-"))
          ehpGain += num * 8;
        if (lower.includes("aura") && lower.includes("effect"))
          dpsGain += num * stats.total_dps * 0.005;
      }

      const estimatedPrice = Math.max(1, Math.round((50 / notable.weight) * 100));
      const valueScore =
        estimatedPrice > 0 ? (dpsGain + ehpGain) / estimatedPrice : 0;

      notableResults.push({
        jewel: {
          name,
          type: "medium",
          enchant: "",
          passiveCount: 4,
          notables: [name],
          smallPassiveType: "",
        },
        notables: [notable],
        estimatedPrice,
        dpsGain,
        ehpGain,
        valueScore,
      });
    }

    notableResults.sort((a, b) => {
      if (sortBy === "dps") return b.dpsGain - a.dpsGain;
      if (sortBy === "ehp") return b.ehpGain - a.ehpGain;
      return b.valueScore - a.valueScore;
    });

    setResults(notableResults);
    setSearching(false);
  };

  if (!stats || stats.total_dps === 0) return null;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-mono uppercase tracking-widest text-text-dim">
          Cluster Jewel Search
        </h2>
        <div className="flex gap-1">
          {(["value", "dps", "ehp"] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setSortBy(s);
                if (results.length > 0) {
                  setResults((prev) => {
                    const sorted = [...prev];
                    sorted.sort((a, b) => {
                      if (s === "dps") return b.dpsGain - a.dpsGain;
                      if (s === "ehp") return b.ehpGain - a.ehpGain;
                      return b.valueScore - a.valueScore;
                    });
                    return sorted;
                  });
                }
              }}
              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                sortBy === s
                  ? "bg-accent/20 text-accent"
                  : "text-text-dim hover:text-text-primary"
              }`}
            >
              {s.toUpperCase()}
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

      {results.length > 0 && (
        <div className="space-y-1 max-w-2xl">
          {results.slice(0, 15).map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2 bg-bg-card border border-border-card rounded text-xs font-mono"
            >
              <span className="w-5 text-text-dim/40 tabular-nums shrink-0">
                {i + 1}
              </span>
              <span className="text-text-primary flex-1 truncate">
                {r.jewel.name}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                {r.dpsGain > 0 && (
                  <span className="text-accent tabular-nums">
                    +{fmtNum(r.dpsGain)} DPS
                  </span>
                )}
                {r.ehpGain > 0 && (
                  <span className="text-green-400 tabular-nums">
                    +{Math.round(r.ehpGain)} EHP
                  </span>
                )}
                <span className="text-amber-400 tabular-nums">
                  ~{r.estimatedPrice}c
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !searching && (
        <p className="text-xs font-mono text-text-dim/60 text-center py-6">
          Click Search to find the best cluster jewel notables for your build.
          Results are ranked by value (stat gain per chaos).
        </p>
      )}
    </div>
  );
}
