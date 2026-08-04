use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::LazyLock;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DamageRange {
    pub min: f64,
    pub max: f64,
    pub damage_type: DamageType,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum DamageType {
    Physical,
    Fire,
    Cold,
    Lightning,
    Chaos,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum GemTag {
    Attack,
    Spell,
    Melee,
    Projectile,
    AoE,
    Channelling,
    Duration,
    Minion,
    DoT,
    Aura,
    Herald,
    Vaal,
}

#[derive(Clone, Debug, Serialize)]
pub struct GemData {
    pub skill_id: &'static str,
    pub name: &'static str,
    #[serde(skip)]
    pub base_damages: &'static [DamageRange],
    pub base_crit_chance: f64,
    pub base_cast_time: f64,
    pub damage_effectiveness: f64,
    #[serde(skip)]
    pub tags: &'static [GemTag],
    pub is_dot: bool,
    pub dot_base: f64,
}

const GROUND_SLAM_DAMAGES: &[DamageRange] = &[DamageRange {
    min: 200.0,
    max: 300.0,
    damage_type: DamageType::Physical,
}];

const LIGHTNING_ARROW_DAMAGES: &[DamageRange] = &[
    DamageRange {
        min: 150.0,
        max: 250.0,
        damage_type: DamageType::Physical,
    },
    DamageRange {
        min: 50.0,
        max: 100.0,
        damage_type: DamageType::Lightning,
    },
];

const WINTER_ORB_DAMAGES: &[DamageRange] = &[DamageRange {
    min: 100.0,
    max: 150.0,
    damage_type: DamageType::Cold,
}];

const ARC_DAMAGES: &[DamageRange] = &[DamageRange {
    min: 80.0,
    max: 400.0,
    damage_type: DamageType::Lightning,
}];

const FIREBALL_DAMAGES: &[DamageRange] = &[DamageRange {
    min: 500.0,
    max: 750.0,
    damage_type: DamageType::Fire,
}];

const BLADE_VORTEX_DAMAGES: &[DamageRange] = &[DamageRange {
    min: 80.0,
    max: 120.0,
    damage_type: DamageType::Physical,
}];

const SRS_DAMAGES: &[DamageRange] = &[
    DamageRange {
        min: 60.0,
        max: 90.0,
        damage_type: DamageType::Physical,
    },
    DamageRange {
        min: 80.0,
        max: 120.0,
        damage_type: DamageType::Fire,
    },
];

const CYCLONE_DAMAGES: &[DamageRange] = &[DamageRange {
    min: 50.0,
    max: 75.0,
    damage_type: DamageType::Physical,
}];

const SPARK_DAMAGES: &[DamageRange] = &[DamageRange {
    min: 30.0,
    max: 560.0,
    damage_type: DamageType::Lightning,
}];

const ICE_NOVA_DAMAGES: &[DamageRange] = &[DamageRange {
    min: 250.0,
    max: 370.0,
    damage_type: DamageType::Cold,
}];

const EMPTY_RANGES: &[DamageRange] = &[];

const TAGS_ATTACK_MELEE_AOE: &[GemTag] = &[GemTag::Attack, GemTag::Melee, GemTag::AoE];
const TAGS_ATTACK_PROJ: &[GemTag] = &[GemTag::Attack, GemTag::Projectile];
const TAGS_SPELL_PROJ_CHANNEL: &[GemTag] =
    &[GemTag::Spell, GemTag::Projectile, GemTag::Channelling];
const TAGS_SPELL_CHAIN: &[GemTag] = &[GemTag::Spell];
const TAGS_SPELL_PROJ: &[GemTag] = &[GemTag::Spell, GemTag::Projectile];
const TAGS_SPELL_AOE: &[GemTag] = &[GemTag::Spell, GemTag::AoE];
const TAGS_SPELL_DOT: &[GemTag] = &[GemTag::Spell, GemTag::DoT];
const TAGS_MINION: &[GemTag] = &[GemTag::Minion];
const TAGS_ATTACK_MELEE_CHANNEL: &[GemTag] =
    &[GemTag::Attack, GemTag::Melee, GemTag::AoE, GemTag::Channelling];

static GEM_TABLE: LazyLock<HashMap<&'static str, GemData>> = LazyLock::new(|| {
    let gems: Vec<GemData> = vec![
        GemData {
            skill_id: "GroundSlam",
            name: "Ground Slam",
            base_damages: GROUND_SLAM_DAMAGES,
            base_crit_chance: 5.0,
            base_cast_time: 1.0,
            damage_effectiveness: 1.1,
            tags: TAGS_ATTACK_MELEE_AOE,
            is_dot: false,
            dot_base: 0.0,
        },
        GemData {
            skill_id: "LightningArrow",
            name: "Lightning Arrow",
            base_damages: LIGHTNING_ARROW_DAMAGES,
            base_crit_chance: 5.0,
            base_cast_time: 1.0,
            damage_effectiveness: 1.04,
            tags: TAGS_ATTACK_PROJ,
            is_dot: false,
            dot_base: 0.0,
        },
        GemData {
            skill_id: "WinterOrb",
            name: "Winter Orb",
            base_damages: WINTER_ORB_DAMAGES,
            base_crit_chance: 6.0,
            base_cast_time: 0.72,
            damage_effectiveness: 0.5,
            tags: TAGS_SPELL_PROJ_CHANNEL,
            is_dot: false,
            dot_base: 0.0,
        },
        GemData {
            skill_id: "RighteousFire",
            name: "Righteous Fire",
            base_damages: EMPTY_RANGES,
            base_crit_chance: 0.0,
            base_cast_time: 0.0,
            damage_effectiveness: 0.0,
            tags: TAGS_SPELL_DOT,
            is_dot: true,
            dot_base: 100.0,
        },
        GemData {
            skill_id: "Arc",
            name: "Arc",
            base_damages: ARC_DAMAGES,
            base_crit_chance: 5.0,
            base_cast_time: 0.7,
            damage_effectiveness: 0.8,
            tags: TAGS_SPELL_CHAIN,
            is_dot: false,
            dot_base: 0.0,
        },
        GemData {
            skill_id: "Fireball",
            name: "Fireball",
            base_damages: FIREBALL_DAMAGES,
            base_crit_chance: 6.0,
            base_cast_time: 0.75,
            damage_effectiveness: 2.4,
            tags: TAGS_SPELL_PROJ,
            is_dot: false,
            dot_base: 0.0,
        },
        GemData {
            skill_id: "SummonRagingSpirit",
            name: "Summon Raging Spirit",
            base_damages: SRS_DAMAGES,
            base_crit_chance: 5.0,
            base_cast_time: 0.5,
            damage_effectiveness: 1.0,
            tags: TAGS_MINION,
            is_dot: false,
            dot_base: 0.0,
        },
        GemData {
            skill_id: "BladeVortex",
            name: "Blade Vortex",
            base_damages: BLADE_VORTEX_DAMAGES,
            base_crit_chance: 6.0,
            base_cast_time: 0.5,
            damage_effectiveness: 0.45,
            tags: TAGS_SPELL_AOE,
            is_dot: false,
            dot_base: 0.0,
        },
        GemData {
            skill_id: "Cyclone",
            name: "Cyclone",
            base_damages: CYCLONE_DAMAGES,
            base_crit_chance: 5.0,
            base_cast_time: 1.0,
            damage_effectiveness: 0.56,
            tags: TAGS_ATTACK_MELEE_CHANNEL,
            is_dot: false,
            dot_base: 0.0,
        },
        GemData {
            skill_id: "Spark",
            name: "Spark",
            base_damages: SPARK_DAMAGES,
            base_crit_chance: 5.0,
            base_cast_time: 0.65,
            damage_effectiveness: 0.75,
            tags: TAGS_SPELL_PROJ,
            is_dot: false,
            dot_base: 0.0,
        },
        GemData {
            skill_id: "IceNova",
            name: "Ice Nova",
            base_damages: ICE_NOVA_DAMAGES,
            base_crit_chance: 6.0,
            base_cast_time: 0.7,
            damage_effectiveness: 1.3,
            tags: TAGS_SPELL_AOE,
            is_dot: false,
            dot_base: 0.0,
        },
    ];

    gems.into_iter().map(|g| (g.skill_id, g)).collect()
});

pub fn lookup_gem(skill_id: &str) -> Option<&'static GemData> {
    GEM_TABLE.get(skill_id)
}

pub fn avg_base_damage(gem: &GemData) -> f64 {
    gem.base_damages
        .iter()
        .map(|d| (d.min + d.max) / 2.0)
        .sum()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lookup_ground_slam() {
        let gem = lookup_gem("GroundSlam").expect("GroundSlam should exist");
        assert_eq!(gem.name, "Ground Slam");
        assert_eq!(gem.base_crit_chance, 5.0);
        assert!(!gem.is_dot);
    }

    #[test]
    fn test_lookup_winter_orb() {
        let gem = lookup_gem("WinterOrb").expect("WinterOrb should exist");
        assert_eq!(gem.name, "Winter Orb");
        assert_eq!(gem.base_cast_time, 0.72);
        assert_eq!(gem.base_damages.len(), 1);
        assert_eq!(gem.base_damages[0].damage_type, DamageType::Cold);
    }

    #[test]
    fn test_lookup_righteous_fire() {
        let gem = lookup_gem("RighteousFire").expect("RF should exist");
        assert!(gem.is_dot);
        assert_eq!(gem.dot_base, 100.0);
        assert!(gem.base_damages.is_empty());
    }

    #[test]
    fn test_lookup_missing() {
        assert!(lookup_gem("NonExistentGem").is_none());
    }

    #[test]
    fn test_avg_base_damage() {
        let gem = lookup_gem("GroundSlam").unwrap();
        let avg = avg_base_damage(gem);
        assert!((avg - 250.0).abs() < 0.01, "expected ~250, got {avg}");
    }

    #[test]
    fn test_multi_element_damage() {
        let gem = lookup_gem("LightningArrow").unwrap();
        let avg = avg_base_damage(gem);
        // phys (150+250)/2 + light (50+100)/2 = 200 + 75 = 275
        assert!((avg - 275.0).abs() < 0.01, "expected ~275, got {avg}");
    }

    #[test]
    fn test_gem_count() {
        assert!(GEM_TABLE.len() >= 10, "expected at least 10 gems");
    }
}
