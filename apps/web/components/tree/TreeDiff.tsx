
import { useState, useMemo } from "react";
import { useTreeStore } from "@/stores/tree-store";
import { useBuildStore } from "@/stores/build-store";

interface NodeChange {
  id: string;
  name: string;
  type: "added" | "removed" | "changed" | "unchanged";
  oldStats?: string[];
  newStats?: string[];
  statDiffs?: string[];
}

const TREE_VERSIONS = [
  "3_29",
  "3_28",
  "3_27",
  "3_26",
  "3_25",
  "3_24",
  "3_23",
];

async function loadTreeNodes(
  version: string
): Promise<Map<string, { name: string; stats: string[] }>> {
  const resp = await fetch(`/data/pob/TreeData/${version}/tree.json`);
  if (!resp.ok) throw new Error(`Tree ${version} not found`);
  const data = await resp.json();
  const nodes = new Map<string, { name: string; stats: string[] }>();

  for (const [id, node] of Object.entries(
    data.nodes as Record<string, Record<string, unknown>>
  )) {
    if (id === "root") continue;
    nodes.set(id, {
      name: (node.name ?? node.dn ?? id) as string,
      stats: (node.stats ?? []) as string[],
    });
  }
  return nodes;
}

function diffStats(oldStats: string[], newStats: string[]): string[] {
  const diffs: string[] = [];
  const oldSet = new Set(oldStats);
  const newSet = new Set(newStats);

  for (const s of newStats) {
    if (!oldSet.has(s)) diffs.push(`+ ${s}`);
  }
  for (const s of oldStats) {
    if (!newSet.has(s)) diffs.push(`- ${s}`);
  }
  return diffs;
}

export function TreeDiff() {
  const stats = useBuildStore((s) => s.stats);
  const allocatedNodes = useTreeStore((s) => s.allocatedNodes);
  const [fromVersion, setFromVersion] = useState("3_28");
  const [toVersion, setToVersion] = useState("3_29");
  const [changes, setChanges] = useState<NodeChange[]>([]);
  const [loading, setLoading] = useState(false);
  const [computed, setComputed] = useState(false);

  const compare = async () => {
    setLoading(true);
    try {
      const [oldTree, newTree] = await Promise.all([
        loadTreeNodes(fromVersion),
        loadTreeNodes(toVersion),
      ]);

      const result: NodeChange[] = [];

      for (const nodeId of allocatedNodes) {
        const oldNode = oldTree.get(nodeId);
        const newNode = newTree.get(nodeId);

        if (!oldNode && newNode) {
          result.push({
            id: nodeId,
            name: newNode.name,
            type: "added",
            newStats: newNode.stats,
          });
        } else if (oldNode && !newNode) {
          result.push({
            id: nodeId,
            name: oldNode.name,
            type: "removed",
            oldStats: oldNode.stats,
          });
        } else if (oldNode && newNode) {
          const diffs = diffStats(oldNode.stats, newNode.stats);
          if (diffs.length > 0) {
            result.push({
              id: nodeId,
              name: newNode.name,
              type: "changed",
              oldStats: oldNode.stats,
              newStats: newNode.stats,
              statDiffs: diffs,
            });
          }
        }
      }

      result.sort((a, b) => {
        const order = { removed: 0, changed: 1, added: 2, unchanged: 3 };
        return order[a.type] - order[b.type];
      });

      setChanges(result);
      setComputed(true);
    } catch (e) {
      console.warn("Tree diff error:", e);
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const added = changes.filter((c) => c.type === "added").length;
    const removed = changes.filter((c) => c.type === "removed").length;
    const changed = changes.filter((c) => c.type === "changed").length;
    return { added, removed, changed, total: changes.length };
  }, [changes]);

  if (!stats) return null;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-mono uppercase tracking-widest text-text-dim">
          Tree Version Diff
        </h2>
        <div className="flex items-center gap-1.5">
          <select
            value={fromVersion}
            onChange={(e) => {
              setFromVersion(e.target.value);
              setComputed(false);
            }}
            className="bg-bg-inset border border-border-subtle rounded px-1.5 py-0.5 text-[10px] font-mono text-text-primary"
          >
            {TREE_VERSIONS.map((v) => (
              <option key={v} value={v}>
                {v.replace("_", ".")}
              </option>
            ))}
          </select>
          <span className="text-text-dim/40 text-[10px]">&rarr;</span>
          <select
            value={toVersion}
            onChange={(e) => {
              setToVersion(e.target.value);
              setComputed(false);
            }}
            className="bg-bg-inset border border-border-subtle rounded px-1.5 py-0.5 text-[10px] font-mono text-text-primary"
          >
            {TREE_VERSIONS.map((v) => (
              <option key={v} value={v}>
                {v.replace("_", ".")}
              </option>
            ))}
          </select>
          <button
            onClick={compare}
            disabled={loading || fromVersion === toVersion}
            className="text-[10px] font-mono px-3 py-0.5 rounded bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 disabled:opacity-40"
          >
            {loading ? "..." : "Compare"}
          </button>
        </div>
      </div>

      {computed && (
        <>
          <div className="flex gap-3 mb-3 text-[10px] font-mono">
            {summary.removed > 0 && (
              <span className="text-red-400">
                {summary.removed} removed
              </span>
            )}
            {summary.changed > 0 && (
              <span className="text-amber-400">
                {summary.changed} changed
              </span>
            )}
            {summary.added > 0 && (
              <span className="text-green-400">
                {summary.added} added
              </span>
            )}
            {summary.total === 0 && (
              <span className="text-text-dim/60">
                No changes to your allocated nodes between {fromVersion.replace("_", ".")} and{" "}
                {toVersion.replace("_", ".")}
              </span>
            )}
          </div>

          {changes.length > 0 && (
            <div className="space-y-2 max-w-2xl">
              {changes.map((c) => (
                <div
                  key={c.id}
                  className={`text-[10px] font-mono p-2 rounded border ${
                    c.type === "removed"
                      ? "border-red-400/20 bg-red-400/5"
                      : c.type === "changed"
                        ? "border-amber-400/20 bg-amber-400/5"
                        : "border-green-400/20 bg-green-400/5"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[9px] px-1 py-0.5 rounded ${
                        c.type === "removed"
                          ? "bg-red-400/20 text-red-400"
                          : c.type === "changed"
                            ? "bg-amber-400/20 text-amber-400"
                            : "bg-green-400/20 text-green-400"
                      }`}
                    >
                      {c.type}
                    </span>
                    <span className="text-text-primary font-bold">
                      {c.name}
                    </span>
                  </div>

                  {c.statDiffs && (
                    <div className="space-y-0.5 ml-2">
                      {c.statDiffs.map((d, i) => (
                        <div
                          key={i}
                          className={
                            d.startsWith("+")
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {d}
                        </div>
                      ))}
                    </div>
                  )}

                  {c.type === "removed" && c.oldStats && (
                    <div className="space-y-0.5 ml-2 text-red-400/60">
                      {c.oldStats.map((s, i) => (
                        <div key={i}>- {s}</div>
                      ))}
                    </div>
                  )}

                  {c.type === "added" && c.newStats && (
                    <div className="space-y-0.5 ml-2 text-green-400/60">
                      {c.newStats.map((s, i) => (
                        <div key={i}>+ {s}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!computed && !loading && (
        <p className="text-xs font-mono text-text-dim/60 text-center py-6">
          Compare your allocated nodes between tree versions.
          Finds nodes that were added, removed, or had their stats changed.
        </p>
      )}
    </div>
  );
}
