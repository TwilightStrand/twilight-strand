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

/// Simplified ascendancy notable bonuses.
/// These approximate the combined effect of common ascendancy allocations.
pub fn get_ascendancy_mods(ascendancy: &str) -> Vec<Modifier> {
    let mut mods = Vec::new();

    match ascendancy {
        // -- Marauder --
        "Juggernaut" => {
            mods.push(Modifier { stat: "Armour".into(), value: 20.0, mod_type: "increased".into() });
            mods.push(Modifier { stat: "Accuracy".into(), value: 1000.0, mod_type: "flat".into() });
        }
        "Berserker" => {
            mods.push(Modifier { stat: "Damage".into(), value: 40.0, mod_type: "more".into() });
            mods.push(Modifier { stat: "AttackSpeed".into(), value: 15.0, mod_type: "increased".into() });
        }
        "Chieftain" => {
            mods.push(Modifier { stat: "FireDamage".into(), value: 35.0, mod_type: "increased".into() });
            mods.push(Modifier { stat: "Str".into(), value: 20.0, mod_type: "flat".into() });
        }

        // -- Witch --
        "Necromancer" => {
            mods.push(Modifier { stat: "Int".into(), value: 30.0, mod_type: "flat".into() });
        }
        "Elementalist" => {
            mods.push(Modifier { stat: "FireDamage".into(), value: 25.0, mod_type: "increased".into() });
            mods.push(Modifier { stat: "ColdDamage".into(), value: 25.0, mod_type: "increased".into() });
            mods.push(Modifier { stat: "LightningDamage".into(), value: 25.0, mod_type: "increased".into() });
        }
        "Occultist" => {
            mods.push(Modifier { stat: "EnergyShield".into(), value: 250.0, mod_type: "flat".into() });
            mods.push(Modifier { stat: "ChaosDamage".into(), value: 25.0, mod_type: "increased".into() });
        }

        // -- Ranger --
        "Deadeye" => {
            mods.push(Modifier { stat: "Accuracy".into(), value: 100.0, mod_type: "increased".into() });
            mods.push(Modifier { stat: "Damage".into(), value: 20.0, mod_type: "increased".into() });
        }
        "Raider" | "Warden" => {
            mods.push(Modifier { stat: "AttackSpeed".into(), value: 20.0, mod_type: "increased".into() });
            mods.push(Modifier { stat: "Evasion".into(), value: 30.0, mod_type: "increased".into() });
        }
        "Pathfinder" => {
            mods.push(Modifier { stat: "Damage".into(), value: 15.0, mod_type: "increased".into() });
        }

        // -- Duelist --
        "Slayer" => {
            mods.push(Modifier { stat: "Damage".into(), value: 20.0, mod_type: "more".into() });
            mods.push(Modifier { stat: "CritMultiplier".into(), value: 30.0, mod_type: "flat".into() });
        }
        "Gladiator" => {
            mods.push(Modifier { stat: "BlockChance".into(), value: 15.0, mod_type: "flat".into() });
            mods.push(Modifier { stat: "SpellBlockChance".into(), value: 15.0, mod_type: "flat".into() });
        }
        "Champion" => {
            mods.push(Modifier { stat: "Armour".into(), value: 30.0, mod_type: "increased".into() });
            mods.push(Modifier { stat: "Evasion".into(), value: 30.0, mod_type: "increased".into() });
        }

        // -- Templar --
        "Inquisitor" => {
            mods.push(Modifier { stat: "CritChance".into(), value: 45.0, mod_type: "increased".into() });
        }
        "Hierophant" => {
            mods.push(Modifier { stat: "Mana".into(), value: 25.0, mod_type: "increased".into() });
        }
        "Guardian" => {
            mods.push(Modifier { stat: "Armour".into(), value: 25.0, mod_type: "increased".into() });
            mods.push(Modifier { stat: "EnergyShield".into(), value: 15.0, mod_type: "increased".into() });
        }

        // -- Shadow --
        "Assassin" => {
            mods.push(Modifier { stat: "CritChance".into(), value: 2.0, mod_type: "flat".into() });
            mods.push(Modifier { stat: "CritMultiplier".into(), value: 25.0, mod_type: "flat".into() });
        }
        "Trickster" => {
            mods.push(Modifier { stat: "AttackSpeed".into(), value: 10.0, mod_type: "increased".into() });
            mods.push(Modifier { stat: "EnergyShield".into(), value: 10.0, mod_type: "increased".into() });
        }
        "Saboteur" => {
            mods.push(Modifier { stat: "Damage".into(), value: 20.0, mod_type: "increased".into() });
        }

        // -- Scion --
        "Ascendant" => {}

        _ => {}
    }

    mods
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
    fn test_occultist_mods() {
        let mods = get_ascendancy_mods("Occultist");
        assert!(mods.iter().any(|m| m.stat == "EnergyShield" && m.value == 250.0));
        assert!(mods.iter().any(|m| m.stat == "ChaosDamage"));
    }

    #[test]
    fn test_gladiator_gives_block() {
        let mods = get_ascendancy_mods("Gladiator");
        assert!(mods.iter().any(|m| m.stat == "BlockChance"));
        assert!(mods.iter().any(|m| m.stat == "SpellBlockChance"));
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
}
