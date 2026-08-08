
import { useState } from "react";
import { useTreeStore } from "@/stores/tree-store";
import { useBuildStore } from "@/stores/build-store";

interface OptimizationResult {
  name: string;
  cost: number;
  benefit: string;
  type: "allocate" | "respec" | "path" | "info";
  path?: string[];
}

function fmtNum(n: number): string {
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(Math.round(n));
}

function findShortestPath(
  from: string,
  allocated: Set<string>,
  connections: Map<string, string[]>,
  maxDepth: number
): string[] | null {
  const visited = new Map<string, string>();
  const queue: [string, number][] = [[from, 0]];
  visited.set(from, "");

  while (queue.length > 0) {
    const [current, depth] = queue.shift()!;
    if (depth > maxDepth) return null;

    const neighbors = connections.get(current) || [];
    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue;
      visited.set(neighbor, current);

      if (allocated.has(neighbor)) {
        const path: string[] = [];
        let node = current;
        while (node && node !== "") {
          path.push(node);
          node = visited.get(node)!;
        }
        return path;
      }

      queue.push([neighbor, depth + 1]);
    }
  }

  return null;
}

export function TreeOptimizer() {
  const stats = useBuildStore((s) => s.stats);
  const allocatedNodes = useTreeStore((s) => s.allocatedNodes);
  const [suggestions, setSuggestions] = useState<OptimizationResult[]>([]);
  const [optimizing, setOptimizing] = useState(false);
  const [maxDepth, setMaxDepth] = useState(5);

  if (!stats || allocatedNodes.size <= 1) return null;

  const analyze = async () => {
    setOptimizing(true);
    try {
      const { isRustEngineReady, evaluateBuildRust, parseStatLine, defaultRustInput } = await import(
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

      const baseInput = defaultRustInput({
        level: stats.level,
        ascendancy_name: stats.ascendancy || "",
      });

      const baseOutput = evaluateBuildRust(baseInput);
      if (!baseOutput) { setOptimizing(false); return; }

      const results: OptimizationResult[] = [];

      // Evaluate all notables/keystones within maxDepth points
      const candidates: Array<{
        id: string;
        name: string;
        path: string[];
        cost: number;
        dpsPct: number;
        lifeDelta: number;
        ehpDelta: number;
        dpsPerPt: number;
      }> = [];

      for (const [nodeId, node] of Object.entries(nodes)) {
        if (allocatedNodes.has(nodeId)) continue;
        if (!node.isNotable && !node.isKeystone) continue;
        if (node.isAscendancyStart || nodeId === "root") continue;
        const nodeStats = node.stats as string[] | undefined;
        if (!nodeStats?.length) continue;

        const path = findShortestPath(nodeId, allocatedNodes, connections, maxDepth);
        if (!path) continue;

        const cost = path.length;

        // Collect all mods along the path (target + travel nodes)
        const pathMods = path.flatMap((nId) => {
          const n = nodes[nId];
          if (!n) return [];
          const s = n.stats as string[] | undefined;
          if (!s) return [];
          return s.flatMap((line: string) => parseStatLine(line));
        });

        if (!pathMods.length) continue;

        const withPath = evaluateBuildRust({
          ...baseInput,
          modifiers: [...baseInput.modifiers, ...pathMods],
        });
        if (!withPath) continue;

        const dpsDelta = withPath.total_dps - baseOutput.total_dps;
        const dpsPct = baseOutput.total_dps > 0
          ? (dpsDelta / baseOutput.total_dps) * 100
          : 0;
        const lifeDelta = withPath.life - baseOutput.life;
        const ehpDelta = withPath.total_ehp - baseOutput.total_ehp;

        if (Math.abs(dpsPct) < 0.01 && Math.abs(lifeDelta) < 0.1) continue;

        candidates.push({
          id: nodeId,
          name: (node.name || node.dn || nodeId) as string,
          path,
          cost,
          dpsPct,
          lifeDelta,
          ehpDelta,
          dpsPerPt: cost > 0 ? dpsPct / cost : dpsPct,
        });
      }

      // Sort by DPS per point
      candidates.sort((a, b) => b.dpsPerPt - a.dpsPerPt);

      for (const c of candidates.slice(0, 5)) {
        if (c.dpsPct > 0.05 || c.lifeDelta > 5) {
          const parts: string[] = [];
          if (Math.abs(c.dpsPct) > 0.01) parts.push(`${c.dpsPct > 0 ? "+" : ""}${c.dpsPct.toFixed(1)}% DPS`);
          if (c.lifeDelta > 5) parts.push(`+${Math.round(c.lifeDelta)} life`);

          const travelNames = c.path
            .filter((id) => id !== c.id)
            .map((id) => {
              const n = nodes[id];
              return n?.isNotable ? (n.name as string) || id : null;
            })
            .filter(Boolean);

          let routeInfo = "";
          if (travelNames.length > 0) routeInfo = ` via ${travelNames.join(", ")}`;

          results.push({
            name: c.name,
            cost: c.cost,
            benefit: `${parts.join(", ")} (${c.dpsPerPt.toFixed(2)}%/pt)${routeInfo}`,
            type: c.cost === 1 ? "allocate" : "path",
            path: c.path,
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
          benefit: `No improvements within ${maxDepth} points`,
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
    <div className="absolute top-14 right-3 z-10 bg-bg-card/90 backdrop-blur border border-border-subtle rounded p-2.5 max-w-64">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-accent/70">
          Smart Pathing
        </span>
        <div className="flex items-center gap-1">
          <select
            value={maxDepth}
            onChange={(e) => setMaxDepth(parseInt(e.target.value))}
            className="bg-bg-inset border border-border-subtle rounded px-1 py-0.5 text-[9px] font-mono text-text-primary"
          >
            <option value={3}>3pt</option>
            <option value={5}>5pt</option>
            <option value={10}>10pt</option>
            <option value={15}>15pt</option>
          </select>
          <button
            onClick={analyze}
            disabled={optimizing}
            className="text-[9px] font-mono text-accent hover:text-accent/80 disabled:opacity-40"
          >
            {optimizing ? "..." : "Analyze"}
          </button>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-1">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 text-[10px] font-mono px-1.5 py-1 rounded ${
                s.type === "info" ? "" : "hover:bg-bg-hover/50 cursor-pointer"
              }`}
            >
              {s.type !== "info" && (
                <span
                  className={`tabular-nums shrink-0 mt-0.5 ${
                    s.cost < 0
                      ? "text-green-400"
                      : s.cost <= 1
                        ? "text-accent"
                        : s.cost <= 3
                          ? "text-amber-400"
                          : "text-red-400/70"
                  }`}
                >
                  {s.cost > 0 ? `${s.cost}pt` : s.cost < 0 ? `${s.cost}pt` : ""}
                </span>
              )}
              <div className="min-w-0">
                <div className="text-text-primary truncate">
                  {s.type === "path" ? `Path to ${s.name}` : s.type === "allocate" ? `Allocate ${s.name}` : s.name}
                </div>
                <div className="text-text-dim/60 text-[9px] leading-tight">{s.benefit}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {suggestions.length === 0 && !optimizing && (
        <p className="text-[9px] font-mono text-text-dim/50 text-center py-1">
          Finds best notables within {maxDepth} points, including travel cost. Ranked by DPS/point.
        </p>
      )}
    </div>
  );
}
