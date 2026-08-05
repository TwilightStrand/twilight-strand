use crate::Modifier;

/// Return the modifiers granted by a support gem at level 20.
pub fn get_support_modifiers(support_name: &str) -> Vec<Modifier> {
    let name = support_name.to_lowercase();
    let mut mods = Vec::new();

    // --- Damage supports ---
    if name.contains("melee physical") {
        mods.push(more("PhysicalDamage", 49.0));
    }
    if name.contains("concentrated effect") {
        mods.push(more("Damage", 54.0));
    }
    if name.contains("brutality") {
        mods.push(more("PhysicalDamage", 59.0));
    }
    if name.contains("elemental damage with attacks") {
        mods.push(more("FireDamage", 54.0));
        mods.push(more("ColdDamage", 54.0));
        mods.push(more("LightningDamage", 54.0));
    }
    if name.contains("controlled destruction") {
        mods.push(more("SpellDamage", 44.0));
    }
    if name.contains("elemental focus") {
        mods.push(more("Damage", 49.0));
    }
    if name.contains("void manipulation") {
        mods.push(more("ChaosDamage", 39.0));
    }

    // --- Speed supports ---
    if name.contains("spell echo") {
        mods.push(more("AttackSpeed", 52.0));
    }
    if name.contains("faster attacks") {
        mods.push(more("AttackSpeed", 44.0));
    }
    if name.contains("faster casting") {
        mods.push(more("AttackSpeed", 39.0));
    }
    if name.contains("multistrike") {
        mods.push(more("AttackSpeed", 44.0));
        mods.push(more("Damage", -26.0));
    }
    if name.contains("unleash") {
        mods.push(more("Damage", -25.0));
    }

    // --- Crit supports ---
    if name.contains("increased critical strikes") {
        mods.push(Modifier {
            stat: "CritChance".into(),
            value: 88.0,
            mod_type: "increased".into(),
        });
    }
    if name.contains("increased critical damage") {
        mods.push(Modifier {
            stat: "CritMultiplier".into(),
            value: 88.0,
            mod_type: "flat".into(),
        });
    }

    // --- Damage type supports ---
    if name.contains("added cold damage") {
        mods.push(flat("AddedColdMin", 130.0));
        mods.push(flat("AddedColdMax", 195.0));
    }
    if name.contains("added fire damage") {
        mods.push(flat("AddedFireMin", 120.0));
        mods.push(flat("AddedFireMax", 180.0));
    }
    if name.contains("added lightning damage") {
        mods.push(flat("AddedLightningMin", 15.0));
        mods.push(flat("AddedLightningMax", 285.0));
    }

    // --- Penetration supports ---
    if name.contains("cold penetration") {
        mods.push(flat("ColdPenetration", 37.0));
    }
    if name.contains("fire penetration") {
        mods.push(flat("FirePenetration", 37.0));
    }
    if name.contains("lightning penetration") {
        mods.push(flat("LightningPenetration", 37.0));
    }

    // --- DoT supports ---
    if name.contains("burning damage") {
        mods.push(more("FireDamage", 59.0));
    }
    if name.contains("swift affliction") {
        mods.push(more("DamageOverTime", 44.0));
    }
    if name.contains("efficacy") {
        mods.push(more("DamageOverTime", 34.0));
        mods.push(more("SpellDamage", 20.0));
    }
    if name.contains("deadly ailments") {
        mods.push(more("Damage", 44.0)); // ailment damage only, simplified
    }
    if name.contains("unbound ailments") {
        mods.push(more("Damage", 25.0)); // ailment damage only, simplified
    }

    // --- Minion supports ---
    if name.contains("minion damage") {
        mods.push(more("Damage", 49.0)); // simplified, actually only for minions
    }

    // --- Utility supports ---
    if name.contains("inspiration") {
        mods.push(more("Damage", 39.0));
    }
    if name.contains("infused channelling") {
        mods.push(more("Damage", 39.0));
    }

    // --- Added damage (additional) ---
    if name.contains("added chaos damage") {
        mods.push(flat("AddedChaosMin", 95.0));
        mods.push(flat("AddedChaosMax", 143.0));
    }

    // --- Projectile supports ---
    if name.contains("greater multiple projectiles") || name.contains("gmp") {
        mods.push(more("Damage", -26.0));
    }
    if name.contains("lesser multiple projectiles") || name.contains("lmp") {
        mods.push(more("Damage", -10.0));
    }
    if name.contains("chain") && !name.contains("unchain") {
        mods.push(more("Damage", -18.0));
    }
    if name.contains("fork") {
        mods.push(more("Damage", -21.0));
    }

    // --- Melee supports ---
    if name.contains("ancestral call") {
        mods.push(more("Damage", -10.0));
    }
    if name.contains("close combat") {
        mods.push(more("Damage", 49.0));
    }
    if name.contains("ruthless") {
        mods.push(more("Damage", 32.0));
    }
    if name.contains("pulverise") {
        mods.push(more("Damage", 34.0));
        mods.push(more("AttackSpeed", -15.0));
    }

    // --- Gem level support ---
    if name.contains("empower") {
        mods.push(more("Damage", 30.0));
    }
    if name.contains("enhance") {
        // Quality bonus; no direct damage
    }

    // --- Elemental supports ---
    if name.contains("trinity") {
        mods.push(more("Damage", 41.0));
        mods.push(flat("FirePenetration", 15.0));
        mods.push(flat("ColdPenetration", 15.0));
        mods.push(flat("LightningPenetration", 15.0));
    }
    if name.contains("hypothermia") {
        mods.push(more("ColdDamage", 39.0));
    }
    if name.contains("immolate") {
        mods.push(flat("AddedFireMin", 140.0));
        mods.push(flat("AddedFireMax", 210.0));
    }

    // --- ES/life supports ---
    if name.contains("energy leech") {
        mods.push(more("Damage", 39.0));
    }
    if name.contains("lifetap") {
        mods.push(more("Damage", 19.0));
    }

    // --- Trigger supports ---
    if name.contains("cast on critical strike") || name.contains("cast on crit") {
        mods.push(more("Damage", -21.0));
    }
    if name.contains("cast when damage taken") {
        mods.push(more("Damage", -44.0));
    }

    // --- DoT supports (additional) ---
    if name.contains("cruelty") {
        mods.push(more("DamageOverTime", 39.0));
    }

    // --- Crit supports (additional) ---
    if name.contains("nightblade") {
        mods.push(Modifier { stat: "CritMultiplier".into(), value: 60.0, mod_type: "flat".into() });
    }
    if name.contains("power charge on critical strike") || name.contains("pcoc") {
        mods.push(Modifier { stat: "CritChance".into(), value: 44.0, mod_type: "increased".into() });
    }

    // --- Minion supports (additional) ---
    if name.contains("feeding frenzy") || name.contains("predator") {
        mods.push(more("Damage", 29.0)); // minion damage, simplified
    }
    if name.contains("elemental army") {
        mods.push(flat("FirePenetration", 10.0));
        mods.push(flat("ColdPenetration", 10.0));
        mods.push(flat("LightningPenetration", 10.0));
    }

    // --- Awakened variants ---
    if name.contains("awakened") {
        if name.contains("melee physical") {
            mods.push(more("PhysicalDamage", 5.0));
        } else if name.contains("elemental damage with attacks") {
            mods.push(more("FireDamage", 5.0));
            mods.push(more("ColdDamage", 5.0));
            mods.push(more("LightningDamage", 5.0));
        } else if name.contains("brutality") {
            mods.push(more("PhysicalDamage", 5.0));
        } else {
            mods.push(more("Damage", 5.0));
        }
    }

    mods
}

fn flat(stat: &str, value: f64) -> Modifier {
    Modifier {
        stat: stat.into(),
        value,
        mod_type: "flat".into(),
    }
}

fn more(stat: &str, value: f64) -> Modifier {
    Modifier {
        stat: stat.into(),
        value,
        mod_type: "more".into(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_melee_phys() {
        let mods = get_support_modifiers("Melee Physical Damage Support");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "PhysicalDamage");
        assert_eq!(mods[0].mod_type, "more");
        assert_eq!(mods[0].value, 49.0);
    }

    #[test]
    fn test_unknown_support() {
        let mods = get_support_modifiers("Unknown Support");
        assert!(mods.is_empty());
    }

    #[test]
    fn test_edwa() {
        let mods = get_support_modifiers("Elemental Damage with Attacks Support");
        assert_eq!(mods.len(), 3);
        assert!(mods.iter().all(|m| m.mod_type == "more"));
    }

    #[test]
    fn test_multistrike() {
        let mods = get_support_modifiers("Multistrike Support");
        assert_eq!(mods.len(), 2);
        let speed = mods.iter().find(|m| m.stat == "AttackSpeed").unwrap();
        assert_eq!(speed.value, 44.0);
        let dmg = mods.iter().find(|m| m.stat == "Damage").unwrap();
        assert_eq!(dmg.value, -26.0);
    }

    #[test]
    fn test_added_cold() {
        let mods = get_support_modifiers("Added Cold Damage Support");
        assert_eq!(mods.len(), 2);
        assert_eq!(mods[0].stat, "AddedColdMin");
        assert_eq!(mods[1].stat, "AddedColdMax");
    }

    #[test]
    fn test_cold_penetration() {
        let mods = get_support_modifiers("Cold Penetration Support");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "ColdPenetration");
        assert_eq!(mods[0].value, 37.0);
    }

    #[test]
    fn test_brutality() {
        let mods = get_support_modifiers("Brutality Support");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "PhysicalDamage");
        assert_eq!(mods[0].value, 59.0);
    }

    #[test]
    fn test_controlled_destruction() {
        let mods = get_support_modifiers("Controlled Destruction Support");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "SpellDamage");
    }

    #[test]
    fn test_inspiration() {
        let mods = get_support_modifiers("Inspiration Support");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "Damage");
        assert_eq!(mods[0].value, 39.0);
    }
}
