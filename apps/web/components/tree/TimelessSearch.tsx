
import { useState, useCallback, useEffect } from "react";
import { useBuildStore } from "@/stores/build-store";
import { useTreeStore } from "@/stores/tree-store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TreeNode {
  skill: number;
  name: string;
  isNotable?: boolean;
  isKeystone?: boolean;
  isJewelSocket?: boolean;
  isMastery?: boolean;
  isAscendancyStart?: boolean;
  ascendancyName?: string;
  classStartIndex?: number;
  stats?: string[];
  out?: string[];
  in?: string[];
  expansionJewel?: {
    size: number;
    index: number;
    proxy?: string;
  };
}

interface TransformedNode {
  nodeId: string;
  name: string;
  nodeType: "small" | "notable" | "keystone";
  originalStats: string[];
  addedStats: string[];
  replacedKeystone: string | undefined;
  isAllocated: boolean;
}

interface KeystoneEntry {
  conqueror: string;
  keystone_name: string;
  stat_lines: string[];
}

const JEWEL_NAMES = [
  "Lethal Pride",
  "Brutal Restraint",
  "Militant Faith",
  "Elegant Hubris",
  "Glorious Vanity",
] as const;

// Conquerors per jewel, used as fallback when WASM is unavailable
const CONQUERORS: Record<string, string[]> = {
  "Lethal Pride": ["Kaom", "Rakiata", "Kiloava", "Akoya"],
  "Brutal Restraint": ["Deshret", "Balbala", "Asenath", "Nasima"],
  "Militant Faith": ["Avarius", "Dominus", "Maxarius", "Venarius"],
  "Elegant Hubris": ["Cadiro", "Victario", "Caspiro", "Chitus"],
  "Glorious Vanity": ["Xibaqua", "Zerphi", "Ahuana", "Doryani"],
};

// Fallback seed ranges when WASM is unavailable
const FALLBACK_RANGES: Record<string, [number, number]> = {
  "Lethal Pride": [10000, 18000],
  "Brutal Restraint": [500, 8000],
  "Militant Faith": [2000, 10000],
  "Elegant Hubris": [2000, 160000],
  "Glorious Vanity": [100, 8000],
};

// Node IDs that skip ascendancy/mastery/start nodes when computing radius
function isTransformableNode(n: TreeNode): boolean {
  if (n.ascendancyName) return false;
  if (n.isMastery) return false;
  if (n.classStartIndex !== undefined) return false;
  if (n.isJewelSocket) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Tree data cache (loaded once, shared across renders)
// ---------------------------------------------------------------------------

let treeCache: {
  nodes: Record<string, TreeNode>;
  adj: Map<string, string[]>;
  jewelSockets: { id: string; node: TreeNode }[];
} | null = null;

async function loadTree(): Promise<typeof treeCache> {
  if (treeCache) return treeCache;

  const resp = await fetch("/data/tree/tree-3_29.json");
  const data = await resp.json();
  const nodes = data.nodes as Record<string, TreeNode>;

  // Build adjacency map
  const adj = new Map<string, string[]>();
  for (const [nid, n] of Object.entries(nodes)) {
    if (nid === "root") continue;
    const outs = (n.out || []).map(String);
    const ins = (n.in || []).map(String);
    const all = [...new Set([...outs, ...ins])];
    adj.set(nid, [...new Set([...(adj.get(nid) || []), ...all])]);
    for (const nb of all) {
      const ex = adj.get(nb) || [];
      if (!ex.includes(nid)) adj.set(nb, [...ex, nid]);
    }
  }

  // Large jewel sockets (size 2) are where timeless jewels go
  const jewelSockets = Object.entries(nodes)
    .filter(([, n]) => n.isJewelSocket && n.expansionJewel?.size === 2)
    .map(([id, node]) => ({ id, node }));

  treeCache = { nodes, adj, jewelSockets };
  return treeCache;
}

/** BFS: find all node IDs within `depth` hops of `startId`. */
function nodesInRadius(
  adj: Map<string, string[]>,
  startId: string,
  depth: number,
): Set<string> {
  const visited = new Set<string>();
  const queue: [string, number][] = [[startId, 0]];
  visited.add(startId);
  while (queue.length > 0) {
    const [cur, d] = queue.shift()!;
    if (d >= depth) continue;
    for (const nb of adj.get(cur) || []) {
      if (!visited.has(nb)) {
        visited.add(nb);
        queue.push([nb, d + 1]);
      }
    }
  }
  return visited;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TimelessSearch() {
  const stats = useBuildStore((s) => s.stats);
  const allocatedNodes = useTreeStore((s) => s.allocatedNodes);

  const [jewelName, setJewelName] = useState<string>(JEWEL_NAMES[0]);
  const [conqueror, setConqueror] = useState<string>(CONQUERORS[JEWEL_NAMES[0]][0]);
  const [seed, setSeed] = useState<number>(10000);
  const [socketId, setSocketId] = useState<string>("");
  const [seedRange, setSeedRange] = useState<[number, number]>(FALLBACK_RANGES[JEWEL_NAMES[0]]);

  const [wasmReady, setWasmReady] = useState(false);
  const [keystones, setKeystones] = useState<KeystoneEntry[]>([]);
  const [transformedNodes, setTransformedNodes] = useState<TransformedNode[]>([]);
  const [searching, setSearching] = useState(false);
  const [sockets, setSockets] = useState<{ id: string; node: TreeNode }[]>([]);
  const [error, setError] = useState<string>("");

  // Load WASM + tree data on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Load tree data (needed for socket list)
      try {
        const tree = await loadTree();
        if (cancelled) return;
        setSockets(tree!.jewelSockets);
        if (tree!.jewelSockets.length > 0 && !socketId) {
          setSocketId(tree!.jewelSockets[0].id);
        }
      } catch {
        // tree will load on simulate click
      }

      // Init WASM
      try {
        const { initRustEngine, isRustEngineReady } = await import(
          "@/engine/rust-bridge"
        );
        await initRustEngine();
        if (cancelled) return;
        setWasmReady(isRustEngineReady());
      } catch {
        // WASM not available
      }
    })();

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When jewel type changes, update conqueror list, seed range, and keystones from WASM
  useEffect(() => {
    const conqs = CONQUERORS[jewelName] || [];
    setConqueror(conqs[0] || "");

    if (wasmReady) {
      import("@/engine/rust-bridge").then((bridge) => {
        const range = bridge.timelessSeedRange(jewelName);
        if (range) {
          setSeedRange(range);
          setSeed(range[0]);
        }
        const ks = bridge.timelessKeystones(jewelName);
        setKeystones(ks);
      }).catch(() => {});
    } else {
      const range = FALLBACK_RANGES[jewelName];
      if (range) {
        setSeedRange(range);
        setSeed(range[0]);
      }
      setKeystones([]);
    }
  }, [jewelName, wasmReady]);

  const selectedKeystone = keystones.find(
    (k) => k.conqueror.toLowerCase() === conqueror.toLowerCase(),
  );

  // Run the simulation
  const simulate = useCallback(async () => {
    setSearching(true);
    setError("");
    setTransformedNodes([]);

    try {
      const tree = await loadTree();
      if (!tree) throw new Error("Could not load tree data");

      const targetSocket = socketId || tree.jewelSockets[0]?.id;
      if (!targetSocket) {
        setError("No jewel socket selected");
        return;
      }

      // Radius: timeless jewels affect ~40 nodes; BFS depth 15 is generous
      const RADIUS_DEPTH = 15;
      const radiusNodeIds = nodesInRadius(tree.adj, targetSocket, RADIUS_DEPTH);
      radiusNodeIds.delete(targetSocket); // socket itself is not transformed

      // Attempt WASM transforms
      let bridge: Awaited<ReturnType<typeof import("@/engine/rust-bridge")>> | null = null;
      if (wasmReady) {
        try {
          bridge = await import("@/engine/rust-bridge");
        } catch {
          // fall through
        }
      }

      const results: TransformedNode[] = [];

      for (const nid of radiusNodeIds) {
        const node = tree.nodes[nid];
        if (!node || !isTransformableNode(node)) continue;

        const nodeType: "small" | "notable" | "keystone" = node.isKeystone
          ? "keystone"
          : node.isNotable
            ? "notable"
            : "small";

        const nodeIdNum = node.skill ?? parseInt(nid, 10);
        if (isNaN(nodeIdNum)) continue;

        let addedStats: string[] = [];
        let replacedKeystone: string | undefined;

        if (bridge) {
          const result = bridge.transformNodeFull(
            jewelName,
            seed,
            nodeIdNum,
            nodeType,
            conqueror,
          );
          if (result) {
            addedStats = result.added_stats;
            replacedKeystone = result.replaced_keystone;
          }
        }

        // Only include nodes where the jewel actually changes something
        if (addedStats.length === 0 && !replacedKeystone) continue;

        results.push({
          nodeId: nid,
          name: node.name || `Node ${nid}`,
          nodeType,
          originalStats: node.stats || [],
          addedStats,
          replacedKeystone,
          isAllocated: allocatedNodes.has(nid),
        });
      }

      // Sort: allocated first, then keystones > notables > small
      const typeOrder = { keystone: 0, notable: 1, small: 2 };
      results.sort((a, b) => {
        if (a.isAllocated !== b.isAllocated) return a.isAllocated ? -1 : 1;
        return typeOrder[a.nodeType] - typeOrder[b.nodeType];
      });

      setTransformedNodes(results);
    } catch (e) {
      console.warn("Timeless search error:", e);
      setError(e instanceof Error ? e.message : "Simulation failed");
    } finally {
      setSearching(false);
    }
  }, [jewelName, conqueror, seed, socketId, wasmReady, allocatedNodes]);

  if (!stats) return null;

  const conquerors = CONQUERORS[jewelName] || [];
  const allocatedCount = transformedNodes.filter((n) => n.isAllocated).length;
  const notableCount = transformedNodes.filter((n) => n.nodeType === "notable").length;
  const keystoneCount = transformedNodes.filter((n) => n.nodeType === "keystone").length;

  return (
    <div className="p-4">
      {/* Header */}
      <h2 className="text-xs font-mono uppercase tracking-widest text-text-dim mb-3">
        Timeless Jewel Simulator
      </h2>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-2 max-w-2xl mb-3">
        {/* Jewel type */}
        <label className="text-[9px] font-mono text-text-dim/60">
          Jewel
          <select
            value={jewelName}
            onChange={(e) => {
              setJewelName(e.target.value);
              setTransformedNodes([]);
            }}
            className="block w-full mt-0.5 bg-bg-inset border border-border-subtle rounded px-1.5 py-1 text-[10px] font-mono text-text-primary"
          >
            {JEWEL_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        {/* Conqueror */}
        <label className="text-[9px] font-mono text-text-dim/60">
          Conqueror
          <select
            value={conqueror}
            onChange={(e) => {
              setConqueror(e.target.value);
              setTransformedNodes([]);
            }}
            className="block w-full mt-0.5 bg-bg-inset border border-border-subtle rounded px-1.5 py-1 text-[10px] font-mono text-text-primary"
          >
            {conquerors.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        {/* Seed */}
        <label className="text-[9px] font-mono text-text-dim/60">
          Seed ({seedRange[0]}-{seedRange[1]})
          <input
            type="number"
            min={seedRange[0]}
            max={seedRange[1]}
            value={seed}
            onChange={(e) => {
              setSeed(parseInt(e.target.value) || seedRange[0]);
              setTransformedNodes([]);
            }}
            className="block w-full mt-0.5 bg-bg-inset border border-border-subtle rounded px-1.5 py-1 text-[10px] font-mono text-text-primary"
          />
        </label>

        {/* Socket */}
        <label className="text-[9px] font-mono text-text-dim/60">
          Jewel Socket
          <select
            value={socketId}
            onChange={(e) => {
              setSocketId(e.target.value);
              setTransformedNodes([]);
            }}
            className="block w-full mt-0.5 bg-bg-inset border border-border-subtle rounded px-1.5 py-1 text-[10px] font-mono text-text-primary"
          >
            {sockets.map((s, i) => (
              <option key={s.id} value={s.id}>
                Socket {i + 1} (#{s.id})
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Simulate button */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={simulate}
          disabled={searching}
          className="text-[10px] font-mono px-4 py-1 rounded bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 disabled:opacity-40"
        >
          {searching ? "Simulating..." : "Simulate"}
        </button>
        {!wasmReady && (
          <span className="text-[9px] font-mono text-amber-400/70">
            WASM engine not loaded; results will be empty
          </span>
        )}
      </div>

      {/* Keystone preview from WASM data */}
      {selectedKeystone && (
        <div className="px-3 py-2 mb-3 bg-accent/5 border border-accent/20 rounded max-w-2xl">
          <div className="text-[10px] font-mono text-accent font-bold mb-0.5">
            Keystone: {selectedKeystone.keystone_name}
          </div>
          <div className="text-[9px] font-mono text-text-dim/70 space-y-0.5">
            {selectedKeystone.stat_lines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-[10px] font-mono text-red-400 mb-3">{error}</p>
      )}

      {/* Results summary */}
      {transformedNodes.length > 0 && (
        <div className="text-[9px] font-mono text-text-dim/60 mb-2">
          {transformedNodes.length} nodes affected
          {allocatedCount > 0 && ` (${allocatedCount} allocated)`}
          {notableCount > 0 && ` / ${notableCount} notables`}
          {keystoneCount > 0 && ` / ${keystoneCount} keystones`}
        </div>
      )}

      {/* Transformed nodes */}
      {transformedNodes.length > 0 && (
        <div className="space-y-1.5 max-w-2xl max-h-[60vh] overflow-y-auto">
          {transformedNodes.map((tn) => (
            <div
              key={tn.nodeId}
              className={`px-3 py-2 rounded text-[10px] font-mono border ${
                tn.isAllocated
                  ? "bg-accent/8 border-accent/25"
                  : "bg-bg-card border-border-card"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className={`text-[8px] uppercase px-1 py-px rounded ${
                    tn.nodeType === "keystone"
                      ? "bg-purple-400/15 text-purple-400"
                      : tn.nodeType === "notable"
                        ? "bg-amber-400/15 text-amber-400"
                        : "bg-text-dim/10 text-text-dim/60"
                  }`}
                >
                  {tn.nodeType}
                </span>
                <span className="text-text-primary font-bold">{tn.name}</span>
                {tn.isAllocated && (
                  <span className="text-[8px] text-accent/60">allocated</span>
                )}
              </div>

              {/* Keystone replacement */}
              {tn.replacedKeystone && (
                <div className="text-purple-300 text-[9px] mb-0.5">
                  Replaced by: {tn.replacedKeystone}
                </div>
              )}

              {/* Added/replacement stats */}
              {tn.addedStats.length > 0 && (
                <div className="space-y-0.5">
                  {tn.addedStats.map((stat, i) => (
                    <div key={i} className="text-green-400/80 text-[9px]">
                      + {stat}
                    </div>
                  ))}
                </div>
              )}

              {/* Original stats (collapsed for small passives) */}
              {tn.originalStats.length > 0 && tn.nodeType !== "small" && (
                <div className="mt-1 pt-1 border-t border-border-subtle/30">
                  <div className="text-text-dim/40 text-[8px] space-y-0.5">
                    {tn.originalStats.map((stat, i) => (
                      <div key={i}>{stat}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {transformedNodes.length === 0 && !searching && !error && (
        <p className="text-xs font-mono text-text-dim/60 text-center py-6">
          Select a jewel type, conqueror, and seed, then click Simulate to
          preview how every passive node in the jewel radius gets transformed.
        </p>
      )}
    </div>
  );
}
