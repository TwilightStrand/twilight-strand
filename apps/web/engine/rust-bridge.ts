/* eslint-disable @typescript-eslint/no-explicit-any */

let wasmModule: any = null;
let initialized = false;
let initPromise: Promise<void> | null = null;

export async function initRustEngine(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Dynamic fetch to avoid TS module resolution errors - WASM may not be built yet
      const url = "/wasm/tsc_engine.js";
      const mod = await (Function("url", "return import(url)")(url) as Promise<any>);
      await mod.default();
      wasmModule = mod;
      initialized = true;
    } catch {
      // WASM not built yet or not available
    }
  })();

  return initPromise;
}

export function isRustEngineReady(): boolean {
  return initialized && wasmModule !== null;
}

export interface RustModifier {
  stat: string;
  value: number;
  mod_type: string;
}

export interface RustBuildInput {
  level: number;
  class_id: number;
  base_str: number;
  base_dex: number;
  base_int: number;
  modifiers: RustModifier[];
  allocated_keystones: string[];
  main_skill_id: string;
  ascendancy_name: string;
  enemy_level: number;
  enemy_fire_res: number;
  enemy_cold_res: number;
  enemy_lightning_res: number;
  enemy_chaos_res: number;
  enemy_is_boss: boolean;
  support_gems: string[];
  equipped_uniques: string[];
  active_flasks: string[];
  weapon_base_type: string;
  weapon_phys_min: number;
  weapon_phys_max: number;
  weapon_aps: number;
  weapon_crit: number;
  power_charges: number;
  frenzy_charges: number;
  endurance_charges: number;
  on_full_life: boolean;
  on_low_life: boolean;
  is_leeching: boolean;
  have_fortify: boolean;
  have_killed_recently: boolean;
  conversion_phys_to_fire: number;
  conversion_phys_to_cold: number;
  conversion_phys_to_lightning: number;
  conversion_phys_to_chaos: number;
  minion_skill_id: string;
  mana_reserved_pct: number;
  life_reserved_pct: number;
  impale_chance: number;
  have_onslaught: boolean;
  have_tailwind: boolean;
  have_arcane_surge: boolean;
  weapon2_phys_min: number;
  weapon2_phys_max: number;
  weapon2_aps: number;
  weapon2_crit: number;
  is_dual_wield: boolean;
  stat_lines: string[];
  gear_armour: number;
  gear_evasion: number;
  gear_es: number;
  gear_block: number;
  main_skill_level: number;
  support_gem_levels: number[];
  socket_groups: RustSocketGroup[];
  on_consecrated_ground: boolean;
  enemy_intimidated: boolean;
  enemy_unnerved: boolean;
  have_phasing: boolean;
  have_elusive: boolean;
  enemy_hindered: boolean;
  crit_in_past_8_seconds: boolean;
  hit_recently_by_enemy: boolean;
  used_skill_recently: boolean;
  nearby_rare_or_unique: boolean;
  active_golems: Array<{ name: string; gem_level: number }>;
  active_auras: Array<{ name: string; gem_level: number }>;
  active_curses: Array<{ name: string; gem_level: number }>;
  timeless_jewels: TimelessJewelInput[];
}

export interface RustSocketGroup {
  active_skill: string;
  support_gems: string[];
}

export interface TimelessJewelInput {
  jewel_type: string;
  seed: number;
  conqueror: string;
  affected_nodes: Array<{ node_id: number; node_type: string; original_name: string }>;
}

export interface RustCalcOutput {
  life: number;
  energy_shield: number;
  mana: number;
  strength: number;
  dexterity: number;
  intelligence: number;
  armour: number;
  evasion: number;
  fire_res: number;
  cold_res: number;
  lightning_res: number;
  chaos_res: number;
  block_chance: number;
  spell_block: number;
  total_dps: number;
  crit_chance: number;
  crit_multiplier: number;
  attack_speed: number;
  accuracy: number;
  hit_chance: number;
  total_ehp: number;
  bleed_dps: number;
  poison_dps: number;
  ignite_dps: number;
  combined_dps: number;
  life_regen: number;
  mana_regen: number;
  es_regen: number;
  evade_chance: number;
  phys_reduction: number;
  suppression: number;
  trigger_rate: number;
  total_dps_with_minions: number;
  mana_unreserved: number;
  life_unreserved: number;
  mana_reserved_percent: number;
  life_leech_rate: number;
  es_leech_rate: number;
  impale_dps: number;
  ward: number;
  es_recharge_rate: number;
  full_dps: number;
  fire_res_max: number;
  cold_res_max: number;
  lightning_res_max: number;
  chaos_res_max: number;
}

export function defaultRustInput(overrides?: Partial<RustBuildInput>): RustBuildInput {
  return {
    level: 1, class_id: 0, base_str: 20, base_dex: 20, base_int: 20,
    modifiers: [], allocated_keystones: [], main_skill_id: "",
    ascendancy_name: "", enemy_level: 83,
    enemy_fire_res: 0, enemy_cold_res: 0, enemy_lightning_res: 0,
    enemy_chaos_res: 0, enemy_is_boss: false,
    support_gems: [], equipped_uniques: [], active_flasks: [],
    weapon_base_type: "", weapon_phys_min: 0, weapon_phys_max: 0,
    weapon_aps: 0, weapon_crit: 0,
    power_charges: 0, frenzy_charges: 0, endurance_charges: 0,
    on_full_life: false, on_low_life: false, is_leeching: false,
    have_fortify: false, have_killed_recently: false,
    conversion_phys_to_fire: 0, conversion_phys_to_cold: 0,
    conversion_phys_to_lightning: 0, conversion_phys_to_chaos: 0,
    minion_skill_id: "", mana_reserved_pct: 0, life_reserved_pct: 0,
    impale_chance: 0, have_onslaught: false, have_tailwind: false,
    have_arcane_surge: false,
    weapon2_phys_min: 0, weapon2_phys_max: 0, weapon2_aps: 0, weapon2_crit: 0,
    is_dual_wield: false,
    stat_lines: [],
    gear_armour: 0,
    gear_evasion: 0,
    gear_es: 0,
    gear_block: 0,
    main_skill_level: 20,
    support_gem_levels: [],
    socket_groups: [],
    on_consecrated_ground: false,
    enemy_intimidated: false,
    enemy_unnerved: false,
    have_phasing: false,
    have_elusive: false,
    enemy_hindered: false,
    crit_in_past_8_seconds: false,
    hit_recently_by_enemy: false,
    used_skill_recently: false,
    nearby_rare_or_unique: false,
    active_golems: [],
    active_auras: [],
    active_curses: [],
    timeless_jewels: [],
    ...overrides,
  };
}

export function evaluateBuildRust(input: RustBuildInput): RustCalcOutput | null {
  if (!wasmModule) return null;
  try {
    return wasmModule.evaluate_build(input);
  } catch (e) {
    console.warn("[rust-engine] evaluate failed:", e);
    return null;
  }
}

export function parseStatLine(line: string): Array<{ stat: string; value: number; mod_type: string }> {
  if (!wasmModule) return [];
  try {
    const result = wasmModule.parse_single_stat(line);
    return result ? JSON.parse(result) : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Timeless jewel functions
// ---------------------------------------------------------------------------

export interface TimelessTransformResult {
  replaced_keystone: string | undefined;
  added_stats: string[];
  stat_keys: string[];
}

export interface TimelessKeystoneEntry {
  conqueror: string;
  keystone_name: string;
  stat_lines: string[];
}

/** Get [min, max] seed range for a jewel type. */
export function timelessSeedRange(jewelType: string): [number, number] | null {
  if (!wasmModule) return null;
  try {
    const arr: Uint32Array = wasmModule.timeless_seed_range(jewelType);
    if (!arr || arr.length < 2) return null;
    return [arr[0], arr[1]];
  } catch {
    return null;
  }
}

/** List conqueror keystones for a jewel type. */
export function timelessKeystones(jewelType: string): TimelessKeystoneEntry[] {
  if (!wasmModule) return [];
  try {
    return wasmModule.timeless_keystones(jewelType) ?? [];
  } catch {
    return [];
  }
}

/** Transform a single node (full version with node type and conqueror). */
export function transformNodeFull(
  jewelType: string,
  seed: number,
  nodeId: number,
  nodeType: "small" | "notable" | "keystone",
  conqueror: string,
): TimelessTransformResult | null {
  if (!wasmModule) return null;
  try {
    return wasmModule.transform_node_full(jewelType, seed, nodeId, nodeType, conqueror) ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Timeless jewel LUT lazy loading
// ---------------------------------------------------------------------------

/** Map jewel type name to binary LUT filename. */
const JEWEL_TYPE_TO_FILE: Record<string, string> = {
  "Lethal Pride": "LethalPride.bin",
  "Brutal Restraint": "BrutalRestraint.bin",
  "Militant Faith": "MilitantFaith.bin",
  "Elegant Hubris": "ElegantHubris.bin",
};

const loadedLuts = new Set<string>();
const pendingLoads = new Map<string, Promise<boolean>>();

/** Check whether a LUT is already loaded in the WASM engine. */
export function hasTimelessLut(jewelType: string): boolean {
  if (!wasmModule) return false;
  try {
    return wasmModule.has_timeless_lut(jewelType) ?? false;
  } catch {
    return false;
  }
}

/**
 * Fetch and load binary LUT data for the given timeless jewel types.
 *
 * Fetches are deduplicated and cached; calling this multiple times with the
 * same jewel type is cheap. Glorious Vanity is skipped (variable-length
 * format, not yet supported). If a fetch fails the engine falls back to
 * hash-based transforms automatically.
 */
export async function ensureTimelessLuts(jewelTypes: string[]): Promise<void> {
  if (!wasmModule) return;

  const loads: Promise<boolean>[] = [];

  for (const jt of jewelTypes) {
    if (loadedLuts.has(jt)) continue;

    const fileName = JEWEL_TYPE_TO_FILE[jt];
    if (!fileName) continue; // GV or unknown type

    // Deduplicate concurrent fetches for the same type
    let pending = pendingLoads.get(jt);
    if (!pending) {
      pending = (async (): Promise<boolean> => {
        try {
          const resp = await fetch(`/data/timeless/${fileName}`);
          if (!resp.ok) return false;
          const data = new Uint8Array(await resp.arrayBuffer());
          const accepted: boolean = wasmModule.load_timeless_lut(jt, data);
          if (accepted) {
            loadedLuts.add(jt);
          }
          return accepted;
        } catch {
          return false;
        } finally {
          pendingLoads.delete(jt);
        }
      })();
      pendingLoads.set(jt, pending);
    }

    loads.push(pending);
  }

  await Promise.all(loads);
}
