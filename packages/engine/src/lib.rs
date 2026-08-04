use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use tsify_next::Tsify;
use std::collections::HashMap;

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

#[derive(Tsify, Serialize, Deserialize, Clone, Debug)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct BuildInput {
    pub level: u32,
    pub class_id: u32,
    pub base_str: u32,
    pub base_dex: u32,
    pub base_int: u32,
    pub modifiers: Vec<Modifier>,
    pub allocated_keystones: Vec<String>,
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
    let agg = aggregate_mods(&input.modifiers);

    // --- Attributes ----------------------------------------------------------
    let (sf, si, sm) = get_buckets(&agg, "Str");
    let strength = calc_stat(input.base_str as f64, sf, si, sm).round();

    let (df, di, dm) = get_buckets(&agg, "Dex");
    let dexterity = calc_stat(input.base_dex as f64, df, di, dm).round();

    let (nf, ni, nm) = get_buckets(&agg, "Int");
    let intelligence = calc_stat(input.base_int as f64, nf, ni, nm).round();

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
    let evasion = calc_stat(dex_evasion_bonus, ef, ei, em).round();

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
    let (dmg_flat, dmg_inc, dmg_more) = get_buckets(&agg, "Damage");
    let (spd_flat, spd_inc, spd_more) = get_buckets(&agg, "AttackSpeed");

    let base_damage = calc_stat(0.0, dmg_flat, dmg_inc, dmg_more);
    let attack_speed = calc_stat(1.0, spd_flat, spd_inc, spd_more);

    let (crit_base, crit_inc, crit_more) = get_buckets(&agg, "CritChance");
    let base_crit = if crit_base > 0.0 { crit_base } else { 5.0 };
    let crit_chance = calc_stat(base_crit, 0.0, crit_inc, crit_more).clamp(0.0, 100.0);

    let crit_multi = 150.0 + get_buckets(&agg, "CritMultiplier").0;

    let avg_hit = base_damage
        * (1.0 + (crit_chance / 100.0) * (crit_multi / 100.0 - 1.0));
    let total_dps = avg_hit * attack_speed * (hit_chance / 100.0);

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
            class_id: 1, // Marauder
            base_str: 32,
            base_dex: 14,
            base_int: 14,
            modifiers: vec![],
            allocated_keystones: vec![],
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
}
