use serde::{Serialize, Deserialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct WeaponBase {
    pub name: &'static str,
    pub base_phys_min: f64,
    pub base_phys_max: f64,
    pub base_crit: f64,
    pub base_aps: f64,
    pub weapon_type: &'static str,
}

pub const WEAPON_BASES: &[WeaponBase] = &[
    WeaponBase { name: "Jewelled Foil", base_phys_min: 30.0, base_phys_max: 56.0, base_crit: 5.5, base_aps: 1.6, weapon_type: "sword" },
    WeaponBase { name: "Corsair Sword", base_phys_min: 37.0, base_phys_max: 69.0, base_crit: 5.0, base_aps: 1.5, weapon_type: "sword" },
    WeaponBase { name: "Vaal Hatchet", base_phys_min: 36.0, base_phys_max: 67.0, base_crit: 5.0, base_aps: 1.5, weapon_type: "axe" },
    WeaponBase { name: "Siege Axe", base_phys_min: 43.0, base_phys_max: 80.0, base_crit: 5.0, base_aps: 1.4, weapon_type: "axe" },
    WeaponBase { name: "Auric Mace", base_phys_min: 48.0, base_phys_max: 72.0, base_crit: 5.0, base_aps: 1.35, weapon_type: "mace" },
    WeaponBase { name: "Opal Wand", base_phys_min: 22.0, base_phys_max: 40.0, base_crit: 7.0, base_aps: 1.3, weapon_type: "wand" },
    WeaponBase { name: "Profane Wand", base_phys_min: 25.0, base_phys_max: 46.0, base_crit: 7.0, base_aps: 1.2, weapon_type: "wand" },
    WeaponBase { name: "Thicket Bow", base_phys_min: 28.0, base_phys_max: 83.0, base_crit: 5.0, base_aps: 1.5, weapon_type: "bow" },
    WeaponBase { name: "Imperial Bow", base_phys_min: 25.0, base_phys_max: 98.0, base_crit: 5.0, base_aps: 1.45, weapon_type: "bow" },
    WeaponBase { name: "Eclipse Staff", base_phys_min: 43.0, base_phys_max: 65.0, base_crit: 6.5, base_aps: 1.25, weapon_type: "staff" },
    WeaponBase { name: "Ambusher", base_phys_min: 24.0, base_phys_max: 96.0, base_crit: 6.1, base_aps: 1.5, weapon_type: "dagger" },
    WeaponBase { name: "Imperial Claw", base_phys_min: 25.0, base_phys_max: 65.0, base_crit: 6.0, base_aps: 1.6, weapon_type: "claw" },
];

pub fn find_weapon_base(name: &str) -> Option<&'static WeaponBase> {
    let lower = name.to_lowercase();
    WEAPON_BASES.iter().find(|w| lower.contains(&w.name.to_lowercase()))
}

pub fn calc_weapon_dps(
    base_min: f64,
    base_max: f64,
    base_aps: f64,
    _base_crit: f64,
    flat_phys_min: f64,
    flat_phys_max: f64,
    inc_phys: f64,
    quality: f64,
    added_ele_min: f64,
    added_ele_max: f64,
) -> WeaponDps {
    let phys_min = (base_min + flat_phys_min) * (1.0 + (inc_phys + quality) / 100.0);
    let phys_max = (base_max + flat_phys_max) * (1.0 + (inc_phys + quality) / 100.0);

    let avg_phys = (phys_min + phys_max) / 2.0;
    let avg_ele = (added_ele_min + added_ele_max) / 2.0;
    let avg_total = avg_phys + avg_ele;

    WeaponDps {
        phys_dps: avg_phys * base_aps,
        ele_dps: avg_ele * base_aps,
        total_dps: avg_total * base_aps,
        aps: base_aps,
        crit: _base_crit,
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct WeaponDps {
    pub phys_dps: f64,
    pub ele_dps: f64,
    pub total_dps: f64,
    pub aps: f64,
    pub crit: f64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_find_weapon() {
        assert!(find_weapon_base("Jewelled Foil").is_some());
        assert!(find_weapon_base("opal wand").is_some());
        assert!(find_weapon_base("nonexistent").is_none());
    }

    #[test]
    fn test_find_weapon_case_insensitive() {
        let w = find_weapon_base("THICKET BOW").unwrap();
        assert_eq!(w.weapon_type, "bow");
    }

    #[test]
    fn test_weapon_dps() {
        let result = calc_weapon_dps(
            30.0, 56.0,
            1.6,
            5.5,
            50.0, 80.0,
            150.0,
            20.0,
            0.0, 0.0,
        );
        assert!(result.phys_dps > 200.0, "pDPS: {}", result.phys_dps);
        assert!(result.total_dps > 200.0);
        assert_eq!(result.ele_dps, 0.0);
    }

    #[test]
    fn test_ele_weapon() {
        let result = calc_weapon_dps(
            22.0, 40.0, 1.3, 7.0,
            0.0, 0.0, 0.0, 0.0,
            50.0, 100.0,
        );
        assert!(result.ele_dps > 0.0);
        assert!(result.total_dps > result.phys_dps);
    }

    #[test]
    fn test_quality_scaling() {
        let no_q = calc_weapon_dps(30.0, 56.0, 1.6, 5.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
        let with_q = calc_weapon_dps(30.0, 56.0, 1.6, 5.5, 0.0, 0.0, 0.0, 20.0, 0.0, 0.0);
        assert!(with_q.phys_dps > no_q.phys_dps);
        let ratio = with_q.phys_dps / no_q.phys_dps;
        assert!((ratio - 1.2).abs() < 0.01, "Quality 20 should give 1.2x: {}", ratio);
    }

    #[test]
    fn test_all_bases_have_positive_dps() {
        for base in WEAPON_BASES {
            let result = calc_weapon_dps(
                base.base_phys_min, base.base_phys_max,
                base.base_aps, base.base_crit,
                0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            );
            assert!(result.phys_dps > 0.0, "{} has zero pDPS", base.name);
            assert!(result.aps > 0.0);
            assert!(result.crit > 0.0);
        }
    }
}
