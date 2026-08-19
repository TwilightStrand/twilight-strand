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
#[allow(dead_code)]
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
/// Index 0 = attribute node bonus, index 1 = non-attribute node bonus
/// (consistent with Karui and Maraketh ordering).
const TEMPLAR_SMALL_ADDITIONS: &[AdditionMod] = &[
    AdditionMod { id: "templar_attribute_devotion",  display: "+2 to Devotion", stat_key: "base_devotion" },
    AdditionMod { id: "templar_small_devotion",      display: "+3 to Devotion", stat_key: "base_devotion" },
];

/// Templar (Militant Faith) notable additions.
/// Notables can either get flat devotion or be replaced by devotion-themed mods.
/// The replacement mods are gated behind "at least 150 Devotion" thresholds.
const TEMPLAR_NOTABLE_ADDITIONS: &[AdditionMod] = &[
    AdditionMod { id: "templar_notable_devotion",                       display: "+5 to Devotion",                                                                            stat_key: "base_devotion" },
    AdditionMod { id: "templar_notable_fire_conversion",                display: "15% of Physical Damage Converted to Fire Damage while you have at least 150 Devotion",       stat_key: "physical_damage_%_to_convert_to_fire_at_devotion_threshold" },
    AdditionMod { id: "templar_notable_cold_conversion",                display: "15% of Physical Damage Converted to Cold Damage while you have at least 150 Devotion",       stat_key: "physical_damage_%_to_convert_to_cold_at_devotion_threshold" },
    AdditionMod { id: "templar_notable_lightning_conversion",           display: "15% of Physical Damage Converted to Lightning Damage while you have at least 150 Devotion",  stat_key: "physical_damage_%_to_convert_to_lightning_at_devotion_threshold" },
    AdditionMod { id: "templar_notable_mana_added_as_energy_shield",    display: "Gain 5% of Maximum Mana as Extra Maximum Energy Shield while you have at least 150 Devotion", stat_key: "mana_%_to_add_as_energy_shield_at_devotion_threshold" },
    AdditionMod { id: "templar_notable_arcane_surge",                   display: "Gain Arcane Surge on Hit with Spells if you have at least 150 Devotion",                     stat_key: "gain_arcane_surge_on_hit_at_devotion_threshold" },
    AdditionMod { id: "templar_notable_minimum_endurance_charge",       display: "+1 to Minimum Endurance Charges while you have at least 150 Devotion",                       stat_key: "minimum_endurance_charges_at_devotion_threshold" },
    AdditionMod { id: "templar_notable_minimum_power_charge",           display: "+1 to Minimum Power Charges while you have at least 150 Devotion",                           stat_key: "minimum_power_charges_at_devotion_threshold" },
    AdditionMod { id: "templar_notable_minimum_frenzy_charge",          display: "+1 to Minimum Frenzy Charges while you have at least 150 Devotion",                          stat_key: "minimum_frenzy_charges_at_devotion_threshold" },
    AdditionMod { id: "templar_notable_consecrated_ground_ailments",    display: "Immune to Elemental Ailments while on Consecrated Ground if you have at least 150 Devotion", stat_key: "immune_to_elemental_ailments_while_on_consecrated_ground_at_devotion_threshold" },
    AdditionMod { id: "templar_notable_additional_physical_reduction",  display: "5% additional Physical Damage Reduction while you have at least 150 Devotion",               stat_key: "physical_damage_reduction_%_at_devotion_threshold" },
    AdditionMod { id: "templar_notable_max_resistances",                display: "+1% to all maximum Resistances if you have at least 150 Devotion",                           stat_key: "additional_maximum_all_resistances_%_at_devotion_threshold" },
    AdditionMod { id: "templar_notable_fire_exposure",                  display: "10% chance to inflict Fire Exposure on Hit if you have at least 150 Devotion",               stat_key: "inflict_fire_exposure_on_hit_%_chance_at_devotion_threshold" },
    AdditionMod { id: "templar_notable_cold_exposure",                  display: "10% chance to inflict Cold Exposure on Hit if you have at least 150 Devotion",               stat_key: "inflict_cold_exposure_on_hit_%_chance_at_devotion_threshold" },
    AdditionMod { id: "templar_notable_lightning_exposure",             display: "10% chance to inflict Lightning Exposure on Hit if you have at least 150 Devotion",           stat_key: "inflict_lightning_exposure_on_hit_%_chance_at_devotion_threshold" },
];

/// Eternal Empire (Elegant Hubris) notable replacement mods.
/// Notables in radius are fully replaced with one of these themed mods.
/// In the game, the LUT determines which mod; we use hash-based selection.
const ETERNAL_NOTABLE_REPLACEMENTS: &[AdditionMod] = &[
    AdditionMod { id: "eternal_notable_crit_1",                     display: "80% increased Critical Strike Chance",                  stat_key: "critical_strike_chance_+%" },
    AdditionMod { id: "eternal_notable_crit_2",                     display: "+40% to Critical Strike Multiplier",                    stat_key: "base_critical_strike_multiplier_+" },
    AdditionMod { id: "eternal_notable_endurance_1",                display: "Gain 1 Endurance Charge every second if you've been Hit Recently", stat_key: "gain_endurance_charge_per_second_if_have_been_hit_recently" },
    AdditionMod { id: "eternal_notable_endurance_2",                display: "8% increased Armour per Endurance Charge",              stat_key: "physical_damage_reduction_rating_+%_per_endurance_charge" },
    AdditionMod { id: "eternal_notable_endurance_3",                display: "10% increased Damage per Endurance Charge",             stat_key: "damage_+%_per_endurance_charge" },
    AdditionMod { id: "eternal_notable_frenzy_1",                   display: "10% chance to gain a Frenzy Charge on Hit",             stat_key: "add_frenzy_charge_on_skill_hit_%" },
    AdditionMod { id: "eternal_notable_frenzy_2",                   display: "8% increased Evasion Rating per Frenzy Charge",         stat_key: "evasion_rating_+%_per_frenzy_charge" },
    AdditionMod { id: "eternal_notable_frenzy_3",                   display: "10% increased Damage per Frenzy Charge",               stat_key: "damage_+%_per_frenzy_charge" },
    AdditionMod { id: "eternal_notable_power_1",                    display: "15% chance to gain a Power Charge on Critical Strike",  stat_key: "add_power_charge_on_critical_strike_%" },
    AdditionMod { id: "eternal_notable_power_2",                    display: "4% increased Energy Shield per Power Charge",           stat_key: "energy_shield_+%_per_power_charge" },
    AdditionMod { id: "eternal_notable_power_3",                    display: "10% increased Damage per Power Charge",                stat_key: "damage_+%_per_power_charge" },
    AdditionMod { id: "eternal_notable_chill_1",                    display: "30% increased Effect of Chill",                         stat_key: "chill_effect_+%" },
    AdditionMod { id: "eternal_notable_chill_2",                    display: "80% chance to Avoid being Chilled",                     stat_key: "base_avoid_chill_%" },
    AdditionMod { id: "eternal_notable_shock_1",                    display: "30% increased Effect of Shock",                         stat_key: "shock_effect_+%" },
    AdditionMod { id: "eternal_notable_shock_2",                    display: "80% chance to Avoid being Shocked",                     stat_key: "base_avoid_shock_%" },
    AdditionMod { id: "eternal_notable_block_1",                    display: "+12% Chance to Block Attack Damage",                    stat_key: "additional_block_%" },
    AdditionMod { id: "eternal_notable_block_2",                    display: "12% Chance to Block Spell Damage",                      stat_key: "base_spell_block_%" },
    AdditionMod { id: "eternal_notable_dodge_1",                    display: "20% chance to Avoid Elemental Ailments",                stat_key: "avoid_all_elemental_status_%" },
    AdditionMod { id: "eternal_notable_dodge_2",                    display: "+12% chance to Suppress Spell Damage",                  stat_key: "base_spell_suppression_chance_%" },
    AdditionMod { id: "eternal_notable_aura_1",                     display: "12% increased effect of Non-Curse Auras from your Skills", stat_key: "non_curse_aura_effect_+%" },
    AdditionMod { id: "eternal_notable_minion_1",                   display: "Minions deal 80% increased Damage",                    stat_key: "minion_damage_+%" },
    AdditionMod { id: "eternal_notable_minion_2",                   display: "Minions have 80% increased maximum Life",              stat_key: "minion_maximum_life_+%" },
    AdditionMod { id: "eternal_notable_spell_1",                    display: "80% increased Spell Damage",                            stat_key: "spell_damage_+%" },
    AdditionMod { id: "eternal_notable_spell_2",                    display: "80% increased Spell Critical Strike Chance",            stat_key: "spell_critical_strike_chance_+%" },
    AdditionMod { id: "eternal_notable_fire_attack_1",              display: "80% increased Fire Damage with Attack Skills",          stat_key: "fire_damage_with_attack_skills_+%" },
    AdditionMod { id: "eternal_notable_cold_attack_1",              display: "80% increased Cold Damage with Attack Skills",          stat_key: "cold_damage_with_attack_skills_+%" },
    AdditionMod { id: "eternal_notable_lightning_attack_1",         display: "80% increased Lightning Damage with Attack Skills",     stat_key: "lightning_damage_with_attack_skills_+%" },
    AdditionMod { id: "eternal_notable_physical_damage_1",          display: "80% increased Physical Damage",                         stat_key: "physical_damage_+%" },
    AdditionMod { id: "eternal_notable_physical_damage_2",          display: "80% increased Melee Physical Damage",                   stat_key: "melee_physical_damage_+%" },
    AdditionMod { id: "eternal_notable_bleed_damage_1",             display: "50% increased Damage with Bleeding",                    stat_key: "bleeding_damage_+%" },
    AdditionMod { id: "eternal_notable_projectile_attack_damage_1", display: "80% increased Projectile Attack Damage",                stat_key: "projectile_attack_damage_+%" },
    AdditionMod { id: "eternal_notable_attack_speed_1",             display: "15% increased Attack Speed",                            stat_key: "attack_speed_+%" },
    AdditionMod { id: "eternal_notable_cast_speed_1",               display: "15% increased Cast Speed",                              stat_key: "base_cast_speed_+%" },
    AdditionMod { id: "eternal_notable_rarity_1",                   display: "12% increased Mana Reservation Efficiency of Skills",   stat_key: "base_mana_reservation_efficiency_+%" },
    AdditionMod { id: "eternal_notable_armour_1",                   display: "80% increased Armour",                                  stat_key: "physical_damage_reduction_rating_+%" },
    AdditionMod { id: "eternal_notable_evasion_1",                  display: "80% increased Evasion Rating",                          stat_key: "evasion_rating_+%" },
    AdditionMod { id: "eternal_notable_fire_resistance_1",          display: "+50% to Fire Resistance",                               stat_key: "base_fire_damage_resistance_%" },
    AdditionMod { id: "eternal_notable_cold_resistance_1",          display: "+50% to Cold Resistance",                               stat_key: "base_cold_damage_resistance_%" },
    AdditionMod { id: "eternal_notable_lightning_resistance_1",     display: "+50% to Lightning Resistance",                          stat_key: "base_lightning_damage_resistance_%" },
    AdditionMod { id: "eternal_notable_chaos_resistance_1",         display: "+37% to Chaos Resistance",                              stat_key: "base_chaos_damage_resistance_%" },
    AdditionMod { id: "eternal_notable_life_1",                     display: "10% increased maximum Life",                            stat_key: "maximum_life_+%" },
    AdditionMod { id: "eternal_notable_mana_1",                     display: "30% increased maximum Mana",                            stat_key: "maximum_mana_+%" },
    AdditionMod { id: "eternal_notable_mana_regen_1",               display: "50% increased Mana Regeneration Rate",                  stat_key: "mana_regeneration_rate_+%" },
    AdditionMod { id: "eternal_notable_accuracy_1",                 display: "25% increased Accuracy Rating",                         stat_key: "accuracy_rating_+%" },
    AdditionMod { id: "eternal_notable_flask_duration_1",           display: "20% increased Flask Effect Duration",                   stat_key: "flask_duration_+%" },
];

/// Vaal (Glorious Vanity) small passive replacement mods.
/// ALL small passives in radius are replaced with one of these sacrificial mods.
/// The mid-range values represent a typical roll.
const VAAL_SMALL_REPLACEMENTS: &[AdditionMod] = &[
    AdditionMod { id: "vaal_small_fire_damage",              display: "10% increased Fire Damage",                      stat_key: "fire_damage_+%" },
    AdditionMod { id: "vaal_small_cold_damage",              display: "10% increased Cold Damage",                      stat_key: "cold_damage_+%" },
    AdditionMod { id: "vaal_small_lightning_damage",          display: "10% increased Lightning Damage",                stat_key: "lightning_damage_+%" },
    AdditionMod { id: "vaal_small_physical_damage",          display: "10% increased Physical Damage",                  stat_key: "physical_damage_+%" },
    AdditionMod { id: "vaal_small_chaos_damage",             display: "10% increased Chaos Damage",                     stat_key: "chaos_damage_+%" },
    AdditionMod { id: "vaal_small_minion_damage",            display: "Minions deal 10% increased Damage",             stat_key: "minion_damage_+%" },
    AdditionMod { id: "vaal_small_attack_damage",            display: "10% increased Attack Damage",                    stat_key: "attack_damage_+%" },
    AdditionMod { id: "vaal_small_spell_damage",             display: "10% increased Spell Damage",                     stat_key: "spell_damage_+%" },
    AdditionMod { id: "vaal_small_area_damage",              display: "10% increased Area Damage",                      stat_key: "area_damage_+%" },
    AdditionMod { id: "vaal_small_projectile_damage",        display: "10% increased Projectile Damage",                stat_key: "projectile_damage_+%" },
    AdditionMod { id: "vaal_small_damage_over_time",         display: "10% increased Damage over Time",                 stat_key: "damage_over_time_+%" },
    AdditionMod { id: "vaal_small_area_of_effect",           display: "5% increased Area of Effect",                    stat_key: "base_skill_area_of_effect_+%" },
    AdditionMod { id: "vaal_small_projectile_speed",         display: "10% increased Projectile Speed",                 stat_key: "base_projectile_speed_+%" },
    AdditionMod { id: "vaal_small_critical_strike_chance",   display: "10% increased Critical Strike Chance",           stat_key: "critical_strike_chance_+%" },
    AdditionMod { id: "vaal_small_critical_strike_multiplier", display: "+8% to Critical Strike Multiplier",            stat_key: "base_critical_strike_multiplier_+" },
    AdditionMod { id: "vaal_small_attack_speed",             display: "3% increased Attack Speed",                      stat_key: "attack_speed_+%" },
    AdditionMod { id: "vaal_small_cast_speed",               display: "2% increased Cast Speed",                        stat_key: "base_cast_speed_+%" },
    AdditionMod { id: "vaal_small_movement_speed",           display: "2% increased Movement Speed",                    stat_key: "base_movement_velocity_+%" },
    AdditionMod { id: "vaal_small_chance_to_ignite",         display: "5% chance to Ignite",                            stat_key: "base_chance_to_ignite_%" },
    AdditionMod { id: "vaal_small_chance_to_freeze",         display: "5% chance to Freeze",                            stat_key: "base_chance_to_freeze_%" },
    AdditionMod { id: "vaal_small_chance_to_shock",          display: "5% chance to Shock",                             stat_key: "base_chance_to_shock_%" },
    AdditionMod { id: "vaal_small_duration",                 display: "5% increased Skill Effect Duration",             stat_key: "skill_effect_duration_+%" },
    AdditionMod { id: "vaal_small_life",                     display: "3% increased maximum Life",                      stat_key: "maximum_life_+%" },
    AdditionMod { id: "vaal_small_mana",                     display: "5% increased maximum Mana",                      stat_key: "maximum_mana_+%" },
    AdditionMod { id: "vaal_small_mana_regeneration",        display: "15% increased Mana Regeneration Rate",           stat_key: "mana_regeneration_rate_+%" },
    AdditionMod { id: "vaal_small_armour",                   display: "10% increased Armour",                           stat_key: "physical_damage_reduction_rating_+%" },
    AdditionMod { id: "vaal_small_evasion",                  display: "10% increased Evasion Rating",                   stat_key: "evasion_rating_+%" },
    AdditionMod { id: "vaal_small_energy_shield",            display: "4% increased maximum Energy Shield",             stat_key: "maximum_energy_shield_+%" },
    AdditionMod { id: "vaal_small_attack_block",             display: "+2% Chance to Block Attack Damage",              stat_key: "additional_block_%" },
    AdditionMod { id: "vaal_small_spell_block",              display: "2% Chance to Block Spell Damage",                stat_key: "base_spell_block_%" },
    AdditionMod { id: "vaal_small_attack_dodge",             display: "3% chance to Avoid Elemental Ailments",          stat_key: "avoid_all_elemental_status_%" },
    AdditionMod { id: "vaal_small_spell_dodge",              display: "+4% chance to Suppress Spell Damage",            stat_key: "base_spell_suppression_chance_%" },
    AdditionMod { id: "vaal_small_aura_effect",              display: "3% increased effect of Non-Curse Auras from your Skills", stat_key: "non_curse_aura_effect_+%" },
    AdditionMod { id: "vaal_small_curse_effect",             display: "2% increased Effect of your Curses",             stat_key: "curse_effect_+%" },
    AdditionMod { id: "vaal_small_fire_resistance",          display: "+12% to Fire Resistance",                        stat_key: "base_fire_damage_resistance_%" },
    AdditionMod { id: "vaal_small_cold_resistance",          display: "+12% to Cold Resistance",                        stat_key: "base_cold_damage_resistance_%" },
    AdditionMod { id: "vaal_small_lightning_resistance",      display: "+12% to Lightning Resistance",                  stat_key: "base_lightning_damage_resistance_%" },
    AdditionMod { id: "vaal_small_chaos_resistance",         display: "+8% to Chaos Resistance",                        stat_key: "base_chaos_damage_resistance_%" },
];

/// Vaal (Glorious Vanity) notable replacement mods.
/// Notables in radius are completely replaced with Vaal-themed versions.
/// These are single-stat representations; in the game, some notables have two
/// stat lines. We use the primary stat for hash-based selection.
const VAAL_NOTABLE_REPLACEMENTS: &[AdditionMod] = &[
    AdditionMod { id: "vaal_notable_fire_damage_1",         display: "30% increased Fire Damage",                               stat_key: "fire_damage_+%" },
    AdditionMod { id: "vaal_notable_fire_damage_2",         display: "30% increased Fire Damage, 0.2% of Fire Damage Leeched as Life", stat_key: "fire_damage_+%" },
    AdditionMod { id: "vaal_notable_fire_damage_3",         display: "30% increased Fire Damage, 10% of Physical Damage Converted to Fire Damage", stat_key: "fire_damage_+%" },
    AdditionMod { id: "vaal_notable_cold_damage_1",         display: "30% increased Cold Damage",                               stat_key: "cold_damage_+%" },
    AdditionMod { id: "vaal_notable_cold_damage_2",         display: "30% increased Cold Damage, 0.2% of Cold Damage Leeched as Life", stat_key: "cold_damage_+%" },
    AdditionMod { id: "vaal_notable_cold_damage_3",         display: "30% increased Cold Damage, 10% of Physical Damage Converted to Cold Damage", stat_key: "cold_damage_+%" },
    AdditionMod { id: "vaal_notable_lightning_damage_1",     display: "30% increased Lightning Damage",                         stat_key: "lightning_damage_+%" },
    AdditionMod { id: "vaal_notable_lightning_damage_2",     display: "30% increased Lightning Damage, 0.2% of Lightning Damage Leeched as Life", stat_key: "lightning_damage_+%" },
    AdditionMod { id: "vaal_notable_lightning_damage_3",     display: "30% increased Lightning Damage, 10% of Physical Damage Converted to Lightning Damage", stat_key: "lightning_damage_+%" },
    AdditionMod { id: "vaal_notable_physical_damage_1",     display: "30% increased Physical Damage, 3% chance to deal Double Damage", stat_key: "physical_damage_+%" },
    AdditionMod { id: "vaal_notable_physical_damage_2",     display: "30% increased Physical Damage, 0.2% of Physical Damage Leeched as Life", stat_key: "physical_damage_+%" },
    AdditionMod { id: "vaal_notable_physical_damage_3",     display: "30% increased Physical Damage, Bleeding you inflict deals Damage 10% faster", stat_key: "physical_damage_+%" },
    AdditionMod { id: "vaal_notable_chaos_damage_1",        display: "30% increased Chaos Damage, 25% chance to inflict Withered for 2 seconds on Hit", stat_key: "chaos_damage_+%" },
    AdditionMod { id: "vaal_notable_chaos_damage_2",        display: "30% increased Chaos Damage, 0.2% of Chaos Damage Leeched as Life", stat_key: "chaos_damage_+%" },
    AdditionMod { id: "vaal_notable_spell_damage_1",        display: "30% increased Spell Damage, 42% increased Spell Critical Strike Chance", stat_key: "spell_damage_+%" },
    AdditionMod { id: "vaal_notable_minion_damage_1",       display: "Minions deal 30% increased Damage, Minions have 17% increased maximum Life", stat_key: "minion_damage_+%" },
    AdditionMod { id: "vaal_notable_damage_over_time_1",    display: "30% increased Damage over Time, 9% increased Skill Effect Duration", stat_key: "damage_over_time_+%" },
    AdditionMod { id: "vaal_notable_life_1",                display: "8% increased maximum Life, Regenerate 1% of Life per second", stat_key: "maximum_life_+%" },
    AdditionMod { id: "vaal_notable_life_2",                display: "8% increased maximum Life, 0.4% of Attack Damage Leeched as Life", stat_key: "maximum_life_+%" },
    AdditionMod { id: "vaal_notable_mana_1",                display: "20% increased maximum Mana, 20% increased Mana Regeneration Rate", stat_key: "maximum_mana_+%" },
    AdditionMod { id: "vaal_notable_armour_1",              display: "35% increased Armour, 3% additional Physical Damage Reduction", stat_key: "physical_damage_reduction_rating_+%" },
    AdditionMod { id: "vaal_notable_evasion_1",             display: "35% increased Evasion Rating, 6% chance to Blind Enemies on Hit", stat_key: "evasion_rating_+%" },
    AdditionMod { id: "vaal_notable_energy_shield_1",       display: "10% increased maximum Energy Shield, 12% increased Energy Shield Recharge Rate", stat_key: "maximum_energy_shield_+%" },
    AdditionMod { id: "vaal_notable_energy_shield_2",       display: "10% increased maximum Energy Shield, 0.3% of Spell Damage Leeched as Energy Shield", stat_key: "maximum_energy_shield_+%" },
    AdditionMod { id: "vaal_notable_block_1",               display: "+8% Chance to Block Attack Damage, 8 Life gained when you Block", stat_key: "additional_block_%" },
    AdditionMod { id: "vaal_notable_block_2",               display: "8% Chance to Block Spell Damage, 25% increased Defences from Equipped Shield", stat_key: "base_spell_block_%" },
    AdditionMod { id: "vaal_notable_dodge_1",               display: "9% chance to Avoid Elemental Ailments, 9% chance to Avoid being Stunned", stat_key: "avoid_all_elemental_status_%" },
    AdditionMod { id: "vaal_notable_dodge_2",               display: "+6% chance to Suppress Spell Damage, +9% to all Elemental Resistances", stat_key: "base_spell_suppression_chance_%" },
    AdditionMod { id: "vaal_notable_aura_1",                display: "20% increased Area of Effect of Aura Skills, 8% increased effect of Non-Curse Auras from your Skills", stat_key: "non_curse_aura_effect_+%" },
    AdditionMod { id: "vaal_notable_curse_1",               display: "5% increased Effect of your Curses, Curse Skills have 20% increased Skill Effect Duration", stat_key: "curse_effect_+%" },
    AdditionMod { id: "vaal_notable_fire_resistance_1",     display: "+1% to maximum Fire Resistance, +25% to Fire Resistance", stat_key: "base_fire_damage_resistance_%" },
    AdditionMod { id: "vaal_notable_cold_resistance_1",     display: "+1% to maximum Cold Resistance, +25% to Cold Resistance", stat_key: "base_cold_damage_resistance_%" },
    AdditionMod { id: "vaal_notable_lightning_resistance_1", display: "+1% to maximum Lightning Resistance, +25% to Lightning Resistance", stat_key: "base_lightning_damage_resistance_%" },
    AdditionMod { id: "vaal_notable_chaos_resistance_1",    display: "+1% to maximum Chaos Resistance, +16% to Chaos Resistance", stat_key: "base_chaos_damage_resistance_%" },
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

/// How many addition mods a notable passive gets.
/// Notables always get at least 1 addition, up to 2.
fn notable_addition_count(hash: u32) -> usize {
    // ~65% chance of 1, ~35% chance of 2
    if hash % 20 < 13 { 1 } else { 2 }
}

// ---------------------------------------------------------------------------
// Attribute-node detection
// ---------------------------------------------------------------------------

/// Check if a passive node is an attribute node based on its original name.
///
/// In the passive tree, attribute small passives are named "+10 to Strength",
/// "+10 to Dexterity", or "+10 to Intelligence". Timeless jewels give these
/// nodes smaller bonuses than non-attribute small passives:
/// - Lethal Pride: +2 Str (vs +4 for non-attribute)
/// - Brutal Restraint: +2 Dex (vs +4 for non-attribute)
/// - Militant Faith: +2 Devotion (vs +3 for non-attribute)
pub fn is_attribute_node(original_name: &str) -> bool {
    if original_name.is_empty() {
        return false;
    }
    let name_lower = original_name.to_lowercase();
    name_lower.contains("strength")
        || name_lower.contains("dexterity")
        || name_lower.contains("intelligence")
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
/// For notables, the seed+node_id hash selects additions.
/// For small passives, `original_name` determines whether the node is an
/// attribute node ("+10 to Strength" etc.) which receives a smaller bonus.
pub fn transform_node_typed(
    jewel_type: JewelType,
    seed: u32,
    node_id: u32,
    is_notable: bool,
    is_keystone: bool,
    conqueror: &str,
    original_name: &str,
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

    let hash = timeless_hash(seed, node_id);
    let mut added_stats = Vec::new();
    let mut stat_keys = Vec::new();

    // -----------------------------------------------------------------------
    // Elegant Hubris (Eternal Empire)
    //   - Small passives: replaced with blank ("Passive grants nothing")
    //   - Notables: replaced with a single themed mod selected by hash
    // -----------------------------------------------------------------------
    if jewel_type == JewelType::ElegantHubris {
        if is_notable {
            let idx = hash as usize % ETERNAL_NOTABLE_REPLACEMENTS.len();
            let replacement = &ETERNAL_NOTABLE_REPLACEMENTS[idx];
            added_stats.push(replacement.display.to_string());
            stat_keys.push(replacement.stat_key.to_string());
        } else {
            added_stats.push("Passive grants nothing".to_string());
            stat_keys.push("eternal_blank".to_string());
        }
        return TimelessTransform {
            replaced_keystone: None,
            added_stats,
            stat_keys,
        };
    }

    // -----------------------------------------------------------------------
    // Glorious Vanity (Vaal)
    //   - Small passives: replaced with a single Vaal-themed mod
    //   - Notables: replaced with a Vaal-themed notable mod
    //   Both selected by hash(seed, node_id).
    // -----------------------------------------------------------------------
    if jewel_type == JewelType::GloriousVanity {
        if is_notable {
            let idx = hash as usize % VAAL_NOTABLE_REPLACEMENTS.len();
            let replacement = &VAAL_NOTABLE_REPLACEMENTS[idx];
            added_stats.push(replacement.display.to_string());
            stat_keys.push(replacement.stat_key.to_string());
        } else {
            let idx = hash as usize % VAAL_SMALL_REPLACEMENTS.len();
            let replacement = &VAAL_SMALL_REPLACEMENTS[idx];
            added_stats.push(replacement.display.to_string());
            stat_keys.push(replacement.stat_key.to_string());
        }
        return TimelessTransform {
            replaced_keystone: None,
            added_stats,
            stat_keys,
        };
    }

    // -----------------------------------------------------------------------
    // Lethal Pride / Brutal Restraint / Militant Faith
    //   - Small passives: deterministic stat based on attribute-node detection
    //   - Notables: 1-2 stat additions selected by hash from the mod pool
    // -----------------------------------------------------------------------
    let (small_adds, notable_adds) = match jewel_type {
        JewelType::LethalPride     => (KARUI_SMALL_ADDITIONS, KARUI_NOTABLE_ADDITIONS),
        JewelType::BrutalRestraint => (MARAKETH_SMALL_ADDITIONS, MARAKETH_NOTABLE_ADDITIONS),
        JewelType::MilitantFaith   => (TEMPLAR_SMALL_ADDITIONS, TEMPLAR_NOTABLE_ADDITIONS),
        // Elegant Hubris and Glorious Vanity handled above
        _ => unreachable!(),
    };

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
        // Small passives get exactly one stat determined by attribute status.
        // For LP/BR/MF, small_adds is ordered: [0] = attribute bonus, [1] = non-attribute bonus.
        // Attribute nodes (+10 to Str/Dex/Int) get the smaller bonus.
        let is_attr = is_attribute_node(original_name);
        let idx = if is_attr { 0 } else { 1 };
        if idx < small_adds.len() {
            added_stats.push(small_adds[idx].display.to_string());
            stat_keys.push(small_adds[idx].stat_key.to_string());
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

    let result = transform_node_typed(jt, seed, node_id, false, false, "", "");
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

    let result = transform_node_typed(jt, seed, node_id, is_notable, is_keystone, conqueror, "");
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
        // When original_name is empty (not an attribute node), should get +4 Str
        let result = transform_node("Lethal Pride", 10000, 42);
        assert_eq!(result.len(), 1, "small passive should get exactly 1 stat");
        assert_eq!(result[0], "+4 to Strength");
    }

    #[test]
    fn test_lethal_pride_notable() {
        let result = transform_node_typed(
            JewelType::LethalPride, 10000, 42, true, false, "", ""
        );
        assert!(!result.added_stats.is_empty(), "notable should get at least 1 addition");
        assert!(result.added_stats.len() <= 2, "notable should get at most 2 additions");
        assert!(result.replaced_keystone.is_none());
    }

    #[test]
    fn test_lethal_pride_keystone_kaom() {
        let result = transform_node_typed(
            JewelType::LethalPride, 10000, 42, false, true, "Kaom", ""
        );
        assert_eq!(result.replaced_keystone.as_deref(), Some("Strength of Blood"));
        assert!(!result.added_stats.is_empty());
    }

    #[test]
    fn test_lethal_pride_keystone_rakiata() {
        let result = transform_node_typed(
            JewelType::LethalPride, 10000, 42, false, true, "Rakiata", ""
        );
        assert_eq!(result.replaced_keystone.as_deref(), Some("Tempered by War"));
    }

    #[test]
    fn test_lethal_pride_keystone_unknown_conqueror() {
        let result = transform_node_typed(
            JewelType::LethalPride, 10000, 42, false, true, "FakeConqueror", ""
        );
        assert!(result.replaced_keystone.is_none());
        assert!(result.added_stats.is_empty());
    }

    // -------------------------------------------------------------------
    // Brutal Restraint (Maraketh) tests
    // -------------------------------------------------------------------

    #[test]
    fn test_brutal_restraint_small_passive() {
        // Non-attribute small passive gets +4 Dex
        let result = transform_node_typed(
            JewelType::BrutalRestraint, 500, 100, false, false, "", ""
        );
        assert_eq!(result.added_stats.len(), 1, "small passive should get exactly 1 stat");
        assert_eq!(result.added_stats[0], "+4 to Dexterity");
    }

    #[test]
    fn test_brutal_restraint_notable() {
        let result = transform_node_typed(
            JewelType::BrutalRestraint, 500, 42, true, false, "", ""
        );
        assert!(!result.added_stats.is_empty(), "notable should get at least 1 addition");
        assert!(result.added_stats.len() <= 2, "notable should get at most 2 additions");
        assert!(result.replaced_keystone.is_none());
    }

    #[test]
    fn test_brutal_restraint_notable_stat_keys() {
        let result = transform_node_typed(
            JewelType::BrutalRestraint, 1500, 77, true, false, "", ""
        );
        assert_eq!(
            result.added_stats.len(),
            result.stat_keys.len(),
            "stat_keys must be parallel to added_stats"
        );
        for key in &result.stat_keys {
            assert!(!key.is_empty(), "stat key must not be empty");
        }
    }

    #[test]
    fn test_brutal_restraint_keystone_deshret() {
        let result = transform_node_typed(
            JewelType::BrutalRestraint, 500, 42, false, true, "Deshret", ""
        );
        assert_eq!(result.replaced_keystone.as_deref(), Some("Wind Dancer"));
    }

    #[test]
    fn test_brutal_restraint_keystone_balbala() {
        let result = transform_node_typed(
            JewelType::BrutalRestraint, 500, 42, false, true, "Balbala", ""
        );
        assert_eq!(result.replaced_keystone.as_deref(), Some("The Traitor"));
    }

    #[test]
    fn test_brutal_restraint_keystone_asenath() {
        let result = transform_node_typed(
            JewelType::BrutalRestraint, 500, 42, false, true, "Asenath", ""
        );
        assert_eq!(result.replaced_keystone.as_deref(), Some("Dance with Death"));
    }

    #[test]
    fn test_brutal_restraint_keystone_nasima() {
        let result = transform_node_typed(
            JewelType::BrutalRestraint, 500, 42, false, true, "Nasima", ""
        );
        assert_eq!(result.replaced_keystone.as_deref(), Some("Second Sight"));
    }

    #[test]
    fn test_brutal_restraint_all_conqueror_keystones() {
        for ks in BRUTAL_RESTRAINT_KEYSTONES {
            let result = transform_node_typed(
                JewelType::BrutalRestraint, 500, 1, false, true, ks.conqueror, ""
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
    fn test_brutal_restraint_notable_variety() {
        // Verify different node IDs produce different notable mods
        let mut seen = std::collections::HashSet::new();
        for node_id in 1..100u32 {
            let r = transform_node_typed(
                JewelType::BrutalRestraint, 1000, node_id, true, false, "", ""
            );
            seen.insert(r.added_stats);
        }
        assert!(seen.len() > 5, "expected notable mod variety, got only {} distinct results", seen.len());
    }

    #[test]
    fn test_brutal_restraint_deterministic() {
        let r1 = transform_node_typed(JewelType::BrutalRestraint, 1234, 55, true, false, "", "");
        let r2 = transform_node_typed(JewelType::BrutalRestraint, 1234, 55, true, false, "", "");
        assert_eq!(r1.added_stats, r2.added_stats);
        assert_eq!(r1.stat_keys, r2.stat_keys);
    }

    // -------------------------------------------------------------------
    // Militant Faith (Templar) tests
    // -------------------------------------------------------------------

    #[test]
    fn test_militant_faith_small_passive() {
        // Non-attribute small passive gets +3 Devotion
        let result = transform_node_typed(
            JewelType::MilitantFaith, 2000, 100, false, false, "", ""
        );
        assert_eq!(result.added_stats.len(), 1, "small passive should get exactly 1 stat");
        assert_eq!(result.added_stats[0], "+3 to Devotion");
    }

    #[test]
    fn test_militant_faith_notable() {
        let result = transform_node_typed(
            JewelType::MilitantFaith, 3000, 42, true, false, "", ""
        );
        assert!(!result.added_stats.is_empty(), "notable should get at least 1 addition");
        assert!(result.added_stats.len() <= 2, "notable should get at most 2 additions");
        assert!(result.replaced_keystone.is_none());
    }

    #[test]
    fn test_militant_faith_notable_devotion_themed() {
        // Militant Faith notables should include devotion-themed mods
        let mut has_devotion_theme = false;
        for node_id in 1..200u32 {
            let r = transform_node_typed(
                JewelType::MilitantFaith, 5000, node_id, true, false, "", ""
            );
            for line in &r.added_stats {
                if line.contains("Devotion") || line.contains("150 Devotion") {
                    has_devotion_theme = true;
                }
            }
        }
        assert!(has_devotion_theme, "expected at least some devotion-themed notable mods");
    }

    #[test]
    fn test_militant_faith_notable_variety() {
        // The expanded pool should produce more than 1 distinct notable across nodes
        let mut seen = std::collections::HashSet::new();
        for node_id in 1..200u32 {
            let r = transform_node_typed(
                JewelType::MilitantFaith, 5000, node_id, true, false, "", ""
            );
            seen.insert(r.added_stats);
        }
        assert!(seen.len() > 3, "expected notable mod variety, got only {} distinct results", seen.len());
    }

    #[test]
    fn test_militant_faith_keystone_dominus() {
        let result = transform_node_typed(
            JewelType::MilitantFaith, 2000, 42, false, true, "Dominus", ""
        );
        assert_eq!(result.replaced_keystone.as_deref(), Some("Inner Conviction"));
    }

    #[test]
    fn test_militant_faith_keystone_avarius() {
        let result = transform_node_typed(
            JewelType::MilitantFaith, 2000, 42, false, true, "Avarius", ""
        );
        assert_eq!(result.replaced_keystone.as_deref(), Some("Power of Purpose"));
    }

    #[test]
    fn test_militant_faith_keystone_maxarius() {
        let result = transform_node_typed(
            JewelType::MilitantFaith, 2000, 42, false, true, "Maxarius", ""
        );
        assert_eq!(result.replaced_keystone.as_deref(), Some("Transcendence"));
    }

    #[test]
    fn test_militant_faith_keystone_venarius() {
        let result = transform_node_typed(
            JewelType::MilitantFaith, 2000, 42, false, true, "Venarius", ""
        );
        assert_eq!(result.replaced_keystone.as_deref(), Some("Battlemage"));
    }

    #[test]
    fn test_militant_faith_all_conqueror_keystones() {
        for ks in MILITANT_FAITH_KEYSTONES {
            let result = transform_node_typed(
                JewelType::MilitantFaith, 2000, 1, false, true, ks.conqueror, ""
            );
            assert_eq!(
                result.replaced_keystone.as_deref(),
                Some(ks.keystone_name),
                "mismatch for conqueror {}",
                ks.conqueror
            );
        }
    }

    // -------------------------------------------------------------------
    // Elegant Hubris (Eternal Empire) tests
    // -------------------------------------------------------------------

    #[test]
    fn test_elegant_hubris_small_passive_blanked() {
        let result = transform_node_typed(
            JewelType::ElegantHubris, 2000, 42, false, false, "", ""
        );
        assert_eq!(result.added_stats.len(), 1);
        assert_eq!(result.added_stats[0], "Passive grants nothing");
        assert_eq!(result.stat_keys[0], "eternal_blank");
    }

    #[test]
    fn test_elegant_hubris_notable_gets_replacement() {
        let result = transform_node_typed(
            JewelType::ElegantHubris, 2000, 42, true, false, "", ""
        );
        assert_eq!(result.added_stats.len(), 1, "notable should get exactly 1 replacement mod");
        assert!(!result.added_stats[0].is_empty());
        assert!(!result.stat_keys[0].is_empty());
        // Should NOT be "Passive grants nothing"
        assert_ne!(result.added_stats[0], "Passive grants nothing");
    }

    #[test]
    fn test_elegant_hubris_notable_variety() {
        // Different seeds/nodes should produce different notable replacements
        let mut seen = std::collections::HashSet::new();
        for node_id in 1..200u32 {
            let r = transform_node_typed(
                JewelType::ElegantHubris, 50000, node_id, true, false, "", ""
            );
            seen.insert(r.added_stats[0].clone());
        }
        assert!(seen.len() > 10, "expected variety in notable replacements, got only {} distinct", seen.len());
    }

    #[test]
    fn test_elegant_hubris_notable_deterministic() {
        let r1 = transform_node_typed(JewelType::ElegantHubris, 5000, 77, true, false, "", "");
        let r2 = transform_node_typed(JewelType::ElegantHubris, 5000, 77, true, false, "", "");
        assert_eq!(r1.added_stats, r2.added_stats);
    }

    #[test]
    fn test_elegant_hubris_keystone_cadiro() {
        let result = transform_node_typed(
            JewelType::ElegantHubris, 2000, 42, false, true, "Cadiro", ""
        );
        assert_eq!(result.replaced_keystone.as_deref(), Some("Supreme Decadence"));
    }

    #[test]
    fn test_elegant_hubris_keystone_victario() {
        let result = transform_node_typed(
            JewelType::ElegantHubris, 2000, 42, false, true, "Victario", ""
        );
        assert_eq!(result.replaced_keystone.as_deref(), Some("Supreme Grandstanding"));
    }

    #[test]
    fn test_elegant_hubris_keystone_caspiro() {
        let result = transform_node_typed(
            JewelType::ElegantHubris, 2000, 42, false, true, "Caspiro", ""
        );
        assert_eq!(result.replaced_keystone.as_deref(), Some("Supreme Ego"));
    }

    #[test]
    fn test_elegant_hubris_keystone_chitus() {
        let result = transform_node_typed(
            JewelType::ElegantHubris, 2000, 42, false, true, "Chitus", ""
        );
        assert_eq!(result.replaced_keystone.as_deref(), Some("Supreme Ostentation"));
    }

    #[test]
    fn test_elegant_hubris_all_conqueror_keystones() {
        for ks in ELEGANT_HUBRIS_KEYSTONES {
            let result = transform_node_typed(
                JewelType::ElegantHubris, 2000, 1, false, true, ks.conqueror, ""
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
    fn test_elegant_hubris_stat_keys_parallel() {
        let result = transform_node_typed(
            JewelType::ElegantHubris, 10000, 42, true, false, "", ""
        );
        assert_eq!(result.added_stats.len(), result.stat_keys.len());
    }

    // -------------------------------------------------------------------
    // Glorious Vanity (Vaal) tests
    // -------------------------------------------------------------------

    #[test]
    fn test_glorious_vanity_small_passive_replaced() {
        let result = transform_node_typed(
            JewelType::GloriousVanity, 100, 42, false, false, "", ""
        );
        assert_eq!(result.added_stats.len(), 1, "small passive should get exactly 1 replacement");
        assert!(!result.added_stats[0].is_empty());
        assert!(!result.stat_keys[0].is_empty());
    }

    #[test]
    fn test_glorious_vanity_notable_replaced() {
        let result = transform_node_typed(
            JewelType::GloriousVanity, 100, 42, true, false, "", ""
        );
        assert_eq!(result.added_stats.len(), 1, "notable should get exactly 1 replacement");
        assert!(!result.added_stats[0].is_empty());
        assert!(!result.stat_keys[0].is_empty());
    }

    #[test]
    fn test_glorious_vanity_small_passive_variety() {
        let mut seen = std::collections::HashSet::new();
        for node_id in 1..200u32 {
            let r = transform_node_typed(
                JewelType::GloriousVanity, 3000, node_id, false, false, "", ""
            );
            seen.insert(r.added_stats[0].clone());
        }
        assert!(seen.len() > 10, "expected variety in small passive replacements, got only {} distinct", seen.len());
    }

    #[test]
    fn test_glorious_vanity_notable_variety() {
        let mut seen = std::collections::HashSet::new();
        for node_id in 1..200u32 {
            let r = transform_node_typed(
                JewelType::GloriousVanity, 3000, node_id, true, false, "", ""
            );
            seen.insert(r.added_stats[0].clone());
        }
        assert!(seen.len() > 10, "expected variety in notable replacements, got only {} distinct", seen.len());
    }

    #[test]
    fn test_glorious_vanity_deterministic() {
        let r1 = transform_node_typed(JewelType::GloriousVanity, 500, 77, false, false, "", "");
        let r2 = transform_node_typed(JewelType::GloriousVanity, 500, 77, false, false, "", "");
        assert_eq!(r1.added_stats, r2.added_stats);
        assert_eq!(r1.stat_keys, r2.stat_keys);
    }

    #[test]
    fn test_glorious_vanity_different_seeds_differ() {
        let mut seen = std::collections::HashSet::new();
        for seed in 100..200u32 {
            let r = transform_node_typed(
                JewelType::GloriousVanity, seed, 42, false, false, "", ""
            );
            seen.insert(r.added_stats);
        }
        assert!(seen.len() > 1, "different seeds should produce different results");
    }

    #[test]
    fn test_glorious_vanity_keystone_xibaqua() {
        let result = transform_node_typed(
            JewelType::GloriousVanity, 100, 42, false, true, "Xibaqua", ""
        );
        assert_eq!(result.replaced_keystone.as_deref(), Some("Divine Flesh"));
        assert!(result.added_stats.iter().any(|s| s.contains("Chaos Damage")));
    }

    #[test]
    fn test_glorious_vanity_keystone_zerphi() {
        let result = transform_node_typed(
            JewelType::GloriousVanity, 100, 42, false, true, "Zerphi", ""
        );
        assert_eq!(result.replaced_keystone.as_deref(), Some("Corrupted Soul"));
    }

    #[test]
    fn test_glorious_vanity_keystone_ahuana() {
        let result = transform_node_typed(
            JewelType::GloriousVanity, 100, 42, false, true, "Ahuana", ""
        );
        assert_eq!(result.replaced_keystone.as_deref(), Some("Immortal Ambition"));
    }

    #[test]
    fn test_glorious_vanity_keystone_doryani() {
        let result = transform_node_typed(
            JewelType::GloriousVanity, 100, 42, false, true, "Doryani", ""
        );
        assert_eq!(result.replaced_keystone.as_deref(), Some("Coruscating Elixir"));
    }

    #[test]
    fn test_glorious_vanity_stat_keys_parallel() {
        let r_small = transform_node_typed(
            JewelType::GloriousVanity, 200, 42, false, false, "", ""
        );
        assert_eq!(r_small.added_stats.len(), r_small.stat_keys.len());

        let r_notable = transform_node_typed(
            JewelType::GloriousVanity, 200, 42, true, false, "", ""
        );
        assert_eq!(r_notable.added_stats.len(), r_notable.stat_keys.len());
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
    fn test_different_seeds_different_notable_results() {
        // Over enough seeds, different seeds should produce different notable stats.
        // Small passives are deterministic (based on attribute status, not seed),
        // but notables still use hash-based selection.
        let mut seen = std::collections::HashSet::new();
        for seed in 10000..10100 {
            let r = transform_node_typed(
                JewelType::LethalPride, seed, 42, true, false, "", ""
            );
            seen.insert(r.added_stats);
        }
        // Should have more than 1 distinct result across 100 seeds for notables
        assert!(seen.len() > 1, "all seeds produced the same notable result");
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
    fn test_all_conqueror_keystones_lethal_pride() {
        for ks in LETHAL_PRIDE_KEYSTONES {
            let result = transform_node_typed(
                JewelType::LethalPride, 10000, 1, false, true, ks.conqueror, ""
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
                JewelType::GloriousVanity, 100, 1, false, true, ks.conqueror, ""
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
            JewelType::LethalPride, 10000, 42, true, false, "", ""
        );
        assert_eq!(
            result.added_stats.len(),
            result.stat_keys.len(),
            "stat_keys must be parallel to added_stats"
        );
    }

    // -------------------------------------------------------------------
    // Attribute-node detection tests
    // -------------------------------------------------------------------

    #[test]
    fn test_is_attribute_node_strength() {
        assert!(is_attribute_node("+10 to Strength"));
    }

    #[test]
    fn test_is_attribute_node_dexterity() {
        assert!(is_attribute_node("+10 to Dexterity"));
    }

    #[test]
    fn test_is_attribute_node_intelligence() {
        assert!(is_attribute_node("+10 to Intelligence"));
    }

    #[test]
    fn test_is_attribute_node_case_insensitive() {
        assert!(is_attribute_node("+10 to STRENGTH"));
        assert!(is_attribute_node("+10 to strength"));
    }

    #[test]
    fn test_is_not_attribute_node() {
        assert!(!is_attribute_node("Melee Damage"));
        assert!(!is_attribute_node("Attack Speed"));
        assert!(!is_attribute_node("Maximum Life"));
        assert!(!is_attribute_node(""));
    }

    // -------------------------------------------------------------------
    // Attribute-node bonus tests (Lethal Pride)
    // -------------------------------------------------------------------

    #[test]
    fn lethal_pride_attribute_node_gets_plus_2() {
        // A "+10 to Strength" node should get +2 Str, not +4
        let result = transform_node_typed(
            JewelType::LethalPride, 10000, 42, false, false, "",
            "+10 to Strength"
        );
        assert_eq!(result.added_stats.len(), 1);
        assert_eq!(result.added_stats[0], "+2 to Strength");
        assert_eq!(result.stat_keys[0], "base_strength");
    }

    #[test]
    fn lethal_pride_non_attribute_node_gets_plus_4() {
        // A regular small passive should get +4 Str
        let result = transform_node_typed(
            JewelType::LethalPride, 10000, 42, false, false, "",
            "Melee Damage"
        );
        assert_eq!(result.added_stats.len(), 1);
        assert_eq!(result.added_stats[0], "+4 to Strength");
        assert_eq!(result.stat_keys[0], "base_strength");
    }

    #[test]
    fn lethal_pride_dex_attribute_node_gets_plus_2() {
        // "+10 to Dexterity" is also an attribute node; LP still gives +2 Str
        let result = transform_node_typed(
            JewelType::LethalPride, 10000, 42, false, false, "",
            "+10 to Dexterity"
        );
        assert_eq!(result.added_stats.len(), 1);
        assert_eq!(result.added_stats[0], "+2 to Strength");
    }

    #[test]
    fn lethal_pride_int_attribute_node_gets_plus_2() {
        // "+10 to Intelligence" is also an attribute node
        let result = transform_node_typed(
            JewelType::LethalPride, 10000, 42, false, false, "",
            "+10 to Intelligence"
        );
        assert_eq!(result.added_stats.len(), 1);
        assert_eq!(result.added_stats[0], "+2 to Strength");
    }

    #[test]
    fn lethal_pride_attribute_deterministic_across_seeds() {
        // Attribute detection does not depend on seed
        for seed in 10000..10010u32 {
            let r = transform_node_typed(
                JewelType::LethalPride, seed, 42, false, false, "",
                "+10 to Strength"
            );
            assert_eq!(r.added_stats[0], "+2 to Strength",
                "seed {} gave wrong bonus", seed);
        }
    }

    // -------------------------------------------------------------------
    // Attribute-node bonus tests (Brutal Restraint)
    // -------------------------------------------------------------------

    #[test]
    fn brutal_restraint_attribute_node_gets_plus_2() {
        let result = transform_node_typed(
            JewelType::BrutalRestraint, 500, 42, false, false, "",
            "+10 to Dexterity"
        );
        assert_eq!(result.added_stats.len(), 1);
        assert_eq!(result.added_stats[0], "+2 to Dexterity");
        assert_eq!(result.stat_keys[0], "base_dexterity");
    }

    #[test]
    fn brutal_restraint_non_attribute_node_gets_plus_4() {
        let result = transform_node_typed(
            JewelType::BrutalRestraint, 500, 42, false, false, "",
            "Evasion"
        );
        assert_eq!(result.added_stats.len(), 1);
        assert_eq!(result.added_stats[0], "+4 to Dexterity");
        assert_eq!(result.stat_keys[0], "base_dexterity");
    }

    // -------------------------------------------------------------------
    // Attribute-node bonus tests (Militant Faith)
    // -------------------------------------------------------------------

    #[test]
    fn militant_faith_attribute_node_gets_plus_2_devotion() {
        let result = transform_node_typed(
            JewelType::MilitantFaith, 2000, 42, false, false, "",
            "+10 to Intelligence"
        );
        assert_eq!(result.added_stats.len(), 1);
        assert_eq!(result.added_stats[0], "+2 to Devotion");
        assert_eq!(result.stat_keys[0], "base_devotion");
    }

    #[test]
    fn militant_faith_non_attribute_node_gets_plus_3_devotion() {
        let result = transform_node_typed(
            JewelType::MilitantFaith, 2000, 42, false, false, "",
            "Spell Damage"
        );
        assert_eq!(result.added_stats.len(), 1);
        assert_eq!(result.added_stats[0], "+3 to Devotion");
        assert_eq!(result.stat_keys[0], "base_devotion");
    }

    // -------------------------------------------------------------------
    // Attribute-node: Elegant Hubris (all smalls are blank regardless)
    // -------------------------------------------------------------------

    #[test]
    fn elegant_hubris_attribute_node_still_blank() {
        let result = transform_node_typed(
            JewelType::ElegantHubris, 2000, 42, false, false, "",
            "+10 to Strength"
        );
        assert_eq!(result.added_stats.len(), 1);
        assert_eq!(result.added_stats[0], "Passive grants nothing");
    }

    #[test]
    fn elegant_hubris_non_attribute_node_still_blank() {
        let result = transform_node_typed(
            JewelType::ElegantHubris, 2000, 42, false, false, "",
            "Maximum Life"
        );
        assert_eq!(result.added_stats.len(), 1);
        assert_eq!(result.added_stats[0], "Passive grants nothing");
    }

    // -------------------------------------------------------------------
    // Attribute-node: empty original_name treated as non-attribute
    // -------------------------------------------------------------------

    #[test]
    fn empty_original_name_treated_as_non_attribute() {
        let result = transform_node_typed(
            JewelType::LethalPride, 10000, 42, false, false, "", ""
        );
        assert_eq!(result.added_stats[0], "+4 to Strength",
            "empty name should be treated as non-attribute node");
    }
}
