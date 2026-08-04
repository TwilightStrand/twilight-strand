"use client";

import { useState } from "react";
import type { ItemData } from "@/engine/types";

const RARITIES = ["Normal", "Magic", "Rare", "Unique"];

const SLOT_OPTIONS = [
  "Weapon 1", "Weapon 2", "Weapon 1 Swap", "Weapon 2 Swap",
  "Helmet", "Body Armour", "Gloves", "Boots",
  "Amulet", "Ring 1", "Ring 2", "Belt",
  "Flask 1", "Flask 2", "Flask 3", "Flask 4", "Flask 5",
];

interface ItemEditorProps {
  item?: ItemData;
  defaultSlot?: string;
  onSave: (item: ItemData) => void;
  onCancel: () => void;
}

export function ItemEditor({ item, defaultSlot, onSave, onCancel }: ItemEditorProps) {
  const [name, setName] = useState(item?.name || "");
  const [base, setBase] = useState(item?.base || "");
  const [rarity, setRarity] = useState(item?.rarity || "Rare");
  const [slot, setSlot] = useState(item?.slot || defaultSlot || "");
  const [quality, setQuality] = useState(item?.quality || 0);
  const [sockets, setSockets] = useState(item?.sockets || "");
  const [modsText, setModsText] = useState(item?.mods.join("\n") || "");

  const handleSave = () => {
    onSave({
      name: name || base,
      base,
      rarity,
      slot,
      quality,
      sockets,
      mods: modsText.split("\n").map(l => l.trim()).filter(Boolean),
    });
  };

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-sm font-mono font-bold text-text-heading">
        {item ? "Edit Item" : "Create Item"}
      </h3>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-mono text-text-dim block mb-0.5">Slot</label>
          <select
            value={slot}
            onChange={e => setSlot(e.target.value)}
            className="w-full bg-bg-inset border border-border-subtle rounded px-2 py-1 text-xs font-mono text-text-primary"
          >
            <option value="">Select slot...</option>
            {SLOT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-mono text-text-dim block mb-0.5">Rarity</label>
          <select
            value={rarity}
            onChange={e => setRarity(e.target.value)}
            className="w-full bg-bg-inset border border-border-subtle rounded px-2 py-1 text-xs font-mono text-text-primary"
          >
            {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-mono text-text-dim block mb-0.5">Item Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g., Kaom's Heart"
          className="w-full bg-bg-inset border border-border-subtle rounded px-2 py-1 text-xs font-mono text-text-primary placeholder:text-text-dim/40 focus:outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="text-[10px] font-mono text-text-dim block mb-0.5">Base Type</label>
        <input
          value={base}
          onChange={e => setBase(e.target.value)}
          placeholder="e.g., Glorious Plate"
          className="w-full bg-bg-inset border border-border-subtle rounded px-2 py-1 text-xs font-mono text-text-primary placeholder:text-text-dim/40 focus:outline-none focus:border-accent"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-mono text-text-dim block mb-0.5">Quality</label>
          <input
            type="number"
            value={quality}
            onChange={e => setQuality(parseInt(e.target.value) || 0)}
            min={0}
            max={30}
            className="w-full bg-bg-inset border border-border-subtle rounded px-2 py-1 text-xs font-mono text-text-primary"
          />
        </div>
        <div>
          <label className="text-[10px] font-mono text-text-dim block mb-0.5">Sockets</label>
          <input
            value={sockets}
            onChange={e => setSockets(e.target.value)}
            placeholder="R-G-B-B R-R"
            className="w-full bg-bg-inset border border-border-subtle rounded px-2 py-1 text-xs font-mono text-text-primary placeholder:text-text-dim/40"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-mono text-text-dim block mb-0.5">
          Modifiers (one per line)
        </label>
        <textarea
          value={modsText}
          onChange={e => setModsText(e.target.value)}
          placeholder={"+100 to maximum Life\n+40% to Fire Resistance\n25% increased Attack Speed"}
          rows={6}
          className="w-full bg-bg-inset border border-border-subtle rounded px-2 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-dim/40 resize-none focus:outline-none focus:border-accent"
        />
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-xs font-mono text-text-dim hover:text-text-primary border border-border-subtle rounded transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!slot || !base}
          className="px-3 py-1 text-xs font-mono bg-accent/20 text-accent border border-accent/30 rounded hover:bg-accent/30 disabled:opacity-40 transition-colors"
        >
          {item ? "Update" : "Create"}
        </button>
      </div>
    </div>
  );
}
