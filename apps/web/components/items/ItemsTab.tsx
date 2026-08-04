"use client";

import { useState } from "react";
import { useBuildStore } from "@/stores/build-store";
import { EmptyState } from "@/components/shell/EmptyState";
import { ItemEditor } from "./ItemEditor";
import { ClusterDisplay } from "./ClusterDisplay";
import { CraftingBench } from "./CraftingBench";
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
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-0.5 h-4 rounded-full shrink-0" style={{ backgroundColor: rarityColor(item.rarity) }} />
          <span className="truncate" style={{ color: rarityColor(item.rarity) }}>
            {item.name || item.base}
          </span>
        </div>
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

const SOCKET_COLORS: Record<string, string> = {
  R: "#c44", G: "#4c4", B: "#44c", W: "#ccc", A: "#888",
};

function SocketVisual({ sockets }: { sockets: string }) {
  if (!sockets) return null;
  const groups = sockets.split(" ");
  return (
    <div className="flex items-center gap-2">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center">
          {group.split("-").map((color, si) => (
            <div key={si} className="flex items-center">
              {si > 0 && <div className="w-1.5 h-px bg-text-dim/40" />}
              <div
                className="w-3 h-3 rounded-full border"
                style={{
                  backgroundColor: SOCKET_COLORS[color] || "#888",
                  borderColor: `${SOCKET_COLORS[color] || "#888"}88`,
                }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
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

function parseRequirements(item: ItemData): string[] {
  const reqs: string[] = [];
  for (const mod of item.mods) {
    const lvlMatch = mod.match(/requires level (\d+)/i);
    if (lvlMatch) reqs.push(`Level ${lvlMatch[1]}`);
    const strMatch = mod.match(/(\d+) str(?:ength)?/i);
    if (strMatch && !mod.toLowerCase().includes("to maximum")) reqs.push(`${strMatch[1]} Str`);
    const dexMatch = mod.match(/(\d+) dex(?:terity)?/i);
    if (dexMatch && !mod.toLowerCase().includes("to maximum")) reqs.push(`${dexMatch[1]} Dex`);
    const intMatch = mod.match(/(\d+) int(?:elligence)?/i);
    if (intMatch && !mod.toLowerCase().includes("to maximum")) reqs.push(`${intMatch[1]} Int`);
  }
  return reqs;
}

const INFLUENCE_COLORS: Record<string, string> = {
  Shaper: "#6688cc",
  Elder: "#886644",
  Crusader: "#cc8844",
  Redeemer: "#4488cc",
  Hunter: "#44cc44",
  Warlord: "#cc4444",
};

function getInfluences(item: ItemData): string[] {
  const influences: string[] = [];
  const allText = [...item.mods].join(" ").toLowerCase();
  if (allText.includes("shaper's") || allText.includes("(shaper)")) influences.push("Shaper");
  if (allText.includes("elder's") || allText.includes("(elder)")) influences.push("Elder");
  if (allText.includes("(crusader)")) influences.push("Crusader");
  if (allText.includes("(redeemer)")) influences.push("Redeemer");
  if (allText.includes("(hunter)")) influences.push("Hunter");
  if (allText.includes("(warlord)")) influences.push("Warlord");
  return influences;
}

function ItemDetail({ item, onEdit, onDelete, onCraft }: { item: ItemData; onEdit?: () => void; onDelete?: () => void; onCraft?: () => void }) {
  const color = rarityColor(item.rarity);
  const keyStats = extractKeyStats(item);
  const reqs = parseRequirements(item);
  const influences = getInfluences(item);
  const [price, setPrice] = useState<{ min: number; median: number } | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  return (
    <div className="p-4 border-t-2" style={{ borderTopColor: color }}>
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
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
          {influences.map(inf => (
            <span key={inf} className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{
              color: INFLUENCE_COLORS[inf],
              backgroundColor: `${INFLUENCE_COLORS[inf]}15`,
              border: `1px solid ${INFLUENCE_COLORS[inf]}30`,
            }}>
              {inf}
            </span>
          ))}
          <button
            onClick={async () => {
              const lines: string[] = [];
              if (item.rarity) lines.push(`Rarity: ${item.rarity}`);
              if (item.name) lines.push(item.name);
              if (item.base && item.base !== item.name) lines.push(item.base);
              if (item.quality > 0) lines.push(`Quality: ${item.quality}%`);
              if (item.sockets) lines.push(`Sockets: ${item.sockets}`);
              if (item.mods.length > 0) {
                lines.push("--------");
                lines.push(...item.mods);
              }
              await navigator.clipboard.writeText(lines.join("\n"));
              const { toast } = await import("@/components/shell/Toast");
              toast("Item text copied");
            }}
            className="text-[10px] font-mono text-text-dim hover:text-accent transition-colors"
            title="Copy item text"
          >
            Copy
          </button>
          {item.rarity === "Unique" && (
            <button
              onClick={async () => {
                setPriceLoading(true);
                const { priceCheckUnique } = await import("@/lib/trade");
                const result = await priceCheckUnique(item.name, item.base);
                setPrice(result ? { min: result.min, median: result.median } : null);
                setPriceLoading(false);
              }}
              disabled={priceLoading}
              className="text-[10px] font-mono text-amber-400 hover:text-amber-300 transition-colors"
            >
              {priceLoading ? "..." : price ? `~${price.median}c` : "Price Check"}
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-[10px] font-mono text-text-dim hover:text-accent transition-colors"
            >
              Edit
            </button>
          )}
          {onCraft && (
            <button
              onClick={onCraft}
              className="text-[10px] font-mono text-accent hover:text-accent/80 transition-colors"
            >
              Craft
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-[10px] font-mono text-text-dim hover:text-blood transition-colors"
            >
              Delete
            </button>
          )}
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
        <div className="mb-2">
          <SocketVisual sockets={item.sockets} />
        </div>
      )}

      {reqs.length > 0 && (
        <div className="text-[10px] font-mono text-text-dim/60 mb-2">
          Requires: {reqs.join(", ")}
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

      {keyStats.length > 0 && (
        <div className="border-t border-border-subtle pt-2 mt-2">
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-text-dim">Provides</span>
          <div className="mt-1 space-y-0.5">
            {keyStats.map((stat, i) => (
              <div key={i} className="flex justify-between text-[10px] font-mono">
                <span className="text-text-dim">{stat.label}</span>
                <span style={{ color: stat.color }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ClusterDisplay item={item} />
    </div>
  );
}

function EquipmentGrid({ itemsBySlot, selectedSlot, onSelect }: {
  itemsBySlot: Map<string, ItemData>;
  selectedSlot: string;
  onSelect: (slot: string) => void;
}) {
  const layout: (string | null)[][] = [
    [null, "Helmet", null],
    ["Weapon 1", "Body Armour", "Weapon 2"],
    ["Ring 1", "Belt", "Ring 2"],
    ["Gloves", "Amulet", "Boots"],
  ];

  return (
    <div className="grid grid-cols-3 gap-1 p-2 max-w-48 mx-auto mb-3">
      {layout.flat().map((slot, i) => {
        if (!slot) return <div key={i} />;
        const item = itemsBySlot.get(slot);
        const isSelected = selectedSlot === slot;
        return (
          <button
            key={slot}
            onClick={() => onSelect(slot)}
            className={`aspect-square rounded border text-center flex flex-col items-center justify-center p-1 transition-colors ${
              isSelected ? "border-accent bg-accent/10" :
              item ? "border-border-card bg-bg-card hover:border-accent/30" :
              "border-border-subtle/50 bg-bg-inset/30 hover:border-border-card"
            }`}
            title={slot}
          >
            <span className="text-[7px] font-mono text-text-dim/60 leading-tight">{slot.replace("Body Armour", "Chest")}</span>
            {item && (
              <span className="text-[7px] font-mono truncate w-full mt-0.5" style={{ color: rarityColor(item.rarity) }}>
                {(item.name || item.base).split(" ").slice(0, 2).join(" ")}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function ItemsTab() {
  const items = useBuildStore((s) => s.items);
  const [selectedSlot, setSelectedSlot] = useState<string>("Weapon 1");
  const [activeLoadout, setActiveLoadout] = useState(0);
  const [weaponSet, setWeaponSet] = useState<1 | 2>(1);
  const [activeFlasks, setActiveFlasks] = useState<Set<string>>(new Set());
  const [itemFilter, setItemFilter] = useState("");
  const [editing, setEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemData | undefined>();
  const [crafting, setCrafting] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
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

  const filledCount = items.filter(i => i.slot).length;
  const uniqueCount = items.filter(i => i.rarity === "Unique").length;
  const rareCount = items.filter(i => i.rarity === "Rare").length;

  return (
    <div className="flex h-full">
      <div className="w-64 min-w-56 border-r border-border-subtle overflow-y-auto">
        {items.length > 0 && (
          <div className="px-3 py-1 border-b border-border-subtle text-[10px] font-mono text-text-dim flex gap-3">
            <span>{filledCount} equipped</span>
            {uniqueCount > 0 && <span style={{ color: RARITY_COLORS.Unique }}>{uniqueCount} unique</span>}
            {rareCount > 0 && <span style={{ color: RARITY_COLORS.Rare }}>{rareCount} rare</span>}
            <button
              onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
              className="ml-auto text-text-dim/50 hover:text-text-dim"
              title={viewMode === "list" ? "Grid view" : "List view"}
            >
              {viewMode === "list" ? "grid" : "list"}
            </button>
          </div>
        )}
        {viewMode === "grid" && (
          <EquipmentGrid
            itemsBySlot={itemsBySlot}
            selectedSlot={selectedSlot}
            onSelect={setSelectedSlot}
          />
        )}
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
        <div className="px-2 py-1.5 border-b border-border-subtle">
          <input
            type="text"
            value={itemFilter}
            onChange={(e) => setItemFilter(e.target.value)}
            placeholder="Filter items..."
            className="w-full bg-bg-inset border border-border-subtle rounded px-2 py-1 text-[10px] font-mono text-text-primary placeholder:text-text-dim/40 focus:outline-none focus:border-accent"
          />
        </div>
        <div className="p-2">
        <div className="flex items-center gap-1 mb-2 px-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-dim mr-auto">
            Equipment
          </span>
          <button
            onClick={() => { setEditingItem(undefined); setEditing(true); }}
            className="text-[10px] font-mono text-accent hover:text-accent/80 transition-colors mr-1"
          >
            + New
          </button>
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
        {equipmentSlots.filter(slot => {
          if (!itemFilter.trim()) return true;
          const item = itemsBySlot.get(slot);
          if (!item) return !itemFilter.trim();
          const q = itemFilter.toLowerCase();
          return item.name.toLowerCase().includes(q) || item.base.toLowerCase().includes(q) || item.mods.some(m => m.toLowerCase().includes(q));
        }).map((slot) => (
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
        {crafting && selectedItem ? (
          <CraftingBench
            item={selectedItem}
            onCraft={(mod) => {
              const current = [...useBuildStore.getState().items];
              const idx = current.findIndex(i => i.slot === selectedItem.slot);
              if (idx >= 0) {
                current[idx] = { ...current[idx], mods: [...current[idx].mods, mod] };
                useBuildStore.setState({ items: current });
              }
              setCrafting(false);
            }}
            onClose={() => setCrafting(false)}
          />
        ) : editing ? (
          <ItemEditor
            item={editingItem}
            defaultSlot={selectedSlot}
            onSave={(item) => {
              const current = [...useBuildStore.getState().items];
              if (editingItem) {
                const idx = current.findIndex(i => i.slot === editingItem.slot);
                if (idx >= 0) current[idx] = item;
                else current.push(item);
              } else {
                const idx = current.findIndex(i => i.slot === item.slot);
                if (idx >= 0) current[idx] = item;
                else current.push(item);
              }
              useBuildStore.setState({ items: current });
              setSelectedSlot(item.slot);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        ) : selectedItem ? (
          <ItemDetail
            item={selectedItem}
            onEdit={() => { setEditingItem(selectedItem); setEditing(true); }}
            onCraft={() => setCrafting(true)}
            onDelete={() => {
              const filtered = useBuildStore.getState().items.filter(i => i.slot !== selectedItem.slot);
              useBuildStore.setState({ items: filtered });
            }}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="No Equipment"
            description="Import a build to see equipped items, flasks, and jewels."
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <span className="text-text-dim font-mono text-sm">No item in {selectedSlot}</span>
            <button
              onClick={() => { setEditingItem(undefined); setEditing(true); }}
              className="text-[10px] font-mono text-accent hover:text-accent/80 transition-colors"
            >
              + Create item
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
