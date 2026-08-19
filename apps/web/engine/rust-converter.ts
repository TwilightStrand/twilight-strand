import type { BuildStats, ItemData, SkillGroup } from "./types";
import type { RustBuildInput, RustCalcOutput, RustSocketGroup, TimelessJewelInput } from "./rust-bridge";
import type { JewelSocketEntry } from "./pob-xml-parser";
import type { TreeNode, TreeGroup } from "@/components/tree/tree-data";
import { parseClusterJewel } from "./cluster-jewel";
import { CLUSTER_NOTABLES } from "@/data/cluster-data.generated";

// Large radius squared (1800^2) used for timeless jewel node filtering
const LARGE_RADIUS_SQUARED = 1800 * 1800; // 3_240_000

const CLASS_IDS: Record<string, number> = {
  Scion: 0,
  Marauder: 1,
  Ranger: 2,
  Witch: 3,
  Duelist: 4,
  Templar: 5,
  Shadow: 6,
};

/** Compute a node's (x,y) position from its group + orbit placement. */
function calcNodePos(
  group: TreeGroup | undefined,
  orbit: number,
  orbitIndex: number,
  skillsPerOrbit: number[],
  orbitRadii: number[],
): { x: number; y: number } {
  if (!group) return { x: 0, y: 0 };
  if (orbit === 0) return { x: group.x, y: group.y };
  const nodesInOrbit = skillsPerOrbit[orbit] ?? 1;
  const radius = orbitRadii[orbit] ?? 0;
  const angle = (Math.PI * 2 * orbitIndex) / nodesInOrbit - Math.PI / 2;
  return {
    x: group.x + radius * Math.cos(angle),
    y: group.y + radius * Math.sin(angle),
  };
}

let treeNodeCache: Map<string, TreeNode> | null = null;
let treeFetchPromise: Promise<Map<string, TreeNode>> | null = null;

export async function ensureTreeData(): Promise<Map<string, TreeNode>> {
  if (treeNodeCache) return treeNodeCache;
  if (treeFetchPromise) return treeFetchPromise;

  treeFetchPromise = (async () => {
    const resp = await fetch("/data/tree/tree-3_29.json");
    if (!resp.ok) throw new Error(`Tree data fetch failed: ${resp.status}`);
    const raw = await resp.json();
    const rawGroups = raw.groups as Record<string, Record<string, unknown>>;
    const constants = raw.constants as { skillsPerOrbit: number[]; orbitRadii: number[] };

    // Build group lookup for position calculation
    const groups = new Map<string, TreeGroup>();
    for (const [gid, g] of Object.entries(rawGroups)) {
      groups.set(gid, {
        x: g.x as number,
        y: g.y as number,
        orbits: g.orbits as number[],
        nodes: g.nodes as string[],
      });
    }

    const nodes = new Map<string, TreeNode>();
    for (const [id, n] of Object.entries(raw.nodes as Record<string, Record<string, unknown>>)) {
      if (id === "root") continue;

      const groupData = groups.get(String(n.group));
      const orbit = n.orbit as number;
      const orbitIndex = n.orbitIndex as number;
      const pos = calcNodePos(groupData, orbit, orbitIndex, constants.skillsPerOrbit, constants.orbitRadii);

      nodes.set(id, {
        id,
        name: n.name as string | undefined,
        stats: n.stats as string[] | undefined,
        isKeystone: n.isKeystone as boolean | undefined,
        isNotable: n.isNotable as boolean | undefined,
        isMastery: n.isMastery as boolean | undefined,
        isJewelSocket: n.isJewelSocket as boolean | undefined,
        ascendancyName: n.ascendancyName as string | undefined,
        masteryEffects: n.masteryEffects as Array<{ effect: number; stats: string[] }> | undefined,
        group: n.group as number,
        orbit,
        orbitIndex,
        out: (n.out as string[]) || [],
        in: (n.in as string[]) || [],
        x: pos.x,
        y: pos.y,
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
const DURING_FLASK_EFFECT_RE = /\s+during (?:Flask )?Effect$/i;

const CURSE_NAMES = new Set([
  "Assassin's Mark", "Poacher's Mark", "Warlord's Mark", "Sniper's Mark",
  "Frostbite", "Elemental Weakness", "Conductivity", "Flammability",
  "Despair", "Punishment", "Enfeeble", "Temporal Chains", "Vulnerability",
]);

const GOLEM_NAMES = new Set([
  "Summon Chaos Golem", "Summon Stone Golem", "Summon Lightning Golem",
  "Summon Flame Golem", "Summon Ice Golem",
]);

const MINION_PREFIX_RE = /^(Golems|Minions|Zombies|Spectres|Skeletons|Sentinels of Purity) (have|deal|get|gain) /i;

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

// ---------------------------------------------------------------------------
// Timeless jewel detection
// ---------------------------------------------------------------------------

const TIMELESS_JEWEL_NAMES = new Set([
  "Glorious Vanity", "Lethal Pride", "Brutal Restraint",
  "Militant Faith", "Elegant Hubris",
]);

interface TimelessJewelInfo {
  jewelType: string;
  seed: number;
  conqueror: string;
}

/** Parse timeless jewel type, seed, and conqueror from the item's mod lines. */
function parseTimelessJewel(itemName: string, mods: string[]): TimelessJewelInfo | null {
  // Check item name against known timeless jewel names
  let jewelType = "";
  for (const name of TIMELESS_JEWEL_NAMES) {
    if (itemName.includes(name)) {
      jewelType = name;
      break;
    }
  }
  if (!jewelType) return null;

  // Extract seed and conqueror from mod text
  for (const mod of mods) {
    // Elegant Hubris: "Commissioned 27800 coins to commemorate Caspiro"
    let m = mod.match(/Commissioned\s+(\d+)\s+coins\s+to\s+commemorate\s+(\w+)/i);
    if (m) return { jewelType, seed: parseInt(m[1], 10), conqueror: m[2] };

    // Lethal Pride: "Bathed in the blood of X warriors under Y"
    m = mod.match(/Bathed\s+in\s+the\s+blood\s+of\s+(\d+)\s+warriors\s+under\s+(\w+)/i);
    if (m) return { jewelType, seed: parseInt(m[1], 10), conqueror: m[2] };

    // Brutal Restraint: "Denoted service of X dekhara in the name of Y"
    m = mod.match(/Denoted\s+service\s+of\s+(\d+)\s+dekhara\s+in\s+the\s+name\s+of\s+(\w+)/i);
    if (m) return { jewelType, seed: parseInt(m[1], 10), conqueror: m[2] };

    // Militant Faith: "Carved to glorify X new faithful converted by Y"
    m = mod.match(/Carved\s+to\s+glorify\s+(\d+)\s+new\s+faithful\s+converted\s+by\s+(\w+)/i);
    if (m) return { jewelType, seed: parseInt(m[1], 10), conqueror: m[2] };

    // Glorious Vanity: "Sacrificed in the name of Y" (seed is the first number in another mod)
    m = mod.match(/Sacrificed\s+in\s+the\s+name\s+of\s+(\w+)/i);
    if (m) {
      // Glorious Vanity uses "X sacrifices" pattern for seed
      const conqueror = m[1];
      for (const m2 of mods) {
        const seedMatch = m2.match(/(\d+)\s+sacrifices?/i);
        if (seedMatch) return { jewelType, seed: parseInt(seedMatch[1], 10), conqueror };
      }
      // Seed might be embedded in a different line pattern
      return { jewelType, seed: 0, conqueror };
    }
  }

  return null;
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
  jewelSockets?: JewelSocketEntry[],
): RustBuildInput {
  const statLines: string[] = [];
  const keystones: string[] = [];
  const equippedUniques: string[] = [];

  // Detect active auras, curses, and golems from skill groups
  const activeAuras = new Set<string>();
  const activeAuraData = new Map<string, number>();
  const activeCurseData = new Map<string, number>();
  const activeGolemData = new Map<string, number>();
  for (const group of skills) {
    if (!group.enabled) continue;
    for (const gem of group.gems) {
      if (!gem.enabled) continue;
      if (AURA_NAMES.has(gem.name)) {
        activeAuras.add(gem.name.toLowerCase());
        activeAuraData.set(gem.name, gem.level || 20);
      }
      if (CURSE_NAMES.has(gem.name)) {
        activeCurseData.set(gem.name, gem.level || 20);
      }
      if (GOLEM_NAMES.has(gem.name)) {
        activeGolemData.set(gem.name, gem.level || 20);
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

    const isFlaskItem = FLASK_SLOTS.includes(item.slot);

    for (const mod of item.mods) {
      let line = mod;
      const affectedMatch = mod.match(/while affected by (.+)$/i);
      if (affectedMatch) {
        const aura = affectedMatch[1].trim().toLowerCase();
        if (!activeAuras.has(aura)) continue;
        line = mod.replace(WHILE_AFFECTED_RE, "");
      }

      // Strip "during Effect" / "during Flask Effect" suffix from flask mods
      if (isFlaskItem) {
        line = line.replace(DURING_FLASK_EFFECT_RE, "");
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
  // When a node has an override (Tattoo/Runegraft/Timeless Jewel), use the
  // override stats instead of the original tree node stats.
  for (const nodeId of stats.allocated_nodes) {
    const node = treeNodes.get(String(nodeId));
    if (!node) continue;

    const overrideStats = stats.node_overrides?.[String(nodeId)];
    if (overrideStats) {
      for (const statLine of overrideStats) {
        statLines.push(statLine);
      }
    } else {
      if (node.isKeystone && node.name) {
        keystones.push(node.name);
      }

      if (node.stats) {
        for (const statLine of node.stats) {
          statLines.push(statLine);
        }
      }
    }
  }

  // Resolve mastery effects to stat lines
  if (stats.mastery_effects) {
    for (const { nodeId, effectId } of stats.mastery_effects) {
      const node = treeNodes.get(String(nodeId));
      if (!node?.masteryEffects) continue;
      const entry = node.masteryEffects.find(e => e.effect === effectId);
      if (entry) {
        for (const stat of entry.stats) {
          statLines.push(stat);
        }
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
  const isDualWield = weapon.aps > 0 && weapon2.aps > 0 && gearBlock === 0;

  // Filter out minion-specific stat lines the Rust engine can't process
  const filteredStatLines = statLines.filter(s => !MINION_PREFIX_RE.test(s));

  // Map config overrides to Rust engine boolean fields
  const cfg = config ?? {};
  const cfgBool = (key: string): boolean => cfg[key] === true;

  // Detect timeless jewels socketed in the passive tree
  const timelessJewels: TimelessJewelInput[] = [];
  if (jewelSockets && jewelSockets.length > 0) {
    // Build itemId -> item lookup for tree jewels
    const itemIdToItem = new Map<string, ItemData>();
    for (const item of items) {
      // Items parsed from XML have their IDs in the slot system; match by slot name
      // which was set to "TreeJewel N" during parsing
      if (item.slot.startsWith("TreeJewel")) {
        // Find which itemId this corresponds to by matching order
        for (const js of jewelSockets) {
          if (!itemIdToItem.has(js.itemId)) {
            itemIdToItem.set(js.itemId, item);
            break;
          }
        }
      }
    }

    // Also try matching by iterating all items and jewelSockets in order
    // The XML parser assigns "TreeJewel 1", "TreeJewel 2", etc. in Socket order
    const treeJewelItems = items.filter(i => i.slot.startsWith("TreeJewel"));
    const socketsSorted = jewelSockets.slice().sort((a, b) => {
      // Match the order used in extractItems (sequential)
      return parseInt(a.itemId) - parseInt(b.itemId);
    });

    for (let i = 0; i < treeJewelItems.length && i < socketsSorted.length; i++) {
      const item = treeJewelItems[i];
      const socket = socketsSorted[i];
      const parsed = parseTimelessJewel(item.name, item.mods);
      if (!parsed || parsed.seed === 0) continue;

      // Look up the jewel socket's position for radius filtering
      const socketNode = treeNodes.get(String(socket.nodeId));
      const socketX = socketNode?.x ?? 0;
      const socketY = socketNode?.y ?? 0;

      // Gather allocated nodes within Large radius (1800 units) of the socket
      const affectedNodes: Array<{ node_id: number; node_type: string; original_name: string }> = [];
      for (const nodeId of stats.allocated_nodes) {
        const node = treeNodes.get(String(nodeId));
        if (!node) continue;
        if (node.isMastery) continue;
        if (node.isJewelSocket) continue;
        if (node.ascendancyName) continue;
        // Skip nodes that already have overrides (e.g., from PoB's own timeless calculation)
        if (stats.node_overrides?.[String(nodeId)]) continue;

        // Euclidean distance check: only include nodes within Large radius
        const dx = node.x - socketX;
        const dy = node.y - socketY;
        if (dx * dx + dy * dy > LARGE_RADIUS_SQUARED) continue;

        let nodeType = "small";
        if (node.isKeystone) nodeType = "keystone";
        else if (node.isNotable) nodeType = "notable";

        affectedNodes.push({
          node_id: nodeId,
          node_type: nodeType,
          original_name: node.name ?? "",
        });
      }

      timelessJewels.push({
        jewel_type: parsed.jewelType,
        seed: parsed.seed,
        conqueror: parsed.conqueror,
        affected_nodes: affectedNodes,
      });
    }
  }

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
    active_golems: Array.from(activeGolemData).map(([name, gem_level]) => ({ name, gem_level })),
    active_auras: Array.from(activeAuraData).map(([name, gem_level]) => ({ name, gem_level })),
    active_curses: Array.from(activeCurseData).map(([name, gem_level]) => ({ name, gem_level })),
    timeless_jewels: timelessJewels,
    stat_lines: filteredStatLines,
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

