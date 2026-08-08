
import type { ItemData } from "@/engine/types";

const RARITY_BORDERS: Record<string, string> = {
  Normal: "border-text-dim/30",
  Magic: "border-blue-400/50",
  Rare: "border-yellow-400/50",
  Unique: "border-orange-500/50",
};

const RARITY_BG: Record<string, string> = {
  Normal: "",
  Magic: "bg-blue-400/5",
  Rare: "bg-yellow-400/5",
  Unique: "bg-orange-500/5",
};

interface PaperDollProps {
  items: ItemData[];
  selectedSlot: string;
  onSelectSlot: (slot: string) => void;
  weaponSet: 1 | 2;
}

function Slot({
  slotName,
  label,
  item,
  selected,
  onClick,
  className,
}: {
  slotName: string;
  label: string;
  item?: ItemData;
  selected: boolean;
  onClick: () => void;
  className?: string;
}) {
  const rarity = item?.rarity ?? "Normal";
  const borderClass = item ? (RARITY_BORDERS[rarity] ?? RARITY_BORDERS.Normal) : "border-border-subtle";
  const bgClass = item ? (RARITY_BG[rarity] ?? "") : "";

  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center
        w-[72px] h-[88px] rounded border transition-all
        ${borderClass} ${bgClass}
        ${selected ? "!border-accent ring-1 ring-accent/30" : "hover:border-text-dim/50 hover:bg-bg-hover/30"}
        ${className ?? ""}
      `}
      title={item ? `${item.name} (${item.rarity})` : `Empty ${label}`}
    >
      {item ? (
        <>
          <span
            className="text-[9px] font-mono leading-tight text-center px-1 truncate w-full"
            style={{ color: rarity === "Unique" ? "#af6025" : rarity === "Rare" ? "#ffd700" : rarity === "Magic" ? "#7d95ff" : "#9ca3af" }}
          >
            {item.name.length > 12 ? item.name.slice(0, 11) + "..." : item.name}
          </span>
          <span className="text-[7px] font-mono text-text-dim/40 mt-0.5 truncate w-full text-center px-1">
            {item.base.length > 14 ? item.base.slice(0, 13) + "..." : item.base}
          </span>
        </>
      ) : (
        <span className="text-[8px] font-mono text-text-dim/25 uppercase tracking-wider">
          {label}
        </span>
      )}
    </button>
  );
}

function FlaskSlot({
  item,
  selected,
  onClick,
  label,
}: {
  item?: ItemData;
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-[52px] h-[64px] rounded border flex flex-col items-center justify-center transition-all
        ${item ? "border-text-dim/30 bg-bg-inset" : "border-border-subtle"}
        ${selected ? "!border-accent ring-1 ring-accent/30" : "hover:border-text-dim/40"}
      `}
      title={item ? item.name : `Empty ${label}`}
    >
      {item ? (
        <span className="text-[8px] font-mono text-text-dim/70 text-center px-0.5 truncate w-full">
          {item.name.length > 8 ? item.name.slice(0, 7) + "..." : item.name}
        </span>
      ) : (
        <span className="text-[7px] font-mono text-text-dim/20">{label}</span>
      )}
    </button>
  );
}

export function PaperDoll({ items, selectedSlot, onSelectSlot, weaponSet }: PaperDollProps) {
  const find = (slot: string) => items.find((i) => i.slot === slot);

  const w1 = weaponSet === 1 ? "Weapon 1" : "Weapon 1 Swap";
  const w2 = weaponSet === 1 ? "Weapon 2" : "Weapon 2 Swap";

  return (
    <div className="flex flex-col items-center gap-1 py-3">
      {/* Row 1: Helmet */}
      <div className="flex justify-center">
        <Slot slotName="Helmet" label="Helm" item={find("Helmet")} selected={selectedSlot === "Helmet"} onClick={() => onSelectSlot("Helmet")} />
      </div>

      {/* Row 2: Weapon - Amulet - Off-hand */}
      <div className="flex items-center gap-1">
        <Slot slotName={w1} label="Wpn" item={find(w1)} selected={selectedSlot === w1} onClick={() => onSelectSlot(w1)} />
        <Slot slotName="Amulet" label="Amul" item={find("Amulet")} selected={selectedSlot === "Amulet"} onClick={() => onSelectSlot("Amulet")} className="w-[56px] h-[56px]" />
        <Slot slotName={w2} label="Off" item={find(w2)} selected={selectedSlot === w2} onClick={() => onSelectSlot(w2)} />
      </div>

      {/* Row 3: Body Armour */}
      <div className="flex justify-center">
        <Slot slotName="Body Armour" label="Body" item={find("Body Armour")} selected={selectedSlot === "Body Armour"} onClick={() => onSelectSlot("Body Armour")} className="w-[88px] h-[104px]" />
      </div>

      {/* Row 4: Gloves - Belt - Boots */}
      <div className="flex items-center gap-1">
        <Slot slotName="Gloves" label="Gloves" item={find("Gloves")} selected={selectedSlot === "Gloves"} onClick={() => onSelectSlot("Gloves")} />
        <Slot slotName="Belt" label="Belt" item={find("Belt")} selected={selectedSlot === "Belt"} onClick={() => onSelectSlot("Belt")} className="w-[56px] h-[48px]" />
        <Slot slotName="Boots" label="Boots" item={find("Boots")} selected={selectedSlot === "Boots"} onClick={() => onSelectSlot("Boots")} />
      </div>

      {/* Row 5: Ring 1 - gap - Ring 2 */}
      <div className="flex items-center gap-8">
        <Slot slotName="Ring 1" label="Ring" item={find("Ring 1")} selected={selectedSlot === "Ring 1"} onClick={() => onSelectSlot("Ring 1")} className="w-[48px] h-[48px]" />
        <Slot slotName="Ring 2" label="Ring" item={find("Ring 2")} selected={selectedSlot === "Ring 2"} onClick={() => onSelectSlot("Ring 2")} className="w-[48px] h-[48px]" />
      </div>

      {/* Flasks */}
      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border-subtle">
        {["Flask 1", "Flask 2", "Flask 3", "Flask 4", "Flask 5"].map((slot) => (
          <FlaskSlot key={slot} item={find(slot)} selected={selectedSlot === slot} onClick={() => onSelectSlot(slot)} label={slot.replace("Flask ", "F")} />
        ))}
      </div>
    </div>
  );
}
