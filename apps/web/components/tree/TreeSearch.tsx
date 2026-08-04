"use client";

import { useState, useEffect, useRef } from "react";
import { useTreeStore } from "@/stores/tree-store";
import type { TreeData } from "./tree-data";

export function TreeSearch({
  treeData,
  onNavigateToNode,
}: {
  treeData: TreeData | null;
  onNavigateToNode?: (nodeId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchResults = useTreeStore((s) => s.searchResults);

  useEffect(() => {
    if (!query.trim() || !treeData) {
      useTreeStore.getState().setSearchResults(new Set());
      setShowResults(false);
      return;
    }

    const q = query.toLowerCase();
    const matches = new Set<string>();

    for (const [id, node] of treeData.nodes) {
      const name = (node.name || "").toLowerCase();
      const stats = (node.stats || []).join(" ").toLowerCase();
      if (name.includes(q) || stats.includes(q)) {
        matches.add(id);
      }
    }

    useTreeStore.getState().setSearchResults(matches);
    setShowResults(matches.size > 0);
  }, [query, treeData]);

  return (
    <div className="absolute top-3 left-3 z-10">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim() && searchResults.size > 0 && setShowResults(true)}
        placeholder="Search nodes..."
        className="w-48 bg-bg-card/90 backdrop-blur border border-border-card rounded px-2.5 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-dim/40 focus:outline-none focus:border-accent"
      />
      {query.trim() && (
        <div className="mt-1 text-[10px] font-mono text-text-dim bg-bg-card/80 backdrop-blur rounded px-2 py-0.5 inline-block">
          {searchResults.size} match{searchResults.size !== 1 ? "es" : ""}
        </div>
      )}
      {showResults && treeData && (
        <div className="mt-1 w-56 bg-bg-card/95 backdrop-blur border border-border-card rounded max-h-48 overflow-y-auto shadow-xl">
          {Array.from(searchResults)
            .slice(0, 10)
            .map((id) => {
              const node = treeData.nodes.get(id);
              if (!node || !node.name) return null;
              return (
                <button
                  key={id}
                  onClick={() => {
                    onNavigateToNode?.(id);
                    setShowResults(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs font-mono hover:bg-bg-hover transition-colors border-b border-border-subtle last:border-0"
                >
                  <span className="text-text-primary">{node.name}</span>
                  {node.isKeystone && (
                    <span className="text-[9px] text-amber-400 ml-1">
                      Keystone
                    </span>
                  )}
                  {node.isNotable && !node.isKeystone && (
                    <span className="text-[9px] text-accent ml-1">
                      Notable
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}
