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
// JSON data types (deserialized from PoB-extracted gems.json)
// ---------------------------------------------------------------------------

#[derive(Deserialize)]
struct GemJsonEntry {
    #[allow(dead_code)]
    skill_id: String,
    cast_time: f64,
    #[allow(dead_code)]
    base_effectiveness: f64,
    #[allow(dead_code)]
    incremental_effectiveness: f64,
    is_attack: bool,
    #[serde(default)]
    is_dot: bool,
    #[serde(default)]
    is_minion: bool,
    #[allow(dead_code)]
    damage_types: Vec<String>,
    levels: HashMap<String, GemJsonLevel>,
}

#[derive(Deserialize)]
struct GemJsonLevel {
    #[allow(dead_code)]
    level: u32,
    #[allow(dead_code)]
    level_requirement: u32,
    crit_chance: f64,
    damage_effectiveness: f64,
    damages: Vec<GemJsonDamage>,
    #[serde(default)]
    base_multiplier: f64,
    #[serde(default)]
    attack_speed_multiplier: f64,
    #[serde(default)]
    spell_damage_more_pct: f64,
    #[serde(default)]
    #[allow(dead_code)]
    minion_level: f64,
}

#[derive(Deserialize)]
struct GemJsonDamage {
    damage_type: String,
    min: f64,
    max: f64,
}

// Embed the generated JSON at compile time
static GEM_JSON_RAW: &str = include_str!("../data/gems.json");

static GEM_JSON: LazyLock<HashMap<String, GemJsonEntry>> = LazyLock::new(|| {
    serde_json::from_str(GEM_JSON_RAW).expect("gems.json should be valid")
});

// ---------------------------------------------------------------------------
// Static tag arrays
// ---------------------------------------------------------------------------

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
// Gem metadata template (tags, stages, totem count - things not in the JSON)
// ---------------------------------------------------------------------------

struct GemMeta {
    skill_id: &'static str,
    name: &'static str,
    tags: &'static [GemTag],
    is_dot: bool,
    stages: u32,
    base_totem_count: u32,
    /// Fallback crit chance for attack gems (which don't store crit in their level data)
    default_crit: f64,
    /// Fallback damage ranges for attack gems (weapon damage approximation)
    fallback_damages: &'static [DamageRange],
}

// Fallback damage arrays for attack gems (approximate weapon-based values).
// Attack gems don't provide flat damage; these represent "typical weapon" estimates.
const GROUND_SLAM_FALLBACK: &[DamageRange] = &[DamageRange {
    min: 200.0,
    max: 300.0,
    damage_type: DamageType::Physical,
}];

const LIGHTNING_ARROW_FALLBACK: &[DamageRange] = &[
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

const CYCLONE_FALLBACK: &[DamageRange] = &[DamageRange {
    min: 50.0,
    max: 75.0,
    damage_type: DamageType::Physical,
}];

const BLADE_FLURRY_FALLBACK: &[DamageRange] = &[DamageRange {
    min: 40.0,
    max: 60.0,
    damage_type: DamageType::Physical,
}];

// Totem attack fallback
const ANCESTRAL_WARCHIEF_FALLBACK: &[DamageRange] = &[DamageRange {
    min: 180.0,
    max: 270.0,
    damage_type: DamageType::Physical,
}];

// SRS fallback (minion damage)
const SRS_FALLBACK: &[DamageRange] = &[
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

const EMPTY_RANGES: &[DamageRange] = &[];

static GEM_META: LazyLock<HashMap<&'static str, GemMeta>> = LazyLock::new(|| {
    let metas: Vec<GemMeta> = vec![
        // Spell gems
        GemMeta {
            skill_id: "Arc",
            name: "Arc",
            tags: TAGS_SPELL_CHAIN,
            is_dot: false,
            stages: 0,
            base_totem_count: 0,
            default_crit: 6.0,
            fallback_damages: EMPTY_RANGES,
        },
        GemMeta {
            skill_id: "Fireball",
            name: "Fireball",
            tags: TAGS_SPELL_PROJ,
            is_dot: false,
            stages: 0,
            base_totem_count: 0,
            default_crit: 5.0,
            fallback_damages: EMPTY_RANGES,
        },
        GemMeta {
            skill_id: "Spark",
            name: "Spark",
            tags: TAGS_SPELL_PROJ,
            is_dot: false,
            stages: 0,
            base_totem_count: 0,
            default_crit: 5.0,
            fallback_damages: EMPTY_RANGES,
        },
        GemMeta {
            skill_id: "IceNova",
            name: "Ice Nova",
            tags: TAGS_SPELL_AOE,
            is_dot: false,
            stages: 0,
            base_totem_count: 0,
            default_crit: 6.0,
            fallback_damages: EMPTY_RANGES,
        },
        GemMeta {
            skill_id: "WinterOrb",
            name: "Winter Orb",
            tags: TAGS_SPELL_PROJ_CHANNEL,
            is_dot: false,
            stages: 10,
            base_totem_count: 0,
            default_crit: 7.5,
            fallback_damages: EMPTY_RANGES,
        },
        GemMeta {
            skill_id: "BladeVortex",
            name: "Blade Vortex",
            tags: TAGS_SPELL_AOE,
            is_dot: false,
            stages: 0,
            base_totem_count: 0,
            default_crit: 6.0,
            fallback_damages: EMPTY_RANGES,
        },
        GemMeta {
            skill_id: "HolyFlameTotem",
            name: "Holy Flame Totem",
            tags: TAGS_SPELL_AOE_TOTEM,
            is_dot: false,
            stages: 0,
            base_totem_count: 1,
            default_crit: 5.0,
            fallback_damages: EMPTY_RANGES,
        },
        GemMeta {
            skill_id: "LightningTrap",
            name: "Lightning Trap",
            tags: TAGS_SPELL_PROJ_TRAP,
            is_dot: false,
            stages: 0,
            base_totem_count: 0,
            default_crit: 6.0,
            fallback_damages: EMPTY_RANGES,
        },
        GemMeta {
            skill_id: "IcicleMine",
            name: "Icicle Mine",
            tags: TAGS_SPELL_AOE_MINE,
            is_dot: false,
            stages: 0,
            base_totem_count: 0,
            default_crit: 6.0,
            fallback_damages: EMPTY_RANGES,
        },
        GemMeta {
            skill_id: "StormBrand",
            name: "Storm Brand",
            tags: TAGS_SPELL_PROJ_BRAND,
            is_dot: false,
            stages: 0,
            base_totem_count: 0,
            default_crit: 6.0,
            fallback_damages: EMPTY_RANGES,
        },
        GemMeta {
            skill_id: "Incinerate",
            name: "Incinerate",
            tags: TAGS_SPELL_CHANNEL,
            is_dot: false,
            stages: 8,
            base_totem_count: 0,
            default_crit: 5.0,
            fallback_damages: EMPTY_RANGES,
        },
        // Attack gems
        GemMeta {
            skill_id: "GroundSlam",
            name: "Ground Slam",
            tags: TAGS_ATTACK_MELEE_AOE,
            is_dot: false,
            stages: 0,
            base_totem_count: 0,
            default_crit: 5.0,
            fallback_damages: GROUND_SLAM_FALLBACK,
        },
        GemMeta {
            skill_id: "LightningArrow",
            name: "Lightning Arrow",
            tags: TAGS_ATTACK_PROJ,
            is_dot: false,
            stages: 0,
            base_totem_count: 0,
            default_crit: 5.0,
            fallback_damages: LIGHTNING_ARROW_FALLBACK,
        },
        GemMeta {
            skill_id: "Cyclone",
            name: "Cyclone",
            tags: TAGS_ATTACK_MELEE_CHANNEL,
            is_dot: false,
            stages: 0,
            base_totem_count: 0,
            default_crit: 5.0,
            fallback_damages: CYCLONE_FALLBACK,
        },
        GemMeta {
            skill_id: "BladeFlurry",
            name: "Blade Flurry",
            tags: &[GemTag::Attack, GemTag::Melee, GemTag::AoE, GemTag::Channelling],
            is_dot: false,
            stages: 6,
            base_totem_count: 0,
            default_crit: 6.0,
            fallback_damages: BLADE_FLURRY_FALLBACK,
        },
        // Special: AncestralWarchief (not in PoB skill files, keep hardcoded)
        GemMeta {
            skill_id: "AncestralWarchief",
            name: "Ancestral Warchief",
            tags: TAGS_ATTACK_MELEE_TOTEM,
            is_dot: false,
            stages: 0,
            base_totem_count: 1,
            default_crit: 5.0,
            fallback_damages: ANCESTRAL_WARCHIEF_FALLBACK,
        },
        // Special: DoT
        GemMeta {
            skill_id: "RighteousFire",
            name: "Righteous Fire",
            tags: TAGS_SPELL_DOT,
            is_dot: true,
            stages: 0,
            base_totem_count: 0,
            default_crit: 0.0,
            fallback_damages: EMPTY_RANGES,
        },
        // Special: Minion
        GemMeta {
            skill_id: "SummonRagingSpirit",
            name: "Summon Raging Spirit",
            tags: TAGS_MINION,
            is_dot: false,
            stages: 0,
            base_totem_count: 0,
            default_crit: 5.0,
            fallback_damages: SRS_FALLBACK,
        },
    ];

    metas.into_iter().map(|m| (m.skill_id, m)).collect()
});

// ---------------------------------------------------------------------------
// Hardcoded scaling for gems not in the PoB skill data
// ---------------------------------------------------------------------------

struct FallbackScaling {
    data_points: [(u32, f64); 5],
}

impl FallbackScaling {
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
        let (l_a, s_a) = self.data_points[3];
        let (l_b, s_b) = self.data_points[4];
        let t = (level - l_a) as f64 / (l_b - l_a) as f64;
        s_a + t * (s_b - s_a)
    }
}

static FALLBACK_SCALES: LazyLock<HashMap<&'static str, FallbackScaling>> = LazyLock::new(|| {
    let mut m = HashMap::new();
    // AncestralWarchief is not in PoB skill files - use hand-tuned curve
    m.insert("AncestralWarchief", FallbackScaling {
        data_points: [(1, 0.400), (10, 0.620), (15, 0.800), (20, 1.0), (21, 1.040)],
    });
    // SRS minion damage scales roughly with minion level
    m.insert("SummonRagingSpirit", FallbackScaling {
        data_points: [(1, 0.050), (10, 0.200), (15, 0.500), (20, 1.0), (21, 1.100)],
    });
    m
});

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

fn parse_damage_type(s: &str) -> DamageType {
    match s {
        "Physical" => DamageType::Physical,
        "Fire" => DamageType::Fire,
        "Cold" => DamageType::Cold,
        "Lightning" => DamageType::Lightning,
        "Chaos" => DamageType::Chaos,
        _ => DamageType::Physical,
    }
}

/// Find the level entry for the requested gem level. If no exact match,
/// interpolate between the two nearest levels.
fn get_json_level_data(entry: &GemJsonEntry, level: u32) -> Option<InterpolatedLevel> {
    let key = level.to_string();
    if let Some(exact) = entry.levels.get(&key) {
        return Some(InterpolatedLevel {
            crit_chance: exact.crit_chance,
            damage_effectiveness: exact.damage_effectiveness,
            base_multiplier: exact.base_multiplier,
            attack_speed_multiplier: exact.attack_speed_multiplier,
            spell_damage_more_pct: exact.spell_damage_more_pct,
            damages: exact.damages.iter().map(|d| DamageRange {
                min: d.min,
                max: d.max,
                damage_type: parse_damage_type(&d.damage_type),
            }).collect(),
        });
    }

    // Interpolate between two nearest levels
    let mut levels: Vec<u32> = entry.levels.keys()
        .filter_map(|k| k.parse::<u32>().ok())
        .collect();
    levels.sort();

    if levels.is_empty() {
        return None;
    }

    // Clamp to available range
    let clamped = level.clamp(*levels.first().unwrap(), *levels.last().unwrap());

    // Find bounding levels
    let mut lower = levels[0];
    let mut upper = levels[0];
    for &l in &levels {
        if l <= clamped {
            lower = l;
        }
        if l >= clamped {
            upper = l;
            break;
        }
    }

    let lo = entry.levels.get(&lower.to_string())?;
    let hi = entry.levels.get(&upper.to_string())?;

    if lower == upper {
        return Some(InterpolatedLevel {
            crit_chance: lo.crit_chance,
            damage_effectiveness: lo.damage_effectiveness,
            base_multiplier: lo.base_multiplier,
            attack_speed_multiplier: lo.attack_speed_multiplier,
            spell_damage_more_pct: lo.spell_damage_more_pct,
            damages: lo.damages.iter().map(|d| DamageRange {
                min: d.min,
                max: d.max,
                damage_type: parse_damage_type(&d.damage_type),
            }).collect(),
        });
    }

    let t = (clamped - lower) as f64 / (upper - lower) as f64;
    let lerp = |a: f64, b: f64| a + t * (b - a);

    let damages: Vec<DamageRange> = if !lo.damages.is_empty() {
        lo.damages.iter().zip(hi.damages.iter()).map(|(d_lo, d_hi)| {
            DamageRange {
                min: lerp(d_lo.min, d_hi.min).round(),
                max: lerp(d_lo.max, d_hi.max).round(),
                damage_type: parse_damage_type(&d_lo.damage_type),
            }
        }).collect()
    } else {
        vec![]
    };

    Some(InterpolatedLevel {
        crit_chance: lerp(lo.crit_chance, hi.crit_chance),
        damage_effectiveness: lerp(lo.damage_effectiveness, hi.damage_effectiveness),
        base_multiplier: lerp(lo.base_multiplier, hi.base_multiplier),
        attack_speed_multiplier: lerp(lo.attack_speed_multiplier, hi.attack_speed_multiplier),
        spell_damage_more_pct: lerp(lo.spell_damage_more_pct, hi.spell_damage_more_pct),
        damages,
    })
}

struct InterpolatedLevel {
    crit_chance: f64,
    damage_effectiveness: f64,
    base_multiplier: f64,
    attack_speed_multiplier: f64,
    spell_damage_more_pct: f64,
    damages: Vec<DamageRange>,
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Look up a gem at a specific gem level (1-40).
/// Returns an owned GemData with damage values for that level.
/// Spell gems return real PoB-computed damage; attack gems return fallback
/// weapon estimates scaled by baseMultiplier.
pub fn lookup_gem_at_level(skill_id: &str, level: u32) -> Option<GemData> {
    // Normalize legacy aliases
    let canonical = match skill_id {
        "IceMine" => "IcicleMine",
        _ => skill_id,
    };

    let meta = GEM_META.get(canonical)?;
    let json_key = canonical;

    if let Some(json_entry) = GEM_JSON.get(json_key) {
        if let Some(lvl) = get_json_level_data(json_entry, level) {
            let (base_damages, damage_effectiveness) = if json_entry.is_attack {
                // Attack gem: use fallback damages scaled by baseMultiplier ratio
                let l20_mult = json_entry.levels.get("20")
                    .map(|l| l.base_multiplier)
                    .unwrap_or(1.0);
                let scale = if l20_mult > 0.0 { lvl.base_multiplier / l20_mult } else { 1.0 };
                let damages = meta.fallback_damages.iter().map(|d| DamageRange {
                    min: d.min * scale,
                    max: d.max * scale,
                    damage_type: d.damage_type,
                }).collect();
                (damages, lvl.damage_effectiveness)
            } else if json_entry.is_dot {
                // DoT gem (RF): no flat damage, use spell_damage_more_pct for dot_base scaling
                (vec![], 0.0)
            } else if json_entry.is_minion {
                // Minion gem: use fallback damages scaled roughly
                let scale = FALLBACK_SCALES.get(skill_id)
                    .map(|s| s.interpolate(level))
                    .unwrap_or(1.0);
                let damages = meta.fallback_damages.iter().map(|d| DamageRange {
                    min: d.min * scale,
                    max: d.max * scale,
                    damage_type: d.damage_type,
                }).collect();
                (damages, 1.0)
            } else {
                // Spell gem: use the real computed damage from JSON
                (lvl.damages, lvl.damage_effectiveness)
            };

            let crit_chance = if lvl.crit_chance > 0.0 {
                lvl.crit_chance
            } else {
                meta.default_crit
            };

            let cast_time = if json_entry.cast_time > 0.0 {
                json_entry.cast_time
            } else {
                0.0
            };

            // RF dot_base: scale by spell_damage_more_pct ratio to level 20
            let dot_base = if meta.is_dot && json_entry.is_dot {
                let l20_pct = json_entry.levels.get("20")
                    .map(|l| l.spell_damage_more_pct)
                    .unwrap_or(39.0);
                let scale = if l20_pct > 0.0 { lvl.spell_damage_more_pct / l20_pct } else { 1.0 };
                100.0 * scale
            } else {
                0.0
            };

            return Some(GemData {
                skill_id: meta.skill_id,
                name: meta.name,
                base_damages,
                base_crit_chance: crit_chance,
                base_cast_time: cast_time,
                damage_effectiveness,
                tags: meta.tags,
                is_dot: meta.is_dot,
                dot_base,
                stages: meta.stages,
                base_totem_count: meta.base_totem_count,
            });
        }
    }

    // Fallback for gems not in JSON (e.g. AncestralWarchief)
    let scale = FALLBACK_SCALES.get(skill_id)
        .map(|s| s.interpolate(level))
        .unwrap_or(1.0);

    let base_damages = meta.fallback_damages.iter().map(|d| DamageRange {
        min: d.min * scale,
        max: d.max * scale,
        damage_type: d.damage_type,
    }).collect();

    Some(GemData {
        skill_id: meta.skill_id,
        name: meta.name,
        base_damages,
        base_crit_chance: meta.default_crit,
        base_cast_time: 0.6, // default placement time
        damage_effectiveness: 1.1,
        tags: meta.tags,
        is_dot: meta.is_dot,
        dot_base: if meta.is_dot { 100.0 * scale } else { 0.0 },
        stages: meta.stages,
        base_totem_count: meta.base_totem_count,
    })
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
        // PoB data: castTime = 0.25, critChance = 7.5, damageEffectiveness = 0.8
        assert_eq!(gem.base_cast_time, 0.25);
        assert_eq!(gem.base_crit_chance, 7.5);
        assert_eq!(gem.damage_effectiveness, 0.8);
        assert_eq!(gem.base_damages.len(), 1);
        assert_eq!(gem.base_damages[0].damage_type, DamageType::Cold);
    }

    #[test]
    fn test_lookup_righteous_fire() {
        let gem = lookup_gem("RighteousFire").expect("RF should exist");
        assert!(gem.is_dot);
        // RF L20 spell_damage_more_pct = 39 => dot_base = 100.0 * 39/39 = 100.0
        assert!((gem.dot_base - 100.0).abs() < 0.01);
        assert!(gem.base_damages.is_empty());
    }

    #[test]
    fn test_lookup_missing() {
        assert!(lookup_gem("NonExistentGem").is_none());
    }

    #[test]
    fn test_avg_base_damage_ground_slam() {
        let gem = lookup_gem("GroundSlam").unwrap();
        let avg = avg_base_damage(&gem);
        // L20 baseMultiplier = 3.569, L20 scale = 3.569/3.569 = 1.0
        // fallback: (200+300)/2 = 250
        assert!((avg - 250.0).abs() < 0.01, "expected ~250, got {avg}");
    }

    #[test]
    fn test_multi_element_damage() {
        let gem = lookup_gem("LightningArrow").unwrap();
        let avg = avg_base_damage(&gem);
        // L20: fallback (150+250)/2 + (50+100)/2 = 200 + 75 = 275, scale=1.0
        assert!((avg - 275.0).abs() < 0.01, "expected ~275, got {avg}");
    }

    #[test]
    fn test_gem_count() {
        // We have 18 gem metadata entries
        assert!(GEM_META.len() >= 17, "expected at least 17 gems, got {}", GEM_META.len());
    }

    // ---- Level scaling tests (using real PoB data) ----------------------------

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
        assert!((rf20.dot_base - 100.0).abs() < 0.01);
    }

    #[test]
    fn test_crit_and_cast_time_constant_across_levels() {
        let l1 = lookup_gem_at_level("Arc", 1).unwrap();
        let l20 = lookup_gem_at_level("Arc", 20).unwrap();
        assert_eq!(l1.base_crit_chance, l20.base_crit_chance);
        assert_eq!(l1.base_cast_time, l20.base_cast_time);
    }

    #[test]
    fn test_lookup_gem_defaults_to_level_20() {
        let via_default = lookup_gem("Arc").unwrap();
        let via_explicit = lookup_gem_at_level("Arc", 20).unwrap();
        assert_eq!(avg_base_damage(&via_default), avg_base_damage(&via_explicit));
    }

    // ---- Spell damage accuracy tests (real PoB values) -------------------------

    #[test]
    fn test_arc_l20_damage() {
        let gem = lookup_gem("Arc").unwrap();
        // From PoB: Arc L20 = 198-1122 Lightning
        assert_eq!(gem.base_damages.len(), 1);
        assert_eq!(gem.base_damages[0].damage_type, DamageType::Lightning);
        assert!((gem.base_damages[0].min - 198.0).abs() < 1.0, "Arc L20 min: {}", gem.base_damages[0].min);
        assert!((gem.base_damages[0].max - 1122.0).abs() < 1.0, "Arc L20 max: {}", gem.base_damages[0].max);
    }

    #[test]
    fn test_fireball_l20_damage() {
        let gem = lookup_gem("Fireball").unwrap();
        // From PoB: Fireball L20 = 1883-2825 Fire
        assert_eq!(gem.base_damages[0].damage_type, DamageType::Fire);
        assert!((gem.base_damages[0].min - 1883.0).abs() < 1.0, "Fireball L20 min: {}", gem.base_damages[0].min);
        assert!((gem.base_damages[0].max - 2825.0).abs() < 1.0, "Fireball L20 max: {}", gem.base_damages[0].max);
    }

    #[test]
    fn test_spark_l1_damage() {
        let gem = lookup_gem_at_level("Spark", 1).unwrap();
        // From PoB JSON: Spark L1 (levelReq=1) should be small
        assert!(gem.base_damages[0].min < 10.0, "Spark L1 min should be small: {}", gem.base_damages[0].min);
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
        let im = lookup_gem("IcicleMine").unwrap();
        assert_eq!(im.archetype(), SkillArchetype::Mine);

        // Legacy alias should also work
        let im2 = lookup_gem("IceMine").unwrap();
        assert_eq!(im2.archetype(), SkillArchetype::Mine);
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
        assert!(GEM_META.len() >= 17, "expected at least 17 gems, got {}", GEM_META.len());
    }

    // ---- Real PoB data accuracy tests ----------------------------------------

    #[test]
    fn test_attack_gem_damage_effectiveness_from_pob() {
        // GroundSlam L20 has damageEffectiveness = 3.569 from PoB
        let gs = lookup_gem("GroundSlam").unwrap();
        assert!((gs.damage_effectiveness - 3.569).abs() < 0.001,
            "GS damage_effectiveness should be 3.569, got {}", gs.damage_effectiveness);
    }

    #[test]
    fn test_spell_gem_damage_effectiveness_from_pob() {
        // Arc L20 damageEffectiveness = 1.2
        let arc = lookup_gem("Arc").unwrap();
        assert!((arc.damage_effectiveness - 1.2).abs() < 0.001,
            "Arc damage_effectiveness should be 1.2, got {}", arc.damage_effectiveness);
    }

    #[test]
    fn test_winter_orb_real_crit() {
        // WinterOrb has critChance=7.5 in PoB data (not 6.0 as was hardcoded)
        let wo = lookup_gem("WinterOrb").unwrap();
        assert!((wo.base_crit_chance - 7.5).abs() < 0.01);
    }

    #[test]
    fn test_all_levels_monotonic_increase_for_spells() {
        // Fireball damage should increase at every level
        let mut prev_avg = 0.0;
        for lvl in 1..=21 {
            let gem = lookup_gem_at_level("Fireball", lvl).unwrap();
            let avg = avg_base_damage(&gem);
            assert!(avg >= prev_avg,
                "Fireball L{lvl} avg ({avg}) should be >= L{} avg ({prev_avg})",
                lvl - 1);
            prev_avg = avg;
        }
    }
}
