
import { parseClusterJewel, type ClusterJewelNode } from "@/engine/cluster-jewel";
import type { ItemData } from "@/engine/types";

function ClusterNode({ node }: { node: ClusterJewelNode }) {
  const colors = {
    small: "border-border-subtle bg-bg-inset text-text-dim",
    notable: "border-accent/40 bg-accent/10 text-accent",
    socket: "border-purple-400/40 bg-purple-400/10 text-purple-400",
  };

  return (
    <div
      className={`px-2 py-1 rounded border text-[10px] font-mono ${colors[node.type]}`}
      title={node.stats.join(", ")}
    >
      {node.type === "socket" ? "[ ]" : node.name}
      {node.stats.length > 0 && node.type === "small" && (
        <div className="text-[8px] text-text-dim/60 mt-0.5">{node.stats[0]}</div>
      )}
    </div>
  );
}

export function ClusterDisplay({ item }: { item: ItemData }) {
  const cluster = parseClusterJewel(item.mods);
  if (!cluster) return null;

  return (
    <div className="mt-3 pt-2 border-t border-border-subtle">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-purple-400/70">
          Cluster Jewel
        </span>
        <span className="text-[9px] font-mono text-text-dim">
          {cluster.passiveCount} passives
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {cluster.nodes.map((node) => (
          <ClusterNode key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
}
