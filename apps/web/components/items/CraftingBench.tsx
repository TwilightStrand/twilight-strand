"use client";

import { useState } from "react";
import type { ItemData } from "@/engine/types";

const CRAFT_OPTIONS = [
  { category: "Prefix", mods: [
    "+# to maximum Life (60-80)",
    "+# to maximum Energy Shield (80-100)",
    "+# to maximum Mana (60-75)",
    "+# to Strength (25-30)",
    "+# to Dexterity (25-30)",
    "+# to Intelligence (25-30)",
    "+# to Armour (300-400)",
    "+# to Evasion Rating (300-400)",
    "Adds # to # Physical Damage (10-15 to 20-25)",
    "Adds # to # Fire Damage (20-30 to 35-50)",
    "Adds # to # Cold Damage (20-30 to 35-50)",
    "Adds # to # Lightning Damage (5-10 to 50-70)",
  ]},
  { category: "Suffix", mods: [
    "+#% to Fire Resistance (26-35)",
    "+#% to Cold Resistance (26-35)",
    "+#% to Lightning Resistance (26-35)",
    "+#% to Chaos Resistance (16-20)",
    "#% increased Attack Speed (8-12)",
    "#% increased Cast Speed (8-12)",
    "+#% to Critical Strike Multiplier (16-20)",
    "#% increased Critical Strike Chance (20-25)",
    "#% increased Damage (25-30)",
    "+# to Accuracy Rating (200-300)",
    "#% increased Movement Speed (20-25)",
  ]},
  { category: "Bench", mods: [
    "+#% to Quality (up to 30)",
    "Can have up to 3 Crafted Modifiers",
    "Cannot roll Attack Modifiers",
    "Cannot roll Caster Modifiers",
    "Prefixes cannot be Changed",
    "Suffixes cannot be Changed",
    "+# to Level of Socketed Gems (1-2)",
    "Trigger a Socketed Spell when you Use a Skill",
  ]},
];

interface CraftingBenchProps {
  item: ItemData;
  onCraft: (mod: string) => void;
  onClose: () => void;
}

export function CraftingBench({ item, onCraft, onClose }: CraftingBenchProps) {
  const [selectedCategory, setSelectedCategory] = useState(CRAFT_OPTIONS[0].category);
  const [search, setSearch] = useState("");

  const currentOptions = CRAFT_OPTIONS.find(c => c.category === selectedCategory);
  const filtered = currentOptions?.mods.filter(m =>
    !search.trim() || m.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-mono font-bold text-text-heading">Crafting Bench</h3>
        <button onClick={onClose} className="text-text-dim hover:text-text-primary text-xs">Close</button>
      </div>

      <div className="text-[10px] font-mono text-text-dim mb-2">
        Crafting: <span className="text-text-primary">{item.name || item.base}</span>
      </div>

      <div className="flex gap-1 mb-2">
        {CRAFT_OPTIONS.map(cat => (
          <button
            key={cat.category}
            onClick={() => setSelectedCategory(cat.category)}
            className={`text-[10px] font-mono px-2 py-0.5 rounded ${
              selectedCategory === cat.category ? "bg-accent/20 text-accent" : "text-text-dim hover:text-text-primary"
            }`}
          >
            {cat.category}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Filter crafts..."
        className="w-full bg-bg-inset border border-border-subtle rounded px-2 py-1 text-[10px] font-mono text-text-primary placeholder:text-text-dim/40 focus:outline-none focus:border-accent mb-2"
      />

      <div className="space-y-0.5 max-h-48 overflow-y-auto">
        {filtered.map((mod, i) => (
          <button
            key={i}
            onClick={() => {
              const concrete = mod.replace(/#/g, () => String(Math.floor(Math.random() * 50 + 20)));
              onCraft(`{crafted}${concrete}`);
            }}
            className="w-full text-left px-2 py-1.5 text-[10px] font-mono text-accent-dim hover:bg-bg-hover rounded transition-colors"
          >
            {mod}
          </button>
        ))}
      </div>

      <p className="text-[8px] font-mono text-text-dim/40 mt-2">
        Click a craft to add it to the item. Values are randomized within range.
      </p>
    </div>
  );
}
