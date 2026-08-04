// AUTO-GENERATED from PoB data files. Do not edit manually.
// Source: ClusterJewels.lua + ModJewelCluster.lua + tree.json
// Generated: 2026-08-04T16:40:48.747Z
// Run: node apps/web/scripts/gen-cluster-data.mjs

export interface ClusterBaseData {
  id: string;
  name: string;
  tag: string;
  type: "large" | "medium" | "small";
  smallPassiveStats: string[];
  enchantText: string;
  notablePool: string[];
}

export interface ClusterNotableData {
  name: string;
  stats: string[];
  weights: Record<string, number>;
  level: number;
}

export const CLUSTER_BASES: ClusterBaseData[] = [
  {
    "id": "affliction_maximum_life",
    "tag": "affliction_maximum_life",
    "name": "Life",
    "type": "small",
    "smallPassiveStats": [
      "4% increased maximum Life"
    ],
    "enchantText": "Added Small Passive Skills grant: 4% increased maximum Life",
    "notablePool": [
      "Gladiator's Fortitude",
      "Towering Threat",
      "Flow of Life",
      "Brush with Death",
      "Careful Handling",
      "Peak Vigour",
      "Fettle",
      "Feast of Flesh",
      "Sublime Sensation",
      "Surging Vitality",
      "Peace Amidst Chaos",
      "Adrenaline",
      "Wall of Muscle",
      "Holistic Health",
      "Heart of Iron",
      "Natural Vigour",
      "Vicious Guard",
      "Rote Reinforcement",
      "Sage",
      "Blessed"
    ]
  },
  {
    "id": "affliction_maximum_energy_shield",
    "tag": "affliction_maximum_energy_shield",
    "name": "Energy Shield",
    "type": "small",
    "smallPassiveStats": [
      "6% increased maximum Energy Shield"
    ],
    "enchantText": "Added Small Passive Skills grant: 6% increased maximum Energy Shield",
    "notablePool": [
      "Brush with Death",
      "Vile Reinvigoration",
      "Sublime Sensation",
      "Savour the Moment",
      "Energy From Naught",
      "Will Shaper",
      "Spring Back",
      "Conservation of Energy",
      "Self-Control",
      "Mystical Ward"
    ]
  },
  {
    "id": "affliction_maximum_mana",
    "tag": "affliction_maximum_mana",
    "name": "Mana",
    "type": "small",
    "smallPassiveStats": [
      "6% increased maximum Mana"
    ],
    "enchantText": "Added Small Passive Skills grant: 6% increased maximum Mana",
    "notablePool": [
      "Eldritch Inspiration",
      "Careful Handling",
      "Mindfulness",
      "Liquid Inspiration",
      "Openness",
      "Daring Ideas",
      "Clarity of Purpose",
      "Scintillating Idea",
      "Holistic Health",
      "Genius",
      "Improvisor",
      "Stubborn Student",
      "Will Shaper",
      "Wizardry",
      "Sage",
      "Blessed"
    ]
  },
  {
    "id": "affliction_armour",
    "tag": "affliction_armour",
    "name": "Armour",
    "type": "small",
    "smallPassiveStats": [
      "15% increased Armour"
    ],
    "enchantText": "Added Small Passive Skills grant: 15% increased Armour",
    "notablePool": [
      "Battle-Hardened",
      "Stubborn Student",
      "Heart of Iron",
      "Prismatic Carapace",
      "Militarism",
      "Second Skin",
      "Dragon Hunter",
      "Enduring Composure",
      "Uncompromising",
      "Blacksmith"
    ]
  },
  {
    "id": "affliction_evasion",
    "tag": "affliction_evasion",
    "name": "Evasion",
    "type": "small",
    "smallPassiveStats": [
      "15% increased Evasion Rating"
    ],
    "enchantText": "Added Small Passive Skills grant: 15% increased Evasion Rating",
    "notablePool": [
      "Battle-Hardened",
      "Prismatic Dance",
      "Natural Vigour",
      "Untouchable",
      "Shifting Shadow",
      "Readiness",
      "Sublime Form"
    ]
  },
  {
    "id": "affliction_chance_to_block_attack_damage",
    "tag": "affliction_chance_to_block",
    "name": "Chance to Block Attack Damage",
    "type": "small",
    "smallPassiveStats": [
      "+2% Chance to Block Attack Damage"
    ],
    "enchantText": "Added Small Passive Skills grant: +2% Chance to Block Attack Damage",
    "notablePool": [
      "Prodigious Defence",
      "Strike Leader",
      "Powerful Ward",
      "Enduring Ward",
      "Stoic Focus",
      "Mage Bane",
      "Second Skin",
      "Flexible Sentry",
      "Vicious Guard",
      "Mystical Ward",
      "Rote Reinforcement",
      "Mage Hunter",
      "Riot Queller",
      "One with the Shield",
      "Fiery Aegis"
    ]
  },
  {
    "id": "affliction_chance_to_block_spell_damage",
    "tag": "affliction_chance_to_block",
    "name": "Chance to Block Spell Damage",
    "type": "small",
    "smallPassiveStats": [
      "2% Chance to Block Spell Damage"
    ],
    "enchantText": "Added Small Passive Skills grant: 2% Chance to Block Spell Damage",
    "notablePool": [
      "Prodigious Defence",
      "Strike Leader",
      "Powerful Ward",
      "Enduring Ward",
      "Stoic Focus",
      "Mage Bane",
      "Second Skin",
      "Flexible Sentry",
      "Vicious Guard",
      "Mystical Ward",
      "Rote Reinforcement",
      "Mage Hunter",
      "Riot Queller",
      "One with the Shield",
      "Fiery Aegis"
    ]
  },
  {
    "id": "affliction_fire_resistance",
    "tag": "affliction_fire_resistance",
    "name": "Fire Resistance",
    "type": "small",
    "smallPassiveStats": [
      "+15% to Fire Resistance"
    ],
    "enchantText": "Added Small Passive Skills grant: +15% to Fire Resistance",
    "notablePool": [
      "Prismatic Heart",
      "Prismatic Carapace",
      "Dragon Hunter",
      "Prismatic Dance",
      "Flexible Sentry",
      "Molten One's Mark",
      "Fire Attunement",
      "Pure Might",
      "Blacksmith",
      "Non-Flammable"
    ]
  },
  {
    "id": "affliction_cold_resistance",
    "tag": "affliction_cold_resistance",
    "name": "Cold Resistance",
    "type": "small",
    "smallPassiveStats": [
      "+15% to Cold Resistance"
    ],
    "enchantText": "Added Small Passive Skills grant: +15% to Cold Resistance",
    "notablePool": [
      "Prismatic Heart",
      "Prismatic Carapace",
      "Prismatic Dance",
      "Flexible Sentry",
      "Winter Prowler",
      "Hibernator",
      "Pure Guile",
      "Alchemist",
      "Antifreeze"
    ]
  },
  {
    "id": "affliction_lightning_resistance",
    "tag": "affliction_lightning_resistance",
    "name": "Lightning Resistance",
    "type": "small",
    "smallPassiveStats": [
      "+15% to Lightning Resistance"
    ],
    "enchantText": "Added Small Passive Skills grant: +15% to Lightning Resistance",
    "notablePool": [
      "Prismatic Heart",
      "Prismatic Carapace",
      "Prismatic Dance",
      "Flexible Sentry",
      "Wizardry",
      "Capacitor",
      "Pure Aptitude",
      "Sage",
      "Insulated"
    ]
  },
  {
    "id": "affliction_chaos_resistance",
    "tag": "affliction_chaos_resistance",
    "name": "Chaos Resistance",
    "type": "small",
    "smallPassiveStats": [
      "+12% to Chaos Resistance"
    ],
    "enchantText": "Added Small Passive Skills grant: +12% to Chaos Resistance",
    "notablePool": [
      "Exposure Therapy",
      "Born of Chaos",
      "Antivenom",
      "Rot-Resistant",
      "Blessed",
      "Student of Decay"
    ]
  },
  {
    "id": "affliction_chance_to_dodge_attacks",
    "tag": "affliction_chance_to_dodge_attacks",
    "name": "Chance to Suppress Spell Damage",
    "type": "small",
    "smallPassiveStats": [
      "+4% chance to Suppress Spell Damage"
    ],
    "enchantText": "Added Small Passive Skills grant: +4% chance to Suppress Spell Damage",
    "notablePool": [
      "Hit and Run",
      "Untouchable",
      "Aerialist",
      "Elegant Form",
      "Darting Movements"
    ]
  },
  {
    "id": "affliction_strength",
    "tag": "affliction_strength",
    "name": "Strength",
    "type": "small",
    "smallPassiveStats": [
      "+10 to Strength"
    ],
    "enchantText": "Added Small Passive Skills grant: +10 to Strength",
    "notablePool": []
  },
  {
    "id": "affliction_dexterity",
    "tag": "affliction_dexterity",
    "name": "Dexterity",
    "type": "small",
    "smallPassiveStats": [
      "+10 to Dexterity"
    ],
    "enchantText": "Added Small Passive Skills grant: +10 to Dexterity",
    "notablePool": []
  },
  {
    "id": "affliction_intelligence",
    "tag": "affliction_intelligence",
    "name": "Intelligence",
    "type": "small",
    "smallPassiveStats": [
      "+10 to Intelligence"
    ],
    "enchantText": "Added Small Passive Skills grant: +10 to Intelligence",
    "notablePool": []
  },
  {
    "id": "affliction_reservation_efficiency_small",
    "tag": "affliction_reservation_efficiency_small",
    "name": "Reservation Efficiency",
    "type": "small",
    "smallPassiveStats": [
      "6% increased Mana Reservation Efficiency of Skills"
    ],
    "enchantText": "Added Small Passive Skills grant: 6% increased Mana Reservation Efficiency of Skills",
    "notablePool": [
      "Replenishing Presence",
      "Master of Command",
      "Spiteful Presence",
      "Purposeful Harbinger",
      "Destructive Aspect",
      "Electric Presence",
      "Mortifying Aspect",
      "Frantic Aspect",
      "Introspection",
      "Volatile Presence",
      "Righteous Path",
      "Self-Control",
      "Uncompromising",
      "Sublime Form",
      "Pure Might",
      "Pure Guile",
      "Pure Aptitude"
    ]
  },
  {
    "id": "affliction_curse_effect_small",
    "tag": "affliction_curse_effect_small",
    "name": "Curse Effect",
    "type": "small",
    "smallPassiveStats": [
      "2% increased Effect of your Curses"
    ],
    "enchantText": "Added Small Passive Skills grant: 2% increased Effect of your Curses",
    "notablePool": [
      "Evil Eye",
      "Doedre's Spite",
      "Victim Maker",
      "Lord of Drought",
      "Blizzard Caller",
      "Tempt the Storm",
      "Misery Everlasting",
      "Exploit Weakness",
      "Hound's Mark",
      "Doedre's Gluttony",
      "Doedre's Apathy",
      "Master of the Maelstrom"
    ]
  },
  {
    "id": "affliction_fire_damage_over_time_multiplier",
    "tag": "affliction_fire_damage_over_time_multiplier",
    "name": "Fire Damage over Time",
    "type": "medium",
    "smallPassiveStats": [
      "12% increased Burning Damage"
    ],
    "enchantText": "Added Small Passive Skills grant: 12% increased Burning Damage",
    "notablePool": [
      "Eye of the Storm",
      "Master of Fire",
      "Smoking Remains",
      "Cremator",
      "Blowback",
      "Fan the Flames",
      "Cooked Alive",
      "Burning Bright",
      "Wrapped in Flame",
      "Wasting Affliction",
      "Haemorrhage",
      "Flow of Life",
      "Exposure Therapy",
      "Brush with Death",
      "Vile Reinvigoration",
      "Circling Oblivion",
      "Brewed for Potency",
      "Student of Decay"
    ]
  },
  {
    "id": "affliction_chaos_damage_over_time_multiplier",
    "tag": "affliction_chaos_damage_over_time_multiplier",
    "name": "Chaos Damage over Time",
    "type": "medium",
    "smallPassiveStats": [
      "12% increased Chaos Damage over Time"
    ],
    "enchantText": "Added Small Passive Skills grant: 12% increased Chaos Damage over Time",
    "notablePool": [
      "Unwaveringly Evil",
      "Dark Ideation",
      "Wicked Pall",
      "Septic Spells",
      "Low Tolerance",
      "Steady Torment",
      "Eternal Suffering",
      "Eldritch Inspiration",
      "Wasting Affliction",
      "Haemorrhage",
      "Flow of Life",
      "Exposure Therapy",
      "Brush with Death",
      "Vile Reinvigoration",
      "Circling Oblivion",
      "Brewed for Potency",
      "Student of Decay"
    ]
  },
  {
    "id": "affliction_physical_damage_over_time_multiplier",
    "tag": "affliction_physical_damage_over_time_multiplier",
    "name": "Physical Damage over Time",
    "type": "medium",
    "smallPassiveStats": [
      "12% increased Physical Damage over Time"
    ],
    "enchantText": "Added Small Passive Skills grant: 12% increased Physical Damage over Time",
    "notablePool": [
      "Wound Aggravation",
      "Vivid Hues",
      "Rend",
      "Disorienting Wounds",
      "Compound Injury",
      "Blood Artist",
      "Phlebotomist",
      "Steady Torment",
      "Wasting Affliction",
      "Haemorrhage",
      "Flow of Life",
      "Exposure Therapy",
      "Brush with Death",
      "Vile Reinvigoration",
      "Circling Oblivion",
      "Brewed for Potency",
      "Student of Decay"
    ]
  },
  {
    "id": "affliction_cold_damage_over_time_multiplier",
    "tag": "affliction_cold_damage_over_time_multiplier",
    "name": "Cold Damage over Time",
    "type": "medium",
    "smallPassiveStats": [
      "12% increased Cold Damage over Time"
    ],
    "enchantText": "Added Small Passive Skills grant: 12% increased Cold Damage over Time",
    "notablePool": [
      "Cold-Blooded Killer",
      "Wasting Affliction",
      "Haemorrhage",
      "Flow of Life",
      "Exposure Therapy",
      "Brush with Death",
      "Vile Reinvigoration",
      "Circling Oblivion",
      "Brewed for Potency",
      "Chilling Presence",
      "Deep Chill",
      "Blast-Freeze"
    ]
  },
  {
    "id": "affliction_damage_over_time_multiplier",
    "tag": "affliction_damage_over_time_multiplier",
    "name": "Damage over Time",
    "type": "medium",
    "smallPassiveStats": [
      "10% increased Damage over Time"
    ],
    "enchantText": "Added Small Passive Skills grant: 10% increased Damage over Time",
    "notablePool": [
      "Wasting Affliction",
      "Haemorrhage",
      "Flow of Life",
      "Exposure Therapy",
      "Brush with Death",
      "Vile Reinvigoration",
      "Circling Oblivion",
      "Brewed for Potency",
      "Student of Decay"
    ]
  },
  {
    "id": "affliction_effect_of_non-damaging_ailments",
    "tag": "affliction_effect_of_non-damaging_ailments",
    "name": "Effect of Non-Damaging Ailments",
    "type": "medium",
    "smallPassiveStats": [
      "10% increased Effect of Non-Damaging Ailments"
    ],
    "enchantText": "Added Small Passive Skills grant: 10% increased Effect of Non-Damaging Ailments",
    "notablePool": [
      "Eye of the Storm",
      "Astonishing Affliction",
      "Cold Conduction",
      "Inspired Oppression",
      "Chilling Presence",
      "Deep Chill",
      "Blast-Freeze",
      "Stormrider",
      "Overshock"
    ]
  },
  {
    "id": "affliction_damage_while_you_have_a_herald",
    "tag": "affliction_damage_while_you_have_a_herald",
    "name": "Damage while you have a Herald",
    "type": "medium",
    "smallPassiveStats": [
      "10% increased Damage while affected by a Herald"
    ],
    "enchantText": "Added Small Passive Skills grant: 10% increased Damage while affected by a Herald",
    "notablePool": [
      "Purposeful Harbinger",
      "Heraldry",
      "Endbringer",
      "Empowered Envoy",
      "Dark Messenger",
      "Agent of Destruction",
      "Lasting Impression",
      "Self-Fulfilling Prophecy"
    ]
  },
  {
    "id": "affliction_minion_damage_while_you_have_a_herald",
    "tag": "affliction_minion_damage_while_you_have_a_herald",
    "name": "Minion Damage while you have a Herald",
    "type": "medium",
    "smallPassiveStats": [
      "Minions deal 10% increased Damage while you are affected by a Herald"
    ],
    "enchantText": "Added Small Passive Skills grant: Minions deal 10% increased Damage while you are affected by a Herald",
    "notablePool": [
      "Purposeful Harbinger",
      "Heraldry",
      "Endbringer",
      "Cult-Leader",
      "Lasting Impression",
      "Invigorating Portents",
      "Pure Agony",
      "Disciples"
    ]
  },
  {
    "id": "affliction_warcry_buff_effect",
    "tag": "affliction_warcry_buff_effect",
    "name": "Exerted Attack Damage",
    "type": "medium",
    "smallPassiveStats": [
      "Exerted Attacks deal 20% increased Damage"
    ],
    "enchantText": "Added Small Passive Skills grant: Exerted Attacks deal 20% increased Damage",
    "notablePool": [
      "Mob Mentality",
      "Cry Wolf",
      "Haunting Shout",
      "Lead By Example",
      "Provocateur",
      "Warning Call",
      "Rattling Bellow",
      "Holy Word"
    ]
  },
  {
    "id": "affliction_critical_chance",
    "tag": "affliction_critical_chance",
    "name": "Critical Chance",
    "type": "medium",
    "smallPassiveStats": [
      "15% increased Critical Strike Chance"
    ],
    "enchantText": "Added Small Passive Skills grant: 15% increased Critical Strike Chance",
    "notablePool": [
      "Precise Retaliation",
      "Skullbreaker",
      "Pressure Points",
      "Overwhelming Malice",
      "Magnifier",
      "Savage Response",
      "Eye of the Storm",
      "Basics of Pain",
      "Quick Getaway",
      "Provocateur",
      "Haemorrhage"
    ]
  },
  {
    "id": "affliction_minion_life",
    "tag": "affliction_minion_life",
    "name": "Minion Life",
    "type": "medium",
    "smallPassiveStats": [
      "Minions have 12% increased maximum Life"
    ],
    "enchantText": "Added Small Passive Skills grant: Minions have 12% increased maximum Life",
    "notablePool": [
      "Renewal",
      "Hulking Corpses",
      "Dread March",
      "Blessed Rebirth",
      "Life from Death",
      "Feasting Fiends",
      "Bodyguards"
    ]
  },
  {
    "id": "affliction_area_damage",
    "tag": "affliction_area_damage",
    "name": "Area Damage",
    "type": "medium",
    "smallPassiveStats": [
      "10% increased Area Damage"
    ],
    "enchantText": "Added Small Passive Skills grant: 10% increased Area Damage",
    "notablePool": [
      "Magnifier",
      "Assert Dominance",
      "Vast Power",
      "Powerful Assault",
      "Titanic Swings",
      "Towering Threat",
      "Expansive Might"
    ]
  },
  {
    "id": "affliction_projectile_damage",
    "tag": "affliction_projectile_damage",
    "name": "Projectile Damage",
    "type": "medium",
    "smallPassiveStats": [
      "10% increased Projectile Damage"
    ],
    "enchantText": "Added Small Passive Skills grant: 10% increased Projectile Damage",
    "notablePool": [
      "Follow-Through",
      "Streamlined",
      "Shrieking Bolts",
      "Eye to Eye",
      "Repeater",
      "Aerodynamics"
    ]
  },
  {
    "id": "affliction_trap_and_mine_damage",
    "tag": "affliction_trap_and_mine_damage",
    "name": "Trap and Mine Damage",
    "type": "medium",
    "smallPassiveStats": [
      "12% increased Trap Damage",
      "12% increased Mine Damage"
    ],
    "enchantText": "Added Small Passive Skills grant: 12% increased Trap Damage",
    "notablePool": [
      "Set and Forget",
      "Expert Sabotage",
      "Guerilla Tactics",
      "Expendability",
      "Arcane Pyrotechnics",
      "Surprise Sabotage",
      "Careful Handling"
    ]
  },
  {
    "id": "affliction_totem_damage",
    "tag": "affliction_totem_damage",
    "name": "Totem Damage",
    "type": "medium",
    "smallPassiveStats": [
      "12% increased Totem Damage"
    ],
    "enchantText": "Added Small Passive Skills grant: 12% increased Totem Damage",
    "notablePool": [
      "Ancestral Echo",
      "Ancestral Reach",
      "Ancestral Might",
      "Ancestral Preservation",
      "Snaring Spirits",
      "Sleepless Sentries",
      "Ancestral Guidance",
      "Ancestral Inspiration"
    ]
  },
  {
    "id": "affliction_brand_damage",
    "tag": "affliction_brand_damage",
    "name": "Brand Damage",
    "type": "medium",
    "smallPassiveStats": [
      "12% increased Brand Damage"
    ],
    "enchantText": "Added Small Passive Skills grant: 12% increased Brand Damage",
    "notablePool": [
      "Chip Away",
      "Seeker Runes",
      "Remarkable",
      "Brand Loyalty",
      "Holy Conquest",
      "Grand Design"
    ]
  },
  {
    "id": "affliction_channelling_skill_damage",
    "tag": "affliction_channelling_skill_damage",
    "name": "Channelling Skill Damage",
    "type": "medium",
    "smallPassiveStats": [
      "Channelling Skills deal 12% increased Damage"
    ],
    "enchantText": "Added Small Passive Skills grant: Channelling Skills deal 12% increased Damage",
    "notablePool": [
      "Vital Focus",
      "Unrestrained Focus",
      "Unwavering Focus",
      "Enduring Focus",
      "Precise Focus",
      "Stoic Focus",
      "Hex Breaker"
    ]
  },
  {
    "id": "affliction_flask_duration",
    "tag": "affliction_flask_duration",
    "name": "Flask Duration",
    "type": "medium",
    "smallPassiveStats": [
      "6% increased Flask Effect Duration"
    ],
    "enchantText": "Added Small Passive Skills grant: 6% increased Flask Effect Duration",
    "notablePool": [
      "Distilled Perfection",
      "Spiked Concoction",
      "Fasting",
      "Mender's Wellspring",
      "Special Reserve",
      "Numbing Elixir",
      "Brewed for Potency",
      "Peak Vigour",
      "Liquid Inspiration"
    ]
  },
  {
    "id": "affliction_life_and_mana_recovery_from_flasks",
    "tag": "affliction_life_and_mana_recovery_from_flasks",
    "name": "Life and Mana recovery from Flasks",
    "type": "medium",
    "smallPassiveStats": [
      "10% increased Life Recovery from Flasks",
      "10% increased Mana Recovery from Flasks"
    ],
    "enchantText": "Added Small Passive Skills grant: 10% increased Life Recovery from Flasks",
    "notablePool": [
      "Distilled Perfection",
      "Spiked Concoction",
      "Fasting",
      "Mender's Wellspring",
      "Special Reserve",
      "Numbing Elixir"
    ]
  },
  {
    "id": "affliction_axe_and_sword_damage",
    "tag": "affliction_axe_and_sword_damage",
    "name": "Axe and Sword Damage",
    "type": "large",
    "smallPassiveStats": [
      "Axe Attacks deal 12% increased Damage with Hits and Ailments",
      "Sword Attacks deal 12% increased Damage with Hits and Ailments"
    ],
    "enchantText": "Added Small Passive Skills grant: Axe Attacks deal 12% increased Damage with Hits and Ailments",
    "notablePool": [
      "Vicious Skewering",
      "Bloodscent",
      "Run Through",
      "Wound Aggravation",
      "Smite the Weak",
      "Heavy Hitter",
      "Martial Prowess",
      "Calamitous",
      "Devastator",
      "Fuel the Fight",
      "Drive the Destruction",
      "Feed the Fury",
      "Aggressive Defence"
    ]
  },
  {
    "id": "affliction_mace_and_staff_damage",
    "tag": "affliction_mace_and_staff_damage",
    "name": "Mace and Staff Damage",
    "type": "large",
    "smallPassiveStats": [
      "Staff Attacks deal 12% increased Damage with Hits and Ailments",
      "Mace or Sceptre Attacks deal 12% increased Damage with Hits and Ailments"
    ],
    "enchantText": "Added Small Passive Skills grant: Staff Attacks deal 12% increased Damage with Hits and Ailments",
    "notablePool": [
      "Vicious Skewering",
      "Overlord",
      "Expansive Might",
      "Weight Advantage",
      "Smite the Weak",
      "Heavy Hitter",
      "Martial Prowess",
      "Calamitous",
      "Devastator",
      "Fuel the Fight",
      "Drive the Destruction",
      "Feed the Fury",
      "Aggressive Defence"
    ]
  },
  {
    "id": "affliction_dagger_and_claw_damage",
    "tag": "affliction_dagger_and_claw_damage",
    "name": "Dagger and Claw Damage",
    "type": "large",
    "smallPassiveStats": [
      "Claw Attacks deal 12% increased Damage with Hits and Ailments",
      "Dagger Attacks deal 12% increased Damage with Hits and Ailments"
    ],
    "enchantText": "Added Small Passive Skills grant: Claw Attacks deal 12% increased Damage with Hits and Ailments",
    "notablePool": [
      "Vicious Skewering",
      "Wind-up",
      "Fan of Blades",
      "Disease Vector",
      "Smite the Weak",
      "Heavy Hitter",
      "Martial Prowess",
      "Calamitous",
      "Devastator",
      "Fuel the Fight",
      "Drive the Destruction",
      "Feed the Fury",
      "Aggressive Defence"
    ]
  },
  {
    "id": "affliction_bow_damage",
    "tag": "affliction_bow_damage",
    "name": "Bow Damage",
    "type": "large",
    "smallPassiveStats": [
      "12% increased Damage with Bows",
      "12% increased Damage Over Time with Bow Skills"
    ],
    "enchantText": "Added Small Passive Skills grant: 12% increased Damage with Bows",
    "notablePool": [
      "Vicious Skewering",
      "Arcing Shot",
      "Tempered Arrowheads",
      "Broadside",
      "Smite the Weak",
      "Heavy Hitter",
      "Martial Prowess",
      "Calamitous",
      "Devastator",
      "Fuel the Fight",
      "Drive the Destruction",
      "Feed the Fury"
    ]
  },
  {
    "id": "affliction_wand_damage",
    "tag": "affliction_wand_damage",
    "name": "Wand Damage",
    "type": "large",
    "smallPassiveStats": [
      "Wand Attacks deal 12% increased Damage with Hits and Ailments"
    ],
    "enchantText": "Added Small Passive Skills grant: Wand Attacks deal 12% increased Damage with Hits and Ailments",
    "notablePool": [
      "Vicious Skewering",
      "Explosive Force",
      "Opportunistic Fusilade",
      "Storm's Hand",
      "Smite the Weak",
      "Heavy Hitter",
      "Martial Prowess",
      "Calamitous",
      "Devastator",
      "Fuel the Fight",
      "Drive the Destruction",
      "Feed the Fury"
    ]
  },
  {
    "id": "affliction_damage_with_two_handed_melee_weapons",
    "tag": "affliction_damage_with_two_handed_melee_weapons",
    "name": "Damage with Two Handed Weapons",
    "type": "large",
    "smallPassiveStats": [
      "12% increased Damage with Two Handed Weapons"
    ],
    "enchantText": "Added Small Passive Skills grant: 12% increased Damage with Two Handed Weapons",
    "notablePool": [
      "Vicious Skewering",
      "Titanic Swings",
      "Battlefield Dominator",
      "Martial Mastery",
      "Surefooted Striker",
      "Graceful Execution",
      "Brutal Infamy",
      "Fearsome Warrior",
      "Smite the Weak",
      "Heavy Hitter",
      "Martial Prowess",
      "Calamitous",
      "Devastator",
      "Fuel the Fight",
      "Drive the Destruction",
      "Feed the Fury"
    ]
  },
  {
    "id": "affliction_attack_damage_while_dual_wielding_",
    "tag": "affliction_attack_damage_while_dual_wielding_",
    "name": "Attack Damage while Dual Wielding",
    "type": "large",
    "smallPassiveStats": [
      "12% increased Attack Damage while Dual Wielding"
    ],
    "enchantText": "Added Small Passive Skills grant: 12% increased Attack Damage while Dual Wielding",
    "notablePool": [
      "Vicious Skewering",
      "Combat Rhythm",
      "Hit and Run",
      "Insatiable Killer",
      "Mage Bane",
      "Martial Momentum",
      "Deadly Repartee",
      "Quick and Deadly",
      "Smite the Weak",
      "Heavy Hitter",
      "Martial Prowess",
      "Calamitous",
      "Devastator",
      "Fuel the Fight",
      "Drive the Destruction",
      "Feed the Fury"
    ]
  },
  {
    "id": "affliction_attack_damage_while_holding_a_shield",
    "tag": "affliction_attack_damage_while_holding_a_shield",
    "name": "Attack Damage while holding a Shield",
    "type": "large",
    "smallPassiveStats": [
      "12% increased Attack Damage while holding a Shield"
    ],
    "enchantText": "Added Small Passive Skills grant: 12% increased Attack Damage while holding a Shield",
    "notablePool": [
      "Prodigious Defence",
      "Advance Guard",
      "Strike Leader",
      "Gladiator's Fortitude",
      "Precise Retaliation",
      "Veteran Defender",
      "Vicious Skewering",
      "Smite the Weak",
      "Heavy Hitter",
      "Martial Prowess",
      "Calamitous",
      "Devastator",
      "Fuel the Fight",
      "Drive the Destruction",
      "Feed the Fury",
      "Riot Queller"
    ]
  },
  {
    "id": "affliction_attack_damage_",
    "tag": "affliction_attack_damage_",
    "name": "Attack Damage",
    "type": "large",
    "smallPassiveStats": [
      "10% increased Attack Damage"
    ],
    "enchantText": "Added Small Passive Skills grant: 10% increased Attack Damage",
    "notablePool": [
      "Vicious Skewering",
      "Smite the Weak",
      "Heavy Hitter",
      "Martial Prowess",
      "Calamitous",
      "Devastator",
      "Fuel the Fight",
      "Drive the Destruction",
      "Feed the Fury"
    ]
  },
  {
    "id": "affliction_spell_damage",
    "tag": "affliction_spell_damage",
    "name": "Spell Damage",
    "type": "large",
    "smallPassiveStats": [
      "10% increased Spell Damage"
    ],
    "enchantText": "Added Small Passive Skills grant: 10% increased Spell Damage",
    "notablePool": [
      "Ancestral Inspiration",
      "Arcane Adept",
      "Seal Mender",
      "Conjured Wall",
      "Arcane Heroism",
      "Practiced Caster",
      "Burden Projection",
      "Thaumophage",
      "Essence Rush",
      "Sap Psyche",
      "Mage Hunter"
    ]
  },
  {
    "id": "affliction_elemental_damage",
    "tag": "affliction_elemental_damage",
    "name": "Elemental Damage",
    "type": "large",
    "smallPassiveStats": [
      "10% increased Elemental Damage"
    ],
    "enchantText": "Added Small Passive Skills grant: 10% increased Elemental Damage",
    "notablePool": [
      "Sadist",
      "Corrosive Elements",
      "Doryani's Lesson",
      "Disorienting Display",
      "Prismatic Heart",
      "Widespread Destruction",
      "Inspired Oppression"
    ]
  },
  {
    "id": "affliction_physical_damage",
    "tag": "affliction_physical_damage",
    "name": "Physical Damage",
    "type": "large",
    "smallPassiveStats": [
      "12% increased Physical Damage"
    ],
    "enchantText": "Added Small Passive Skills grant: 12% increased Physical Damage",
    "notablePool": [
      "Iron Breaker",
      "Master the Fundamentals",
      "Force Multiplier",
      "Furious Assault",
      "Grim Oath",
      "Battle-Hardened"
    ]
  },
  {
    "id": "affliction_fire_damage",
    "tag": "affliction_fire_damage",
    "name": "Fire Damage",
    "type": "large",
    "smallPassiveStats": [
      "12% increased Fire Damage"
    ],
    "enchantText": "Added Small Passive Skills grant: 12% increased Fire Damage",
    "notablePool": [
      "Sadist",
      "Corrosive Elements",
      "Doryani's Lesson",
      "Disorienting Display",
      "Prismatic Heart",
      "Widespread Destruction",
      "Master of Fire",
      "Smoking Remains",
      "Cremator",
      "Burning Bright"
    ]
  },
  {
    "id": "affliction_lightning_damage",
    "tag": "affliction_lightning_damage",
    "name": "Lightning Damage",
    "type": "large",
    "smallPassiveStats": [
      "12% increased Lightning Damage"
    ],
    "enchantText": "Added Small Passive Skills grant: 12% increased Lightning Damage",
    "notablePool": [
      "Sadist",
      "Corrosive Elements",
      "Doryani's Lesson",
      "Disorienting Display",
      "Prismatic Heart",
      "Widespread Destruction",
      "Snowstorm",
      "Storm Drinker",
      "Paralysis",
      "Inspired Oppression",
      "Thunderstruck",
      "Stormrider",
      "Overshock",
      "Scintillating Idea"
    ]
  },
  {
    "id": "affliction_cold_damage",
    "tag": "affliction_cold_damage",
    "name": "Cold Damage",
    "type": "large",
    "smallPassiveStats": [
      "12% increased Cold Damage"
    ],
    "enchantText": "Added Small Passive Skills grant: 12% increased Cold Damage",
    "notablePool": [
      "Sadist",
      "Corrosive Elements",
      "Doryani's Lesson",
      "Disorienting Display",
      "Prismatic Heart",
      "Widespread Destruction",
      "Snowstorm",
      "Blanketed Snow",
      "Cold to the Core",
      "Cold-Blooded Killer",
      "Inspired Oppression",
      "Deep Chill",
      "Blast-Freeze",
      "Stormrider"
    ]
  },
  {
    "id": "affliction_chaos_damage",
    "tag": "affliction_chaos_damage",
    "name": "Chaos Damage",
    "type": "large",
    "smallPassiveStats": [
      "12% increased Chaos Damage"
    ],
    "enchantText": "Added Small Passive Skills grant: 12% increased Chaos Damage",
    "notablePool": [
      "Grim Oath",
      "Overwhelming Malice",
      "Touch of Cruelty",
      "Unwaveringly Evil",
      "Unspeakable Gifts",
      "Dark Ideation",
      "Unholy Grace",
      "Wicked Pall"
    ]
  },
  {
    "id": "affliction_minion_damage",
    "tag": "affliction_minion_damage",
    "name": "Minion Damage",
    "type": "large",
    "smallPassiveStats": [
      "Minions deal 10% increased Damage"
    ],
    "enchantText": "Added Small Passive Skills grant: Minions deal 10% increased Damage",
    "notablePool": [
      "Renewal",
      "Raze and Pillage",
      "Rotten Claws",
      "Call to the Slaughter",
      "Skeletal Atrophy",
      "Vicious Bite",
      "Primordial Bond",
      "Feasting Fiends"
    ]
  }
];

export const CLUSTER_NOTABLES: Record<string, ClusterNotableData> = {
  "Prodigious Defence": {
    "name": "Prodigious Defence",
    "stats": [
      "4% Chance to Block Spell Damage",
      "30% increased Attack Damage while holding a Shield",
      "+4% Chance to Block Attack Damage"
    ],
    "weights": {
      "affliction_attack_damage_while_holding_a_shield": 600,
      "affliction_chance_to_block": 750
    },
    "level": 1
  },
  "Advance Guard": {
    "name": "Advance Guard",
    "stats": [
      "Attack Skills deal 30% increased Damage while holding a Shield",
      "Ignore all Movement Penalties from Armour",
      "5% increased Movement Speed while holding a Shield"
    ],
    "weights": {
      "affliction_attack_damage_while_holding_a_shield": 300
    },
    "level": 50
  },
  "Gladiatorial Combat": {
    "name": "Gladiatorial Combat",
    "stats": [
      "2% increased Attack Damage per 75 Armour or Evasion Rating on Shield",
      "+1% to Critical Strike Multiplier per 10 Maximum Energy Shield on Shield"
    ],
    "weights": {},
    "level": 68
  },
  "Strike Leader": {
    "name": "Strike Leader",
    "stats": [
      "Attack Skills deal 30% increased Damage while holding a Shield",
      "+4% Chance to Block Attack Damage",
      "+0.2 metres to Melee Strike Range while Holding a Shield"
    ],
    "weights": {
      "affliction_attack_damage_while_holding_a_shield": 600,
      "affliction_chance_to_block": 750
    },
    "level": 1
  },
  "Powerful Ward": {
    "name": "Powerful Ward",
    "stats": [
      "20% chance to gain a Power Charge when you Block",
      "+10% Chance to Block Spell Damage while at Maximum Power Charges"
    ],
    "weights": {
      "affliction_chance_to_block": 141
    },
    "level": 68
  },
  "Enduring Ward": {
    "name": "Enduring Ward",
    "stats": [
      "20% chance to gain an Endurance Charge when you Block",
      "+10% Chance to Block Attack Damage while at Maximum Endurance Charges"
    ],
    "weights": {
      "affliction_chance_to_block": 141
    },
    "level": 68
  },
  "Gladiator's Fortitude": {
    "name": "Gladiator's Fortitude",
    "stats": [
      "Attack Skills deal 25% increased Damage while holding a Shield",
      "5% increased maximum Life"
    ],
    "weights": {
      "affliction_attack_damage_while_holding_a_shield": 113,
      "affliction_maximum_life": 146
    },
    "level": 68
  },
  "Precise Retaliation": {
    "name": "Precise Retaliation",
    "stats": [
      "60% increased Critical Strike Chance if you haven't Blocked Recently",
      "+30% to Critical Strike Multiplier if you have Blocked Recently"
    ],
    "weights": {
      "affliction_attack_damage_while_holding_a_shield": 300,
      "affliction_critical_chance": 457
    },
    "level": 50
  },
  "Veteran Defender": {
    "name": "Veteran Defender",
    "stats": [
      "+15 to all Attributes",
      "+15% Elemental Resistances while holding a Shield",
      "60% increased Defences from Equipped Shield"
    ],
    "weights": {
      "affliction_attack_damage_while_holding_a_shield": 600
    },
    "level": 1
  },
  "Iron Breaker": {
    "name": "Iron Breaker",
    "stats": [
      "Hits have 50% chance to ignore Enemy Physical Damage Reduction",
      "30% increased Physical Damage"
    ],
    "weights": {
      "affliction_physical_damage": 464
    },
    "level": 1
  },
  "Deep Cuts": {
    "name": "Deep Cuts",
    "stats": [
      "15% chance to Impale Enemies on Hit with Attacks",
      "Impales you inflict last 1 additional Hit"
    ],
    "weights": {},
    "level": 75
  },
  "Master the Fundamentals": {
    "name": "Master the Fundamentals",
    "stats": [
      "+10% to all Elemental Resistances",
      "35% reduced Elemental Damage",
      "35% increased Physical Damage"
    ],
    "weights": {
      "affliction_physical_damage": 232
    },
    "level": 50
  },
  "Force Multiplier": {
    "name": "Force Multiplier",
    "stats": [
      "5% chance to deal Double Damage",
      "25% increased Physical Damage"
    ],
    "weights": {
      "affliction_physical_damage": 232
    },
    "level": 50
  },
  "Furious Assault": {
    "name": "Furious Assault",
    "stats": [
      "8% increased Attack and Cast Speed",
      "25% increased Physical Damage"
    ],
    "weights": {
      "affliction_physical_damage": 464
    },
    "level": 1
  },
  "Vicious Skewering": {
    "name": "Vicious Skewering",
    "stats": [
      "Attacks have 10% chance to cause Bleeding",
      "10% chance to Impale Enemies on Hit with Attacks",
      "15% increased Effect of Impales inflicted by Hits that also inflict Bleeding"
    ],
    "weights": {
      "affliction_attack_damage_": 81,
      "affliction_axe_and_sword_damage": 141,
      "affliction_mace_and_staff_damage": 141,
      "affliction_dagger_and_claw_damage": 151,
      "affliction_bow_damage": 145,
      "affliction_wand_damage": 151,
      "affliction_damage_with_two_handed_melee_weapons": 113,
      "affliction_attack_damage_while_dual_wielding_": 117,
      "affliction_attack_damage_while_holding_a_shield": 113
    },
    "level": 68
  },
  "Grim Oath": {
    "name": "Grim Oath",
    "stats": [
      "Gain 10% of Physical Damage as Extra Chaos Damage"
    ],
    "weights": {
      "affliction_physical_damage": 87,
      "affliction_chaos_damage": 97
    },
    "level": 68
  },
  "Battle-Hardened": {
    "name": "Battle-Hardened",
    "stats": [
      "30% increased Evasion Rating and Armour",
      "35% increased Physical Damage"
    ],
    "weights": {
      "affliction_physical_damage": 232,
      "affliction_armour": 696,
      "affliction_evasion": 658
    },
    "level": 50
  },
  "Replenishing Presence": {
    "name": "Replenishing Presence",
    "stats": [
      "Non-Curse Aura Skills have 20% increased Duration",
      "You and nearby Allies Regenerate 1.00% of Life per second"
    ],
    "weights": {
      "old_do_not_use_affliction_aura_effect": 480,
      "affliction_reservation_efficiency_small": 480
    },
    "level": 50
  },
  "Master of Command": {
    "name": "Master of Command",
    "stats": [
      "Banner Skills have 10% increased Aura Effect",
      "Banner Skills have 20% increased Area of Effect"
    ],
    "weights": {
      "old_do_not_use_affliction_aura_effect": 180,
      "affliction_reservation_efficiency_small": 180
    },
    "level": 68
  },
  "Spiteful Presence": {
    "name": "Spiteful Presence",
    "stats": [
      "20% increased Effect of Cold Ailments",
      "Hatred has 50% increased Mana Reservation Efficiency"
    ],
    "weights": {
      "old_do_not_use_affliction_aura_effect": 960,
      "affliction_reservation_efficiency_small": 960
    },
    "level": 1
  },
  "Purposeful Harbinger": {
    "name": "Purposeful Harbinger",
    "stats": [
      "Auras from your Skills have 8% increased Effect on you for\neach Herald affecting you, up to a maximum of 40%"
    ],
    "weights": {
      "old_do_not_use_affliction_aura_effect": 60,
      "affliction_reservation_efficiency_small": 60,
      "affliction_damage_while_you_have_a_herald": 118,
      "affliction_minion_damage_while_you_have_a_herald": 158
    },
    "level": 75
  },
  "Destructive Aspect": {
    "name": "Destructive Aspect",
    "stats": [
      "12% increased Area of Effect of Aura Skills",
      "Pride has 50% increased Mana Reservation Efficiency"
    ],
    "weights": {
      "old_do_not_use_affliction_aura_effect": 180,
      "affliction_reservation_efficiency_small": 180
    },
    "level": 68
  },
  "Electric Presence": {
    "name": "Electric Presence",
    "stats": [
      "20% increased Effect of Lightning Ailments",
      "Wrath has 50% increased Mana Reservation Efficiency"
    ],
    "weights": {
      "old_do_not_use_affliction_aura_effect": 180,
      "affliction_reservation_efficiency_small": 180
    },
    "level": 68
  },
  "Mortifying Aspect": {
    "name": "Mortifying Aspect",
    "stats": [
      "+11% to Chaos Resistance",
      "Malevolence has 50% increased Mana Reservation Efficiency"
    ],
    "weights": {
      "old_do_not_use_affliction_aura_effect": 180,
      "affliction_reservation_efficiency_small": 180
    },
    "level": 68
  },
  "Frantic Aspect": {
    "name": "Frantic Aspect",
    "stats": [
      "Debuffs on you expire 10% faster",
      "Haste has 50% increased Mana Reservation Efficiency"
    ],
    "weights": {
      "old_do_not_use_affliction_aura_effect": 180,
      "affliction_reservation_efficiency_small": 180
    },
    "level": 68
  },
  "Introspection": {
    "name": "Introspection",
    "stats": [
      "Auras from your Skills have 10% increased Effect on you"
    ],
    "weights": {
      "old_do_not_use_affliction_aura_effect": 180,
      "affliction_reservation_efficiency_small": 180
    },
    "level": 68
  },
  "Volatile Presence": {
    "name": "Volatile Presence",
    "stats": [
      "Anger has 50% increased Mana Reservation Efficiency",
      "20% increased Duration of Fire Ailments"
    ],
    "weights": {
      "old_do_not_use_affliction_aura_effect": 480,
      "affliction_reservation_efficiency_small": 480
    },
    "level": 50
  },
  "Righteous Path": {
    "name": "Righteous Path",
    "stats": [
      "10% increased Effect of Consecrated Ground you create",
      "Zealotry has 50% increased Mana Reservation Efficiency"
    ],
    "weights": {
      "old_do_not_use_affliction_aura_effect": 960,
      "affliction_reservation_efficiency_small": 960
    },
    "level": 1
  },
  "Skullbreaker": {
    "name": "Skullbreaker",
    "stats": [
      "8% reduced Enemy Stun Threshold",
      "+15% to Critical Strike Multiplier"
    ],
    "weights": {
      "affliction_critical_chance": 171
    },
    "level": 68
  },
  "Pressure Points": {
    "name": "Pressure Points",
    "stats": [
      "Your Critical Strikes have a 5% chance to deal Double Damage",
      "30% increased Critical Strike Chance"
    ],
    "weights": {
      "affliction_critical_chance": 457
    },
    "level": 50
  },
  "Overwhelming Malice": {
    "name": "Overwhelming Malice",
    "stats": [
      "10% chance to gain Unholy Might for 4 seconds on Critical Strike"
    ],
    "weights": {
      "affliction_critical_chance": 171,
      "affliction_chaos_damage": 97
    },
    "level": 68
  },
  "Magnifier": {
    "name": "Magnifier",
    "stats": [
      "10% increased Area of Effect",
      "+10% to Critical Strike Multiplier"
    ],
    "weights": {
      "affliction_critical_chance": 914,
      "affliction_area_damage": 1959
    },
    "level": 1
  },
  "Savage Response": {
    "name": "Savage Response",
    "stats": [
      "+30% to Critical Strike Multiplier if you've taken a Savage Hit Recently",
      "30% increased Critical Strike Chance"
    ],
    "weights": {
      "affliction_critical_chance": 457
    },
    "level": 50
  },
  "Eye of the Storm": {
    "name": "Eye of the Storm",
    "stats": [
      "+10% to Damage over Time Multiplier for Ignite from Critical Strikes",
      "20% increased Effect of non-Damaging Ailments you inflict with Critical Strikes",
      "40% increased Critical Strike Chance"
    ],
    "weights": {
      "affliction_critical_chance": 457,
      "affliction_fire_damage_over_time_multiplier": 366,
      "affliction_effect_of_non-damaging_ailments": 814
    },
    "level": 50
  },
  "Basics of Pain": {
    "name": "Basics of Pain",
    "stats": [
      "20% increased Damage",
      "30% increased Critical Strike Chance"
    ],
    "weights": {
      "affliction_critical_chance": 914
    },
    "level": 1
  },
  "Quick Getaway": {
    "name": "Quick Getaway",
    "stats": [
      "5% increased Attack and Cast Speed",
      "5% increased Movement Speed if you've dealt a Critical Strike Recently",
      "25% increased Critical Strike Chance"
    ],
    "weights": {
      "affliction_critical_chance": 914
    },
    "level": 1
  },
  "Assert Dominance": {
    "name": "Assert Dominance",
    "stats": [
      "25% increased Area of Effect if you've Killed at least 5 Enemies Recently"
    ],
    "weights": {
      "affliction_area_damage": 367
    },
    "level": 68
  },
  "Vast Power": {
    "name": "Vast Power",
    "stats": [
      "20% increased Area Damage",
      "3% increased Area of Effect per Power Charge, up to a maximum of 50%"
    ],
    "weights": {
      "affliction_area_damage": 980
    },
    "level": 50
  },
  "Powerful Assault": {
    "name": "Powerful Assault",
    "stats": [
      "20% increased Area Damage",
      "Area Skills have 10% chance to Knock Enemies Back on Hit"
    ],
    "weights": {
      "affliction_area_damage": 980
    },
    "level": 50
  },
  "Intensity": {
    "name": "Intensity",
    "stats": [
      "10% increased Area Damage",
      "Spells which can gain Intensity have +1 to maximum Intensity"
    ],
    "weights": {},
    "level": 68
  },
  "Titanic Swings": {
    "name": "Titanic Swings",
    "stats": [
      "20% increased Area Damage while wielding a Two Handed Melee Weapon",
      "15% increased Area of Effect while wielding a Two Handed Melee Weapon"
    ],
    "weights": {
      "affliction_area_damage": 980,
      "affliction_damage_with_two_handed_melee_weapons": 302
    },
    "level": 50
  },
  "Towering Threat": {
    "name": "Towering Threat",
    "stats": [
      "8% increased maximum Life",
      "10% increased Area of Effect"
    ],
    "weights": {
      "affliction_area_damage": 367,
      "affliction_maximum_life": 146
    },
    "level": 68
  },
  "Ancestral Echo": {
    "name": "Ancestral Echo",
    "stats": [
      "20% increased Totem Placement speed",
      "10% increased Attack and Cast Speed if you've summoned a Totem Recently"
    ],
    "weights": {
      "affliction_totem_damage": 1477
    },
    "level": 1
  },
  "Ancestral Reach": {
    "name": "Ancestral Reach",
    "stats": [
      "25% increased Totem Damage",
      "25% increased Totem Placement speed",
      "25% increased Totem Placement range"
    ],
    "weights": {
      "affliction_totem_damage": 1477
    },
    "level": 1
  },
  "Ancestral Might": {
    "name": "Ancestral Might",
    "stats": [
      "15% increased Totem Life",
      "30% increased Totem Duration",
      "30% increased Totem Damage if you haven't Summoned a Totem in the past 2 seconds"
    ],
    "weights": {
      "affliction_totem_damage": 738
    },
    "level": 50
  },
  "Ancestral Preservation": {
    "name": "Ancestral Preservation",
    "stats": [
      "Totems gain +20% to all Elemental Resistances",
      "Totems have 15% additional Physical Damage Reduction",
      "Totems gain +25% to Chaos Resistance"
    ],
    "weights": {
      "affliction_totem_damage": 277
    },
    "level": 68
  },
  "Snaring Spirits": {
    "name": "Snaring Spirits",
    "stats": [
      "30% increased Totem Damage",
      "Totems Hinder Enemies near them when Summoned"
    ],
    "weights": {
      "affliction_totem_damage": 738
    },
    "level": 50
  },
  "Sleepless Sentries": {
    "name": "Sleepless Sentries",
    "stats": [
      "20% increased Totem Duration",
      "You have Onslaught if you've Summoned a Totem Recently"
    ],
    "weights": {
      "affliction_totem_damage": 277
    },
    "level": 68
  },
  "Ancestral Guidance": {
    "name": "Ancestral Guidance",
    "stats": [
      "Totems' Action Speed cannot be modified to below Base Value",
      "Totems Regenerate 2% of Life per second"
    ],
    "weights": {
      "affliction_totem_damage": 738
    },
    "level": 50
  },
  "Ancestral Inspiration": {
    "name": "Ancestral Inspiration",
    "stats": [
      "Gain Arcane Surge when you Summon a Totem",
      "Spells cast by Totems deal 25% increased Damage"
    ],
    "weights": {
      "affliction_totem_damage": 277,
      "affliction_spell_damage": 281
    },
    "level": 68
  },
  "Vital Focus": {
    "name": "Vital Focus",
    "stats": [
      "Channelling Skills deal 30% increased Damage",
      "Regenerate 1.5% of Life per second while Channelling"
    ],
    "weights": {
      "affliction_channelling_skill_damage": 1811
    },
    "level": 1
  },
  "Unrestrained Focus": {
    "name": "Unrestrained Focus",
    "stats": [
      "Channelling Skills have 8% increased Attack and Cast Speed",
      "Unaffected by Chill while Channelling"
    ],
    "weights": {
      "affliction_channelling_skill_damage": 340
    },
    "level": 68
  },
  "Unwavering Focus": {
    "name": "Unwavering Focus",
    "stats": [
      "50% chance to Avoid being Stunned while Channelling",
      "Channelling Skills deal 30% increased Damage"
    ],
    "weights": {
      "affliction_channelling_skill_damage": 906
    },
    "level": 50
  },
  "Enduring Focus": {
    "name": "Enduring Focus",
    "stats": [
      "Channelling Skills deal 25% increased Damage",
      "25% chance to gain an Endurance Charge each second while Channelling"
    ],
    "weights": {
      "affliction_channelling_skill_damage": 113
    },
    "level": 75
  },
  "Precise Focus": {
    "name": "Precise Focus",
    "stats": [
      "30% increased Critical Strike Chance while Channelling",
      "+20% to Critical Strike Multiplier if you've been Channelling for at least 1 second"
    ],
    "weights": {
      "affliction_channelling_skill_damage": 906
    },
    "level": 50
  },
  "Stoic Focus": {
    "name": "Stoic Focus",
    "stats": [
      "+5% Chance to Block Attack Damage while Channelling",
      "+5% Chance to Block Spell Damage while Channelling",
      "Channelling Skills deal 25% increased Damage"
    ],
    "weights": {
      "affliction_channelling_skill_damage": 1811,
      "affliction_chance_to_block": 750
    },
    "level": 1
  },
  "Hex Breaker": {
    "name": "Hex Breaker",
    "stats": [
      "8% increased Attack and Cast Speed while Channelling",
      "Remove a Curse after Channelling for 2 seconds"
    ],
    "weights": {
      "affliction_channelling_skill_damage": 113
    },
    "level": 75
  },
  "Arcane Adept": {
    "name": "Arcane Adept",
    "stats": [
      "5% increased Attack and Cast Speed while Channelling",
      "Channelling Skills deal 20% increased Damage",
      "Gain Arcane Surge after Channelling for 1 second"
    ],
    "weights": {
      "affliction_spell_damage": 281
    },
    "level": 68
  },
  "Distilled Perfection": {
    "name": "Distilled Perfection",
    "stats": [
      "25% increased Life Recovery from Flasks",
      "25% increased Mana Recovery from Flasks",
      "10% increased Flask Effect Duration"
    ],
    "weights": {
      "affliction_flask_duration": 1079,
      "affliction_life_and_mana_recovery_from_flasks": 1778
    },
    "level": 1
  },
  "Spiked Concoction": {
    "name": "Spiked Concoction",
    "stats": [
      "5% increased Attack and Cast Speed during any Flask Effect",
      "Gain Alchemist's Genius when you use a Flask"
    ],
    "weights": {
      "affliction_flask_duration": 539,
      "affliction_life_and_mana_recovery_from_flasks": 889
    },
    "level": 50
  },
  "Fasting": {
    "name": "Fasting",
    "stats": [
      "20% increased Flask Charges gained",
      "10% increased Movement Speed while under no Flask Effects"
    ],
    "weights": {
      "affliction_flask_duration": 539,
      "affliction_life_and_mana_recovery_from_flasks": 889
    },
    "level": 50
  },
  "Mender's Wellspring": {
    "name": "Mender's Wellspring",
    "stats": [
      "25% increased Life Recovery from Flasks",
      "Life Flasks gain 1 Charge every 3 seconds",
      "Remove Bleeding when you use a Life Flask"
    ],
    "weights": {
      "affliction_flask_duration": 202,
      "affliction_life_and_mana_recovery_from_flasks": 333
    },
    "level": 68
  },
  "Special Reserve": {
    "name": "Special Reserve",
    "stats": [
      "20% increased Damage during any Flask Effect",
      "Regenerate 2% of Life per second during any Flask Effect"
    ],
    "weights": {
      "affliction_flask_duration": 1079,
      "affliction_life_and_mana_recovery_from_flasks": 1778
    },
    "level": 1
  },
  "Numbing Elixir": {
    "name": "Numbing Elixir",
    "stats": [
      "40% reduced Effect of Curses on you during Effect of any Mana Flask",
      "40% reduced Effect of Non-Damaging Ailments on you during Effect of any Life Flask"
    ],
    "weights": {
      "affliction_flask_duration": 202,
      "affliction_life_and_mana_recovery_from_flasks": 333
    },
    "level": 68
  },
  "Mob Mentality": {
    "name": "Mob Mentality",
    "stats": [
      "Exerted Attacks deal 25% increased Damage",
      "Warcries have 5% Chance to grant an Endurance, Frenzy or Power Charge per Power"
    ],
    "weights": {
      "affliction_warcry_buff_effect": 109
    },
    "level": 75
  },
  "Cry Wolf": {
    "name": "Cry Wolf",
    "stats": [
      "Exerted Attacks deal 30% increased Damage",
      "20% increased total Power counted by Warcries"
    ],
    "weights": {
      "affliction_warcry_buff_effect": 327
    },
    "level": 68
  },
  "Haunting Shout": {
    "name": "Haunting Shout",
    "stats": [
      "Enemies Taunted by your Warcries are Intimidated"
    ],
    "weights": {
      "affliction_warcry_buff_effect": 873
    },
    "level": 50
  },
  "Lead By Example": {
    "name": "Lead By Example",
    "stats": [
      "When you Warcry, you and nearby Allies gain Onslaught for 4 seconds",
      "+10 to Strength and Dexterity"
    ],
    "weights": {
      "affliction_warcry_buff_effect": 1745
    },
    "level": 1
  },
  "Provocateur": {
    "name": "Provocateur",
    "stats": [
      "40% increased Critical Strike Chance against Taunted Enemies",
      "+10% to Critical Strike Multiplier against Taunted Enemies"
    ],
    "weights": {
      "affliction_warcry_buff_effect": 873,
      "affliction_critical_chance": 457
    },
    "level": 50
  },
  "Warning Call": {
    "name": "Warning Call",
    "stats": [
      "Gain 25% increased Armour per 5 Power for 8 seconds when you Warcry, up to a maximum of 100%"
    ],
    "weights": {
      "affliction_warcry_buff_effect": 327
    },
    "level": 68
  },
  "Rattling Bellow": {
    "name": "Rattling Bellow",
    "stats": [
      "Exerted Attacks have 8% chance to deal Double Damage",
      "+20 to Strength"
    ],
    "weights": {
      "affliction_warcry_buff_effect": 1745
    },
    "level": 1
  },
  "Bloodscent": {
    "name": "Bloodscent",
    "stats": [
      "Gain 2 Rage on Hit with Axes or Swords"
    ],
    "weights": {
      "affliction_axe_and_sword_damage": 47
    },
    "level": 75
  },
  "Run Through": {
    "name": "Run Through",
    "stats": [
      "Axe or Sword Attacks deal 15% increased Damage with Ailments",
      "10% increased Impale Effect",
      "10% chance to Impale Enemies on Hit with Axes or Swords",
      "15% increased Physical Damage with Axes or Swords"
    ],
    "weights": {
      "affliction_axe_and_sword_damage": 141
    },
    "level": 68
  },
  "Wound Aggravation": {
    "name": "Wound Aggravation",
    "stats": [
      "Axe or Sword Attacks deal 20% increased Damage with Ailments",
      "20% increased Physical Damage with Axes or Swords",
      "+5% to Physical Damage over Time Multiplier while wielding an Axe or Sword"
    ],
    "weights": {
      "affliction_axe_and_sword_damage": 750,
      "affliction_physical_damage_over_time_multiplier": 686
    },
    "level": 1
  },
  "Overlord": {
    "name": "Overlord",
    "stats": [
      "30% increased Damage with Maces, Sceptres or Staves",
      "Melee Hits with Maces, Sceptres or Staves Fortify for 6 seconds"
    ],
    "weights": {
      "affliction_mace_and_staff_damage": 47
    },
    "level": 75
  },
  "Expansive Might": {
    "name": "Expansive Might",
    "stats": [
      "Mace, Sceptre or Staff Attacks deal 20% increased Damage with Hits and Ailments",
      "10% increased Area of Effect per second you've been stationary, up to a maximum of 50%"
    ],
    "weights": {
      "affliction_mace_and_staff_damage": 141,
      "affliction_area_damage": 367
    },
    "level": 68
  },
  "Weight Advantage": {
    "name": "Weight Advantage",
    "stats": [
      "Mace, Sceptre or Staff Attacks deal 30% increased Damage with Hits and Ailments",
      "4% chance to deal Double Damage while wielding a Mace, Sceptre or Staff",
      "+20 to Strength"
    ],
    "weights": {
      "affliction_mace_and_staff_damage": 750
    },
    "level": 1
  },
  "Wind-up": {
    "name": "Wind-up",
    "stats": [
      "+15% to Critical Strike Multiplier with Claws or Daggers",
      "10% chance to gain a Power Charge on Non-Critical Strike with a Claw or Dagger"
    ],
    "weights": {
      "affliction_dagger_and_claw_damage": 151
    },
    "level": 68
  },
  "Fan of Blades": {
    "name": "Fan of Blades",
    "stats": [
      "Attack Skills fire an additional Projectile while wielding a Claw or Dagger",
      "20% increased Projectile Attack Damage with Claws or Daggers"
    ],
    "weights": {
      "affliction_dagger_and_claw_damage": 51
    },
    "level": 75
  },
  "Disease Vector": {
    "name": "Disease Vector",
    "stats": [
      "Enemies Poisoned by you cannot Regenerate Life",
      "+6% to Damage over Time Multiplier for Poison while wielding a Claw or Dagger"
    ],
    "weights": {
      "affliction_dagger_and_claw_damage": 404
    },
    "level": 50
  },
  "Arcing Shot": {
    "name": "Arcing Shot",
    "stats": [
      "Arrows gain Critical Strike Chance as they travel farther, up to 100% increased Critical Strike Chance",
      "Arrows gain Damage as they travel farther, dealing up to 50% increased Damage with Hits to targets"
    ],
    "weights": {
      "affliction_bow_damage": 387
    },
    "level": 50
  },
  "Tempered Arrowheads": {
    "name": "Tempered Arrowheads",
    "stats": [
      "Bow Skills have +6% to Damage over Time Multiplier",
      "Bow Skills have 10% increased Skill Effect Duration",
      "10% increased Duration of Ailments inflicted while wielding a Bow"
    ],
    "weights": {
      "affliction_bow_damage": 387
    },
    "level": 50
  },
  "Broadside": {
    "name": "Broadside",
    "stats": [
      "Bow Skills have 25% increased Area of Effect"
    ],
    "weights": {
      "affliction_bow_damage": 774
    },
    "level": 1
  },
  "Explosive Force": {
    "name": "Explosive Force",
    "stats": [
      "Enemies Killed with Wand Hits have a 10% chance to Explode, dealing a quarter of their Life as Chaos Damage",
      "Gain 10% of Wand Physical Damage as Extra Chaos Damage"
    ],
    "weights": {
      "affliction_wand_damage": 151
    },
    "level": 68
  },
  "Opportunistic Fusilade": {
    "name": "Opportunistic Fusilade",
    "stats": [
      "50% increased Critical Strike Chance with Wands",
      "35% increased Damage with Wands if you've dealt a Critical Strike Recently"
    ],
    "weights": {
      "affliction_wand_damage": 807
    },
    "level": 1
  },
  "Storm's Hand": {
    "name": "Storm's Hand",
    "stats": [
      "Gain 10% of Wand Physical Damage as Extra Lightning Damage",
      "25% of Wand Physical Damage converted to Lightning Damage"
    ],
    "weights": {
      "affliction_wand_damage": 403
    },
    "level": 50
  },
  "Battlefield Dominator": {
    "name": "Battlefield Dominator",
    "stats": [
      "Attacks with Two Handed Weapons deal 25% increased Damage with Hits and Ailments",
      "10% reduced Enemy Stun Threshold",
      "15% increased Area of Effect if you've Stunned an Enemy with a Two Handed Melee Weapon Recently"
    ],
    "weights": {
      "affliction_damage_with_two_handed_melee_weapons": 604
    },
    "level": 1
  },
  "Martial Mastery": {
    "name": "Martial Mastery",
    "stats": [
      "10% increased Attack Speed with Two Handed Melee Weapons",
      "10% increased Attack Speed if you have at least 600 Strength",
      "+20 to Strength"
    ],
    "weights": {
      "affliction_damage_with_two_handed_melee_weapons": 302
    },
    "level": 50
  },
  "Surefooted Striker": {
    "name": "Surefooted Striker",
    "stats": [
      "40% increased Critical Strike Chance with Two Handed Melee Weapons",
      "5% chance to deal Double Damage if you've dealt a Critical Strike with a Two Handed Melee Weapon Recently"
    ],
    "weights": {
      "affliction_damage_with_two_handed_melee_weapons": 302
    },
    "level": 50
  },
  "Graceful Execution": {
    "name": "Graceful Execution",
    "stats": [
      "5% increased Attack Speed with Two Handed Melee Weapons",
      "15% increased Accuracy Rating with Two Handed Melee Weapons",
      "25% increased Critical Strike Chance with Two Handed Melee Weapons",
      "+15 to Dexterity and Intelligence"
    ],
    "weights": {
      "affliction_damage_with_two_handed_melee_weapons": 604
    },
    "level": 1
  },
  "Brutal Infamy": {
    "name": "Brutal Infamy",
    "stats": [
      "Attacks with Two Handed Melee Weapons deal 20% increased Damage with Hits and Ailments",
      "40% increased Damage with Hits and Ailments against Unique Enemies"
    ],
    "weights": {
      "affliction_damage_with_two_handed_melee_weapons": 302
    },
    "level": 50
  },
  "Fearsome Warrior": {
    "name": "Fearsome Warrior",
    "stats": [
      "Attacks with Two Handed Melee Weapons deal 25% increased Damage with Hits and Ailments",
      "8% increased Area of Effect",
      "25% chance to Intimidate nearby Enemies for 4 seconds on Melee Kill"
    ],
    "weights": {
      "affliction_damage_with_two_handed_melee_weapons": 113
    },
    "level": 68
  },
  "Combat Rhythm": {
    "name": "Combat Rhythm",
    "stats": [
      "10% increased Attack Speed if you've Hit with your Main Hand Weapon Recently",
      "10% increased Movement Speed if you've Hit with your Off Hand Weapon Recently"
    ],
    "weights": {
      "affliction_attack_damage_while_dual_wielding_": 312
    },
    "level": 50
  },
  "Hit and Run": {
    "name": "Hit and Run",
    "stats": [
      "Attack Skills deal 25% increased Damage while Dual Wielding",
      "+10% chance to Suppress Spell Damage if you've Hit an Enemy Recently"
    ],
    "weights": {
      "affliction_attack_damage_while_dual_wielding_": 623,
      "affliction_chance_to_dodge_attacks": 1477
    },
    "level": 1
  },
  "Insatiable Killer": {
    "name": "Insatiable Killer",
    "stats": [
      "Attack Skills deal 20% increased Damage while Dual Wielding",
      "5% increased Attack Speed while Dual Wielding",
      "5% chance to gain a Frenzy Charge on Kill while Dual Wielding"
    ],
    "weights": {
      "affliction_attack_damage_while_dual_wielding_": 312
    },
    "level": 50
  },
  "Mage Bane": {
    "name": "Mage Bane",
    "stats": [
      "+6% Chance to Block Spell Damage while Dual Wielding",
      "Attack Skills deal 20% increased Damage while Dual Wielding",
      "20% chance to gain a Power Charge when you Block"
    ],
    "weights": {
      "affliction_attack_damage_while_dual_wielding_": 117,
      "affliction_chance_to_block": 141
    },
    "level": 68
  },
  "Martial Momentum": {
    "name": "Martial Momentum",
    "stats": [
      "8% increased Attack Speed while Dual Wielding",
      "16% increased Accuracy Rating while Dual Wielding",
      "32% increased Damage if you've used a Travel Skill Recently"
    ],
    "weights": {
      "affliction_attack_damage_while_dual_wielding_": 312
    },
    "level": 50
  },
  "Deadly Repartee": {
    "name": "Deadly Repartee",
    "stats": [
      "+6% Chance to Block Attack Damage while Dual Wielding",
      "Attack Skills deal 25% increased Damage while Dual Wielding",
      "30% increased Attack Critical Strike Chance while Dual Wielding"
    ],
    "weights": {
      "affliction_attack_damage_while_dual_wielding_": 623
    },
    "level": 1
  },
  "Quick and Deadly": {
    "name": "Quick and Deadly",
    "stats": [
      "60% increased Main Hand Attack Damage while wielding two different Weapon Types",
      "30% increased Off Hand Attack Speed while wielding two different Weapon Types"
    ],
    "weights": {
      "affliction_attack_damage_while_dual_wielding_": 117
    },
    "level": 68
  },
  "Smite the Weak": {
    "name": "Smite the Weak",
    "stats": [
      "40% increased Attack Damage against Maimed Enemies",
      "Attacks have 10% chance to Maim on Hit"
    ],
    "weights": {
      "affliction_attack_damage_": 432,
      "affliction_axe_and_sword_damage": 750,
      "affliction_mace_and_staff_damage": 750,
      "affliction_dagger_and_claw_damage": 808,
      "affliction_bow_damage": 774,
      "affliction_wand_damage": 807,
      "affliction_damage_with_two_handed_melee_weapons": 604,
      "affliction_attack_damage_while_dual_wielding_": 623,
      "affliction_attack_damage_while_holding_a_shield": 600
    },
    "level": 1
  },
  "Heavy Hitter": {
    "name": "Heavy Hitter",
    "stats": [
      "30% increased Attack Damage",
      "10% reduced Enemy Stun Threshold",
      "20% chance to double Stun Duration",
      "30% increased Damage with Ailments from Attack Skills"
    ],
    "weights": {
      "affliction_attack_damage_": 216,
      "affliction_axe_and_sword_damage": 375,
      "affliction_mace_and_staff_damage": 375,
      "affliction_dagger_and_claw_damage": 404,
      "affliction_bow_damage": 387,
      "affliction_wand_damage": 403,
      "affliction_damage_with_two_handed_melee_weapons": 302,
      "affliction_attack_damage_while_dual_wielding_": 312,
      "affliction_attack_damage_while_holding_a_shield": 300
    },
    "level": 50
  },
  "Martial Prowess": {
    "name": "Martial Prowess",
    "stats": [
      "20% increased Attack Damage",
      "6% increased Attack Speed",
      "20% increased Damage with Ailments from Attack Skills",
      "15% increased Accuracy Rating"
    ],
    "weights": {
      "affliction_attack_damage_": 432,
      "affliction_axe_and_sword_damage": 750,
      "affliction_mace_and_staff_damage": 750,
      "affliction_dagger_and_claw_damage": 808,
      "affliction_bow_damage": 774,
      "affliction_wand_damage": 807,
      "affliction_damage_with_two_handed_melee_weapons": 604,
      "affliction_attack_damage_while_dual_wielding_": 623,
      "affliction_attack_damage_while_holding_a_shield": 600
    },
    "level": 1
  },
  "Calamitous": {
    "name": "Calamitous",
    "stats": [
      "10% chance to Freeze, Shock and Ignite",
      "30% increased Elemental Damage with Attack Skills",
      "15% increased Effect of Non-Damaging Ailments"
    ],
    "weights": {
      "affliction_attack_damage_": 216,
      "affliction_axe_and_sword_damage": 375,
      "affliction_mace_and_staff_damage": 375,
      "affliction_dagger_and_claw_damage": 404,
      "affliction_bow_damage": 387,
      "affliction_wand_damage": 403,
      "affliction_damage_with_two_handed_melee_weapons": 302,
      "affliction_attack_damage_while_dual_wielding_": 312,
      "affliction_attack_damage_while_holding_a_shield": 300
    },
    "level": 50
  },
  "Devastator": {
    "name": "Devastator",
    "stats": [
      "20% increased Attack Damage",
      "20% increased Damage with Ailments from Attack Skills",
      "Enemies Killed with Attack Hits have a 15% chance to Explode, dealing a tenth of their Life as Physical Damage"
    ],
    "weights": {
      "affliction_attack_damage_": 27,
      "affliction_axe_and_sword_damage": 47,
      "affliction_mace_and_staff_damage": 47,
      "affliction_dagger_and_claw_damage": 51,
      "affliction_bow_damage": 48,
      "affliction_wand_damage": 50,
      "affliction_damage_with_two_handed_melee_weapons": 38,
      "affliction_attack_damage_while_dual_wielding_": 39,
      "affliction_attack_damage_while_holding_a_shield": 38
    },
    "level": 75
  },
  "Fuel the Fight": {
    "name": "Fuel the Fight",
    "stats": [
      "8% increased Attack Speed",
      "0.4% of Attack Damage Leeched as Mana",
      "20% increased Damage while Leeching"
    ],
    "weights": {
      "affliction_attack_damage_": 432,
      "affliction_axe_and_sword_damage": 750,
      "affliction_mace_and_staff_damage": 750,
      "affliction_dagger_and_claw_damage": 808,
      "affliction_bow_damage": 774,
      "affliction_wand_damage": 807,
      "affliction_damage_with_two_handed_melee_weapons": 604,
      "affliction_attack_damage_while_dual_wielding_": 623,
      "affliction_attack_damage_while_holding_a_shield": 600
    },
    "level": 1
  },
  "Drive the Destruction": {
    "name": "Drive the Destruction",
    "stats": [
      "0.8% of Attack Damage Leeched as Life",
      "25% increased Attack Damage when on Full Life",
      "Attacks have 10% chance to Maim on Hit"
    ],
    "weights": {
      "affliction_attack_damage_": 432,
      "affliction_axe_and_sword_damage": 750,
      "affliction_mace_and_staff_damage": 750,
      "affliction_dagger_and_claw_damage": 808,
      "affliction_bow_damage": 774,
      "affliction_wand_damage": 807,
      "affliction_damage_with_two_handed_melee_weapons": 604,
      "affliction_attack_damage_while_dual_wielding_": 623,
      "affliction_attack_damage_while_holding_a_shield": 600
    },
    "level": 1
  },
  "Feed the Fury": {
    "name": "Feed the Fury",
    "stats": [
      "0.4% of Attack Damage Leeched as Life",
      "30% increased Damage while Leeching",
      "15% increased Attack Speed while Leeching"
    ],
    "weights": {
      "affliction_attack_damage_": 216,
      "affliction_axe_and_sword_damage": 375,
      "affliction_mace_and_staff_damage": 375,
      "affliction_dagger_and_claw_damage": 404,
      "affliction_bow_damage": 387,
      "affliction_wand_damage": 403,
      "affliction_damage_with_two_handed_melee_weapons": 302,
      "affliction_attack_damage_while_dual_wielding_": 312,
      "affliction_attack_damage_while_holding_a_shield": 300
    },
    "level": 50
  },
  "Seal Mender": {
    "name": "Seal Mender",
    "stats": [
      "Skills Supported by Unleash have 30% increased Seal gain frequency"
    ],
    "weights": {
      "affliction_spell_damage": 94
    },
    "level": 75
  },
  "Conjured Wall": {
    "name": "Conjured Wall",
    "stats": [
      "25% increased Spell Damage",
      "+8% Chance to Block Spell Damage if you've Cast a Spell Recently"
    ],
    "weights": {
      "affliction_spell_damage": 750
    },
    "level": 50
  },
  "Arcane Heroism": {
    "name": "Arcane Heroism",
    "stats": [
      "30% increased Effect of Arcane Surge on you",
      "10% chance to gain Arcane Surge when you Hit a Unique enemy"
    ],
    "weights": {
      "affliction_spell_damage": 281
    },
    "level": 68
  },
  "Practiced Caster": {
    "name": "Practiced Caster",
    "stats": [
      "20% increased Spell Damage",
      "5% increased Cast Speed",
      "35% chance to Ignore Stuns while Casting"
    ],
    "weights": {
      "affliction_spell_damage": 1500
    },
    "level": 1
  },
  "Burden Projection": {
    "name": "Burden Projection",
    "stats": [
      "30% increased Spell Damage",
      "8% chance to Knock Enemies Back on Hit with Spell Damage"
    ],
    "weights": {
      "affliction_spell_damage": 750
    },
    "level": 50
  },
  "Thaumophage": {
    "name": "Thaumophage",
    "stats": [
      "0.6% of Spell Damage Leeched as Energy Shield",
      "25% increased Spell Damage while on Full Energy Shield",
      "10% chance to Hinder Enemies on Hit with Spells"
    ],
    "weights": {
      "affliction_spell_damage": 750
    },
    "level": 50
  },
  "Essence Rush": {
    "name": "Essence Rush",
    "stats": [
      "40% increased Damage while Leeching Energy Shield",
      "0.3% of Spell Damage Leeched as Energy Shield",
      "5% increased Attack and Cast Speed while Leeching Energy Shield"
    ],
    "weights": {
      "affliction_spell_damage": 750
    },
    "level": 50
  },
  "Sap Psyche": {
    "name": "Sap Psyche",
    "stats": [
      "20% increased Spell Damage",
      "30% increased Mana Regeneration Rate",
      "Regenerate 1% of Energy Shield per second if you've Cursed an Enemy Recently"
    ],
    "weights": {
      "affliction_spell_damage": 281
    },
    "level": 68
  },
  "Sadist": {
    "name": "Sadist",
    "stats": [
      "15% increased Elemental Damage if you've Chilled an Enemy Recently",
      "20% increased Elemental Damage if you've Ignited an Enemy Recently",
      "25% increased Elemental Damage if you've Shocked an Enemy Recently"
    ],
    "weights": {
      "affliction_elemental_damage": 281,
      "affliction_lightning_damage": 136,
      "affliction_cold_damage": 95,
      "affliction_fire_damage": 89
    },
    "level": 68
  },
  "Corrosive Elements": {
    "name": "Corrosive Elements",
    "stats": [
      "15% increased Elemental Damage",
      "Cold Skills have a 25% chance to apply Cold Exposure on Hit",
      "Fire Skills have a 25% chance to apply Fire Exposure on Hit",
      "Lightning Skills have a 25% chance to apply Lightning Exposure on Hit"
    ],
    "weights": {
      "affliction_elemental_damage": 94,
      "affliction_lightning_damage": 45,
      "affliction_cold_damage": 32,
      "affliction_fire_damage": 30
    },
    "level": 75
  },
  "Doryani's Lesson": {
    "name": "Doryani's Lesson",
    "stats": [
      "0.2% of Elemental Damage Leeched as Life",
      "25% increased Elemental Damage"
    ],
    "weights": {
      "affliction_elemental_damage": 281,
      "affliction_lightning_damage": 136,
      "affliction_cold_damage": 95,
      "affliction_fire_damage": 89
    },
    "level": 68
  },
  "Disorienting Display": {
    "name": "Disorienting Display",
    "stats": [
      "25% increased Elemental Damage",
      "10% chance to Blind nearby Enemies when you use an Elemental Skill"
    ],
    "weights": {
      "affliction_elemental_damage": 750,
      "affliction_lightning_damage": 364,
      "affliction_cold_damage": 253,
      "affliction_fire_damage": 238
    },
    "level": 50
  },
  "Prismatic Heart": {
    "name": "Prismatic Heart",
    "stats": [
      "+10% to all Elemental Resistances",
      "30% increased Elemental Damage"
    ],
    "weights": {
      "affliction_elemental_damage": 1500,
      "affliction_lightning_damage": 727,
      "affliction_cold_damage": 505,
      "affliction_fire_damage": 475,
      "affliction_lightning_resistance": 1371,
      "affliction_cold_resistance": 1371,
      "affliction_fire_resistance": 1315
    },
    "level": 1
  },
  "Widespread Destruction": {
    "name": "Widespread Destruction",
    "stats": [
      "6% increased Area of Effect",
      "20% increased Elemental Damage"
    ],
    "weights": {
      "affliction_elemental_damage": 1500,
      "affliction_lightning_damage": 727,
      "affliction_cold_damage": 505,
      "affliction_fire_damage": 475
    },
    "level": 1
  },
  "Master of Fire": {
    "name": "Master of Fire",
    "stats": [
      "Nearby Enemies have Fire Exposure"
    ],
    "weights": {
      "affliction_fire_damage": 30,
      "affliction_fire_damage_over_time_multiplier": 46
    },
    "level": 75
  },
  "Smoking Remains": {
    "name": "Smoking Remains",
    "stats": [
      "35% increased Fire Damage",
      "10% chance to create a Smoke Cloud on Kill"
    ],
    "weights": {
      "affliction_fire_damage": 238,
      "affliction_fire_damage_over_time_multiplier": 366
    },
    "level": 50
  },
  "Cremator": {
    "name": "Cremator",
    "stats": [
      "30% increased Fire Damage",
      "Ignited Enemies Killed by your Hits are destroyed"
    ],
    "weights": {
      "affliction_fire_damage": 238,
      "affliction_fire_damage_over_time_multiplier": 366
    },
    "level": 50
  },
  "Snowstorm": {
    "name": "Snowstorm",
    "stats": [
      "Gain 8% of Lightning Damage as Extra Cold Damage against Chilled Enemies"
    ],
    "weights": {
      "affliction_lightning_damage": 364,
      "affliction_cold_damage": 253
    },
    "level": 50
  },
  "Storm Drinker": {
    "name": "Storm Drinker",
    "stats": [
      "Damage Penetrates 8% Lightning Resistance",
      "0.5% of Lightning Damage Leeched as Energy Shield"
    ],
    "weights": {
      "affliction_lightning_damage": 727
    },
    "level": 1
  },
  "Paralysis": {
    "name": "Paralysis",
    "stats": [
      "30% increased Lightning Damage",
      "10% chance to double Stun Duration",
      "Lightning Skills have 10% reduced Enemy Stun Threshold"
    ],
    "weights": {
      "affliction_lightning_damage": 364
    },
    "level": 50
  },
  "Supercharge": {
    "name": "Supercharge",
    "stats": [
      "Lightning Damage with Non-Critical Strikes is Lucky"
    ],
    "weights": {},
    "level": 75
  },
  "Blanketed Snow": {
    "name": "Blanketed Snow",
    "stats": [
      "Damage Penetrates 10% Cold Resistance against Chilled Enemies"
    ],
    "weights": {
      "affliction_cold_damage": 95
    },
    "level": 68
  },
  "Cold to the Core": {
    "name": "Cold to the Core",
    "stats": [
      "1% increased Cold Damage per 25 Dexterity",
      "1% increased Cold Damage per 25 Intelligence",
      "1% increased Cold Damage per 25 Strength"
    ],
    "weights": {
      "affliction_cold_damage": 95
    },
    "level": 68
  },
  "Cold-Blooded Killer": {
    "name": "Cold-Blooded Killer",
    "stats": [
      "+5% to Cold Damage over Time Multiplier",
      "Recover 2% of Life on Killing a Chilled Enemy"
    ],
    "weights": {
      "affliction_cold_damage": 253,
      "affliction_cold_damage_over_time_multiplier": 390
    },
    "level": 50
  },
  "Touch of Cruelty": {
    "name": "Touch of Cruelty",
    "stats": [
      "Chaos Spells have 10% chance to Hinder Enemies on Hit",
      "Enemies Hindered by you take 10% increased Chaos Damage"
    ],
    "weights": {
      "affliction_chaos_damage": 519
    },
    "level": 1
  },
  "Unwaveringly Evil": {
    "name": "Unwaveringly Evil",
    "stats": [
      "30% increased Chaos Damage",
      "Chaos Skills ignore interruption from Stuns"
    ],
    "weights": {
      "affliction_chaos_damage": 519,
      "affliction_chaos_damage_over_time_multiplier": 696
    },
    "level": 1
  },
  "Unspeakable Gifts": {
    "name": "Unspeakable Gifts",
    "stats": [
      "Enemies you Kill have a 10% chance to Explode, dealing a quarter of their maximum Life as Chaos Damage"
    ],
    "weights": {
      "affliction_chaos_damage": 32
    },
    "level": 75
  },
  "Dark Ideation": {
    "name": "Dark Ideation",
    "stats": [
      "2% increased Chaos Damage per 100 maximum Mana, up to a maximum of 80%"
    ],
    "weights": {
      "affliction_chaos_damage": 97,
      "affliction_chaos_damage_over_time_multiplier": 130
    },
    "level": 68
  },
  "Unholy Grace": {
    "name": "Unholy Grace",
    "stats": [
      "30% increased Chaos Damage",
      "10% increased Attack and Cast Speed"
    ],
    "weights": {
      "affliction_chaos_damage": 519
    },
    "level": 1
  },
  "Wicked Pall": {
    "name": "Wicked Pall",
    "stats": [
      "30% increased Chaos Damage",
      "5% increased Skill Effect Duration"
    ],
    "weights": {
      "affliction_chaos_damage": 259,
      "affliction_chaos_damage_over_time_multiplier": 348
    },
    "level": 50
  },
  "Renewal": {
    "name": "Renewal",
    "stats": [
      "Minions Regenerate 1% of Life per second",
      "Minions have 5% chance to deal Double Damage while they are on Full Life"
    ],
    "weights": {
      "affliction_minion_damage": 500,
      "affliction_minion_life": 716
    },
    "level": 50
  },
  "Raze and Pillage": {
    "name": "Raze and Pillage",
    "stats": [
      "Minions have 20% chance to Ignite",
      "Minions deal 20% increased Damage with Hits and Ailments against Ignited Enemies",
      "Minions gain 6% of Physical Damage as Extra Fire Damage"
    ],
    "weights": {
      "affliction_minion_damage": 188
    },
    "level": 68
  },
  "Rotten Claws": {
    "name": "Rotten Claws",
    "stats": [
      "Minions have a 12% chance to Impale on Hit with Attacks"
    ],
    "weights": {
      "affliction_minion_damage": 500
    },
    "level": 50
  },
  "Call to the Slaughter": {
    "name": "Call to the Slaughter",
    "stats": [
      "Minions deal 15% increased Damage",
      "Minions created Recently have 10% increased Attack and Cast Speed",
      "Minions created Recently have 30% increased Movement Speed"
    ],
    "weights": {
      "affliction_minion_damage": 1000
    },
    "level": 1
  },
  "Skeletal Atrophy": {
    "name": "Skeletal Atrophy",
    "stats": [
      "Summoned Skeletons have 10% chance to Wither Enemies for 2 seconds on Hit",
      "Summoned Skeletons have 30% of Physical Damage Converted to Chaos Damage"
    ],
    "weights": {
      "affliction_minion_damage": 188
    },
    "level": 68
  },
  "Hulking Corpses": {
    "name": "Hulking Corpses",
    "stats": [
      "Minions have 25% increased maximum Life",
      "Raised Zombies have 5% chance to Taunt Enemies on Hit"
    ],
    "weights": {
      "affliction_minion_life": 716
    },
    "level": 50
  },
  "Vicious Bite": {
    "name": "Vicious Bite",
    "stats": [
      "Minions have 30% increased Critical Strike Chance",
      "Minions have +15% to Critical Strike Multiplier"
    ],
    "weights": {
      "affliction_minion_damage": 63
    },
    "level": 75
  },
  "Primordial Bond": {
    "name": "Primordial Bond",
    "stats": [
      "10% increased Damage per Summoned Golem",
      "20% increased Effect of Buffs granted by your Golems",
      "Golems have 25% increased Maximum Life"
    ],
    "weights": {
      "affliction_minion_damage": 188
    },
    "level": 68
  },
  "Blowback": {
    "name": "Blowback",
    "stats": [
      "10% chance to Ignite",
      "Ignites you inflict deal Damage 8% faster"
    ],
    "weights": {
      "affliction_fire_damage_over_time_multiplier": 366
    },
    "level": 50
  },
  "Fan the Flames": {
    "name": "Fan the Flames",
    "stats": [
      "Ignites you inflict spread to other Enemies within a Radius of 1.5 metres"
    ],
    "weights": {
      "affliction_fire_damage_over_time_multiplier": 137
    },
    "level": 68
  },
  "Cooked Alive": {
    "name": "Cooked Alive",
    "stats": [
      "15% chance to Ignite",
      "Enemies Ignited by you have -5% to Fire Resistance"
    ],
    "weights": {
      "affliction_fire_damage_over_time_multiplier": 137
    },
    "level": 68
  },
  "Burning Bright": {
    "name": "Burning Bright",
    "stats": [
      "25% increased Burning Damage",
      "8% increased Area of Effect"
    ],
    "weights": {
      "affliction_fire_damage_over_time_multiplier": 366,
      "affliction_fire_damage": 238
    },
    "level": 50
  },
  "Wrapped in Flame": {
    "name": "Wrapped in Flame",
    "stats": [
      "20% increased Fire Damage",
      "Cannot be Chilled while Burning",
      "5% chance to Cover Enemies in Ash on Hit while you are Burning"
    ],
    "weights": {
      "affliction_fire_damage_over_time_multiplier": 137
    },
    "level": 68
  },
  "Vivid Hues": {
    "name": "Vivid Hues",
    "stats": [
      "2% of Attack Damage Leeched as Life against Bleeding Enemies",
      "20% increased total Recovery per second from Life Leech",
      "20% increased Damage with Bleeding"
    ],
    "weights": {
      "affliction_physical_damage_over_time_multiplier": 343
    },
    "level": 50
  },
  "Rend": {
    "name": "Rend",
    "stats": [
      "+5% to Physical Damage over Time Multiplier",
      "20% increased Bleeding Duration"
    ],
    "weights": {
      "affliction_physical_damage_over_time_multiplier": 343
    },
    "level": 50
  },
  "Disorienting Wounds": {
    "name": "Disorienting Wounds",
    "stats": [
      "25% increased Damage with Bleeding",
      "25% chance to Blind with Hits against Bleeding Enemies"
    ],
    "weights": {
      "affliction_physical_damage_over_time_multiplier": 686
    },
    "level": 1
  },
  "Compound Injury": {
    "name": "Compound Injury",
    "stats": [
      "35% increased Damage with Bleeding you inflict on Maimed Enemies"
    ],
    "weights": {
      "affliction_physical_damage_over_time_multiplier": 343
    },
    "level": 50
  },
  "Blood Artist": {
    "name": "Blood Artist",
    "stats": [
      "+6% to Physical Damage over Time Multiplier if you've Spent Life Recently",
      "+20 to Strength"
    ],
    "weights": {
      "affliction_physical_damage_over_time_multiplier": 129
    },
    "level": 75
  },
  "Phlebotomist": {
    "name": "Phlebotomist",
    "stats": [
      "+6% to Physical Damage over Time Multiplier if you've dealt a Critical Strike Recently",
      "20% increased Critical Strike Chance"
    ],
    "weights": {
      "affliction_physical_damage_over_time_multiplier": 343
    },
    "level": 50
  },
  "Septic Spells": {
    "name": "Septic Spells",
    "stats": [
      "5% increased Cast Speed",
      "Spell Skills have +5% to Damage over Time Multiplier for Poison",
      "20% chance to Poison on Hit with Spell Damage"
    ],
    "weights": {
      "affliction_chaos_damage_over_time_multiplier": 348
    },
    "level": 50
  },
  "Low Tolerance": {
    "name": "Low Tolerance",
    "stats": [
      "Poisons you inflict on non-Poisoned Enemies deal 300% increased Damage"
    ],
    "weights": {
      "affliction_chaos_damage_over_time_multiplier": 130
    },
    "level": 68
  },
  "Steady Torment": {
    "name": "Steady Torment",
    "stats": [
      "15% increased Poison Duration",
      "15% increased Bleeding Duration",
      "+6% to Damage over Time Multiplier for Bleeding you inflict on Poisoned Enemies",
      "+6% to Damage over Time Multiplier for Poison you inflict on Bleeding Enemies"
    ],
    "weights": {
      "affliction_chaos_damage_over_time_multiplier": 130,
      "affliction_physical_damage_over_time_multiplier": 129
    },
    "level": 68
  },
  "Eternal Suffering": {
    "name": "Eternal Suffering",
    "stats": [
      "25% increased Chaos Damage",
      "50% chance to inflict Withered for two seconds on Hit if there are 5 or fewer Withered Debuffs on Enemy"
    ],
    "weights": {
      "affliction_chaos_damage_over_time_multiplier": 348
    },
    "level": 50
  },
  "Eldritch Inspiration": {
    "name": "Eldritch Inspiration",
    "stats": [
      "20% increased Chaos Damage",
      "16% increased maximum Mana",
      "20% increased Mana Regeneration Rate"
    ],
    "weights": {
      "affliction_chaos_damage_over_time_multiplier": 348,
      "affliction_maximum_mana": 466
    },
    "level": 50
  },
  "Wasting Affliction": {
    "name": "Wasting Affliction",
    "stats": [
      "20% increased Damage with Ailments",
      "Damaging Ailments deal damage 5% faster"
    ],
    "weights": {
      "affliction_damage_over_time_multiplier": 222,
      "affliction_cold_damage_over_time_multiplier": 178,
      "affliction_physical_damage_over_time_multiplier": 129,
      "affliction_fire_damage_over_time_multiplier": 137,
      "affliction_chaos_damage_over_time_multiplier": 130
    },
    "level": 68
  },
  "Haemorrhage": {
    "name": "Haemorrhage",
    "stats": [
      "+10% to Damage over Time Multiplier for Ailments from Critical Strikes",
      "30% increased Critical Strike Chance"
    ],
    "weights": {
      "affliction_damage_over_time_multiplier": 593,
      "affliction_cold_damage_over_time_multiplier": 475,
      "affliction_physical_damage_over_time_multiplier": 343,
      "affliction_fire_damage_over_time_multiplier": 366,
      "affliction_chaos_damage_over_time_multiplier": 348,
      "affliction_critical_chance": 457
    },
    "level": 50
  },
  "Flow of Life": {
    "name": "Flow of Life",
    "stats": [
      "24% increased Damage over Time",
      "4% increased maximum Life",
      "Regenerate 0.6% of Life per second"
    ],
    "weights": {
      "affliction_damage_over_time_multiplier": 222,
      "affliction_cold_damage_over_time_multiplier": 178,
      "affliction_physical_damage_over_time_multiplier": 129,
      "affliction_fire_damage_over_time_multiplier": 137,
      "affliction_chaos_damage_over_time_multiplier": 130,
      "affliction_maximum_life": 146
    },
    "level": 68
  },
  "Exposure Therapy": {
    "name": "Exposure Therapy",
    "stats": [
      "+5% to Damage over Time Multiplier",
      "+30% Chaos Resistance against Damage Over Time"
    ],
    "weights": {
      "affliction_damage_over_time_multiplier": 1185,
      "affliction_cold_damage_over_time_multiplier": 950,
      "affliction_physical_damage_over_time_multiplier": 686,
      "affliction_fire_damage_over_time_multiplier": 733,
      "affliction_chaos_damage_over_time_multiplier": 696,
      "affliction_chaos_resistance": 2341
    },
    "level": 1
  },
  "Brush with Death": {
    "name": "Brush with Death",
    "stats": [
      "+5% to Damage over Time Multiplier",
      "Recover 1% of Life on Kill",
      "Recover 1% of Energy Shield on Kill"
    ],
    "weights": {
      "affliction_damage_over_time_multiplier": 222,
      "affliction_cold_damage_over_time_multiplier": 178,
      "affliction_physical_damage_over_time_multiplier": 129,
      "affliction_fire_damage_over_time_multiplier": 137,
      "affliction_chaos_damage_over_time_multiplier": 130,
      "affliction_maximum_life": 146,
      "affliction_maximum_energy_shield": 189
    },
    "level": 68
  },
  "Vile Reinvigoration": {
    "name": "Vile Reinvigoration",
    "stats": [
      "24% increased Damage over Time",
      "6% increased maximum Energy Shield",
      "Regenerate 2% of Energy Shield per second if you've Killed an Enemy Recently"
    ],
    "weights": {
      "affliction_damage_over_time_multiplier": 593,
      "affliction_cold_damage_over_time_multiplier": 475,
      "affliction_physical_damage_over_time_multiplier": 343,
      "affliction_fire_damage_over_time_multiplier": 366,
      "affliction_chaos_damage_over_time_multiplier": 348,
      "affliction_maximum_energy_shield": 505
    },
    "level": 50
  },
  "Circling Oblivion": {
    "name": "Circling Oblivion",
    "stats": [
      "25% increased Damage over Time",
      "15% increased Duration of Ailments on Enemies"
    ],
    "weights": {
      "affliction_damage_over_time_multiplier": 1185,
      "affliction_cold_damage_over_time_multiplier": 950,
      "affliction_physical_damage_over_time_multiplier": 686,
      "affliction_fire_damage_over_time_multiplier": 733,
      "affliction_chaos_damage_over_time_multiplier": 696
    },
    "level": 1
  },
  "Brewed for Potency": {
    "name": "Brewed for Potency",
    "stats": [
      "24% increased Damage over Time",
      "10% increased Flask Charges gained",
      "20% increased Life and Mana Recovery from Flasks"
    ],
    "weights": {
      "affliction_damage_over_time_multiplier": 1185,
      "affliction_cold_damage_over_time_multiplier": 950,
      "affliction_physical_damage_over_time_multiplier": 686,
      "affliction_fire_damage_over_time_multiplier": 733,
      "affliction_chaos_damage_over_time_multiplier": 696,
      "affliction_flask_duration": 1079
    },
    "level": 1
  },
  "Astonishing Affliction": {
    "name": "Astonishing Affliction",
    "stats": [
      "20% increased Duration of Elemental Ailments on Enemies",
      "20% increased Damage with Hits and Ailments against Enemies affected by Ailments",
      "20% increased Effect of Non-Damaging Ailments"
    ],
    "weights": {
      "affliction_effect_of_non-damaging_ailments": 1627
    },
    "level": 1
  },
  "Cold Conduction": {
    "name": "Cold Conduction",
    "stats": [
      "25% increased Effect of Cold Ailments you inflict on Shocked Enemies",
      "25% increased Effect of Lightning Ailments you inflict on Chilled Enemies"
    ],
    "weights": {
      "affliction_effect_of_non-damaging_ailments": 305
    },
    "level": 68
  },
  "Inspired Oppression": {
    "name": "Inspired Oppression",
    "stats": [
      "20% increased Elemental Damage",
      "30% increased Mana Regeneration Rate if you have Frozen an Enemy Recently",
      "30% increased Mana Regeneration Rate if you have Shocked an Enemy Recently",
      "10% increased Effect of Non-Damaging Ailments"
    ],
    "weights": {
      "affliction_effect_of_non-damaging_ailments": 102,
      "affliction_elemental_damage": 94,
      "affliction_lightning_damage": 45,
      "affliction_cold_damage": 32
    },
    "level": 75
  },
  "Chilling Presence": {
    "name": "Chilling Presence",
    "stats": [
      "Nearby Enemies are Chilled"
    ],
    "weights": {
      "affliction_effect_of_non-damaging_ailments": 102,
      "affliction_cold_damage_over_time_multiplier": 59
    },
    "level": 75
  },
  "Deep Chill": {
    "name": "Deep Chill",
    "stats": [
      "+5% to Cold Damage over Time Multiplier",
      "30% increased Effect of Cold Ailments"
    ],
    "weights": {
      "affliction_effect_of_non-damaging_ailments": 1627,
      "affliction_cold_damage": 505,
      "affliction_cold_damage_over_time_multiplier": 950
    },
    "level": 1
  },
  "Blast-Freeze": {
    "name": "Blast-Freeze",
    "stats": [
      "20% increased Cold Damage",
      "Freezes you inflict spread to other Enemies within 1.2 metres"
    ],
    "weights": {
      "affliction_cold_damage": 95,
      "affliction_cold_damage_over_time_multiplier": 178,
      "affliction_effect_of_non-damaging_ailments": 305
    },
    "level": 68
  },
  "Thunderstruck": {
    "name": "Thunderstruck",
    "stats": [
      "20% increased Lightning Damage",
      "Your Critical Strikes Knock Back Shocked Enemies",
      "30% increased Critical Strike Chance"
    ],
    "weights": {
      "affliction_lightning_damage": 364
    },
    "level": 50
  },
  "Stormrider": {
    "name": "Stormrider",
    "stats": [
      "10% chance to gain a Power Charge when you Shock a Chilled Enemy",
      "25% increased Cold Damage with Hits against Shocked Enemies",
      "25% increased Lightning Damage with Hits against Chilled Enemies"
    ],
    "weights": {
      "affliction_effect_of_non-damaging_ailments": 305,
      "affliction_cold_damage": 95,
      "affliction_lightning_damage": 136
    },
    "level": 68
  },
  "Overshock": {
    "name": "Overshock",
    "stats": [
      "30% increased Lightning Damage",
      "40% increased Effect of Lightning Ailments"
    ],
    "weights": {
      "affliction_lightning_damage": 364,
      "affliction_effect_of_non-damaging_ailments": 814
    },
    "level": 50
  },
  "Evil Eye": {
    "name": "Evil Eye",
    "stats": [
      "Enemies you Curse take 6% increased Damage"
    ],
    "weights": {
      "old_do_not_use_affliction_curse_effect": 706,
      "affliction_curse_effect_small": 706
    },
    "level": 1
  },
  "Forbidden Words": {
    "name": "Forbidden Words",
    "stats": [
      "25% increased Area of Effect of Curse Aura Skills",
      "15% increased Mana Reservation Efficiency of Curse Aura Skills"
    ],
    "weights": {},
    "level": 68
  },
  "Doedre's Spite": {
    "name": "Doedre's Spite",
    "stats": [
      "Enfeeble can affect Hexproof Enemies",
      "35% increased Critical Strike Chance against Cursed Enemies"
    ],
    "weights": {
      "old_do_not_use_affliction_curse_effect": 353,
      "affliction_curse_effect_small": 353
    },
    "level": 50
  },
  "Victim Maker": {
    "name": "Victim Maker",
    "stats": [
      "Curse Skills have 8% increased Cast Speed",
      "Enemies Cursed by you have Malediction if 33% of Curse Duration expired"
    ],
    "weights": {
      "old_do_not_use_affliction_curse_effect": 353,
      "affliction_curse_effect_small": 353
    },
    "level": 50
  },
  "Master of Fear": {
    "name": "Master of Fear",
    "stats": [
      "Enemies you Curse are Unnerved"
    ],
    "weights": {},
    "level": 68
  },
  "Wish for Death": {
    "name": "Wish for Death",
    "stats": [
      "You have Culling Strike against Cursed Enemies"
    ],
    "weights": {},
    "level": 50
  },
  "Lord of Drought": {
    "name": "Lord of Drought",
    "stats": [
      "Flammability can affect Hexproof Enemies",
      "30% increased Damage with Ignites inflicted on Cursed Enemies"
    ],
    "weights": {
      "old_do_not_use_affliction_curse_effect": 353,
      "affliction_curse_effect_small": 353
    },
    "level": 50
  },
  "Blizzard Caller": {
    "name": "Blizzard Caller",
    "stats": [
      "Frostbite can affect Hexproof Enemies",
      "30% increased Duration of Freezes you inflict on Cursed Enemies"
    ],
    "weights": {
      "old_do_not_use_affliction_curse_effect": 353,
      "affliction_curse_effect_small": 353
    },
    "level": 50
  },
  "Tempt the Storm": {
    "name": "Tempt the Storm",
    "stats": [
      "Conductivity can affect Hexproof Enemies",
      "30% increased Effect of Shocks you inflict on Cursed Enemies"
    ],
    "weights": {
      "old_do_not_use_affliction_curse_effect": 353,
      "affliction_curse_effect_small": 353
    },
    "level": 50
  },
  "Misery Everlasting": {
    "name": "Misery Everlasting",
    "stats": [
      "Despair can affect Hexproof Enemies",
      "Recover 2% of Energy Shield when you Kill a Cursed Enemy"
    ],
    "weights": {
      "old_do_not_use_affliction_curse_effect": 353,
      "affliction_curse_effect_small": 353
    },
    "level": 50
  },
  "Exploit Weakness": {
    "name": "Exploit Weakness",
    "stats": [
      "Vulnerability can affect Hexproof Enemies",
      "Recover 2% of Life when you Kill a Cursed Enemy"
    ],
    "weights": {
      "old_do_not_use_affliction_curse_effect": 353,
      "affliction_curse_effect_small": 353
    },
    "level": 50
  },
  "Hound's Mark": {
    "name": "Hound's Mark",
    "stats": [
      "20% increased Effect of your Marks",
      "20% increased Damage with Hits and Ailments against Marked Enemy"
    ],
    "weights": {
      "old_do_not_use_affliction_curse_effect": 706,
      "affliction_curse_effect_small": 706
    },
    "level": 1
  },
  "Doedre's Gluttony": {
    "name": "Doedre's Gluttony",
    "stats": [
      "Punishment can affect Hexproof Enemies",
      "You have Culling Strike against Cursed Enemies"
    ],
    "weights": {
      "old_do_not_use_affliction_curse_effect": 353,
      "affliction_curse_effect_small": 353
    },
    "level": 50
  },
  "Doedre's Apathy": {
    "name": "Doedre's Apathy",
    "stats": [
      "Temporal Chains can affect Hexproof Enemies",
      "Enemies you Curse are Unnerved"
    ],
    "weights": {
      "old_do_not_use_affliction_curse_effect": 132,
      "affliction_curse_effect_small": 132
    },
    "level": 68
  },
  "Master of the Maelstrom": {
    "name": "Master of the Maelstrom",
    "stats": [
      "Elemental Weakness can affect Hexproof Enemies",
      "+1% to all maximum Elemental Resistances if you have Killed a Cursed Enemy Recently"
    ],
    "weights": {
      "old_do_not_use_affliction_curse_effect": 353,
      "affliction_curse_effect_small": 353
    },
    "level": 50
  },
  "Heraldry": {
    "name": "Heraldry",
    "stats": [
      "Nearby Enemies have Cold Exposure while you are affected by Herald of Ice",
      "Nearby Enemies have Fire Exposure while you are affected by Herald of Ash",
      "Nearby Enemies have Lightning Exposure while you are affected by Herald of Thunder"
    ],
    "weights": {
      "affliction_damage_while_you_have_a_herald": 118,
      "affliction_minion_damage_while_you_have_a_herald": 158
    },
    "level": 75
  },
  "Endbringer": {
    "name": "Endbringer",
    "stats": [
      "5% increased Damage for each Herald affecting you",
      "20% increased Damage while affected by a Herald"
    ],
    "weights": {
      "affliction_damage_while_you_have_a_herald": 353,
      "affliction_minion_damage_while_you_have_a_herald": 474
    },
    "level": 68
  },
  "Cult-Leader": {
    "name": "Cult-Leader",
    "stats": [
      "Minions deal 35% increased Damage while you are affected by a Herald"
    ],
    "weights": {
      "affliction_minion_damage_while_you_have_a_herald": 2526
    },
    "level": 1
  },
  "Empowered Envoy": {
    "name": "Empowered Envoy",
    "stats": [
      "Herald Skills deal 40% increased Damage",
      "20% increased Effect of Herald Buffs on you"
    ],
    "weights": {
      "affliction_damage_while_you_have_a_herald": 1882
    },
    "level": 1
  },
  "Dark Messenger": {
    "name": "Dark Messenger",
    "stats": [
      "Herald Skills have 25% increased Area of Effect",
      "Herald Skills deal 20% increased Damage"
    ],
    "weights": {
      "affliction_damage_while_you_have_a_herald": 941
    },
    "level": 50
  },
  "Agent of Destruction": {
    "name": "Agent of Destruction",
    "stats": [
      "10% chance to Freeze, Shock and Ignite while affected by a Herald",
      "25% increased Elemental Damage while affected by a Herald"
    ],
    "weights": {
      "affliction_damage_while_you_have_a_herald": 1882
    },
    "level": 1
  },
  "Lasting Impression": {
    "name": "Lasting Impression",
    "stats": [
      "30% increased Damage over Time while affected by a Herald",
      "Herald Skills deal 50% increased Damage over Time"
    ],
    "weights": {
      "affliction_damage_while_you_have_a_herald": 353,
      "affliction_minion_damage_while_you_have_a_herald": 474
    },
    "level": 68
  },
  "Self-Fulfilling Prophecy": {
    "name": "Self-Fulfilling Prophecy",
    "stats": [
      "+1% to Critical Strike Chance of Herald Skills",
      "+15% to Critical Strike Multiplier if you dealt a Critical Strike with a Herald Skill Recently"
    ],
    "weights": {
      "affliction_damage_while_you_have_a_herald": 353
    },
    "level": 68
  },
  "Invigorating Portents": {
    "name": "Invigorating Portents",
    "stats": [
      "Minions deal 20% increased Damage while you are affected by a Herald",
      "Minions have 10% increased Movement Speed for each Herald affecting you"
    ],
    "weights": {
      "affliction_minion_damage_while_you_have_a_herald": 1263
    },
    "level": 50
  },
  "Pure Agony": {
    "name": "Pure Agony",
    "stats": [
      "+5 to Maximum Virulence",
      "Minions deal 20% increased Damage while you are affected by a Herald"
    ],
    "weights": {
      "affliction_minion_damage_while_you_have_a_herald": 474
    },
    "level": 68
  },
  "Disciples": {
    "name": "Disciples",
    "stats": [
      "Minions deal 20% increased Damage while you are affected by a Herald",
      "Summoned Sentinels have 25% increased Cooldown Recovery Rate"
    ],
    "weights": {
      "affliction_minion_damage_while_you_have_a_herald": 474
    },
    "level": 68
  },
  "Dread March": {
    "name": "Dread March",
    "stats": [
      "Minions have 10% increased maximum Life",
      "Minions have 10% increased Movement Speed",
      "Minions have 10% additional Physical Damage Reduction",
      "Minions have +10% to Chaos Resistance"
    ],
    "weights": {
      "affliction_minion_life": 1433
    },
    "level": 1
  },
  "Blessed Rebirth": {
    "name": "Blessed Rebirth",
    "stats": [
      "Minions have 20% increased maximum Life",
      "Minions created Recently cannot be Damaged"
    ],
    "weights": {
      "affliction_minion_life": 269
    },
    "level": 68
  },
  "Life from Death": {
    "name": "Life from Death",
    "stats": [
      "Minions have 15% increased maximum Life",
      "Regenerate 2% of Life per second if a Minion has Died Recently",
      "Minions Recover 4% of Life on Minion Death"
    ],
    "weights": {
      "affliction_minion_life": 716
    },
    "level": 50
  },
  "Feasting Fiends": {
    "name": "Feasting Fiends",
    "stats": [
      "Minions have 10% increased maximum Life",
      "Minions deal 10% increased Damage",
      "Minions Leech 0.4% of Damage as Life"
    ],
    "weights": {
      "affliction_minion_life": 1433,
      "affliction_minion_damage": 1000
    },
    "level": 1
  },
  "Bodyguards": {
    "name": "Bodyguards",
    "stats": [
      "Minions have 10% increased maximum Life",
      "Minions have 10% chance to Knock Enemies Back on Hit with Attacks"
    ],
    "weights": {
      "affliction_minion_life": 716
    },
    "level": 50
  },
  "Follow-Through": {
    "name": "Follow-Through",
    "stats": [
      "Projectiles deal 20% increased Damage with Hits and Ailments for\neach remaining Chain, up to a maximum of 100%"
    ],
    "weights": {
      "affliction_projectile_damage": 333
    },
    "level": 68
  },
  "Streamlined": {
    "name": "Streamlined",
    "stats": [
      "20% increased Projectile Speed",
      "20% increased Projectile Damage"
    ],
    "weights": {
      "affliction_projectile_damage": 1778
    },
    "level": 1
  },
  "Shrieking Bolts": {
    "name": "Shrieking Bolts",
    "stats": [
      "35% increased Projectile Damage",
      "10% chance to Taunt Enemies on Projectile Hit"
    ],
    "weights": {
      "affliction_projectile_damage": 889
    },
    "level": 50
  },
  "Eye to Eye": {
    "name": "Eye to Eye",
    "stats": [
      "25% increased Projectile Damage",
      "Projectiles deal 35% increased Damage with Hits against nearby Enemies"
    ],
    "weights": {
      "affliction_projectile_damage": 889
    },
    "level": 50
  },
  "Repeater": {
    "name": "Repeater",
    "stats": [
      "30% increased Projectile Damage",
      "8% increased Attack and Cast Speed"
    ],
    "weights": {
      "affliction_projectile_damage": 1778
    },
    "level": 1
  },
  "Aerodynamics": {
    "name": "Aerodynamics",
    "stats": [
      "Projectiles Pierce an additional Target",
      "10% increased Projectile Speed",
      "10% increased Projectile Damage"
    ],
    "weights": {
      "affliction_projectile_damage": 333
    },
    "level": 68
  },
  "Chip Away": {
    "name": "Chip Away",
    "stats": [
      "Brand Recall grants 20% increased Brand Attachment range to recalled Brands",
      "Brand Recall has 4% increased Cooldown Recovery Rate per Brand, up to a maximum of 40%"
    ],
    "weights": {
      "affliction_brand_damage": 1171
    },
    "level": 50
  },
  "Seeker Runes": {
    "name": "Seeker Runes",
    "stats": [
      "25% increased Brand Damage",
      "Unattached Brands gain 20% increased Brand Attachment Range per\nsecond, up to a maximum of 100%"
    ],
    "weights": {
      "affliction_brand_damage": 439
    },
    "level": 68
  },
  "Remarkable": {
    "name": "Remarkable",
    "stats": [
      "8% increased Cast Speed with Brand Skills",
      "Skills which create Brands have 35% chance to create an additional Brand"
    ],
    "weights": {
      "affliction_brand_damage": 439
    },
    "level": 68
  },
  "Brand Loyalty": {
    "name": "Brand Loyalty",
    "stats": [
      "Enemies take 3% increased Damage for each of your Brands Attached to them"
    ],
    "weights": {
      "affliction_brand_damage": 2341
    },
    "level": 1
  },
  "Holy Conquest": {
    "name": "Holy Conquest",
    "stats": [
      "Brands have 25% increased Area of Effect if 50% of Attached Duration expired",
      "25% increased Brand Damage"
    ],
    "weights": {
      "affliction_brand_damage": 1171
    },
    "level": 50
  },
  "Grand Design": {
    "name": "Grand Design",
    "stats": [
      "20% increased Brand Damage",
      "Brand Skills have 10% increased Duration",
      "10% increased Brand Attachment range"
    ],
    "weights": {
      "affliction_brand_damage": 439
    },
    "level": 68
  },
  "Set and Forget": {
    "name": "Set and Forget",
    "stats": [
      "25% increased Trap Damage",
      "40% increased Trap Trigger Area of Effect",
      "Skills used by Traps have 15% increased Area of Effect"
    ],
    "weights": {
      "affliction_trap_and_mine_damage": 980
    },
    "level": 50
  },
  "Expert Sabotage": {
    "name": "Expert Sabotage",
    "stats": [
      "Mines have 20% increased Detonation Speed",
      "Mines have a 10% chance to be Detonated an Additional Time"
    ],
    "weights": {
      "affliction_trap_and_mine_damage": 980
    },
    "level": 50
  },
  "Guerilla Tactics": {
    "name": "Guerilla Tactics",
    "stats": [
      "20% increased Trap Damage",
      "20% increased Mine Damage",
      "10% increased Trap Throwing Speed",
      "10% increased Mine Throwing Speed",
      "5% increased Movement Speed if you've thrown a Trap or Mine Recently"
    ],
    "weights": {
      "affliction_trap_and_mine_damage": 1959
    },
    "level": 1
  },
  "Expendability": {
    "name": "Expendability",
    "stats": [
      "10% chance to throw up to 1 additional Trap or Mine"
    ],
    "weights": {
      "affliction_trap_and_mine_damage": 367
    },
    "level": 68
  },
  "Arcane Pyrotechnics": {
    "name": "Arcane Pyrotechnics",
    "stats": [
      "20% increased Trap Damage",
      "20% increased Mine Damage",
      "Gain Arcane Surge when your Mine is Detonated targeting an Enemy",
      "Gain Arcane Surge when your Trap is Triggered by an Enemy"
    ],
    "weights": {
      "affliction_trap_and_mine_damage": 367
    },
    "level": 68
  },
  "Surprise Sabotage": {
    "name": "Surprise Sabotage",
    "stats": [
      "+8% to Critical Strike Multiplier with Traps",
      "+8% to Critical Strike Multiplier with Mines",
      "Trap Damage Penetrates 4% Elemental Resistances",
      "Mine Damage Penetrates 4% Elemental Resistances"
    ],
    "weights": {
      "affliction_trap_and_mine_damage": 980
    },
    "level": 50
  },
  "Careful Handling": {
    "name": "Careful Handling",
    "stats": [
      "15% increased Trap Damage",
      "15% increased Mine Damage",
      "4% increased maximum Life",
      "6% increased maximum Mana"
    ],
    "weights": {
      "affliction_trap_and_mine_damage": 367,
      "affliction_maximum_mana": 175,
      "affliction_maximum_life": 146
    },
    "level": 68
  },
  "Peak Vigour": {
    "name": "Peak Vigour",
    "stats": [
      "8% increased maximum Life",
      "20% increased Life Recovery from Flasks"
    ],
    "weights": {
      "affliction_maximum_life": 780,
      "affliction_flask_duration": 1079
    },
    "level": 1
  },
  "Fettle": {
    "name": "Fettle",
    "stats": [
      "+20 to maximum Life",
      "10% increased maximum Life"
    ],
    "weights": {
      "affliction_maximum_life": 49
    },
    "level": 75
  },
  "Feast of Flesh": {
    "name": "Feast of Flesh",
    "stats": [
      "8% increased maximum Life",
      "0.4% of Attack Damage Leeched as Life",
      "Gain 10 Life per Enemy Hit with Attacks"
    ],
    "weights": {
      "affliction_maximum_life": 146
    },
    "level": 68
  },
  "Sublime Sensation": {
    "name": "Sublime Sensation",
    "stats": [
      "10% increased maximum Energy Shield",
      "8% increased maximum Life"
    ],
    "weights": {
      "affliction_maximum_life": 390,
      "affliction_maximum_energy_shield": 505
    },
    "level": 50
  },
  "Surging Vitality": {
    "name": "Surging Vitality",
    "stats": [
      "8% increased maximum Life",
      "Every 4 seconds, Regenerate 10% of Life over one second"
    ],
    "weights": {
      "affliction_maximum_life": 780
    },
    "level": 1
  },
  "Peace Amidst Chaos": {
    "name": "Peace Amidst Chaos",
    "stats": [
      "8% increased maximum Life",
      "20% increased Armour while stationary",
      "Regenerate 2% of Life per second while stationary"
    ],
    "weights": {
      "affliction_maximum_life": 390
    },
    "level": 50
  },
  "Adrenaline": {
    "name": "Adrenaline",
    "stats": [
      "8% increased maximum Life",
      "6% increased Attack Speed while Leeching"
    ],
    "weights": {
      "affliction_maximum_life": 146
    },
    "level": 68
  },
  "Wall of Muscle": {
    "name": "Wall of Muscle",
    "stats": [
      "6% increased maximum Life",
      "5% increased Strength"
    ],
    "weights": {
      "affliction_maximum_life": 49
    },
    "level": 75
  },
  "Mindfulness": {
    "name": "Mindfulness",
    "stats": [
      "15% increased maximum Mana",
      "80% increased Mana Regeneration Rate while stationary"
    ],
    "weights": {
      "affliction_maximum_mana": 466
    },
    "level": 50
  },
  "Liquid Inspiration": {
    "name": "Liquid Inspiration",
    "stats": [
      "15% increased maximum Mana",
      "20% increased Mana Recovery from Flasks",
      "25% chance to gain a Power Charge when you use a Mana Flask"
    ],
    "weights": {
      "affliction_maximum_mana": 175,
      "affliction_flask_duration": 202
    },
    "level": 68
  },
  "Openness": {
    "name": "Openness",
    "stats": [
      "+30 to maximum Mana",
      "20% increased maximum Mana",
      "15% increased Mana Cost Efficiency"
    ],
    "weights": {
      "affliction_maximum_mana": 932
    },
    "level": 1
  },
  "Daring Ideas": {
    "name": "Daring Ideas",
    "stats": [
      "18% increased maximum Mana",
      "0.4% of Attack Damage Leeched as Mana",
      "25% increased Cost Efficiency of Attacks"
    ],
    "weights": {
      "affliction_maximum_mana": 466
    },
    "level": 50
  },
  "Clarity of Purpose": {
    "name": "Clarity of Purpose",
    "stats": [
      "15% increased maximum Mana",
      "30% increased Mana Regeneration Rate"
    ],
    "weights": {
      "affliction_maximum_mana": 932
    },
    "level": 1
  },
  "Scintillating Idea": {
    "name": "Scintillating Idea",
    "stats": [
      "20% increased maximum Mana",
      "Damage Penetrates 5% Lightning Resistance"
    ],
    "weights": {
      "affliction_maximum_mana": 466,
      "affliction_lightning_damage": 364
    },
    "level": 50
  },
  "Holistic Health": {
    "name": "Holistic Health",
    "stats": [
      "8% increased maximum Life",
      "10% increased maximum Mana"
    ],
    "weights": {
      "affliction_maximum_mana": 175,
      "affliction_maximum_life": 146
    },
    "level": 68
  },
  "Genius": {
    "name": "Genius",
    "stats": [
      "8% increased maximum Mana",
      "5% increased Intelligence"
    ],
    "weights": {
      "affliction_maximum_mana": 58
    },
    "level": 75
  },
  "Improvisor": {
    "name": "Improvisor",
    "stats": [
      "6% increased Attack Speed",
      "10% increased maximum Mana",
      "Gain 3 Mana per Enemy Hit with Attacks"
    ],
    "weights": {
      "affliction_maximum_mana": 175
    },
    "level": 68
  },
  "Stubborn Student": {
    "name": "Stubborn Student",
    "stats": [
      "20% increased Armour",
      "15% increased maximum Mana",
      "+1 Armour per 10 Unreserved Maximum Mana"
    ],
    "weights": {
      "affliction_maximum_mana": 175,
      "affliction_armour": 261
    },
    "level": 68
  },
  "Savour the Moment": {
    "name": "Savour the Moment",
    "stats": [
      "10% increased maximum Energy Shield",
      "Regenerate 3.00% of Energy Shield per second while stationary"
    ],
    "weights": {
      "affliction_maximum_energy_shield": 1011
    },
    "level": 1
  },
  "Energy From Naught": {
    "name": "Energy From Naught",
    "stats": [
      "+70 to maximum Energy Shield",
      "15% increased Energy Shield Recharge Rate"
    ],
    "weights": {
      "affliction_maximum_energy_shield": 505
    },
    "level": 50
  },
  "Will Shaper": {
    "name": "Will Shaper",
    "stats": [
      "Gain 5% of Maximum Mana as Extra Maximum Energy Shield"
    ],
    "weights": {
      "affliction_maximum_energy_shield": 63,
      "affliction_maximum_mana": 58
    },
    "level": 75
  },
  "Spring Back": {
    "name": "Spring Back",
    "stats": [
      "10% increased maximum Energy Shield",
      "5% faster start of Energy Shield Recharge"
    ],
    "weights": {
      "affliction_maximum_energy_shield": 1011
    },
    "level": 1
  },
  "Conservation of Energy": {
    "name": "Conservation of Energy",
    "stats": [
      "10% increased maximum Energy Shield",
      "0.3% of Spell Damage Leeched as Energy Shield"
    ],
    "weights": {
      "affliction_maximum_energy_shield": 189
    },
    "level": 68
  },
  "Self-Control": {
    "name": "Self-Control",
    "stats": [
      "25% increased Mana Regeneration Rate",
      "Discipline has 80% increased Mana Reservation Efficiency"
    ],
    "weights": {
      "affliction_maximum_energy_shield": 505,
      "old_do_not_use_affliction_aura_effect": 480,
      "affliction_reservation_efficiency_small": 480
    },
    "level": 50
  },
  "Heart of Iron": {
    "name": "Heart of Iron",
    "stats": [
      "Gain 10% of Maximum Life as Extra Armour"
    ],
    "weights": {
      "affliction_maximum_life": 146,
      "affliction_armour": 261
    },
    "level": 68
  },
  "Prismatic Carapace": {
    "name": "Prismatic Carapace",
    "stats": [
      "30% increased Armour",
      "+1% to all maximum Elemental Resistances"
    ],
    "weights": {
      "affliction_armour": 87,
      "affliction_lightning_resistance": 86,
      "affliction_cold_resistance": 86,
      "affliction_fire_resistance": 82
    },
    "level": 75
  },
  "Militarism": {
    "name": "Militarism",
    "stats": [
      "30% increased Armour",
      "8% increased maximum Life"
    ],
    "weights": {
      "affliction_armour": 696
    },
    "level": 50
  },
  "Second Skin": {
    "name": "Second Skin",
    "stats": [
      "4% Chance to Block Spell Damage",
      "30% increased Armour",
      "+4% Chance to Block Attack Damage"
    ],
    "weights": {
      "affliction_armour": 1391,
      "affliction_chance_to_block": 750
    },
    "level": 1
  },
  "Dragon Hunter": {
    "name": "Dragon Hunter",
    "stats": [
      "30% increased Armour",
      "+20% to Fire Resistance",
      "15% chance to Defend with 200% of Armour"
    ],
    "weights": {
      "affliction_armour": 696,
      "affliction_fire_resistance": 658
    },
    "level": 50
  },
  "Enduring Composure": {
    "name": "Enduring Composure",
    "stats": [
      "30% increased Armour",
      "Gain 1 Endurance Charge every second if you've been Hit Recently"
    ],
    "weights": {
      "affliction_armour": 261
    },
    "level": 68
  },
  "Uncompromising": {
    "name": "Uncompromising",
    "stats": [
      "20% increased Stun Threshold",
      "Determination has 50% increased Mana Reservation Efficiency"
    ],
    "weights": {
      "affliction_armour": 696,
      "old_do_not_use_affliction_aura_effect": 480,
      "affliction_reservation_efficiency_small": 480
    },
    "level": 50
  },
  "Prismatic Dance": {
    "name": "Prismatic Dance",
    "stats": [
      "30% increased Evasion Rating",
      "+1% to all maximum Elemental Resistances"
    ],
    "weights": {
      "affliction_evasion": 82,
      "affliction_lightning_resistance": 86,
      "affliction_cold_resistance": 86,
      "affliction_fire_resistance": 82
    },
    "level": 75
  },
  "Natural Vigour": {
    "name": "Natural Vigour",
    "stats": [
      "30% increased Evasion Rating",
      "8% increased maximum Life"
    ],
    "weights": {
      "affliction_evasion": 658,
      "affliction_maximum_life": 390
    },
    "level": 50
  },
  "Untouchable": {
    "name": "Untouchable",
    "stats": [
      "+10% chance to Suppress Spell Damage",
      "30% increased Evasion Rating"
    ],
    "weights": {
      "affliction_evasion": 1315,
      "affliction_chance_to_dodge_attacks": 1477
    },
    "level": 1
  },
  "Shifting Shadow": {
    "name": "Shifting Shadow",
    "stats": [
      "20% increased Evasion Rating",
      "+20 to Dexterity",
      "10% chance to Blind Enemies on Hit"
    ],
    "weights": {
      "affliction_evasion": 658
    },
    "level": 50
  },
  "Readiness": {
    "name": "Readiness",
    "stats": [
      "30% chance to Avoid Bleeding",
      "30% chance to Avoid being Impaled",
      "30% increased Evasion Rating if you haven't been Hit Recently"
    ],
    "weights": {
      "affliction_evasion": 1315
    },
    "level": 1
  },
  "Sublime Form": {
    "name": "Sublime Form",
    "stats": [
      "+10% to all Elemental Resistances",
      "Grace has 50% increased Mana Reservation Efficiency"
    ],
    "weights": {
      "affliction_evasion": 658,
      "old_do_not_use_affliction_aura_effect": 480,
      "affliction_reservation_efficiency_small": 480
    },
    "level": 50
  },
  "Confident Combatant": {
    "name": "Confident Combatant",
    "stats": [
      "1% increased Damage per 1% Chance to Block Attack Damage"
    ],
    "weights": {},
    "level": 68
  },
  "Flexible Sentry": {
    "name": "Flexible Sentry",
    "stats": [
      "4% Chance to Block Spell Damage",
      "25% reduced Elemental Ailment Duration on you",
      "+4% Chance to Block Attack Damage",
      "25% reduced Effect of Chill and Shock on you"
    ],
    "weights": {
      "affliction_chance_to_block": 375,
      "affliction_lightning_resistance": 686,
      "affliction_cold_resistance": 686,
      "affliction_fire_resistance": 658
    },
    "level": 50
  },
  "Vicious Guard": {
    "name": "Vicious Guard",
    "stats": [
      "0.4% of Attack Damage Leeched as Life",
      "Regenerate 1.5% of Life per second",
      "+6% Chance to Block Attack Damage"
    ],
    "weights": {
      "affliction_chance_to_block": 750,
      "affliction_maximum_life": 780
    },
    "level": 1
  },
  "Mystical Ward": {
    "name": "Mystical Ward",
    "stats": [
      "6% Chance to Block Spell Damage",
      "0.3% of Spell Damage Leeched as Energy Shield",
      "Regenerate 1.5% of Energy Shield per second"
    ],
    "weights": {
      "affliction_chance_to_block": 750,
      "affliction_maximum_energy_shield": 1011
    },
    "level": 1
  },
  "Rote Reinforcement": {
    "name": "Rote Reinforcement",
    "stats": [
      "+20 to maximum Life",
      "20% chance to gain an Endurance Charge when you Block",
      "+6% Chance to Block Attack Damage"
    ],
    "weights": {
      "affliction_chance_to_block": 141,
      "affliction_maximum_life": 146
    },
    "level": 68
  },
  "Mage Hunter": {
    "name": "Mage Hunter",
    "stats": [
      "6% Chance to Block Spell Damage",
      "20% increased Spell Damage",
      "20% chance to gain a Power Charge when you Block"
    ],
    "weights": {
      "affliction_chance_to_block": 141,
      "affliction_spell_damage": 281
    },
    "level": 68
  },
  "Riot Queller": {
    "name": "Riot Queller",
    "stats": [
      "+6% Chance to Block Attack Damage",
      "Enemies Taunted by you take 6% increased Damage"
    ],
    "weights": {
      "affliction_chance_to_block": 47,
      "affliction_attack_damage_while_holding_a_shield": 38
    },
    "level": 75
  },
  "One with the Shield": {
    "name": "One with the Shield",
    "stats": [
      "+6% Chance to Block Attack Damage while holding a Shield",
      "Recover 50 Life when you Block",
      "50% increased Defences from Equipped Shield"
    ],
    "weights": {
      "affliction_chance_to_block": 375
    },
    "level": 50
  },
  "Aerialist": {
    "name": "Aerialist",
    "stats": [
      "+10% chance to Suppress Spell Damage",
      "5% increased Dexterity"
    ],
    "weights": {
      "affliction_chance_to_dodge_attacks": 92
    },
    "level": 75
  },
  "Elegant Form": {
    "name": "Elegant Form",
    "stats": [
      "+10% chance to Suppress Spell Damage",
      "20% chance to Avoid Elemental Ailments"
    ],
    "weights": {
      "affliction_chance_to_dodge_attacks": 1477
    },
    "level": 1
  },
  "Darting Movements": {
    "name": "Darting Movements",
    "stats": [
      "3% increased Movement Speed",
      "+12% chance to Suppress Spell Damage while moving"
    ],
    "weights": {
      "affliction_chance_to_dodge_attacks": 1477
    },
    "level": 1
  },
  "No Witnesses": {
    "name": "No Witnesses",
    "stats": [
      "10% chance to gain Elusive on Kill",
      "25% increased Elusive Effect"
    ],
    "weights": {},
    "level": 75
  },
  "Molten One's Mark": {
    "name": "Molten One's Mark",
    "stats": [
      "+2% to maximum Fire Resistance",
      "Regenerate 1% of Life per second"
    ],
    "weights": {
      "affliction_fire_resistance": 247
    },
    "level": 68
  },
  "Fire Attunement": {
    "name": "Fire Attunement",
    "stats": [
      "30% reduced Ignite Duration on you",
      "You cannot be Ignited if you've been Ignited Recently",
      "Unaffected by Burning Ground"
    ],
    "weights": {
      "affliction_fire_resistance": 1315
    },
    "level": 1
  },
  "Pure Might": {
    "name": "Pure Might",
    "stats": [
      "40% increased Stun and Block Recovery",
      "Purity of Fire has 80% increased Mana Reservation Efficiency",
      "+20 to Strength"
    ],
    "weights": {
      "affliction_fire_resistance": 247,
      "old_do_not_use_affliction_aura_effect": 180,
      "affliction_reservation_efficiency_small": 180
    },
    "level": 68
  },
  "Blacksmith": {
    "name": "Blacksmith",
    "stats": [
      "25% increased Armour",
      "+20% to Fire Resistance",
      "0.4% of Fire Damage Leeched as Life"
    ],
    "weights": {
      "affliction_fire_resistance": 247,
      "affliction_armour": 261
    },
    "level": 68
  },
  "Non-Flammable": {
    "name": "Non-Flammable",
    "stats": [
      "+1% to maximum Fire Resistance",
      "+20% to Fire Resistance",
      "30% chance to Avoid being Ignited"
    ],
    "weights": {
      "affliction_fire_resistance": 658
    },
    "level": 50
  },
  "Winter Prowler": {
    "name": "Winter Prowler",
    "stats": [
      "+2% to maximum Cold Resistance",
      "10% increased Life Recovery from Flasks"
    ],
    "weights": {
      "affliction_cold_resistance": 257
    },
    "level": 68
  },
  "Hibernator": {
    "name": "Hibernator",
    "stats": [
      "30% reduced Effect of Chill on you",
      "30% reduced Freeze Duration on you",
      "You cannot be Frozen if you've been Frozen Recently",
      "Unaffected by Chilled Ground"
    ],
    "weights": {
      "affliction_cold_resistance": 686
    },
    "level": 50
  },
  "Pure Guile": {
    "name": "Pure Guile",
    "stats": [
      "Purity of Ice has 80% increased Mana Reservation Efficiency",
      "+20 to Dexterity",
      "5% chance to Blind Enemies on Hit"
    ],
    "weights": {
      "affliction_cold_resistance": 257,
      "old_do_not_use_affliction_aura_effect": 180,
      "affliction_reservation_efficiency_small": 180
    },
    "level": 68
  },
  "Alchemist": {
    "name": "Alchemist",
    "stats": [
      "+20% to Cold Resistance",
      "8% increased Attack and Cast Speed",
      "20% increased Life Recovery from Flasks"
    ],
    "weights": {
      "affliction_cold_resistance": 1371
    },
    "level": 1
  },
  "Antifreeze": {
    "name": "Antifreeze",
    "stats": [
      "+1% to maximum Cold Resistance",
      "+20% to Cold Resistance",
      "30% chance to Avoid being Frozen"
    ],
    "weights": {
      "affliction_cold_resistance": 686
    },
    "level": 50
  },
  "Wizardry": {
    "name": "Wizardry",
    "stats": [
      "8% increased maximum Mana",
      "+2% to maximum Lightning Resistance"
    ],
    "weights": {
      "affliction_lightning_resistance": 257,
      "affliction_maximum_mana": 175
    },
    "level": 68
  },
  "Capacitor": {
    "name": "Capacitor",
    "stats": [
      "You cannot be Shocked if you've been Shocked Recently",
      "30% reduced Effect of Shock on you",
      "Unaffected by Shocked Ground"
    ],
    "weights": {
      "affliction_lightning_resistance": 686
    },
    "level": 50
  },
  "Pure Aptitude": {
    "name": "Pure Aptitude",
    "stats": [
      "15% increased Energy Shield Recharge Rate",
      "Purity of Lightning has 80% increased Mana Reservation Efficiency",
      "+20 to Intelligence"
    ],
    "weights": {
      "affliction_lightning_resistance": 257,
      "old_do_not_use_affliction_aura_effect": 180,
      "affliction_reservation_efficiency_small": 180
    },
    "level": 68
  },
  "Sage": {
    "name": "Sage",
    "stats": [
      "20% increased Mana Regeneration Rate",
      "+20% to Lightning Resistance",
      "Regenerate 1.5% of Life per second"
    ],
    "weights": {
      "affliction_lightning_resistance": 1371,
      "affliction_maximum_mana": 932,
      "affliction_maximum_life": 780
    },
    "level": 1
  },
  "Insulated": {
    "name": "Insulated",
    "stats": [
      "+1% to maximum Lightning Resistance",
      "+20% to Lightning Resistance",
      "30% chance to Avoid being Shocked"
    ],
    "weights": {
      "affliction_lightning_resistance": 686
    },
    "level": 50
  },
  "Born of Chaos": {
    "name": "Born of Chaos",
    "stats": [
      "+3% to maximum Chaos Resistance"
    ],
    "weights": {
      "affliction_chaos_resistance": 439
    },
    "level": 68
  },
  "Antivenom": {
    "name": "Antivenom",
    "stats": [
      "+1% to maximum Chaos Resistance",
      "+23% to Chaos Resistance",
      "30% chance to Avoid being Poisoned"
    ],
    "weights": {
      "affliction_chaos_resistance": 1171
    },
    "level": 50
  },
  "Rot-Resistant": {
    "name": "Rot-Resistant",
    "stats": [
      "+13% to Chaos Resistance",
      "Regenerate 1.2% of Life per second",
      "Regenerate 0.6% of Energy Shield per second",
      "Regenerate 0.3% of Mana per second"
    ],
    "weights": {
      "affliction_chaos_resistance": 439
    },
    "level": 68
  },
  "Blessed": {
    "name": "Blessed",
    "stats": [
      "6% increased maximum Life",
      "10% increased maximum Mana",
      "+13% to Chaos Resistance"
    ],
    "weights": {
      "affliction_chaos_resistance": 439,
      "affliction_maximum_life": 146,
      "affliction_maximum_mana": 175
    },
    "level": 68
  },
  "Student of Decay": {
    "name": "Student of Decay",
    "stats": [
      "25% increased Damage over Time",
      "+13% to Chaos Resistance"
    ],
    "weights": {
      "affliction_chaos_resistance": 1171,
      "affliction_damage_over_time_multiplier": 593,
      "affliction_physical_damage_over_time_multiplier": 343,
      "affliction_fire_damage_over_time_multiplier": 366,
      "affliction_chaos_damage_over_time_multiplier": 348
    },
    "level": 50
  },
  "Aggressive Defence": {
    "name": "Aggressive Defence",
    "stats": [
      "30% increased Fortification Duration",
      "20% increased Damage with Attack Skills while Fortified",
      "Fortifying Hits grant 60% increased Fortification"
    ],
    "weights": {
      "affliction_axe_and_sword_damage": 750,
      "affliction_mace_and_staff_damage": 750,
      "affliction_dagger_and_claw_damage": 750
    },
    "level": 1
  },
  "Holy Word": {
    "name": "Holy Word",
    "stats": [
      "Your Warcries inflict Hallowing Flame"
    ],
    "weights": {
      "affliction_warcry_buff_effect": 873
    },
    "level": 50
  },
  "Fiery Aegis": {
    "name": "Fiery Aegis",
    "stats": [
      "+5% Chance to Block Attack Damage",
      "Hallowing Flame you inflict has 1% increased magnitude per 2% Attack Block chance"
    ],
    "weights": {
      "affliction_chance_to_block": 750
    },
    "level": 50
  }
};
