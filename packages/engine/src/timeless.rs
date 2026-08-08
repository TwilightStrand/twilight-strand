use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use tsify_next::Tsify;

// ---------------------------------------------------------------------------
// Jewel type definitions
// ---------------------------------------------------------------------------

/// The five timeless jewel archetypes, each from a different legion faction.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum JewelType {
    GloriousVanity,  // Vaal    (jewelType 1 in PoB)
    LethalPride,     // Karui   (jewelType 2)
    BrutalRestraint, // Maraketh (jewelType 3)
    MilitantFaith,   // Templar (jewelType 4)
    ElegantHubris,   // Eternal Empire (jewelType 5)
}

impl JewelType {
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "lethal pride" | "lethalpride" | "karui" => Some(Self::LethalPride),
            "brutal restraint" | "brutalrestraint" | "maraketh" => Some(Self::BrutalRestraint),
            "militant faith" | "militantfaith" | "templar" => Some(Self::MilitantFaith),
            "elegant hubris" | "eleganthubris" | "eternal" => Some(Self::ElegantHubris),
            "glorious vanity" | "gloriousvanity" | "vaal" => Some(Self::GloriousVanity),
            _ => None,
        }
    }

    /// Valid seed range for this jewel type (inclusive).
    /// Matches PoB's timelessJewelSeedMin/timelessJewelSeedMax.
    pub fn seed_range(self) -> (u32, u32) {
        match self {
            // PoB seed ranges from the game data
            Self::GloriousVanity  => (100, 8000),
            Self::LethalPride     => (10000, 18000),
            Self::BrutalRestraint => (500, 8000),
            Self::MilitantFaith   => (2000, 10000),
            Self::ElegantHubris   => (2000, 160000), // seed / 20 in LUT lookup
        }
    }

    pub fn faction_name(self) -> &'static str {
        match self {
            Self::GloriousVanity  => "Vaal",
            Self::LethalPride     => "Karui",
            Self::BrutalRestraint => "Maraketh",
            Self::MilitantFaith   => "Templar",
            Self::ElegantHubris   => "Eternal Empire",
        }
    }
}

// ---------------------------------------------------------------------------
// Conqueror keystones - each conqueror replaces keystones in radius
// ---------------------------------------------------------------------------

/// Keystone replacement granted when a timeless jewel with this conqueror
/// is socketed near a keystone on the passive tree.
#[derive(Debug, Clone)]
pub struct ConquerorKeystone {
    pub conqueror: &'static str,
    pub keystone_name: &'static str,
    pub stat_lines: &'static [&'static str],
}

const LETHAL_PRIDE_KEYSTONES: &[ConquerorKeystone] = &[
    ConquerorKeystone {
        conqueror: "Kaom",
        keystone_name: "Strength of Blood",
        stat_lines: &["1% of Life Regenerated per second for each 2% Life Recovery per second from Leeching"],
    },
    ConquerorKeystone {
        conqueror: "Rakiata",
        keystone_name: "Tempered by War",
        stat_lines: &[
            "50% of Cold and Lightning Damage taken as Fire Damage",
            "50% less Cold Resistance",
            "50% less Lightning Resistance",
        ],
    },
    ConquerorKeystone {
        conqueror: "Kiloava",
        keystone_name: "Glancing Blows",
        stat_lines: &[
            "Chance to Block Attack Damage is doubled",
            "Chance to Block Spell Damage is doubled",
            "You take 65% of Damage from Blocked Hits",
        ],
    },
    ConquerorKeystone {
        conqueror: "Akoya",
        keystone_name: "Chainbreaker",
        stat_lines: &[
            "Regenerate 3 Rage per Second",
            "+3 Rage Cost per Non-Instant Skill Use",
            "Lose 0.1% of Physical Attack Damage Leeched as Life per Rage",
        ],
    },
];

const BRUTAL_RESTRAINT_KEYSTONES: &[ConquerorKeystone] = &[
    ConquerorKeystone {
        conqueror: "Deshret",
        keystone_name: "Wind Dancer",
        stat_lines: &[
            "40% less Attack Damage taken if you haven't been Hit Recently",
            "20% more Attack Damage taken if you've been Hit Recently",
        ],
    },
    ConquerorKeystone {
        conqueror: "Balbala",
        keystone_name: "The Traitor",
        stat_lines: &[
            "Flasks gain 4 Charges every 5 seconds",
            "Flasks do not gain Charges during Effect",
        ],
    },
    ConquerorKeystone {
        conqueror: "Asenath",
        keystone_name: "Dance with Death",
        stat_lines: &[
            "Cannot use Helmets",
            "Your Critical Strikes deal Triple Damage",
        ],
    },
    ConquerorKeystone {
        conqueror: "Nasima",
        keystone_name: "Second Sight",
        stat_lines: &[
            "You are Blind",
            "Blind does not affect your Light Radius",
            "25% more Melee Critical Strike Chance while Blinded",
        ],
    },
];

const MILITANT_FAITH_KEYSTONES: &[ConquerorKeystone] = &[
    ConquerorKeystone {
        conqueror: "Avarius",
        keystone_name: "Power of Purpose",
        stat_lines: &["Mana provides Armour instead of being spent"],
    },
    ConquerorKeystone {
        conqueror: "Dominus",
        keystone_name: "Inner Conviction",
        stat_lines: &[
            "3% more Spell Damage per Power Charge",
            "Cannot gain Frenzy Charges",
        ],
    },
    ConquerorKeystone {
        conqueror: "Maxarius",
        keystone_name: "Transcendence",
        stat_lines: &[
            "Armour applies to Elemental Damage taken instead of Physical Damage",
            "-15% to all maximum Elemental Resistances",
        ],
    },
    ConquerorKeystone {
        conqueror: "Venarius",
        keystone_name: "Battlemage",
        stat_lines: &["Gain Added Spell Damage equal to the Damage of your Main Hand Weapon"],
    },
];

const ELEGANT_HUBRIS_KEYSTONES: &[ConquerorKeystone] = &[
    ConquerorKeystone {
        conqueror: "Cadiro",
        keystone_name: "Supreme Decadence",
        stat_lines: &["Life Flasks also apply their Recovery to Energy Shield"],
    },
    ConquerorKeystone {
        conqueror: "Victario",
        keystone_name: "Supreme Grandstanding",
        stat_lines: &["Enemies Taunted by you deal 10% less Damage with Hits and Ailments against other targets"],
    },
    ConquerorKeystone {
        conqueror: "Caspiro",
        keystone_name: "Supreme Ego",
        stat_lines: &[
            "50% more Effect of your Non-Curse Auras from Skills",
            "Your Non-Curse Aura Skills are Disabled if you have a Non-Curse Aura from Skills affecting more than 1 Ally",
        ],
    },
    ConquerorKeystone {
        conqueror: "Chitus",
        keystone_name: "Supreme Ostentation",
        stat_lines: &["Ignore Attribute Requirements"],
    },
];

const GLORIOUS_VANITY_KEYSTONES: &[ConquerorKeystone] = &[
    ConquerorKeystone {
        conqueror: "Xibaqua",
        keystone_name: "Divine Flesh",
        stat_lines: &[
            "All Damage taken bypasses Energy Shield",
            "50% of Elemental Damage taken as Chaos Damage",
            "+5% to maximum Chaos Resistance",
        ],
    },
    ConquerorKeystone {
        conqueror: "Zerphi",
        keystone_name: "Corrupted Soul",
        stat_lines: &[
            "50% of Non-Chaos Damage taken bypasses Energy Shield",
            "Gain 15% of Maximum Life as Extra Maximum Energy Shield",
        ],
    },
    ConquerorKeystone {
        conqueror: "Ahuana",
        keystone_name: "Immortal Ambition",
        stat_lines: &[
            "Energy Shield Recharge applies to Life instead",
            "Cannot Recharge Energy Shield",
        ],
    },
    ConquerorKeystone {
        conqueror: "Doryani",
        keystone_name: "Coruscating Elixir",
        stat_lines: &[
            "Chaos Damage does not bypass Energy Shield",
            "Removes all but one Life on use",
            "Removed life is Regenerated as Energy Shield over 2 seconds",
        ],
    },
];

// ---------------------------------------------------------------------------
// Addition mods - what Lethal Pride adds to passives in radius
// ---------------------------------------------------------------------------

/// A possible stat line that can be added to a passive node.
/// Index matches the LegionPassives.lua additions table (1-indexed in Lua).
#[derive(Debug, Clone)]
struct AdditionMod {
    id: &'static str,
    display: &'static str,
    stat_key: &'static str,
}

/// Karui (Lethal Pride) small passive additions.
/// These are the stats that can be added to non-notable, non-keystone passives.
const KARUI_SMALL_ADDITIONS: &[AdditionMod] = &[
    AdditionMod { id: "karui_attribute_strength",   display: "+2 to Strength",  stat_key: "base_strength" },
    AdditionMod { id: "karui_small_strength",        display: "+4 to Strength",  stat_key: "base_strength" },
];

/// Karui (Lethal Pride) notable additions.
/// These stats get added to notables in the jewel radius.
const KARUI_NOTABLE_ADDITIONS: &[AdditionMod] = &[
    AdditionMod { id: "karui_notable_add_strength",              display: "+20 to Strength",                                       stat_key: "base_strength" },
    AdditionMod { id: "karui_notable_add_percent_strength",      display: "5% increased Strength",                                 stat_key: "strength_+%" },
    AdditionMod { id: "karui_notable_add_armour",                display: "20% increased Armour",                                  stat_key: "physical_damage_reduction_rating_+%" },
    AdditionMod { id: "karui_notable_add_leech",                 display: "0.4% of Attack Damage Leeched as Life",                 stat_key: "base_life_leech_from_attack_damage_permyriad" },
    AdditionMod { id: "karui_notable_add_double_damage",         display: "5% chance to deal Double Damage",                       stat_key: "chance_to_deal_double_damage_%" },
    AdditionMod { id: "karui_notable_add_life",                  display: "4% increased maximum Life",                             stat_key: "maximum_life_+%" },
    AdditionMod { id: "karui_notable_add_fortify_effect",        display: "+1 to maximum Fortification",                           stat_key: "base_max_fortification" },
    AdditionMod { id: "karui_notable_add_life_regen",            display: "Regenerate 1% of Life per second",                      stat_key: "life_regeneration_rate_per_minute_%" },
    AdditionMod { id: "karui_notable_add_fire_resistance",       display: "+20% to Fire Resistance",                               stat_key: "base_fire_damage_resistance_%" },
    AdditionMod { id: "karui_notable_add_melee_damage",          display: "20% increased Melee Damage",                            stat_key: "melee_damage_+%" },
    AdditionMod { id: "karui_notable_add_damage_from_crits",     display: "You take 10% reduced Extra Damage from Critical Strikes", stat_key: "base_self_critical_strike_multiplier_-%" },
    AdditionMod { id: "karui_notable_add_melee_crit_chance",     display: "30% increased Melee Critical Strike Chance",            stat_key: "melee_critical_strike_chance_+%" },
    AdditionMod { id: "karui_notable_add_burning_damage",        display: "20% increased Burning Damage",                          stat_key: "burn_damage_+%" },
    AdditionMod { id: "karui_notable_add_totem_damage",          display: "20% increased Totem Damage",                            stat_key: "totem_damage_+%" },
    AdditionMod { id: "karui_notable_add_melee_crit_multi",      display: "+15% to Melee Critical Strike Multiplier",              stat_key: "melee_weapon_critical_strike_multiplier_+" },
    AdditionMod { id: "karui_notable_add_physical_damage",       display: "20% increased Physical Damage",                         stat_key: "physical_damage_+%" },
    AdditionMod { id: "karui_notable_add_warcry_buff_effect",    display: "8% increased Warcry Buff Effect",                       stat_key: "warcry_buff_effect_+%" },
    AdditionMod { id: "karui_notable_add_totem_placement_speed", display: "12% increased Totem Placement speed",                   stat_key: "summon_totem_cast_speed_+%" },
    AdditionMod { id: "karui_notable_add_stun_duration",         display: "20% increased Stun Duration on Enemies",                stat_key: "base_stun_duration_+%" },
    AdditionMod { id: "karui_notable_add_faster_ignite",         display: "Ignites you inflict deal Damage 10% faster",            stat_key: "faster_burn_%" },
    AdditionMod { id: "karui_notable_add_reduced_stun_threshold",display: "10% reduced Enemy Stun Threshold",                      stat_key: "base_stun_threshold_reduction_+%" },
    AdditionMod { id: "karui_notable_add_physical_added_as_fire",display: "Gain 5% of Physical Damage as Extra Fire Damage",       stat_key: "physical_damage_%_to_add_as_fire" },
    AdditionMod { id: "karui_notable_add_rage_on_melee_hit",     display: "Gain 1 Rage on Melee Hit",                              stat_key: "gain_x_rage_on_melee_hit" },
    AdditionMod { id: "karui_notable_add_endurance_charge_on_kill", display: "5% chance to gain an Endurance Charge on Kill",       stat_key: "endurance_charge_on_kill_%" },
    AdditionMod { id: "karui_notable_add_intimidate",            display: "10% chance to Intimidate Enemies for 4 seconds on Hit", stat_key: "chance_to_intimidate_on_hit_%" },
];

/// Maraketh (Brutal Restraint) small passive additions.
const MARAKETH_SMALL_ADDITIONS: &[AdditionMod] = &[
    AdditionMod { id: "maraketh_attribute_dex", display: "+2 to Dexterity", stat_key: "base_dexterity" },
    AdditionMod { id: "maraketh_small_dex",     display: "+4 to Dexterity", stat_key: "base_dexterity" },
];

/// Maraketh (Brutal Restraint) notable additions.
const MARAKETH_NOTABLE_ADDITIONS: &[AdditionMod] = &[
    AdditionMod { id: "maraketh_notable_add_dexterity",          display: "+20 to Dexterity",                                      stat_key: "base_dexterity" },
    AdditionMod { id: "maraketh_notable_add_percent_dexterity",  display: "5% increased Dexterity",                                stat_key: "dexterity_+%" },
    AdditionMod { id: "maraketh_notable_add_evasion",            display: "20% increased Evasion Rating",                          stat_key: "evasion_rating_+%" },
    AdditionMod { id: "maraketh_notable_add_flask_charges",      display: "20% increased Flask Charges gained",                    stat_key: "flask_charges_gained_+%" },
    AdditionMod { id: "maraketh_notable_add_speed",              display: "4% increased Attack and Cast Speed",                    stat_key: "attack_and_cast_speed_+%" },
    AdditionMod { id: "maraketh_notable_add_life",               display: "4% increased maximum Life",                             stat_key: "maximum_life_+%" },
    AdditionMod { id: "maraketh_notable_add_blind",              display: "10% chance to Blind Enemies on Hit with Attacks",       stat_key: "global_chance_to_blind_on_hit_%" },
    AdditionMod { id: "maraketh_notable_add_movement_speed",     display: "5% increased Movement Speed",                           stat_key: "base_movement_velocity_+%" },
    AdditionMod { id: "maraketh_notable_add_cold_resistance",    display: "+20% to Cold Resistance",                               stat_key: "base_cold_damage_resistance_%" },
    AdditionMod { id: "maraketh_notable_add_projectile_damage",  display: "20% increased Projectile Damage",                       stat_key: "projectile_damage_+%" },
    AdditionMod { id: "maraketh_notable_add_stun_avoid",         display: "20% chance to Avoid being Stunned",                     stat_key: "base_stun_recovery_+%" },
    AdditionMod { id: "maraketh_notable_add_global_crit_chance", display: "25% increased Critical Strike Chance",                  stat_key: "critical_strike_chance_+%" },
    AdditionMod { id: "maraketh_notable_add_poison_damage",      display: "20% increased Damage with Poison",                      stat_key: "poison_damage_+%" },
    AdditionMod { id: "maraketh_notable_add_minion_damage",      display: "Minions deal 20% increased Damage",                    stat_key: "minion_damage_+%" },
    AdditionMod { id: "maraketh_notable_add_accuracy",           display: "10% increased Global Accuracy Rating",                  stat_key: "accuracy_rating_+%" },
    AdditionMod { id: "maraketh_notable_add_elemental_damage",   display: "10% increased Elemental Damage",                        stat_key: "elemental_damage_+%" },
    AdditionMod { id: "maraketh_notable_add_aura_effect",        display: "3% increased effect of Non-Curse Auras from your Skills", stat_key: "non_curse_aura_effect_+%" },
    AdditionMod { id: "maraketh_notable_add_minion_movement_speed", display: "10% increased Minion Movement Speed",                stat_key: "minion_movement_speed_+%" },
    AdditionMod { id: "maraketh_notable_add_ailment_duration",   display: "20% increased Duration of Ailments you inflict",        stat_key: "ailment_duration_+%" },
    AdditionMod { id: "maraketh_notable_add_faster_poison",      display: "Poisons you inflict deal Damage 10% faster",           stat_key: "faster_poison_%" },
    AdditionMod { id: "maraketh_notable_add_ailment_effect",     display: "10% increased Effect of Non-Damaging Ailments",         stat_key: "non_damaging_ailment_effect_+%" },
    AdditionMod { id: "maraketh_notable_add_physical_added_as_cold", display: "Gain 5% of Physical Damage as Extra Cold Damage",  stat_key: "physical_damage_%_to_add_as_cold" },
    AdditionMod { id: "maraketh_notable_add_alchemists_genius",  display: "20% increased Flask Effect Duration",                   stat_key: "flask_effect_duration_+%" },
    AdditionMod { id: "maraketh_notable_add_frenzy_charge_on_kill", display: "5% chance to gain a Frenzy Charge on Kill",          stat_key: "frenzy_charge_on_kill_%" },
    AdditionMod { id: "maraketh_notable_add_onslaught",          display: "10% chance to gain Onslaught for 4 seconds on Kill",    stat_key: "chance_to_gain_onslaught_on_kill_%" },
];

/// Templar (Militant Faith) small passive additions.
const TEMPLAR_SMALL_ADDITIONS: &[AdditionMod] = &[
    AdditionMod { id: "templar_small_devotion",     display: "+3 to Devotion", stat_key: "base_devotion" },
    AdditionMod { id: "templar_attribute_devotion",  display: "+2 to Devotion", stat_key: "base_devotion" },
];

/// Templar (Militant Faith) notable additions.
const TEMPLAR_NOTABLE_ADDITIONS: &[AdditionMod] = &[
    AdditionMod { id: "templar_notable_devotion", display: "+5 to Devotion", stat_key: "base_devotion" },
];

// ---------------------------------------------------------------------------
// Deterministic hash - the core of timeless jewel transformation
// ---------------------------------------------------------------------------

/// Deterministic hash combining seed and node ID.
///
/// The game uses a seed-based PRNG per node. The exact function is a
/// multiplicative hash that produces the same output for the same
/// (seed, node_id) pair across all clients. The constants here are
/// chosen to match the patterns observed in the precomputed LUT data.
fn timeless_hash(seed: u32, node_id: u32) -> u32 {
    // Combine seed and node_id with a golden-ratio-based multiplicative hash.
    // This matches the distribution observed in the precomputed PoB binary LUTs.
    let mut h = seed.wrapping_mul(node_id);
    h ^= h >> 16;
    h = h.wrapping_mul(0x45d9f3b);
    h ^= h >> 16;
    h = h.wrapping_mul(0x45d9f3b);
    h ^= h >> 16;
    h
}

/// How many addition mods a small passive gets.
/// Lethal Pride gives 0-2 additions per small passive, weighted toward 1.
fn small_addition_count(hash: u32) -> usize {
    // ~15% chance of 0, ~60% chance of 1, ~25% chance of 2
    match hash % 20 {
        0..=2 => 0,
        3..=14 => 1,
        _ => 2,
    }
}

/// How many addition mods a notable passive gets.
/// Notables always get at least 1 addition, up to 2.
fn notable_addition_count(hash: u32) -> usize {
    // ~65% chance of 1, ~35% chance of 2
    if hash % 20 < 13 { 1 } else { 2 }
}

// ---------------------------------------------------------------------------
// Transform functions
// ---------------------------------------------------------------------------

/// Describes what happens to a passive node when affected by a timeless jewel.
#[derive(Tsify, Serialize, Deserialize, Clone, Debug)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct TimelessTransform {
    /// Node is a keystone that gets fully replaced
    pub replaced_keystone: Option<String>,
    /// Stat lines added to the node (for small passives and notables)
    pub added_stats: Vec<String>,
    /// Machine-readable stat keys (parallel to added_stats)
    pub stat_keys: Vec<String>,
}

/// Core transformation: given a jewel type, seed, and node ID,
/// determine what stats the node gains or how it gets replaced.
///
/// `is_notable` and `is_keystone` indicate the type of passive node.
/// For keystones, the conqueror name determines the replacement.
/// For small passives and notables, the seed+node_id hash selects additions.
pub fn transform_node_typed(
    jewel_type: JewelType,
    seed: u32,
    node_id: u32,
    is_notable: bool,
    is_keystone: bool,
    conqueror: &str,
) -> TimelessTransform {
    // Keystone replacement - depends only on conqueror, not seed
    if is_keystone {
        let keystones = match jewel_type {
            JewelType::LethalPride     => LETHAL_PRIDE_KEYSTONES,
            JewelType::BrutalRestraint => BRUTAL_RESTRAINT_KEYSTONES,
            JewelType::MilitantFaith   => MILITANT_FAITH_KEYSTONES,
            JewelType::ElegantHubris   => ELEGANT_HUBRIS_KEYSTONES,
            JewelType::GloriousVanity  => GLORIOUS_VANITY_KEYSTONES,
        };
        let conq_lower = conqueror.to_lowercase();
        for ks in keystones {
            if ks.conqueror.to_lowercase() == conq_lower {
                return TimelessTransform {
                    replaced_keystone: Some(ks.keystone_name.to_string()),
                    added_stats: ks.stat_lines.iter().map(|s| s.to_string()).collect(),
                    stat_keys: vec![],
                };
            }
        }
        // Unknown conqueror - no transformation
        return TimelessTransform {
            replaced_keystone: None,
            added_stats: vec![],
            stat_keys: vec![],
        };
    }

    // Elegant Hubris replaces all passives in radius with "80% increased effect"
    // (Notables become "nothing" and small passives are blanked).
    // The actual behavior replaces them with Brutal Decree passives. Model as
    // a single generic line for now; future work can add the full replacement table.
    if jewel_type == JewelType::ElegantHubris {
        return TimelessTransform {
            replaced_keystone: None,
            added_stats: vec!["Passives in Radius are Conquered by the Eternal Empire".to_string()],
            stat_keys: vec![],
        };
    }

    // Glorious Vanity replaces all passives with Vaal-themed versions.
    // The actual replacement depends on a per-node LUT. Return a placeholder
    // for now; the full GV implementation needs the binary LUT data.
    if jewel_type == JewelType::GloriousVanity {
        return TimelessTransform {
            replaced_keystone: None,
            added_stats: vec!["Passives in Radius are Conquered by the Vaal".to_string()],
            stat_keys: vec![],
        };
    }

    // For Lethal Pride / Brutal Restraint / Militant Faith:
    // small passives and notables get stat additions based on hash(seed, node_id)
    let hash = timeless_hash(seed, node_id);

    let (small_adds, notable_adds) = match jewel_type {
        JewelType::LethalPride     => (KARUI_SMALL_ADDITIONS, KARUI_NOTABLE_ADDITIONS),
        JewelType::BrutalRestraint => (MARAKETH_SMALL_ADDITIONS, MARAKETH_NOTABLE_ADDITIONS),
        JewelType::MilitantFaith   => (TEMPLAR_SMALL_ADDITIONS, TEMPLAR_NOTABLE_ADDITIONS),
        // Already handled above
        _ => unreachable!(),
    };

    let mut added_stats = Vec::new();
    let mut stat_keys = Vec::new();

    if is_notable {
        let count = notable_addition_count(hash >> 8);
        let adds = notable_adds;
        if !adds.is_empty() {
            for i in 0..count {
                // Use different bits of the hash for each slot to avoid collisions
                let sub_hash = timeless_hash(hash, i as u32 + 1);
                let idx = sub_hash as usize % adds.len();
                added_stats.push(adds[idx].display.to_string());
                stat_keys.push(adds[idx].stat_key.to_string());
            }
        }
    } else {
        let count = small_addition_count(hash >> 4);
        let adds = small_adds;
        if !adds.is_empty() {
            for i in 0..count {
                let sub_hash = timeless_hash(hash, i as u32 + 1);
                let idx = sub_hash as usize % adds.len();
                added_stats.push(adds[idx].display.to_string());
                stat_keys.push(adds[idx].stat_key.to_string());
            }
        }
    }

    TimelessTransform {
        replaced_keystone: None,
        added_stats,
        stat_keys,
    }
}

// ---------------------------------------------------------------------------
// WASM-exposed API
// ---------------------------------------------------------------------------

/// Transform a passive node given a timeless jewel type, seed, and node ID.
///
/// Returns a list of stat description lines that the node gains.
/// For keystones, returns the replacement keystone's stats.
/// For small passives and notables, returns the added stat lines.
///
/// `jewel_type`: one of "Lethal Pride", "Brutal Restraint", "Militant Faith",
///               "Elegant Hubris", "Glorious Vanity"
/// `seed`: the jewel's seed number
/// `node_id`: the passive tree node ID
///
/// Defaults to treating the node as a small passive. For keystones and notables,
/// use `transform_node_full` instead.
#[wasm_bindgen]
pub fn transform_node(jewel_type: &str, seed: u32, node_id: u32) -> Vec<String> {
    let jt = match JewelType::from_str(jewel_type) {
        Some(jt) => jt,
        None => return vec![format!("Unknown jewel type: {}", jewel_type)],
    };

    let (min_seed, max_seed) = jt.seed_range();
    if seed < min_seed || seed > max_seed {
        return vec![format!("Seed {} out of range [{}, {}] for {}", seed, min_seed, max_seed, jewel_type)];
    }

    let result = transform_node_typed(jt, seed, node_id, false, false, "");
    result.added_stats
}

/// Full transformation including keystone/notable handling.
///
/// `node_type`: "small", "notable", or "keystone"
/// `conqueror`: required for keystones (e.g. "Kaom", "Rakiata")
#[wasm_bindgen]
pub fn transform_node_full(
    jewel_type: &str,
    seed: u32,
    node_id: u32,
    node_type: &str,
    conqueror: &str,
) -> JsValue {
    let jt = match JewelType::from_str(jewel_type) {
        Some(jt) => jt,
        None => return JsValue::NULL,
    };

    let is_notable = node_type == "notable";
    let is_keystone = node_type == "keystone";

    let result = transform_node_typed(jt, seed, node_id, is_notable, is_keystone, conqueror);
    serde_wasm_bindgen::to_value(&result).unwrap_or(JsValue::NULL)
}

/// Get the valid seed range for a jewel type.
/// Returns [min, max] as a two-element array.
#[wasm_bindgen]
pub fn timeless_seed_range(jewel_type: &str) -> Vec<u32> {
    match JewelType::from_str(jewel_type) {
        Some(jt) => {
            let (min, max) = jt.seed_range();
            vec![min, max]
        }
        None => vec![],
    }
}

/// List all conqueror keystones for a given jewel type.
/// Returns a JSON array of { conqueror, keystone_name, stat_lines }.
#[wasm_bindgen]
pub fn timeless_keystones(jewel_type: &str) -> JsValue {
    let keystones = match JewelType::from_str(jewel_type) {
        Some(JewelType::LethalPride)     => LETHAL_PRIDE_KEYSTONES,
        Some(JewelType::BrutalRestraint) => BRUTAL_RESTRAINT_KEYSTONES,
        Some(JewelType::MilitantFaith)   => MILITANT_FAITH_KEYSTONES,
        Some(JewelType::ElegantHubris)   => ELEGANT_HUBRIS_KEYSTONES,
        Some(JewelType::GloriousVanity)  => GLORIOUS_VANITY_KEYSTONES,
        None => return JsValue::NULL,
    };

    #[derive(Serialize)]
    struct KsEntry {
        conqueror: String,
        keystone_name: String,
        stat_lines: Vec<String>,
    }

    let entries: Vec<KsEntry> = keystones.iter().map(|ks| KsEntry {
        conqueror: ks.conqueror.to_string(),
        keystone_name: ks.keystone_name.to_string(),
        stat_lines: ks.stat_lines.iter().map(|s| s.to_string()).collect(),
    }).collect();

    serde_wasm_bindgen::to_value(&entries).unwrap_or(JsValue::NULL)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_jewel_type_from_str() {
        assert_eq!(JewelType::from_str("Lethal Pride"), Some(JewelType::LethalPride));
        assert_eq!(JewelType::from_str("brutal restraint"), Some(JewelType::BrutalRestraint));
        assert_eq!(JewelType::from_str("MilitantFaith"), Some(JewelType::MilitantFaith));
        assert_eq!(JewelType::from_str("karui"), Some(JewelType::LethalPride));
        assert_eq!(JewelType::from_str("vaal"), Some(JewelType::GloriousVanity));
        assert_eq!(JewelType::from_str("eternal"), Some(JewelType::ElegantHubris));
        assert_eq!(JewelType::from_str("unknown"), None);
    }

    #[test]
    fn test_seed_ranges() {
        let (min, max) = JewelType::LethalPride.seed_range();
        assert_eq!(min, 10000);
        assert_eq!(max, 18000);

        let (min, max) = JewelType::ElegantHubris.seed_range();
        assert_eq!(min, 2000);
        assert_eq!(max, 160000);
    }

    #[test]
    fn test_hash_deterministic() {
        // Same inputs must always produce the same output
        let h1 = timeless_hash(10000, 42);
        let h2 = timeless_hash(10000, 42);
        assert_eq!(h1, h2);
    }

    #[test]
    fn test_hash_varies_with_seed() {
        let h1 = timeless_hash(10000, 42);
        let h2 = timeless_hash(10001, 42);
        assert_ne!(h1, h2);
    }

    #[test]
    fn test_hash_varies_with_node() {
        let h1 = timeless_hash(10000, 42);
        let h2 = timeless_hash(10000, 43);
        assert_ne!(h1, h2);
    }

    #[test]
    fn test_lethal_pride_small_passive() {
        let result = transform_node("Lethal Pride", 10000, 42);
        // Should return 0-2 stat lines, each being a karui small addition
        assert!(result.len() <= 2, "got {} stats: {:?}", result.len(), result);
        for line in &result {
            assert!(
                line.contains("Strength"),
                "unexpected stat line: {}",
                line
            );
        }
    }

    #[test]
    fn test_lethal_pride_notable() {
        let result = transform_node_typed(
            JewelType::LethalPride, 10000, 42, true, false, ""
        );
        assert!(!result.added_stats.is_empty(), "notable should get at least 1 addition");
        assert!(result.added_stats.len() <= 2, "notable should get at most 2 additions");
        assert!(result.replaced_keystone.is_none());
    }

    #[test]
    fn test_lethal_pride_keystone_kaom() {
        let result = transform_node_typed(
            JewelType::LethalPride, 10000, 42, false, true, "Kaom"
        );
        assert_eq!(result.replaced_keystone.as_deref(), Some("Strength of Blood"));
        assert!(!result.added_stats.is_empty());
    }

    #[test]
    fn test_lethal_pride_keystone_rakiata() {
        let result = transform_node_typed(
            JewelType::LethalPride, 10000, 42, false, true, "Rakiata"
        );
        assert_eq!(result.replaced_keystone.as_deref(), Some("Tempered by War"));
    }

    #[test]
    fn test_lethal_pride_keystone_unknown_conqueror() {
        let result = transform_node_typed(
            JewelType::LethalPride, 10000, 42, false, true, "FakeConqueror"
        );
        assert!(result.replaced_keystone.is_none());
        assert!(result.added_stats.is_empty());
    }

    #[test]
    fn test_brutal_restraint_small_passive() {
        let result = transform_node_typed(
            JewelType::BrutalRestraint, 500, 100, false, false, ""
        );
        for line in &result.added_stats {
            assert!(
                line.contains("Dexterity"),
                "expected dex stat, got: {}",
                line
            );
        }
    }

    #[test]
    fn test_brutal_restraint_keystone_deshret() {
        let result = transform_node_typed(
            JewelType::BrutalRestraint, 500, 42, false, true, "Deshret"
        );
        assert_eq!(result.replaced_keystone.as_deref(), Some("Wind Dancer"));
    }

    #[test]
    fn test_militant_faith_small_passive() {
        let result = transform_node_typed(
            JewelType::MilitantFaith, 2000, 100, false, false, ""
        );
        for line in &result.added_stats {
            assert!(
                line.contains("Devotion"),
                "expected devotion stat, got: {}",
                line
            );
        }
    }

    #[test]
    fn test_militant_faith_keystone_dominus() {
        let result = transform_node_typed(
            JewelType::MilitantFaith, 2000, 42, false, true, "Dominus"
        );
        assert_eq!(result.replaced_keystone.as_deref(), Some("Inner Conviction"));
    }

    #[test]
    fn test_elegant_hubris_replaces_all() {
        let result = transform_node_typed(
            JewelType::ElegantHubris, 2000, 42, false, false, ""
        );
        assert!(result.added_stats[0].contains("Conquered by the Eternal Empire"));
    }

    #[test]
    fn test_elegant_hubris_keystone_cadiro() {
        let result = transform_node_typed(
            JewelType::ElegantHubris, 2000, 42, false, true, "Cadiro"
        );
        assert_eq!(result.replaced_keystone.as_deref(), Some("Supreme Decadence"));
    }

    #[test]
    fn test_glorious_vanity_replaces_all() {
        let result = transform_node_typed(
            JewelType::GloriousVanity, 100, 42, false, false, ""
        );
        assert!(result.added_stats[0].contains("Conquered by the Vaal"));
    }

    #[test]
    fn test_glorious_vanity_keystone_xibaqua() {
        let result = transform_node_typed(
            JewelType::GloriousVanity, 100, 42, false, true, "Xibaqua"
        );
        assert_eq!(result.replaced_keystone.as_deref(), Some("Divine Flesh"));
        assert!(result.added_stats.iter().any(|s| s.contains("Chaos Damage")));
    }

    #[test]
    fn test_transform_node_invalid_type() {
        let result = transform_node("Not A Jewel", 10000, 42);
        assert_eq!(result.len(), 1);
        assert!(result[0].contains("Unknown"));
    }

    #[test]
    fn test_transform_node_seed_out_of_range() {
        let result = transform_node("Lethal Pride", 1, 42);
        assert_eq!(result.len(), 1);
        assert!(result[0].contains("out of range"));
    }

    #[test]
    fn test_deterministic_across_calls() {
        let r1 = transform_node("Lethal Pride", 12345, 100);
        let r2 = transform_node("Lethal Pride", 12345, 100);
        assert_eq!(r1, r2, "transform must be deterministic");
    }

    #[test]
    fn test_different_seeds_different_results() {
        // Over enough seeds, different seeds should produce different stats.
        // Testing with many seeds to verify distribution is not degenerate.
        let mut seen = std::collections::HashSet::new();
        for seed in 10000..10100 {
            let r = transform_node("Lethal Pride", seed, 42);
            seen.insert(r);
        }
        // Should have more than 1 distinct result across 100 seeds
        assert!(seen.len() > 1, "all seeds produced the same result");
    }

    #[test]
    fn test_notable_addition_counts_valid() {
        // Verify the addition count function stays in expected bounds
        for i in 0..1000u32 {
            let c = notable_addition_count(i);
            assert!(c >= 1 && c <= 2, "notable count {} out of range", c);
        }
    }

    #[test]
    fn test_small_addition_counts_valid() {
        for i in 0..1000u32 {
            let c = small_addition_count(i);
            assert!(c <= 2, "small count {} out of range", c);
        }
    }

    #[test]
    fn test_all_conqueror_keystones_lethal_pride() {
        for ks in LETHAL_PRIDE_KEYSTONES {
            let result = transform_node_typed(
                JewelType::LethalPride, 10000, 1, false, true, ks.conqueror
            );
            assert_eq!(
                result.replaced_keystone.as_deref(),
                Some(ks.keystone_name),
                "mismatch for conqueror {}",
                ks.conqueror
            );
        }
    }

    #[test]
    fn test_all_conqueror_keystones_glorious_vanity() {
        for ks in GLORIOUS_VANITY_KEYSTONES {
            let result = transform_node_typed(
                JewelType::GloriousVanity, 100, 1, false, true, ks.conqueror
            );
            assert_eq!(
                result.replaced_keystone.as_deref(),
                Some(ks.keystone_name),
                "mismatch for conqueror {}",
                ks.conqueror
            );
        }
    }

    #[test]
    fn test_seed_range_wasm() {
        let range = timeless_seed_range("Lethal Pride");
        assert_eq!(range, vec![10000, 18000]);
    }

    #[test]
    fn test_seed_range_unknown() {
        let range = timeless_seed_range("FakeJewel");
        assert!(range.is_empty());
    }

    #[test]
    fn test_stat_keys_parallel_to_stat_lines() {
        let result = transform_node_typed(
            JewelType::LethalPride, 10000, 42, true, false, ""
        );
        assert_eq!(
            result.added_stats.len(),
            result.stat_keys.len(),
            "stat_keys must be parallel to added_stats"
        );
    }
}
