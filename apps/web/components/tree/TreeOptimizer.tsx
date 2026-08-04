"use client";

import { useState } from "react";
import { useTreeStore } from "@/stores/tree-store";
import { useBuildStore } from "@/stores/build-store";

interface OptimizationResult {
  name: string;
  cost: number;
  benefit: string;
  type: "allocate" | "respec" | "info";
}

function fmtNum(n: number): string {
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(Math.round(n));
}

export function TreeOptimizer() {
  const stats = useBuildStore((s) => s.stats);
  const allocatedNodes = useTreeStore((s) => s.allocatedNodes);
  const [suggestions, setSuggestions] = useState<OptimizationResult[]>([]);
  const [optimizing, setOptimizing] = useState(false);

  if (!stats || allocatedNodes.size <= 1) return null;

  const analyze = async () => {
    setOptimizing(true);
    try {
      const { isRustEngineReady, evaluateBuildRust, parseStatLine } = await import(
        "@/engine/rust-bridge"
      );

      if (!isRustEngineReady()) {
        setSuggestions([{ name: "Rust engine not loaded", cost: 0, benefit: "Reload to enable", type: "info" }]);
        setOptimizing(false);
        return;
      }

      const treeResp = await fetch("/data/pob/TreeData/3_29/tree.json");
      const treeData = await treeResp.json();
      const nodes = (treeData.nodes || {}) as Record<string, Record<string, unknown>>;

      // Build connection map
      const connections = new Map<string, string[]>();
      for (const [nodeId, node] of Object.entries(nodes)) {
        const outs = ((node.out || []) as (string | number)[]).map(String);
        const ins = ((node.in || []) as (string | number)[]).map(String);
        const all = [...outs, ...ins];
        connections.set(nodeId, [...new Set([...(connections.get(nodeId) || []), ...all])]);
        for (const n of all) {
          const ex = connections.get(n) || [];
          if (!ex.includes(nodeId)) connections.set(n, [...ex, nodeId]);
        }
      }

      const baseInput = {
        level: stats.level,
        class_id: 0,
        base_str: 20, base_dex: 20, base_int: 20,
        modifiers: [] as Array<{ stat: string; value: number; mod_type: string }>,
        allocated_keystones: [] as string[],
        main_skill_id: "",
        ascendancy_name: stats.ascendancy || "",
        enemy_level: 83, enemy_fire_res: 0, enemy_cold_res: 0,
        enemy_lightning_res: 0, enemy_chaos_res: 0, enemy_is_boss: false,
      };

      const baseOutput = evaluateBuildRust(baseInput);
      if (!baseOutput) { setOptimizing(false); return; }

      const results: OptimizationResult[] = [];

      // Find top adjacent notables (cost 1)
      const adjacentNotables: Array<{ id: string; name: string; dpsPct: number }> = [];
      for (const [nodeId, node] of Object.entries(nodes)) {
        if (allocatedNodes.has(nodeId)) continue;
        if (!node.isNotable && !node.isKeystone) continue;
        const nodeStats = node.stats as string[] | undefined;
        if (!nodeStats?.length) continue;

        // Check if adjacent to allocated
        const neighbors = connections.get(nodeId) || [];
        const isAdjacent = neighbors.some((n) => allocatedNodes.has(n));
        if (!isAdjacent) continue;

        const nodeMods = nodeStats.flatMap((s: string) => parseStatLine(s));
        if (!nodeMods.length) continue;

        const withNode = evaluateBuildRust({
          ...baseInput,
          modifiers: [...baseInput.modifiers, ...nodeMods],
        });
        if (!withNode) continue;

        const dpsPct = baseOutput.total_dps > 0
          ? ((withNode.total_dps - baseOutput.total_dps) / baseOutput.total_dps) * 100
          : 0;

        adjacentNotables.push({
          id: nodeId,
          name: (node.name || node.dn || nodeId) as string,
          dpsPct,
        });
      }

      adjacentNotables.sort((a, b) => b.dpsPct - a.dpsPct);

      for (const node of adjacentNotables.slice(0, 3)) {
        if (node.dpsPct > 0.1) {
          results.push({
            name: `Allocate ${node.name}`,
            cost: 1,
            benefit: `+${node.dpsPct.toFixed(1)}% DPS`,
            type: "allocate",
          });
        }
      }

      // Unspent points
      const totalPoints = Math.min(stats.level - 1 + 22, 123);
      const usedPoints = Math.max(0, allocatedNodes.size - 1);
      const remaining = totalPoints - usedPoints;
      if (remaining > 0) {
        results.push({
          name: `${remaining} unspent points available`,
          cost: -remaining,
          benefit: "Allocate for more power",
          type: "info",
        });
      }

      if (results.length === 0) {
        results.push({
          name: "Build looks optimized",
          cost: 0,
          benefit: "No obvious improvements nearby",
          type: "info",
        });
      }

      setSuggestions(results);
    } catch (e) {
      console.warn("Optimizer error:", e);
      setSuggestions([{ name: "Analysis failed", cost: 0, benefit: String(e), type: "info" }]);
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div className="absolute top-14 right-3 z-10 bg-bg-card/90 backdrop-blur border border-border-subtle rounded p-2.5 max-w-56">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-accent/70">
          Optimizer
        </span>
        <button
          onClick={analyze}
          disabled={optimizing}
          className="text-[9px] font-mono text-accent hover:text-accent/80 disabled:opacity-40"
        >
          {optimizing ? "..." : "Analyze"}
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-1">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 text-[10px] font-mono px-1.5 py-1 rounded ${
                s.type === "info" ? "" : "hover:bg-bg-hover/50 cursor-pointer"
              }`}
            >
              {s.type !== "info" && (
                <span
                  className={`tabular-nums shrink-0 ${
                    s.cost < 0 ? "text-green-400" : s.cost <= 1 ? "text-accent" : "text-amber-400"
                  }`}
                >
                  {s.cost > 0 ? `${s.cost}pt` : s.cost < 0 ? `${s.cost}pt` : ""}
                </span>
              )}
              <div className="min-w-0">
                <div className="text-text-primary truncate">{s.name}</div>
                <div className="text-text-dim/60 text-[9px]">{s.benefit}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {suggestions.length === 0 && !optimizing && (
        <p className="text-[9px] font-mono text-text-dim/50 text-center py-1">
          Finds adjacent notables worth allocating
        </p>
      )}
    </div>
  );
}
