"use client";

import { useState } from "react";
import { useBuildStore } from "@/stores/build-store";
import { EmptyState } from "@/components/shell/EmptyState";
import type { ItemData } from "@/engine/types";

const WEAPON_SLOTS_SET1 = ["Weapon 1", "Weapon 2"];
const WEAPON_SLOTS_SET2 = ["Weapon 1 Swap", "Weapon 2 Swap"];
const ARMOUR_SLOTS = [
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


const RARITY_COLORS: Record<string, string> = {
  Normal: "#9ca3af",
  Magic: "#7d95ff",
  Rare: "#ffd700",
  Unique: "#af6025",
};

function rarityColor(rarity: string): string {
  return RARITY_COLORS[rarity] ?? RARITY_COLORS.Normal;
}

function flaskTypeColor(item: ItemData): string | null {
  if (!item.slot.startsWith("Flask")) return null;
  const name = (item.name + " " + item.base).toLowerCase();
  if (item.rarity === "Unique") return "#af6025";
  if (name.includes("life") || name.includes("eternal") || name.includes("divine") || name.includes("hallowed") || name.includes("sanctified")) return "#c44";
  if (name.includes("mana")) return "#4488dd";
  if (name.includes("quicksilver") || name.includes("granite") || name.includes("jade") || name.includes("basalt") || name.includes("quartz") || name.includes("diamond") || name.includes("amethyst") || name.includes("ruby") || name.includes("sapphire") || name.includes("topaz") || name.includes("silver") || name.includes("sulphur") || name.includes("bismuth") || name.includes("gold")) return "#8b8";
  return "#888";
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
  const flaskColor = item ? flaskTypeColor(item) : null;

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs font-mono rounded transition-colors
        ${selected ? "bg-bg-hover text-text-bright" : "text-text-dim hover:bg-bg-hover/50 hover:text-text-primary"}
      `}
    >
      {flaskColor && (
        <span className="w-1.5 h-4 rounded-sm shrink-0" style={{ backgroundColor: flaskColor }} />
      )}
      <span className={`${flaskColor ? "w-16" : "w-24"} shrink-0 text-text-dim truncate`}>{slot}</span>
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

function modColor(mod: string): string {
  if (mod.includes("(crafted)") || mod.includes("{crafted}")) return "#8888ff";
  if (mod.includes("(implicit)")) return "#b8a0ff";
  if (mod.includes("(enchant)")) return "#b8a0ff";
  if (mod.includes("(fractured)")) return "#a29162";
  return "var(--color-accent-dim)";
}

function modTag(mod: string): { label: string; color: string } | null {
  if (mod.includes("(crafted)") || mod.includes("{crafted}")) return { label: "crafted", color: "#8888ff" };
  if (mod.includes("(fractured)")) return { label: "fractured", color: "#a29162" };
  if (mod.includes("(enchant)")) return { label: "enchant", color: "#b8a0ff" };
  return null;
}

function cleanMod(mod: string): string {
  return mod.replace(/\{?(\(crafted\)|\(implicit\)|\(enchant\)|\(fractured\))\}?/g, "").trim();
}

function extractKeyStats(item: ItemData): Array<{ label: string; value: string; color: string }> {
  const stats: Array<{ label: string; value: string; color: string }> = [];
  for (const mod of item.mods) {
    const lifeMatch = mod.match(/\+(\d+) to maximum life/i);
    if (lifeMatch) stats.push({ label: "Life", value: `+${lifeMatch[1]}`, color: "#c44" });
    const esMatch = mod.match(/\+(\d+) to maximum energy shield/i);
    if (esMatch) stats.push({ label: "ES", value: `+${esMatch[1]}`, color: "#4488dd" });
    const resMatch = mod.match(/\+(\d+)% to (fire|cold|lightning|chaos|all elemental) resistance/i);
    if (resMatch) {
      const rc: Record<string, string> = { fire: "#c44", cold: "#48c", lightning: "#cc4", chaos: "#84c", "all elemental": "#c84" };
      stats.push({ label: `${resMatch[2]} Res`, value: `+${resMatch[1]}%`, color: rc[resMatch[2].toLowerCase()] || "#888" });
    }
    const dmgMatch = mod.match(/adds (\d+) to (\d+) (physical|fire|cold|lightning|chaos) damage/i);
    if (dmgMatch) stats.push({ label: `${dmgMatch[3]} Dmg`, value: `${dmgMatch[1]}-${dmgMatch[2]}`, color: "#c84" });
  }
  return stats.slice(0, 4);
}

function ItemDetail({ item }: { item: ItemData }) {
  const color = rarityColor(item.rarity);
  const keyStats = extractKeyStats(item);

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

      {keyStats.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {keyStats.map((stat, i) => (
            <span
              key={i}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{ color: stat.color, backgroundColor: `${stat.color}15`, border: `1px solid ${stat.color}25` }}
            >
              {stat.label}: {stat.value}
            </span>
          ))}
        </div>
      )}

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
          {item.mods.map((mod, i) => {
            const tag = modTag(mod);
            return (
              <div key={i} className="flex items-baseline gap-1.5 text-xs font-mono" style={{ color: modColor(mod) }}>
                <span>{cleanMod(mod)}</span>
                {tag && (
                  <span className="text-[9px] opacity-60" style={{ color: tag.color }}>
                    [{tag.label}]
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ItemsTab() {
  const items = useBuildStore((s) => s.items);
  const [selectedSlot, setSelectedSlot] = useState<string>("Weapon 1");
  const [activeLoadout, setActiveLoadout] = useState(0);
  const [weaponSet, setWeaponSet] = useState<1 | 2>(1);
  const [activeFlasks, setActiveFlasks] = useState<Set<string>>(new Set());
  const loadouts = ["Default"];

  function toggleFlask(slot: string) {
    setActiveFlasks(prev => {
      const next = new Set(prev);
      if (next.has(slot)) next.delete(slot);
      else next.add(slot);
      return next;
    });
  }

  const weaponSlots = weaponSet === 1 ? WEAPON_SLOTS_SET1 : WEAPON_SLOTS_SET2;
  const equipmentSlots = [...weaponSlots, ...ARMOUR_SLOTS];

  const itemsBySlot = new Map<string, ItemData>();
  for (const item of items) {
    if (item.slot) itemsBySlot.set(item.slot, item);
  }

  const selectedItem = itemsBySlot.get(selectedSlot);

  return (
    <div className="flex h-full">
      <div className="w-64 min-w-56 border-r border-border-subtle overflow-y-auto">
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border-subtle">
          {loadouts.map((name, i) => (
            <button
              key={i}
              onClick={() => setActiveLoadout(i)}
              className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${
                i === activeLoadout
                  ? "bg-accent/20 text-accent border border-accent/30"
                  : "text-text-dim hover:text-text-primary border border-transparent"
              }`}
            >
              {name}
            </button>
          ))}
          <button
            className="text-[10px] font-mono px-1.5 py-0.5 rounded text-text-dim/40 cursor-not-allowed"
            disabled
            title="Add loadout (coming soon)"
          >
            +
          </button>
        </div>
        <div className="p-2">
        <div className="flex items-center gap-1 mb-2 px-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-dim mr-auto">
            Equipment
          </span>
          <button
            onClick={() => setWeaponSet(1)}
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-colors ${weaponSet === 1 ? "bg-accent/20 text-accent" : "text-text-dim/50 hover:text-text-dim"}`}
          >
            Set I
          </button>
          <button
            onClick={() => setWeaponSet(2)}
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-colors ${weaponSet === 2 ? "bg-accent/20 text-accent" : "text-text-dim/50 hover:text-text-dim"}`}
          >
            Set II
          </button>
        </div>
        {equipmentSlots.map((slot) => (
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
          <div key={slot} className="flex items-center gap-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); toggleFlask(slot); }}
              className={`w-4 h-4 rounded-sm text-[8px] font-bold shrink-0 transition-colors ${
                activeFlasks.has(slot)
                  ? "bg-accent/30 text-accent border border-accent/50"
                  : "bg-bg-hover text-text-dim/40 border border-border-subtle"
              }`}
              title={activeFlasks.has(slot) ? "Flask active" : "Flask inactive"}
            >
              {activeFlasks.has(slot) ? "A" : ""}
            </button>
            <div className="flex-1">
              <SlotRow
                slot={slot}
                item={itemsBySlot.get(slot)}
                selected={selectedSlot === slot}
                onClick={() => setSelectedSlot(slot)}
              />
            </div>
          </div>
        ))}
      </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {selectedItem ? (
          <ItemDetail item={selectedItem} />
        ) : items.length === 0 ? (
          <EmptyState
            title="No Equipment"
            description="Import a build to see equipped items, flasks, and jewels."
          />
        ) : (
          <div className="flex items-center justify-center h-full text-text-dim font-mono text-sm">
            No item in {selectedSlot}
          </div>
        )}
      </div>
    </div>
  );
}
