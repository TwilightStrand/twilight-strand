"use client";

import { useState } from "react";
import { useTreeStore } from "@/stores/tree-store";
import { useBuildStore } from "@/stores/build-store";

interface NodeRanking {
  id: string;
  name: string;
  dpsGain: number;
  dpsPct: number;
  lifeGain: number;
  esGain: number;
  ehpGain: number;
  isNotable: boolean;
  isKeystone: boolean;
}

function fmtNum(n: number): string {
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(Math.round(n));
}

export function PowerReport() {
  const stats = useBuildStore((s) => s.stats);
  const allocatedNodes = useTreeStore((s) => s.allocatedNodes);
  const [rankings, setRankings] = useState<NodeRanking[]>([]);
  const [mode, setMode] = useState<"dps" | "defence" | "combined">("dps");
  const [computing, setComputing] = useState(false);
  const [computed, setComputed] = useState(false);

  const compute = async () => {
    if (!stats) return;
    setComputing(true);

    try {
      const { isRustEngineReady, evaluateBuildRust, parseStatLine } = await import(
        "@/engine/rust-bridge"
      );

      if (!isRustEngineReady()) {
        setComputing(false);
        return;
      }

      const treeResp = await fetch("/data/pob/TreeData/3_29/tree.json");
      const treeData = await treeResp.json();

      const baseInput = {
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
      };

      const baseOutput = evaluateBuildRust(baseInput);
      if (!baseOutput) {
        setComputing(false);
        return;
      }

      const results: NodeRanking[] = [];
      const nodes = treeData.nodes || {};

      for (const [nodeId, node] of Object.entries(nodes) as [string, Record<string, unknown>][]) {
        if (allocatedNodes.has(nodeId)) continue;
        const nodeStats = node.stats as string[] | undefined;
        if (!nodeStats || nodeStats.length === 0) continue;
        if (node.isAscendancyStart || nodeId === "root") continue;

        const nodeMods = nodeStats.flatMap((s: string) => parseStatLine(s));

        if (nodeMods.length === 0) continue;

        const withNode = evaluateBuildRust({
          ...baseInput,
          modifiers: [...baseInput.modifiers, ...nodeMods],
        });

        if (!withNode) continue;

        const dpsGain = withNode.total_dps - baseOutput.total_dps;
        const lifeGain = withNode.life - baseOutput.life;
        const esGain = withNode.energy_shield - baseOutput.energy_shield;
        const ehpGain = withNode.total_ehp - baseOutput.total_ehp;

        if (Math.abs(dpsGain) < 0.01 && Math.abs(lifeGain) < 0.01 && Math.abs(esGain) < 0.01)
          continue;

        results.push({
          id: nodeId,
          name: (node.name || node.dn || nodeId) as string,
          dpsGain,
          dpsPct:
            baseOutput.total_dps > 0 ? (dpsGain / baseOutput.total_dps) * 100 : 0,
          lifeGain,
          esGain,
          ehpGain,
          isNotable: !!node.isNotable,
          isKeystone: !!node.isKeystone,
        });
      }

      results.sort((a, b) => {
        if (mode === "dps") return b.dpsGain - a.dpsGain;
        if (mode === "defence") return b.ehpGain - a.ehpGain;
        return (
          b.dpsPct +
          (b.ehpGain / Math.max(1, baseOutput.total_ehp)) * 100 -
          (a.dpsPct + (a.ehpGain / Math.max(1, baseOutput.total_ehp)) * 100)
        );
      });

      setRankings(results.slice(0, 30));
      setComputed(true);
    } catch (e) {
      console.warn("Power report error:", e);
    } finally {
      setComputing(false);
    }
  };

  if (!stats || stats.total_dps === 0) return null;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-mono uppercase tracking-widest text-text-dim">
          Power Report
        </h2>
        <div className="flex gap-1">
          {(["dps", "defence", "combined"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setComputed(false);
              }}
              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                mode === m ? "bg-accent/20 text-accent" : "text-text-dim"
              }`}
            >
              {m === "dps" ? "DPS" : m === "defence" ? "Defence" : "Combined"}
            </button>
          ))}
          <button
            onClick={compute}
            disabled={computing}
            className="text-[10px] font-mono px-3 py-0.5 rounded bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 disabled:opacity-40 ml-2"
          >
            {computing ? "Computing..." : computed ? "Refresh" : "Analyze"}
          </button>
        </div>
      </div>

      {rankings.length > 0 && (
        <div className="space-y-0.5 max-w-2xl">
          <div className="flex text-[9px] font-mono text-text-dim/60 border-b border-border-subtle pb-0.5 mb-1 px-2">
            <span className="w-5">#</span>
            <span className="flex-1">Node</span>
            <span className="w-16 text-right">DPS</span>
            <span className="w-12 text-right">%</span>
            <span className="w-14 text-right">Life/ES</span>
          </div>
          {rankings.map((r, i) => (
            <div
              key={r.id}
              className={`flex items-center text-[10px] font-mono px-2 py-1 rounded hover:bg-bg-hover/50 ${
                r.isKeystone
                  ? "border-l-2 border-amber-400/40"
                  : r.isNotable
                    ? "border-l-2 border-accent/40"
                    : ""
              }`}
            >
              <span className="w-5 text-text-dim/40 tabular-nums">{i + 1}</span>
              <span className="flex-1 truncate text-text-primary">{r.name}</span>
              <span
                className={`w-16 text-right tabular-nums ${
                  r.dpsGain > 0
                    ? "text-accent"
                    : r.dpsGain < 0
                      ? "text-red-400"
                      : "text-text-dim/40"
                }`}
              >
                {r.dpsGain > 0 ? "+" : ""}
                {fmtNum(r.dpsGain)}
              </span>
              <span
                className={`w-12 text-right tabular-nums ${
                  r.dpsPct > 0 ? "text-accent/70" : "text-text-dim/40"
                }`}
              >
                {r.dpsPct > 0 ? "+" : ""}
                {r.dpsPct.toFixed(1)}%
              </span>
              <span
                className={`w-14 text-right tabular-nums ${
                  r.lifeGain + r.esGain > 0 ? "text-green-400" : "text-text-dim/40"
                }`}
              >
                {r.lifeGain > 0
                  ? `+${Math.round(r.lifeGain)}`
                  : r.esGain > 0
                    ? `+${Math.round(r.esGain)}`
                    : "-"}
              </span>
            </div>
          ))}
        </div>
      )}

      {!computed && !computing && (
        <p className="text-xs font-mono text-text-dim/60 text-center py-6">
          Click Analyze to rank every unallocated node by{" "}
          {mode === "dps"
            ? "DPS gain"
            : mode === "defence"
              ? "EHP gain"
              : "combined value"}
          . Uses the Rust WASM engine for instant evaluation.
        </p>
      )}
    </div>
  );
}
