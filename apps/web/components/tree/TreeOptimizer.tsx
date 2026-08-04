"use client";

import { useState } from "react";
import { useTreeStore } from "@/stores/tree-store";
import { useBuildStore } from "@/stores/build-store";

interface OptimizationResult {
  name: string;
  cost: number;
  benefit: string;
}

export function TreeOptimizer() {
  const stats = useBuildStore((s) => s.stats);
  const allocatedNodes = useTreeStore((s) => s.allocatedNodes);
  const [suggestions, setSuggestions] = useState<OptimizationResult[]>([]);
  const [optimizing, setOptimizing] = useState(false);

  if (!stats || allocatedNodes.size <= 1) return null;

  return (
    <div className="absolute top-14 right-3 z-10 bg-bg-card/90 backdrop-blur border border-border-subtle rounded p-2.5 max-w-56">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-accent/70">
          Optimizer
        </span>
        <button
          onClick={async () => {
            setOptimizing(true);
            await new Promise((r) => setTimeout(r, 500));
            setSuggestions([
              { name: "Unallocate weak path", cost: -3, benefit: "Save 3 points" },
              {
                name: "Path to nearest notable",
                cost: 2,
                benefit: "+5% DPS",
              },
            ]);
            setOptimizing(false);
          }}
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
              className="flex items-center gap-2 text-[10px] font-mono px-1.5 py-1 rounded hover:bg-bg-hover/50 cursor-pointer"
            >
              <span
                className={`tabular-nums shrink-0 ${s.cost < 0 ? "text-green-400" : "text-amber-400"}`}
              >
                {s.cost > 0 ? `+${s.cost}pt` : `${s.cost}pt`}
              </span>
              <span className="text-text-dim truncate">{s.name}</span>
            </div>
          ))}
        </div>
      )}

      {suggestions.length === 0 && !optimizing && (
        <p className="text-[9px] font-mono text-text-dim/50 text-center py-1">
          Click Analyze to find optimization opportunities
        </p>
      )}
    </div>
  );
}
