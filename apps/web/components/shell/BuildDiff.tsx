"use client";

import { useBuildStore } from "@/stores/build-store";

function fmtNum(n: number): string {
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return Math.round(n).toString();
}

const STAT_LABELS: Record<string, string> = {
  total_dps: "Total DPS",
  combined_dps: "Combined DPS",
  total_ehp: "Total EHP",
  life: "Life",
  energy_shield: "Energy Shield",
  mana: "Mana",
  strength: "Strength",
  dexterity: "Dexterity",
  intelligence: "Intelligence",
  armour: "Armour",
  evasion: "Evasion",
  block_chance: "Block Chance",
  spell_block: "Spell Block",
  fire_res: "Fire Resistance",
  cold_res: "Cold Resistance",
  lightning_res: "Lightning Resistance",
  chaos_res: "Chaos Resistance",
  crit_chance: "Crit Chance",
  attack_speed: "Attack Speed",
  accuracy: "Accuracy",
};

const HIGHER_IS_BETTER = new Set([
  "total_dps", "combined_dps", "total_ehp", "life", "energy_shield", "mana",
  "strength", "dexterity", "intelligence", "armour", "evasion",
  "block_chance", "spell_block", "fire_res", "cold_res", "lightning_res",
  "crit_chance", "attack_speed", "accuracy", "hit_chance",
]);

export function BuildDiff() {
  const stats = useBuildStore((s) => s.stats);
  const compareStats = useBuildStore((s) => s.compareStats);
  const clearCompare = useBuildStore((s) => s.clearCompare);

  if (!stats || !compareStats) return null;

  const diffs: Array<{ key: string; label: string; delta: number; better: boolean }> = [];

  for (const [key, label] of Object.entries(STAT_LABELS)) {
    const before = (compareStats as unknown as Record<string, unknown>)[key];
    const after = (stats as unknown as Record<string, unknown>)[key];
    if (typeof before !== "number" || typeof after !== "number") continue;
    const delta = after - before;
    if (Math.abs(delta) < 0.01) continue;
    const higherBetter = HIGHER_IS_BETTER.has(key);
    diffs.push({ key, label, delta, better: higherBetter ? delta > 0 : delta < 0 });
  }

  if (diffs.length === 0) return null;

  return (
    <div className="border-t border-border-subtle mt-2 pt-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-text-dim">
          Changes
        </span>
        <button onClick={clearCompare} className="text-[9px] font-mono text-text-dim hover:text-blood">
          Clear
        </button>
      </div>
      <div className="space-y-0.5 max-h-32 overflow-y-auto">
        {diffs.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).map((d) => (
          <div key={d.key} className="flex justify-between text-[10px] font-mono">
            <span className="text-text-dim truncate">{d.label}</span>
            <span className={d.better ? "text-green-400" : "text-red-400"}>
              {d.delta > 0 ? "+" : ""}{fmtNum(d.delta)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
