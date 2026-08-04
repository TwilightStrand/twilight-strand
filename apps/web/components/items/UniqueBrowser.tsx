"use client";

import { useState, useMemo, useEffect } from "react";
import type { UniqueItemData } from "@/data/unique-data.generated";

const SLOT_FILTERS = [
  "All",
  "Helmet",
  "Body Armour",
  "Gloves",
  "Boots",
  "Weapon",
  "Shield",
  "Amulet",
  "Ring",
  "Belt",
  "Flask",
  "Jewel",
  "Quiver",
];

interface UniqueBrowserProps {
  onEquip: (item: UniqueItemData) => void;
  onClose: () => void;
  defaultSlot?: string;
}

export function UniqueBrowser({ onEquip, onClose, defaultSlot }: UniqueBrowserProps) {
  const [search, setSearch] = useState("");
  const [slotFilter, setSlotFilter] = useState(defaultSlot || "All");
  const [uniques, setUniques] = useState<UniqueItemData[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    import("@/data/unique-data.generated").then((mod) => {
      setUniques(mod.UNIQUE_ITEMS);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const filtered = useMemo(() => {
    if (!uniques.length) return [];
    return uniques.filter((item) => {
      if (slotFilter !== "All") {
        const slot = (item.slot || "").toLowerCase();
        const filter = slotFilter.toLowerCase();
        if (!slot.includes(filter)) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = `${item.name} ${item.base} ${item.mods.join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    }).slice(0, 50);
  }, [uniques, search, slotFilter]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-mono font-bold text-text-heading">
          Unique Items
          {loaded && <span className="text-text-dim font-normal ml-1">({uniques.length})</span>}
        </h3>
        <button
          onClick={onClose}
          className="text-text-dim hover:text-text-primary text-xs font-mono"
        >
          Close
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, base, or mod..."
        autoFocus
        className="w-full bg-bg-inset border border-border-subtle rounded px-2.5 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-dim/40 focus:outline-none focus:border-accent mb-2"
      />

      <div className="flex gap-1 mb-3 flex-wrap">
        {SLOT_FILTERS.map((slot) => (
          <button
            key={slot}
            onClick={() => setSlotFilter(slot)}
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-colors ${
              slotFilter === slot
                ? "bg-accent/20 text-accent"
                : "text-text-dim hover:text-text-primary"
            }`}
          >
            {slot}
          </button>
        ))}
      </div>

      {!loaded ? (
        <div className="text-center py-6 text-text-dim font-mono text-xs animate-pulse">
          Loading unique items...
        </div>
      ) : (
        <div className="space-y-0.5 max-h-72 overflow-y-auto">
          {filtered.map((item, i) => (
            <button
              key={`${item.name}-${i}`}
              onClick={() => onEquip(item)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left rounded hover:bg-bg-hover transition-colors group"
            >
              <div
                className="w-0.5 h-5 rounded-full shrink-0"
                style={{ backgroundColor: "#af6025" }}
              />
              <div className="flex-1 min-w-0">
                <span
                  className="text-xs font-mono truncate block"
                  style={{ color: "#af6025" }}
                >
                  {item.name}
                </span>
                <span className="text-[9px] font-mono text-text-dim/60 truncate block">
                  {item.base}
                </span>
              </div>
              <span className="text-[8px] font-mono text-text-dim/30 shrink-0 group-hover:text-accent transition-colors">
                {item.slot || "?"}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs font-mono text-text-dim/60 text-center py-4">
              No uniques match &ldquo;{search}&rdquo;
            </p>
          )}
          {filtered.length === 50 && (
            <p className="text-[9px] font-mono text-text-dim/40 text-center py-1">
              Showing first 50. Narrow your search for more.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
