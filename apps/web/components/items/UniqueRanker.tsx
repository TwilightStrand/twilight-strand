
import { useState, useMemo } from "react";
import { useBuildStore } from "@/stores/build-store";
import type { UniqueItemData } from "@/data/unique-data.generated";

let _cachedUniques: UniqueItemData[] | null = null;
async function getUniques(): Promise<UniqueItemData[]> {
  if (_cachedUniques) return _cachedUniques;
  const mod = await import("../../data/unique-data.generated");
  _cachedUniques = mod.UNIQUE_ITEMS;
  return _cachedUniques;
}

interface RankedUnique {
  item: UniqueItemData;
  dpsDelta: number;
  dpsPct: number;
  lifeDelta: number;
  ehpDelta: number;
  modsMatched: number;
}

const EQUIP_SLOTS = [
  "Helmet",
  "Body Armour",
  "Gloves",
  "Boots",
  "Belt",
  "Amulet",
  "Ring",
  "Shield",
  "Weapon",
  "Quiver",
];

function stripRange(mod: string): string {
  return mod.replace(/\([\d.-]+[-–][\d.-]+\)/g, (m) => {
    const nums = m.match(/([\d.-]+)/g);
    if (nums && nums.length === 2) {
      const avg = (parseFloat(nums[0]) + parseFloat(nums[1])) / 2;
      return String(Math.round(avg));
    }
    return m;
  });
}

export function UniqueRanker() {
  const stats = useBuildStore((s) => s.stats);
  const [slot, setSlot] = useState("Helmet");
  const [rankings, setRankings] = useState<RankedUnique[]>([]);
  const [computing, setComputing] = useState(false);
  const [computed, setComputed] = useState(false);

  const rank = async () => {
    if (!stats) return;
    setComputing(true);
    const allUniques = await getUniques();
    const slotItems = allUniques.filter((u) => u.slot === slot);

    try {
      const {
        isRustEngineReady,
        evaluateBuildRust,
        parseStatLine,
        defaultRustInput,
      } = await import("@/engine/rust-bridge");

      if (!isRustEngineReady()) {
        setComputing(false);
        return;
      }

      const baseInput = defaultRustInput({
        level: stats.level,
        ascendancy_name: stats.ascendancy || "",
      });

      const baseOutput = evaluateBuildRust(baseInput);
      if (!baseOutput) {
        setComputing(false);
        return;
      }

      const results: RankedUnique[] = [];

      for (const item of slotItems) {
        const itemMods = item.mods
          .map(stripRange)
          .flatMap((m) => parseStatLine(m));

        if (itemMods.length === 0) continue;

        const withItem = evaluateBuildRust({
          ...baseInput,
          modifiers: [...baseInput.modifiers, ...itemMods],
          equipped_uniques: [...baseInput.equipped_uniques, item.name],
        });

        if (!withItem) continue;

        const dpsDelta = withItem.total_dps - baseOutput.total_dps;
        const dpsPct =
          baseOutput.total_dps > 0
            ? (dpsDelta / baseOutput.total_dps) * 100
            : 0;
        const lifeDelta = withItem.life - baseOutput.life;
        const ehpDelta = withItem.total_ehp - baseOutput.total_ehp;

        results.push({
          item,
          dpsDelta,
          dpsPct,
          lifeDelta,
          ehpDelta,
          modsMatched: itemMods.length,
        });
      }

      results.sort((a, b) => b.dpsPct - a.dpsPct);
      setRankings(results.slice(0, 20));
      setComputed(true);
    } catch (e) {
      console.warn("Unique ranker error:", e);
    } finally {
      setComputing(false);
    }
  };

  if (!stats) return null;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-mono uppercase tracking-widest text-text-dim">
          Best Uniques per Slot
        </h2>
        <div className="flex items-center gap-1.5">
          <select
            value={slot}
            onChange={(e) => {
              setSlot(e.target.value);
              setComputed(false);
            }}
            className="bg-bg-inset border border-border-subtle rounded px-1.5 py-0.5 text-[10px] font-mono text-text-primary"
          >
            {EQUIP_SLOTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={rank}
            disabled={computing}
            className="text-[10px] font-mono px-3 py-0.5 rounded bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 disabled:opacity-40"
          >
            {computing ? "..." : computed ? "Refresh" : "Rank"}
          </button>
        </div>
      </div>

      {rankings.length > 0 && (
        <div className="space-y-0.5 max-w-2xl">
          <div className="flex text-[9px] font-mono text-text-dim/60 border-b border-border-subtle pb-0.5 mb-1 px-2">
            <span className="w-5">#</span>
            <span className="flex-1">Unique</span>
            <span className="w-14 text-right">DPS%</span>
            <span className="w-14 text-right">Life</span>
            <span className="w-10 text-right">Mods</span>
          </div>
          {rankings.map((r, i) => (
            <div
              key={r.item.name}
              className="flex items-center text-[10px] font-mono px-2 py-1 rounded hover:bg-bg-hover/50"
            >
              <span className="w-5 text-text-dim/40 tabular-nums">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-text-primary truncate">{r.item.name}</div>
                <div className="text-text-dim/40 text-[9px] truncate">
                  {r.item.base}
                </div>
              </div>
              <span
                className={`w-14 text-right tabular-nums ${
                  r.dpsPct > 0
                    ? "text-green-400"
                    : r.dpsPct < 0
                      ? "text-red-400"
                      : "text-text-dim/40"
                }`}
              >
                {r.dpsPct > 0 ? "+" : ""}
                {r.dpsPct.toFixed(1)}%
              </span>
              <span
                className={`w-14 text-right tabular-nums ${
                  r.lifeDelta > 0
                    ? "text-green-400"
                    : r.lifeDelta < 0
                      ? "text-red-400"
                      : "text-text-dim/40"
                }`}
              >
                {r.lifeDelta > 0 ? "+" : ""}
                {Math.round(r.lifeDelta)}
              </span>
              <span className="w-10 text-right tabular-nums text-text-dim/40">
                {r.modsMatched}
              </span>
            </div>
          ))}
        </div>
      )}

      {!computed && !computing && (
        <p className="text-xs font-mono text-text-dim/60 text-center py-6">
          Evaluates every unique in the selected slot against your build. Ranked
          by DPS impact. Powered by Rust WASM.
        </p>
      )}
    </div>
  );
}
