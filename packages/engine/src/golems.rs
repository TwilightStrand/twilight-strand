use crate::mod_db::{Mod, ModType, StatId};

// Golem buff base values by gem level (level, value) pairs for interpolation
const CHAOS_GOLEM_RES: &[(u32, f64)] = &[
    (1, 5.0), (5, 7.0), (10, 9.0), (15, 13.0), (18, 17.0), (20, 19.0), (21, 20.0),
];

const STONE_GOLEM_REGEN: &[(u32, f64)] = &[
    (1, 15.8), (5, 22.3), (10, 33.5), (15, 52.3), (18, 67.3), (20, 78.5), (21, 84.5),
];

const LIGHTNING_GOLEM_SPEED: &[(u32, f64)] = &[
    (1, 6.0), (5, 7.0), (10, 8.0), (15, 9.0), (18, 10.0), (20, 11.0), (21, 11.0),
];

const FLAME_GOLEM_DAMAGE: &[(u32, f64)] = &[
    (1, 15.0), (5, 18.0), (10, 22.0), (15, 27.0), (18, 30.0), (20, 33.0), (21, 34.0),
];

const ICE_GOLEM_ACC_CRIT: &[(u32, f64)] = &[
    (1, 20.0), (5, 23.0), (10, 29.0), (15, 34.0), (18, 37.0), (20, 39.0), (21, 40.0),
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

/// Returns mods for a golem's buff, scaled by increased golem buff effect.
/// `inc_effect` is the total "increased Effect of Buffs granted by your Golems"
/// as a percentage (e.g. 80.0 for 80%).
pub fn get_golem_buff_mods(golem_name: &str, gem_level: u32, inc_effect: f64) -> Vec<Mod> {
    let scale = 1.0 + inc_effect / 100.0;

    match golem_name {
        "Summon Chaos Golem" => {
            let base = interpolate(CHAOS_GOLEM_RES, gem_level);
            vec![
                Mod::new(StatId::CHAOS_RES, ModType::Base, (base * scale).floor()),
            ]
        }
        "Summon Stone Golem" => {
            let base = interpolate(STONE_GOLEM_REGEN, gem_level);
            vec![
                Mod::new(StatId::LIFE_REGEN, ModType::Base, base * scale),
            ]
        }
        "Summon Lightning Golem" => {
            let base = interpolate(LIGHTNING_GOLEM_SPEED, gem_level);
            vec![
                Mod::new(StatId::ATTACK_SPEED, ModType::Increased, (base * scale).floor()),
                Mod::new(StatId::CAST_SPEED, ModType::Increased, (base * scale).floor()),
            ]
        }
        "Summon Flame Golem" => {
            let base = interpolate(FLAME_GOLEM_DAMAGE, gem_level);
            vec![
                Mod::new(StatId::DAMAGE, ModType::Increased, (base * scale).floor()),
            ]
        }
        "Summon Ice Golem" => {
            let base = interpolate(ICE_GOLEM_ACC_CRIT, gem_level);
            vec![
                Mod::new(StatId::ACCURACY, ModType::Increased, (base * scale).floor()),
                Mod::new(StatId::CRIT_CHANCE, ModType::Increased, (base * scale).floor()),
            ]
        }
        _ => vec![],
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn chaos_golem_level_18_with_80_effect() {
        let mods = get_golem_buff_mods("Summon Chaos Golem", 18, 80.0);
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].value, 30.0); // floor(17 * 1.8) = 30
    }

    #[test]
    fn lightning_golem_level_20_no_effect() {
        let mods = get_golem_buff_mods("Summon Lightning Golem", 20, 0.0);
        assert_eq!(mods.len(), 2);
        assert_eq!(mods[0].value, 11.0);
    }

    #[test]
    fn unknown_golem_returns_empty() {
        let mods = get_golem_buff_mods("Unknown", 20, 0.0);
        assert!(mods.is_empty());
    }
}
