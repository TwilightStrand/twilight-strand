"use client";

import { useState } from "react";
import { useBuildStore } from "@/stores/build-store";
import type { ItemData } from "@/engine/types";

const EQUIPMENT_SLOTS = [
  "Weapon 1",
  "Weapon 1 Swap",
  "Helmet",
  "Body Armour",
  "Gloves",
  "Boots",
  "Amulet",
  "Ring 1",
  "Ring 2",
  "Belt",
];

const FLASK_SLOTS = ["Flask 1", "Flask 2", "Flask 3", "Flask 4", "Flask 5"];

const ALL_SLOTS = [...EQUIPMENT_SLOTS, ...FLASK_SLOTS];

const RARITY_COLORS: Record<string, string> = {
  Normal: "#9ca3af",
  Magic: "#7d95ff",
  Rare: "#ffd700",
  Unique: "#af6025",
};

function rarityColor(rarity: string): string {
  return RARITY_COLORS[rarity] ?? RARITY_COLORS.Normal;
}

function SlotRow({
  slot,
  item,
  selected,
  onClick,
}: {
  slot: string;
  item: ItemData | undefined;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs font-mono rounded transition-colors
        ${selected ? "bg-bg-hover text-text-bright" : "text-text-dim hover:bg-bg-hover/50 hover:text-text-primary"}
      `}
    >
      <span className="w-24 shrink-0 text-text-dim truncate">{slot}</span>
      {item ? (
        <span className="truncate" style={{ color: rarityColor(item.rarity) }}>
          {item.name || item.base}
        </span>
      ) : (
        <span className="text-text-dim/40 italic">Empty</span>
      )}
    </button>
  );
}

function ItemDetail({ item }: { item: ItemData }) {
  const color = rarityColor(item.rarity);

  return (
    <div className="p-4">
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              color,
              backgroundColor: `${color}18`,
              border: `1px solid ${color}30`,
            }}
          >
            {item.rarity}
          </span>
        </div>
        {item.name && (
          <h3 className="font-mono text-sm font-bold" style={{ color }}>
            {item.name}
          </h3>
        )}
        {item.base && item.base !== item.name && (
          <p className="text-xs font-mono text-text-dim">{item.base}</p>
        )}
      </div>

      {item.quality > 0 && (
        <div className="text-xs font-mono text-text-dim mb-2">
          Quality: <span className="text-accent">{item.quality}%</span>
        </div>
      )}

      {item.sockets && (
        <div className="text-xs font-mono text-text-dim mb-2">
          Sockets: {item.sockets}
        </div>
      )}

      {item.mods.length > 0 && (
        <div className="border-t border-border-subtle pt-2 mt-2 space-y-0.5">
          {item.mods.map((mod, i) => (
            <div key={i} className="text-xs font-mono text-accent-dim">
              {mod}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ItemsTab() {
  const items = useBuildStore((s) => s.items);
  const [selectedSlot, setSelectedSlot] = useState<string>(EQUIPMENT_SLOTS[0]);

  const itemsBySlot = new Map<string, ItemData>();
  for (const item of items) {
    if (item.slot) itemsBySlot.set(item.slot, item);
  }

  const selectedItem = itemsBySlot.get(selectedSlot);

  return (
    <div className="flex h-full">
      <div className="w-64 min-w-56 border-r border-border-subtle overflow-y-auto p-2">
        <div className="mb-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-dim px-3">
            Equipment
          </span>
        </div>
        {EQUIPMENT_SLOTS.map((slot) => (
          <SlotRow
            key={slot}
            slot={slot}
            item={itemsBySlot.get(slot)}
            selected={selectedSlot === slot}
            onClick={() => setSelectedSlot(slot)}
          />
        ))}

        <div className="mt-3 mb-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-dim px-3">
            Flasks
          </span>
        </div>
        {FLASK_SLOTS.map((slot) => (
          <SlotRow
            key={slot}
            slot={slot}
            item={itemsBySlot.get(slot)}
            selected={selectedSlot === slot}
            onClick={() => setSelectedSlot(slot)}
          />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {selectedItem ? (
          <ItemDetail item={selectedItem} />
        ) : (
          <div className="flex items-center justify-center h-full text-text-dim font-mono text-sm">
            {items.length === 0
              ? "No items yet. Import a build to see equipment."
              : `No item in ${selectedSlot}`}
          </div>
        )}
      </div>
    </div>
  );
}
