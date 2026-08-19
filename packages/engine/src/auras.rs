use crate::mod_db::{Mod, ModFlags, ModType, StatId};

// ---------------------------------------------------------------------------
// Aura base values by gem level: (level, value) pairs for interpolation.
// Level 1 and 20 from PoB gem data; level 21 is ~level 20 + 5%.
// ---------------------------------------------------------------------------

// Hatred: X% of Physical Damage as Extra Cold Damage
const HATRED_PHYS_AS_COLD: &[(u32, f64)] = &[(1, 15.0), (20, 36.0), (21, 37.0)];

// Anger: Adds X-Y Fire Damage to Attacks
const ANGER_ATTACK_FIRE_MIN: &[(u32, f64)] = &[(1, 10.0), (20, 78.0), (21, 82.0)];
const ANGER_ATTACK_FIRE_MAX: &[(u32, f64)] = &[(1, 16.0), (20, 117.0), (21, 123.0)];
// Anger: Adds X-Y Fire Damage to Spells
const ANGER_SPELL_FIRE_MIN: &[(u32, f64)] = &[(1, 8.0), (20, 63.0), (21, 66.0)];
const ANGER_SPELL_FIRE_MAX: &[(u32, f64)] = &[(1, 12.0), (20, 94.0), (21, 99.0)];

// Wrath: Adds X-Y Lightning Damage to Attacks
const WRATH_ATTACK_LIGHT_MIN: &[(u32, f64)] = &[(1, 2.0), (20, 14.0), (21, 15.0)];
const WRATH_ATTACK_LIGHT_MAX: &[(u32, f64)] = &[(1, 37.0), (20, 236.0), (21, 248.0)];
// Wrath: Adds X-Y Lightning Damage to Spells
const WRATH_SPELL_LIGHT_MIN: &[(u32, f64)] = &[(1, 4.0), (20, 27.0), (21, 28.0)];
const WRATH_SPELL_LIGHT_MAX: &[(u32, f64)] = &[(1, 78.0), (20, 506.0), (21, 531.0)];

// Determination: flat Armour + more Armour %
const DETERMINATION_FLAT_ARMOUR: &[(u32, f64)] = &[(1, 304.0), (20, 2324.0), (21, 2440.0)];
const DETERMINATION_MORE_ARMOUR: &[(u32, f64)] = &[(1, 25.0), (20, 48.0), (21, 49.0)];

// Grace: flat Evasion
const GRACE_FLAT_EVASION: &[(u32, f64)] = &[(1, 373.0), (20, 2924.0), (21, 3070.0)];

// Discipline: flat Energy Shield
const DISCIPLINE_FLAT_ES: &[(u32, f64)] = &[(1, 46.0), (20, 322.0), (21, 338.0)];

// Haste: increased Attack/Cast/Movement Speed
const HASTE_SPEED: &[(u32, f64)] = &[(1, 10.0), (20, 16.0), (21, 17.0)];

// Vitality: % of Life Regenerated per second
const VITALITY_LIFE_REGEN_PCT: &[(u32, f64)] = &[(1, 1.0), (20, 1.65), (21, 1.7)];

// Clarity: flat Mana Regenerated per second
const CLARITY_MANA_REGEN: &[(u32, f64)] = &[(1, 3.0), (20, 29.8), (21, 31.3)];

// Malevolence: Damage over Time Multiplier + more Damage over Time
const MALEVOLENCE_DOT_MULTI: &[(u32, f64)] = &[(1, 10.0), (20, 20.0), (21, 21.0)];
const MALEVOLENCE_MORE_DOT: &[(u32, f64)] = &[(1, 10.0), (20, 19.0), (21, 20.0)];

// Zealotry: more Spell Damage + increased Crit Chance for Spells
const ZEALOTRY_MORE_SPELL: &[(u32, f64)] = &[(1, 8.0), (20, 15.0), (21, 16.0)];
const ZEALOTRY_CRIT_CHANCE: &[(u32, f64)] = &[(1, 68.0), (20, 131.0), (21, 138.0)];

// Pride: more Physical Damage (simplified from "nearby enemies take X% more phys")
const PRIDE_MORE_PHYS: &[(u32, f64)] = &[(1, 20.0), (20, 39.0), (21, 41.0)];

// Purity of Elements: +X% to all Elemental Resistances
const PURITY_ELEMENTS_RES: &[(u32, f64)] = &[(1, 16.0), (20, 34.0), (21, 35.0)];

// Purity of Fire: +X% max Fire Res, +Y% Fire Res
const PURITY_FIRE_MAX: &[(u32, f64)] = &[(1, 2.0), (20, 5.0), (21, 5.0)];
const PURITY_FIRE_RES: &[(u32, f64)] = &[(1, 16.0), (20, 34.0), (21, 35.0)];

// Purity of Ice: +X% max Cold Res, +Y% Cold Res
const PURITY_ICE_MAX: &[(u32, f64)] = &[(1, 2.0), (20, 5.0), (21, 5.0)];
const PURITY_ICE_RES: &[(u32, f64)] = &[(1, 16.0), (20, 34.0), (21, 35.0)];

// Purity of Lightning: +X% max Lightning Res, +Y% Lightning Res
const PURITY_LIGHTNING_MAX: &[(u32, f64)] = &[(1, 2.0), (20, 5.0), (21, 5.0)];
const PURITY_LIGHTNING_RES: &[(u32, f64)] = &[(1, 16.0), (20, 34.0), (21, 35.0)];

// ---------------------------------------------------------------------------
// Interpolation (same logic as golems.rs)
// ---------------------------------------------------------------------------

fn interpolate(table: &[(u32, f64)], level: u32) -> f64 {
    if level <= table[0].0 {
        return table[0].1;
    }
    if level >= table[table.len() - 1].0 {
        return table[table.len() - 1].1;
    }
    for w in table.windows(2) {
        if level >= w[0].0 && level <= w[1].0 {
            let t = (level - w[0].0) as f64 / (w[1].0 - w[0].0) as f64;
            return w[0].1 + t * (w[1].1 - w[0].1);
        }
    }
    table[table.len() - 1].1
}

/// Scale a value by increased aura effect, flooring integer-like stats.
fn scale_floor(base: f64, inc_aura_effect: f64) -> f64 {
    (base * (1.0 + inc_aura_effect / 100.0)).floor()
}

/// Scale a value by increased aura effect, keeping decimal precision.
fn scale(base: f64, inc_aura_effect: f64) -> f64 {
    base * (1.0 + inc_aura_effect / 100.0)
}

/// Returns the mods an aura grants at a given gem level, scaled by increased
/// aura effect. `inc_aura_effect` is a percentage (e.g. 50.0 for 50%).
///
/// Integer-like values (flat damage, flat armour/evasion/ES, resistances) are
/// floored after scaling. Percentage values keep their decimal precision.
pub fn get_aura_mods(aura_name: &str, gem_level: u32, inc_aura_effect: f64) -> Vec<Mod> {
    match aura_name {
        "Hatred" => {
            let v = scale(interpolate(HATRED_PHYS_AS_COLD, gem_level), inc_aura_effect);
            vec![Mod::new(StatId::PHYS_GAIN_AS_COLD, ModType::Base, v)]
        }

        "Anger" => {
            let atk_min = scale_floor(interpolate(ANGER_ATTACK_FIRE_MIN, gem_level), inc_aura_effect);
            let atk_max = scale_floor(interpolate(ANGER_ATTACK_FIRE_MAX, gem_level), inc_aura_effect);
            let spl_min = scale_floor(interpolate(ANGER_SPELL_FIRE_MIN, gem_level), inc_aura_effect);
            let spl_max = scale_floor(interpolate(ANGER_SPELL_FIRE_MAX, gem_level), inc_aura_effect);
            vec![
                Mod::new(StatId::ADDED_FIRE_MIN, ModType::Base, atk_min)
                    .with_flags(ModFlags::ATTACK),
                Mod::new(StatId::ADDED_FIRE_MAX, ModType::Base, atk_max)
                    .with_flags(ModFlags::ATTACK),
                Mod::new(StatId::ADDED_FIRE_MIN, ModType::Base, spl_min)
                    .with_flags(ModFlags::SPELL),
                Mod::new(StatId::ADDED_FIRE_MAX, ModType::Base, spl_max)
                    .with_flags(ModFlags::SPELL),
            ]
        }

        "Wrath" => {
            let atk_min = scale_floor(interpolate(WRATH_ATTACK_LIGHT_MIN, gem_level), inc_aura_effect);
            let atk_max = scale_floor(interpolate(WRATH_ATTACK_LIGHT_MAX, gem_level), inc_aura_effect);
            let spl_min = scale_floor(interpolate(WRATH_SPELL_LIGHT_MIN, gem_level), inc_aura_effect);
            let spl_max = scale_floor(interpolate(WRATH_SPELL_LIGHT_MAX, gem_level), inc_aura_effect);
            vec![
                Mod::new(StatId::ADDED_LIGHTNING_MIN, ModType::Base, atk_min)
                    .with_flags(ModFlags::ATTACK),
                Mod::new(StatId::ADDED_LIGHTNING_MAX, ModType::Base, atk_max)
                    .with_flags(ModFlags::ATTACK),
                Mod::new(StatId::ADDED_LIGHTNING_MIN, ModType::Base, spl_min)
                    .with_flags(ModFlags::SPELL),
                Mod::new(StatId::ADDED_LIGHTNING_MAX, ModType::Base, spl_max)
                    .with_flags(ModFlags::SPELL),
            ]
        }

        "Determination" => {
            let flat = scale_floor(interpolate(DETERMINATION_FLAT_ARMOUR, gem_level), inc_aura_effect);
            let more = scale(interpolate(DETERMINATION_MORE_ARMOUR, gem_level), inc_aura_effect);
            vec![
                Mod::new(StatId::ARMOUR, ModType::Base, flat),
                Mod::new(StatId::ARMOUR, ModType::More, more),
            ]
        }

        "Grace" => {
            let flat = scale_floor(interpolate(GRACE_FLAT_EVASION, gem_level), inc_aura_effect);
            vec![Mod::new(StatId::EVASION, ModType::Base, flat)]
        }

        "Discipline" => {
            let flat = scale_floor(interpolate(DISCIPLINE_FLAT_ES, gem_level), inc_aura_effect);
            vec![Mod::new(StatId::ENERGY_SHIELD, ModType::Base, flat)]
        }

        "Haste" => {
            let v = scale(interpolate(HASTE_SPEED, gem_level), inc_aura_effect);
            vec![
                Mod::new(StatId::ATTACK_SPEED, ModType::Increased, v),
                Mod::new(StatId::CAST_SPEED, ModType::Increased, v),
                Mod::new(StatId::MOVEMENT_SPEED, ModType::Increased, v),
            ]
        }

        "Vitality" => {
            let v = scale(interpolate(VITALITY_LIFE_REGEN_PCT, gem_level), inc_aura_effect);
            vec![Mod::new(StatId::LIFE_REGEN_PCT, ModType::Base, v)]
        }

        "Clarity" => {
            let v = scale(interpolate(CLARITY_MANA_REGEN, gem_level), inc_aura_effect);
            vec![Mod::new(StatId::MANA_REGEN, ModType::Base, v)]
        }

        "Malevolence" => {
            let dot_multi = scale(interpolate(MALEVOLENCE_DOT_MULTI, gem_level), inc_aura_effect);
            let more_dot = scale(interpolate(MALEVOLENCE_MORE_DOT, gem_level), inc_aura_effect);
            vec![
                Mod::new(StatId::DOT_MULTI, ModType::Base, dot_multi),
                Mod::new(StatId::DAMAGE_OVER_TIME, ModType::More, more_dot),
            ]
        }

        "Zealotry" => {
            let more_spell = scale(interpolate(ZEALOTRY_MORE_SPELL, gem_level), inc_aura_effect);
            let crit = scale(interpolate(ZEALOTRY_CRIT_CHANCE, gem_level), inc_aura_effect);
            vec![
                Mod::new(StatId::SPELL_DAMAGE, ModType::More, more_spell),
                Mod::new(StatId::CRIT_CHANCE, ModType::Increased, crit)
                    .with_flags(ModFlags::SPELL),
            ]
        }

        "Pride" => {
            let v = scale(interpolate(PRIDE_MORE_PHYS, gem_level), inc_aura_effect);
            vec![Mod::new(StatId::PHYSICAL_DAMAGE, ModType::More, v)]
        }

        "Purity of Elements" => {
            let v = scale_floor(interpolate(PURITY_ELEMENTS_RES, gem_level), inc_aura_effect);
            vec![
                Mod::new(StatId::FIRE_RES, ModType::Base, v),
                Mod::new(StatId::COLD_RES, ModType::Base, v),
                Mod::new(StatId::LIGHTNING_RES, ModType::Base, v),
            ]
        }

        "Purity of Fire" => {
            let max_res = scale_floor(interpolate(PURITY_FIRE_MAX, gem_level), inc_aura_effect);
            let res = scale_floor(interpolate(PURITY_FIRE_RES, gem_level), inc_aura_effect);
            vec![
                Mod::new(StatId::FIRE_RES_MAX, ModType::Base, max_res),
                Mod::new(StatId::FIRE_RES, ModType::Base, res),
            ]
        }

        "Purity of Ice" => {
            let max_res = scale_floor(interpolate(PURITY_ICE_MAX, gem_level), inc_aura_effect);
            let res = scale_floor(interpolate(PURITY_ICE_RES, gem_level), inc_aura_effect);
            vec![
                Mod::new(StatId::COLD_RES_MAX, ModType::Base, max_res),
                Mod::new(StatId::COLD_RES, ModType::Base, res),
            ]
        }

        "Purity of Lightning" => {
            let max_res = scale_floor(interpolate(PURITY_LIGHTNING_MAX, gem_level), inc_aura_effect);
            let res = scale_floor(interpolate(PURITY_LIGHTNING_RES, gem_level), inc_aura_effect);
            vec![
                Mod::new(StatId::LIGHTNING_RES_MAX, ModType::Base, max_res),
                Mod::new(StatId::LIGHTNING_RES, ModType::Base, res),
            ]
        }

        _ => vec![],
    }
}

// ---------------------------------------------------------------------------
// Aura reservation: base mana % or flat mana reserved per aura.
// From PoB gem data. Level-dependent for flat-cost auras (Clarity, Precision).
// ---------------------------------------------------------------------------

// Clarity: flat mana reservation by level
const CLARITY_MANA_COST: &[(u32, f64)] = &[(1, 34.0), (20, 175.0), (21, 184.0)];

// Precision: flat mana reservation by level
const PRECISION_MANA_COST: &[(u32, f64)] = &[(1, 22.0), (20, 210.0), (21, 221.0)];

// Spellslinger: % mana reservation by level (decreases with level)
const SPELLSLINGER_MANA_PCT: &[(u32, f64)] = &[(1, 30.0), (20, 25.0), (21, 25.0)];

/// Returns the base mana reservation for an aura: `(mana_pct, mana_flat)`.
///
/// Most auras reserve a fixed percentage of mana. Clarity and Precision
/// reserve a flat amount that scales with gem level. Vitality reserves life
/// (not mana), so it returns `(0.0, 0.0)`.
pub fn get_aura_reservation(aura_name: &str, gem_level: u32) -> (f64, f64) {
    match aura_name {
        // 50% mana auras
        "Anger" | "Determination" | "Discipline" | "Grace" | "Hatred"
        | "Malevolence" | "Pride" | "Wrath" | "Zealotry" | "Haste" => (50.0, 0.0),

        // 35% mana auras (Purity auras)
        "Purity of Elements" | "Purity of Fire" | "Purity of Ice"
        | "Purity of Lightning" => (35.0, 0.0),

        // 25% mana (Heralds)
        "Herald of Ash" | "Herald of Ice" | "Herald of Thunder"
        | "Herald of Purity" | "Herald of Agony" => (25.0, 0.0),

        // 10% mana (Banners)
        "Dread Banner" | "War Banner" | "Defiance Banner" => (10.0, 0.0),

        // Flat mana reservation (level-scaled)
        "Clarity" => (0.0, interpolate(CLARITY_MANA_COST, gem_level)),
        "Precision" => (0.0, interpolate(PRECISION_MANA_COST, gem_level)),

        // Vitality reserves life, not mana
        "Vitality" => (0.0, 0.0),

        _ => (0.0, 0.0),
    }
}

/// Returns the base mana reservation percentage for one Spellslinger link
/// at the given gem level. Spellslinger reserves mana per linked group.
pub fn get_spellslinger_reservation(gem_level: u32) -> f64 {
    interpolate(SPELLSLINGER_MANA_PCT, gem_level)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    // --- Hatred ---

    #[test]
    fn hatred_level_20() {
        let mods = get_aura_mods("Hatred", 20, 0.0);
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, StatId::PHYS_GAIN_AS_COLD);
        assert!((mods[0].value - 36.0).abs() < 0.01);
    }

    #[test]
    fn hatred_with_50_aura_effect() {
        let mods = get_aura_mods("Hatred", 20, 50.0);
        // 36 * 1.5 = 54
        assert!((mods[0].value - 54.0).abs() < 0.01);
    }

    // --- Anger ---

    #[test]
    fn anger_level_20() {
        let mods = get_aura_mods("Anger", 20, 0.0);
        assert_eq!(mods.len(), 4);
        // Attack fire min/max
        assert!(mods.iter().any(|m| m.stat == StatId::ADDED_FIRE_MIN
            && m.flags == ModFlags::ATTACK
            && m.value == 78.0));
        assert!(mods.iter().any(|m| m.stat == StatId::ADDED_FIRE_MAX
            && m.flags == ModFlags::ATTACK
            && m.value == 117.0));
        // Spell fire min/max
        assert!(mods.iter().any(|m| m.stat == StatId::ADDED_FIRE_MIN
            && m.flags == ModFlags::SPELL
            && m.value == 63.0));
        assert!(mods.iter().any(|m| m.stat == StatId::ADDED_FIRE_MAX
            && m.flags == ModFlags::SPELL
            && m.value == 94.0));
    }

    // --- Wrath ---

    #[test]
    fn wrath_level_20() {
        let mods = get_aura_mods("Wrath", 20, 0.0);
        assert_eq!(mods.len(), 4);
        assert!(mods.iter().any(|m| m.stat == StatId::ADDED_LIGHTNING_MIN
            && m.flags == ModFlags::ATTACK
            && m.value == 14.0));
        assert!(mods.iter().any(|m| m.stat == StatId::ADDED_LIGHTNING_MAX
            && m.flags == ModFlags::ATTACK
            && m.value == 236.0));
        assert!(mods.iter().any(|m| m.stat == StatId::ADDED_LIGHTNING_MIN
            && m.flags == ModFlags::SPELL
            && m.value == 27.0));
        assert!(mods.iter().any(|m| m.stat == StatId::ADDED_LIGHTNING_MAX
            && m.flags == ModFlags::SPELL
            && m.value == 506.0));
    }

    // --- Determination ---

    #[test]
    fn determination_level_20() {
        let mods = get_aura_mods("Determination", 20, 0.0);
        assert!(mods.iter().any(|m| m.stat == StatId::ARMOUR
            && m.mod_type == ModType::Base
            && m.value == 2324.0));
        assert!(mods.iter().any(|m| m.stat == StatId::ARMOUR
            && m.mod_type == ModType::More
            && (m.value - 48.0).abs() < 0.01));
    }

    #[test]
    fn determination_with_50_aura_effect() {
        let mods = get_aura_mods("Determination", 20, 50.0);
        // 2324 * 1.5 = 3486
        assert!(mods.iter().any(|m| m.stat == StatId::ARMOUR
            && m.mod_type == ModType::Base
            && m.value == 3486.0));
        // 48 * 1.5 = 72
        assert!(mods.iter().any(|m| m.stat == StatId::ARMOUR
            && m.mod_type == ModType::More
            && (m.value - 72.0).abs() < 0.01));
    }

    // --- Grace ---

    #[test]
    fn grace_level_20() {
        let mods = get_aura_mods("Grace", 20, 0.0);
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, StatId::EVASION);
        assert_eq!(mods[0].value, 2924.0);
    }

    // --- Discipline ---

    #[test]
    fn discipline_level_20() {
        let mods = get_aura_mods("Discipline", 20, 0.0);
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, StatId::ENERGY_SHIELD);
        assert_eq!(mods[0].value, 322.0);
    }

    // --- Haste ---

    #[test]
    fn haste_level_20() {
        let mods = get_aura_mods("Haste", 20, 0.0);
        assert_eq!(mods.len(), 3);
        assert!(mods.iter().any(|m| m.stat == StatId::ATTACK_SPEED
            && (m.value - 16.0).abs() < 0.01));
        assert!(mods.iter().any(|m| m.stat == StatId::CAST_SPEED
            && (m.value - 16.0).abs() < 0.01));
        assert!(mods.iter().any(|m| m.stat == StatId::MOVEMENT_SPEED
            && (m.value - 16.0).abs() < 0.01));
    }

    // --- Vitality ---

    #[test]
    fn vitality_level_20() {
        let mods = get_aura_mods("Vitality", 20, 0.0);
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, StatId::LIFE_REGEN_PCT);
        assert!((mods[0].value - 1.65).abs() < 0.01);
    }

    // --- Clarity ---

    #[test]
    fn clarity_level_20() {
        let mods = get_aura_mods("Clarity", 20, 0.0);
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, StatId::MANA_REGEN);
        assert!((mods[0].value - 29.8).abs() < 0.01);
    }

    // --- Malevolence ---

    #[test]
    fn malevolence_level_20() {
        let mods = get_aura_mods("Malevolence", 20, 0.0);
        assert_eq!(mods.len(), 2);
        assert!(mods.iter().any(|m| m.stat == StatId::DOT_MULTI
            && (m.value - 20.0).abs() < 0.01));
        assert!(mods.iter().any(|m| m.stat == StatId::DAMAGE_OVER_TIME
            && m.mod_type == ModType::More
            && (m.value - 19.0).abs() < 0.01));
    }

    // --- Zealotry ---

    #[test]
    fn zealotry_level_20() {
        let mods = get_aura_mods("Zealotry", 20, 0.0);
        assert_eq!(mods.len(), 2);
        assert!(mods.iter().any(|m| m.stat == StatId::SPELL_DAMAGE
            && m.mod_type == ModType::More
            && (m.value - 15.0).abs() < 0.01));
        assert!(mods.iter().any(|m| m.stat == StatId::CRIT_CHANCE
            && m.flags == ModFlags::SPELL
            && (m.value - 131.0).abs() < 0.01));
    }

    // --- Pride ---

    #[test]
    fn pride_level_20() {
        let mods = get_aura_mods("Pride", 20, 0.0);
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, StatId::PHYSICAL_DAMAGE);
        assert_eq!(mods[0].mod_type, ModType::More);
        assert!((mods[0].value - 39.0).abs() < 0.01);
    }

    // --- Purity of Elements ---

    #[test]
    fn purity_of_elements_level_20() {
        let mods = get_aura_mods("Purity of Elements", 20, 0.0);
        assert_eq!(mods.len(), 3);
        assert!(mods.iter().any(|m| m.stat == StatId::FIRE_RES && m.value == 34.0));
        assert!(mods.iter().any(|m| m.stat == StatId::COLD_RES && m.value == 34.0));
        assert!(mods.iter().any(|m| m.stat == StatId::LIGHTNING_RES && m.value == 34.0));
    }

    // --- Purity of Fire ---

    #[test]
    fn purity_of_fire_level_20() {
        let mods = get_aura_mods("Purity of Fire", 20, 0.0);
        assert_eq!(mods.len(), 2);
        assert!(mods.iter().any(|m| m.stat == StatId::FIRE_RES_MAX && m.value == 5.0));
        assert!(mods.iter().any(|m| m.stat == StatId::FIRE_RES && m.value == 34.0));
    }

    // --- Purity of Ice ---

    #[test]
    fn purity_of_ice_level_20() {
        let mods = get_aura_mods("Purity of Ice", 20, 0.0);
        assert_eq!(mods.len(), 2);
        assert!(mods.iter().any(|m| m.stat == StatId::COLD_RES_MAX && m.value == 5.0));
        assert!(mods.iter().any(|m| m.stat == StatId::COLD_RES && m.value == 34.0));
    }

    // --- Purity of Lightning ---

    #[test]
    fn purity_of_lightning_level_20() {
        let mods = get_aura_mods("Purity of Lightning", 20, 0.0);
        assert_eq!(mods.len(), 2);
        assert!(mods.iter().any(|m| m.stat == StatId::LIGHTNING_RES_MAX && m.value == 5.0));
        assert!(mods.iter().any(|m| m.stat == StatId::LIGHTNING_RES && m.value == 34.0));
    }

    // --- Aura effect scaling ---

    #[test]
    fn purity_of_elements_with_100_aura_effect() {
        let mods = get_aura_mods("Purity of Elements", 20, 100.0);
        // 34 * 2.0 = 68
        assert!(mods.iter().all(|m| m.value == 68.0));
    }

    #[test]
    fn anger_with_50_aura_effect() {
        let mods = get_aura_mods("Anger", 20, 50.0);
        // Attack min: floor(78 * 1.5) = 117
        assert!(mods.iter().any(|m| m.stat == StatId::ADDED_FIRE_MIN
            && m.flags == ModFlags::ATTACK
            && m.value == 117.0));
        // Attack max: floor(117 * 1.5) = 175
        assert!(mods.iter().any(|m| m.stat == StatId::ADDED_FIRE_MAX
            && m.flags == ModFlags::ATTACK
            && m.value == 175.0));
    }

    // --- Level interpolation ---

    #[test]
    fn determination_level_10_interpolated() {
        // Linear interpolation between level 1 (304) and level 20 (2324)
        // At level 10: 304 + (10-1)/(20-1) * (2324-304) = 304 + 9/19 * 2020 = 304 + 956.84.. = 1260.84..
        let mods = get_aura_mods("Determination", 10, 0.0);
        let flat = mods.iter().find(|m| m.mod_type == ModType::Base).unwrap();
        assert!((flat.value - 1260.0).abs() < 1.0);
    }

    // --- Unknown aura ---

    #[test]
    fn unknown_aura_returns_empty() {
        let mods = get_aura_mods("Nonexistent", 20, 0.0);
        assert!(mods.is_empty());
    }

    // --- Reservation ---

    #[test]
    fn reservation_50pct_auras() {
        for name in &["Anger", "Determination", "Discipline", "Grace", "Hatred",
                       "Malevolence", "Pride", "Wrath", "Zealotry", "Haste"] {
            let (pct, flat) = get_aura_reservation(name, 20);
            assert_eq!(pct, 50.0, "{name} should reserve 50%");
            assert_eq!(flat, 0.0, "{name} should have no flat reservation");
        }
    }

    #[test]
    fn reservation_35pct_purity_auras() {
        for name in &["Purity of Elements", "Purity of Fire", "Purity of Ice",
                       "Purity of Lightning"] {
            let (pct, flat) = get_aura_reservation(name, 20);
            assert_eq!(pct, 35.0, "{name} should reserve 35%");
            assert_eq!(flat, 0.0);
        }
    }

    #[test]
    fn reservation_25pct_heralds() {
        for name in &["Herald of Ash", "Herald of Ice", "Herald of Thunder",
                       "Herald of Purity", "Herald of Agony"] {
            let (pct, flat) = get_aura_reservation(name, 20);
            assert_eq!(pct, 25.0, "{name} should reserve 25%");
            assert_eq!(flat, 0.0);
        }
    }

    #[test]
    fn reservation_10pct_banners() {
        for name in &["Dread Banner", "War Banner", "Defiance Banner"] {
            let (pct, flat) = get_aura_reservation(name, 20);
            assert_eq!(pct, 10.0, "{name} should reserve 10%");
            assert_eq!(flat, 0.0);
        }
    }

    #[test]
    fn reservation_clarity_flat_at_level_20() {
        let (pct, flat) = get_aura_reservation("Clarity", 20);
        assert_eq!(pct, 0.0);
        assert!((flat - 175.0).abs() < 0.01, "Clarity L20 reserves 175 flat mana, got {flat}");
    }

    #[test]
    fn reservation_clarity_flat_at_level_21() {
        let (pct, flat) = get_aura_reservation("Clarity", 21);
        assert_eq!(pct, 0.0);
        assert!((flat - 184.0).abs() < 0.01, "Clarity L21 reserves 184 flat mana, got {flat}");
    }

    #[test]
    fn reservation_precision_flat_at_level_20() {
        let (pct, flat) = get_aura_reservation("Precision", 20);
        assert_eq!(pct, 0.0);
        assert!((flat - 210.0).abs() < 0.01, "Precision L20 reserves 210 flat mana, got {flat}");
    }

    #[test]
    fn reservation_vitality_does_not_reserve_mana() {
        let (pct, flat) = get_aura_reservation("Vitality", 20);
        assert_eq!(pct, 0.0);
        assert_eq!(flat, 0.0);
    }

    #[test]
    fn reservation_unknown_returns_zero() {
        let (pct, flat) = get_aura_reservation("Nonexistent", 20);
        assert_eq!(pct, 0.0);
        assert_eq!(flat, 0.0);
    }

    #[test]
    fn spellslinger_reservation_level_20() {
        let pct = get_spellslinger_reservation(20);
        assert!((pct - 25.0).abs() < 0.01, "Spellslinger L20 reserves 25%, got {pct}");
    }

    #[test]
    fn spellslinger_reservation_level_1() {
        let pct = get_spellslinger_reservation(1);
        assert!((pct - 30.0).abs() < 0.01, "Spellslinger L1 reserves 30%, got {pct}");
    }
}
