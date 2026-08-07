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
      // WASM not built yet or not available - Lua engine handles calcs
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
