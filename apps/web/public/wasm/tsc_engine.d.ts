/* tslint:disable */
/* eslint-disable */
export interface BuildInput {
    level?: number;
    class_id?: number;
    base_str?: number;
    base_dex?: number;
    base_int?: number;
    modifiers?: Modifier[];
    allocated_keystones?: string[];
    main_skill_id?: string;
    ascendancy_name?: string;
    enemy_level?: number;
    enemy_fire_res?: number;
    enemy_cold_res?: number;
    enemy_lightning_res?: number;
    enemy_chaos_res?: number;
    enemy_is_boss?: boolean;
    support_gems?: string[];
    equipped_uniques?: string[];
    active_flasks?: string[];
    weapon_base_type?: string;
    weapon_phys_min?: number;
    weapon_phys_max?: number;
    weapon_aps?: number;
    weapon_crit?: number;
    power_charges?: number;
    frenzy_charges?: number;
    endurance_charges?: number;
    on_full_life?: boolean;
    on_low_life?: boolean;
    is_leeching?: boolean;
    have_fortify?: boolean;
    have_killed_recently?: boolean;
    conversion_phys_to_fire?: number;
    conversion_phys_to_cold?: number;
    conversion_phys_to_lightning?: number;
    conversion_phys_to_chaos?: number;
    minion_skill_id?: string;
    mana_reserved_pct?: number;
    life_reserved_pct?: number;
    impale_chance?: number;
    have_onslaught?: boolean;
    have_tailwind?: boolean;
    have_arcane_surge?: boolean;
    weapon2_phys_min?: number;
    weapon2_phys_max?: number;
    weapon2_aps?: number;
    weapon2_crit?: number;
    is_dual_wield?: boolean;
    stat_lines?: string[];
    gear_armour?: number;
    gear_evasion?: number;
    gear_es?: number;
    gear_block?: number;
}

export interface BuildStats {
    total_dps: number;
    combined_dps: number;
    total_ehp: number;
    life: number;
    energy_shield: number;
    mana: number;
    strength: number;
    dexterity: number;
    intelligence: number;
    armour: number;
    evasion: number;
    evade_chance: number;
    block_chance: number;
    spell_block: number;
    suppression: number;
    phys_reduction: number;
    fire_res: number;
    cold_res: number;
    lightning_res: number;
    chaos_res: number;
    fire_res_max: number;
    cold_res_max: number;
    lightning_res_max: number;
    chaos_res_max: number;
    life_regen: number;
    mana_regen: number;
    crit_chance: number;
    crit_multiplier: number;
    attack_speed: number;
    hit_chance: number;
    accuracy: number;
    class_name: string;
    ascendancy: string;
    level: number;
    allocated_nodes: number[];
    main_socket_group: number;
}

export interface CalcOutput {
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

export interface DeltaResult {
    current: BuildStats;
    proposed: BuildStats;
}

export interface Modifier {
    stat: string;
    value: number;
    mod_type: string;
}


export class WasmEvaluator {
    free(): void;
    [Symbol.dispose](): void;
    evaluate(_allocated_nodes: Uint32Array): BuildStats;
    evaluate_delta(current_nodes: Uint32Array, proposed_nodes: Uint32Array): DeltaResult;
    constructor(xml: string);
}

export function evaluate_build(input: BuildInput): CalcOutput;

export function evaluate_build_xml(xml: string): BuildStats;

/**
 * Parse a single PoE stat description line into Modifiers (returned as JsValue).
 */
export function parse_single_stat(line: string): any;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_wasmevaluator_free: (a: number, b: number) => void;
    readonly evaluate_build: (a: any) => any;
    readonly evaluate_build_xml: (a: number, b: number) => [number, number, number];
    readonly parse_single_stat: (a: number, b: number) => any;
    readonly wasmevaluator_evaluate: (a: number, b: number, c: number) => [number, number, number];
    readonly wasmevaluator_evaluate_delta: (a: number, b: number, c: number, d: number, e: number) => [number, number, number];
    readonly wasmevaluator_new: (a: number, b: number) => [number, number, number];
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
