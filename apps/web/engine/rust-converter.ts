import type { BuildStats, ItemData, SkillGroup } from "./types";
import type { RustBuildInput, RustModifier, RustCalcOutput } from "./rust-bridge";
import type { TreeNode } from "@/components/tree/tree-data";
import { parseClusterJewel } from "./cluster-jewel";
import { CLUSTER_NOTABLES } from "@/data/cluster-data.generated";

const CLASS_IDS: Record<string, number> = {
  Scion: 0,
  Marauder: 1,
  Ranger: 2,
  Witch: 3,
  Duelist: 4,
  Templar: 5,
  Shadow: 6,
};

let treeNodeCache: Map<string, TreeNode> | null = null;
let treeFetchPromise: Promise<Map<string, TreeNode>> | null = null;

export async function ensureTreeData(): Promise<Map<string, TreeNode>> {
  if (treeNodeCache) return treeNodeCache;
  if (treeFetchPromise) return treeFetchPromise;

  treeFetchPromise = (async () => {
    const resp = await fetch("/data/tree/tree-3_29.json");
    if (!resp.ok) throw new Error(`Tree data fetch failed: ${resp.status}`);
    const raw = await resp.json();
    const nodes = new Map<string, TreeNode>();
    for (const [id, n] of Object.entries(raw.nodes as Record<string, Record<string, unknown>>)) {
      if (id === "root") continue;
      nodes.set(id, {
        id,
        name: n.name as string | undefined,
        stats: n.stats as string[] | undefined,
        isKeystone: n.isKeystone as boolean | undefined,
        isNotable: n.isNotable as boolean | undefined,
        group: 0,
        orbit: 0,
        orbitIndex: 0,
        out: [],
        in: [],
        x: 0,
        y: 0,
      });
    }
    treeNodeCache = nodes;
    return nodes;
  })();

  return treeFetchPromise;
}

const WEAPON1_SLOTS = ["Weapon 1", "Weapon 1Swap"];
const WEAPON2_SLOTS = ["Weapon 2", "Weapon 2Swap"];
const FLASK_SLOTS = ["Flask 1", "Flask 2", "Flask 3", "Flask 4", "Flask 5"];

const AURA_NAMES = new Set([
  "Anger", "Clarity", "Defiance Banner", "Determination", "Discipline",
  "Dread Banner", "Grace", "Haste", "Hatred", "Malevolence", "Precision",
  "Pride", "Purity of Elements", "Purity of Fire", "Purity of Ice",
  "Purity of Lightning", "Vitality", "War Banner", "Wrath", "Zealotry",
]);

const WHILE_AFFECTED_RE = /\s+while affected by\s+.+$/i;

interface WeaponStats {
  base: string;
  physMin: number;
  physMax: number;
  aps: number;
  crit: number;
}

function extractWeaponStats(items: ItemData[], slots: string[]): WeaponStats {
  const weapon = items.find((i) => slots.includes(i.slot));
  if (!weapon) return { base: "", physMin: 0, physMax: 0, aps: 0, crit: 0 };

  let physMin = 0, physMax = 0, aps = 1.2, crit = 5.0;

  for (const mod of weapon.mods) {
    const lower = mod.toLowerCase();
    const numMatch = mod.match(/(\d+\.?\d*)/);
    const val = numMatch ? parseFloat(numMatch[1]) : 0;

    if (lower.includes("attacks per second")) {
      aps = val || aps;
    } else if (lower.includes("critical strike chance")) {
      crit = val || crit;
    }

    const rangeMatch = mod.match(/(\d+)\s*(?:to|-)\s*(\d+)/);
    if (rangeMatch && lower.includes("physical damage")) {
      physMin = parseFloat(rangeMatch[1]);
      physMax = parseFloat(rangeMatch[2]);
    }
  }

  return { base: weapon.base, physMin, physMax, aps, crit };
}

export function convertToRustInput(
  stats: BuildStats,
  items: ItemData[],
  skills: SkillGroup[],
  treeNodes: Map<string, TreeNode>,
  parseStatLine: (line: string) => RustModifier[],
): RustBuildInput {
  const modifiers: RustModifier[] = [];
  const keystones: string[] = [];
  const equippedUniques: string[] = [];

  // Detect active auras from skill groups
  const activeAuras = new Set<string>();
  for (const group of skills) {
    if (!group.enabled) continue;
    for (const gem of group.gems) {
      if (gem.enabled && AURA_NAMES.has(gem.name)) {
        activeAuras.add(gem.name.toLowerCase());
      }
    }
  }

  // Item mods → modifiers + unique detection + cluster jewel resolution
  for (const item of items) {
    if (item.rarity === "UNIQUE" || item.rarity === "Unique") {
      equippedUniques.push(item.name);
    }

    // Resolve cluster jewel notables to their actual stats
    const cluster = parseClusterJewel(item.mods);
    if (cluster) {
      for (const node of cluster.nodes) {
        if (node.type === "notable" && node.name) {
          const notable = CLUSTER_NOTABLES[node.name];
          if (notable) {
            for (const stat of notable.stats) {
              const parsed = parseStatLine(stat);
              modifiers.push(...parsed);
            }
          }
        } else if (node.type === "small") {
          for (const stat of node.stats) {
            const parsed = parseStatLine(stat);
            modifiers.push(...parsed);
          }
        }
      }
      continue;
    }

    for (const mod of item.mods) {
      let line = mod;
      const affectedMatch = mod.match(/while affected by (.+)$/i);
      if (affectedMatch) {
        const aura = affectedMatch[1].trim().toLowerCase();
        if (!activeAuras.has(aura)) continue;
        line = mod.replace(WHILE_AFFECTED_RE, "");
      }
      const parsed = parseStatLine(line);
      modifiers.push(...parsed);
    }
  }

  // Tree node stats → modifiers + keystone detection
  for (const nodeId of stats.allocated_nodes) {
    const node = treeNodes.get(String(nodeId));
    if (!node) continue;

    if (node.isKeystone && node.name) {
      keystones.push(node.name);
    }

    if (node.stats) {
      for (const statLine of node.stats) {
        const parsed = parseStatLine(statLine);
        modifiers.push(...parsed);
      }
    }
  }

  // Main skill + support gems from skill groups
  const mainIndex = Math.max(0, stats.main_socket_group - 1);
  const mainGroup = skills[mainIndex];
  let mainSkillId = "";
  const supportGems: string[] = [];

  if (mainGroup) {
    for (const gem of mainGroup.gems) {
      if (!gem.enabled) continue;
      if (gem.isSupport) {
        supportGems.push(gem.name);
      } else if (!mainSkillId) {
        mainSkillId = gem.skillId;
      }
    }
  }

  // Flask detection
  const activeFlasks: string[] = [];
  for (const item of items) {
    if (FLASK_SLOTS.includes(item.slot)) {
      activeFlasks.push(item.name || item.base);
    }
  }

  // Weapon stats
  const weapon = extractWeaponStats(items, WEAPON1_SLOTS);
  const weapon2 = extractWeaponStats(items, WEAPON2_SLOTS);
  const isDualWield = weapon.aps > 0 && weapon2.aps > 0;

  return {
    level: stats.level,
    class_id: CLASS_IDS[stats.class_name] ?? 0,
    base_str: 0,
    base_dex: 0,
    base_int: 0,
    modifiers,
    allocated_keystones: keystones,
    main_skill_id: mainSkillId,
    ascendancy_name: stats.ascendancy,
    enemy_level: 83,
    enemy_fire_res: 0,
    enemy_cold_res: 0,
    enemy_lightning_res: 0,
    enemy_chaos_res: 0,
    enemy_is_boss: false,
    support_gems: supportGems,
    equipped_uniques: equippedUniques,
    active_flasks: activeFlasks,
    weapon_base_type: weapon.base,
    weapon_phys_min: weapon.physMin,
    weapon_phys_max: weapon.physMax,
    weapon_aps: weapon.aps,
    weapon_crit: weapon.crit,
    power_charges: 0,
    frenzy_charges: 0,
    endurance_charges: 0,
    on_full_life: true,
    on_low_life: false,
    is_leeching: false,
    have_fortify: false,
    have_killed_recently: false,
    conversion_phys_to_fire: 0,
    conversion_phys_to_cold: 0,
    conversion_phys_to_lightning: 0,
    conversion_phys_to_chaos: 0,
    minion_skill_id: "",
    mana_reserved_pct: stats.mana_reserved_percent ?? 0,
    life_reserved_pct: 0,
    impale_chance: 0,
    have_onslaught: false,
    have_tailwind: false,
    have_arcane_surge: false,
    weapon2_phys_min: weapon2.physMin,
    weapon2_phys_max: weapon2.physMax,
    weapon2_aps: weapon2.aps,
    weapon2_crit: weapon2.crit,
    is_dual_wield: isDualWield,
  };
}

export function rustOutputToBuildStats(
  base: BuildStats,
  rust: RustCalcOutput,
): BuildStats {
  return {
    ...base,
    life: rust.life,
    energy_shield: rust.energy_shield,
    mana: rust.mana,
    strength: rust.strength,
    dexterity: rust.dexterity,
    intelligence: rust.intelligence,
    armour: rust.armour,
    evasion: rust.evasion,
    fire_res: rust.fire_res,
    cold_res: rust.cold_res,
    lightning_res: rust.lightning_res,
    chaos_res: rust.chaos_res,
    block_chance: rust.block_chance,
    spell_block: rust.spell_block,
    total_dps: rust.total_dps,
    combined_dps: rust.combined_dps,
    crit_chance: rust.crit_chance,
    crit_multiplier: rust.crit_multiplier,
    attack_speed: rust.attack_speed,
    accuracy: rust.accuracy,
    hit_chance: rust.hit_chance,
    total_ehp: rust.total_ehp,
    bleed_dps: rust.bleed_dps,
    poison_dps: rust.poison_dps,
    ignite_dps: rust.ignite_dps,
    life_regen: rust.life_regen,
    mana_regen: rust.mana_regen,
    es_regen: rust.es_regen,
    evade_chance: rust.evade_chance,
    phys_reduction: rust.phys_reduction,
    suppression: rust.suppression,
  };
}

export interface EngineDivergence {
  stat: string;
  lua: number;
  rust: number;
  diff: number;
  pctDiff: number;
}

const COMPARE_STATS: Array<{ key: keyof BuildStats; rustKey: string; label: string }> = [
  { key: "life", rustKey: "life", label: "Life" },
  { key: "energy_shield", rustKey: "energy_shield", label: "Energy Shield" },
  { key: "mana", rustKey: "mana", label: "Mana" },
  { key: "strength", rustKey: "strength", label: "Strength" },
  { key: "dexterity", rustKey: "dexterity", label: "Dexterity" },
  { key: "intelligence", rustKey: "intelligence", label: "Intelligence" },
  { key: "armour", rustKey: "armour", label: "Armour" },
  { key: "evasion", rustKey: "evasion", label: "Evasion" },
  { key: "fire_res", rustKey: "fire_res", label: "Fire Res" },
  { key: "cold_res", rustKey: "cold_res", label: "Cold Res" },
  { key: "lightning_res", rustKey: "lightning_res", label: "Lightning Res" },
  { key: "chaos_res", rustKey: "chaos_res", label: "Chaos Res" },
  { key: "block_chance", rustKey: "block_chance", label: "Block" },
  { key: "spell_block", rustKey: "spell_block", label: "Spell Block" },
  { key: "total_dps", rustKey: "total_dps", label: "Total DPS" },
  { key: "crit_chance", rustKey: "crit_chance", label: "Crit Chance" },
  { key: "crit_multiplier", rustKey: "crit_multiplier", label: "Crit Multi" },
  { key: "attack_speed", rustKey: "attack_speed", label: "Attack Speed" },
  { key: "accuracy", rustKey: "accuracy", label: "Accuracy" },
  { key: "hit_chance", rustKey: "hit_chance", label: "Hit Chance" },
  { key: "total_ehp", rustKey: "total_ehp", label: "EHP" },
];

export function compareLuaVsRust(
  lua: BuildStats,
  rust: Record<string, number>,
): EngineDivergence[] {
  const results: EngineDivergence[] = [];

  for (const { key, rustKey, label } of COMPARE_STATS) {
    const luaVal = lua[key] as number;
    const rustVal = rust[rustKey] ?? 0;
    if (typeof luaVal !== "number") continue;

    const diff = rustVal - luaVal;
    const base = Math.abs(luaVal) > 0.01 ? luaVal : 1;
    const pctDiff = (diff / base) * 100;

    results.push({ stat: label, lua: luaVal, rust: rustVal, diff, pctDiff });
  }

  return results;
}
