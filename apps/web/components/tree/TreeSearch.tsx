"use client";

import { useState, useEffect, useRef } from "react";
import { useTreeStore } from "@/stores/tree-store";
import type { TreeData } from "./tree-data";

export function TreeSearch({ treeData }: { treeData: TreeData | null }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const searchResults = useTreeStore((s) => s.searchResults);

  useEffect(() => {
    if (!query.trim() || !treeData) {
      useTreeStore.getState().setSearchResults(new Set());
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
  }, [query, treeData]);

  return (
    <div className="absolute top-3 left-3 z-10">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search nodes..."
        className="w-48 bg-bg-card/90 backdrop-blur border border-border-card rounded px-2.5 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-dim/40 focus:outline-none focus:border-accent"
      />
      {query.trim() && (
        <div className="mt-1 text-[10px] font-mono text-text-dim bg-bg-card/80 backdrop-blur rounded px-2 py-0.5 inline-block">
          {searchResults.size} match{searchResults.size !== 1 ? "es" : ""}
        </div>
      )}
    </div>
  );
}
