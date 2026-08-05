// Auto-generated from PoB ConfigOptions.lua - do not edit
// Generated: 2026-08-05
// Source: apps/web/public/data/pob/Modules/ConfigOptions.lua

export interface ConfigOptionDef {
  id: string;
  type: "check" | "number" | "select" | "text";
  label: string;
  section: string;
  options?: { val: string | number; label: string }[];
  defaultIndex?: number;
  visibility?: {
    ifSkill?: string[];
    ifCond?: string[];
    ifFlag?: string[];
    ifSkillData?: string;
    ifMinionCond?: string;
    ifSkillFlag?: string;
  };
}

// 576 config options across 6 sections
// General: 34, Skill Options: 143, Map Modifiers and Player Debuffs: 25, When In Combat: 255, For Effective DPS: 90, Enemy Stats: 29
export const CONFIG_OPTIONS: ConfigOptionDef[] = [
  {
    "id": "resistancePenalty",
    "type": "select",
    "label": "Resistance penalty:",
    "section": "General",
    "options": [
      {
        "val": 0,
        "label": "None"
      },
      {
        "val": -30,
        "label": "Act 5 (-30%)"
      },
      {
        "val": -60,
        "label": "Act 10 (-60%)"
      }
    ],
    "defaultIndex": 3
  },
  {
    "id": "bandit",
    "type": "select",
    "label": "Bandit quest:",
    "section": "General",
    "options": [
      {
        "val": "None",
        "label": "Kill all"
      },
      {
        "val": "Oak",
        "label": "Help Oak"
      },
      {
        "val": "Kraityn",
        "label": "Help Kraityn"
      },
      {
        "val": "Alira",
        "label": "Help Alira"
      }
    ],
    "defaultIndex": 1
  },
  {
    "id": "pantheonMajorGod",
    "type": "select",
    "label": "Major God:",
    "section": "General",
    "options": [
      {
        "val": "None",
        "label": "Nothing"
      },
      {
        "val": "TheBrineKing",
        "label": "Soul of the Brine King"
      },
      {
        "val": "Lunaris",
        "label": "Soul of Lunaris"
      },
      {
        "val": "Solaris",
        "label": "Soul of Solaris"
      },
      {
        "val": "Arakaali",
        "label": "Soul of Arakaali"
      }
    ],
    "defaultIndex": 1
  },
  {
    "id": "pantheonMinorGod",
    "type": "select",
    "label": "Minor God:",
    "section": "General",
    "options": [
      {
        "val": "None",
        "label": "Nothing"
      },
      {
        "val": "Gruthkul",
        "label": "Soul of Gruthkul"
      },
      {
        "val": "Yugul",
        "label": "Soul of Yugul"
      },
      {
        "val": "Abberath",
        "label": "Soul of Abberath"
      },
      {
        "val": "Tukohama",
        "label": "Soul of Tukohama"
      },
      {
        "val": "Garukhan",
        "label": "Soul of Garukhan"
      },
      {
        "val": "Ralakesh",
        "label": "Soul of Ralakesh"
      },
      {
        "val": "Ryslatha",
        "label": "Soul of Ryslatha"
      },
      {
        "val": "Shakari",
        "label": "Soul of Shakari"
      }
    ],
    "defaultIndex": 1
  },
  {
    "id": "detonateDeadCorpseLife",
    "type": "number",
    "label": "Enemy Corpse Life:",
    "section": "General",
    "visibility": {
      "ifSkillData": "explodeCorpse"
    }
  },
  {
    "id": "conditionStationary",
    "type": "number",
    "label": "Time spent stationary",
    "section": "General",
    "visibility": {
      "ifCond": [
        "Stationary"
      ]
    }
  },
  {
    "id": "conditionMoving",
    "type": "check",
    "label": "Are you always moving?",
    "section": "General",
    "visibility": {
      "ifCond": [
        "Moving"
      ]
    }
  },
  {
    "id": "conditionFullLife",
    "type": "check",
    "label": "Are you always on Full Life?",
    "section": "General",
    "visibility": {
      "ifCond": [
        "FullLife"
      ]
    }
  },
  {
    "id": "conditionLowLife",
    "type": "check",
    "label": "Are you always on Low Life?",
    "section": "General",
    "visibility": {
      "ifCond": [
        "LowLife"
      ]
    }
  },
  {
    "id": "conditionFullMana",
    "type": "check",
    "label": "Are you always on Full Mana?",
    "section": "General",
    "visibility": {
      "ifCond": [
        "FullMana"
      ]
    }
  },
  {
    "id": "conditionLowMana",
    "type": "check",
    "label": "Are you always on Low Mana?",
    "section": "General",
    "visibility": {
      "ifCond": [
        "LowMana"
      ]
    }
  },
  {
    "id": "conditionFullEnergyShield",
    "type": "check",
    "label": "Are you always on Full Energy Shield?",
    "section": "General",
    "visibility": {
      "ifCond": [
        "FullEnergyShield"
      ]
    }
  },
  {
    "id": "conditionLowEnergyShield",
    "type": "check",
    "label": "Are you always on Low Energy Shield?",
    "section": "General",
    "visibility": {
      "ifCond": [
        "LowEnergyShield"
      ]
    }
  },
  {
    "id": "conditionHaveEnergyShield",
    "type": "check",
    "label": "Do you always have Energy Shield?",
    "section": "General",
    "visibility": {
      "ifCond": [
        "HaveEnergyShield"
      ]
    }
  },
  {
    "id": "conditionUnbrokenWard",
    "type": "check",
    "label": "Do you have unbroken Ward?",
    "section": "General",
    "visibility": {
      "ifCond": [
        "UnbrokenWard"
      ]
    }
  },
  {
    "id": "minionsConditionFullLife",
    "type": "check",
    "label": "Are your Minions always on Full Life?",
    "section": "General",
    "visibility": {
      "ifMinionCond": "FullLife"
    }
  },
  {
    "id": "minionsConditionLowLife",
    "type": "check",
    "label": "Are your Minions always on Low Life?",
    "section": "General",
    "visibility": {
      "ifMinionCond": "LowLife"
    }
  },
  {
    "id": "minionsConditionFullEnergyShield",
    "type": "check",
    "label": "Minion is always on Full Energy Shield?",
    "section": "General",
    "visibility": {
      "ifMinionCond": "FullEnergyShield"
    }
  },
  {
    "id": "minionsConditionCreatedRecently",
    "type": "check",
    "label": "Have your Minions been created Recently?",
    "section": "General",
    "visibility": {
      "ifCond": [
        "MinionsCreatedRecently"
      ]
    }
  },
  {
    "id": "ailmentMode",
    "type": "select",
    "label": "Ailment calculation mode:",
    "section": "General",
    "options": [
      {
        "val": "AVERAGE",
        "label": "Average"
      },
      {
        "val": "CRIT",
        "label": "Crits Only"
      }
    ]
  },
  {
    "id": "physMode",
    "type": "select",
    "label": "Random element mode:",
    "section": "General",
    "options": [
      {
        "val": "AVERAGE",
        "label": "Average"
      },
      {
        "val": "FIRE",
        "label": "Fire"
      },
      {
        "val": "COLD",
        "label": "Cold"
      },
      {
        "val": "LIGHTNING",
        "label": "Lightning"
      }
    ],
    "visibility": {
      "ifFlag": [
        "randomPhys"
      ]
    }
  },
  {
    "id": "lifeRegenMode",
    "type": "select",
    "label": "Life regen calculation mode:",
    "section": "General",
    "options": [
      {
        "val": "MIN",
        "label": "Minimum"
      },
      {
        "val": "AVERAGE",
        "label": "Average"
      },
      {
        "val": "FULL",
        "label": "Burst"
      }
    ],
    "visibility": {
      "ifCond": [
        "LifeRegenBurstAvg",
        "LifeRegenBurstFull"
      ]
    }
  },
  {
    "id": "resourceGainMode",
    "type": "select",
    "label": "Resource gain calculation mode:",
    "section": "General",
    "options": [
      {
        "val": "MIN",
        "label": "Minimum"
      },
      {
        "val": "AVERAGE",
        "label": "Average"
      },
      {
        "val": "MAX",
        "label": "Maximum"
      }
    ],
    "defaultIndex": 2,
    "visibility": {
      "ifCond": [
        "AverageResourceGain"
      ]
    }
  },
  {
    "id": "EHPUnluckyWorstOf",
    "type": "select",
    "label": "EHP calc unlucky:",
    "section": "General",
    "options": [
      {
        "val": 1,
        "label": "Average"
      },
      {
        "val": 2,
        "label": "Unlucky"
      },
      {
        "val": 4,
        "label": "Very Unlucky"
      }
    ]
  },
  {
    "id": "DisableEHPGainOnBlock",
    "type": "check",
    "label": "Disable EHP gain when hit:",
    "section": "General"
  },
  {
    "id": "armourCalculationMode",
    "type": "select",
    "label": "Armour calculation mode:",
    "section": "General",
    "options": [
      {
        "val": "MIN",
        "label": "Minimum"
      },
      {
        "val": "AVERAGE",
        "label": "Average"
      },
      {
        "val": "MAX",
        "label": "Maximum"
      }
    ],
    "visibility": {
      "ifCond": [
        "ArmourMax",
        "ArmourAvg"
      ]
    }
  },
  {
    "id": "warcryMode",
    "type": "select",
    "label": "Exerted/Boosted calc mode:",
    "section": "General",
    "options": [
      {
        "val": "AVERAGE",
        "label": "Average"
      },
      {
        "val": "MAX",
        "label": "Max Hit"
      }
    ],
    "visibility": {
      "ifSkill": [
        "Fist of War",
        "Infernal Cry",
        "Ancestral Cry",
        "Enduring Cry",
        "General's Cry",
        "Intimidating Cry",
        "Rallying Cry",
        "Seismic Cry",
        "Battlemage's Cry",
        "Vengeful Cry"
      ]
    }
  },
  {
    "id": "EVBypass",
    "type": "check",
    "label": "Disable Emperor's Vigilance Bypass",
    "section": "General",
    "visibility": {
      "ifCond": [
        "EVBypass"
      ]
    }
  },
  {
    "id": "ignoreItemDisablers",
    "type": "check",
    "label": "Don't disable items",
    "section": "General"
  },
  {
    "id": "ignoreJewelLimits",
    "type": "check",
    "label": "Ignore Jewel Limits",
    "section": "General"
  },
  {
    "id": "overrideEmptyRedSockets",
    "type": "number",
    "label": "# of Empty Red Sockets",
    "section": "General"
  },
  {
    "id": "overrideEmptyGreenSockets",
    "type": "number",
    "label": "# of Empty Green Sockets",
    "section": "General"
  },
  {
    "id": "overrideEmptyBlueSockets",
    "type": "number",
    "label": "# of Empty Blue Sockets",
    "section": "General"
  },
  {
    "id": "overrideEmptyWhiteSockets",
    "type": "number",
    "label": "# of Empty White Sockets",
    "section": "General"
  },
  {
    "id": "arcaneCloakUsedRecentlyCheck",
    "type": "check",
    "label": "Include in Mana spent Recently?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Arcane Cloak"
      ]
    }
  },
  {
    "id": "aspectOfTheAvianAviansMight",
    "type": "check",
    "label": "Is Avian's Might active?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Aspect of the Avian"
      ]
    }
  },
  {
    "id": "aspectOfTheAvianAviansFlight",
    "type": "check",
    "label": "Is Avian's Flight active?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Aspect of the Avian"
      ]
    }
  },
  {
    "id": "aspectOfTheCatCatsStealth",
    "type": "check",
    "label": "Is Cat's Stealth active?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Aspect of the Cat"
      ]
    }
  },
  {
    "id": "aspectOfTheCatCatsAgility",
    "type": "check",
    "label": "Is Cat's Agility active?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Aspect of the Cat"
      ]
    }
  },
  {
    "id": "overrideCrabBarriers",
    "type": "number",
    "label": "# of Crab Barriers (if not maximum):",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Aspect of the Crab"
      ]
    }
  },
  {
    "id": "aspectOfTheSpiderWebStacks",
    "type": "number",
    "label": "# of Spider's Web Stacks:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Aspect of the Spider"
      ]
    }
  },
  {
    "id": "bannerPlanted",
    "type": "check",
    "label": "Is Banner Planted?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Dread Banner",
        "War Banner",
        "Defiance Banner"
      ]
    }
  },
  {
    "id": "bannerValour",
    "type": "number",
    "label": "Banner Valour:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Dread Banner",
        "War Banner",
        "Defiance Banner"
      ]
    }
  },
  {
    "id": "barkskinStacks",
    "type": "number",
    "label": "# of Barkskin Stacks:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Barkskin"
      ]
    }
  },
  {
    "id": "Unbound",
    "type": "check",
    "label": "Are you Unbound?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Unbound Avatar"
      ]
    }
  },
  {
    "id": "bladestormInBloodstorm",
    "type": "check",
    "label": "Are you in a Bloodstorm?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Bladestorm"
      ]
    }
  },
  {
    "id": "bladestormInSandstorm",
    "type": "check",
    "label": "Are you in a Sandstorm?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Bladestorm"
      ]
    }
  },
  {
    "id": "bloodsoakedBannerStages",
    "type": "number",
    "label": "# of Bloodsoaked Banner stacks on enemy",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Bloodsoaked Banner"
      ]
    }
  },
  {
    "id": "bloodSacramentReservationEHP",
    "type": "check",
    "label": "Count Skill Reservation towards eHP?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Blood Sacrament"
      ]
    }
  },
  {
    "id": "ActiveBrands",
    "type": "number",
    "label": "# of active Brands:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Armageddon Brand",
        "Storm Brand",
        "Arcanist Brand",
        "Penance Brand",
        "Wintertide Brand"
      ]
    }
  },
  {
    "id": "BrandsAttachedToEnemy",
    "type": "number",
    "label": "# of Brands attached to the enemy:",
    "section": "Skill Options"
  },
  {
    "id": "targetBrandedEnemy",
    "type": "check",
    "label": "Skill is targeting the Branded enemy",
    "section": "Skill Options",
    "visibility": {
      "ifCond": [
        "TargetingBrandedEnemy"
      ]
    }
  },
  {
    "id": "BrandsInLastQuarter",
    "type": "check",
    "label": "Last 25% of attached duration?",
    "section": "Skill Options",
    "visibility": {
      "ifCond": [
        "BrandLastQuarter"
      ]
    }
  },
  {
    "id": "BrandsInLastHalf",
    "type": "check",
    "label": "Last 50% of attached duration?",
    "section": "Skill Options",
    "visibility": {
      "ifCond": [
        "BrandLastHalf"
      ]
    }
  },
  {
    "id": "carrionGolemNearbyMinion",
    "type": "number",
    "label": "# of Nearby Non-Golem Minions:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Summon Carrion Golem"
      ]
    }
  },
  {
    "id": "carrionGolemEqualsChaosGolem",
    "type": "check",
    "label": "# Carrion Golem = # Chaos Golem:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Summon Chaos Golem"
      ],
      "ifCond": [
        "CarrionEqualChaosGolem"
      ]
    }
  },
  {
    "id": "chaosGolemEqualsStoneGolem",
    "type": "check",
    "label": "# Chaos Golem = # Stone Golem:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Summon Stone Golem"
      ],
      "ifCond": [
        "ChaosEqualStoneGolem"
      ]
    }
  },
  {
    "id": "cinderflameStacks",
    "type": "number",
    "label": "# of Cinderflame stacks on enemy:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Cinders"
      ]
    }
  },
  {
    "id": "stoneGolemEqualsCarrionGolem",
    "type": "check",
    "label": "# Stone Golem = # Carrion Golem:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Summon Carrion Golem"
      ],
      "ifCond": [
        "StoneEqualCarrionGolem"
      ]
    }
  },
  {
    "id": "closeCombatCombatRush",
    "type": "check",
    "label": "Is Combat Rush active?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Close Combat"
      ]
    }
  },
  {
    "id": "ColdSnapBypassCD",
    "type": "check",
    "label": "Bypass CD?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Cold Snap"
      ]
    }
  },
  {
    "id": "ConcPathBypassCD",
    "type": "check",
    "label": "Bypass CD?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Consecrated Path of Endurance"
      ]
    }
  },
  {
    "id": "conditionCorruptingCryStages",
    "type": "number",
    "label": "# of Corrupting Cry stacks on enemy",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Corrupting Cry"
      ]
    }
  },
  {
    "id": "overrideCruelty",
    "type": "number",
    "label": "Damage % (if not maximum):",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Cruelty"
      ]
    }
  },
  {
    "id": "channellingCycloneCheck",
    "type": "check",
    "label": "Are you Channelling Cyclone?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Cyclone"
      ]
    }
  },
  {
    "id": "darkPactSkeletonLife",
    "type": "number",
    "label": "Skeleton Life:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Dark Bargain"
      ]
    }
  },
  {
    "id": "divineSentinelPhysAsFire",
    "type": "check",
    "label": "Phys as Fire",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Divine Sentinel"
      ]
    }
  },
  {
    "id": "divineSentinelPhysAsLightning",
    "type": "check",
    "label": "Phys as Lightning",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Divine Sentinel"
      ]
    }
  },
  {
    "id": "divineSentinelRegenLife",
    "type": "check",
    "label": "Regen Life",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Divine Sentinel"
      ]
    }
  },
  {
    "id": "divineSentinelRegenMana",
    "type": "check",
    "label": "Mana Regeneration Rate",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Divine Sentinel"
      ]
    }
  },
  {
    "id": "divineSentinelChaosResistance",
    "type": "check",
    "label": "Chaos Resistance",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Divine Sentinel"
      ]
    }
  },
  {
    "id": "divineSentinelSelfCurseEffect",
    "type": "check",
    "label": "Curse Effect on Self",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Divine Sentinel"
      ]
    }
  },
  {
    "id": "doomBlastSource",
    "type": "select",
    "label": "Doom Blast Trigger Source:",
    "section": "Skill Options",
    "options": [
      {
        "val": "expiration",
        "label": "Curse Expiration"
      },
      {
        "val": "replacement",
        "label": "Curse Replacement"
      },
      {
        "val": "vixen",
        "label": "Vixen's Curse"
      },
      {
        "val": "hexblast",
        "label": "Hexblast Replacement"
      }
    ],
    "defaultIndex": 3,
    "visibility": {
      "ifSkill": [
        "Doom Blast"
      ]
    }
  },
  {
    "id": "curseOverlaps",
    "type": "number",
    "label": "Curse overlaps:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Doom Blast"
      ],
      "ifFlag": [
        "UsesCurseOverlaps"
      ]
    }
  },
  {
    "id": "elementalArmyExposureType",
    "type": "select",
    "label": "Exposure Type:",
    "section": "Skill Options",
    "options": [
      {
        "val": 0,
        "label": "None"
      },
      {
        "val": "Fire",
        "label": "Fire"
      },
      {
        "val": "Cold",
        "label": "Cold"
      },
      {
        "val": "Lightning",
        "label": "Lightning"
      }
    ],
    "visibility": {
      "ifSkill": [
        "Elemental Army"
      ]
    }
  },
  {
    "id": "embraceMadnessActive",
    "type": "check",
    "label": "Is Embrace Madness active?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Embrace Madness"
      ]
    }
  },
  {
    "id": "touchedDebuffsCount",
    "type": "number",
    "label": "Glorious Madness Stacks",
    "section": "Skill Options"
  },
  {
    "id": "feedingFrenzyFeedingFrenzyActive",
    "type": "check",
    "label": "Is Feeding Frenzy active?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Feeding Frenzy"
      ]
    }
  },
  {
    "id": "flameWallAddedDamage",
    "type": "check",
    "label": "Projectile Travelled through Flame Wall?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Flame Wall"
      ]
    }
  },
  {
    "id": "FlickerStrikeBypassCD",
    "type": "check",
    "label": "Bypass CD?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Flicker Strike"
      ]
    }
  },
  {
    "id": "freshMeatBuffs",
    "type": "check",
    "label": "Is Fresh Meat active?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Fresh Meat"
      ]
    }
  },
  {
    "id": "frostShieldStages",
    "type": "number",
    "label": "Stages:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Frost Shield"
      ]
    }
  },
  {
    "id": "Disgorged",
    "type": "check",
    "label": "Is Disgorge active?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Gluttony"
      ]
    }
  },
  {
    "id": "greaterHarbingerOfTimeSlipstream",
    "type": "check",
    "label": "Is Slipstream active?:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Summon Greater Harbinger of Time"
      ]
    }
  },
  {
    "id": "harbingerOfTimeSlipstream",
    "type": "check",
    "label": "Is Slipstream active?:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Summon Harbinger of Time"
      ]
    }
  },
  {
    "id": "multiplierHexDoom",
    "type": "number",
    "label": "Doom on Hex:",
    "section": "Skill Options",
    "visibility": {
      "ifSkillFlag": "hex"
    }
  },
  {
    "id": "heraldOfAgonyVirulenceStack",
    "type": "number",
    "label": "# of Virulence Stacks:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Herald of Agony"
      ]
    }
  },
  {
    "id": "hoaOverkill",
    "type": "number",
    "label": "Overkill damage:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Herald of Ash"
      ]
    }
  },
  {
    "id": "heraldOfTheHivePressure",
    "type": "number",
    "label": "# of Otherworldly Pressure Stacks:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Herald of the Hive"
      ]
    }
  },
  {
    "id": "inventionMineTrapPlacedDuration",
    "type": "number",
    "label": "Placed duration of Mine / Traps:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Invention"
      ]
    }
  },
  {
    "id": "iceNovaCastOnFrostbolt",
    "type": "check",
    "label": "Cast on Frostbolt?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Ice Nova of Frostbolts"
      ]
    }
  },
  {
    "id": "infusedChannellingInfusion",
    "type": "check",
    "label": "Is Infusion active?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Infused Channelling"
      ]
    }
  },
  {
    "id": "innervateInnervation",
    "type": "check",
    "label": "Is Innervation active?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Innervate"
      ]
    }
  },
  {
    "id": "intensifyIntensity",
    "type": "number",
    "label": "# of Intensity:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Intensify",
        "Crackling Lance",
        "Pinpoint"
      ]
    }
  },
  {
    "id": "OverloadedIntensity",
    "type": "number",
    "label": "# of Overloaded Intensity:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Overloaded Intensity"
      ]
    }
  },
  {
    "id": "multiplierLinkedTargets",
    "type": "number",
    "label": "# of linked Targets:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Destructive Link",
        "Flame Link",
        "Intuitive Link",
        "Protective Link",
        "Soul Link",
        "Vampiric Link"
      ]
    }
  },
  {
    "id": "linkedToMinion",
    "type": "check",
    "label": "Linked To Minion?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Destructive Link",
        "Flame Link",
        "Intuitive Link",
        "Protective Link",
        "Soul Link",
        "Vampiric Link"
      ],
      "ifFlag": [
        "Condition:CanLinkToMinions"
      ]
    }
  },
  {
    "id": "linkedSourceRate",
    "type": "number",
    "label": "Source rate for Intuitive Link",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Intuitive Link"
      ]
    }
  },
  {
    "id": "manabondMissingUnreservedManaPercentage",
    "type": "number",
    "label": "Missing Unreserved Mana %:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Manabond"
      ]
    }
  },
  {
    "id": "minionPactLife",
    "type": "number",
    "label": "Damageable Minion Life:",
    "section": "Skill Options"
  },
  {
    "id": "conditionEnemyMalignantMadness",
    "type": "check",
    "label": "Enemy has Malignant Madness?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Eldritch Blasphemy"
      ]
    }
  },
  {
    "id": "meatShieldEnemyNearYou",
    "type": "check",
    "label": "Is the enemy near you?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Meat Shield"
      ]
    }
  },
  {
    "id": "enemyHitMistyReflection",
    "type": "check",
    "label": "Enemy hit by Misty Reflection?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Misty Reflection"
      ]
    }
  },
  {
    "id": "MomentumStacks",
    "type": "number",
    "label": "# of Momentum (if not average):",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Momentum"
      ]
    }
  },
  {
    "id": "MomentumSwiftnessStacks",
    "type": "number",
    "label": "Swiftness # of Momentum Removed:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Momentum"
      ]
    }
  },
  {
    "id": "plagueBearerState",
    "type": "select",
    "label": "State:",
    "section": "Skill Options",
    "options": [
      {
        "val": "INC",
        "label": "Incubating"
      },
      {
        "val": "INF",
        "label": "Infecting"
      }
    ],
    "defaultIndex": 1,
    "visibility": {
      "ifSkill": [
        "Plague Bearer"
      ]
    }
  },
  {
    "id": "perforateSpikeOverlap",
    "type": "number",
    "label": "# of Overlapping Spikes:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Perforate"
      ]
    }
  },
  {
    "id": "physicalAegisDepleted",
    "type": "check",
    "label": "Is Physical Aegis depleted?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Physical Aegis"
      ]
    }
  },
  {
    "id": "deathmarkDeathmarkActive",
    "type": "check",
    "label": "Is the enemy marked with Signal Prey?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Predator"
      ]
    }
  },
  {
    "id": "prideEffect",
    "type": "select",
    "label": "Pride Aura Effect:",
    "section": "Skill Options",
    "options": [
      {
        "val": "MIN",
        "label": "Initial effect"
      },
      {
        "val": "MAX",
        "label": "Maximum effect"
      }
    ],
    "visibility": {
      "ifSkill": [
        "Pride",
        "AzmeriDemonPhysicalDamageAura"
      ]
    }
  },
  {
    "id": "sacrificedRageCount",
    "type": "number",
    "label": "Amount of Rage Sacrificed (if not maximum):",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Rage Vortex"
      ]
    }
  },
  {
    "id": "raiseSpectreEnableBuffs",
    "type": "check",
    "label": "Enable buffs:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Raise Spectre"
      ]
    }
  },
  {
    "id": "raiseSpectreEnableCurses",
    "type": "check",
    "label": "Enable curses:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Raise Spectre"
      ]
    }
  },
  {
    "id": "conditionSummonedSpectreInPast8Sec",
    "type": "check",
    "label": "Summoned Spectre in past 8 Seconds?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Raise Spectre"
      ],
      "ifCond": [
        "SummonedSpectreInPast8Sec"
      ]
    }
  },
  {
    "id": "raiseSpectreBladeVortexBladeCount",
    "type": "number",
    "label": "Blade Vortex blade count:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "DemonModularBladeVortexSpectre",
        "GhostPirateBladeVortexSpectre"
      ]
    }
  },
  {
    "id": "raiseSpectreKaomFireBeamTotemStage",
    "type": "number",
    "label": "Scorching Ray Totem stage count:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "KaomFireBeamTotemSpectre"
      ]
    }
  },
  {
    "id": "raiseSpectreEnableSummonedUrsaRallyingCry",
    "type": "check",
    "label": "Enable Summoned Ursa's Rallying Cry:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "DropBearSummonedRallyingCry"
      ]
    }
  },
  {
    "id": "raiseSpectreEnableSlashingHorrorEnrage",
    "type": "check",
    "label": "Disable Slashing Horror's Enrage:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "AzmeriDualStrikeDemonFireEnrage"
      ]
    }
  },
  {
    "id": "raiseSpectreEnableSanguimancerDemonLowLife",
    "type": "check",
    "label": "Sanguimancer Demon not on Low Life:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "ABTTAzmeriShepherdSpellDamage"
      ]
    }
  },
  {
    "id": "raiseSpidersSpiderCount",
    "type": "number",
    "label": "# of Spiders:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Raise Spiders"
      ]
    }
  },
  {
    "id": "conditionSummonedZombieInPast8Sec",
    "type": "check",
    "label": "Summoned Zombie in past 8 Seconds?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Raise Zombie"
      ],
      "ifCond": [
        "SummonedZombieInPast8Sec"
      ]
    }
  },
  {
    "id": "animateWeaponLingeringBlade",
    "type": "check",
    "label": "Are you animating Lingering Blades?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Animate Weapon",
        "Animate Weapon of Ranged Arms"
      ]
    }
  },
  {
    "id": "ShrapnelBallistaProjectileOverlap",
    "type": "number",
    "label": "# of Shotgunning Projectiles:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Shrapnel Ballista"
      ]
    }
  },
  {
    "id": "sigilOfPowerStages",
    "type": "number",
    "label": "Stages:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Sigil of Power"
      ]
    }
  },
  {
    "id": "siphoningTrapAffectedEnemies",
    "type": "number",
    "label": "# of Enemies affected:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Siphoning Trap"
      ]
    }
  },
  {
    "id": "configSnipeStages",
    "type": "number",
    "label": "# of Snipe stages:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Snipe"
      ]
    }
  },
  {
    "id": "configSpectralTigerCount",
    "type": "number",
    "label": "# of Active Spectral Tigers:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Summon Spectral Tiger"
      ]
    }
  },
  {
    "id": "configSpectralWolfCount",
    "type": "number",
    "label": "# of Active Spectral Wolves:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Summon Spectral Wolf"
      ]
    }
  },
  {
    "id": "bloodSandStance",
    "type": "select",
    "label": "Stance:",
    "section": "Skill Options",
    "options": [
      {
        "val": "BLOOD",
        "label": "Blood Stance"
      },
      {
        "val": "SAND",
        "label": "Sand Stance"
      }
    ],
    "visibility": {
      "ifSkill": [
        "Blood and Sand",
        "Flesh and Stone",
        "Lacerate",
        "Bladestorm",
        "Perforate",
        "Perforate of Duality"
      ]
    }
  },
  {
    "id": "changedStance",
    "type": "check",
    "label": "Changed Stance recently?",
    "section": "Skill Options",
    "visibility": {
      "ifCond": [
        "ChangedStanceRecently"
      ]
    }
  },
  {
    "id": "shardsConsumed",
    "type": "number",
    "label": "Steel Shards consumed:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Splitting Steel of Ammunition",
        "Shattering Steel of Ammunition",
        "Lancing Steel",
        "Shrapnel Ballista of Steel"
      ]
    }
  },
  {
    "id": "steelWards",
    "type": "number",
    "label": "Steel Wards:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Shattering Steel of Ammunition"
      ]
    }
  },
  {
    "id": "stormRainBeamOverlap",
    "type": "number",
    "label": "# of Overlapping Beams:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Storm Rain"
      ]
    }
  },
  {
    "id": "stormRainActiveArrows",
    "type": "number",
    "label": "# of Active Arrows:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Storm Rain of the Conduit"
      ]
    }
  },
  {
    "id": "summonElementalRelicEnableAngerAura",
    "type": "check",
    "label": "Enable Anger Aura:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Summon Elemental Relic"
      ]
    }
  },
  {
    "id": "summonElementalRelicEnableHatredAura",
    "type": "check",
    "label": "Enable Hatred Aura:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Summon Elemental Relic"
      ]
    }
  },
  {
    "id": "summonElementalRelicEnableWrathAura",
    "type": "check",
    "label": "Enable Wrath Aura:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Summon Elemental Relic"
      ]
    }
  },
  {
    "id": "summonHolyRelicEnableHolyRelicBoon",
    "type": "check",
    "label": "Enable Holy Relic's Boon Aura:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Summon Holy Relic"
      ]
    }
  },
  {
    "id": "summonLightningGolemEnableWrath",
    "type": "check",
    "label": "Enable Wrath Aura:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Summon Lightning Golem"
      ]
    }
  },
  {
    "id": "summonReaperConsumeRecently",
    "type": "check",
    "label": "Reaper Consumed recently?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Summon Reaper"
      ]
    }
  },
  {
    "id": "weepingBlackStacks",
    "type": "number",
    "label": "# of Weeping Black stacks on enemy:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Tears of Rot"
      ]
    }
  },
  {
    "id": "nearbyBleedingEnemies",
    "type": "number",
    "label": "# of Nearby Bleeding Enemies:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Thirst for Blood"
      ]
    }
  },
  {
    "id": "tornadoShotSecondaryHitChance",
    "type": "number",
    "label": "% chance for second proj to hit:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Tornado Shot"
      ]
    }
  },
  {
    "id": "toxicRainPodOverlap",
    "type": "number",
    "label": "# of Overlapping Pods:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Toxic Rain"
      ]
    }
  },
  {
    "id": "traumaStacks",
    "type": "number",
    "label": "# of Trauma Stacks:",
    "section": "Skill Options",
    "visibility": {
      "ifFlag": [
        "HasTrauma"
      ]
    }
  },
  {
    "id": "configResonanceCount",
    "type": "number",
    "label": "Lowest Resonance Count:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Trinity"
      ]
    }
  },
  {
    "id": "configUnholyResonanceCount",
    "type": "number",
    "label": "Lowest Resonance Count:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Unholy Trinity"
      ]
    }
  },
  {
    "id": "conditionInsane",
    "type": "check",
    "label": "Are you Insane?",
    "section": "Skill Options",
    "visibility": {
      "ifCond": [
        "Insane"
      ]
    }
  },
  {
    "id": "VigilantStrikeBypassCD",
    "type": "check",
    "label": "Bypass CD?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Vigilant Strike"
      ]
    }
  },
  {
    "id": "voltaxicBurstSpellsQueued",
    "type": "number",
    "label": "# of Casts currently waiting:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Voltaxic Burst"
      ]
    }
  },
  {
    "id": "vortexCastOnFrostbolt",
    "type": "check",
    "label": "Cast on Frostbolt?",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Vortex of Projection"
      ]
    }
  },
  {
    "id": "multiplierWarcryPower",
    "type": "number",
    "label": "Warcry Power:",
    "section": "Skill Options",
    "visibility": {
      "ifFlag": [
        "UsesWarcryPower"
      ]
    }
  },
  {
    "id": "waveOfConvictionExposureType",
    "type": "select",
    "label": "Exposure Type:",
    "section": "Skill Options",
    "options": [
      {
        "val": 0,
        "label": "None"
      },
      {
        "val": "Fire",
        "label": "Fire"
      },
      {
        "val": "Cold",
        "label": "Cold"
      },
      {
        "val": "Lightning",
        "label": "Lightning"
      }
    ],
    "visibility": {
      "ifSkill": [
        "Wave of Conviction"
      ]
    }
  },
  {
    "id": "multiplierWoCExpiredDuration",
    "type": "number",
    "label": "% Wave of Conviction duration expired:",
    "section": "Skill Options"
  },
  {
    "id": "absolutionSkillDamageCountedOnce",
    "type": "check",
    "label": "Absolution: Count skill damage once",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Absolution"
      ]
    }
  },
  {
    "id": "dominatingBlowSkillDamageCountedOnce",
    "type": "check",
    "label": "Dom. Blow: Count skill damage once",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Dominating Blow"
      ]
    }
  },
  {
    "id": "holyStrikeSkillDamageCountedOnce",
    "type": "check",
    "label": "Holy Strike: Count skill damage once",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Holy Strike"
      ]
    }
  },
  {
    "id": "MoltenShellDamageMitigated",
    "type": "number",
    "label": "Damage mitigated:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Molten Shell"
      ]
    }
  },
  {
    "id": "VaalMoltenShellDamageMitigated",
    "type": "number",
    "label": "Damage mitigated:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Vaal Molten Shell"
      ]
    }
  },
  {
    "id": "enemySizePreset",
    "type": "select",
    "label": "Enemy size preset:",
    "section": "Skill Options",
    "options": [
      {
        "val": "Small",
        "label": "Small"
      },
      {
        "val": "Medium",
        "label": "Medium"
      },
      {
        "val": "Large",
        "label": "Large"
      },
      {
        "val": "Huge",
        "label": "Huge"
      }
    ],
    "defaultIndex": 2,
    "visibility": {
      "ifSkill": [
        "Seismic Trap",
        "Lightning Spire Trap",
        "Explosive Trap",
        "Molten Strike"
      ]
    }
  },
  {
    "id": "enemyRadius",
    "type": "number",
    "label": "Enemy radius:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Seismic Trap",
        "Lightning Spire Trap",
        "Explosive Trap",
        "Molten Strike"
      ]
    }
  },
  {
    "id": "TotalMinionLife",
    "type": "number",
    "label": "Minion Life override:",
    "section": "Skill Options"
  },
  {
    "id": "TotalSpectreLife",
    "type": "number",
    "label": "Total Spectre Life override:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Raise Spectre"
      ]
    }
  },
  {
    "id": "TotalTotemLife",
    "type": "number",
    "label": "Nearest Totem Life override:",
    "section": "Skill Options"
  },
  {
    "id": "TotalRadianceSentinelLife",
    "type": "number",
    "label": "Sentinel of Radiance Life override:",
    "section": "Skill Options"
  },
  {
    "id": "TotalVoidSpawnLife",
    "type": "number",
    "label": "Total Void Spawn Life override:",
    "section": "Skill Options"
  },
  {
    "id": "TotalStoneGolemLife",
    "type": "number",
    "label": "Stone Golem Life override:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Summon Stone Golem of Safeguarding"
      ]
    }
  },
  {
    "id": "TotalVaalRejuvenationTotemLife",
    "type": "number",
    "label": "Vaal Rejuvenation Totem Life override:",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Vaal Rejuvenation Totem"
      ]
    }
  },
  {
    "id": "balanceOfTerrorSelfCastConductivity",
    "type": "check",
    "label": "Conductivity self-only",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Conductivity"
      ],
      "ifCond": [
        "SelfCastConductivity"
      ]
    }
  },
  {
    "id": "balanceOfTerrorSelfCastDespair",
    "type": "check",
    "label": "Despair self-only",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Despair"
      ],
      "ifCond": [
        "SelfCastDespair"
      ]
    }
  },
  {
    "id": "balanceOfTerrorSelfCastElementalWeakness",
    "type": "check",
    "label": "Elemental Weakness self-only",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Elemental Weakness"
      ],
      "ifCond": [
        "SelfCastElementalWeakness"
      ]
    }
  },
  {
    "id": "balanceOfTerrorSelfCastEnfeeble",
    "type": "check",
    "label": "Enfeeble self-only",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Enfeeble"
      ],
      "ifCond": [
        "SelfCastEnfeeble"
      ]
    }
  },
  {
    "id": "balanceOfTerrorSelfCastFlammability",
    "type": "check",
    "label": "Flammability self-only",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Flammability"
      ],
      "ifCond": [
        "SelfCastFlammability"
      ]
    }
  },
  {
    "id": "balanceOfTerrorSelfCastFrostbite",
    "type": "check",
    "label": "Frostbite self-only",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Frostbite"
      ],
      "ifCond": [
        "SelfCastFrostbite"
      ]
    }
  },
  {
    "id": "balanceOfTerrorSelfCastPunishment",
    "type": "check",
    "label": "Punishment self-only",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Punishment"
      ],
      "ifCond": [
        "SelfCastPunishment"
      ]
    }
  },
  {
    "id": "balanceOfTerrorSelfCastTemporalChains",
    "type": "check",
    "label": "Temporal Chains self-only",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Temporal Chains"
      ],
      "ifCond": [
        "SelfCastTemporalChains"
      ]
    }
  },
  {
    "id": "balanceOfTerrorSelfCastVulnerability",
    "type": "check",
    "label": "Vulnerability self-only",
    "section": "Skill Options",
    "visibility": {
      "ifSkill": [
        "Vulnerability"
      ],
      "ifCond": [
        "SelfCastVulnerability"
      ]
    }
  },
  {
    "id": "multiplierSextant",
    "type": "number",
    "label": "# of Sextants affecting the area",
    "section": "Map Modifiers and Player Debuffs"
  },
  {
    "id": "multiplierMapModEffect",
    "type": "number",
    "label": "% increased effect of map mods",
    "section": "Map Modifiers and Player Debuffs"
  },
  {
    "id": "multiplierMapModTier",
    "type": "select",
    "label": "Map Tier",
    "section": "Map Modifiers and Player Debuffs",
    "options": [
      {
        "val": "HIGH",
        "label": "Red"
      },
      {
        "val": "MED",
        "label": "Yellow"
      },
      {
        "val": "LOW",
        "label": "White"
      }
    ]
  },
  {
    "id": "MapPrefix1",
    "type": "select",
    "label": "Prefix",
    "section": "Map Modifiers and Player Debuffs"
  },
  {
    "id": "MapPrefix2",
    "type": "select",
    "label": "Prefix",
    "section": "Map Modifiers and Player Debuffs"
  },
  {
    "id": "MapPrefix3",
    "type": "select",
    "label": "Prefix",
    "section": "Map Modifiers and Player Debuffs"
  },
  {
    "id": "MapPrefix4",
    "type": "select",
    "label": "Prefix",
    "section": "Map Modifiers and Player Debuffs"
  },
  {
    "id": "MapSuffix1",
    "type": "select",
    "label": "Suffix",
    "section": "Map Modifiers and Player Debuffs"
  },
  {
    "id": "MapSuffix2",
    "type": "select",
    "label": "Suffix",
    "section": "Map Modifiers and Player Debuffs"
  },
  {
    "id": "MapSuffix3",
    "type": "select",
    "label": "Suffix",
    "section": "Map Modifiers and Player Debuffs"
  },
  {
    "id": "MapSuffix4",
    "type": "select",
    "label": "Suffix",
    "section": "Map Modifiers and Player Debuffs"
  },
  {
    "id": "PvpScaling",
    "type": "check",
    "label": "PvP damage scaling in effect",
    "section": "Map Modifiers and Player Debuffs"
  },
  {
    "id": "playerCursedWithAssassinsMark",
    "type": "number",
    "label": "Assassin's Mark:",
    "section": "Map Modifiers and Player Debuffs"
  },
  {
    "id": "playerCursedWithConductivity",
    "type": "number",
    "label": "Conductivity:",
    "section": "Map Modifiers and Player Debuffs"
  },
  {
    "id": "playerCursedWithDespair",
    "type": "number",
    "label": "Despair:",
    "section": "Map Modifiers and Player Debuffs"
  },
  {
    "id": "playerCursedWithElementalWeakness",
    "type": "number",
    "label": "Elemental Weakness:",
    "section": "Map Modifiers and Player Debuffs"
  },
  {
    "id": "playerCursedWithEnfeeble",
    "type": "number",
    "label": "Enfeeble:",
    "section": "Map Modifiers and Player Debuffs"
  },
  {
    "id": "playerCursedWithFlammability",
    "type": "number",
    "label": "Flammability:",
    "section": "Map Modifiers and Player Debuffs"
  },
  {
    "id": "playerCursedWithFrostbite",
    "type": "number",
    "label": "Frostbite:",
    "section": "Map Modifiers and Player Debuffs"
  },
  {
    "id": "playerCursedWithPoachersMark",
    "type": "number",
    "label": "Poacher's Mark:",
    "section": "Map Modifiers and Player Debuffs"
  },
  {
    "id": "playerCursedWithProjectileWeakness",
    "type": "number",
    "label": "Projectile Weakness:",
    "section": "Map Modifiers and Player Debuffs"
  },
  {
    "id": "playerCursedWithPunishment",
    "type": "number",
    "label": "Punishment:",
    "section": "Map Modifiers and Player Debuffs"
  },
  {
    "id": "playerCursedWithTemporalChains",
    "type": "number",
    "label": "Temporal Chains:",
    "section": "Map Modifiers and Player Debuffs"
  },
  {
    "id": "playerCursedWithVulnerability",
    "type": "number",
    "label": "Vulnerability:",
    "section": "Map Modifiers and Player Debuffs"
  },
  {
    "id": "playerCursedWithWarlordsMark",
    "type": "number",
    "label": "Warlord's Mark:",
    "section": "Map Modifiers and Player Debuffs"
  },
  {
    "id": "usePowerCharges",
    "type": "check",
    "label": "Do you use Power Charges?",
    "section": "When In Combat"
  },
  {
    "id": "overridePowerCharges",
    "type": "number",
    "label": "# of Power Charges (if not maximum):",
    "section": "When In Combat"
  },
  {
    "id": "useFrenzyCharges",
    "type": "check",
    "label": "Do you use Frenzy Charges?",
    "section": "When In Combat"
  },
  {
    "id": "overrideFrenzyCharges",
    "type": "number",
    "label": "# of Frenzy Charges (if not maximum):",
    "section": "When In Combat"
  },
  {
    "id": "useEnduranceCharges",
    "type": "check",
    "label": "Do you use Endurance Charges?",
    "section": "When In Combat"
  },
  {
    "id": "overrideEnduranceCharges",
    "type": "number",
    "label": "# of Endurance Charges (if not maximum):",
    "section": "When In Combat"
  },
  {
    "id": "useSiphoningCharges",
    "type": "check",
    "label": "Do you use Siphoning Charges?",
    "section": "When In Combat"
  },
  {
    "id": "overrideSiphoningCharges",
    "type": "number",
    "label": "# of Siphoning Charges (if not maximum):",
    "section": "When In Combat"
  },
  {
    "id": "useChallengerCharges",
    "type": "check",
    "label": "Do you use Challenger Charges?",
    "section": "When In Combat"
  },
  {
    "id": "overrideChallengerCharges",
    "type": "number",
    "label": "# of Challenger Charges (if not maximum):",
    "section": "When In Combat"
  },
  {
    "id": "useBlitzCharges",
    "type": "check",
    "label": "Do you use Blitz Charges?",
    "section": "When In Combat"
  },
  {
    "id": "overrideBlitzCharges",
    "type": "number",
    "label": "# of Blitz Charges (if not maximum):",
    "section": "When In Combat"
  },
  {
    "id": "multiplierGaleForce",
    "type": "number",
    "label": "# of Gale Force:",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanGainGaleForce"
      ]
    }
  },
  {
    "id": "overrideInspirationCharges",
    "type": "number",
    "label": "# of Inspiration Charges (if not maximum):",
    "section": "When In Combat"
  },
  {
    "id": "useGhostShrouds",
    "type": "check",
    "label": "Do you use Ghost Shrouds?",
    "section": "When In Combat"
  },
  {
    "id": "overrideGhostShrouds",
    "type": "number",
    "label": "# of Ghost Shrouds (if not maximum):",
    "section": "When In Combat"
  },
  {
    "id": "waitForMaxSeals",
    "type": "check",
    "label": "Do you wait for Max Unleash Seals?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "HasSeals"
      ]
    }
  },
  {
    "id": "repeatMode",
    "type": "select",
    "label": "Repeat Mode:",
    "section": "When In Combat",
    "options": [
      {
        "val": "NONE",
        "label": "None"
      },
      {
        "val": "AVERAGE",
        "label": "Average"
      },
      {
        "val": "FINAL",
        "label": "Final only"
      },
      {
        "val": "FINAL_DPS",
        "label": "Final (all hits use final)"
      }
    ],
    "visibility": {
      "ifCond": [
        "alwaysFinalRepeat"
      ]
    }
  },
  {
    "id": "ruthlessSupportMode",
    "type": "select",
    "label": "Ruthless Support Mode:",
    "section": "When In Combat",
    "options": [
      {
        "val": "AVERAGE",
        "label": "Average"
      },
      {
        "val": "MAX",
        "label": "Max Effect"
      }
    ],
    "visibility": {
      "ifSkill": [
        "Ruthless"
      ]
    }
  },
  {
    "id": "ChanceToIgnoreEnemyPhysicalDamageReductionMode",
    "type": "select",
    "label": "Chance To Ignore PDR Mode:",
    "section": "When In Combat",
    "options": [
      {
        "val": "MIN",
        "label": "Minimum"
      },
      {
        "val": "AVERAGE",
        "label": "Average"
      },
      {
        "val": "MAX",
        "label": "Max Effect"
      }
    ],
    "defaultIndex": 2
  },
  {
    "id": "overrideBloodCharges",
    "type": "number",
    "label": "# of Blood Charges (if not maximum):",
    "section": "When In Combat"
  },
  {
    "id": "overrideSpiritCharges",
    "type": "number",
    "label": "# of Spirit Charges:",
    "section": "When In Combat"
  },
  {
    "id": "overrideSpiritInfusion",
    "type": "number",
    "label": "# of Spirit Infusions:",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanGainSpiritInfusion"
      ]
    }
  },
  {
    "id": "minionsUsePowerCharges",
    "type": "check",
    "label": "Do your Minions use Power Charges?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "haveMinion"
      ]
    }
  },
  {
    "id": "minionsUseFrenzyCharges",
    "type": "check",
    "label": "Do your Minions use Frenzy Charges?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "haveMinion"
      ]
    }
  },
  {
    "id": "minionsUseEnduranceCharges",
    "type": "check",
    "label": "Do your Minions use Endur. Charges?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "haveMinion"
      ]
    }
  },
  {
    "id": "minionsOverridePowerCharges",
    "type": "number",
    "label": "# of Power Charges (if not maximum):",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "haveMinion"
      ]
    }
  },
  {
    "id": "minionsOverrideFrenzyCharges",
    "type": "number",
    "label": "# of Frenzy Charges (if not maximum):",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "haveMinion"
      ]
    }
  },
  {
    "id": "minionsOverrideEnduranceCharges",
    "type": "number",
    "label": "# of Endurance Charges (if not maximum):",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "haveMinion"
      ]
    }
  },
  {
    "id": "multiplierRampage",
    "type": "number",
    "label": "# of Rampage Kills:",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:Rampage"
      ]
    }
  },
  {
    "id": "multiplierSoulEater",
    "type": "number",
    "label": "# of Soul Eater Stacks:",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanHaveSoulEater"
      ]
    }
  },
  {
    "id": "multiplierMinionSoulEater",
    "type": "number",
    "label": "# of Minion Soul Eater Stacks:",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:MinionCanHaveSoulEater"
      ]
    }
  },
  {
    "id": "conditionFocused",
    "type": "check",
    "label": "Are you Focused?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "Focused"
      ]
    }
  },
  {
    "id": "buffLifetap",
    "type": "check",
    "label": "Do you have Lifetap?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "Lifetap"
      ]
    }
  },
  {
    "id": "buffOnslaught",
    "type": "check",
    "label": "Do you have Onslaught?",
    "section": "When In Combat"
  },
  {
    "id": "buffArcaneSurge",
    "type": "check",
    "label": "Do you have Arcane Surge?",
    "section": "When In Combat"
  },
  {
    "id": "minionBuffOnslaught",
    "type": "check",
    "label": "Do your minions have Onslaught?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "haveMinion"
      ]
    }
  },
  {
    "id": "buffUnholyMight",
    "type": "check",
    "label": "Do you have Unholy Might?",
    "section": "When In Combat"
  },
  {
    "id": "minionbuffUnholyMight",
    "type": "check",
    "label": "Do your minions have Unholy Might?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "haveMinion"
      ]
    }
  },
  {
    "id": "buffChaoticMight",
    "type": "check",
    "label": "Do you have Chaotic Might?",
    "section": "When In Combat"
  },
  {
    "id": "buffSacrificialZeal",
    "type": "check",
    "label": "Do you have Sacrificial Zeal?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "SacrificialZeal"
      ]
    }
  },
  {
    "id": "minionbuffChaoticMight",
    "type": "check",
    "label": "Do your minions have Chaotic Might?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "haveMinion"
      ]
    }
  },
  {
    "id": "buffPhasing",
    "type": "check",
    "label": "Do you have Phasing?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "Phasing"
      ]
    }
  },
  {
    "id": "buffFortification",
    "type": "check",
    "label": "Are you Fortified?",
    "section": "When In Combat"
  },
  {
    "id": "overrideFortification",
    "type": "number",
    "label": "# of Fortification Stacks (if not maximum):",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:Fortified"
      ]
    }
  },
  {
    "id": "buffTailwind",
    "type": "check",
    "label": "Do you have Tailwind?",
    "section": "When In Combat"
  },
  {
    "id": "buffAdrenaline",
    "type": "check",
    "label": "Do you have Adrenaline?",
    "section": "When In Combat"
  },
  {
    "id": "conditionChangedStanceLastSecond",
    "type": "check",
    "label": "Changed Stance in the last 1s?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "StanceChangeLastSecond"
      ]
    }
  },
  {
    "id": "buffAlchemistsGenius",
    "type": "check",
    "label": "Do you have Alchemist's Genius?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanHaveAlchemistGenius"
      ]
    }
  },
  {
    "id": "buffVaalArcLuckyHits",
    "type": "check",
    "label": "Do you have Vaal Arc's Lucky Buff?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanBeLucky"
      ]
    }
  },
  {
    "id": "buffElusive",
    "type": "check",
    "label": "Are you Elusive?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanBeElusive"
      ]
    }
  },
  {
    "id": "overrideBuffElusive",
    "type": "number",
    "label": "Effect of Elusive (if not average):",
    "section": "When In Combat"
  },
  {
    "id": "buffDivinity",
    "type": "check",
    "label": "Do you have Divinity?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "Divinity"
      ]
    }
  },
  {
    "id": "multiplierDefiance",
    "type": "number",
    "label": "Defiance:",
    "section": "When In Combat"
  },
  {
    "id": "multiplierRage",
    "type": "number",
    "label": "Rage:",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanGainRage"
      ]
    }
  },
  {
    "id": "buffWildSavagery",
    "type": "check",
    "label": "Do you have Wild Savagery?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "WildSavagery"
      ]
    }
  },
  {
    "id": "conditionLeeching",
    "type": "check",
    "label": "Are you Leeching?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "Leeching"
      ]
    }
  },
  {
    "id": "conditionLeechingLife",
    "type": "check",
    "label": "Are you Leeching Life?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "LeechingLife"
      ]
    }
  },
  {
    "id": "conditionLeechingEnergyShield",
    "type": "check",
    "label": "Are you Leeching Energy Shield?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "LeechingEnergyShield"
      ]
    }
  },
  {
    "id": "conditionLeechingMana",
    "type": "check",
    "label": "Are you Leeching Mana?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "LeechingMana"
      ]
    }
  },
  {
    "id": "minionsConditionLeechingEnergyShield",
    "type": "check",
    "label": "Minion is Leeching Energy Shield?",
    "section": "When In Combat",
    "visibility": {
      "ifMinionCond": "LeechingEnergyShield"
    }
  },
  {
    "id": "conditionUsingFlask",
    "type": "check",
    "label": "Do you have a Flask active?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "UsingFlask"
      ]
    }
  },
  {
    "id": "conditionUsedAmethystFlaskRecently",
    "type": "check",
    "label": "Used an Amethyst Flask recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "UsedAmethystFlaskRecently"
      ]
    }
  },
  {
    "id": "conditionUsedRubyFlaskRecently",
    "type": "check",
    "label": "Used a Ruby Flask recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "UsedRubyFlaskRecently"
      ]
    }
  },
  {
    "id": "conditionUsedSapphireFlaskRecently",
    "type": "check",
    "label": "Used a Sapphire Flask recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "UsedSapphireFlaskRecently"
      ]
    }
  },
  {
    "id": "conditionUsedTopazFlaskRecently",
    "type": "check",
    "label": "Used a Topaz Flask recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "UsedTopazFlaskRecently"
      ]
    }
  },
  {
    "id": "conditionUsingTincture",
    "type": "check",
    "label": "Do you have a Tincture active?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "UsingTincture"
      ]
    }
  },
  {
    "id": "multiplierManaBurnStacks",
    "type": "number",
    "label": "Mana Burn Stacks:",
    "section": "When In Combat"
  },
  {
    "id": "conditionHaveTotem",
    "type": "check",
    "label": "Do you have a Totem summoned?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "HaveTotem"
      ]
    }
  },
  {
    "id": "conditionSummonedTotemRecently",
    "type": "check",
    "label": "Have you Summoned a Totem Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "SummonedTotemRecently"
      ]
    }
  },
  {
    "id": "TotemsSummoned",
    "type": "number",
    "label": "# of Summoned Totems (if not maximum):",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "totem"
      ]
    }
  },
  {
    "id": "conditionSummonedGolemInPast8Sec",
    "type": "check",
    "label": "Summoned Golem in past 8 Seconds?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "SummonedGolemInPast8Sec"
      ]
    }
  },
  {
    "id": "conditionSummonedGolemInPast10Sec",
    "type": "check",
    "label": "Summoned Golem in past 10 Seconds?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "SummonedGolemInPast10Sec"
      ]
    }
  },
  {
    "id": "multiplierNearbyAlly",
    "type": "number",
    "label": "# of Nearby Allies:",
    "section": "When In Combat"
  },
  {
    "id": "multiplierNearbyCorpse",
    "type": "number",
    "label": "# of Nearby Corpses:",
    "section": "When In Combat"
  },
  {
    "id": "multiplierSummonedMinion",
    "type": "number",
    "label": "# of Summoned Minions (if not maximum):",
    "section": "When In Combat"
  },
  {
    "id": "multiplierNonVaalSummonedMinion",
    "type": "number",
    "label": "# of non-vaal skill Summoned Minions:",
    "section": "When In Combat"
  },
  {
    "id": "conditionOnConsecratedGround",
    "type": "check",
    "label": "Are you on Consecrated Ground?",
    "section": "When In Combat"
  },
  {
    "id": "conditionOnProfaneGround",
    "type": "check",
    "label": "Are you on Profane Ground?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "OnProfaneGround"
      ]
    }
  },
  {
    "id": "minionConditionOnProfaneGround",
    "type": "check",
    "label": "Minion on Profane Ground?",
    "section": "When In Combat",
    "visibility": {
      "ifMinionCond": "OnProfaneGround"
    }
  },
  {
    "id": "conditionOnBrineGround",
    "type": "check",
    "label": "Are you on Brine Ground?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "CanCreateBrineGround"
      ]
    }
  },
  {
    "id": "minionConditionOnBrineGround",
    "type": "check",
    "label": "Minion on Brine Ground?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "CanCreateBrineGround"
      ]
    }
  },
  {
    "id": "conditionOnCausticGround",
    "type": "check",
    "label": "Are you on Caustic Ground?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "OnCausticGround"
      ]
    }
  },
  {
    "id": "conditionOnFungalGround",
    "type": "check",
    "label": "Are you on Fungal Ground?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "OnFungalGround",
        "CreateFungalGround"
      ]
    }
  },
  {
    "id": "conditionOnBurningGround",
    "type": "check",
    "label": "Are you on Burning Ground?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "OnBurningGround"
      ]
    }
  },
  {
    "id": "conditionOnChilledGround",
    "type": "check",
    "label": "Are you on Chilled Ground?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "OnChilledGround"
      ]
    }
  },
  {
    "id": "conditionOnShockedGround",
    "type": "check",
    "label": "Are you on Shocked Ground?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "OnShockedGround"
      ]
    }
  },
  {
    "id": "conditionBlinded",
    "type": "check",
    "label": "Are you Blinded?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "Blinded"
      ]
    }
  },
  {
    "id": "conditionBurning",
    "type": "check",
    "label": "Are you Burning?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "Burning"
      ]
    }
  },
  {
    "id": "conditionIgnited",
    "type": "check",
    "label": "Are you Ignited?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "Ignited"
      ]
    }
  },
  {
    "id": "conditionScorched",
    "type": "check",
    "label": "Are you Scorched?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "Scorched"
      ]
    }
  },
  {
    "id": "conditionChilled",
    "type": "check",
    "label": "Are you Chilled?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "Chilled"
      ]
    }
  },
  {
    "id": "conditionChilledEffect",
    "type": "number",
    "label": "Effect of Chill:",
    "section": "When In Combat"
  },
  {
    "id": "conditionFrozen",
    "type": "check",
    "label": "Are you Frozen?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "Frozen"
      ]
    }
  },
  {
    "id": "conditionBrittle",
    "type": "check",
    "label": "Are you Brittle?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "Brittle"
      ]
    }
  },
  {
    "id": "conditionShocked",
    "type": "check",
    "label": "Are you Shocked?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "Shocked"
      ]
    }
  },
  {
    "id": "conditionPlayerShockEffect",
    "type": "number",
    "label": "Effect of Shock:",
    "section": "When In Combat"
  },
  {
    "id": "conditionSapped",
    "type": "check",
    "label": "Are you Sapped?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "Sapped"
      ]
    }
  },
  {
    "id": "conditionBleeding",
    "type": "check",
    "label": "Are you Bleeding?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "Bleeding"
      ]
    }
  },
  {
    "id": "conditionPoisoned",
    "type": "check",
    "label": "Are you Poisoned?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "Poisoned"
      ]
    }
  },
  {
    "id": "conditionCanBeCurseImmune",
    "type": "check",
    "label": "Are you Immune to Curses?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanBeCurseImmune"
      ]
    }
  },
  {
    "id": "multiplierPoisonOnSelf",
    "type": "number",
    "label": "# of Poison on You:",
    "section": "When In Combat"
  },
  {
    "id": "multiplierWitheredStackCountSelf",
    "type": "number",
    "label": "# of Withered Stacks on you:",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanBeWithered"
      ]
    }
  },
  {
    "id": "multiplierNearbyEnemies",
    "type": "number",
    "label": "# of nearby Enemies:",
    "section": "When In Combat"
  },
  {
    "id": "multiplierNearbyRareOrUniqueEnemies",
    "type": "number",
    "label": "# of nearby Rare or Unique Enemies:",
    "section": "When In Combat"
  },
  {
    "id": "conditionHitRecently",
    "type": "check",
    "label": "Have you Hit Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "HitRecently"
      ]
    }
  },
  {
    "id": "conditionHitSpellRecently",
    "type": "check",
    "label": "Have you Hit with a Spell Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "HitSpellRecently"
      ]
    }
  },
  {
    "id": "conditionCritRecently",
    "type": "check",
    "label": "Have you Crit Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "CritRecently"
      ]
    }
  },
  {
    "id": "conditionSkillCritRecently",
    "type": "check",
    "label": "Have your Skills Crit Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "SkillCritRecently"
      ]
    }
  },
  {
    "id": "conditionCritWithHeraldSkillRecently",
    "type": "check",
    "label": "Have your Herald Skills Crit Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "CritWithHeraldSkillRecently"
      ]
    }
  },
  {
    "id": "multiplierCritRecently",
    "type": "number",
    "label": "# of times your Attacks have Crit Recently:",
    "section": "When In Combat"
  },
  {
    "id": "LostNonVaalBuffRecently",
    "type": "check",
    "label": "Lost a Non-Vaal Guard Skill buff recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "LostNonVaalBuffRecently"
      ]
    }
  },
  {
    "id": "conditionNonCritRecently",
    "type": "check",
    "label": "Have you dealt a Non-Crit Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "NonCritRecently"
      ]
    }
  },
  {
    "id": "conditionChannelling",
    "type": "check",
    "label": "Are you Channelling?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "Channelling"
      ]
    }
  },
  {
    "id": "multiplierChannelling",
    "type": "number",
    "label": "Channeling for # seconds:",
    "section": "When In Combat"
  },
  {
    "id": "conditionHitRecentlyWithWeapon",
    "type": "check",
    "label": "Have you Hit Recently with Your Weapon?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "HitRecentlyWithWeapon"
      ]
    }
  },
  {
    "id": "conditionKilledRecently",
    "type": "check",
    "label": "Have you Killed Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "KilledRecently"
      ]
    }
  },
  {
    "id": "multiplierKilledRecently",
    "type": "number",
    "label": "# of Enemies Killed Recently:",
    "section": "When In Combat"
  },
  {
    "id": "conditionKilledLast3Seconds",
    "type": "check",
    "label": "Have you Killed in the last 3 Seconds?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "KilledLast3Seconds"
      ]
    }
  },
  {
    "id": "conditionKilledPoisonedLast2Seconds",
    "type": "check",
    "label": "Killed a poisoned enemy in the last 2 Seconds?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "KilledPoisonedLast2Seconds"
      ]
    }
  },
  {
    "id": "conditionKilledTauntedEnemyRecently",
    "type": "check",
    "label": "Killed a taunted enemy recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "KilledTauntedEnemyRecently"
      ]
    }
  },
  {
    "id": "conditionTotemsNotSummonedInPastTwoSeconds",
    "type": "check",
    "label": "No summoned Totems in the past 2 seconds?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "NoSummonedTotemsInPastTwoSeconds"
      ]
    }
  },
  {
    "id": "conditionTotemsKilledRecently",
    "type": "check",
    "label": "Have your Totems Killed Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "TotemsKilledRecently"
      ]
    }
  },
  {
    "id": "conditionTotemsHitRecently",
    "type": "check",
    "label": "Have your Totems Hit Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "HitRecently"
      ]
    }
  },
  {
    "id": "conditionTotemsHitSpellRecently",
    "type": "check",
    "label": "Have your Totems Hit with a Spell Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "TotemsHitSpellRecently"
      ]
    }
  },
  {
    "id": "conditionUsedBrandRecently",
    "type": "check",
    "label": "Have you used a Brand Skill recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "UsedBrandRecently"
      ]
    }
  },
  {
    "id": "multiplierTotemsKilledRecently",
    "type": "number",
    "label": "# of Enemies Killed by Totems Recently:",
    "section": "When In Combat"
  },
  {
    "id": "conditionMinionsKilledRecently",
    "type": "check",
    "label": "Have your Minions Killed Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "MinionsKilledRecently"
      ]
    }
  },
  {
    "id": "conditionMinionsDiedRecently",
    "type": "check",
    "label": "Has a Minion Died Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "MinionsDiedRecently"
      ]
    }
  },
  {
    "id": "multiplierMinionsKilledRecently",
    "type": "number",
    "label": "# of Enemies Killed by Minions Recently:",
    "section": "When In Combat"
  },
  {
    "id": "conditionKilledAffectedByDoT",
    "type": "check",
    "label": "Killed enemy affected by your DoT Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "KilledAffectedByDotRecently"
      ]
    }
  },
  {
    "id": "multiplierShockedEnemyKilledRecently",
    "type": "number",
    "label": "# of Shocked Enemies Killed Recently:",
    "section": "When In Combat"
  },
  {
    "id": "multiplierShockedNonShockedEnemyRecently",
    "type": "number",
    "label": "# of Non-Shocked Enemies Shocked  Recently:",
    "section": "When In Combat"
  },
  {
    "id": "conditionFrozenEnemyRecently",
    "type": "check",
    "label": "Have you Frozen an enemy Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "FrozenEnemyRecently"
      ]
    }
  },
  {
    "id": "conditionChilledEnemyRecently",
    "type": "check",
    "label": "Have you Chilled an enemy Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "ChilledEnemyRecently"
      ]
    }
  },
  {
    "id": "conditionShatteredEnemyRecently",
    "type": "check",
    "label": "Have you Shattered an enemy Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "ShatteredEnemyRecently"
      ]
    }
  },
  {
    "id": "conditionIgnitedEnemyRecently",
    "type": "check",
    "label": "Have you Ignited an enemy Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "IgnitedEnemyRecently"
      ]
    }
  },
  {
    "id": "multiplierIgniteAppliedRecently",
    "type": "number",
    "label": "# of Ignites applied Recently:",
    "section": "When In Combat"
  },
  {
    "id": "conditionShockedEnemyRecently",
    "type": "check",
    "label": "Have you Shocked an enemy Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "ShockedEnemyRecently"
      ]
    }
  },
  {
    "id": "conditionStunnedEnemyRecently",
    "type": "check",
    "label": "Have you Stunned an enemy Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "StunnedEnemyRecently"
      ]
    }
  },
  {
    "id": "conditionStunnedRecently",
    "type": "check",
    "label": "Have you been Stunned Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "StunnedRecently"
      ]
    }
  },
  {
    "id": "conditionPoisonedEnemyRecently",
    "type": "check",
    "label": "Have you Poisoned an enemy Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "PoisonedEnemyRecently"
      ]
    }
  },
  {
    "id": "multiplierPoisonAppliedRecently",
    "type": "number",
    "label": "# of Poisons applied Recently:",
    "section": "When In Combat"
  },
  {
    "id": "multiplierLifeSpentRecently",
    "type": "number",
    "label": "# of Life spent Recently:",
    "section": "When In Combat"
  },
  {
    "id": "multiplierManaSpentRecently",
    "type": "number",
    "label": "# of Mana spent Recently:",
    "section": "When In Combat"
  },
  {
    "id": "conditionWardBrokenPast2Seconds",
    "type": "check",
    "label": "Has your Ward broken in the past 2s?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "WardBrokenPast2Seconds"
      ]
    }
  },
  {
    "id": "conditionBeenHitRecently",
    "type": "check",
    "label": "Have you been Hit Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "BeenHitRecently"
      ]
    }
  },
  {
    "id": "multiplierBeenHitRecently",
    "type": "number",
    "label": "# of times you have been Hit Recently:",
    "section": "When In Combat"
  },
  {
    "id": "conditionBeenHitByAttackRecently",
    "type": "check",
    "label": "Have you been Hit by an Attack Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "BeenHitByAttackRecently"
      ]
    }
  },
  {
    "id": "conditionBeenCritRecently",
    "type": "check",
    "label": "Have you been Crit Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "BeenCritRecently"
      ]
    }
  },
  {
    "id": "conditionConsumed12SteelShardsRecently",
    "type": "check",
    "label": "Consumed 12 Steel Shards Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "Consumed12SteelShardsRecently"
      ]
    }
  },
  {
    "id": "conditionGainedPowerChargeRecently",
    "type": "check",
    "label": "Gained a Power Charge Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "GainedPowerChargeRecently"
      ]
    }
  },
  {
    "id": "conditionGainedFrenzyChargeRecently",
    "type": "check",
    "label": "Gained a Frenzy Charge Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "GainedFrenzyChargeRecently"
      ]
    }
  },
  {
    "id": "conditionBeenSavageHitRecently",
    "type": "check",
    "label": "Have you taken a Savage Hit Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "BeenSavageHitRecently"
      ]
    }
  },
  {
    "id": "conditionHitByFireDamageRecently",
    "type": "check",
    "label": "Have you been hit by Fire Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "HitByFireDamageRecently"
      ]
    }
  },
  {
    "id": "conditionHitByColdDamageRecently",
    "type": "check",
    "label": "Have you been hit by Cold Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "HitByColdDamageRecently"
      ]
    }
  },
  {
    "id": "conditionHitByLightningDamageRecently",
    "type": "check",
    "label": "Have you been hit by Light. Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "HitByLightningDamageRecently"
      ]
    }
  },
  {
    "id": "conditionHitBySpellDamageRecently",
    "type": "check",
    "label": "Have you taken Spell Damage Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "HitBySpellDamageRecently"
      ]
    }
  },
  {
    "id": "conditionTakenFireDamageFromEnemyHitRecently",
    "type": "check",
    "label": "Taken Fire Damage from enemy Hit Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "TakenFireDamageFromEnemyHitRecently"
      ]
    }
  },
  {
    "id": "conditionBlockedRecently",
    "type": "check",
    "label": "Have you Blocked Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "BlockedRecently"
      ]
    }
  },
  {
    "id": "conditionBlockedAttackRecently",
    "type": "check",
    "label": "Have you Blocked an Attack Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "BlockedAttackRecently"
      ]
    }
  },
  {
    "id": "conditionBlockedSpellRecently",
    "type": "check",
    "label": "Have you Blocked a Spell Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "BlockedSpellRecently"
      ]
    }
  },
  {
    "id": "conditionEnergyShieldRechargeRecently",
    "type": "check",
    "label": "Energy Shield Recharge started Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "EnergyShieldRechargeRecently"
      ]
    }
  },
  {
    "id": "conditionEnergyShieldRechargePastTwoSec",
    "type": "check",
    "label": "ES Recharge started past 2 seconds?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "EnergyShieldRechargePastTwoSec"
      ]
    }
  },
  {
    "id": "conditionStoppedTakingDamageOverTimeRecently",
    "type": "check",
    "label": "Have you stopped taking DoT recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "StoppedTakingDamageOverTimeRecently"
      ]
    }
  },
  {
    "id": "conditionConvergence",
    "type": "check",
    "label": "Do you have Convergence?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanGainConvergence"
      ]
    }
  },
  {
    "id": "buffPendulum",
    "type": "select",
    "label": "Is Pendulum of Destruction active?",
    "section": "When In Combat",
    "options": [
      {
        "val": 0,
        "label": "None"
      },
      {
        "val": "AREA",
        "label": "Area of Effect"
      },
      {
        "val": "DAMAGE",
        "label": "Elemental Damage"
      }
    ],
    "visibility": {
      "ifCond": [
        "PendulumOfDestructionAreaOfEffect"
      ]
    }
  },
  {
    "id": "buffConflux",
    "type": "select",
    "label": "Conflux Buff:",
    "section": "When In Combat",
    "options": [
      {
        "val": 0,
        "label": "None"
      },
      {
        "val": "CHILLING",
        "label": "Chilling"
      },
      {
        "val": "SHOCKING",
        "label": "Shocking"
      },
      {
        "val": "IGNITING",
        "label": "Igniting"
      },
      {
        "val": "ALL",
        "label": "Chill + Shock + Ignite"
      }
    ],
    "visibility": {
      "ifCond": [
        "ChillingConflux"
      ]
    }
  },
  {
    "id": "highestDamageType",
    "type": "select",
    "label": "Highest damage type Override:",
    "section": "When In Combat",
    "options": [
      {
        "val": "NONE",
        "label": "Default"
      },
      {
        "val": "Physical",
        "label": "Physical"
      },
      {
        "val": "Lightning",
        "label": "Lightning"
      },
      {
        "val": "Cold",
        "label": "Cold"
      },
      {
        "val": "Fire",
        "label": "Fire"
      },
      {
        "val": "Chaos",
        "label": "Chaos"
      }
    ],
    "visibility": {
      "ifFlag": [
        "ChecksHighestDamage"
      ]
    }
  },
  {
    "id": "buffHeartstopper",
    "type": "select",
    "label": "Heartstopper Mode:",
    "section": "When In Combat",
    "options": [
      {
        "val": 0,
        "label": "None"
      },
      {
        "val": "AVERAGE",
        "label": "Average"
      },
      {
        "val": "HIT",
        "label": "Hit"
      },
      {
        "val": "DOT",
        "label": "Damage over Time"
      }
    ],
    "visibility": {
      "ifCond": [
        "HeartstopperHIT"
      ]
    }
  },
  {
    "id": "buffBastionOfHope",
    "type": "check",
    "label": "Is Bastion of Hope active?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "BastionOfHopeActive"
      ]
    }
  },
  {
    "id": "buffNgamahuFlamesAdvance",
    "type": "check",
    "label": "Is Magmatic Strikes active?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "NgamahuFlamesAdvance"
      ]
    }
  },
  {
    "id": "buffHerEmbrace",
    "type": "check",
    "label": "Are you in Her Embrace?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "HerEmbrace"
      ]
    }
  },
  {
    "id": "conditionChampionIntimidate",
    "type": "check",
    "label": "Is Champion's Intimidate active?",
    "section": "When In Combat"
  },
  {
    "id": "conditionUsedSkillRecently",
    "type": "check",
    "label": "Have you used a Skill Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "UsedSkillRecently"
      ]
    }
  },
  {
    "id": "multiplierSkillUsedRecently",
    "type": "number",
    "label": "# of Skills Used Recently:",
    "section": "When In Combat"
  },
  {
    "id": "conditionAttackedRecently",
    "type": "check",
    "label": "Have you Attacked Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "AttackedRecently"
      ]
    }
  },
  {
    "id": "conditionCastSpellRecently",
    "type": "check",
    "label": "Have you Cast a Spell Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "CastSpellRecently"
      ]
    }
  },
  {
    "id": "multiplierNonInstantSpellCastRecently",
    "type": "number",
    "label": "# of Non-Instant Spells Cast Recently:",
    "section": "When In Combat"
  },
  {
    "id": "multiplierAppliedAilmentsRecently",
    "type": "number",
    "label": "# of Recently Applied Ailments:",
    "section": "When In Combat"
  },
  {
    "id": "conditionLinkedRecently",
    "type": "check",
    "label": "Have you Linked recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "LinkedRecently"
      ]
    }
  },
  {
    "id": "conditionStunnedWhileCastingRecently",
    "type": "check",
    "label": "Stunned while Casting Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "StunnedWhileCastingRecently"
      ]
    }
  },
  {
    "id": "conditionCastLast1Seconds",
    "type": "check",
    "label": "Have you Cast a Spell in the last second?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "CastLast1Seconds"
      ]
    }
  },
  {
    "id": "multiplierCastLast8Seconds",
    "type": "number",
    "label": "How many spells cast in the last 8 seconds?",
    "section": "When In Combat"
  },
  {
    "id": "conditionSuppressedRecently",
    "type": "check",
    "label": "Have you Suppressed Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "SuppressedRecently"
      ]
    }
  },
  {
    "id": "multiplierHitsSuppressedRecently",
    "type": "number",
    "label": "# of Hits Suppressed Recently:",
    "section": "When In Combat"
  },
  {
    "id": "conditionUsedFireSkillRecently",
    "type": "check",
    "label": "Have you used a Fire Skill Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "UsedFireSkillRecently"
      ]
    }
  },
  {
    "id": "conditionUsedColdSkillRecently",
    "type": "check",
    "label": "Have you used a Cold Skill Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "UsedColdSkillRecently"
      ]
    }
  },
  {
    "id": "conditionUsedMinionSkillRecently",
    "type": "check",
    "label": "Have you used a Minion Skill Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "UsedMinionSkillRecently"
      ]
    }
  },
  {
    "id": "conditionUsedTravelSkillRecently",
    "type": "check",
    "label": "Have you used a Travel Skill Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "UsedTravelSkillRecently"
      ]
    }
  },
  {
    "id": "conditionUsedDashRecently",
    "type": "check",
    "label": "Have you cast Dash Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "CastDashRecently"
      ]
    }
  },
  {
    "id": "conditionUsedMovementSkillRecently",
    "type": "check",
    "label": "Have you used a Movement Skill Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "UsedMovementSkillRecently"
      ]
    }
  },
  {
    "id": "conditionUsedVaalSkillRecently",
    "type": "check",
    "label": "Have you used a Vaal Skill Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "UsedVaalSkillRecently"
      ]
    }
  },
  {
    "id": "multiplierUsedVaalSkillInPast8Seconds",
    "type": "number",
    "label": "# of Vaal Skills used in the past 8 Seconds:",
    "section": "When In Combat"
  },
  {
    "id": "conditionSoulGainPrevention",
    "type": "check",
    "label": "Do you have Soul Gain Prevention?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "SoulGainPrevention"
      ]
    }
  },
  {
    "id": "conditionSacrificeMinion",
    "type": "check",
    "label": "Sacrifice Minion on Attack",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "SacrificeMinionOnAttack"
      ],
      "ifFlag": [
        "Condition:HaveDamageableMinion"
      ]
    }
  },
  {
    "id": "conditionUsedWarcryRecently",
    "type": "check",
    "label": "Have you used a Warcry Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "UsedWarcryRecently"
      ],
      "ifFlag": [
        "warcry"
      ]
    }
  },
  {
    "id": "conditionUsedWarcryInPast8Seconds",
    "type": "check",
    "label": "Used a Warcry in the past 8 seconds?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "UsedWarcryInPast8Seconds"
      ]
    }
  },
  {
    "id": "multiplierAffectedByWarcryBuffDuration",
    "type": "number",
    "label": "# of seconds Affected by a Warcry Buff:",
    "section": "When In Combat"
  },
  {
    "id": "DetonatedMinesRecently",
    "type": "check",
    "label": "Have you Detonated a Mine Recently",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "DetonatedMinesRecently"
      ]
    }
  },
  {
    "id": "multiplierMineDetonatedRecently",
    "type": "number",
    "label": "# of Mines Detonated Recently:",
    "section": "When In Combat"
  },
  {
    "id": "minesPerThrow",
    "type": "number",
    "label": "# of Mines per throw:",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "mine"
      ]
    }
  },
  {
    "id": "TriggeredTrapsRecently",
    "type": "check",
    "label": "Have you Triggered a Trap Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "TriggeredTrapsRecently"
      ]
    }
  },
  {
    "id": "multiplierTrapTriggeredRecently",
    "type": "number",
    "label": "# of Traps Triggered Recently:",
    "section": "When In Combat"
  },
  {
    "id": "conditionThrownTrapOrMineRecently",
    "type": "check",
    "label": "Have you thrown a Trap or Mine Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "TrapOrMineThrownRecently"
      ]
    }
  },
  {
    "id": "trapsPerThrow",
    "type": "number",
    "label": "# of Traps per throw:",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "trap"
      ]
    }
  },
  {
    "id": "conditionCursedEnemyRecently",
    "type": "check",
    "label": "Have you Cursed an enemy Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "CursedEnemyRecently"
      ]
    }
  },
  {
    "id": "conditionCastMarkRecently",
    "type": "check",
    "label": "Have you cast a Mark Spell Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "CastMarkRecently"
      ]
    }
  },
  {
    "id": "conditionSpawnedCorpseRecently",
    "type": "check",
    "label": "Spawned a corpse Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "SpawnedCorpseRecently"
      ]
    }
  },
  {
    "id": "conditionConsumedCorpseRecently",
    "type": "check",
    "label": "Consumed a corpse Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "ConsumedCorpseRecently"
      ]
    }
  },
  {
    "id": "conditionConsumedCorpseInPast2Sec",
    "type": "check",
    "label": "Consumed a corpse in the past 2s?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "ConsumedCorpseInPast2Sec"
      ]
    }
  },
  {
    "id": "multiplierCorpseConsumedRecently",
    "type": "number",
    "label": "# of Corpses Consumed Recently:",
    "section": "When In Combat"
  },
  {
    "id": "conditionRavenousCorpseConsumed",
    "type": "check",
    "label": "Has Ravenous consumed a corpse?",
    "section": "When In Combat",
    "visibility": {
      "ifSkill": [
        "Ravenous"
      ]
    }
  },
  {
    "id": "multiplierWarcryUsedRecently",
    "type": "number",
    "label": "# of Warcries Used Recently:",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "warcry"
      ]
    }
  },
  {
    "id": "conditionTauntedEnemyRecently",
    "type": "check",
    "label": "Taunted an enemy Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "TauntedEnemyRecently"
      ]
    }
  },
  {
    "id": "conditionLostEnduranceChargeInPast8Sec",
    "type": "check",
    "label": "Lost an Endurance Charge in the past 8s?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "LostEnduranceChargeInPast8Sec"
      ]
    }
  },
  {
    "id": "multiplierEnduranceChargesLostRecently",
    "type": "number",
    "label": "# of Endurance Charges lost Recently:",
    "section": "When In Combat"
  },
  {
    "id": "conditionBlockedHitFromUniqueEnemyInPast10Sec",
    "type": "check",
    "label": "Blocked a Hit from a Unique enemy in the past 10s?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "BlockedHitFromUniqueEnemyInPast10Sec"
      ]
    }
  },
  {
    "id": "conditionKilledUniqueEnemy",
    "type": "check",
    "label": "Killed a Rare or Unique enemy Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "KilledUniqueEnemy"
      ]
    }
  },
  {
    "id": "BlockedPast10Sec",
    "type": "number",
    "label": "Number of times you've Blocked in the past 10s",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "BlockedHitFromUniqueEnemyInPast10Sec"
      ]
    }
  },
  {
    "id": "conditionImpaledRecently",
    "type": "check",
    "label": "Impaled an enemy recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "ImpaledRecently"
      ]
    }
  },
  {
    "id": "multiplierImpalesOnEnemy",
    "type": "number",
    "label": "# of Impales on enemy (if not maximum):",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "impale"
      ]
    }
  },
  {
    "id": "conditionCausedBleedingRecently",
    "type": "check",
    "label": "Have you caused Bleeding Recently?",
    "section": "When In Combat",
    "visibility": {
      "ifCond": [
        "CausedBleedingRecently"
      ]
    }
  },
  {
    "id": "multiplierBleedsOnEnemy",
    "type": "number",
    "label": "# of Bleeds on enemy (if not maximum):",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:HaveCrimsonDance"
      ]
    }
  },
  {
    "id": "multiplierFragileRegrowth",
    "type": "number",
    "label": "# of Fragile Regrowth Stacks:",
    "section": "When In Combat"
  },
  {
    "id": "conditionHaveArborix",
    "type": "check",
    "label": "Do you have Iron Reflexes?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:HaveArborix"
      ]
    }
  },
  {
    "id": "conditionHaveAugyre",
    "type": "select",
    "label": "Augyre rotating buff:",
    "section": "When In Combat",
    "options": [
      {
        "val": "EleOverload",
        "label": "Elemental Overload"
      },
      {
        "val": "ResTechnique",
        "label": "Resolute Technique"
      }
    ],
    "visibility": {
      "ifFlag": [
        "Condition:HaveAugyre"
      ]
    }
  },
  {
    "id": "conditionHaveVulconus",
    "type": "check",
    "label": "Do you have Avatar Of Fire?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:HaveVulconus"
      ]
    }
  },
  {
    "id": "conditionHaveManaStorm",
    "type": "check",
    "label": "Do you have Manastorm's Buff?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:HaveManaStorm"
      ]
    }
  },
  {
    "id": "GamblesprintMovementSpeed",
    "type": "select",
    "label": "Gamblesprint Movement Speed",
    "section": "When In Combat",
    "defaultIndex": 5,
    "visibility": {
      "ifFlag": [
        "Condition:HaveGamblesprint"
      ]
    }
  },
  {
    "id": "EverlastingSacrifice",
    "type": "check",
    "label": "Do you have Everlasting Sacrifice?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:EverlastingSacrifice"
      ]
    }
  },
  {
    "id": "buffFanaticism",
    "type": "check",
    "label": "Do you have Fanaticism?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanGainFanaticism"
      ]
    }
  },
  {
    "id": "conditionHitsAlwaysStun",
    "type": "check",
    "label": "Do your hits always stun?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:maceMasteryStunCullSpecced"
      ]
    }
  },
  {
    "id": "multiplierPvpTvalueOverride",
    "type": "number",
    "label": "PvP Tvalue override (ms):",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "isPvP"
      ]
    }
  },
  {
    "id": "multiplierPvpDamage",
    "type": "number",
    "label": "Custom PvP Damage multiplier percent:",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "isPvP"
      ]
    }
  },
  {
    "id": "buffAccelerationShrine",
    "type": "check",
    "label": "Have Acceleration Shrine?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanHaveRegularShrines"
      ]
    }
  },
  {
    "id": "buffBrutalShrine",
    "type": "check",
    "label": "Have Brutal Shrine?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanHaveRegularShrines"
      ]
    }
  },
  {
    "id": "buffDiamondShrine",
    "type": "check",
    "label": "Have Diamond Shrine?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanHaveRegularShrines"
      ]
    }
  },
  {
    "id": "buffDivineShrine",
    "type": "check",
    "label": "Have Divine Shrine?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanHaveRegularShrines"
      ]
    }
  },
  {
    "id": "buffEchoingShrine",
    "type": "check",
    "label": "Have Echoing Shrine?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanHaveRegularShrines"
      ]
    }
  },
  {
    "id": "buffGloomShrine",
    "type": "check",
    "label": "Have Gloom Shrine?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanHaveRegularShrines"
      ]
    }
  },
  {
    "id": "buffGreaterFreezingShrine",
    "type": "check",
    "label": "Have Greater Freezing Shrine?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanHaveRegularShrines"
      ]
    }
  },
  {
    "id": "buffGreaterShockingShrine",
    "type": "check",
    "label": "Have Greater Shocking Shrine?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanHaveRegularShrines"
      ]
    }
  },
  {
    "id": "buffGreaterSkeletalShrine",
    "type": "check",
    "label": "Have Greater Skeletal Shrine?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanHaveRegularShrines"
      ]
    }
  },
  {
    "id": "buffImpenetrableShrine",
    "type": "check",
    "label": "Have Impenetrable Shrine?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanHaveRegularShrines"
      ]
    }
  },
  {
    "id": "buffMassiveShrine",
    "type": "check",
    "label": "Have Massive Shrine?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanHaveRegularShrines"
      ]
    }
  },
  {
    "id": "buffReplenishingShrine",
    "type": "check",
    "label": "Have Replenishing Shrine?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanHaveRegularShrines"
      ]
    }
  },
  {
    "id": "buffResistanceShrine",
    "type": "check",
    "label": "Have Resistance Shrine?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanHaveRegularShrines"
      ]
    }
  },
  {
    "id": "buffResonatingShrine",
    "type": "check",
    "label": "Have Resonating Shrine?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanHaveRegularShrines"
      ]
    }
  },
  {
    "id": "buffLesserAccelerationShrine",
    "type": "check",
    "label": "Have Lesser Acceleration Shrine?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanHaveLesserShrines"
      ]
    }
  },
  {
    "id": "buffLesserBrutalShrine",
    "type": "check",
    "label": "Have Lesser Brutal Shrine?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanHaveLesserShrines"
      ]
    }
  },
  {
    "id": "buffLesserImpenetrableShrine",
    "type": "check",
    "label": "Have Lesser Impenetrable Shrine?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanHaveLesserShrines"
      ]
    }
  },
  {
    "id": "buffLesserMassiveShrine",
    "type": "check",
    "label": "Have Lesser Massive Shrine?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanHaveLesserShrines"
      ]
    }
  },
  {
    "id": "buffLesserReplenishingShrine",
    "type": "check",
    "label": "Have Lesser Replenishing Shrine?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanHaveLesserShrines"
      ]
    }
  },
  {
    "id": "buffLesserResistanceShrine",
    "type": "check",
    "label": "Have Lesser Resistance Shrine?",
    "section": "When In Combat",
    "visibility": {
      "ifFlag": [
        "Condition:CanHaveLesserShrines"
      ]
    }
  },
  {
    "id": "skillForkCount",
    "type": "number",
    "label": "# of times Skill has Forked:",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "forking"
      ]
    }
  },
  {
    "id": "skillChainCount",
    "type": "number",
    "label": "# of times Skill has Chained:",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "chaining"
      ]
    }
  },
  {
    "id": "skillPierceCount",
    "type": "number",
    "label": "# of times Skill has Pierced:",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "piercing"
      ]
    }
  },
  {
    "id": "meleeDistance",
    "type": "number",
    "label": "Melee distance to enemy:",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "melee"
      ]
    }
  },
  {
    "id": "projectileDistance",
    "type": "number",
    "label": "Projectile travel distance:",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "projectile"
      ]
    }
  },
  {
    "id": "conditionAtCloseRange",
    "type": "check",
    "label": "Is the enemy at Close Range?",
    "section": "For Effective DPS",
    "visibility": {
      "ifCond": [
        "AtCloseRange"
      ]
    }
  },
  {
    "id": "enemyMultiplierEnemyPresenceSeconds",
    "type": "number",
    "label": "Enemy in Your Presence Duration",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyMoving",
    "type": "check",
    "label": "Is the enemy Moving?",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyFullLife",
    "type": "check",
    "label": "Is the enemy on Full Life?",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyLowLife",
    "type": "check",
    "label": "Is the enemy on Low Life?",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyCursed",
    "type": "check",
    "label": "Is the enemy Cursed?",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyStunned",
    "type": "check",
    "label": "Is the enemy Stunned?",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyBleeding",
    "type": "check",
    "label": "Is the enemy Bleeding?",
    "section": "For Effective DPS"
  },
  {
    "id": "overrideBleedStackPotential",
    "type": "number",
    "label": "Bleed Stack Potential override:",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionSingleBleed",
    "type": "check",
    "label": "Cap to Single Bleed on enemy?",
    "section": "For Effective DPS",
    "visibility": {
      "ifCond": [
        "SingleBleed"
      ]
    }
  },
  {
    "id": "multiplierRuptureStacks",
    "type": "number",
    "label": "# of Rupture stacks?",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "Condition:CanInflictRupture"
      ]
    }
  },
  {
    "id": "conditionEnemyPoisoned",
    "type": "check",
    "label": "Is the enemy Poisoned?",
    "section": "For Effective DPS"
  },
  {
    "id": "multiplierPoisonOnEnemy",
    "type": "number",
    "label": "# of Poison on enemy:",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionNonPoisonedOnly",
    "type": "check",
    "label": "Is the enemy non-Poisoned?",
    "section": "For Effective DPS",
    "visibility": {
      "ifCond": [
        "NonPoisonedOnly"
      ]
    }
  },
  {
    "id": "multiplierCurseExpiredOnEnemy",
    "type": "number",
    "label": "#% of Curse Expired on enemy:",
    "section": "For Effective DPS"
  },
  {
    "id": "multiplierCurseDurationExpiredOnEnemy",
    "type": "number",
    "label": "Curse Duration Expired on enemy:",
    "section": "For Effective DPS"
  },
  {
    "id": "multiplierWitheredStackCount",
    "type": "number",
    "label": "# of Withered Stacks:",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "Condition:CanWither"
      ]
    }
  },
  {
    "id": "multiplierCorrosionStackCount",
    "type": "number",
    "label": "# of Corrosion Stacks:",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "Condition:CanCorrode"
      ]
    }
  },
  {
    "id": "multiplierEnsnaredStackCount",
    "type": "number",
    "label": "# of Ensnare Stacks:",
    "section": "For Effective DPS",
    "visibility": {
      "ifSkill": [
        "Ensnaring Arrow"
      ]
    }
  },
  {
    "id": "conditionEnemyMaimed",
    "type": "check",
    "label": "Is the enemy Maimed?",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyHindered",
    "type": "check",
    "label": "Is the enemy Hindered?",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyExcommunicated",
    "type": "check",
    "label": "Is the enemy Excommunicated?",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "Condition:CanExcommunicate"
      ]
    }
  },
  {
    "id": "conditionEnemyBlinded",
    "type": "check",
    "label": "Is the enemy Blinded?",
    "section": "For Effective DPS"
  },
  {
    "id": "overrideBuffBlinded",
    "type": "number",
    "label": "Effect of Blind (if not maximum):",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyTaunted",
    "type": "check",
    "label": "Is the enemy Taunted?",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyDebilitated",
    "type": "check",
    "label": "Is the enemy Debilitated?",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyPacified",
    "type": "check",
    "label": "Is the enemy Pacified?",
    "section": "For Effective DPS",
    "visibility": {
      "ifSkill": [
        "Pacify"
      ]
    }
  },
  {
    "id": "conditionEnemyBurning",
    "type": "check",
    "label": "Is the enemy Burning?",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyIgnited",
    "type": "check",
    "label": "Is the enemy Ignited?",
    "section": "For Effective DPS"
  },
  {
    "id": "overrideIgniteStackPotential",
    "type": "number",
    "label": "Ignite Stack Potential override:",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyScorched",
    "type": "check",
    "label": "Is the enemy Scorched?",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "inflictScorch"
      ]
    }
  },
  {
    "id": "conditionScorchedEffect",
    "type": "number",
    "label": "Effect of Scorched:",
    "section": "For Effective DPS"
  },
  {
    "id": "ScorchStacks",
    "type": "number",
    "label": "Scorch Stacks",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "ScorchCanStack"
      ]
    }
  },
  {
    "id": "conditionEnemyOnScorchedGround",
    "type": "check",
    "label": "Is the enemy on Scorched Ground?",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyChilled",
    "type": "check",
    "label": "Is the enemy Chilled?",
    "section": "For Effective DPS"
  },
  {
    "id": "multiplierChilledByYouSeconds",
    "type": "number",
    "label": "Seconds of chill on enemy?",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyChilledEffect",
    "type": "number",
    "label": "Effect of Chill:",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyChilledByYourHits",
    "type": "check",
    "label": "Is the enemy Chilled by your Hits?",
    "section": "For Effective DPS"
  },
  {
    "id": "HoarfrostStacks",
    "type": "number",
    "label": "Hoarfrost Stacks",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "HitsCanInflictHoarfrost"
      ]
    }
  },
  {
    "id": "multiplierBarnacleStacks",
    "type": "number",
    "label": "Barnacle Stacks",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "CanInflictBarnacles"
      ]
    }
  },
  {
    "id": "conditionEnemyFrozen",
    "type": "check",
    "label": "Is the enemy Frozen?",
    "section": "For Effective DPS"
  },
  {
    "id": "multiplierFrozenByYouSeconds",
    "type": "number",
    "label": "Seconds of freeze on enemy?",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyBrittle",
    "type": "check",
    "label": "Is the enemy Brittle?",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "inflictBrittle"
      ]
    }
  },
  {
    "id": "conditionBrittleEffect",
    "type": "number",
    "label": "Effect of Brittle:",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyOnBrittleGround",
    "type": "check",
    "label": "Is the enemy on Brittle Ground?",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyShocked",
    "type": "check",
    "label": "Is the enemy Shocked?",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionShockEffect",
    "type": "number",
    "label": "Effect of Shock:",
    "section": "For Effective DPS"
  },
  {
    "id": "ShockStacks",
    "type": "number",
    "label": "Shock Stacks",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "ShockCanStack"
      ]
    }
  },
  {
    "id": "conditionEnemyOnShockedGround",
    "type": "check",
    "label": "Is the enemy on Shocked Ground?",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemySapped",
    "type": "check",
    "label": "Is the enemy Sapped?",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "inflictSap"
      ]
    }
  },
  {
    "id": "conditionSapEffect",
    "type": "number",
    "label": "Effect of Sap:",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyOnSappedGround",
    "type": "check",
    "label": "Is the enemy on Sapped Ground?",
    "section": "For Effective DPS"
  },
  {
    "id": "multiplierFreezeShockIgniteOnEnemy",
    "type": "number",
    "label": "# of Freeze / Shock / Ignite on enemy:",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyFireExposure",
    "type": "check",
    "label": "Is the enemy Exposed to Fire?",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "applyFireExposure"
      ]
    }
  },
  {
    "id": "conditionEnemyColdExposure",
    "type": "check",
    "label": "Is the enemy Exposed to Cold?",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "applyColdExposure"
      ]
    }
  },
  {
    "id": "conditionEnemyLightningExposure",
    "type": "check",
    "label": "Is the enemy Exposed to Lightning?",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "applyLightningExposure"
      ]
    }
  },
  {
    "id": "conditionEnemyIntimidated",
    "type": "check",
    "label": "Is the enemy Intimidated?",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyCrushed",
    "type": "check",
    "label": "Is the enemy Crushed?",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyHallowingFlame",
    "type": "check",
    "label": "Is enemy affected by Hallowing Flame?",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "Condition:CanInflictHallowingFlame"
      ]
    }
  },
  {
    "id": "multiplierEnemyHallowingFlame",
    "type": "number",
    "label": "Hallowing Flame stacks",
    "section": "For Effective DPS"
  },
  {
    "id": "multiplierHallowingFlameStacksRemovedByAlly",
    "type": "number",
    "label": "Hallowing Flames removed by an ally recently",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionHallowingFlameMagnitude",
    "type": "number",
    "label": "Inc. magnitude of Hallowing Flame stacks",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionNearLinkedTarget",
    "type": "check",
    "label": "Is the enemy near you Linked target?",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyUnnerved",
    "type": "check",
    "label": "Is the enemy Unnerved?",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyCoveredInAsh",
    "type": "check",
    "label": "Is the enemy covered in Ash?",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyCoveredInFrost",
    "type": "check",
    "label": "Is the enemy covered in Frost?",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyOnConsecratedGround",
    "type": "check",
    "label": "Is the enemy on Consecrated Ground?",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyHaveEnergyShield",
    "type": "check",
    "label": "Does the enemy have Energy Shield?",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyOnProfaneGround",
    "type": "check",
    "label": "Is the enemy on Profane Ground?",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "Condition:CreateProfaneGround"
      ]
    }
  },
  {
    "id": "multiplierEnemyAffectedByGraspingVines",
    "type": "number",
    "label": "# of Grasping Vines affecting enemy:",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyOnFungalGround",
    "type": "check",
    "label": "Is the enemy on Fungal Ground?",
    "section": "For Effective DPS",
    "visibility": {
      "ifCond": [
        "OnFungalGround",
        "CreateFungalGround"
      ]
    }
  },
  {
    "id": "conditionEnemyOnBrineGround",
    "type": "check",
    "label": "Is the enemy on Brine Ground?",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "CanCreateBrineGround"
      ]
    }
  },
  {
    "id": "conditionEnemyInChillingArea",
    "type": "check",
    "label": "Is the enemy in a Chilling area?",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyInFrostGlobe",
    "type": "check",
    "label": "Is the enemy in the Frost Shield area?",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyLifeHigherThanPlayer",
    "type": "check",
    "label": "Is the enemy Life% higher than yours?",
    "section": "For Effective DPS"
  },
  {
    "id": "enemyConditionHitByFireDamage",
    "type": "check",
    "label": "Enemy was Hit by Fire Damage?",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "ElementalEquilibrium"
      ]
    }
  },
  {
    "id": "enemyConditionHitByColdDamage",
    "type": "check",
    "label": "Enemy was Hit by Cold Damage?",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "ElementalEquilibrium"
      ]
    }
  },
  {
    "id": "enemyConditionHitByLightningDamage",
    "type": "check",
    "label": "Enemy was Hit by Light. Damage?",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "ElementalEquilibrium"
      ]
    }
  },
  {
    "id": "enemyInRFOrScorchingRay",
    "type": "check",
    "label": "Is the enemy in RF or Scorching Ray:",
    "section": "For Effective DPS",
    "visibility": {
      "ifSkill": [
        "Righteous Fire",
        "Scorching Ray"
      ],
      "ifCond": [
        "InRFOrScorchingRay"
      ]
    }
  },
  {
    "id": "EEIgnoreHitDamage",
    "type": "check",
    "label": "Ignore Skill Hit Damage?",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "ElementalEquilibrium"
      ]
    }
  },
  {
    "id": "conditionBetweenYouAndLinkedTarget",
    "type": "check",
    "label": "Is the enemy in your Link beams?",
    "section": "For Effective DPS"
  },
  {
    "id": "conditionEnemyFireResZero",
    "type": "check",
    "label": "Enemy hit you with Fire Damage?",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "Condition:HaveTrickstersSmile"
      ]
    }
  },
  {
    "id": "conditionEnemyColdResZero",
    "type": "check",
    "label": "Enemy hit you with Cold Damage?",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "Condition:HaveTrickstersSmile"
      ]
    }
  },
  {
    "id": "conditionEnemyLightningResZero",
    "type": "check",
    "label": "Enemy hit you with Light. Damage?",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "Condition:HaveTrickstersSmile"
      ]
    }
  },
  {
    "id": "maniaDebuffsCount",
    "type": "number",
    "label": "# of Mania Stacks",
    "section": "For Effective DPS",
    "visibility": {
      "ifFlag": [
        "Condition:CanInflictMania"
      ]
    }
  },
  {
    "id": "enemyLevel",
    "type": "number",
    "label": "Enemy Level:",
    "section": "Enemy Stats"
  },
  {
    "id": "conditionEnemyRareOrUnique",
    "type": "check",
    "label": "Is the enemy Rare or Unique?",
    "section": "Enemy Stats"
  },
  {
    "id": "enemyIsBoss",
    "type": "select",
    "label": "Is the enemy a Boss?",
    "section": "Enemy Stats",
    "options": [
      {
        "val": "None",
        "label": "No"
      },
      {
        "val": "Boss",
        "label": "Standard Boss"
      },
      {
        "val": "Pinnacle",
        "label": "Guardian/Pinnacle Boss"
      },
      {
        "val": "Uber",
        "label": "Uber Pinnacle Boss"
      }
    ],
    "defaultIndex": 3
  },
  {
    "id": "deliriousPercentage",
    "type": "select",
    "label": "Delirious Effect:",
    "section": "Enemy Stats",
    "options": [
      {
        "val": 0,
        "label": "None"
      },
      {
        "val": "20Percent",
        "label": "20% Delirious"
      },
      {
        "val": "40Percent",
        "label": "40% Delirious"
      },
      {
        "val": "60Percent",
        "label": "60% Delirious"
      },
      {
        "val": "80Percent",
        "label": "80% Delirious"
      },
      {
        "val": "100Percent",
        "label": "100% Delirious"
      }
    ]
  },
  {
    "id": "enemyPhysicalReduction",
    "type": "number",
    "label": "Enemy Phys. Damage Reduction:",
    "section": "Enemy Stats"
  },
  {
    "id": "enemyLightningResist",
    "type": "number",
    "label": "Enemy Lightning Resistance:",
    "section": "Enemy Stats"
  },
  {
    "id": "enemyColdResist",
    "type": "number",
    "label": "Enemy Cold Resistance:",
    "section": "Enemy Stats"
  },
  {
    "id": "enemyFireResist",
    "type": "number",
    "label": "Enemy Fire Resistance:",
    "section": "Enemy Stats"
  },
  {
    "id": "enemyChaosResist",
    "type": "number",
    "label": "Enemy Chaos Resistance:",
    "section": "Enemy Stats"
  },
  {
    "id": "enemyMaxResist",
    "type": "check",
    "label": "Enemy Max Resistance is always 75%",
    "section": "Enemy Stats"
  },
  {
    "id": "enemyBlockChance",
    "type": "number",
    "label": "Enemy Block Chance:",
    "section": "Enemy Stats"
  },
  {
    "id": "enemyEvasion",
    "type": "number",
    "label": "Enemy Base Evasion:",
    "section": "Enemy Stats"
  },
  {
    "id": "enemyArmour",
    "type": "number",
    "label": "Enemy Base Armour:",
    "section": "Enemy Stats"
  },
  {
    "id": "presetBossSkills",
    "type": "select",
    "label": "Boss Skill Preset",
    "section": "Enemy Stats",
    "defaultIndex": 1
  },
  {
    "id": "enemyDamageRollRange",
    "type": "number",
    "label": "Enemy Skill Roll Range %:",
    "section": "Enemy Stats",
    "visibility": {
      "ifFlag": [
        "BossSkillActive"
      ]
    }
  },
  {
    "id": "enemyDamageType",
    "type": "select",
    "label": "Enemy Damage Type:",
    "section": "Enemy Stats",
    "options": [
      {
        "val": "Average",
        "label": "Average"
      },
      {
        "val": "Untyped",
        "label": "Untyped"
      },
      {
        "val": "DamageOverTime",
        "label": "Damage Over Time"
      },
      {
        "val": "Melee",
        "label": "Melee"
      },
      {
        "val": "Projectile",
        "label": "Projectile"
      },
      {
        "val": "Spell",
        "label": "Spell"
      },
      {
        "val": "SpellProjectile",
        "label": "Projectile Spell"
      }
    ]
  },
  {
    "id": "enemySpeed",
    "type": "number",
    "label": "Enemy attack / cast time in ms:",
    "section": "Enemy Stats"
  },
  {
    "id": "enemyMultiplierPvpDamage",
    "type": "number",
    "label": "Custom PvP Damage multiplier percent:",
    "section": "Enemy Stats",
    "visibility": {
      "ifFlag": [
        "isPvP"
      ]
    }
  },
  {
    "id": "enemyCritChance",
    "type": "number",
    "label": "Enemy critical strike chance:",
    "section": "Enemy Stats"
  },
  {
    "id": "enemyCritDamage",
    "type": "number",
    "label": "Enemy critical strike multiplier:",
    "section": "Enemy Stats"
  },
  {
    "id": "enemyPhysicalDamage",
    "type": "number",
    "label": "Enemy Skill Physical Damage:",
    "section": "Enemy Stats"
  },
  {
    "id": "enemyPhysicalOverwhelm",
    "type": "number",
    "label": "Enemy Skill Physical Overwhelm:",
    "section": "Enemy Stats"
  },
  {
    "id": "enemyLightningDamage",
    "type": "number",
    "label": "Enemy Skill Lightning Damage:",
    "section": "Enemy Stats"
  },
  {
    "id": "enemyLightningPen",
    "type": "number",
    "label": "Enemy Skill Lightning Pen:",
    "section": "Enemy Stats"
  },
  {
    "id": "enemyColdDamage",
    "type": "number",
    "label": "Enemy Skill Cold Damage:",
    "section": "Enemy Stats"
  },
  {
    "id": "enemyColdPen",
    "type": "number",
    "label": "Enemy Skill Cold Pen:",
    "section": "Enemy Stats"
  },
  {
    "id": "enemyFireDamage",
    "type": "number",
    "label": "Enemy Skill Fire Damage:",
    "section": "Enemy Stats"
  },
  {
    "id": "enemyFirePen",
    "type": "number",
    "label": "Enemy Skill Fire Pen:",
    "section": "Enemy Stats"
  },
  {
    "id": "enemyChaosDamage",
    "type": "number",
    "label": "Enemy Skill Chaos Damage:",
    "section": "Enemy Stats"
  }
];

export const CONFIG_SECTIONS = ["General","Skill Options","Map Modifiers and Player Debuffs","When In Combat","For Effective DPS","Enemy Stats"] as const;
