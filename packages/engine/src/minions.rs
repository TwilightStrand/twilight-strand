use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MinionStats {
    pub base_damage: f64,
    pub attack_speed: f64,
    pub life: f64,
    pub count: u32,
}

pub const MINION_BASES: &[(&str, MinionStats)] = &[
    ("SummonRagingSpirit", MinionStats { base_damage: 150.0, attack_speed: 1.56, life: 839.0, count: 20 }),
    ("RaiseZombie", MinionStats { base_damage: 250.0, attack_speed: 0.87, life: 7800.0, count: 9 }),
    ("RaiseSpectre", MinionStats { base_damage: 400.0, attack_speed: 1.2, life: 10000.0, count: 3 }),
    ("SummonSkeletons", MinionStats { base_damage: 200.0, attack_speed: 0.8, life: 1500.0, count: 10 }),
    ("SummonIceGolem", MinionStats { base_damage: 180.0, attack_speed: 1.0, life: 8000.0, count: 1 }),
    ("SummonFireGolem", MinionStats { base_damage: 220.0, attack_speed: 1.0, life: 8000.0, count: 1 }),
    ("SummonLightningGolem", MinionStats { base_damage: 200.0, attack_speed: 1.2, life: 8000.0, count: 1 }),
    ("SummonChaosGolem", MinionStats { base_damage: 160.0, attack_speed: 1.0, life: 9000.0, count: 1 }),
    ("SummonStoneGolem", MinionStats { base_damage: 280.0, attack_speed: 0.7, life: 12000.0, count: 1 }),
];

pub fn get_minion_base(skill_id: &str) -> Option<&'static MinionStats> {
    MINION_BASES
        .iter()
        .find(|(id, _)| skill_id.contains(id))
        .map(|(_, stats)| stats)
}

pub fn calc_minion_dps(
    base: &MinionStats,
    minion_damage_inc: f64,
    minion_damage_more: f64,
    minion_speed_inc: f64,
) -> f64 {
    let damage = base.base_damage * (1.0 + minion_damage_inc / 100.0) * minion_damage_more;
    let speed = base.attack_speed * (1.0 + minion_speed_inc / 100.0);
    damage * speed * base.count as f64
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_srs_base() {
        let base = get_minion_base("SummonRagingSpirit").unwrap();
        assert_eq!(base.count, 20);
        assert!(base.base_damage > 100.0);
    }

    #[test]
    fn test_srs_dps() {
        let base = get_minion_base("SummonRagingSpirit").unwrap();
        let dps = calc_minion_dps(base, 200.0, 1.5, 30.0);
        // 20 spirits, 150 base * 3.0 inc * 1.5 more = 675 per hit * 1.56*1.3 speed * 20
        assert!(dps > 10000.0, "SRS DPS too low: {}", dps);
    }

    #[test]
    fn test_zombie_dps() {
        let base = get_minion_base("RaiseZombie").unwrap();
        let dps = calc_minion_dps(base, 100.0, 1.0, 0.0);
        // 9 zombies, 250 base * 2.0 inc * 0.87 speed
        assert!(dps > 1000.0, "Zombie DPS too low: {}", dps);
    }

    #[test]
    fn test_spectre_dps() {
        let base = get_minion_base("RaiseSpectre").unwrap();
        let dps = calc_minion_dps(base, 150.0, 1.0, 0.0);
        assert!(dps > 1000.0);
        assert_eq!(base.count, 3);
    }

    #[test]
    fn test_unknown_minion() {
        assert!(get_minion_base("Fireball").is_none());
        assert!(get_minion_base("GroundSlam").is_none());
    }

    #[test]
    fn test_no_mods_dps() {
        let base = get_minion_base("SummonSkeletons").unwrap();
        let dps = calc_minion_dps(base, 0.0, 1.0, 0.0);
        // 10 skeletons * 200 * 0.8 = 1600
        let expected = 200.0 * 0.8 * 10.0;
        assert!((dps - expected).abs() < 1.0, "Expected {}, got {}", expected, dps);
    }

    #[test]
    fn test_golem_lookup() {
        assert!(get_minion_base("SummonIceGolem").is_some());
        assert!(get_minion_base("SummonFireGolem").is_some());
        assert!(get_minion_base("SummonStoneGolem").is_some());
    }
}
