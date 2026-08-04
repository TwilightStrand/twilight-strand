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

export interface RustBuildInput {
  level: number;
  class_id: number;
  base_str: number;
  base_dex: number;
  base_int: number;
  modifiers: Array<{ stat: string; value: number; mod_type: string }>;
  allocated_keystones: string[];
  main_skill_id: string;
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
