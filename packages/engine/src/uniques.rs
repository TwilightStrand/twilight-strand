use crate::Modifier;

/// Apply special unique item effects that go beyond normal mod parsing.
/// These are the "build-defining" uniques that need custom logic.
pub fn get_unique_effects(item_name: &str) -> Vec<Modifier> {
    let name = item_name.to_lowercase();
    let mut mods = Vec::new();

    // === BODY ARMOUR ===
    if name.contains("kaom's heart") {
        mods.push(Modifier { stat: "Life".into(), value: 500.0, mod_type: "flat".into() });
    }
    if name.contains("shavronne's wrappings") || name.contains("shav's") {
        mods.push(Modifier { stat: "EnergyShield".into(), value: 250.0, mod_type: "flat".into() });
    }
    if name.contains("carcass jack") {
        mods.push(Modifier { stat: "Damage".into(), value: 50.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "Life".into(), value: 55.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "FireRes".into(), value: 25.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "ColdRes".into(), value: 25.0, mod_type: "flat".into() });
    }
    if name.contains("brass dome") {
        mods.push(Modifier { stat: "Armour".into(), value: 2000.0, mod_type: "flat".into() });
    }
    if name.contains("skin of the lords") || name.contains("skin of the loyal") {
        mods.push(Modifier { stat: "Life".into(), value: 100.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "EnergyShield".into(), value: 100.0, mod_type: "increased".into() });
    }
    if name.contains("loreweave") {
        mods.push(Modifier { stat: "Damage".into(), value: 40.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "Life".into(), value: 60.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "EnergyShield".into(), value: 30.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "CritChance".into(), value: 60.0, mod_type: "increased".into() });
    }
    if name.contains("belly of the beast") {
        mods.push(Modifier { stat: "Life".into(), value: 40.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "FireRes".into(), value: 15.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "ColdRes".into(), value: 15.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "LightningRes".into(), value: 15.0, mod_type: "flat".into() });
    }

    // === WEAPONS ===
    if name.contains("tulfall") {
        mods.push(Modifier { stat: "ColdDamage".into(), value: 30.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "SpellDamage".into(), value: 30.0, mod_type: "increased".into() });
    }
    if name.contains("heartbreaker") {
        mods.push(Modifier { stat: "SpellDamage".into(), value: 50.0, mod_type: "increased".into() });
    }
    if name.contains("void battery") {
        mods.push(Modifier { stat: "SpellDamage".into(), value: 80.0, mod_type: "increased".into() });
    }
    if name.contains("nebulis") {
        mods.push(Modifier { stat: "ColdDamage".into(), value: 50.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "FireDamage".into(), value: 50.0, mod_type: "increased".into() });
    }
    if name.contains("doryani's catalyst") {
        mods.push(Modifier { stat: "Damage".into(), value: 112.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "AttackSpeed".into(), value: 10.0, mod_type: "increased".into() });
    }
    if name.contains("eclipse solaris") {
        mods.push(Modifier { stat: "SpellDamage".into(), value: 120.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "CritChance".into(), value: 80.0, mod_type: "increased".into() });
    }

    // === HELMETS ===
    if name.contains("crown of the inward eye") {
        mods.push(Modifier { stat: "Life".into(), value: 50.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "EnergyShield".into(), value: 50.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Mana".into(), value: 50.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Damage".into(), value: 20.0, mod_type: "increased".into() });
    }
    if name.contains("starkonja") {
        mods.push(Modifier { stat: "Life".into(), value: 100.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Dex".into(), value: 50.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "AttackSpeed".into(), value: 25.0, mod_type: "increased".into() });
    }
    if name.contains("hrimnor's resolve") {
        mods.push(Modifier { stat: "Armour".into(), value: 400.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "FireDamage".into(), value: 30.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "ColdRes".into(), value: 30.0, mod_type: "flat".into() });
    }

    // === AMULETS ===
    if name.contains("dragonfang's flight") || name.contains("replica dragonfang") {
        mods.push(Modifier { stat: "Damage".into(), value: 20.0, mod_type: "increased".into() });
    }
    if name.contains("aul's uprising") {
        mods.push(Modifier { stat: "Damage".into(), value: 15.0, mod_type: "increased".into() });
    }
    if name.contains("ashes of the stars") {
        mods.push(Modifier { stat: "Life".into(), value: 50.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Mana".into(), value: 50.0, mod_type: "flat".into() });
    }
    if name.contains("mageblood") {
        mods.push(Modifier { stat: "Armour".into(), value: 3000.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Evasion".into(), value: 3000.0, mod_type: "flat".into() });
    }
    if name.contains("presence of chayula") {
        mods.push(Modifier { stat: "ChaosRes".into(), value: 60.0, mod_type: "flat".into() });
    }
    if name.contains("eyes of the greatwolf") {
        mods.push(Modifier { stat: "Damage".into(), value: 50.0, mod_type: "increased".into() });
    }

    // === RINGS ===
    if name.contains("mark of the shaper") {
        mods.push(Modifier { stat: "SpellDamage".into(), value: 80.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "Life".into(), value: 60.0, mod_type: "flat".into() });
    }
    if name.contains("kalandra's touch") {
        mods.push(Modifier { stat: "Life".into(), value: 50.0, mod_type: "flat".into() });
    }
    if name.contains("pyre") {
        mods.push(Modifier { stat: "FireDamage".into(), value: 30.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "ColdRes".into(), value: 40.0, mod_type: "flat".into() });
    }
    if name.contains("circle of") {
        mods.push(Modifier { stat: "Damage".into(), value: 25.0, mod_type: "increased".into() });
    }

    // === BOOTS ===
    if name.contains("seven-league step") {
        mods.push(Modifier { stat: "MovementSpeed".into(), value: 50.0, mod_type: "increased".into() });
    }
    if name.contains("atziri's step") {
        mods.push(Modifier { stat: "Evasion".into(), value: 180.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Life".into(), value: 70.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "SpellSuppressionChance".into(), value: 26.0, mod_type: "flat".into() });
    }
    if name.contains("death's door") {
        mods.push(Modifier { stat: "Str".into(), value: 20.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Armour".into(), value: 250.0, mod_type: "flat".into() });
    }

    // === GLOVES ===
    if name.contains("shaper's touch") {
        // Str gives ES%, Dex gives accuracy, Int gives life% — unique interactions
        mods.push(Modifier { stat: "Life".into(), value: 30.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "EnergyShield".into(), value: 30.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "Accuracy".into(), value: 200.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Evasion".into(), value: 200.0, mod_type: "flat".into() });
    }
    if name.contains("command of the pit") {
        mods.push(Modifier { stat: "Accuracy".into(), value: 1000.0, mod_type: "flat".into() });
    }

    // === BELTS ===
    if name.contains("headhunter") {
        mods.push(Modifier { stat: "Str".into(), value: 25.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Dex".into(), value: 25.0, mod_type: "flat".into() });
    }
    if name.contains("darkness enthroned") {
        mods.push(Modifier { stat: "Damage".into(), value: 20.0, mod_type: "increased".into() });
    }
    if name.contains("stygian vise") {
        // Base has an abyssal socket — not a unique effect per se
    }
    if name.contains("immortal flesh") {
        mods.push(Modifier { stat: "Life".into(), value: 75.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Mana".into(), value: 50.0, mod_type: "flat".into() });
    }

    // === SHIELDS ===
    if name.contains("aegis aurora") {
        mods.push(Modifier { stat: "Armour".into(), value: 300.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "EnergyShield".into(), value: 40.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "ColdRes".into(), value: 25.0, mod_type: "flat".into() });
    }
    if name.contains("magna eclipsis") {
        mods.push(Modifier { stat: "Armour".into(), value: 500.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "EnergyShield".into(), value: 100.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "BlockChance".into(), value: 8.0, mod_type: "flat".into() });
    }
    if name.contains("spirit of the prism guardian") || name.contains("prism guardian") {
        mods.push(Modifier { stat: "FireRes".into(), value: 25.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "ColdRes".into(), value: 25.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "LightningRes".into(), value: 25.0, mod_type: "flat".into() });
    }

    // === JEWELS ===
    if name.contains("thread of hope") {
        mods.push(Modifier { stat: "FireRes".into(), value: -10.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "ColdRes".into(), value: -10.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "LightningRes".into(), value: -10.0, mod_type: "flat".into() });
    }
    if name.contains("militant faith") {
        mods.push(Modifier { stat: "Damage".into(), value: 10.0, mod_type: "increased".into() });
    }
    if name.contains("unnatural instinct") {
        mods.push(Modifier { stat: "Damage".into(), value: 15.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "Life".into(), value: 30.0, mod_type: "flat".into() });
    }

    mods
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_kaoms_heart() {
        let mods = get_unique_effects("Kaom's Heart");
        assert!(mods.iter().any(|m| m.stat == "Life" && m.value == 500.0));
    }

    #[test]
    fn test_carcass_jack() {
        let mods = get_unique_effects("Carcass Jack");
        assert!(mods.iter().any(|m| m.stat == "Damage"));
        assert!(mods.iter().any(|m| m.stat == "Life"));
    }

    #[test]
    fn test_case_insensitive() {
        let mods = get_unique_effects("KAOM'S HEART");
        assert!(!mods.is_empty());
    }

    #[test]
    fn test_unknown_unique() {
        let mods = get_unique_effects("Some Random Rare Item");
        assert!(mods.is_empty());
    }

    #[test]
    fn test_starkonja() {
        let mods = get_unique_effects("Starkonja's Head");
        assert!(mods.iter().any(|m| m.stat == "Life"));
        assert!(mods.iter().any(|m| m.stat == "Dex"));
        assert!(mods.iter().any(|m| m.stat == "AttackSpeed"));
    }

    #[test]
    fn test_aegis_aurora() {
        let mods = get_unique_effects("Aegis Aurora");
        assert!(mods.iter().any(|m| m.stat == "Armour"));
        assert!(mods.iter().any(|m| m.stat == "ColdRes"));
    }

    #[test]
    fn test_shapers_touch() {
        let mods = get_unique_effects("Shaper's Touch");
        assert!(mods.iter().any(|m| m.stat == "Life"));
        assert!(mods.iter().any(|m| m.stat == "EnergyShield"));
        assert!(mods.iter().any(|m| m.stat == "Accuracy"));
    }

    #[test]
    fn test_belly_of_the_beast() {
        let mods = get_unique_effects("Belly of the Beast");
        assert!(mods.iter().any(|m| m.stat == "Life" && m.mod_type == "increased"));
        assert!(mods.iter().any(|m| m.stat == "FireRes"));
    }

    #[test]
    fn test_loreweave() {
        let mods = get_unique_effects("Loreweave");
        assert!(mods.iter().any(|m| m.stat == "Damage"));
        assert!(mods.iter().any(|m| m.stat == "CritChance"));
    }

    #[test]
    fn test_presence_of_chayula() {
        let mods = get_unique_effects("Presence of Chayula");
        assert!(mods.iter().any(|m| m.stat == "ChaosRes" && m.value == 60.0));
    }

    #[test]
    fn test_thread_of_hope() {
        let mods = get_unique_effects("Thread of Hope");
        assert_eq!(mods.len(), 3);
        assert!(mods.iter().all(|m| m.value == -10.0));
    }
}
