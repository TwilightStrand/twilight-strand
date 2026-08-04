use crate::Modifier;

#[derive(Clone, Debug)]
pub struct WatchersEyeMod {
    pub aura: &'static str,
    pub description: &'static str,
    pub modifiers: Vec<Modifier>,
}

pub const WATCHERS_EYE_MODS: &[(&str, &str, &str, f64, &str)] = &[
    // Determination
    ("Determination", "+X to Armour while affected by Determination", "Armour", 1500.0, "flat"),
    ("Determination", "X% additional Physical Damage Reduction while affected by Determination", "PhysicalDamageReduction", 8.0, "flat"),

    // Grace
    ("Grace", "+X to Evasion Rating while affected by Grace", "Evasion", 2000.0, "flat"),
    ("Grace", "X% chance to Suppress Spell Damage while affected by Grace", "SpellSuppressionChance", 15.0, "flat"),

    // Discipline
    ("Discipline", "+X to maximum Energy Shield while affected by Discipline", "EnergyShield", 250.0, "flat"),
    ("Discipline", "X% faster start of Energy Shield Recharge while affected by Discipline", "ESRechargeRate", 30.0, "increased"),

    // Hatred
    ("Hatred", "X% increased Cold Damage while affected by Hatred", "ColdDamage", 40.0, "increased"),
    ("Hatred", "+X% to Critical Strike Multiplier while affected by Hatred", "CritMultiplier", 40.0, "flat"),

    // Wrath
    ("Wrath", "X% increased Lightning Damage while affected by Wrath", "LightningDamage", 40.0, "increased"),
    ("Wrath", "Damage Penetrates X% Lightning Resistance while affected by Wrath", "LightningPenetration", 18.0, "flat"),

    // Anger
    ("Anger", "X% increased Fire Damage while affected by Anger", "FireDamage", 40.0, "increased"),
    ("Anger", "Damage Penetrates X% Fire Resistance while affected by Anger", "FirePenetration", 18.0, "flat"),

    // Zealotry
    ("Zealotry", "X% increased Critical Strike Chance while affected by Zealotry", "CritChance", 120.0, "increased"),
    ("Zealotry", "Consecrated Ground you create applies X% increased Damage taken to Enemies", "Damage", 15.0, "increased"),

    // Malevolence
    ("Malevolence", "X% increased Damage over Time while affected by Malevolence", "Damage", 30.0, "increased"),
    ("Malevolence", "+X% to Damage over Time Multiplier while affected by Malevolence", "Damage", 18.0, "more"),

    // Clarity
    ("Clarity", "+X Mana gained on Hit while affected by Clarity", "Mana", 12.0, "flat"),
    ("Clarity", "X% of Damage taken Recouped as Mana while affected by Clarity", "Mana", 10.0, "increased"),

    // Vitality
    ("Vitality", "X% of Life Regenerated per second while affected by Vitality", "LifeRegen", 100.0, "flat"),

    // Precision
    ("Precision", "+X% to Critical Strike Multiplier while affected by Precision", "CritMultiplier", 30.0, "flat"),
    ("Precision", "X% increased Attack Speed while affected by Precision", "AttackSpeed", 15.0, "increased"),

    // Purity of Elements
    ("Purity of Elements", "+X% to all Elemental Resistances while affected by Purity of Elements", "FireRes", 20.0, "flat"),

    // Haste
    ("Haste", "X% increased Attack Speed while affected by Haste", "AttackSpeed", 20.0, "increased"),
    ("Haste", "X% increased Movement Speed while affected by Haste", "MovementSpeed", 15.0, "increased"),

    // Pride
    ("Pride", "X% more Physical Damage while affected by Pride", "PhysicalDamage", 20.0, "more"),
    ("Pride", "Impales inflicted by Hits while affected by Pride last X additional Hits", "ImpaleDPS", 20.0, "increased"),

    // Defiance Banner
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
        assert_eq!(mods.len(), 2);
        assert!(mods.iter().any(|m| m.description.contains("Cold Damage")));
    }

    #[test]
    fn test_determination_mods() {
        let mods = get_watchers_eye_mods("Determination");
        assert_eq!(mods.len(), 2);
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
        assert_eq!(mods.len(), 4);
    }

    #[test]
    fn test_case_insensitive() {
        let mods = get_watchers_eye_mods("hatred");
        assert_eq!(mods.len(), 2);
    }

    #[test]
    fn test_pride_mods() {
        let mods = get_watchers_eye_mods("Pride");
        assert_eq!(mods.len(), 2);
        assert!(mods.iter().any(|m| m.modifiers[0].mod_type == "more"));
    }

    #[test]
    fn test_purity_ele_res() {
        let mods = get_watchers_eye_mods("Purity of Elements");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].modifiers[0].stat, "FireRes");
    }
}
