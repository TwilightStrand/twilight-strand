use crate::Modifier;

/// Return modifiers for a named flask when active
pub fn get_flask_mods(flask_name: &str) -> Vec<Modifier> {
    let name = flask_name.to_lowercase();
    let mut mods = Vec::new();

    // Utility flasks
    if name.contains("quicksilver") {
        mods.push(Modifier { stat: "MovementSpeed".into(), value: 40.0, mod_type: "increased".into() });
    }
    if name.contains("granite") {
        mods.push(Modifier { stat: "Armour".into(), value: 3000.0, mod_type: "flat".into() });
    }
    if name.contains("jade") {
        mods.push(Modifier { stat: "Evasion".into(), value: 3000.0, mod_type: "flat".into() });
    }
    if name.contains("basalt") {
        mods.push(Modifier { stat: "PhysicalDamageReduction".into(), value: 15.0, mod_type: "flat".into() });
    }
    if name.contains("diamond") {
        mods.push(Modifier { stat: "CritChance".into(), value: 100.0, mod_type: "increased".into() });
    }
    if name.contains("silver") {
        mods.push(Modifier { stat: "AttackSpeed".into(), value: 20.0, mod_type: "increased".into() });
    }
    if name.contains("sulphur") {
        mods.push(Modifier { stat: "Damage".into(), value: 40.0, mod_type: "increased".into() });
    }
    if name.contains("bismuth") {
        mods.push(Modifier { stat: "FireRes".into(), value: 35.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "ColdRes".into(), value: 35.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "LightningRes".into(), value: 35.0, mod_type: "flat".into() });
    }
    if name.contains("amethyst") {
        mods.push(Modifier { stat: "ChaosRes".into(), value: 35.0, mod_type: "flat".into() });
    }
    if name.contains("quartz") {
        mods.push(Modifier { stat: "SpellSuppressionChance".into(), value: 25.0, mod_type: "flat".into() });
    }

    // Unique flasks
    if name.contains("dying sun") {
        mods.push(Modifier { stat: "FireRes".into(), value: 50.0, mod_type: "flat".into() });
    }
    if name.contains("rumi") {
        mods.push(Modifier { stat: "BlockChance".into(), value: 20.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "SpellBlockChance".into(), value: 15.0, mod_type: "flat".into() });
    }
    if name.contains("atziri's promise") {
        mods.push(Modifier { stat: "ChaosDamage".into(), value: 15.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "ChaosRes".into(), value: 35.0, mod_type: "flat".into() });
    }
    if name.contains("bottled faith") {
        mods.push(Modifier { stat: "CritChance".into(), value: 100.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "Damage".into(), value: 10.0, mod_type: "increased".into() });
    }
    if name.contains("taste of hate") {
        mods.push(Modifier { stat: "ColdRes".into(), value: 50.0, mod_type: "flat".into() });
    }
    if name.contains("lion's roar") {
        mods.push(Modifier { stat: "Armour".into(), value: 3000.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Damage".into(), value: 20.0, mod_type: "more".into() });
    }
    if name.contains("sin's rebirth") {
        mods.push(Modifier { stat: "ChaosDamage".into(), value: 30.0, mod_type: "increased".into() });
    }

    mods
}

/// Charge bonuses per charge type
pub fn charge_mods(charge_type: &str, count: u32) -> Vec<Modifier> {
    let mut mods = Vec::new();
    let c = count as f64;

    match charge_type {
        "power" => {
            mods.push(Modifier { stat: "CritChance".into(), value: 40.0 * c, mod_type: "increased".into() });
        }
        "frenzy" => {
            mods.push(Modifier { stat: "Damage".into(), value: 4.0 * c, mod_type: "more".into() });
            mods.push(Modifier { stat: "AttackSpeed".into(), value: 4.0 * c, mod_type: "increased".into() });
        }
        "endurance" => {
            mods.push(Modifier { stat: "PhysicalDamageReduction".into(), value: 4.0 * c, mod_type: "flat".into() });
            mods.push(Modifier { stat: "FireRes".into(), value: 4.0 * c, mod_type: "flat".into() });
            mods.push(Modifier { stat: "ColdRes".into(), value: 4.0 * c, mod_type: "flat".into() });
            mods.push(Modifier { stat: "LightningRes".into(), value: 4.0 * c, mod_type: "flat".into() });
        }
        _ => {}
    }

    mods
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_granite_flask() {
        let mods = get_flask_mods("Granite Flask");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "Armour");
        assert_eq!(mods[0].value, 3000.0);
        assert_eq!(mods[0].mod_type, "flat");
    }

    #[test]
    fn test_rumis() {
        let mods = get_flask_mods("Rumi's Concoction");
        assert_eq!(mods.len(), 2);
        assert!(mods.iter().any(|m| m.stat == "BlockChance" && m.value == 20.0));
        assert!(mods.iter().any(|m| m.stat == "SpellBlockChance" && m.value == 15.0));
    }

    #[test]
    fn test_bismuth_flask() {
        let mods = get_flask_mods("Bismuth Flask");
        assert_eq!(mods.len(), 3);
        assert!(mods.iter().all(|m| m.value == 35.0 && m.mod_type == "flat"));
    }

    #[test]
    fn test_bottled_faith() {
        let mods = get_flask_mods("Bottled Faith");
        assert_eq!(mods.len(), 2);
        assert!(mods.iter().any(|m| m.stat == "CritChance"));
        assert!(mods.iter().any(|m| m.stat == "Damage"));
    }

    #[test]
    fn test_lions_roar() {
        let mods = get_flask_mods("Lion's Roar");
        assert!(mods.iter().any(|m| m.stat == "Damage" && m.mod_type == "more"));
    }

    #[test]
    fn test_unknown_flask() {
        let mods = get_flask_mods("Random Potion");
        assert!(mods.is_empty());
    }

    #[test]
    fn test_power_charges() {
        let mods = charge_mods("power", 3);
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "CritChance");
        assert_eq!(mods[0].value, 120.0);
        assert_eq!(mods[0].mod_type, "increased");
    }

    #[test]
    fn test_frenzy_charges() {
        let mods = charge_mods("frenzy", 3);
        assert_eq!(mods.len(), 2);
        assert!(mods.iter().any(|m| m.stat == "Damage" && m.mod_type == "more" && m.value == 12.0));
        assert!(mods.iter().any(|m| m.stat == "AttackSpeed" && m.value == 12.0));
    }

    #[test]
    fn test_endurance_charges() {
        let mods = charge_mods("endurance", 3);
        assert_eq!(mods.len(), 4);
        assert!(mods.iter().any(|m| m.stat == "PhysicalDamageReduction" && m.value == 12.0));
        assert!(mods.iter().any(|m| m.stat == "FireRes" && m.value == 12.0));
    }

    #[test]
    fn test_zero_charges() {
        let mods = charge_mods("power", 0);
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].value, 0.0);
    }

    #[test]
    fn test_unknown_charge_type() {
        let mods = charge_mods("spirit", 5);
        assert!(mods.is_empty());
    }
}
