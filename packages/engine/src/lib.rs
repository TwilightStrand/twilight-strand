use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use tsify_next::Tsify;
use std::collections::HashMap;

pub mod damage;

mod gems;
pub use gems::{lookup_gem, avg_base_damage, GemData, DamageType, GemTag};

pub mod stat_parser;
pub mod node_power;
pub mod pathfinder;
pub mod supports;

#[cfg(test)]
mod integration_tests;
pub mod keystones;
pub mod ascendancy;
pub mod weapons;
pub mod minions;
pub use weapons::{calc_weapon_dps, find_weapon_base, WeaponDps};
pub use stat_parser::{parse_stat_line, parse_stats};
pub use supports::get_support_modifiers;

// ---------------------------------------------------------------------------
// Public types shared with TypeScript via tsify
// ---------------------------------------------------------------------------

#[derive(Tsify, Serialize, Deserialize, Clone, Default, Debug)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct BuildStats {
    pub total_dps: f64,
    pub combined_dps: f64,
    pub total_ehp: f64,
    pub life: f64,
    pub energy_shield: f64,
    pub mana: f64,
    pub strength: f64,
    pub dexterity: f64,
    pub intelligence: f64,
    pub armour: f64,
    pub evasion: f64,
    pub evade_chance: f64,
    pub block_chance: f64,
    pub spell_block: f64,
    pub suppression: f64,
    pub phys_reduction: f64,
    pub fire_res: f64,
    pub cold_res: f64,
    pub lightning_res: f64,
    pub chaos_res: f64,
    pub fire_res_max: f64,
    pub cold_res_max: f64,
    pub lightning_res_max: f64,
    pub chaos_res_max: f64,
    pub life_regen: f64,
    pub mana_regen: f64,
    pub crit_chance: f64,
    pub crit_multiplier: f64,
    pub attack_speed: f64,
    pub hit_chance: f64,
    pub accuracy: f64,
    pub class_name: String,
    pub ascendancy: String,
    pub level: f64,
    pub allocated_nodes: Vec<u32>,
    pub main_socket_group: u32,
}

#[derive(Tsify, Serialize, Deserialize, Clone, Debug)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct DeltaResult {
    pub current: BuildStats,
    pub proposed: BuildStats,
}

#[derive(Tsify, Serialize, Deserialize, Clone, Debug)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct Modifier {
    pub stat: String,
    pub value: f64,
    pub mod_type: String, // "flat", "increased", "more"
}

#[derive(Tsify, Serialize, Deserialize, Clone, Debug, Default)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct BuildInput {
    pub level: u32,
    pub class_id: u32,
    pub base_str: u32,
    pub base_dex: u32,
    pub base_int: u32,
    pub modifiers: Vec<Modifier>,
    pub allocated_keystones: Vec<String>,
    #[serde(default)]
    pub main_skill_id: String,
    #[serde(default)]
    pub ascendancy_name: String,
    #[serde(default = "default_enemy_level")]
    pub enemy_level: u32,
    #[serde(default)]
    pub enemy_fire_res: f64,
    #[serde(default)]
    pub enemy_cold_res: f64,
    #[serde(default)]
    pub enemy_lightning_res: f64,
    #[serde(default)]
    pub enemy_chaos_res: f64,
    #[serde(default)]
    pub enemy_is_boss: bool,
}

fn default_enemy_level() -> u32 { 83 }

/// Returns (fire, cold, lightning, chaos) resistances for boss types
pub fn boss_resistances(boss_type: &str) -> (f64, f64, f64, f64) {
    match boss_type {
        "pinnacle" | "Pinnacle Boss" => (40.0, 40.0, 40.0, 25.0),
        "uber" | "Uber Pinnacle Boss" => (50.0, 50.0, 50.0, 30.0),
        "shaper" | "Shaper/Elder" => (40.0, 40.0, 40.0, 25.0),
        "sirus" | "Sirus" => (40.0, 40.0, 40.0, 25.0),
        _ => (0.0, 0.0, 0.0, 0.0),
    }
}

/// Apply enemy resistance and penetration to get effective damage multiplier
pub fn apply_resistance(enemy_res: f64, penetration: f64) -> f64 {
    let effective_res = (enemy_res - penetration).clamp(-100.0, 90.0);
    1.0 - effective_res / 100.0
}

#[derive(Tsify, Serialize, Deserialize, Clone, Debug)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct CalcOutput {
    pub life: f64,
    pub energy_shield: f64,
    pub mana: f64,
    pub strength: f64,
    pub dexterity: f64,
    pub intelligence: f64,
    pub armour: f64,
    pub evasion: f64,
    pub fire_res: f64,
    pub cold_res: f64,
    pub lightning_res: f64,
    pub chaos_res: f64,
    pub block_chance: f64,
    pub spell_block: f64,
    pub total_dps: f64,
    pub crit_chance: f64,
    pub crit_multiplier: f64,
    pub attack_speed: f64,
    pub accuracy: f64,
    pub hit_chance: f64,
    pub total_ehp: f64,
}

// ---------------------------------------------------------------------------
// Modifier aggregation
// ---------------------------------------------------------------------------

/// Buckets for a single stat: (sum_flat, sum_increased_pct, product_of_more)
type ModBuckets = (f64, f64, f64);

fn aggregate_mods(modifiers: &[Modifier]) -> HashMap<String, ModBuckets> {
    let mut agg: HashMap<String, ModBuckets> = HashMap::new();
    for m in modifiers {
        let entry = agg.entry(m.stat.clone()).or_insert((0.0, 0.0, 1.0));
        match m.mod_type.as_str() {
            "flat" => entry.0 += m.value,
            "increased" => entry.1 += m.value,
            "more" => entry.2 *= 1.0 + m.value / 100.0,
            _ => {}
        }
    }
    agg
}

fn get_buckets(agg: &HashMap<String, ModBuckets>, stat: &str) -> ModBuckets {
    agg.get(stat).cloned().unwrap_or((0.0, 0.0, 1.0))
}

// ---------------------------------------------------------------------------
// Stat calculation helpers – mirrors PoE game mechanics
// ---------------------------------------------------------------------------

/// Generic stat formula: (base + flat) * (1 + increased/100) * more
fn calc_stat(base: f64, flat: f64, increased: f64, more: f64) -> f64 {
    (base + flat) * (1.0 + increased / 100.0) * more
}

/// Life = (base_life + (level-1)*12 + str/2 + flat) * (1+inc/100) * more
fn calc_life(level: u32, strength: f64, agg: &HashMap<String, ModBuckets>) -> f64 {
    let base = 38.0 + (level as f64 - 1.0) * 12.0 + (strength / 2.0).floor();
    let (flat, inc, more) = get_buckets(agg, "Life");
    calc_stat(base, flat, inc, more).round().max(1.0)
}

/// Mana = (base_mana + (level-1)*6 + int/2 + flat) * (1+inc/100) * more
fn calc_mana(level: u32, intelligence: f64, agg: &HashMap<String, ModBuckets>) -> f64 {
    let base = 34.0 + (level as f64 - 1.0) * 6.0 + (intelligence / 2.0).floor();
    let (flat, inc, more) = get_buckets(agg, "Mana");
    calc_stat(base, flat, inc, more).round().max(0.0)
}

/// ES = (flat_from_gear + flat_mods) * (1 + inc + int_bonus) * more
fn calc_es(agg: &HashMap<String, ModBuckets>, intelligence: f64) -> f64 {
    let (flat, inc, more) = get_buckets(agg, "EnergyShield");
    let int_bonus = (intelligence / 5.0).floor(); // 2% per 10 int
    calc_stat(0.0, flat, inc + int_bonus, more).round().max(0.0)
}

/// Accuracy = (base + dex*2 + flat) * (1+inc/100) * more
fn calc_accuracy(level: u32, dexterity: f64, agg: &HashMap<String, ModBuckets>) -> f64 {
    let base = (level as f64 - 1.0) * 2.0 + dexterity * 2.0;
    let (flat, inc, more) = get_buckets(agg, "Accuracy");
    calc_stat(base, flat, inc, more).round().max(0.0)
}

/// Hit chance: 1.15 * accuracy / (accuracy + (enemy_evasion)^0.8)
fn calc_hit_chance(accuracy: f64, enemy_evasion: f64) -> f64 {
    if enemy_evasion <= 0.0 {
        return 100.0;
    }
    let raw = 1.15 * accuracy / (accuracy + enemy_evasion.powf(0.8));
    (raw * 100.0).clamp(5.0, 100.0)
}

/// Evade chance: 1 - hit_chance_of_enemy_against_us
fn calc_evade_chance(evasion: f64, enemy_accuracy: f64) -> f64 {
    if enemy_accuracy <= 0.0 {
        return 95.0;
    }
    let enemy_hit = 1.15 * enemy_accuracy / (enemy_accuracy + evasion.powf(0.8));
    ((1.0 - enemy_hit) * 100.0).clamp(0.0, 95.0)
}

/// Physical damage reduction from armour against a given raw hit
fn phys_reduction_from_armour(armour: f64, raw_phys: f64) -> f64 {
    if armour <= 0.0 || raw_phys <= 0.0 {
        return 0.0;
    }
    let reduction = armour / (armour + 5.0 * raw_phys);
    (reduction * 100.0).min(90.0)
}

/// Simplified EHP: pool / (1 - mitigation%) / (1 - avoidance%)
fn calc_ehp(
    life: f64,
    es: f64,
    phys_reduction_pct: f64,
    block_pct: f64,
    evade_pct: f64,
) -> f64 {
    let pool = life + es;
    let damage_taken = (1.0 - phys_reduction_pct / 100.0).max(0.01);
    let hit_taken = (1.0 - block_pct / 100.0).max(0.01);
    let hits_landed = (1.0 - evade_pct / 100.0).max(0.01);
    pool / damage_taken / hit_taken / hits_landed
}

// ---------------------------------------------------------------------------
// Main evaluator – modifier-based fast path
// ---------------------------------------------------------------------------

#[wasm_bindgen]
pub fn evaluate_build(input: BuildInput) -> CalcOutput {
    // Use class defaults when base attributes are zero
    let (class_str, class_dex, class_int) = ascendancy::class_base_stats(input.class_id);
    let eff_str = if input.base_str > 0 { input.base_str } else { class_str };
    let eff_dex = if input.base_dex > 0 { input.base_dex } else { class_dex };
    let eff_int = if input.base_int > 0 { input.base_int } else { class_int };

    let mut all_mods = input.modifiers.clone();
    keystones::apply_keystones(&input, &mut all_mods);

    // Inject ascendancy bonuses
    if !input.ascendancy_name.is_empty() {
        all_mods.extend(ascendancy::get_ascendancy_mods(&input.ascendancy_name));
    }

    let agg = aggregate_mods(&all_mods);

    // --- Attributes ----------------------------------------------------------
    let (sf, si, sm) = get_buckets(&agg, "Str");
    let strength = calc_stat(eff_str as f64, sf, si, sm).round();

    let (df, di, dm) = get_buckets(&agg, "Dex");
    let dexterity = calc_stat(eff_dex as f64, df, di, dm).round();

    let (nf, ni, nm) = get_buckets(&agg, "Int");
    let intelligence = calc_stat(eff_int as f64, nf, ni, nm).round();

    // --- Pool ----------------------------------------------------------------
    let life = calc_life(input.level, strength, &agg);
    let energy_shield = calc_es(&agg, intelligence);
    let mana = calc_mana(input.level, intelligence, &agg);

    // --- Armour / Evasion ----------------------------------------------------
    let (af, ai, am) = get_buckets(&agg, "Armour");
    let str_armour_bonus = (strength / 5.0).floor();
    let armour = calc_stat(str_armour_bonus, af, ai, am).round();

    let (ef, ei, em) = get_buckets(&agg, "Evasion");
    let dex_evasion_bonus = (dexterity / 5.0).floor();
    let evasion = calc_stat(dex_evasion_bonus, ef, ei, em).round().max(0.0);

    // --- Resistances (flat only, capped at 90) -------------------------------
    let fire_res = (get_buckets(&agg, "FireRes").0 - 60.0).min(90.0);
    let cold_res = (get_buckets(&agg, "ColdRes").0 - 60.0).min(90.0);
    let lightning_res = (get_buckets(&agg, "LightningRes").0 - 60.0).min(90.0);
    let chaos_res = (get_buckets(&agg, "ChaosRes").0 - 60.0).min(75.0);

    // --- Block ---------------------------------------------------------------
    let block_chance = get_buckets(&agg, "BlockChance").0.clamp(0.0, 75.0);
    let spell_block = get_buckets(&agg, "SpellBlockChance").0.clamp(0.0, 75.0);

    // --- Accuracy / Hit Chance -----------------------------------------------
    let accuracy = calc_accuracy(input.level, dexterity, &agg);
    let hit_chance = calc_hit_chance(accuracy, 600.0);

    // --- DPS -----------------------------------------------------------------
    // Use gem base damage when a skill is specified, otherwise fall back to
    // raw Damage modifiers.
    let gem = if !input.main_skill_id.is_empty() {
        gems::lookup_gem(&input.main_skill_id)
    } else {
        None
    };

    let (dmg_flat, dmg_inc, dmg_more) = get_buckets(&agg, "Damage");
    let (spd_flat, spd_inc, spd_more) = get_buckets(&agg, "AttackSpeed");

    let (gem_base_dmg, gem_base_speed, gem_base_crit, gem_effectiveness) = match gem {
        Some(g) if !g.is_dot => (
            gems::avg_base_damage(g),
            1.0 / g.base_cast_time,      // attacks/casts per second
            g.base_crit_chance,
            g.damage_effectiveness,
        ),
        _ => (0.0, 1.0, 5.0, 1.0),
    };

    let added_damage = dmg_flat * gem_effectiveness;
    let base_damage = calc_stat(gem_base_dmg, added_damage, dmg_inc, dmg_more);
    let attack_speed = calc_stat(gem_base_speed, spd_flat, spd_inc, spd_more);

    let (crit_base_mod, crit_inc, crit_more) = get_buckets(&agg, "CritChance");
    let base_crit = if crit_base_mod != 0.0 { gem_base_crit + crit_base_mod } else { gem_base_crit };
    let crit_chance = calc_stat(base_crit, 0.0, crit_inc, crit_more).clamp(0.0, 100.0);

    let crit_multi = 150.0 + get_buckets(&agg, "CritMultiplier").0;

    // --- Penetration & enemy resistance ----------------------------------------
    let fire_pen = get_buckets(&agg, "FirePenetration").0;
    let cold_pen = get_buckets(&agg, "ColdPenetration").0;
    let lightning_pen = get_buckets(&agg, "LightningPenetration").0;
    let chaos_pen = get_buckets(&agg, "ChaosPenetration").0;

    let (e_fire, e_cold, e_light, e_chaos) = if input.enemy_is_boss {
        (input.enemy_fire_res.max(40.0), input.enemy_cold_res.max(40.0),
         input.enemy_lightning_res.max(40.0), input.enemy_chaos_res.max(25.0))
    } else {
        (input.enemy_fire_res, input.enemy_cold_res,
         input.enemy_lightning_res, input.enemy_chaos_res)
    };

    // Average resistance multiplier (simplified: assumes generic elemental damage)
    let avg_pen = (fire_pen + cold_pen + lightning_pen) / 3.0;
    let avg_enemy_ele_res = (e_fire + e_cold + e_light) / 3.0;
    let res_mult = apply_resistance(avg_enemy_ele_res, avg_pen);

    let avg_hit = base_damage
        * (1.0 + (crit_chance / 100.0) * (crit_multi / 100.0 - 1.0));
    let total_dps = if gem.map_or(false, |g| g.is_dot) {
        let dot_base = gem.unwrap().dot_base;
        calc_stat(dot_base, dmg_flat, dmg_inc, dmg_more) * res_mult
    } else {
        avg_hit * attack_speed * (hit_chance / 100.0) * res_mult
    };

    // --- Derived defences ----------------------------------------------------
    let phys_reduction = phys_reduction_from_armour(armour, 83.0 * 5.0);
    let evade_chance = calc_evade_chance(evasion, 600.0);
    let total_ehp = calc_ehp(life, energy_shield, phys_reduction, block_chance, evade_chance);

    CalcOutput {
        life,
        energy_shield,
        mana,
        strength,
        dexterity,
        intelligence,
        armour,
        evasion,
        fire_res,
        cold_res,
        lightning_res,
        chaos_res,
        block_chance,
        spell_block,
        total_dps,
        crit_chance,
        crit_multiplier: crit_multi,
        attack_speed,
        accuracy,
        hit_chance,
        total_ehp,
    }
}

// ---------------------------------------------------------------------------
// Stat parser – WASM entry point
// ---------------------------------------------------------------------------

/// Parse a single PoE stat description line into Modifiers (returned as JsValue).
#[wasm_bindgen]
pub fn parse_single_stat(line: &str) -> JsValue {
    let mods = stat_parser::parse_stat_line(line);
    serde_wasm_bindgen::to_value(&mods).unwrap_or(JsValue::NULL)
}

// ---------------------------------------------------------------------------
// Legacy XML-based evaluator (kept for backward compat)
// ---------------------------------------------------------------------------

fn default_stats() -> BuildStats {
    BuildStats {
        life: 60.0,
        mana: 50.0,
        strength: 20.0,
        dexterity: 20.0,
        intelligence: 20.0,
        evasion: 16.0,
        fire_res: -60.0,
        cold_res: -60.0,
        lightning_res: -60.0,
        chaos_res: -60.0,
        fire_res_max: 75.0,
        cold_res_max: 75.0,
        lightning_res_max: 75.0,
        chaos_res_max: 75.0,
        mana_regen: 0.9,
        crit_multiplier: 150.0,
        attack_speed: 1.2,
        hit_chance: 5.0,
        accuracy: 40.0,
        class_name: "Scion".into(),
        ascendancy: String::new(),
        level: 1.0,
        ..Default::default()
    }
}

fn extract_attr<'a>(xml: &'a str, tag: &str, attr: &str) -> Option<&'a str> {
    let tag_start = xml.find(&format!("<{}", tag))?;
    let tag_end = xml[tag_start..].find('>')? + tag_start;
    let tag_content = &xml[tag_start..tag_end];
    let attr_prefix = format!("{}=\"", attr);
    let attr_start = tag_content.find(&attr_prefix)? + attr_prefix.len();
    let attr_end = tag_content[attr_start..].find('"')? + attr_start;
    Some(&tag_content[attr_start..attr_end])
}

#[wasm_bindgen]
pub fn evaluate_build_xml(xml: &str) -> Result<BuildStats, JsError> {
    let mut stats = default_stats();

    if let Some(class) = extract_attr(xml, "Build", "className") {
        stats.class_name = class.to_string();
    }
    if let Some(asc) = extract_attr(xml, "Build", "ascendClassName") {
        stats.ascendancy = asc.to_string();
    }
    if let Some(level) = extract_attr(xml, "Build", "level") {
        stats.level = level.parse::<f64>().unwrap_or(1.0);
    }

    Ok(stats)
}

#[wasm_bindgen]
pub struct WasmEvaluator {
    base_stats: BuildStats,
}

#[wasm_bindgen]
impl WasmEvaluator {
    #[wasm_bindgen(constructor)]
    pub fn new(xml: &str) -> Result<WasmEvaluator, JsError> {
        let base_stats = evaluate_build_xml(xml)?;
        Ok(WasmEvaluator { base_stats })
    }

    pub fn evaluate(&self, _allocated_nodes: &[u32]) -> Result<BuildStats, JsError> {
        Ok(self.base_stats.clone())
    }

    pub fn evaluate_delta(
        &self,
        current_nodes: &[u32],
        proposed_nodes: &[u32],
    ) -> Result<DeltaResult, JsError> {
        let current = self.evaluate(current_nodes)?;
        let proposed = self.evaluate(proposed_nodes)?;
        Ok(DeltaResult { current, proposed })
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    fn default_input() -> BuildInput {
        BuildInput {
            level: 90,
            class_id: 1,
            base_str: 32,
            base_dex: 14,
            base_int: 14,
            modifiers: vec![],
            allocated_keystones: vec![],
            ..Default::default()
        }
    }

    #[test]
    fn test_base_marauder_life() {
        let out = evaluate_build(default_input());
        // base life = 38 + 89*12 + 32/2 = 38 + 1068 + 16 = 1122
        assert!(out.life >= 1100.0, "life was {}", out.life);
        assert!(out.life <= 1150.0, "life was {}", out.life);
    }

    #[test]
    fn test_base_attributes() {
        let out = evaluate_build(default_input());
        assert_eq!(out.strength, 32.0);
        assert_eq!(out.dexterity, 14.0);
        assert_eq!(out.intelligence, 14.0);
    }

    #[test]
    fn test_resistances_default() {
        let out = evaluate_build(default_input());
        assert_eq!(out.fire_res, -60.0);
        assert_eq!(out.cold_res, -60.0);
        assert_eq!(out.lightning_res, -60.0);
        assert_eq!(out.chaos_res, -60.0);
    }

    #[test]
    fn test_flat_life_mod() {
        let mut input = default_input();
        input.modifiers.push(Modifier {
            stat: "Life".into(),
            value: 100.0,
            mod_type: "flat".into(),
        });
        let out = evaluate_build(input);
        // base ~1122 + 100 flat = ~1222
        assert!(out.life >= 1200.0, "life was {}", out.life);
    }

    #[test]
    fn test_increased_life_mod() {
        let mut input = default_input();
        input.modifiers.push(Modifier {
            stat: "Life".into(),
            value: 50.0,
            mod_type: "increased".into(),
        });
        let out = evaluate_build(input);
        // base ~1122 * 1.5 = ~1683
        assert!(out.life >= 1650.0, "life was {}", out.life);
    }

    #[test]
    fn test_more_life_mod() {
        let mut input = default_input();
        input.modifiers.push(Modifier {
            stat: "Life".into(),
            value: 20.0,
            mod_type: "more".into(),
        });
        let out = evaluate_build(input);
        // base ~1122 * 1.2 = ~1346
        assert!(out.life >= 1340.0, "life was {}", out.life);
    }

    #[test]
    fn test_combined_mods() {
        let mut input = default_input();
        input.modifiers.push(Modifier {
            stat: "Life".into(),
            value: 50.0,
            mod_type: "flat".into(),
        });
        input.modifiers.push(Modifier {
            stat: "Life".into(),
            value: 100.0,
            mod_type: "increased".into(),
        });
        input.modifiers.push(Modifier {
            stat: "Life".into(),
            value: 30.0,
            mod_type: "more".into(),
        });
        let out = evaluate_build(input);
        // (1122 + 50) * 2.0 * 1.3 = 3047.2
        assert!(out.life >= 3000.0, "life was {}", out.life);
    }

    #[test]
    fn test_resistance_mod() {
        let mut input = default_input();
        input.modifiers.push(Modifier {
            stat: "FireRes".into(),
            value: 135.0,
            mod_type: "flat".into(),
        });
        let out = evaluate_build(input);
        assert_eq!(out.fire_res, 75.0); // 135 - 60 = 75
    }

    #[test]
    fn test_overcapped_resistance() {
        let mut input = default_input();
        input.modifiers.push(Modifier {
            stat: "FireRes".into(),
            value: 200.0,
            mod_type: "flat".into(),
        });
        let out = evaluate_build(input);
        assert_eq!(out.fire_res, 90.0); // capped at 90 (uncapped display)
    }

    #[test]
    fn test_strength_gives_life() {
        let mut input = default_input();
        input.modifiers.push(Modifier {
            stat: "Str".into(),
            value: 100.0,
            mod_type: "flat".into(),
        });
        let base_out = evaluate_build(default_input());
        let str_out = evaluate_build(input);
        // +100 str => +50 base life
        assert!(str_out.life > base_out.life + 40.0, "str life bonus not applied");
    }

    #[test]
    fn test_dps_basic() {
        let mut input = default_input();
        input.modifiers.push(Modifier {
            stat: "Damage".into(),
            value: 500.0,
            mod_type: "flat".into(),
        });
        input.modifiers.push(Modifier {
            stat: "Damage".into(),
            value: 100.0,
            mod_type: "increased".into(),
        });
        let out = evaluate_build(input);
        assert!(out.total_dps > 500.0, "dps was {}", out.total_dps);
    }

    #[test]
    fn test_crit_increases_dps() {
        let mut input = default_input();
        input.modifiers.push(Modifier {
            stat: "Damage".into(),
            value: 1000.0,
            mod_type: "flat".into(),
        });

        let base_dps = evaluate_build(input.clone()).total_dps;

        input.modifiers.push(Modifier {
            stat: "CritChance".into(),
            value: 50.0,
            mod_type: "increased".into(),
        });
        input.modifiers.push(Modifier {
            stat: "CritMultiplier".into(),
            value: 100.0,
            mod_type: "flat".into(),
        });
        let crit_dps = evaluate_build(input).total_dps;
        assert!(crit_dps > base_dps, "crit didn't increase DPS");
    }

    #[test]
    fn test_attack_speed_scales_dps() {
        let mut input = default_input();
        input.modifiers.push(Modifier {
            stat: "Damage".into(),
            value: 1000.0,
            mod_type: "flat".into(),
        });

        let base_dps = evaluate_build(input.clone()).total_dps;

        input.modifiers.push(Modifier {
            stat: "AttackSpeed".into(),
            value: 100.0,
            mod_type: "increased".into(),
        });
        let fast_dps = evaluate_build(input).total_dps;
        assert!(
            fast_dps > base_dps * 1.5,
            "speed didn't scale DPS: {} vs {}",
            fast_dps,
            base_dps
        );
    }

    #[test]
    fn test_block_capped_at_75() {
        let mut input = default_input();
        input.modifiers.push(Modifier {
            stat: "BlockChance".into(),
            value: 90.0,
            mod_type: "flat".into(),
        });
        let out = evaluate_build(input);
        assert_eq!(out.block_chance, 75.0);
    }

    #[test]
    fn test_ehp_positive() {
        let out = evaluate_build(default_input());
        assert!(out.total_ehp > out.life, "EHP should exceed raw life pool");
    }

    #[test]
    fn test_mana_scales_with_int() {
        let mut input = default_input();
        input.modifiers.push(Modifier {
            stat: "Int".into(),
            value: 200.0,
            mod_type: "flat".into(),
        });
        let base_mana = evaluate_build(default_input()).mana;
        let int_mana = evaluate_build(input).mana;
        assert!(int_mana > base_mana + 50.0, "int didn't increase mana");
    }

    #[test]
    fn test_accuracy_scales_with_dex() {
        let mut input = default_input();
        input.modifiers.push(Modifier {
            stat: "Dex".into(),
            value: 200.0,
            mod_type: "flat".into(),
        });
        let base_acc = evaluate_build(default_input()).accuracy;
        let dex_acc = evaluate_build(input).accuracy;
        assert!(dex_acc > base_acc + 300.0, "dex didn't increase accuracy");
    }

    // Legacy XML evaluator tests (kept from original)
    #[test]
    fn test_extract_attr() {
        let xml = r#"<Build level="95" className="Witch" ascendClassName="Necromancer">"#;
        assert_eq!(extract_attr(xml, "Build", "level"), Some("95"));
        assert_eq!(extract_attr(xml, "Build", "className"), Some("Witch"));
        assert_eq!(
            extract_attr(xml, "Build", "ascendClassName"),
            Some("Necromancer")
        );
    }

    #[test]
    fn test_evaluate_build_xml() {
        let xml = r#"<?xml version="1.0"?><PathOfBuilding><Build level="90" className="Marauder" ascendClassName="Juggernaut"></Build></PathOfBuilding>"#;
        let stats = evaluate_build_xml(xml).unwrap();
        assert_eq!(stats.class_name, "Marauder");
        assert_eq!(stats.ascendancy, "Juggernaut");
        assert_eq!(stats.level, 90.0);
    }

    // ---- Gem-based DPS tests -----------------------------------------------

    #[test]
    fn test_ground_slam_dps() {
        let mut input = default_input();
        input.main_skill_id = "GroundSlam".into();
        let out = evaluate_build(input);
        // Base avg = 250, effectiveness 1.1, speed 1.0, crit 5%
        assert!(out.total_dps > 100.0, "ground slam dps was {}", out.total_dps);
    }

    #[test]
    fn test_winter_orb_uses_cast_time() {
        let mut input = default_input();
        input.main_skill_id = "WinterOrb".into();
        let out = evaluate_build(input);
        // Cast time 0.72 => ~1.39 casts/s, base avg 125
        assert!(out.attack_speed > 1.3, "WOrb speed was {}", out.attack_speed);
        assert!(out.total_dps > 100.0, "WOrb dps was {}", out.total_dps);
    }

    #[test]
    fn test_righteous_fire_dot() {
        let mut input = default_input();
        input.main_skill_id = "RighteousFire".into();
        let out = evaluate_build(input);
        // DoT: base 100, no speed/crit multiplier
        assert!(out.total_dps >= 100.0, "RF dps was {}", out.total_dps);
    }

    #[test]
    fn test_gem_with_added_damage() {
        let mut input = default_input();
        input.main_skill_id = "GroundSlam".into();
        input.modifiers.push(Modifier {
            stat: "Damage".into(),
            value: 200.0,
            mod_type: "flat".into(),
        });
        let base = {
            let mut i = default_input();
            i.main_skill_id = "GroundSlam".into();
            evaluate_build(i).total_dps
        };
        let with_added = evaluate_build(input).total_dps;
        // effectiveness = 1.1, so +200 flat becomes +220 effective
        assert!(with_added > base * 1.5, "added damage didn't scale: base={base}, with={with_added}");
    }

    #[test]
    fn test_no_skill_falls_back() {
        // Without main_skill_id, DPS comes from raw Damage mods
        let mut input = default_input();
        input.modifiers.push(Modifier {
            stat: "Damage".into(),
            value: 500.0,
            mod_type: "flat".into(),
        });
        let out = evaluate_build(input);
        assert!(out.total_dps > 0.0);
    }

    #[test]
    fn test_fireball_high_effectiveness() {
        let mut input = default_input();
        input.main_skill_id = "Fireball".into();
        input.modifiers.push(Modifier {
            stat: "Damage".into(),
            value: 100.0,
            mod_type: "flat".into(),
        });
        let base = {
            let mut i = default_input();
            i.main_skill_id = "Fireball".into();
            evaluate_build(i).total_dps
        };
        let with_added = evaluate_build(input).total_dps;
        // Fireball effectiveness = 2.4, so +100 flat becomes +240
        assert!(with_added > base * 1.2, "fireball effectiveness not applied");
    }

    #[test]
    fn test_apply_resistance() {
        // No resistance = full damage
        assert!((apply_resistance(0.0, 0.0) - 1.0).abs() < 0.001);
        // 40% resistance = 60% damage
        assert!((apply_resistance(40.0, 0.0) - 0.6).abs() < 0.001);
        // 40% res with 40% pen = full damage
        assert!((apply_resistance(40.0, 40.0) - 1.0).abs() < 0.001);
        // Negative res = bonus damage
        assert!(apply_resistance(-50.0, 0.0) > 1.0);
        // Capped at 90%
        assert!((apply_resistance(95.0, 0.0) - 0.1).abs() < 0.001);
        // Capped at -100%
        assert!((apply_resistance(-200.0, 0.0) - 2.0).abs() < 0.001);
    }

    #[test]
    fn test_boss_resistances() {
        let (f, c, l, ch) = boss_resistances("pinnacle");
        assert_eq!(f, 40.0);
        assert_eq!(ch, 25.0);
        let (f2, _, _, _) = boss_resistances("unknown");
        assert_eq!(f2, 0.0);
    }

    #[test]
    fn test_penetration_increases_dps() {
        let mut input = default_input();
        input.modifiers.push(Modifier { stat: "Damage".into(), value: 500.0, mod_type: "flat".into() });
        input.enemy_fire_res = 40.0;
        input.enemy_cold_res = 40.0;
        input.enemy_lightning_res = 40.0;
        input.enemy_is_boss = true;

        let no_pen = evaluate_build(input.clone()).total_dps;

        input.modifiers.push(Modifier { stat: "FirePenetration".into(), value: 37.0, mod_type: "flat".into() });
        input.modifiers.push(Modifier { stat: "ColdPenetration".into(), value: 37.0, mod_type: "flat".into() });
        input.modifiers.push(Modifier { stat: "LightningPenetration".into(), value: 37.0, mod_type: "flat".into() });

        let with_pen = evaluate_build(input).total_dps;
        assert!(with_pen > no_pen, "penetration should increase DPS: {} vs {}", with_pen, no_pen);
    }

    #[test]
    fn test_boss_reduces_dps() {
        let mut input = default_input();
        input.modifiers.push(Modifier { stat: "Damage".into(), value: 500.0, mod_type: "flat".into() });

        let normal = evaluate_build(input.clone()).total_dps;

        input.enemy_is_boss = true;
        input.enemy_fire_res = 40.0;
        input.enemy_cold_res = 40.0;
        input.enemy_lightning_res = 40.0;

        let boss = evaluate_build(input).total_dps;
        assert!(boss < normal, "boss should reduce DPS: {} vs {}", boss, normal);
    }
}

#[cfg(test)]
mod bench_tests {
    use super::*;
    use std::time::Instant;

    fn sample_input() -> BuildInput {
        BuildInput {
            level: 90,
            class_id: 1,
            base_str: 32,
            base_dex: 14,
            base_int: 14,
            modifiers: vec![
                Modifier { stat: "Life".into(), value: 150.0, mod_type: "flat".into() },
                Modifier { stat: "Life".into(), value: 80.0, mod_type: "increased".into() },
                Modifier { stat: "EnergyShield".into(), value: 200.0, mod_type: "flat".into() },
                Modifier { stat: "Str".into(), value: 100.0, mod_type: "flat".into() },
                Modifier { stat: "Dex".into(), value: 50.0, mod_type: "flat".into() },
                Modifier { stat: "Int".into(), value: 80.0, mod_type: "flat".into() },
                Modifier { stat: "FireRes".into(), value: 135.0, mod_type: "flat".into() },
                Modifier { stat: "ColdRes".into(), value: 120.0, mod_type: "flat".into() },
                Modifier { stat: "LightningRes".into(), value: 140.0, mod_type: "flat".into() },
                Modifier { stat: "ChaosRes".into(), value: 30.0, mod_type: "flat".into() },
                Modifier { stat: "Damage".into(), value: 500.0, mod_type: "flat".into() },
                Modifier { stat: "Damage".into(), value: 200.0, mod_type: "increased".into() },
                Modifier { stat: "AttackSpeed".into(), value: 30.0, mod_type: "increased".into() },
                Modifier { stat: "CritChance".into(), value: 50.0, mod_type: "flat".into() },
                Modifier { stat: "CritMultiplier".into(), value: 100.0, mod_type: "flat".into() },
                Modifier { stat: "Armour".into(), value: 1000.0, mod_type: "flat".into() },
                Modifier { stat: "Armour".into(), value: 50.0, mod_type: "increased".into() },
                Modifier { stat: "Evasion".into(), value: 500.0, mod_type: "flat".into() },
                Modifier { stat: "BlockChance".into(), value: 30.0, mod_type: "flat".into() },
            ],
            allocated_keystones: vec![],
            ..Default::default()
        }
    }

    #[test]
    fn bench_single_eval() {
        let input = sample_input();
        let iterations = 10_000;
        // Warm up
        for _ in 0..100 {
            let _ = evaluate_build(input.clone());
        }
        let start = Instant::now();
        for _ in 0..iterations {
            let _ = evaluate_build(input.clone());
        }
        let elapsed = start.elapsed();
        let per_eval_ns = elapsed.as_nanos() as f64 / iterations as f64;
        println!(
            "Single eval: {:.0}ns ({:.1}us) - {:.0} evals/sec",
            per_eval_ns,
            per_eval_ns / 1000.0,
            1_000_000_000.0 / per_eval_ns
        );
        assert!(per_eval_ns < 1_000_000.0, "Eval too slow: {:.0}ns", per_eval_ns);
    }

    #[test]
    fn bench_node_ranking_100() {
        let input = sample_input();
        let nodes: Vec<(String, Vec<String>)> = (0..100)
            .map(|i| {
                (
                    format!("node_{}", i),
                    vec![
                        format!("+{} to maximum Life", 5 + i % 20),
                        format!("{}% increased Damage", 3 + i % 10),
                    ],
                )
            })
            .collect();

        // Warm up
        let _ = node_power::rank_nodes(&input, &nodes);

        let start = Instant::now();
        let ranked = node_power::rank_nodes(&input, &nodes);
        let elapsed = start.elapsed();

        println!(
            "Rank 100 nodes: {:.2}ms ({:.0}us per node)",
            elapsed.as_micros() as f64 / 1000.0,
            elapsed.as_micros() as f64 / 100.0
        );
        assert_eq!(ranked.len(), 100);
        assert!(
            elapsed.as_millis() < 500,
            "Ranking too slow: {}ms",
            elapsed.as_millis()
        );
    }

    #[test]
    fn bench_stat_parsing() {
        let lines = vec![
            "+50 to maximum Life".to_string(),
            "8% increased maximum Life".to_string(),
            "+30% to Fire Resistance".to_string(),
            "+10 to all Attributes".to_string(),
            "25% increased Armour".to_string(),
            "+25% to Critical Strike Multiplier".to_string(),
            "10% increased Attack Speed".to_string(),
            "+200 to Accuracy Rating".to_string(),
        ];

        let iterations = 10_000;
        let start = Instant::now();
        for _ in 0..iterations {
            let _ = stat_parser::parse_stats(&lines);
        }
        let elapsed = start.elapsed();
        let per_parse_ns = elapsed.as_nanos() as f64 / iterations as f64;
        println!(
            "Parse 8 stat lines: {:.0}ns ({:.1}us) - {:.0} parses/sec",
            per_parse_ns,
            per_parse_ns / 1000.0,
            1_000_000_000.0 / per_parse_ns
        );
        assert!(per_parse_ns < 1_000_000.0, "Parsing too slow");
    }
}
