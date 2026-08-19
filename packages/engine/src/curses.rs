use crate::mod_db::{Mod, ModType, StatId};

// ---------------------------------------------------------------------------
// Curse base values at level 20 (from PoB).
// Each table holds (gem_level, value) pairs for interpolation.
// ---------------------------------------------------------------------------

// Frostbite: -X% to Cold Resistance
const FROSTBITE_COLD_RES: &[(u32, f64)] = &[
    (1, -25.0), (5, -29.0), (10, -33.0), (15, -38.0), (18, -42.0), (20, -44.0), (21, -45.0),
];

// Flammability: -X% to Fire Resistance
const FLAMMABILITY_FIRE_RES: &[(u32, f64)] = &[
    (1, -25.0), (5, -29.0), (10, -33.0), (15, -38.0), (18, -42.0), (20, -44.0), (21, -45.0),
];

// Conductivity: -X% to Lightning Resistance
const CONDUCTIVITY_LIGHTNING_RES: &[(u32, f64)] = &[
    (1, -25.0), (5, -29.0), (10, -33.0), (15, -38.0), (18, -42.0), (20, -44.0), (21, -45.0),
];

// Elemental Weakness: -X% to Elemental Resistances (all three)
const ELEMENTAL_WEAKNESS_RES: &[(u32, f64)] = &[
    (1, -15.0), (5, -19.0), (10, -23.0), (15, -28.0), (18, -32.0), (20, -34.0), (21, -35.0),
];

// Despair: -X% to Chaos Resistance
const DESPAIR_CHAOS_RES: &[(u32, f64)] = &[
    (1, -5.0), (5, -6.0), (10, -7.0), (15, -8.0), (18, -9.0), (20, -10.0), (21, -11.0),
];

// Despair: +X% to Damage over Time Multiplier
const DESPAIR_DOT_MULTI: &[(u32, f64)] = &[
    (1, 10.0), (5, 13.0), (10, 15.0), (15, 18.0), (18, 20.0), (20, 21.0), (21, 22.0),
];

// Vulnerability: Enemies take X% increased Physical Damage
const VULNERABILITY_PHYS_TAKEN: &[(u32, f64)] = &[
    (1, 15.0), (5, 18.0), (10, 21.0), (15, 25.0), (18, 28.0), (20, 29.0), (21, 30.0),
];

// Vulnerability: +X% to Physical Damage over Time Multiplier
const VULNERABILITY_PHYS_DOT_MULTI: &[(u32, f64)] = &[
    (1, 15.0), (5, 18.0), (10, 21.0), (15, 25.0), (18, 28.0), (20, 30.0), (21, 31.0),
];

// Punishment: X% more Attack and Cast Speed
const PUNISHMENT_SPEED: &[(u32, f64)] = &[
    (1, 15.0), (5, 18.0), (10, 21.0), (15, 25.0), (18, 28.0), (20, 29.0), (21, 30.0),
];

// Enfeeble: Enemies deal X% less Damage
const ENFEEBLE_LESS_DAMAGE: &[(u32, f64)] = &[
    (1, 10.0), (5, 13.0), (10, 15.0), (15, 18.0), (18, 20.0), (20, 21.0), (21, 22.0),
];

// Temporal Chains: Enemies are X% slower
const TEMPORAL_CHAINS_SLOW: &[(u32, f64)] = &[
    (1, 15.0), (5, 18.0), (10, 21.0), (15, 25.0), (18, 28.0), (20, 29.0), (21, 30.0),
];

// Assassin's Mark: +X% Critical Strike Chance against cursed enemies
const ASSASSIN_MARK_CRIT_CHANCE: &[(u32, f64)] = &[
    (1, 3.5), (5, 4.5), (10, 5.5), (15, 6.5), (18, 7.0), (20, 7.5), (21, 8.0),
];

// Assassin's Mark: +X% to Critical Strike Multiplier against cursed enemies
const ASSASSIN_MARK_CRIT_MULTI: &[(u32, f64)] = &[
    (1, 12.0), (5, 15.0), (10, 18.0), (15, 22.0), (18, 24.0), (20, 26.0), (21, 27.0),
];

// Poacher's Mark: X% increased Flask Charges gained
const POACHER_MARK_FLASK: &[(u32, f64)] = &[
    (1, 10.0), (5, 14.0), (10, 17.0), (15, 21.0), (18, 24.0), (20, 25.0), (21, 26.0),
];

// Warlord's Mark: +X% of Damage Leeched as Life
const WARLORD_MARK_LEECH: &[(u32, f64)] = &[
    (1, 1.0), (5, 1.2), (10, 1.4), (15, 1.7), (18, 1.9), (20, 2.0), (21, 2.1),
];

// Sniper's Mark: Projectiles deal X% increased Damage against cursed enemies
const SNIPER_MARK_PROJ_INC: &[(u32, f64)] = &[
    (1, 25.0), (5, 29.0), (10, 33.0), (15, 38.0), (18, 42.0), (20, 44.0), (21, 45.0),
];

// Sniper's Mark: cursed enemies take X% increased Projectile Damage
const SNIPER_MARK_PROJ_TAKEN: &[(u32, f64)] = &[
    (1, 10.0), (5, 12.0), (10, 14.0), (15, 16.0), (18, 18.0), (20, 19.0), (21, 20.0),
];

fn interpolate(table: &[(u32, f64)], level: u32) -> f64 {
    if level <= table[0].0 { return table[0].1; }
    if level >= table[table.len()-1].0 { return table[table.len()-1].1; }
    for w in table.windows(2) {
        if level >= w[0].0 && level <= w[1].0 {
            let t = (level - w[0].0) as f64 / (w[1].0 - w[0].0) as f64;
            return w[0].1 + t * (w[1].1 - w[0].1);
        }
    }
    table[table.len()-1].1
}

/// Returns mods for a curse's effect on enemies, scaled by increased curse effect.
/// `inc_curse_effect` is the total "increased Effect of your Curses" as a percentage
/// (e.g. 40.0 for 40% increased curse effect).
///
/// Resistance reduction values are stored as negative numbers (e.g. -44 for Frostbite
/// at level 20), so they reduce enemy resistance when summed as Base mods on the
/// ENEMY_*_RES stats.
pub fn get_curse_mods(curse_name: &str, gem_level: u32, inc_curse_effect: f64) -> Vec<Mod> {
    let scale = 1.0 + inc_curse_effect / 100.0;

    match curse_name {
        "Frostbite" => {
            let base = interpolate(FROSTBITE_COLD_RES, gem_level);
            vec![
                Mod::new(StatId::ENEMY_COLD_RES, ModType::Base, (base * scale).floor()),
            ]
        }
        "Flammability" => {
            let base = interpolate(FLAMMABILITY_FIRE_RES, gem_level);
            vec![
                Mod::new(StatId::ENEMY_FIRE_RES, ModType::Base, (base * scale).floor()),
            ]
        }
        "Conductivity" => {
            let base = interpolate(CONDUCTIVITY_LIGHTNING_RES, gem_level);
            vec![
                Mod::new(StatId::ENEMY_LIGHTNING_RES, ModType::Base, (base * scale).floor()),
            ]
        }
        "Elemental Weakness" => {
            let base = interpolate(ELEMENTAL_WEAKNESS_RES, gem_level);
            let val = (base * scale).floor();
            vec![
                Mod::new(StatId::ENEMY_FIRE_RES, ModType::Base, val),
                Mod::new(StatId::ENEMY_COLD_RES, ModType::Base, val),
                Mod::new(StatId::ENEMY_LIGHTNING_RES, ModType::Base, val),
            ]
        }
        "Despair" => {
            let chaos_res = interpolate(DESPAIR_CHAOS_RES, gem_level);
            let dot_multi = interpolate(DESPAIR_DOT_MULTI, gem_level);
            vec![
                Mod::new(StatId::ENEMY_CHAOS_RES, ModType::Base, (chaos_res * scale).floor()),
                Mod::new(StatId::DOT_MULTI, ModType::Base, (dot_multi * scale).floor()),
            ]
        }
        "Vulnerability" => {
            let phys_taken = interpolate(VULNERABILITY_PHYS_TAKEN, gem_level);
            let phys_dot = interpolate(VULNERABILITY_PHYS_DOT_MULTI, gem_level);
            vec![
                Mod::new(StatId::ENEMY_PHYS_DAMAGE_TAKEN, ModType::Increased, (phys_taken * scale).floor()),
                Mod::new(StatId::PHYS_DOT_MULTI, ModType::Base, (phys_dot * scale).floor()),
            ]
        }
        "Punishment" => {
            let speed = interpolate(PUNISHMENT_SPEED, gem_level);
            let val = (speed * scale).floor();
            vec![
                Mod::new(StatId::ATTACK_SPEED, ModType::More, val),
                Mod::new(StatId::CAST_SPEED, ModType::More, val),
            ]
        }
        "Enfeeble" => {
            let less_dmg = interpolate(ENFEEBLE_LESS_DAMAGE, gem_level);
            vec![
                Mod::new(StatId::ENEMY_DAMAGE_DEALT, ModType::More, -(less_dmg * scale).floor()),
            ]
        }
        "Temporal Chains" => {
            let slow = interpolate(TEMPORAL_CHAINS_SLOW, gem_level);
            vec![
                Mod::new(StatId::ENEMY_ACTION_SPEED, ModType::Base, -(slow * scale).floor()),
            ]
        }
        "Assassin's Mark" => {
            let crit = interpolate(ASSASSIN_MARK_CRIT_CHANCE, gem_level);
            let multi = interpolate(ASSASSIN_MARK_CRIT_MULTI, gem_level);
            vec![
                Mod::new(StatId::CRIT_CHANCE, ModType::Base, (crit * scale * 10.0).floor() / 10.0),
                Mod::new(StatId::CRIT_MULTIPLIER, ModType::Base, (multi * scale).floor()),
            ]
        }
        "Poacher's Mark" => {
            let flask = interpolate(POACHER_MARK_FLASK, gem_level);
            vec![
                Mod::new(StatId::FLASK_CHARGES_GAINED, ModType::Increased, (flask * scale).floor()),
                Mod::new(StatId::FRENZY_CHARGE_ON_HIT, ModType::Flag, 1.0),
            ]
        }
        "Warlord's Mark" => {
            let leech = interpolate(WARLORD_MARK_LEECH, gem_level);
            vec![
                Mod::new(StatId::ENDURANCE_CHARGE_ON_HIT, ModType::Flag, 1.0),
                Mod::new(StatId::LIFE_LEECH_PCT, ModType::Base, (leech * scale * 10.0).floor() / 10.0),
            ]
        }
        "Sniper's Mark" => {
            let proj_inc = interpolate(SNIPER_MARK_PROJ_INC, gem_level);
            let proj_taken = interpolate(SNIPER_MARK_PROJ_TAKEN, gem_level);
            vec![
                Mod::new(StatId::PROJECTILE_DAMAGE, ModType::Increased, (proj_inc * scale).floor()),
                Mod::new(StatId::ENEMY_PROJECTILE_DAMAGE_TAKEN, ModType::Increased, (proj_taken * scale).floor()),
            ]
        }
        _ => vec![],
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn frostbite_level_20() {
        let mods = get_curse_mods("Frostbite", 20, 0.0);
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, StatId::ENEMY_COLD_RES);
        assert_eq!(mods[0].value, -44.0);
    }

    #[test]
    fn flammability_level_20() {
        let mods = get_curse_mods("Flammability", 20, 0.0);
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, StatId::ENEMY_FIRE_RES);
        assert_eq!(mods[0].value, -44.0);
    }

    #[test]
    fn conductivity_level_20() {
        let mods = get_curse_mods("Conductivity", 20, 0.0);
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, StatId::ENEMY_LIGHTNING_RES);
        assert_eq!(mods[0].value, -44.0);
    }

    #[test]
    fn elemental_weakness_level_20() {
        let mods = get_curse_mods("Elemental Weakness", 20, 0.0);
        assert_eq!(mods.len(), 3);
        // All three should reduce by 34
        for m in &mods {
            assert_eq!(m.value, -34.0);
        }
        assert_eq!(mods[0].stat, StatId::ENEMY_FIRE_RES);
        assert_eq!(mods[1].stat, StatId::ENEMY_COLD_RES);
        assert_eq!(mods[2].stat, StatId::ENEMY_LIGHTNING_RES);
    }

    #[test]
    fn despair_level_20() {
        let mods = get_curse_mods("Despair", 20, 0.0);
        assert_eq!(mods.len(), 2);
        assert_eq!(mods[0].stat, StatId::ENEMY_CHAOS_RES);
        assert_eq!(mods[0].value, -10.0);
        assert_eq!(mods[1].stat, StatId::DOT_MULTI);
        assert_eq!(mods[1].value, 21.0);
    }

    #[test]
    fn vulnerability_level_20() {
        let mods = get_curse_mods("Vulnerability", 20, 0.0);
        assert_eq!(mods.len(), 2);
        assert_eq!(mods[0].stat, StatId::ENEMY_PHYS_DAMAGE_TAKEN);
        assert_eq!(mods[0].value, 29.0);
        assert_eq!(mods[1].stat, StatId::PHYS_DOT_MULTI);
        assert_eq!(mods[1].value, 30.0);
    }

    #[test]
    fn punishment_level_20() {
        let mods = get_curse_mods("Punishment", 20, 0.0);
        assert_eq!(mods.len(), 2);
        assert_eq!(mods[0].stat, StatId::ATTACK_SPEED);
        assert_eq!(mods[0].mod_type, ModType::More);
        assert_eq!(mods[0].value, 29.0);
        assert_eq!(mods[1].stat, StatId::CAST_SPEED);
        assert_eq!(mods[1].value, 29.0);
    }

    #[test]
    fn enfeeble_level_20() {
        let mods = get_curse_mods("Enfeeble", 20, 0.0);
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, StatId::ENEMY_DAMAGE_DEALT);
        assert_eq!(mods[0].value, -21.0);
    }

    #[test]
    fn temporal_chains_level_20() {
        let mods = get_curse_mods("Temporal Chains", 20, 0.0);
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, StatId::ENEMY_ACTION_SPEED);
        assert_eq!(mods[0].value, -29.0);
    }

    #[test]
    fn assassin_mark_level_20() {
        let mods = get_curse_mods("Assassin's Mark", 20, 0.0);
        assert_eq!(mods.len(), 2);
        assert_eq!(mods[0].stat, StatId::CRIT_CHANCE);
        assert_eq!(mods[0].value, 7.5);
        assert_eq!(mods[1].stat, StatId::CRIT_MULTIPLIER);
        assert_eq!(mods[1].value, 26.0);
    }

    #[test]
    fn poacher_mark_level_20() {
        let mods = get_curse_mods("Poacher's Mark", 20, 0.0);
        assert_eq!(mods.len(), 2);
        assert_eq!(mods[0].stat, StatId::FLASK_CHARGES_GAINED);
        assert_eq!(mods[0].value, 25.0);
        assert_eq!(mods[1].stat, StatId::FRENZY_CHARGE_ON_HIT);
    }

    #[test]
    fn warlord_mark_level_20() {
        let mods = get_curse_mods("Warlord's Mark", 20, 0.0);
        assert_eq!(mods.len(), 2);
        assert_eq!(mods[0].stat, StatId::ENDURANCE_CHARGE_ON_HIT);
        assert_eq!(mods[1].stat, StatId::LIFE_LEECH_PCT);
        assert_eq!(mods[1].value, 2.0);
    }

    #[test]
    fn sniper_mark_level_20() {
        let mods = get_curse_mods("Sniper's Mark", 20, 0.0);
        assert_eq!(mods.len(), 2);
        assert_eq!(mods[0].stat, StatId::PROJECTILE_DAMAGE);
        assert_eq!(mods[0].value, 44.0);
        assert_eq!(mods[1].stat, StatId::ENEMY_PROJECTILE_DAMAGE_TAKEN);
        assert_eq!(mods[1].value, 19.0);
    }

    #[test]
    fn unknown_curse_returns_empty() {
        let mods = get_curse_mods("Nonexistent Curse", 20, 0.0);
        assert!(mods.is_empty());
    }

    #[test]
    fn curse_effect_scales_values() {
        // 40% increased curse effect on Frostbite level 20 (-44 base)
        let mods = get_curse_mods("Frostbite", 20, 40.0);
        assert_eq!(mods.len(), 1);
        // floor(-44 * 1.4) = floor(-61.6) = -62
        assert_eq!(mods[0].value, -62.0);
    }

    #[test]
    fn interpolation_between_levels() {
        // Level 15 Frostbite should give -38
        let mods = get_curse_mods("Frostbite", 15, 0.0);
        assert_eq!(mods[0].value, -38.0);

        // Level 1 should give -25
        let mods = get_curse_mods("Frostbite", 1, 0.0);
        assert_eq!(mods[0].value, -25.0);
    }

    #[test]
    fn level_21_frostbite() {
        let mods = get_curse_mods("Frostbite", 21, 0.0);
        assert_eq!(mods[0].value, -45.0);
    }

    #[test]
    fn elemental_weakness_with_curse_effect() {
        // 20% increased curse effect on Elemental Weakness level 20 (-34 base)
        let mods = get_curse_mods("Elemental Weakness", 20, 20.0);
        // floor(-34 * 1.2) = floor(-40.8) = -41
        for m in &mods {
            assert_eq!(m.value, -41.0);
        }
    }
}
