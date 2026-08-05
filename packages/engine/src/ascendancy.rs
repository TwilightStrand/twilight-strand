use crate::Modifier;

/// Get base class attributes (str, dex, int) by class_id.
/// All PoE classes have 60 total base attribute points.
pub fn class_base_stats(class_id: u32) -> (u32, u32, u32) {
    match class_id {
        0 => (20, 20, 20), // Scion
        1 => (32, 14, 14), // Marauder
        2 => (14, 32, 14), // Ranger
        3 => (14, 14, 32), // Witch
        4 => (23, 23, 14), // Duelist
        5 => (23, 14, 23), // Templar
        6 => (14, 23, 23), // Shadow
        _ => (20, 20, 20),
    }
}

pub fn class_name(class_id: u32) -> &'static str {
    match class_id {
        0 => "Scion",
        1 => "Marauder",
        2 => "Ranger",
        3 => "Witch",
        4 => "Duelist",
        5 => "Templar",
        6 => "Shadow",
        _ => "Scion",
    }
}

fn m(stat: &str, value: f64, mod_type: &str) -> Modifier {
    Modifier { stat: stat.into(), value, mod_type: mod_type.into() }
}

/// Ascendancy notable bonuses approximating full 4-notable allocation.
pub fn get_ascendancy_mods(ascendancy: &str) -> Vec<Modifier> {
    match ascendancy {
        // -- Marauder --
        "Juggernaut" => vec![
            m("Armour", 20.0, "increased"),
            m("Accuracy", 1000.0, "flat"),
            m("Str", 10.0, "flat"),
            m("Life", 6.0, "increased"),
        ],
        "Berserker" => vec![
            m("Damage", 40.0, "more"),
            m("AttackSpeed", 15.0, "increased"),
            m("LifeLeechPct", 2.0, "flat"),
        ],
        "Chieftain" => vec![
            m("FireDamage", 35.0, "increased"),
            m("Str", 20.0, "flat"),
            m("FirePenetration", 15.0, "flat"),
            m("Life", 10.0, "increased"),
        ],

        // -- Witch --
        "Necromancer" => vec![
            m("Int", 30.0, "flat"),
            m("MinionDamage", 30.0, "increased"),
            m("MinionLife", 20.0, "increased"),
            m("EnergyShield", 100.0, "flat"),
        ],
        "Elementalist" => vec![
            m("FireDamage", 25.0, "increased"),
            m("ColdDamage", 25.0, "increased"),
            m("LightningDamage", 25.0, "increased"),
            m("FirePenetration", 10.0, "flat"),
            m("ColdPenetration", 10.0, "flat"),
            m("LightningPenetration", 10.0, "flat"),
        ],
        "Occultist" => vec![
            m("EnergyShield", 50.0, "flat"),
            m("EnergyShield", 15.0, "increased"),
            m("ChaosDamage", 20.0, "increased"),
            m("ChaosRes", 20.0, "flat"),
        ],

        // -- Ranger --
        "Deadeye" => vec![
            m("ProjectileDamage", 30.0, "increased"),
            m("Accuracy", 200.0, "flat"),
            m("CritChance", 30.0, "increased"),
            m("AttackSpeed", 10.0, "increased"),
        ],
        "Raider" | "Warden" => vec![
            m("Evasion", 30.0, "increased"),
            m("AttackSpeed", 20.0, "increased"),
            m("MovementSpeed", 10.0, "increased"),
            m("Damage", 15.0, "increased"),
        ],
        "Pathfinder" => vec![
            m("Damage", 15.0, "increased"),
            m("Life", 5.0, "increased"),
            m("Evasion", 15.0, "increased"),
        ],

        // -- Duelist --
        "Slayer" => vec![
            m("Damage", 20.0, "more"),
            m("CritMultiplier", 30.0, "flat"),
            m("Life", 10.0, "increased"),
            m("AttackSpeed", 10.0, "increased"),
        ],
        "Gladiator" => vec![
            m("BlockChance", 15.0, "flat"),
            m("SpellBlockChance", 10.0, "flat"),
            m("Damage", 20.0, "increased"),
            m("Armour", 20.0, "increased"),
        ],
        "Champion" => vec![
            m("Damage", 20.0, "increased"),
            m("Armour", 25.0, "increased"),
            m("DamageTakenReduction", 10.0, "flat"),
            m("Life", 10.0, "increased"),
        ],

        // -- Templar --
        "Inquisitor" => vec![
            m("CritChance", 30.0, "increased"),
            m("Damage", 20.0, "increased"),
            m("EnergyShield", 50.0, "flat"),
            m("LifeRegenPct", 0.5, "flat"),
        ],
        "Hierophant" => vec![
            m("Mana", 50.0, "flat"),
            m("EnergyShield", 100.0, "flat"),
            m("Damage", 15.0, "increased"),
            m("ManaRegen", 20.0, "increased"),
        ],
        "Guardian" => vec![
            m("Armour", 20.0, "increased"),
            m("EnergyShield", 100.0, "flat"),
            m("BlockChance", 10.0, "flat"),
            m("Life", 10.0, "increased"),
        ],

        // -- Shadow --
        "Assassin" => vec![
            m("CritChance", 50.0, "increased"),
            m("CritMultiplier", 40.0, "flat"),
            m("Damage", 15.0, "increased"),
            m("AttackSpeed", 10.0, "increased"),
        ],
        "Trickster" => vec![
            m("EnergyShield", 50.0, "flat"),
            m("Evasion", 20.0, "increased"),
            m("AttackSpeed", 10.0, "increased"),
            m("Damage", 15.0, "increased"),
        ],
        "Saboteur" => vec![
            m("Damage", 20.0, "increased"),
            m("CritChance", 20.0, "increased"),
            m("Life", 5.0, "increased"),
            m("Evasion", 15.0, "increased"),
        ],

        // -- Scion --
        "Ascendant" => vec![
            m("Str", 20.0, "flat"),
            m("Dex", 20.0, "flat"),
            m("Int", 20.0, "flat"),
        ],

        _ => vec![],
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_class_stats_marauder() {
        let (s, d, i) = class_base_stats(1);
        assert_eq!(s, 32);
        assert_eq!(d, 14);
        assert_eq!(i, 14);
    }

    #[test]
    fn test_all_classes_sum_60() {
        for id in 0..7 {
            let (s, d, i) = class_base_stats(id);
            assert_eq!(s + d + i, 60, "class {id} attributes don't sum to 60");
        }
    }

    #[test]
    fn test_class_name() {
        assert_eq!(class_name(1), "Marauder");
        assert_eq!(class_name(3), "Witch");
        assert_eq!(class_name(99), "Scion");
    }

    #[test]
    fn test_juggernaut_has_4_mods() {
        let mods = get_ascendancy_mods("Juggernaut");
        assert_eq!(mods.len(), 4);
        assert!(mods.iter().any(|m| m.stat == "Armour"));
        assert!(mods.iter().any(|m| m.stat == "Accuracy" && m.value == 1000.0));
        assert!(mods.iter().any(|m| m.stat == "Str"));
        assert!(mods.iter().any(|m| m.stat == "Life"));
    }

    #[test]
    fn test_elementalist_has_penetration() {
        let mods = get_ascendancy_mods("Elementalist");
        assert_eq!(mods.len(), 6);
        assert!(mods.iter().any(|m| m.stat == "FirePenetration" && m.value == 10.0));
        assert!(mods.iter().any(|m| m.stat == "ColdPenetration"));
        assert!(mods.iter().any(|m| m.stat == "LightningPenetration"));
    }

    #[test]
    fn test_occultist_mods() {
        let mods = get_ascendancy_mods("Occultist");
        assert_eq!(mods.len(), 4);
        assert!(mods.iter().any(|m| m.stat == "EnergyShield" && m.value == 50.0 && m.mod_type == "flat"));
        assert!(mods.iter().any(|m| m.stat == "EnergyShield" && m.mod_type == "increased"));
        assert!(mods.iter().any(|m| m.stat == "ChaosDamage"));
        assert!(mods.iter().any(|m| m.stat == "ChaosRes"));
    }

    #[test]
    fn test_gladiator_gives_block() {
        let mods = get_ascendancy_mods("Gladiator");
        assert!(mods.iter().any(|m| m.stat == "BlockChance" && m.value == 15.0));
        assert!(mods.iter().any(|m| m.stat == "SpellBlockChance" && m.value == 10.0));
        assert!(mods.iter().any(|m| m.stat == "Damage"));
        assert!(mods.iter().any(|m| m.stat == "Armour"));
    }

    #[test]
    fn test_slayer_has_more_damage() {
        let mods = get_ascendancy_mods("Slayer");
        assert!(mods.iter().any(|m| m.stat == "Damage" && m.mod_type == "more" && m.value == 20.0));
        assert!(mods.iter().any(|m| m.stat == "CritMultiplier" && m.value == 30.0));
    }

    #[test]
    fn test_assassin_crit_heavy() {
        let mods = get_ascendancy_mods("Assassin");
        assert!(mods.iter().any(|m| m.stat == "CritChance" && m.value == 50.0));
        assert!(mods.iter().any(|m| m.stat == "CritMultiplier" && m.value == 40.0));
    }

    #[test]
    fn test_champion_has_damage_reduction() {
        let mods = get_ascendancy_mods("Champion");
        assert!(mods.iter().any(|m| m.stat == "DamageTakenReduction" && m.value == 10.0));
    }

    #[test]
    fn test_ascendant_gives_all_attributes() {
        let mods = get_ascendancy_mods("Ascendant");
        assert_eq!(mods.len(), 3);
        assert!(mods.iter().any(|m| m.stat == "Str" && m.value == 20.0));
        assert!(mods.iter().any(|m| m.stat == "Dex" && m.value == 20.0));
        assert!(mods.iter().any(|m| m.stat == "Int" && m.value == 20.0));
    }

    #[test]
    fn test_unknown_ascendancy_empty() {
        let mods = get_ascendancy_mods("NonExistent");
        assert!(mods.is_empty());
    }

    #[test]
    fn test_warden_alias_for_raider() {
        let raider = get_ascendancy_mods("Raider");
        let warden = get_ascendancy_mods("Warden");
        assert_eq!(raider.len(), warden.len());
    }

    #[test]
    fn test_necromancer_has_minion_mods() {
        let mods = get_ascendancy_mods("Necromancer");
        assert!(mods.iter().any(|m| m.stat == "MinionDamage"));
        assert!(mods.iter().any(|m| m.stat == "MinionLife"));
        assert!(mods.iter().any(|m| m.stat == "EnergyShield" && m.value == 100.0));
    }

    #[test]
    fn test_inquisitor_has_regen() {
        let mods = get_ascendancy_mods("Inquisitor");
        assert!(mods.iter().any(|m| m.stat == "LifeRegenPct" && m.value == 0.5));
        assert!(mods.iter().any(|m| m.stat == "EnergyShield" && m.value == 50.0));
    }

    #[test]
    fn test_deadeye_projectile_focus() {
        let mods = get_ascendancy_mods("Deadeye");
        assert!(mods.iter().any(|m| m.stat == "ProjectileDamage" && m.value == 30.0));
        assert!(mods.iter().any(|m| m.stat == "Accuracy" && m.value == 200.0));
    }

    #[test]
    fn test_berserker_has_leech() {
        let mods = get_ascendancy_mods("Berserker");
        assert!(mods.iter().any(|m| m.stat == "LifeLeechPct" && m.value == 2.0));
    }
}
