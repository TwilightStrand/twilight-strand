use crate::Modifier;

#[derive(Clone, Debug)]
pub struct WatchersEyeMod {
    pub aura: &'static str,
    pub description: &'static str,
    pub modifiers: Vec<Modifier>,
}

/// Watcher's Eye mod table: (aura, description, stat, mid-range value, mod_type).
///
/// Values use mid-range from PoB game data (WatchersEye.lua). Each aura carries
/// its 3-5 most build-impactful mods; binary/utility mods (immunities, unaffected-by)
/// are skipped because they don't map to a numeric Modifier.
pub const WATCHERS_EYE_MODS: &[(&str, &str, &str, f64, &str)] = &[
    // -----------------------------------------------------------------------
    // Determination
    // -----------------------------------------------------------------------
    ("Determination", "+(600-1000) to Armour while affected by Determination", "Armour", 800.0, "flat"),
    ("Determination", "(5-8)% additional Physical Damage Reduction while affected by Determination", "PhysicalDamageReduction", 6.0, "flat"),
    ("Determination", "+(5-8)% Chance to Block Attack Damage while affected by Determination", "BlockChance", 6.0, "flat"),
    ("Determination", "You take (40-60)% reduced Extra Damage from Critical Strikes while affected by Determination", "ReducedCritDamageTaken", 50.0, "flat"),

    // -----------------------------------------------------------------------
    // Grace
    // -----------------------------------------------------------------------
    ("Grace", "+(5-8)% chance to Evade Attack Hits while affected by Grace", "EvadeChance", 6.0, "flat"),
    ("Grace", "+(12-15)% chance to Suppress Spell Damage while affected by Grace", "SpellSuppressionChance", 13.0, "flat"),
    ("Grace", "(10-15)% increased Movement Speed while affected by Grace", "MovementSpeed", 12.0, "increased"),
    ("Grace", "(30-50)% chance to Blind Enemies which Hit you while affected by Grace", "BlindOnHit", 40.0, "flat"),

    // -----------------------------------------------------------------------
    // Discipline
    // -----------------------------------------------------------------------
    ("Discipline", "Regenerate (1.5-2.5)% of Energy Shield per Second while affected by Discipline", "ESRegen", 2.0, "flat"),
    ("Discipline", "(30-40)% faster start of Energy Shield Recharge while affected by Discipline", "ESRechargeRate", 35.0, "increased"),
    ("Discipline", "Gain (20-30) Energy Shield per Enemy Hit while affected by Discipline", "ESOnHit", 25.0, "flat"),
    ("Discipline", "(10-15)% increased Energy Shield Recovery Rate while affected by Discipline", "ESRecoveryRate", 12.0, "increased"),
    ("Discipline", "+(5-8)% Chance to Block Spell Damage while affected by Discipline", "SpellBlockChance", 6.0, "flat"),

    // -----------------------------------------------------------------------
    // Hatred
    // -----------------------------------------------------------------------
    ("Hatred", "(40-60)% increased Cold Damage while affected by Hatred", "ColdDamage", 50.0, "increased"),
    ("Hatred", "Damage Penetrates (10-15)% Cold Resistance while affected by Hatred", "ColdPenetration", 12.0, "flat"),
    ("Hatred", "+(1.2-1.8)% to Critical Strike Chance while affected by Hatred", "CritChance", 1.5, "flat"),
    ("Hatred", "Adds (58-70) to (88-104) Cold Damage while affected by Hatred", "ColdDamageFlat", 80.0, "flat"),
    ("Hatred", "(25-40)% of Physical Damage Converted to Cold Damage while affected by Hatred", "PhysToConvertCold", 32.0, "flat"),

    // -----------------------------------------------------------------------
    // Wrath
    // -----------------------------------------------------------------------
    ("Wrath", "(40-60)% increased Lightning Damage while affected by Wrath", "LightningDamage", 50.0, "increased"),
    ("Wrath", "Damage Penetrates (10-15)% Lightning Resistance while affected by Wrath", "LightningPenetration", 12.0, "flat"),
    ("Wrath", "Gain (15-25)% of Physical Damage as Extra Lightning Damage while affected by Wrath", "PhysAsExtraLightning", 20.0, "flat"),
    ("Wrath", "(25-40)% of Physical Damage Converted to Lightning Damage while affected by Wrath", "PhysToConvertLightning", 32.0, "flat"),
    ("Wrath", "(70-100)% increased Critical Strike Chance while affected by Wrath", "CritChance", 85.0, "increased"),

    // -----------------------------------------------------------------------
    // Anger
    // -----------------------------------------------------------------------
    ("Anger", "(40-60)% increased Fire Damage while affected by Anger", "FireDamage", 50.0, "increased"),
    ("Anger", "Damage Penetrates (10-15)% Fire Resistance while affected by Anger", "FirePenetration", 12.0, "flat"),
    ("Anger", "Gain (15-25)% of Physical Damage as Extra Fire Damage while affected by Anger", "PhysAsExtraFire", 20.0, "flat"),
    ("Anger", "(25-40)% of Physical Damage Converted to Fire Damage while affected by Anger", "PhysToConvertFire", 32.0, "flat"),
    ("Anger", "+(30-50)% to Critical Strike Multiplier while affected by Anger", "CritMultiplier", 40.0, "flat"),

    // -----------------------------------------------------------------------
    // Zealotry
    // -----------------------------------------------------------------------
    ("Zealotry", "(100-120)% increased Critical Strike Chance against Enemies on Consecrated Ground while affected by Zealotry", "CritChance", 110.0, "increased"),
    ("Zealotry", "Consecrated Ground you create while affected by Zealotry causes enemies to take (8-10)% increased Damage", "EnemyDamageTaken", 9.0, "increased"),
    ("Zealotry", "Critical Strikes Penetrate (8-10)% of Enemy Elemental Resistances while affected by Zealotry", "EleResistPenetration", 9.0, "flat"),
    ("Zealotry", "(10-15)% increased Cast Speed while affected by Zealotry", "CastSpeed", 12.0, "increased"),

    // -----------------------------------------------------------------------
    // Malevolence
    // -----------------------------------------------------------------------
    ("Malevolence", "+(18-22)% to Damage over Time Multiplier while affected by Malevolence", "DotMultiplier", 20.0, "flat"),
    ("Malevolence", "(20-30)% increased Skill Effect Duration while affected by Malevolence", "SkillDuration", 25.0, "increased"),
    ("Malevolence", "Damaging Ailments you inflict deal Damage (10-15)% faster while affected by Malevolence", "AilmentDamageFaster", 12.0, "increased"),
    ("Malevolence", "(8-12)% increased Recovery rate of Life and Energy Shield while affected by Malevolence", "RecoveryRate", 10.0, "increased"),

    // -----------------------------------------------------------------------
    // Clarity
    // -----------------------------------------------------------------------
    ("Clarity", "-(10-5) to Total Mana Cost of Skills while affected by Clarity", "ManaCost", -7.0, "flat"),
    ("Clarity", "Gain (6-10)% of Maximum Mana as Extra Maximum Energy Shield while affected by Clarity", "ManaAsExtraES", 8.0, "flat"),
    ("Clarity", "(15-20)% of Damage taken while affected by Clarity Recouped as Mana", "ManaRecoup", 17.0, "flat"),
    ("Clarity", "(10-15)% increased Mana Recovery Rate while affected by Clarity", "ManaRecoveryRate", 12.0, "increased"),
    ("Clarity", "(6-10)% of Damage taken from Mana before Life while affected by Clarity", "MindOverMatter", 8.0, "flat"),

    // -----------------------------------------------------------------------
    // Vitality
    // -----------------------------------------------------------------------
    ("Vitality", "Regenerate (100-140) Life per Second while affected by Vitality", "LifeRegenFlat", 120.0, "flat"),
    ("Vitality", "Regenerate (1-1.5)% of Life per second while affected by Vitality", "LifeRegenPercent", 1.25, "flat"),
    ("Vitality", "(0.8-1.2)% of Damage leeched as Life while affected by Vitality", "LifeLeech", 1.0, "flat"),
    ("Vitality", "(10-15)% increased Life Recovery Rate while affected by Vitality", "LifeRecoveryRate", 12.0, "increased"),
    ("Vitality", "Gain (20-30) Life per Enemy Hit while affected by Vitality", "LifeOnHit", 25.0, "flat"),

    // -----------------------------------------------------------------------
    // Precision
    // -----------------------------------------------------------------------
    ("Precision", "+(20-30)% to Critical Strike Multiplier while affected by Precision", "CritMultiplier", 25.0, "flat"),
    ("Precision", "(10-15)% increased Attack Speed while affected by Precision", "AttackSpeed", 12.0, "increased"),
    ("Precision", "(40-60)% increased Attack Damage while affected by Precision", "AttackDamage", 50.0, "increased"),

    // -----------------------------------------------------------------------
    // Pride
    // -----------------------------------------------------------------------
    ("Pride", "(40-60)% increased Physical Damage while using Pride", "PhysicalDamage", 50.0, "increased"),
    ("Pride", "(8-12)% chance to deal Double Damage while using Pride", "DoubleDamageChance", 10.0, "flat"),
    ("Pride", "Your Hits Intimidate Enemies for 4 seconds while you are using Pride", "EnemyDamageTaken", 10.0, "increased"),
    ("Pride", "Impales you inflict last 2 additional Hits while using Pride", "ImpaleAdditionalHits", 2.0, "flat"),
    ("Pride", "25% chance to Impale Enemies on Hit with Attacks while using Pride", "ImpaleChance", 25.0, "flat"),

    // -----------------------------------------------------------------------
    // Purity of Fire
    // -----------------------------------------------------------------------
    ("Purity of Fire", "(6-10)% of Physical Damage from Hits taken as Fire Damage while affected by Purity of Fire", "PhysTakenAsFire", 8.0, "flat"),
    ("Purity of Fire", "Immune to Ignite while affected by Purity of Fire", "IgniteImmunity", 1.0, "flat"),
    ("Purity of Fire", "(10-20)% of Cold and Lightning Damage taken as Fire Damage while affected by Purity of Fire", "EleTakenAsFire", 15.0, "flat"),

    // -----------------------------------------------------------------------
    // Purity of Ice
    // -----------------------------------------------------------------------
    ("Purity of Ice", "(6-10)% of Physical Damage from Hits taken as Cold Damage while affected by Purity of Ice", "PhysTakenAsCold", 8.0, "flat"),
    ("Purity of Ice", "Immune to Freeze while affected by Purity of Ice", "FreezeImmunity", 1.0, "flat"),
    ("Purity of Ice", "(10-20)% of Fire and Lightning Damage taken as Cold Damage while affected by Purity of Ice", "EleTakenAsCold", 15.0, "flat"),

    // -----------------------------------------------------------------------
    // Purity of Lightning
    // -----------------------------------------------------------------------
    ("Purity of Lightning", "(6-10)% of Physical Damage from Hits taken as Lightning Damage while affected by Purity of Lightning", "PhysTakenAsLightning", 8.0, "flat"),
    ("Purity of Lightning", "Immune to Shock while affected by Purity of Lightning", "ShockImmunity", 1.0, "flat"),
    ("Purity of Lightning", "(10-20)% of Fire and Cold Damage taken as Lightning Damage while affected by Purity of Lightning", "EleTakenAsLightning", 15.0, "flat"),

    // -----------------------------------------------------------------------
    // Purity of Elements
    // -----------------------------------------------------------------------
    ("Purity of Elements", "(8-12)% of Physical Damage from Hits taken as Fire Damage while affected by Purity of Elements", "PhysTakenAsFire", 10.0, "flat"),
    ("Purity of Elements", "(8-12)% of Physical Damage from Hits taken as Cold Damage while affected by Purity of Elements", "PhysTakenAsCold", 10.0, "flat"),
    ("Purity of Elements", "(8-12)% of Physical Damage from Hits taken as Lightning Damage while affected by Purity of Elements", "PhysTakenAsLightning", 10.0, "flat"),
    ("Purity of Elements", "+(30-50)% to Chaos Resistance while affected by Purity of Elements", "ChaosRes", 40.0, "flat"),
    ("Purity of Elements", "+1% to all maximum Elemental Resistances while affected by Purity of Elements", "MaxEleRes", 1.0, "flat"),

    // -----------------------------------------------------------------------
    // Haste
    // -----------------------------------------------------------------------
    ("Haste", "+(5-8)% chance to Suppress Spell Damage while affected by Haste", "SpellSuppressionChance", 6.0, "flat"),
    ("Haste", "You have Phasing while affected by Haste", "Phasing", 1.0, "flat"),
    ("Haste", "Debuffs on you expire (15-20)% faster while affected by Haste", "DebuffExpiry", 17.0, "increased"),
    ("Haste", "(30-50)% increased Cooldown Recovery Rate of Movement Skills used while affected by Haste", "MovementCooldownRecovery", 40.0, "increased"),

    // -----------------------------------------------------------------------
    // Defiance Banner
    // -----------------------------------------------------------------------
    ("Defiance Banner", "X% increased Armour while affected by Defiance Banner", "Armour", 30.0, "increased"),
    ("Defiance Banner", "X% increased Evasion while affected by Defiance Banner", "Evasion", 30.0, "increased"),
];

pub fn get_watchers_eye_mods(aura: &str) -> Vec<WatchersEyeMod> {
    let aura_lower = aura.to_lowercase();
    WATCHERS_EYE_MODS
        .iter()
        .filter(|(a, _, _, _, _)| a.to_lowercase() == aura_lower)
        .map(|(a, desc, stat, value, mod_type)| WatchersEyeMod {
            aura: a,
            description: desc,
            modifiers: vec![Modifier {
                stat: stat.to_string(),
                value: *value,
                mod_type: mod_type.to_string(),
            }],
        })
        .collect()
}

pub fn get_all_mods_for_auras(active_auras: &[String]) -> Vec<WatchersEyeMod> {
    active_auras
        .iter()
        .flat_map(|aura| get_watchers_eye_mods(aura))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hatred_mods() {
        let mods = get_watchers_eye_mods("Hatred");
        assert_eq!(mods.len(), 5);
        assert!(mods.iter().any(|m| m.description.contains("Cold Damage")));
        assert!(mods.iter().any(|m| m.description.contains("Cold Resistance")));
        assert!(mods.iter().any(|m| m.description.contains("Critical Strike Chance")));
    }

    #[test]
    fn test_determination_mods() {
        let mods = get_watchers_eye_mods("Determination");
        assert_eq!(mods.len(), 4);
        assert!(mods.iter().any(|m| m.description.contains("Armour")));
        assert!(mods.iter().any(|m| m.description.contains("Block")));
    }

    #[test]
    fn test_unknown_aura() {
        let mods = get_watchers_eye_mods("Nonexistent");
        assert!(mods.is_empty());
    }

    #[test]
    fn test_multi_aura() {
        let auras = vec!["Hatred".to_string(), "Determination".to_string()];
        let mods = get_all_mods_for_auras(&auras);
        assert_eq!(mods.len(), 9); // 5 hatred + 4 determination
    }

    #[test]
    fn test_case_insensitive() {
        let mods = get_watchers_eye_mods("hatred");
        assert_eq!(mods.len(), 5);
    }

    #[test]
    fn test_pride_mods() {
        let mods = get_watchers_eye_mods("Pride");
        assert_eq!(mods.len(), 5);
        assert!(mods.iter().any(|m| m.modifiers[0].stat == "DoubleDamageChance"));
        assert!(mods.iter().any(|m| m.modifiers[0].stat == "ImpaleChance"));
    }

    #[test]
    fn test_purity_of_elements() {
        let mods = get_watchers_eye_mods("Purity of Elements");
        assert_eq!(mods.len(), 5);
        assert!(mods.iter().any(|m| m.modifiers[0].stat == "ChaosRes"));
        assert!(mods.iter().any(|m| m.modifiers[0].stat == "MaxEleRes"));
    }

    #[test]
    fn test_purity_of_fire() {
        let mods = get_watchers_eye_mods("Purity of Fire");
        assert_eq!(mods.len(), 3);
        assert!(mods.iter().any(|m| m.modifiers[0].stat == "PhysTakenAsFire"));
    }

    #[test]
    fn test_purity_of_ice() {
        let mods = get_watchers_eye_mods("Purity of Ice");
        assert_eq!(mods.len(), 3);
        assert!(mods.iter().any(|m| m.modifiers[0].stat == "FreezeImmunity"));
    }

    #[test]
    fn test_purity_of_lightning() {
        let mods = get_watchers_eye_mods("Purity of Lightning");
        assert_eq!(mods.len(), 3);
        assert!(mods.iter().any(|m| m.modifiers[0].stat == "ShockImmunity"));
    }

    #[test]
    fn test_grace_mods() {
        let mods = get_watchers_eye_mods("Grace");
        assert_eq!(mods.len(), 4);
        assert!(mods.iter().any(|m| m.modifiers[0].stat == "SpellSuppressionChance"));
    }

    #[test]
    fn test_discipline_mods() {
        let mods = get_watchers_eye_mods("Discipline");
        assert_eq!(mods.len(), 5);
        assert!(mods.iter().any(|m| m.modifiers[0].stat == "ESRegen"));
        assert!(mods.iter().any(|m| m.modifiers[0].stat == "ESOnHit"));
    }

    #[test]
    fn test_wrath_mods() {
        let mods = get_watchers_eye_mods("Wrath");
        assert_eq!(mods.len(), 5);
        assert!(mods.iter().any(|m| m.modifiers[0].stat == "LightningPenetration"));
        assert!(mods.iter().any(|m| m.modifiers[0].stat == "PhysAsExtraLightning"));
    }

    #[test]
    fn test_anger_mods() {
        let mods = get_watchers_eye_mods("Anger");
        assert_eq!(mods.len(), 5);
        assert!(mods.iter().any(|m| m.modifiers[0].stat == "FirePenetration"));
        assert!(mods.iter().any(|m| m.modifiers[0].stat == "PhysAsExtraFire"));
    }

    #[test]
    fn test_zealotry_mods() {
        let mods = get_watchers_eye_mods("Zealotry");
        assert_eq!(mods.len(), 4);
        assert!(mods.iter().any(|m| m.modifiers[0].stat == "EleResistPenetration"));
        assert!(mods.iter().any(|m| m.modifiers[0].stat == "CastSpeed"));
    }

    #[test]
    fn test_malevolence_mods() {
        let mods = get_watchers_eye_mods("Malevolence");
        assert_eq!(mods.len(), 4);
        assert!(mods.iter().any(|m| m.modifiers[0].stat == "DotMultiplier"));
        assert!(mods.iter().any(|m| m.modifiers[0].stat == "AilmentDamageFaster"));
    }

    #[test]
    fn test_clarity_mods() {
        let mods = get_watchers_eye_mods("Clarity");
        assert_eq!(mods.len(), 5);
        assert!(mods.iter().any(|m| m.modifiers[0].stat == "ManaCost" && m.modifiers[0].value < 0.0));
        assert!(mods.iter().any(|m| m.modifiers[0].stat == "ManaAsExtraES"));
    }

    #[test]
    fn test_vitality_mods() {
        let mods = get_watchers_eye_mods("Vitality");
        assert_eq!(mods.len(), 5);
        assert!(mods.iter().any(|m| m.modifiers[0].stat == "LifeRegenFlat"));
        assert!(mods.iter().any(|m| m.modifiers[0].stat == "LifeLeech"));
    }

    #[test]
    fn test_precision_mods() {
        let mods = get_watchers_eye_mods("Precision");
        assert_eq!(mods.len(), 3);
        assert!(mods.iter().any(|m| m.modifiers[0].stat == "CritMultiplier"));
        assert!(mods.iter().any(|m| m.modifiers[0].stat == "AttackDamage"));
    }

    #[test]
    fn test_haste_mods() {
        let mods = get_watchers_eye_mods("Haste");
        assert_eq!(mods.len(), 4);
        assert!(mods.iter().any(|m| m.modifiers[0].stat == "Phasing"));
        assert!(mods.iter().any(|m| m.modifiers[0].stat == "MovementCooldownRecovery"));
    }

    #[test]
    fn test_all_auras_have_minimum_coverage() {
        let auras = [
            "Determination", "Grace", "Discipline", "Hatred", "Wrath", "Anger",
            "Zealotry", "Malevolence", "Clarity", "Vitality", "Precision", "Pride",
            "Purity of Fire", "Purity of Ice", "Purity of Lightning",
            "Purity of Elements", "Haste",
        ];
        for aura in &auras {
            let mods = get_watchers_eye_mods(aura);
            assert!(
                mods.len() >= 3,
                "{} has only {} mods, expected at least 3",
                aura,
                mods.len()
            );
        }
    }

    #[test]
    fn test_total_mod_count() {
        // Verify we haven't accidentally lost entries
        assert!(
            WATCHERS_EYE_MODS.len() >= 70,
            "Expected at least 70 total mods, got {}",
            WATCHERS_EYE_MODS.len()
        );
    }
}
