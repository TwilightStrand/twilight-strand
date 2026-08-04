"use client";

import { useTreeStore } from "@/stores/tree-store";

export function TreeSpecBar() {
  const specs = useTreeStore((s) => s.specs);
  const activeIndex = useTreeStore((s) => s.activeSpecIndex);
  const switchSpec = useTreeStore((s) => s.switchSpec);
  const addSpec = useTreeStore((s) => s.addSpec);
  const removeSpec = useTreeStore((s) => s.removeSpec);
  const allocatedNodes = useTreeStore((s) => s.allocatedNodes);

  if (specs.length <= 1 && allocatedNodes.size === 0) return null;

  return (
    <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
      {specs.map((spec, i) => (
        <div key={i} className="flex items-center">
          <button
            onClick={() => switchSpec(i)}
            className={`text-[10px] font-mono px-2 py-1 rounded-l transition-colors ${
              i === activeIndex
                ? "bg-accent/20 text-accent border border-accent/30"
                : "bg-bg-card/80 text-text-dim hover:text-text-primary border border-border-subtle"
            }`}
          >
            {spec.name}
          </button>
          {specs.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); removeSpec(i); }}
              className="text-[9px] font-mono px-1 py-1 rounded-r bg-bg-card/80 text-text-dim hover:text-blood border border-l-0 border-border-subtle transition-colors"
            >
              x
            </button>
          )}
        </div>
      ))}
      <button
        onClick={() => addSpec()}
        className="text-[10px] font-mono px-1.5 py-1 rounded bg-bg-card/80 text-text-dim hover:text-accent border border-border-subtle transition-colors"
        title="Add spec"
      >
        +
      </button>
    </div>
  );
}
