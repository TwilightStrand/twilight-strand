/* tslint:disable */
/* eslint-disable */
/**
 * A socket group links an active skill with its support gems.
 */
export interface SocketGroup {
    active_skill: string;
    support_gems: string[];
}

/**
 * Describes what happens to a passive node when affected by a timeless jewel.
 */
export interface TimelessTransform {
    /**
     * Node is a keystone that gets fully replaced
     */
    replaced_keystone: string | undefined;
    /**
     * Stat lines added to the node (for small passives and notables)
     */
    added_stats: string[];
    /**
     * Machine-readable stat keys (parallel to added_stats)
     */
    stat_keys: string[];
}

export interface BuildInput {
    level?: number;
    class_id?: number;
    base_str?: number;
    base_dex?: number;
    base_int?: number;
    modifiers?: Modifier[];
    allocated_keystones?: string[];
    main_skill_id?: string;
    main_skill_level?: number;
    ascendancy_name?: string;
    enemy_level?: number;
    enemy_fire_res?: number;
    enemy_cold_res?: number;
    enemy_lightning_res?: number;
    enemy_chaos_res?: number;
    enemy_is_boss?: boolean;
    support_gems?: string[];
    /**
     * Gem levels for each support gem, parallel to `support_gems`.
     * When shorter than support_gems, missing entries default to 20.
     */
    support_gem_levels?: number[];
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
    socket_groups?: SocketGroup[];
    stat_lines?: string[];
    gear_armour?: number;
    gear_evasion?: number;
    gear_es?: number;
    gear_block?: number;
    on_consecrated_ground?: boolean;
    enemy_intimidated?: boolean;
    enemy_unnerved?: boolean;
    have_phasing?: boolean;
    have_elusive?: boolean;
    enemy_hindered?: boolean;
    crit_in_past_8_seconds?: boolean;
    hit_recently_by_enemy?: boolean;
    used_skill_recently?: boolean;
    nearby_rare_or_unique?: boolean;
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
    full_dps: number;
    fire_res_max: number;
    cold_res_max: number;
    lightning_res_max: number;
    chaos_res_max: number;
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

/**
 * List all conqueror keystones for a given jewel type.
 * Returns a JSON array of { conqueror, keystone_name, stat_lines }.
 */
export function timeless_keystones(jewel_type: string): any;

/**
 * Get the valid seed range for a jewel type.
 * Returns [min, max] as a two-element array.
 */
export function timeless_seed_range(jewel_type: string): Uint32Array;

/**
 * Transform a passive node given a timeless jewel type, seed, and node ID.
 *
 * Returns a list of stat description lines that the node gains.
 * For keystones, returns the replacement keystone's stats.
 * For small passives and notables, returns the added stat lines.
 *
 * `jewel_type`: one of "Lethal Pride", "Brutal Restraint", "Militant Faith",
 *               "Elegant Hubris", "Glorious Vanity"
 * `seed`: the jewel's seed number
 * `node_id`: the passive tree node ID
 *
 * Defaults to treating the node as a small passive. For keystones and notables,
 * use `transform_node_full` instead.
 */
export function transform_node(jewel_type: string, seed: number, node_id: number): string[];

/**
 * Full transformation including keystone/notable handling.
 *
 * `node_type`: "small", "notable", or "keystone"
 * `conqueror`: required for keystones (e.g. "Kaom", "Rakiata")
 */
export function transform_node_full(jewel_type: string, seed: number, node_id: number, node_type: string, conqueror: string): any;

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
    readonly timeless_keystones: (a: number, b: number) => any;
    readonly timeless_seed_range: (a: number, b: number) => [number, number];
    readonly transform_node: (a: number, b: number, c: number, d: number) => [number, number];
    readonly transform_node_full: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => any;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __externref_drop_slice: (a: number, b: number) => void;
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
