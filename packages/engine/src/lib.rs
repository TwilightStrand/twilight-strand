use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use tsify_next::Tsify;

pub mod damage;
pub mod mod_db;

mod gems;
pub use gems::{lookup_gem, avg_base_damage, GemData, DamageType, GemTag};

pub mod stat_parser;
pub mod node_power;
pub mod pathfinder;
pub mod supports;

#[cfg(test)]
mod integration_tests;
#[cfg(test)]
mod bench_harness;
#[cfg(test)]
mod snapshot_tests;
pub mod keystones;
pub mod ascendancy;
pub mod weapons;
pub mod minions;
pub mod flasks;
pub mod uniques;
pub mod watchers_eye;
pub use watchers_eye::{get_watchers_eye_mods, get_all_mods_for_auras};
pub mod triggers;
pub use flasks::{get_flask_mods, charge_mods};
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
#[serde(default)]
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
    #[serde(default)]
    pub support_gems: Vec<String>,
    #[serde(default)]
    pub equipped_uniques: Vec<String>,
    #[serde(default)]
    pub active_flasks: Vec<String>,
    #[serde(default)]
    pub weapon_base_type: String,
    #[serde(default)]
    pub weapon_phys_min: f64,
    #[serde(default)]
    pub weapon_phys_max: f64,
    #[serde(default)]
    pub weapon_aps: f64,
    #[serde(default)]
    pub weapon_crit: f64,
    #[serde(default)]
    pub power_charges: u32,
    #[serde(default)]
    pub frenzy_charges: u32,
    #[serde(default)]
    pub endurance_charges: u32,
    #[serde(default)]
    pub on_full_life: bool,
    #[serde(default)]
    pub on_low_life: bool,
    #[serde(default)]
    pub is_leeching: bool,
    #[serde(default)]
    pub have_fortify: bool,
    #[serde(default)]
    pub have_killed_recently: bool,
    #[serde(default)]
    pub conversion_phys_to_fire: f64,
    #[serde(default)]
    pub conversion_phys_to_cold: f64,
    #[serde(default)]
    pub conversion_phys_to_lightning: f64,
    #[serde(default)]
    pub conversion_phys_to_chaos: f64,
    #[serde(default)]
    pub minion_skill_id: String,
    #[serde(default)]
    pub mana_reserved_pct: f64,
    #[serde(default)]
    pub life_reserved_pct: f64,
    #[serde(default)]
    pub impale_chance: f64,
    #[serde(default)]
    pub have_onslaught: bool,
    #[serde(default)]
    pub have_tailwind: bool,
    #[serde(default)]
    pub have_arcane_surge: bool,
    #[serde(default)]
    pub weapon2_phys_min: f64,
    #[serde(default)]
    pub weapon2_phys_max: f64,
    #[serde(default)]
    pub weapon2_aps: f64,
    #[serde(default)]
    pub weapon2_crit: f64,
    #[serde(default)]
    pub is_dual_wield: bool,
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
    pub bleed_dps: f64,
    pub poison_dps: f64,
    pub ignite_dps: f64,
    pub combined_dps: f64,
    pub life_regen: f64,
    pub mana_regen: f64,
    pub es_regen: f64,
    pub evade_chance: f64,
    pub phys_reduction: f64,
    pub suppression: f64,
    pub trigger_rate: f64,
    pub total_dps_with_minions: f64,
    pub mana_unreserved: f64,
    pub life_unreserved: f64,
    pub mana_reserved_percent: f64,
    pub life_leech_rate: f64,
    pub es_leech_rate: f64,
    pub impale_dps: f64,
    pub ward: f64,
    pub es_recharge_rate: f64,
}

// ---------------------------------------------------------------------------
// Stat calculation helpers
// ---------------------------------------------------------------------------

fn calc_stat(base: f64, flat: f64, increased: f64, more: f64) -> f64 {
    (base + flat) * (1.0 + increased / 100.0) * more
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

    // Ascendancy mods come from tree node stats parsed by the converter.
    // The hardcoded approximations in get_ascendancy_mods were double-counting.

    for gem_name in &input.support_gems {
        all_mods.extend(supports::get_support_modifiers(gem_name));
    }

    for unique_name in &input.equipped_uniques {
        all_mods.extend(uniques::get_unique_effects(unique_name));
    }

    for flask_name in &input.active_flasks {
        all_mods.extend(flasks::get_flask_mods(flask_name));
    }

    // Charges
    all_mods.extend(flasks::charge_mods("power", input.power_charges));
    all_mods.extend(flasks::charge_mods("frenzy", input.frenzy_charges));
    all_mods.extend(flasks::charge_mods("endurance", input.endurance_charges));

    // Fortify
    if input.have_fortify {
        all_mods.push(Modifier { stat: "DamageTakenReduction".into(), value: 20.0, mod_type: "flat".into() });
    }

    // Buff effects
    if input.have_onslaught {
        all_mods.push(Modifier { stat: "AttackSpeed".into(), value: 20.0, mod_type: "increased".into() });
        all_mods.push(Modifier { stat: "MovementSpeed".into(), value: 20.0, mod_type: "increased".into() });
    }
    if input.have_tailwind {
        all_mods.push(Modifier { stat: "AttackSpeed".into(), value: 8.0, mod_type: "increased".into() });
    }
    if input.have_arcane_surge {
        all_mods.push(Modifier { stat: "SpellDamage".into(), value: 10.0, mod_type: "more".into() });
        all_mods.push(Modifier { stat: "AttackSpeed".into(), value: 10.0, mod_type: "increased".into() });
    }

    // Dual-wield bonuses
    if input.is_dual_wield {
        all_mods.push(Modifier { stat: "AttackSpeed".into(), value: 10.0, mod_type: "more".into() });
        all_mods.push(Modifier { stat: "BlockChance".into(), value: 15.0, mod_type: "flat".into() });
        all_mods.push(Modifier { stat: "PhysicalDamage".into(), value: 20.0, mod_type: "more".into() });
    }

    // Build ModDB from legacy modifiers
    use mod_db::{ModDB, StatId, SkillCfg, BuildState as MdbState, ConditionId};
    let mut db = ModDB::new();
    for m in &all_mods {
        db.add_legacy(&m.stat, m.value, &m.mod_type);
    }
    let cfg = SkillCfg::default();
    let mut mst = MdbState::default();

    // Populate BuildState from input flags so conditional mods can evaluate
    mst.power_charges = input.power_charges as u8;
    mst.frenzy_charges = input.frenzy_charges as u8;
    mst.endurance_charges = input.endurance_charges as u8;
    if input.is_dual_wield { mst.set_condition(ConditionId::DualWielding); }
    if input.on_full_life { mst.set_condition(ConditionId::OnFullLife); }
    if input.on_low_life { mst.set_condition(ConditionId::OnLowLife); }
    if input.is_leeching { mst.set_condition(ConditionId::IsLeeching); }
    if input.have_fortify { mst.set_condition(ConditionId::HaveFortify); }
    if input.have_killed_recently { mst.set_condition(ConditionId::KilledRecently); }
    if input.have_onslaught { mst.set_condition(ConditionId::HaveOnslaught); }
    if input.have_tailwind { mst.set_condition(ConditionId::HaveTailwind); }
    if input.have_arcane_surge { mst.set_condition(ConditionId::HaveArcaneSurge); }

    // --- Attributes ----------------------------------------------------------
    let strength = db.calc(StatId::STR, eff_str as f64, &cfg, &mst).round();
    let dexterity = db.calc(StatId::DEX, eff_dex as f64, &cfg, &mst).round();
    let intelligence = db.calc(StatId::INT, eff_int as f64, &cfg, &mst).round();
    mst.strength = strength;
    mst.dexterity = dexterity;
    mst.intelligence = intelligence;

    // --- Pool ----------------------------------------------------------------
    let life = {
        let base = 38.0 + (input.level as f64 - 1.0) * 12.0 + (strength / 2.0).floor();
        db.calc(StatId::LIFE, base, &cfg, &mst).round().max(1.0)
    };
    let energy_shield = {
        let int_bonus = (intelligence / 5.0).floor();
        let (flat, inc, more) = db.buckets(StatId::ENERGY_SHIELD, &cfg, &mst);
        (flat * (1.0 + (inc + int_bonus) / 100.0) * more).round().max(0.0)
    };
    let mana = {
        let base = 34.0 + (input.level as f64 - 1.0) * 6.0 + (intelligence / 2.0).floor();
        db.calc(StatId::MANA, base, &cfg, &mst).round().max(0.0)
    };

    // --- Ward ----------------------------------------------------------------
    let ward = db.sum_base(StatId::WARD, &cfg, &mst).max(0.0);

    // --- ES Recharge ---------------------------------------------------------
    let es_recharge_inc = db.sum_inc(StatId::ES_RECHARGE_RATE, &cfg, &mst);
    let es_recharge_rate = if energy_shield > 0.0 {
        (energy_shield / 2.0) * (1.0 + es_recharge_inc / 100.0)
    } else {
        0.0
    };

    // --- Armour / Evasion ----------------------------------------------------
    let armour = {
        let str_armour_bonus = (strength / 5.0).floor();
        db.calc(StatId::ARMOUR, str_armour_bonus, &cfg, &mst).round()
    };
    let evasion = {
        let dex_evasion_bonus = (dexterity / 5.0).floor();
        db.calc(StatId::EVASION, dex_evasion_bonus, &cfg, &mst).round().max(0.0)
    };

    // --- Resistances with max res cap ----------------------------------------
    let fire_res_max = 75.0 + db.sum_base(StatId::FIRE_RES_MAX, &cfg, &mst);
    let cold_res_max = 75.0 + db.sum_base(StatId::COLD_RES_MAX, &cfg, &mst);
    let lightning_res_max = 75.0 + db.sum_base(StatId::LIGHTNING_RES_MAX, &cfg, &mst);
    let chaos_res_max = 75.0;
    let fire_res = (db.sum_base(StatId::FIRE_RES, &cfg, &mst) - 60.0).min(fire_res_max);
    let cold_res = (db.sum_base(StatId::COLD_RES, &cfg, &mst) - 60.0).min(cold_res_max);
    let lightning_res = (db.sum_base(StatId::LIGHTNING_RES, &cfg, &mst) - 60.0).min(lightning_res_max);
    let chaos_res = (db.sum_base(StatId::CHAOS_RES, &cfg, &mst) - 60.0).min(chaos_res_max);

    // --- Block ---------------------------------------------------------------
    let block_chance = db.sum_base(StatId::BLOCK_CHANCE, &cfg, &mst).clamp(0.0, 75.0);
    let spell_block = db.sum_base(StatId::SPELL_BLOCK_CHANCE, &cfg, &mst).clamp(0.0, 75.0);

    // --- Suppression ---------------------------------------------------------
    let suppression = db.sum_base(StatId::SPELL_SUPPRESSION, &cfg, &mst).clamp(0.0, 100.0);

    // --- Accuracy / Hit Chance (PoB formula) ---------------------------------
    let accuracy = {
        let base = (input.level as f64 - 1.0) * 2.0 + dexterity * 2.0;
        db.calc(StatId::ACCURACY, base, &cfg, &mst).round().max(0.0)
    };
    let enemy_evasion = 600.0;
    let hit_chance = if enemy_evasion <= 0.0 {
        100.0
    } else {
        let raw = accuracy / (accuracy + (enemy_evasion / 5.0_f64).powf(0.9)) * 125.0;
        raw.clamp(5.0, 100.0)
    };

    // --- DPS via damage.rs conversion pipeline --------------------------------
    let gem = if !input.main_skill_id.is_empty() {
        gems::lookup_gem(&input.main_skill_id)
    } else {
        None
    };

    let has_weapon = input.weapon_aps > 0.0;
    let has_weapon2 = input.is_dual_wield && input.weapon2_aps > 0.0;

    // For dual-wield, average both weapons' stats
    let (eff_weapon_phys_min, eff_weapon_phys_max, eff_weapon_aps, eff_weapon_crit) = if has_weapon2 {
        (
            (input.weapon_phys_min + input.weapon2_phys_min) / 2.0,
            (input.weapon_phys_max + input.weapon2_phys_max) / 2.0,
            (input.weapon_aps + input.weapon2_aps) / 2.0,
            (input.weapon_crit + input.weapon2_crit) / 2.0,
        )
    } else {
        (input.weapon_phys_min, input.weapon_phys_max, input.weapon_aps, input.weapon_crit)
    };

    // Build base damage set from gem + weapon
    let mut base_dmg = damage::DamageSet::new();
    if let Some(g) = gem {
        if !g.is_dot {
            for dr in g.base_damages {
                let dt = match dr.damage_type {
                    gems::DamageType::Physical => damage::DamageType::Physical,
                    gems::DamageType::Fire => damage::DamageType::Fire,
                    gems::DamageType::Cold => damage::DamageType::Cold,
                    gems::DamageType::Lightning => damage::DamageType::Lightning,
                    gems::DamageType::Chaos => damage::DamageType::Chaos,
                };
                base_dmg.add(dt, (dr.min + dr.max) / 2.0);
            }
        }
    }

    // Add weapon physical damage
    if has_weapon {
        let weapon_avg = (eff_weapon_phys_min + eff_weapon_phys_max) / 2.0;
        if weapon_avg > 0.0 {
            base_dmg.add(damage::DamageType::Physical, weapon_avg);
        }
    }

    // Added flat damage from mods
    let effectiveness = gem.map(|g| g.damage_effectiveness).unwrap_or(1.0);
    let added_types = [
        (StatId::ADDED_PHYS_MIN, StatId::ADDED_PHYS_MAX, damage::DamageType::Physical),
        (StatId::ADDED_FIRE_MIN, StatId::ADDED_FIRE_MAX, damage::DamageType::Fire),
        (StatId::ADDED_COLD_MIN, StatId::ADDED_COLD_MAX, damage::DamageType::Cold),
        (StatId::ADDED_LIGHTNING_MIN, StatId::ADDED_LIGHTNING_MAX, damage::DamageType::Lightning),
        (StatId::ADDED_CHAOS_MIN, StatId::ADDED_CHAOS_MAX, damage::DamageType::Chaos),
    ];
    for (min_stat, max_stat, dt) in &added_types {
        let min_val = db.sum_base(*min_stat, &cfg, &mst);
        let max_val = db.sum_base(*max_stat, &cfg, &mst);
        if min_val > 0.0 || max_val > 0.0 {
            base_dmg.add(*dt, (min_val + max_val) / 2.0 * effectiveness);
        }
    }

    // Generic flat "Damage" mod spread equally across present types or as physical
    let generic_flat = db.sum_base(StatId::DAMAGE, &cfg, &mst);
    if generic_flat > 0.0 {
        let present: Vec<damage::DamageType> = damage::DamageType::ALL.iter()
            .filter(|dt| base_dmg.get(**dt) > 0.0)
            .copied().collect();
        if present.is_empty() {
            base_dmg.add(damage::DamageType::Physical, generic_flat * effectiveness);
        } else {
            for dt in &present {
                base_dmg.add(*dt, generic_flat * effectiveness / present.len() as f64);
            }
        }
    }

    // Gain-as-extra damage: add percentage of physical base as extra elemental/chaos
    let phys_base = base_dmg.get(damage::DamageType::Physical);
    if phys_base > 0.0 {
        let gain_as = [
            (StatId::PHYS_GAIN_AS_FIRE, damage::DamageType::Fire),
            (StatId::PHYS_GAIN_AS_COLD, damage::DamageType::Cold),
            (StatId::PHYS_GAIN_AS_LIGHTNING, damage::DamageType::Lightning),
            (StatId::PHYS_GAIN_AS_CHAOS, damage::DamageType::Chaos),
        ];
        for (stat, dt) in &gain_as {
            let pct = db.sum_base(*stat, &cfg, &mst);
            if pct > 0.0 {
                base_dmg.add(*dt, phys_base * pct / 100.0);
            }
        }
    }

    // Build conversion table from both BuildInput fields and parsed mods
    let mut conversions = damage::ConversionTable::new();
    let conv_sources = [
        (StatId::CONV_PHYS_TO_FIRE, damage::DamageType::Physical, damage::DamageType::Fire, input.conversion_phys_to_fire),
        (StatId::CONV_PHYS_TO_COLD, damage::DamageType::Physical, damage::DamageType::Cold, input.conversion_phys_to_cold),
        (StatId::CONV_PHYS_TO_LIGHTNING, damage::DamageType::Physical, damage::DamageType::Lightning, input.conversion_phys_to_lightning),
        (StatId::CONV_PHYS_TO_CHAOS, damage::DamageType::Physical, damage::DamageType::Chaos, input.conversion_phys_to_chaos),
        (StatId::CONV_COLD_TO_FIRE, damage::DamageType::Cold, damage::DamageType::Fire, 0.0),
        (StatId::CONV_LIGHTNING_TO_COLD, damage::DamageType::Lightning, damage::DamageType::Cold, 0.0),
    ];
    for (stat, from, to, input_val) in &conv_sources {
        let mod_val = db.sum_base(*stat, &cfg, &mst);
        let total = input_val + mod_val;
        if total > 0.0 {
            conversions.insert((*from, *to), total);
        }
    }

    // Build per-type damage modifiers, including ElementalDamage for ele types
    let ele_inc = db.sum_inc(StatId::ELEMENTAL_DAMAGE, &cfg, &mst);
    let ele_more = db.product_more(StatId::ELEMENTAL_DAMAGE, &cfg, &mst);

    let mut type_mods = damage::DamageModifiers::new();
    let type_stat_map = [
        (damage::DamageType::Physical, StatId::PHYSICAL_DAMAGE, false),
        (damage::DamageType::Fire, StatId::FIRE_DAMAGE, true),
        (damage::DamageType::Cold, StatId::COLD_DAMAGE, true),
        (damage::DamageType::Lightning, StatId::LIGHTNING_DAMAGE, true),
        (damage::DamageType::Chaos, StatId::CHAOS_DAMAGE, false),
    ];
    for (dt, stat, is_ele) in &type_stat_map {
        let (flat, mut inc, mut more) = db.buckets(*stat, &cfg, &mst);
        if *is_ele {
            inc += ele_inc;
            more *= ele_more;
        }
        if flat != 0.0 || inc != 0.0 || more != 1.0 {
            type_mods.insert(*dt, (flat, inc, more));
        }
    }

    // Global + tag-based damage mods
    let mut total_global_inc = db.sum_inc(StatId::DAMAGE, &cfg, &mst);
    let mut total_global_more = db.product_more(StatId::DAMAGE, &cfg, &mst);

    if let Some(g) = gem {
        for tag in g.tags {
            let tag_stat = match tag {
                gems::GemTag::Attack => Some(StatId::ATTACK_DAMAGE),
                gems::GemTag::Spell => Some(StatId::SPELL_DAMAGE),
                gems::GemTag::Melee => Some(StatId::MELEE_DAMAGE),
                gems::GemTag::Projectile => Some(StatId::PROJECTILE_DAMAGE),
                gems::GemTag::AoE => Some(StatId::AREA_DAMAGE),
                _ => None,
            };
            if let Some(stat) = tag_stat {
                total_global_inc += db.sum_inc(stat, &cfg, &mst);
                total_global_more *= db.product_more(stat, &cfg, &mst);
            }
        }
        if g.tags.contains(&gems::GemTag::DoT) || g.is_dot {
            total_global_inc += db.sum_inc(StatId::DAMAGE_OVER_TIME, &cfg, &mst);
            total_global_more *= db.product_more(StatId::DAMAGE_OVER_TIME, &cfg, &mst);
        }
    }

    // Speed
    let base_speed = match gem {
        Some(g) if !g.is_dot => if has_weapon { eff_weapon_aps } else { 1.0 / g.base_cast_time },
        _ => if has_weapon { eff_weapon_aps } else { 1.0 },
    };
    let attack_speed = db.calc(StatId::ATTACK_SPEED, base_speed, &cfg, &mst);

    // Crit
    let crit_base_mod = db.sum_base(StatId::CRIT_CHANCE, &cfg, &mst);
    let gem_base_crit = match gem {
        Some(g) if !g.is_dot => if has_weapon && eff_weapon_crit > 0.0 { eff_weapon_crit } else { g.base_crit_chance },
        _ => if has_weapon && eff_weapon_crit > 0.0 { eff_weapon_crit } else { 5.0 },
    };
    let base_crit = if crit_base_mod != 0.0 { gem_base_crit + crit_base_mod } else { gem_base_crit };
    let crit_inc = db.sum_inc(StatId::CRIT_CHANCE, &cfg, &mst);
    let crit_more = db.product_more(StatId::CRIT_CHANCE, &cfg, &mst);
    let crit_chance = calc_stat(base_crit, 0.0, crit_inc, crit_more).clamp(0.0, 100.0);
    let crit_multi = 150.0 + db.sum_base(StatId::CRIT_MULTIPLIER, &cfg, &mst);

    // Use damage.rs pipeline for hit DPS
    let hit_result = damage::calc_hit_dps(
        &base_dmg, &conversions, &type_mods,
        total_global_inc, total_global_more,
        crit_chance, crit_multi,
        attack_speed, hit_chance,
    );

    // Per-type resistance application
    let fire_pen = db.sum_base(StatId::FIRE_PEN, &cfg, &mst);
    let cold_pen = db.sum_base(StatId::COLD_PEN, &cfg, &mst);
    let lightning_pen = db.sum_base(StatId::LIGHTNING_PEN, &cfg, &mst);
    let _chaos_pen = db.sum_base(StatId::CHAOS_PEN, &cfg, &mst);

    let (e_fire, e_cold, e_light, _e_chaos) = if input.enemy_is_boss {
        (input.enemy_fire_res.max(40.0), input.enemy_cold_res.max(40.0),
         input.enemy_lightning_res.max(40.0), input.enemy_chaos_res.max(25.0))
    } else {
        (input.enemy_fire_res, input.enemy_cold_res,
         input.enemy_lightning_res, input.enemy_chaos_res)
    };

    let avg_pen = (fire_pen + cold_pen + lightning_pen) / 3.0;
    let avg_enemy_ele_res = (e_fire + e_cold + e_light) / 3.0;
    let res_mult = apply_resistance(avg_enemy_ele_res, avg_pen);

    let total_dps = if gem.map_or(false, |g| g.is_dot) {
        let dot_base = gem.unwrap().dot_base;
        let (dot_flat, dot_inc, dot_more) = db.buckets(StatId::DAMAGE, &cfg, &mst);
        let dot_inc2 = db.sum_inc(StatId::DAMAGE_OVER_TIME, &cfg, &mst);
        let dot_more2 = db.product_more(StatId::DAMAGE_OVER_TIME, &cfg, &mst);
        calc_stat(dot_base, dot_flat, dot_inc + dot_inc2, dot_more * dot_more2) * res_mult
    } else {
        hit_result.dps * res_mult
    };

    // Ailment DPS
    let phys_hit = hit_result.per_type.get("Physical").copied().unwrap_or(0.0);
    let fire_hit = hit_result.per_type.get("Fire").copied().unwrap_or(0.0);
    let chaos_hit = hit_result.per_type.get("Chaos").copied().unwrap_or(0.0);

    let bleed_dps = if phys_hit > 0.0 {
        let crimson = input.allocated_keystones.iter().any(|k| k.contains("Crimson Dance"));
        damage::calc_bleed(phys_hit, db.sum_inc(StatId::BLEED_DAMAGE, &cfg, &mst), 1.0, 0.0, crimson).total_dps
    } else { 0.0 };

    let poison_dps = if (phys_hit + chaos_hit) > 0.0 {
        let poison_chance = db.sum_base(StatId::POISON_CHANCE, &cfg, &mst).min(100.0);
        if poison_chance > 0.0 {
            damage::calc_poison(phys_hit, chaos_hit, db.sum_inc(StatId::POISON_DAMAGE, &cfg, &mst), 1.0, 0.0, poison_chance, attack_speed).total_dps
        } else { 0.0 }
    } else { 0.0 };

    let ignite_dps = if fire_hit > 0.0 {
        damage::calc_ignite(fire_hit, db.sum_inc(StatId::IGNITE_DAMAGE, &cfg, &mst), 1.0, 0.0).total_dps
    } else { 0.0 };

    // --- Trigger rate capping --------------------------------------------------
    let mut trigger_rate = 0.0_f64;
    let total_dps = {
        let mut dps = total_dps;
        for gem_name in &input.support_gems {
            if let Some(tt) = triggers::detect_trigger(gem_name) {
                let config = match tt {
                    triggers::TriggerType::CastOnCrit =>
                        triggers::TriggerConfig::cast_on_crit(attack_speed, crit_chance),
                    triggers::TriggerType::Spellslinger =>
                        triggers::TriggerConfig::spellslinger(attack_speed),
                    triggers::TriggerType::CastWhenDamageTaken =>
                        triggers::TriggerConfig::cwdt(20),
                    _ => triggers::TriggerConfig::self_cast(),
                };
                let rate = triggers::calc_trigger_rate(&config);
                if rate > 0.0 {
                    trigger_rate = rate;
                    let hit_dmg = if hit_result.avg_hit > 0.0 { hit_result.avg_hit } else { dps / attack_speed.max(0.01) };
                    dps = hit_dmg * rate * res_mult;
                }
                break;
            }
        }
        dps
    };

    // --- Minion DPS -----------------------------------------------------------
    let total_dps_with_minions = if !input.minion_skill_id.is_empty() {
        if let Some(base) = minions::get_minion_base(&input.minion_skill_id) {
            let minion_inc = db.sum_inc(StatId::MINION_DAMAGE, &cfg, &mst);
            let minion_more = db.product_more(StatId::MINION_DAMAGE, &cfg, &mst);
            let minion_spd_inc = db.sum_inc(StatId::MINION_SPEED, &cfg, &mst);
            let minion_dps = minions::calc_minion_dps(
                base,
                minion_inc,
                if minion_more != 1.0 { minion_more } else { 1.0 },
                minion_spd_inc,
            );
            total_dps + minion_dps
        } else {
            total_dps
        }
    } else {
        total_dps
    };

    // Impale DPS
    let impale_chance_total = input.impale_chance + db.sum_base(StatId::IMPALE_CHANCE, &cfg, &mst);
    let impale_dps = if impale_chance_total > 0.0 && phys_hit > 0.0 {
        let chance = impale_chance_total.min(100.0);
        let stacks = 5_u32;
        let impale_effect = db.sum_base(StatId::IMPALE_EFFECT, &cfg, &mst);
        phys_hit * attack_speed * (hit_chance / 100.0)
            * (chance / 100.0)
            * stacks.min(5) as f64
            * 0.1
            * (1.0 + impale_effect / 100.0)
            * res_mult
    } else {
        0.0
    };

    let combined_dps = total_dps + bleed_dps + poison_dps + ignite_dps + impale_dps;

    // --- Regen ---------------------------------------------------------------
    let life_regen_flat = db.sum_base(StatId::LIFE_REGEN, &cfg, &mst);
    let life_regen_pct = db.sum_base(StatId::LIFE_REGEN_PCT, &cfg, &mst);
    let life_regen = life_regen_flat + life * life_regen_pct / 100.0;

    let mana_regen_flat = db.sum_base(StatId::MANA_REGEN, &cfg, &mst);
    let mana_regen_inc = db.sum_inc(StatId::MANA_REGEN, &cfg, &mst);
    let base_mana_regen = mana * 0.0175;
    let mana_regen = (base_mana_regen + mana_regen_flat) * (1.0 + mana_regen_inc / 100.0);

    let es_regen = db.sum_base(StatId::ES_REGEN, &cfg, &mst);

    // --- Aura reservation -------------------------------------------------------
    let mana_reserved_pct = input.mana_reserved_pct.clamp(0.0, 100.0);
    let life_reserved_pct = input.life_reserved_pct.clamp(0.0, 100.0);
    let mana_unreserved = mana * (1.0 - mana_reserved_pct / 100.0);
    let life_unreserved = life * (1.0 - life_reserved_pct / 100.0);
    let is_low_life = life > 0.0 && (life_unreserved / life) < 0.5;

    // Pain Attunement: 30% more spell damage when on low life
    let total_dps = if is_low_life
        && input.allocated_keystones.iter().any(|k| {
            let lk = k.to_lowercase();
            lk.contains("pain attunement")
        })
        && gem.map_or(false, |g| g.tags.contains(&gems::GemTag::Spell))
    {
        total_dps * 1.3
    } else {
        total_dps
    };

    // --- Leech rate --------------------------------------------------------------
    let leech_pct = db.sum_base(StatId::LIFE_LEECH_PCT, &cfg, &mst);
    let max_life_leech_rate = life * 0.20; // 20% of max life per second
    let life_leech_rate = if leech_pct > 0.0 && total_dps > 0.0 {
        (total_dps * leech_pct / 100.0).min(max_life_leech_rate)
    } else {
        0.0
    };

    let es_leech_pct = db.sum_base(StatId::ES_LEECH_PCT, &cfg, &mst);
    let max_es_leech_rate = energy_shield * 0.20;
    let es_leech_rate = if es_leech_pct > 0.0 && total_dps > 0.0 {
        (total_dps * es_leech_pct / 100.0).min(max_es_leech_rate)
    } else {
        0.0
    };

    // --- Derived defences ----------------------------------------------------
    let phys_reduction = phys_reduction_from_armour(armour, 83.0 * 5.0)
        + db.sum_base(StatId::PHYS_DAMAGE_REDUCTION, &cfg, &mst)
        + db.sum_base(StatId::DAMAGE_TAKEN_REDUCTION, &cfg, &mst);
    let phys_reduction = phys_reduction.min(90.0);
    let evade_chance = calc_evade_chance(evasion, 600.0);

    // Suppression reduces spell damage by 50%
    let suppression_mult = 1.0 - (suppression / 100.0) * 0.5;

    // Mind over Matter: 30% of damage taken from mana before life
    let has_mom = input.allocated_keystones.iter().any(|k| {
        let lk = k.to_lowercase();
        lk.contains("mind over matter") || lk == "mom"
    });
    let effective_pool = if has_mom {
        life_unreserved + (mana_unreserved * 0.3)
    } else {
        life
    };

    let total_ehp = calc_ehp(effective_pool + ward, energy_shield, phys_reduction, block_chance, evade_chance)
        / suppression_mult;

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
        bleed_dps,
        poison_dps,
        ignite_dps,
        combined_dps,
        life_regen,
        mana_regen,
        es_regen,
        evade_chance,
        phys_reduction,
        suppression,
        trigger_rate,
        total_dps_with_minions,
        mana_unreserved,
        life_unreserved,
        mana_reserved_percent: mana_reserved_pct,
        life_leech_rate,
        es_leech_rate,
        impale_dps,
        ward,
        es_recharge_rate,
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
        assert_eq!(out.fire_res, 75.0); // capped at max fire res (75% default)
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
