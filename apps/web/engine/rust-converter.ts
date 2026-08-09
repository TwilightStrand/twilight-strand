import type { BuildStats, ItemData, SkillGroup } from "./types";
import type { RustBuildInput, RustCalcOutput, RustSocketGroup } from "./rust-bridge";
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

function isLocalESMod(lower: string): boolean {
  if (!lower.includes("energy shield")) return false;
  // Keep these as global mods (not local defence mods)
  if (lower.includes("recharge") || lower.includes("leech") || lower.includes("regenerate")
    || lower.includes("on kill") || lower.includes("as extra") || lower.includes("gain")
    || lower.includes("recover") || lower.includes("per second") || lower.includes("nearby")) return false;
  // Local defence mods: flat ES, % increased ES, % more ES
  return lower.includes("to maximum") || lower.includes("increased") || lower.includes("more");
}

function isLocalArmourMod(lower: string): boolean {
  if (!lower.includes("armour")) return false;
  if (lower.includes("penetrate") || lower.includes("ignore") || lower.includes("nearby")) return false;
  return lower.includes("to armour") || lower.includes("increased armour") || lower.includes("more armour")
    || lower.includes("additional armour");
}

function isLocalEvasionMod(lower: string): boolean {
  if (!lower.includes("evasion")) return false;
  if (lower.includes("chance to evade") || lower.includes("nearby")) return false;
  return lower.includes("to evasion") || lower.includes("increased evasion") || lower.includes("more evasion")
    || lower.includes("additional evasion");
}

function bossEnemyRes(boss: string | undefined, element: string): number {
  if (!boss || boss === "None" || boss === "") return 0;
  const isPinnacle = boss.toLowerCase().includes("pinnacle");
  if (element === "chaos") return isPinnacle ? 25 : 0;
  return isPinnacle ? 40 : 0;
}

export function convertToRustInput(
  stats: BuildStats,
  items: ItemData[],
  skills: SkillGroup[],
  treeNodes: Map<string, TreeNode>,
  config?: Record<string, string | boolean | number>,
): RustBuildInput {
  const statLines: string[] = [];
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

  // Item mods → stat lines + unique detection + cluster jewel resolution
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
              statLines.push(stat);
            }
          }
        } else if (node.type === "small") {
          for (const stat of node.stats) {
            statLines.push(stat);
          }
        }
      }
      continue;
    }

    // Local defence mods are already baked into the item's baseES/baseArmour/baseEvasion
    // values parsed from the "Energy Shield: X" headers. Skip them to avoid double-counting.
    const hasLocalES = (item.baseES ?? 0) > 0;
    const hasLocalArmour = (item.baseArmour ?? 0) > 0;
    const hasLocalEvasion = (item.baseEvasion ?? 0) > 0;

    for (const mod of item.mods) {
      let line = mod;
      const affectedMatch = mod.match(/while affected by (.+)$/i);
      if (affectedMatch) {
        const aura = affectedMatch[1].trim().toLowerCase();
        if (!activeAuras.has(aura)) continue;
        line = mod.replace(WHILE_AFFECTED_RE, "");
      }

      // Filter local defence mods from items that have computed defence headers.
      // gear_es/gear_armour/gear_evasion already include local flat + local %,
      // so passing those mods as stat_lines would double-count them.
      const lower = line.toLowerCase();
      if (hasLocalES && isLocalESMod(lower)) continue;
      if (hasLocalArmour && isLocalArmourMod(lower)) continue;
      if (hasLocalEvasion && isLocalEvasionMod(lower)) continue;

      statLines.push(line);
    }
  }

  // Tree node stats → stat lines + keystone detection
  for (const nodeId of stats.allocated_nodes) {
    const node = treeNodes.get(String(nodeId));
    if (!node) continue;

    if (node.isKeystone && node.name) {
      keystones.push(node.name);
    }

    if (node.stats) {
      for (const statLine of node.stats) {
        statLines.push(statLine);
      }
    }
  }

  // Main skill + support gems from skill groups
  const mainIndex = Math.max(0, stats.main_socket_group - 1);
  const mainGroup = skills[mainIndex];
  let mainSkillId = "";
  let mainSkillLevel = 20;
  const supportGems: string[] = [];
  const supportGemLevels: number[] = [];

  if (mainGroup) {
    for (const gem of mainGroup.gems) {
      if (!gem.enabled) continue;
      if (gem.isSupport) {
        supportGems.push(gem.name);
        supportGemLevels.push(gem.level || 20);
      } else if (!mainSkillId) {
        mainSkillId = gem.skillId;
        mainSkillLevel = gem.level || 20;
      }
    }
  }

  // Build socket_groups from all enabled skill groups
  const socketGroups: RustSocketGroup[] = [];
  for (const group of skills) {
    if (!group.enabled) continue;
    let activeSkill = "";
    const groupSupports: string[] = [];
    for (const gem of group.gems) {
      if (!gem.enabled) continue;
      if (gem.isSupport) {
        groupSupports.push(gem.name);
      } else if (!activeSkill) {
        activeSkill = gem.skillId;
      }
    }
    if (activeSkill) {
      socketGroups.push({ active_skill: activeSkill, support_gems: groupSupports });
    }
  }

  // Flask detection
  const activeFlasks: string[] = [];
  for (const item of items) {
    if (FLASK_SLOTS.includes(item.slot)) {
      activeFlasks.push(item.name || item.base);
    }
  }

  // Gear defence stats (pre-computed values from XML, local mods already applied)
  let gearArmour = 0;
  let gearEvasion = 0;
  let gearES = 0;
  let gearBlock = 0;
  for (const item of items) {
    if (FLASK_SLOTS.includes(item.slot)) continue;
    gearArmour += item.baseArmour ?? 0;
    gearEvasion += item.baseEvasion ?? 0;
    gearES += item.baseES ?? 0;
    gearBlock += item.baseBlock ?? 0;
  }

  // Weapon stats
  const weapon = extractWeaponStats(items, WEAPON1_SLOTS);
  const weapon2 = extractWeaponStats(items, WEAPON2_SLOTS);
  const isDualWield = weapon.aps > 0 && weapon2.aps > 0;

  // Map config overrides to Rust engine boolean fields
  const cfg = config ?? {};
  const cfgBool = (key: string): boolean => cfg[key] === true;

  return {
    level: stats.level,
    class_id: CLASS_IDS[stats.class_name] ?? 0,
    base_str: 0,
    base_dex: 0,
    base_int: 0,
    modifiers: [],
    allocated_keystones: keystones,
    main_skill_id: mainSkillId,
    main_skill_level: mainSkillLevel,
    ascendancy_name: stats.ascendancy,
    enemy_level: 83,
    enemy_fire_res: bossEnemyRes(cfg["boss"] as string | undefined, "fire"),
    enemy_cold_res: bossEnemyRes(cfg["boss"] as string | undefined, "cold"),
    enemy_lightning_res: bossEnemyRes(cfg["boss"] as string | undefined, "lightning"),
    enemy_chaos_res: bossEnemyRes(cfg["boss"] as string | undefined, "chaos"),
    enemy_is_boss: cfg["boss"] !== undefined && cfg["boss"] !== "None" && cfg["boss"] !== "",
    support_gems: supportGems,
    support_gem_levels: supportGemLevels,
    equipped_uniques: equippedUniques,
    active_flasks: activeFlasks,
    weapon_base_type: weapon.base,
    weapon_phys_min: weapon.physMin,
    weapon_phys_max: weapon.physMax,
    weapon_aps: weapon.aps,
    weapon_crit: weapon.crit,
    power_charges: cfgBool("usePowerCharges") ? Number(cfg["powerCharges"] ?? 3) : 0,
    frenzy_charges: cfgBool("useFrenzyCharges") ? Number(cfg["frenzyCharges"] ?? 3) : 0,
    endurance_charges: cfgBool("useEnduranceCharges") ? Number(cfg["enduranceCharges"] ?? 3) : 0,
    on_full_life: cfgBool("conditionFullLife") || !cfgBool("conditionLowLife"),
    on_low_life: cfgBool("conditionLowLife"),
    is_leeching: cfgBool("conditionLeeching"),
    have_fortify: cfgBool("buffFortification"),
    have_killed_recently: cfgBool("conditionKilledRecently"),
    conversion_phys_to_fire: 0,
    conversion_phys_to_cold: 0,
    conversion_phys_to_lightning: 0,
    conversion_phys_to_chaos: 0,
    minion_skill_id: "",
    mana_reserved_pct: stats.mana_reserved_percent ?? 0,
    life_reserved_pct: 0,
    impale_chance: 0,
    have_onslaught: cfgBool("buffOnslaught"),
    have_tailwind: cfgBool("buffTailwind"),
    have_arcane_surge: cfgBool("buffArcaneSurge"),
    weapon2_phys_min: weapon2.physMin,
    weapon2_phys_max: weapon2.physMax,
    weapon2_aps: weapon2.aps,
    weapon2_crit: weapon2.crit,
    is_dual_wield: isDualWield,
    socket_groups: socketGroups,
    stat_lines: statLines,
    gear_armour: gearArmour,
    gear_evasion: gearEvasion,
    gear_es: gearES,
    gear_block: gearBlock,
    on_consecrated_ground: cfgBool("conditionOnConsecratedGround"),
    enemy_intimidated: cfgBool("conditionEnemyIntimidated") || cfgBool("conditionChampionIntimidate"),
    enemy_unnerved: cfgBool("conditionEnemyUnnerved"),
    have_phasing: cfgBool("buffPhasing"),
    have_elusive: cfgBool("buffElusive"),
    enemy_hindered: cfgBool("conditionEnemyHindered"),
    crit_in_past_8_seconds: false,
    hit_recently_by_enemy: cfgBool("conditionBeenHitRecently"),
    used_skill_recently: cfgBool("conditionUsedSkillRecently"),
    nearby_rare_or_unique: false,
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
    total_dps_with_minions: rust.total_dps_with_minions ?? rust.total_dps,
    mana_unreserved: rust.mana_unreserved ?? base.mana_unreserved,
    life_unreserved: rust.life_unreserved ?? base.life_unreserved,
    mana_reserved_percent: rust.mana_reserved_percent ?? base.mana_reserved_percent,
    life_leech_rate: rust.life_leech_rate ?? 0,
    es_leech_rate: rust.es_leech_rate ?? 0,
    impale_dps: rust.impale_dps ?? 0,
    ward: rust.ward ?? 0,
    es_recharge_rate: rust.es_recharge_rate ?? 0,
    full_dps: rust.full_dps ?? rust.combined_dps,
    fire_res_max: rust.fire_res_max ?? base.fire_res_max,
    cold_res_max: rust.cold_res_max ?? base.cold_res_max,
    lightning_res_max: rust.lightning_res_max ?? base.lightning_res_max,
    chaos_res_max: rust.chaos_res_max ?? base.chaos_res_max,
  };
}

