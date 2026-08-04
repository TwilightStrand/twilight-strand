"use client";

import { useState, useMemo, useEffect } from "react";
import { GEM_DATA, type GemData as GeneratedGem } from "@/data/gem-data.generated";

const TAG_COLORS: Record<string, string> = {
  spell: "#44c", attack: "#c44", minion: "#8c4",
  projectile: "#4c4", melee: "#c84", aura: "#cc4",
  curse: "#a4c", trap: "#ca4", mine: "#4ca",
};

function displayName(id: string): string {
  return id
    .replace(/([A-Z])/g, " $1")
    .replace(/^Support /, "")
    .replace(/^ /, "")
    .trim();
}

function isSupport(id: string): boolean {
  return id.startsWith("Support") || id.includes("Support");
}

function gemTags(gem: GeneratedGem): string[] {
  const tags: string[] = [];
  if (gem.tags) tags.push(...gem.tags.split(",").map(t => t.trim()).filter(Boolean));
  if (gem.isSpell) tags.push("spell");
  if (gem.damageType) tags.push(gem.damageType);
  if (isSupport(gem.name)) tags.push("support");
  return tags;
}

const TAG_FILTERS = ["All", "Spell", "Attack", "Cold", "Fire", "Lightning", "Chaos", "Physical", "Minion", "Projectile", "Melee", "Aura"];

interface GemBrowserProps {
  onSelect: (gem: { name: string; skillId: string; isSupport: boolean }) => void;
  onClose: () => void;
  supportOnly?: boolean;
}

export function GemBrowser({ onSelect, onClose, supportOnly }: GemBrowserProps) {
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("All");

  const allGems = useMemo(() => {
    return Object.entries(GEM_DATA).map(([id, gem]) => ({
      id,
      displayName: displayName(id),
      isSupport: isSupport(id),
      tags: gemTags(gem),
      gem,
    }));
  }, []);

  const filtered = useMemo(() => {
    return allGems.filter(g => {
      if (supportOnly === true && !g.isSupport) return false;
      if (supportOnly === false && g.isSupport) return false;

      if (tagFilter !== "All") {
        const lower = tagFilter.toLowerCase();
        if (!g.tags.some(t => t.toLowerCase().includes(lower))) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        if (!g.displayName.toLowerCase().includes(q) && !g.id.toLowerCase().includes(q)) return false;
      }

      return true;
    }).slice(0, 60);
  }, [allGems, search, tagFilter, supportOnly]);

  const total = allGems.filter(g => {
    if (supportOnly === true && !g.isSupport) return false;
    if (supportOnly === false && g.isSupport) return false;
    return true;
  }).length;

  return (
    <div className="p-3 bg-bg-card border border-border-card rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-mono font-bold text-text-heading">
          {supportOnly ? "Support Gems" : supportOnly === false ? "Active Skills" : "All Gems"}{" "}
          <span className="text-text-dim font-normal">({total})</span>
        </h3>
        <button onClick={onClose} className="text-text-dim hover:text-text-primary text-xs font-mono">
          Close
        </button>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search gems..."
        className="w-full bg-bg-inset border border-border-subtle rounded px-2 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-dim/40 focus:outline-none focus:border-accent mb-2"
        autoFocus
      />

      <div className="flex gap-1 mb-2 flex-wrap">
        {TAG_FILTERS.map(tag => (
          <button
            key={tag}
            onClick={() => setTagFilter(tag)}
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-colors ${
              tagFilter === tag ? "bg-accent/20 text-accent" : "text-text-dim hover:text-text-primary"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="space-y-0.5 max-h-52 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-[10px] font-mono text-text-dim/50 text-center py-3">No gems match your search</p>
        )}
        {filtered.map(g => (
          <button
            key={g.id}
            onClick={() =>
              onSelect({
                name: g.displayName,
                skillId: g.id,
                isSupport: g.isSupport,
              })
            }
            className="w-full flex items-center gap-2 px-2 py-1.5 text-left rounded hover:bg-bg-hover/70 transition-colors text-xs font-mono group"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${g.isSupport ? "bg-text-dim/40" : "bg-accent"}`}
            />
            <span className="text-text-primary truncate flex-1 group-hover:text-accent transition-colors">
              {g.displayName}
            </span>
            {g.gem.damageType && (
              <span
                className="text-[8px] px-1 py-0.5 rounded shrink-0"
                style={{
                  color: TAG_COLORS[g.gem.damageType] || "#888",
                  backgroundColor: `${TAG_COLORS[g.gem.damageType] || "#888"}15`,
                }}
              >
                {g.gem.damageType}
              </span>
            )}
            {g.gem.critChance > 0 && (
              <span className="text-[8px] text-text-dim/40 tabular-nums shrink-0">
                {g.gem.critChance}% crit
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
