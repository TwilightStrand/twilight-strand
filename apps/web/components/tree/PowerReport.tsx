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
  pathCost: number;
  valuePerPoint: number;
}

function fmtNum(n: number): string {
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(Math.round(n));
}

function buildConnectionMap(treeData: Record<string, unknown>): Map<string, string[]> {
  const connections = new Map<string, string[]>();
  const nodes = (treeData.nodes || {}) as Record<string, Record<string, unknown>>;

  for (const [nodeId, node] of Object.entries(nodes)) {
    const outs = ((node.out || []) as (string | number)[]).map(String);
    const ins = ((node.in || []) as (string | number)[]).map(String);
    const allNeighbors = [...outs, ...ins];
    const existing = connections.get(nodeId) || [];
    connections.set(nodeId, [...new Set([...existing, ...allNeighbors])]);

    for (const neighbor of allNeighbors) {
      const nExisting = connections.get(neighbor) || [];
      if (!nExisting.includes(nodeId)) {
        connections.set(neighbor, [...nExisting, nodeId]);
      }
    }
  }

  return connections;
}

function findPathCost(
  nodeId: string,
  allocatedNodes: Set<string>,
  connections: Map<string, string[]>
): number {
  if (allocatedNodes.has(nodeId)) return 0;

  const visited = new Set<string>();
  const queue: [string, number][] = [[nodeId, 0]];
  visited.add(nodeId);

  while (queue.length > 0) {
    const [current, depth] = queue.shift()!;
    if (depth > 15) return 99;

    const neighbors = connections.get(current) || [];
    for (const neighbor of neighbors) {
      if (allocatedNodes.has(neighbor)) return depth + 1;
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, depth + 1]);
      }
    }
  }

  return 99;
}

export function PowerReport() {
  const stats = useBuildStore((s) => s.stats);
  const allocatedNodes = useTreeStore((s) => s.allocatedNodes);
  const [rankings, setRankings] = useState<NodeRanking[]>([]);
  const [mode, setMode] = useState<"dps" | "defence" | "combined">("dps");
  const [sortBy, setSortBy] = useState<"raw" | "perpoint">("perpoint");
  const [computing, setComputing] = useState(false);
  const [computed, setComputed] = useState(false);
  const [nodeCount, setNodeCount] = useState(0);

  const compute = async () => {
    if (!stats) return;
    setComputing(true);

    try {
      const { isRustEngineReady, evaluateBuildRust, parseStatLine, defaultRustInput } = await import(
        "@/engine/rust-bridge"
      );

      if (!isRustEngineReady()) {
        setComputing(false);
        return;
      }

      const treeResp = await fetch("/data/pob/TreeData/3_29/tree.json");
      const treeData = await treeResp.json();
      const connectionMap = buildConnectionMap(treeData);

      const baseInput = defaultRustInput({
        level: stats.level,
        ascendancy_name: stats.ascendancy || "",
      });

      const baseOutput = evaluateBuildRust(baseInput);
      if (!baseOutput) {
        setComputing(false);
        return;
      }

      const results: NodeRanking[] = [];
      const nodes = treeData.nodes || {};
      let evaluated = 0;

      for (const [nodeId, node] of Object.entries(nodes) as [string, Record<string, unknown>][]) {
        if (allocatedNodes.has(nodeId)) continue;
        const nodeStats = node.stats as string[] | undefined;
        if (!nodeStats || nodeStats.length === 0) continue;
        if (node.isAscendancyStart || nodeId === "root") continue;

        const nodeMods = nodeStats.flatMap((s: string) => parseStatLine(s));
        if (nodeMods.length === 0) continue;

        const pathCost = findPathCost(nodeId, allocatedNodes, connectionMap);
        if (pathCost > 15) continue;

        const withNode = evaluateBuildRust({
          ...baseInput,
          modifiers: [...baseInput.modifiers, ...nodeMods],
        });

        if (!withNode) continue;
        evaluated++;

        const dpsGain = withNode.total_dps - baseOutput.total_dps;
        const lifeGain = withNode.life - baseOutput.life;
        const esGain = withNode.energy_shield - baseOutput.energy_shield;
        const ehpGain = withNode.total_ehp - baseOutput.total_ehp;

        if (Math.abs(dpsGain) < 0.01 && Math.abs(lifeGain) < 0.01 && Math.abs(esGain) < 0.01)
          continue;

        const dpsPct =
          baseOutput.total_dps > 0 ? (dpsGain / baseOutput.total_dps) * 100 : 0;
        const ehpPct =
          baseOutput.total_ehp > 0 ? (ehpGain / baseOutput.total_ehp) * 100 : 0;

        let rawScore: number;
        if (mode === "dps") rawScore = dpsPct;
        else if (mode === "defence") rawScore = ehpPct;
        else rawScore = dpsPct + ehpPct;

        const valuePerPoint = pathCost > 0 ? rawScore / pathCost : rawScore;

        results.push({
          id: nodeId,
          name: (node.name || node.dn || nodeId) as string,
          dpsGain,
          dpsPct,
          lifeGain,
          esGain,
          ehpGain,
          isNotable: !!node.isNotable,
          isKeystone: !!node.isKeystone,
          pathCost,
          valuePerPoint,
        });
      }

      results.sort((a, b) =>
        sortBy === "perpoint"
          ? b.valuePerPoint - a.valuePerPoint
          : mode === "dps"
            ? b.dpsGain - a.dpsGain
            : mode === "defence"
              ? b.ehpGain - a.ehpGain
              : b.dpsPct + b.ehpGain - (a.dpsPct + a.ehpGain)
      );

      setRankings(results.slice(0, 30));
      setNodeCount(evaluated);
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
        <div className="flex gap-1 flex-wrap">
          {(["dps", "defence", "combined"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setComputed(false); }}
              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                mode === m ? "bg-accent/20 text-accent" : "text-text-dim"
              }`}
            >
              {m === "dps" ? "DPS" : m === "defence" ? "Defence" : "Combined"}
            </button>
          ))}
          <span className="text-text-dim/30 mx-0.5">|</span>
          <button
            onClick={() => { setSortBy(sortBy === "raw" ? "perpoint" : "raw"); setComputed(false); }}
            className="text-[10px] font-mono px-2 py-0.5 rounded bg-bg-hover text-text-dim hover:text-text-primary"
          >
            {sortBy === "perpoint" ? "Value/pt" : "Raw"}
          </button>
          <button
            onClick={compute}
            disabled={computing}
            className="text-[10px] font-mono px-3 py-0.5 rounded bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 disabled:opacity-40 ml-1"
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
            <span className="w-12 text-right">{mode === "defence" ? "EHP%" : "DPS%"}</span>
            <span className="w-10 text-right">Cost</span>
            <span className="w-14 text-right">%/pt</span>
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
                className={`w-12 text-right tabular-nums ${
                  r.dpsPct > 0 ? "text-accent" : r.dpsPct < 0 ? "text-red-400" : "text-text-dim/40"
                }`}
              >
                {r.dpsPct > 0 ? "+" : ""}{r.dpsPct.toFixed(1)}%
              </span>
              <span
                className={`w-10 text-right tabular-nums ${
                  r.pathCost <= 1
                    ? "text-green-400"
                    : r.pathCost <= 3
                      ? "text-text-dim"
                      : "text-red-400/60"
                }`}
              >
                {r.pathCost}pt
              </span>
              <span className="w-14 text-right tabular-nums text-amber-400">
                {r.valuePerPoint.toFixed(2)}
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
          <div className="text-[9px] font-mono text-text-dim/40 text-right mt-1">
            {nodeCount} nodes evaluated
          </div>
        </div>
      )}

      {!computed && !computing && (
        <p className="text-xs font-mono text-text-dim/60 text-center py-6">
          Click Analyze to rank unallocated nodes by{" "}
          {sortBy === "perpoint" ? "value per skill point" : "raw gain"}.
          Considers pathing cost via BFS. Powered by Rust WASM.
        </p>
      )}
    </div>
  );
}
