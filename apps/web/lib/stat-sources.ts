import type { BuildStats, ItemData, SkillGroup } from "@/engine/types";

export interface StatSource {
  source: string;
  value: string;
  type: "flat" | "increased" | "more" | "base";
}

const STAT_MOD_PATTERNS: Record<string, Array<{ pattern: RegExp; type: StatSource["type"] }>> = {
  life: [
    { pattern: /\+?(\d+)\s*to maximum life/i, type: "flat" },
    { pattern: /(\d+)%\s*increased maximum life/i, type: "increased" },
  ],
  energy_shield: [
    { pattern: /\+?(\d+)\s*to maximum energy shield/i, type: "flat" },
    { pattern: /(\d+)%\s*increased maximum energy shield/i, type: "increased" },
  ],
  mana: [
    { pattern: /\+?(\d+)\s*to maximum mana/i, type: "flat" },
    { pattern: /(\d+)%\s*increased maximum mana/i, type: "increased" },
  ],
  strength: [
    { pattern: /\+?(\d+)\s*to strength/i, type: "flat" },
    { pattern: /\+?(\d+)\s*to all attributes/i, type: "flat" },
  ],
  dexterity: [
    { pattern: /\+?(\d+)\s*to dexterity/i, type: "flat" },
    { pattern: /\+?(\d+)\s*to all attributes/i, type: "flat" },
  ],
  intelligence: [
    { pattern: /\+?(\d+)\s*to intelligence/i, type: "flat" },
    { pattern: /\+?(\d+)\s*to all attributes/i, type: "flat" },
  ],
  fire_res: [
    { pattern: /\+?(\d+)%\s*to fire resistance/i, type: "flat" },
    { pattern: /\+?(\d+)%\s*to all elemental resistances/i, type: "flat" },
  ],
  cold_res: [
    { pattern: /\+?(\d+)%\s*to cold resistance/i, type: "flat" },
    { pattern: /\+?(\d+)%\s*to all elemental resistances/i, type: "flat" },
  ],
  lightning_res: [
    { pattern: /\+?(\d+)%\s*to lightning resistance/i, type: "flat" },
    { pattern: /\+?(\d+)%\s*to all elemental resistances/i, type: "flat" },
  ],
  chaos_res: [
    { pattern: /\+?(\d+)%\s*to chaos resistance/i, type: "flat" },
  ],
  armour: [
    { pattern: /\+?(\d+)\s*to armour/i, type: "flat" },
    { pattern: /(\d+)%\s*increased armour/i, type: "increased" },
  ],
  evasion: [
    { pattern: /\+?(\d+)\s*to evasion/i, type: "flat" },
    { pattern: /(\d+)%\s*increased evasion/i, type: "increased" },
  ],
};

export function getStatSources(
  statKey: string,
  stats: BuildStats,
  items: ItemData[],
): StatSource[] {
  const sources: StatSource[] = [];

  if (statKey === "life") {
    sources.push({ source: `Base (Level ${stats.level})`, value: `${38 + (stats.level - 1) * 12}`, type: "base" });
    if (stats.strength > 0) {
      sources.push({ source: `Strength (${Math.round(stats.strength)})`, value: `+${Math.round(stats.strength / 2)}`, type: "flat" });
    }
  }
  if (statKey === "mana") {
    sources.push({ source: `Base (Level ${stats.level})`, value: `${34 + (stats.level - 1) * 6}`, type: "base" });
    if (stats.intelligence > 0) {
      sources.push({ source: `Intelligence (${Math.round(stats.intelligence)})`, value: `+${Math.round(stats.intelligence / 2)}`, type: "flat" });
    }
  }
  if (statKey === "fire_res" || statKey === "cold_res" || statKey === "lightning_res") {
    sources.push({ source: "Act 10 Penalty", value: "-60%", type: "base" });
  }
  if (statKey === "chaos_res") {
    sources.push({ source: "Act 10 Penalty", value: "-60%", type: "base" });
  }

  const patterns = STAT_MOD_PATTERNS[statKey];
  if (patterns) {
    for (const item of items) {
      for (const mod of item.mods) {
        for (const { pattern, type } of patterns) {
          const match = mod.match(pattern);
          if (match) {
            const val = match[1];
            const suffix = type === "flat" && statKey.includes("res") ? "%" : "";
            sources.push({
              source: item.name || item.base || item.slot,
              value: `+${val}${suffix}`,
              type,
            });
          }
        }
      }
    }
  }

  return sources;
}
