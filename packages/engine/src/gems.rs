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
    Totem,
    Trap,
    Mine,
    Brand,
}

#[derive(Clone, Debug, Serialize)]
pub struct GemData {
    pub skill_id: &'static str,
    pub name: &'static str,
    #[serde(skip)]
    pub base_damages: Vec<DamageRange>,
    pub base_crit_chance: f64,
    pub base_cast_time: f64,
    pub damage_effectiveness: f64,
    #[serde(skip)]
    pub tags: &'static [GemTag],
    pub is_dot: bool,
    pub dot_base: f64,
    /// Number of stages for channelling skills (e.g. Blade Flurry = 6, Incinerate = 8).
    /// For non-channelling skills this is 0.
    pub stages: u32,
    /// Base number of totems placed (for totem skills). 0 for non-totem skills.
    pub base_totem_count: u32,
}

// ---------------------------------------------------------------------------
// Level-indexed scaling data
// ---------------------------------------------------------------------------

/// Damage scale factors at gem levels 1, 10, 15, 20, 21.
/// The factor at level 20 is always 1.0; other levels multiply the level-20
/// base damages (and dot_base for DoT gems) to approximate that level's output.
///
/// Scale factors for attack gems come from PoB Lua `baseMultiplier` ratios.
/// Scale factors for spell gems come from the PoE effectiveness formula:
///   f(r) = (3.885209 + 0.360246*(r-1)) * (1 + incEff)^(r-1)
/// where r = levelRequirement at each gem level.
struct GemLevelScaling {
    /// (gem_level, damage_scale_relative_to_level_20)
    data_points: [(u32, f64); 5],
}

impl GemLevelScaling {
    fn interpolate(&self, level: u32) -> f64 {
        let level = level.clamp(1, 30);
        for i in 0..4 {
            let (l_a, s_a) = self.data_points[i];
            let (l_b, s_b) = self.data_points[i + 1];
            if level <= l_a {
                return s_a;
            }
            if level <= l_b {
                let t = (level - l_a) as f64 / (l_b - l_a) as f64;
                return s_a + t * (s_b - s_a);
            }
        }
        // Beyond the last data point, extrapolate from the last segment
        let (l_a, s_a) = self.data_points[3];
        let (l_b, s_b) = self.data_points[4];
        let t = (level - l_a) as f64 / (l_b - l_a) as f64;
        s_a + t * (s_b - s_a)
    }
}

static GEM_LEVEL_SCALES: LazyLock<HashMap<&'static str, GemLevelScaling>> = LazyLock::new(|| {
    let mut m = HashMap::new();

    // Attack gems: scale from Lua baseMultiplier at [L1, L10, L15, L20, L21] / L20
    m.insert("GroundSlam", GemLevelScaling {
        // baseMultiplier: 1.323, 2.114, 2.753, 3.569, 3.749
        data_points: [(1, 0.371), (10, 0.592), (15, 0.771), (20, 1.0), (21, 1.050)],
    });
    m.insert("LightningArrow", GemLevelScaling {
        // baseMultiplier: 1.495, 1.626, 1.699, 1.771, 1.786
        data_points: [(1, 0.844), (10, 0.918), (15, 0.959), (20, 1.0), (21, 1.008)],
    });
    m.insert("Cyclone", GemLevelScaling {
        // baseMultiplier: 0.816, 1.140, 1.320, 1.500, 1.536
        data_points: [(1, 0.544), (10, 0.760), (15, 0.880), (20, 1.0), (21, 1.024)],
    });

    // Spell gems: scale from effectiveness formula ratio f(levelReq_L) / f(levelReq_20)
    m.insert("Arc", GemLevelScaling {
        // incEff=0.0395, levelReqs: 12, 44, 59, 70, 72
        data_points: [(1, 0.029), (10, 0.246), (15, 0.563), (20, 1.0), (21, 1.108)],
    });
    m.insert("Fireball", GemLevelScaling {
        // incEff=0.0495, levelReqs: 1, 32, 52, 70, 72
        data_points: [(1, 0.005), (10, 0.084), (15, 0.324), (20, 1.0), (21, 1.129)],
    });
    m.insert("WinterOrb", GemLevelScaling {
        // incEff=0.0355, levelReqs: 28, 50, 60, 70, 72
        data_points: [(1, 0.109), (10, 0.373), (15, 0.617), (20, 1.0), (21, 1.098)],
    });
    m.insert("BladeVortex", GemLevelScaling {
        // incEff=0.0429, levelReqs: 12, 44, 59, 70, 72
        data_points: [(1, 0.024), (10, 0.226), (15, 0.542), (20, 1.0), (21, 1.113)],
    });
    m.insert("Spark", GemLevelScaling {
        // incEff=0.0331, levelReqs: 1, 32, 52, 70, 72
        data_points: [(1, 0.014), (10, 0.152), (15, 0.431), (20, 1.0), (21, 1.094)],
    });
    m.insert("IceNova", GemLevelScaling {
        // incEff=0.0440, levelReqs: 12, 44, 59, 70, 72
        data_points: [(1, 0.022), (10, 0.220), (15, 0.537), (20, 1.0), (21, 1.117)],
    });

    // Totem gems
    m.insert("AncestralWarchief", GemLevelScaling {
        data_points: [(1, 0.400), (10, 0.620), (15, 0.800), (20, 1.0), (21, 1.040)],
    });
    m.insert("HolyFlameTotem", GemLevelScaling {
        data_points: [(1, 0.030), (10, 0.250), (15, 0.560), (20, 1.0), (21, 1.100)],
    });
    // Trap gems
    m.insert("LightningTrap", GemLevelScaling {
        data_points: [(1, 0.025), (10, 0.230), (15, 0.550), (20, 1.0), (21, 1.105)],
    });
    // Mine gems
    m.insert("IceMine", GemLevelScaling {
        data_points: [(1, 0.030), (10, 0.240), (15, 0.560), (20, 1.0), (21, 1.098)],
    });
    // Brand gems
    m.insert("StormBrand", GemLevelScaling {
        data_points: [(1, 0.020), (10, 0.210), (15, 0.530), (20, 1.0), (21, 1.105)],
    });
    // Channelling gems
    m.insert("Incinerate", GemLevelScaling {
        data_points: [(1, 0.025), (10, 0.220), (15, 0.540), (20, 1.0), (21, 1.110)],
    });
    m.insert("BladeFlurry", GemLevelScaling {
        data_points: [(1, 0.500), (10, 0.700), (15, 0.850), (20, 1.0), (21, 1.030)],
    });

    // Minion gem: approximate with moderate spell-like scaling
    m.insert("SummonRagingSpirit", GemLevelScaling {
        data_points: [(1, 0.050), (10, 0.200), (15, 0.500), (20, 1.0), (21, 1.100)],
    });

    // DoT gem: RF spell damage MORE bonus scales 20->39->40 across levels
    m.insert("RighteousFire", GemLevelScaling {
        // spell_damage_+%: 20, 29, 34, 39, 40 => ratios to L20
        data_points: [(1, 0.513), (10, 0.744), (15, 0.872), (20, 1.0), (21, 1.026)],
    });

    m
});

// ---------------------------------------------------------------------------
// Static damage arrays (level-20 values, used as baseline)
// ---------------------------------------------------------------------------

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

// Totem gems
const ANCESTRAL_WARCHIEF_DAMAGES: &[DamageRange] = &[DamageRange {
    min: 180.0,
    max: 270.0,
    damage_type: DamageType::Physical,
}];

const HOLY_FLAME_TOTEM_DAMAGES: &[DamageRange] = &[DamageRange {
    min: 200.0,
    max: 300.0,
    damage_type: DamageType::Fire,
}];

// Trap gems
const LIGHTNING_TRAP_DAMAGES: &[DamageRange] = &[DamageRange {
    min: 60.0,
    max: 300.0,
    damage_type: DamageType::Lightning,
}];

// Mine gems
const ICE_MINE_DAMAGES: &[DamageRange] = &[DamageRange {
    min: 180.0,
    max: 270.0,
    damage_type: DamageType::Cold,
}];

// Brand gems
const STORM_BRAND_DAMAGES: &[DamageRange] = &[DamageRange {
    min: 40.0,
    max: 420.0,
    damage_type: DamageType::Lightning,
}];

// Channelling gems
const INCINERATE_DAMAGES: &[DamageRange] = &[DamageRange {
    min: 30.0,
    max: 45.0,
    damage_type: DamageType::Fire,
}];

const BLADE_FLURRY_DAMAGES: &[DamageRange] = &[DamageRange {
    min: 40.0,
    max: 60.0,
    damage_type: DamageType::Physical,
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
const TAGS_ATTACK_MELEE_TOTEM: &[GemTag] =
    &[GemTag::Attack, GemTag::Melee, GemTag::AoE, GemTag::Totem];
const TAGS_SPELL_AOE_TOTEM: &[GemTag] = &[GemTag::Spell, GemTag::AoE, GemTag::Totem];
const TAGS_SPELL_PROJ_TRAP: &[GemTag] = &[GemTag::Spell, GemTag::Projectile, GemTag::Trap];
const TAGS_SPELL_AOE_MINE: &[GemTag] = &[GemTag::Spell, GemTag::AoE, GemTag::Mine];
const TAGS_SPELL_PROJ_BRAND: &[GemTag] = &[GemTag::Spell, GemTag::Projectile, GemTag::Brand];
const TAGS_SPELL_CHANNEL: &[GemTag] = &[GemTag::Spell, GemTag::AoE, GemTag::Channelling];

// ---------------------------------------------------------------------------
// Level-20 gem template table
// ---------------------------------------------------------------------------

struct GemTemplate {
    skill_id: &'static str,
    name: &'static str,
    base_damages: &'static [DamageRange],
    base_crit_chance: f64,
    base_cast_time: f64,
    damage_effectiveness: f64,
    tags: &'static [GemTag],
    is_dot: bool,
    dot_base: f64,
    stages: u32,
    base_totem_count: u32,
}

impl GemTemplate {
    fn to_gem_data(&self, scale: f64) -> GemData {
        let damages = self.base_damages.iter().map(|d| DamageRange {
            min: d.min * scale,
            max: d.max * scale,
            damage_type: d.damage_type,
        }).collect();
        GemData {
            skill_id: self.skill_id,
            name: self.name,
            base_damages: damages,
            base_crit_chance: self.base_crit_chance,
            base_cast_time: self.base_cast_time,
            damage_effectiveness: self.damage_effectiveness,
            tags: self.tags,
            is_dot: self.is_dot,
            dot_base: self.dot_base * scale,
            stages: self.stages,
            base_totem_count: self.base_totem_count,
        }
    }
}

static GEM_TEMPLATES: LazyLock<HashMap<&'static str, GemTemplate>> = LazyLock::new(|| {
    let templates: Vec<GemTemplate> = vec![
        GemTemplate {
            skill_id: "GroundSlam",
            name: "Ground Slam",
            base_damages: GROUND_SLAM_DAMAGES,
            base_crit_chance: 5.0,
            base_cast_time: 1.0,
            damage_effectiveness: 1.1,
            tags: TAGS_ATTACK_MELEE_AOE,
            is_dot: false,
            dot_base: 0.0,
            stages: 0,
            base_totem_count: 0,
        },
        GemTemplate {
            skill_id: "LightningArrow",
            name: "Lightning Arrow",
            base_damages: LIGHTNING_ARROW_DAMAGES,
            base_crit_chance: 5.0,
            base_cast_time: 1.0,
            damage_effectiveness: 1.04,
            tags: TAGS_ATTACK_PROJ,
            is_dot: false,
            dot_base: 0.0,
            stages: 0,
            base_totem_count: 0,
        },
        GemTemplate {
            skill_id: "WinterOrb",
            name: "Winter Orb",
            base_damages: WINTER_ORB_DAMAGES,
            base_crit_chance: 6.0,
            base_cast_time: 0.72,
            damage_effectiveness: 0.5,
            tags: TAGS_SPELL_PROJ_CHANNEL,
            is_dot: false,
            dot_base: 0.0,
            stages: 10,
            base_totem_count: 0,
        },
        GemTemplate {
            skill_id: "RighteousFire",
            name: "Righteous Fire",
            base_damages: EMPTY_RANGES,
            base_crit_chance: 0.0,
            base_cast_time: 0.0,
            damage_effectiveness: 0.0,
            tags: TAGS_SPELL_DOT,
            is_dot: true,
            dot_base: 100.0,
            stages: 0,
            base_totem_count: 0,
        },
        GemTemplate {
            skill_id: "Arc",
            name: "Arc",
            base_damages: ARC_DAMAGES,
            base_crit_chance: 5.0,
            base_cast_time: 0.7,
            damage_effectiveness: 0.8,
            tags: TAGS_SPELL_CHAIN,
            is_dot: false,
            dot_base: 0.0,
            stages: 0,
            base_totem_count: 0,
        },
        GemTemplate {
            skill_id: "Fireball",
            name: "Fireball",
            base_damages: FIREBALL_DAMAGES,
            base_crit_chance: 6.0,
            base_cast_time: 0.75,
            damage_effectiveness: 2.4,
            tags: TAGS_SPELL_PROJ,
            is_dot: false,
            dot_base: 0.0,
            stages: 0,
            base_totem_count: 0,
        },
        GemTemplate {
            skill_id: "SummonRagingSpirit",
            name: "Summon Raging Spirit",
            base_damages: SRS_DAMAGES,
            base_crit_chance: 5.0,
            base_cast_time: 0.5,
            damage_effectiveness: 1.0,
            tags: TAGS_MINION,
            is_dot: false,
            dot_base: 0.0,
            stages: 0,
            base_totem_count: 0,
        },
        GemTemplate {
            skill_id: "BladeVortex",
            name: "Blade Vortex",
            base_damages: BLADE_VORTEX_DAMAGES,
            base_crit_chance: 6.0,
            base_cast_time: 0.5,
            damage_effectiveness: 0.45,
            tags: TAGS_SPELL_AOE,
            is_dot: false,
            dot_base: 0.0,
            stages: 0,
            base_totem_count: 0,
        },
        GemTemplate {
            skill_id: "Cyclone",
            name: "Cyclone",
            base_damages: CYCLONE_DAMAGES,
            base_crit_chance: 5.0,
            base_cast_time: 1.0,
            damage_effectiveness: 0.56,
            tags: TAGS_ATTACK_MELEE_CHANNEL,
            is_dot: false,
            dot_base: 0.0,
            stages: 0,
            base_totem_count: 0,
        },
        GemTemplate {
            skill_id: "Spark",
            name: "Spark",
            base_damages: SPARK_DAMAGES,
            base_crit_chance: 5.0,
            base_cast_time: 0.65,
            damage_effectiveness: 0.75,
            tags: TAGS_SPELL_PROJ,
            is_dot: false,
            dot_base: 0.0,
            stages: 0,
            base_totem_count: 0,
        },
        GemTemplate {
            skill_id: "IceNova",
            name: "Ice Nova",
            base_damages: ICE_NOVA_DAMAGES,
            base_crit_chance: 6.0,
            base_cast_time: 0.7,
            damage_effectiveness: 1.3,
            tags: TAGS_SPELL_AOE,
            is_dot: false,
            dot_base: 0.0,
            stages: 0,
            base_totem_count: 0,
        },
        // ---- Totem skills ----
        GemTemplate {
            skill_id: "AncestralWarchief",
            name: "Ancestral Warchief",
            base_damages: ANCESTRAL_WARCHIEF_DAMAGES,
            base_crit_chance: 5.0,
            base_cast_time: 0.6,  // placement time
            damage_effectiveness: 1.1,
            tags: TAGS_ATTACK_MELEE_TOTEM,
            is_dot: false,
            dot_base: 0.0,
            stages: 0,
            base_totem_count: 1,
        },
        GemTemplate {
            skill_id: "HolyFlameTotem",
            name: "Holy Flame Totem",
            base_damages: HOLY_FLAME_TOTEM_DAMAGES,
            base_crit_chance: 5.0,
            base_cast_time: 0.25,  // placement time
            damage_effectiveness: 0.7,
            tags: TAGS_SPELL_AOE_TOTEM,
            is_dot: false,
            dot_base: 0.0,
            stages: 0,
            base_totem_count: 1,
        },
        // ---- Trap skills ----
        GemTemplate {
            skill_id: "LightningTrap",
            name: "Lightning Trap",
            base_damages: LIGHTNING_TRAP_DAMAGES,
            base_crit_chance: 6.0,
            base_cast_time: 0.5,  // throwing speed base
            damage_effectiveness: 0.85,
            tags: TAGS_SPELL_PROJ_TRAP,
            is_dot: false,
            dot_base: 0.0,
            stages: 0,
            base_totem_count: 0,
        },
        // ---- Mine skills ----
        GemTemplate {
            skill_id: "IceMine",
            name: "Icicle Mine",
            base_damages: ICE_MINE_DAMAGES,
            base_crit_chance: 6.0,
            base_cast_time: 0.25,  // throwing speed base
            damage_effectiveness: 0.7,
            tags: TAGS_SPELL_AOE_MINE,
            is_dot: false,
            dot_base: 0.0,
            stages: 0,
            base_totem_count: 0,
        },
        // ---- Brand skills ----
        GemTemplate {
            skill_id: "StormBrand",
            name: "Storm Brand",
            base_damages: STORM_BRAND_DAMAGES,
            base_crit_chance: 6.0,
            base_cast_time: 0.75,  // activation frequency base
            damage_effectiveness: 0.3,
            tags: TAGS_SPELL_PROJ_BRAND,
            is_dot: false,
            dot_base: 0.0,
            stages: 0,
            base_totem_count: 0,
        },
        // ---- Channelling skills (with stages) ----
        GemTemplate {
            skill_id: "Incinerate",
            name: "Incinerate",
            base_damages: INCINERATE_DAMAGES,
            base_crit_chance: 5.0,
            base_cast_time: 0.2,
            damage_effectiveness: 0.3,
            tags: TAGS_SPELL_CHANNEL,
            is_dot: false,
            dot_base: 0.0,
            stages: 8,
            base_totem_count: 0,
        },
        GemTemplate {
            skill_id: "BladeFlurry",
            name: "Blade Flurry",
            base_damages: BLADE_FLURRY_DAMAGES,
            base_crit_chance: 6.0,
            base_cast_time: 0.65,
            damage_effectiveness: 0.56,
            tags: &[GemTag::Attack, GemTag::Melee, GemTag::AoE, GemTag::Channelling],
            is_dot: false,
            dot_base: 0.0,
            stages: 6,
            base_totem_count: 0,
        },
    ];

    templates.into_iter().map(|t| (t.skill_id, t)).collect()
});

// Keep a pre-built level-20 table for the common case
static GEM_TABLE_L20: LazyLock<HashMap<&'static str, GemData>> = LazyLock::new(|| {
    GEM_TEMPLATES.iter().map(|(&id, tmpl)| {
        (id, tmpl.to_gem_data(1.0))
    }).collect()
});

/// Look up a gem at a specific gem level (1-21+).
/// Returns an owned GemData with damage values scaled for that level.
/// Crit chance, cast time, and damage effectiveness stay constant across levels.
pub fn lookup_gem_at_level(skill_id: &str, level: u32) -> Option<GemData> {
    let tmpl = GEM_TEMPLATES.get(skill_id)?;
    let scale = GEM_LEVEL_SCALES.get(skill_id)
        .map(|s| s.interpolate(level))
        .unwrap_or(1.0);
    Some(tmpl.to_gem_data(scale))
}

/// Look up a gem at level 20 (backward-compatible default).
pub fn lookup_gem(skill_id: &str) -> Option<GemData> {
    lookup_gem_at_level(skill_id, 20)
}

/// Skill archetype determined from gem tags.
/// Controls how DPS is calculated (speed source, multipliers).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum SkillArchetype {
    /// Standard hit skill: DPS = avg_hit * speed * crit
    Default,
    /// Channelling: DPS = damage_per_stage * stages * hit_rate
    Channelling,
    /// Totem: DPS = single_totem_dps * totem_count
    Totem,
    /// Trap: uses trap throwing speed instead of attack/cast speed
    Trap,
    /// Mine: uses mine throwing speed instead of attack/cast speed
    Mine,
    /// Brand: attached brand ticks at activation frequency
    Brand,
}

impl GemData {
    pub fn archetype(&self) -> SkillArchetype {
        // Order matters: a totem-channelling skill is a totem first
        if self.tags.contains(&GemTag::Totem) {
            SkillArchetype::Totem
        } else if self.tags.contains(&GemTag::Trap) {
            SkillArchetype::Trap
        } else if self.tags.contains(&GemTag::Mine) {
            SkillArchetype::Mine
        } else if self.tags.contains(&GemTag::Brand) {
            SkillArchetype::Brand
        } else if self.tags.contains(&GemTag::Channelling) {
            SkillArchetype::Channelling
        } else {
            SkillArchetype::Default
        }
    }
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
        let avg = avg_base_damage(&gem);
        assert!((avg - 250.0).abs() < 0.01, "expected ~250, got {avg}");
    }

    #[test]
    fn test_multi_element_damage() {
        let gem = lookup_gem("LightningArrow").unwrap();
        let avg = avg_base_damage(&gem);
        // phys (150+250)/2 + light (50+100)/2 = 200 + 75 = 275
        assert!((avg - 275.0).abs() < 0.01, "expected ~275, got {avg}");
    }

    #[test]
    fn test_gem_count() {
        assert!(GEM_TEMPLATES.len() >= 10, "expected at least 10 gems");
    }

    // ---- Level scaling tests -----------------------------------------------

    #[test]
    fn test_level_20_is_baseline() {
        let gem = lookup_gem_at_level("GroundSlam", 20).unwrap();
        let avg = avg_base_damage(&gem);
        assert!((avg - 250.0).abs() < 0.01, "level 20 should match baseline: got {avg}");
    }

    #[test]
    fn test_level_1_lower_than_20() {
        let l1 = lookup_gem_at_level("GroundSlam", 1).unwrap();
        let l20 = lookup_gem_at_level("GroundSlam", 20).unwrap();
        let avg1 = avg_base_damage(&l1);
        let avg20 = avg_base_damage(&l20);
        assert!(avg1 < avg20, "level 1 ({avg1}) should be less than level 20 ({avg20})");
    }

    #[test]
    fn test_level_21_higher_than_20() {
        let l21 = lookup_gem_at_level("Arc", 21).unwrap();
        let l20 = lookup_gem_at_level("Arc", 20).unwrap();
        let avg21 = avg_base_damage(&l21);
        let avg20 = avg_base_damage(&l20);
        assert!(avg21 > avg20, "level 21 ({avg21}) should be greater than level 20 ({avg20})");
    }

    #[test]
    fn test_interpolated_level_between_data_points() {
        let l5 = lookup_gem_at_level("GroundSlam", 5).unwrap();
        let l1 = lookup_gem_at_level("GroundSlam", 1).unwrap();
        let l10 = lookup_gem_at_level("GroundSlam", 10).unwrap();
        let avg5 = avg_base_damage(&l5);
        let avg1 = avg_base_damage(&l1);
        let avg10 = avg_base_damage(&l10);
        assert!(avg5 > avg1, "level 5 ({avg5}) should be between level 1 ({avg1}) and 10 ({avg10})");
        assert!(avg5 < avg10, "level 5 ({avg5}) should be between level 1 ({avg1}) and 10 ({avg10})");
    }

    #[test]
    fn test_spell_scaling_steeper_than_attack() {
        // Spells scale much more steeply because their base damage grows exponentially
        let arc_1 = avg_base_damage(&lookup_gem_at_level("Arc", 1).unwrap());
        let arc_20 = avg_base_damage(&lookup_gem_at_level("Arc", 20).unwrap());
        let gs_1 = avg_base_damage(&lookup_gem_at_level("GroundSlam", 1).unwrap());
        let gs_20 = avg_base_damage(&lookup_gem_at_level("GroundSlam", 20).unwrap());

        let arc_ratio = arc_20 / arc_1;
        let gs_ratio = gs_20 / gs_1;
        assert!(arc_ratio > gs_ratio, "spells should scale steeper: arc ratio {arc_ratio} vs gs ratio {gs_ratio}");
    }

    #[test]
    fn test_dot_base_scales_with_level() {
        let rf1 = lookup_gem_at_level("RighteousFire", 1).unwrap();
        let rf20 = lookup_gem_at_level("RighteousFire", 20).unwrap();
        assert!(rf1.dot_base < rf20.dot_base, "RF L1 dot_base ({}) should be less than L20 ({})", rf1.dot_base, rf20.dot_base);
        assert_eq!(rf20.dot_base, 100.0);
    }

    #[test]
    fn test_crit_and_cast_time_constant_across_levels() {
        let l1 = lookup_gem_at_level("Arc", 1).unwrap();
        let l20 = lookup_gem_at_level("Arc", 20).unwrap();
        assert_eq!(l1.base_crit_chance, l20.base_crit_chance);
        assert_eq!(l1.base_cast_time, l20.base_cast_time);
        assert_eq!(l1.damage_effectiveness, l20.damage_effectiveness);
    }

    #[test]
    fn test_lookup_gem_defaults_to_level_20() {
        let via_default = lookup_gem("Arc").unwrap();
        let via_explicit = lookup_gem_at_level("Arc", 20).unwrap();
        assert_eq!(avg_base_damage(&via_default), avg_base_damage(&via_explicit));
    }

    // ---- Archetype detection tests -------------------------------------------

    #[test]
    fn test_archetype_channelling() {
        let wo = lookup_gem("WinterOrb").unwrap();
        assert_eq!(wo.archetype(), SkillArchetype::Channelling);
        assert_eq!(wo.stages, 10);

        let cy = lookup_gem("Cyclone").unwrap();
        assert_eq!(cy.archetype(), SkillArchetype::Channelling);

        let inc = lookup_gem("Incinerate").unwrap();
        assert_eq!(inc.archetype(), SkillArchetype::Channelling);
        assert_eq!(inc.stages, 8);

        let bf = lookup_gem("BladeFlurry").unwrap();
        assert_eq!(bf.archetype(), SkillArchetype::Channelling);
        assert_eq!(bf.stages, 6);
    }

    #[test]
    fn test_archetype_totem() {
        let aw = lookup_gem("AncestralWarchief").unwrap();
        assert_eq!(aw.archetype(), SkillArchetype::Totem);
        assert_eq!(aw.base_totem_count, 1);

        let hft = lookup_gem("HolyFlameTotem").unwrap();
        assert_eq!(hft.archetype(), SkillArchetype::Totem);
    }

    #[test]
    fn test_archetype_trap() {
        let lt = lookup_gem("LightningTrap").unwrap();
        assert_eq!(lt.archetype(), SkillArchetype::Trap);
    }

    #[test]
    fn test_archetype_mine() {
        let im = lookup_gem("IceMine").unwrap();
        assert_eq!(im.archetype(), SkillArchetype::Mine);
    }

    #[test]
    fn test_archetype_brand() {
        let sb = lookup_gem("StormBrand").unwrap();
        assert_eq!(sb.archetype(), SkillArchetype::Brand);
    }

    #[test]
    fn test_archetype_default() {
        let gs = lookup_gem("GroundSlam").unwrap();
        assert_eq!(gs.archetype(), SkillArchetype::Default);

        let arc = lookup_gem("Arc").unwrap();
        assert_eq!(arc.archetype(), SkillArchetype::Default);
    }

    #[test]
    fn test_gem_count_with_archetypes() {
        // Original 10 + 7 new = 17
        assert!(GEM_TEMPLATES.len() >= 17, "expected at least 17 gems, got {}", GEM_TEMPLATES.len());
    }
}
