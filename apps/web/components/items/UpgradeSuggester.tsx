
import { useState } from "react";
import { useBuildStore } from "@/stores/build-store";

interface Upgrade {
  slot: string;
  mod: string;
  rawMod: string;
  dpsDelta: number;
  dpsPct: number;
  lifeDelta: number;
  ehpDelta: number;
  source: string;
}

const EQUIP_SLOTS = [
  "Helmet", "Body Armour", "Gloves", "Boots",
  "Amulet", "Ring", "Belt", "Shield", "Weapon", "Quiver",
];

export function UpgradeSuggester() {
  const stats = useBuildStore((s) => s.stats);
  const items = useBuildStore((s) => s.items);
  const [upgrades, setUpgrades] = useState<Upgrade[]>([]);
  const [computing, setComputing] = useState(false);
  const [computed, setComputed] = useState(false);

  const findUpgrades = async () => {
    if (!stats) return;
    setComputing(true);

    try {
      const [rustBridge, corruptionMod] = await Promise.all([
        import("@/engine/rust-bridge"),
        import("@/data/corruption-data.generated"),
      ]);

      const { isRustEngineReady, evaluateBuildRust, parseStatLine, defaultRustInput } = rustBridge;
      const { CORRUPTION_MODS } = corruptionMod;

      if (!isRustEngineReady()) {
        setComputing(false);
        return;
      }

      const baseInput = defaultRustInput({
        level: stats.level,
        ascendancy_name: stats.ascendancy || "",
      });
      const baseOutput = evaluateBuildRust(baseInput);
      if (!baseOutput) { setComputing(false); return; }

      const results: Upgrade[] = [];
      const equippedSlots = new Set(items.map((i) => {
        if (i.slot.startsWith("Ring")) return "Ring";
        if (i.slot.startsWith("Weapon")) return "Weapon";
        if (i.slot.startsWith("Flask")) return "";
        return i.slot;
      }).filter(Boolean));

      for (const cm of CORRUPTION_MODS) {
        if (cm.slots.length === 0) continue;

        const relevantSlots = cm.slots.filter((s) => equippedSlots.has(s));
        if (relevantSlots.length === 0) continue;

        const parsed = parseStatLine(cm.mod);
        if (parsed.length === 0) continue;

        const withMod = evaluateBuildRust({
          ...baseInput,
          modifiers: [...baseInput.modifiers, ...parsed],
        });
        if (!withMod) continue;

        const dpsDelta = withMod.total_dps - baseOutput.total_dps;
        const dpsPct = baseOutput.total_dps > 0
          ? (dpsDelta / baseOutput.total_dps) * 100
          : 0;
        const lifeDelta = withMod.life - baseOutput.life;
        const ehpDelta = withMod.total_ehp - baseOutput.total_ehp;

        if (Math.abs(dpsPct) < 0.01 && Math.abs(lifeDelta) < 0.5 && Math.abs(ehpDelta) < 1) continue;

        for (const slot of relevantSlots) {
          results.push({
            slot,
            mod: cm.mod,
            rawMod: cm.rawMod,
            dpsDelta,
            dpsPct,
            lifeDelta,
            ehpDelta,
            source: "Corruption",
          });
        }
      }

      results.sort((a, b) => Math.abs(b.dpsPct) + Math.abs(b.ehpDelta / 100) - Math.abs(a.dpsPct) - Math.abs(a.ehpDelta / 100));
      setUpgrades(results.slice(0, 20));
      setComputed(true);
    } catch (e) {
      console.warn("Upgrade suggester error:", e);
    } finally {
      setComputing(false);
    }
  };

  if (!stats) return null;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-mono uppercase tracking-widest text-text-dim">
          Upgrade Suggestions
        </h2>
        <button
          onClick={findUpgrades}
          disabled={computing}
          className="text-[10px] font-mono px-3 py-0.5 rounded bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 disabled:opacity-40"
        >
          {computing ? "..." : computed ? "Refresh" : "Find Upgrades"}
        </button>
      </div>

      {upgrades.length > 0 && (
        <div className="space-y-1 max-w-2xl">
          <div className="flex text-[9px] font-mono text-text-dim/60 border-b border-border-subtle pb-0.5 mb-1 px-2">
            <span className="w-20">Slot</span>
            <span className="flex-1">Corruption Implicit</span>
            <span className="w-14 text-right">DPS%</span>
            <span className="w-14 text-right">Life</span>
          </div>
          {upgrades.map((u, i) => (
            <div
              key={`${u.slot}-${u.mod}-${i}`}
              className="flex items-center text-[10px] font-mono px-2 py-1 rounded hover:bg-bg-hover/50"
            >
              <span className="w-20 text-text-dim/60 shrink-0 truncate">{u.slot}</span>
              <div className="flex-1 min-w-0">
                <div className="text-text-primary truncate">{u.rawMod}</div>
                <div className="text-[8px] text-accent/40">{u.source}</div>
              </div>
              <span className={`w-14 text-right tabular-nums shrink-0 ${
                u.dpsPct > 0 ? "text-green-400" : u.dpsPct < -0.01 ? "text-red-400" : "text-text-dim/30"
              }`}>
                {u.dpsPct > 0 ? "+" : ""}{u.dpsPct.toFixed(1)}%
              </span>
              <span className={`w-14 text-right tabular-nums shrink-0 ${
                u.lifeDelta > 0 ? "text-green-400" : u.lifeDelta < -0.5 ? "text-red-400" : "text-text-dim/30"
              }`}>
                {u.lifeDelta > 0 ? "+" : ""}{Math.round(u.lifeDelta)}
              </span>
            </div>
          ))}
        </div>
      )}

      {!computed && !computing && (
        <p className="text-xs font-mono text-text-dim/60 text-center py-6">
          Evaluates corruption implicits for each equipped slot against your build.
          Shows which vaal outcomes would give the biggest stat gains.
        </p>
      )}
    </div>
  );
}
