use crate::Modifier;
use crate::gems;

fn map_support_mod(m: &gems::SupportMod) -> Option<Modifier> {
    if m.mod_type == "raw" {
        return map_raw_stat(&m.stat, m.value);
    }

    let stat = match (m.stat.as_str(), m.flags.as_deref()) {
        ("Damage", Some(f)) if f.contains("Spell") => "SpellDamage",
        ("Damage", Some(f)) if f.contains("Attack") => "AttackDamage",
        ("Damage", _) => "Damage",
        ("PhysicalDamage", _) => "PhysicalDamage",
        ("FireDamage", _) => "FireDamage",
        ("ColdDamage", _) => "ColdDamage",
        ("LightningDamage", _) => "LightningDamage",
        ("ChaosDamage", _) => "ChaosDamage",
        ("ElementalDamage", _) => "Damage",
        ("CritChance", _) => "CritChance",
        ("CritMultiplier", _) => "CritMultiplier",
        ("Speed", _) | ("AttackSpeed", _) | ("CastSpeed", _) => "AttackSpeed",
        ("DamageOverTime", _) | ("DotMultiplier", _) => "DamageOverTime",
        ("AreaDamage", _) => "Damage",
        ("ProjectileDamage", _) => "Damage",
        _ => return None,
    };

    let mod_type = match m.mod_type.as_str() {
        "more" | "MORE" => "more",
        "inc" | "INC" | "increased" => "increased",
        "base" | "BASE" => "flat",
        _ => "more",
    };

    Some(Modifier {
        stat: stat.into(),
        value: m.value,
        mod_type: mod_type.into(),
    })
}

fn map_raw_stat(stat: &str, value: f64) -> Option<Modifier> {
    let lower = stat.to_lowercase();

    // Added damage min/max
    if lower.contains("minimum_added") || lower.contains("minimum_base") {
        let element = detect_element(&lower);
        return Some(flat(&format!("Added{element}Min"), value));
    }
    if lower.contains("maximum_added") || lower.contains("maximum_base") {
        let element = detect_element(&lower);
        return Some(flat(&format!("Added{element}Max"), value));
    }

    // Penetration (both "penetration/penetrate" and "reduce_enemy_X_resistance")
    if lower.contains("penetration") || lower.contains("penetrate") {
        let element = detect_element(&lower);
        return Some(flat(&format!("{element}Penetration"), value));
    }
    if lower.contains("reduce_enemy") && lower.contains("resistance") {
        if lower.contains("elemental") {
            return Some(flat("ElementalPenetration", value));
        }
        let element = detect_element(&lower);
        return Some(flat(&format!("{element}Penetration"), value));
    }

    // Cast speed / attack speed
    if lower.contains("cast_speed") {
        return Some(inc("AttackSpeed", value));
    }
    if lower.contains("attack_speed") {
        return Some(inc("AttackSpeed", value));
    }

    // Crit chance / crit multiplier
    if lower.contains("critical_strike_chance") {
        return Some(inc("CritChance", value));
    }
    if lower.contains("critical_strike_multiplier") {
        return Some(flat("CritMultiplier", value));
    }

    // Damage-as-extra-element (e.g. physical_damage_%_to_add_as_fire)
    if lower.contains("damage_%_to_add_as") || lower.contains("damage_to_add_as") {
        let element = detect_element(&lower);
        return Some(flat(&format!("PhysGainAs{element}"), value));
    }

    // Spell / projectile / area damage
    if lower.contains("spell_damage") {
        return Some(inc("SpellDamage", value));
    }
    if lower.contains("projectile_damage") {
        return Some(inc("Damage", value));
    }
    if lower.contains("area_damage") {
        return Some(inc("Damage", value));
    }

    // More multipliers from support raw stats
    if lower.contains("more_damage") || lower == "damage_+%_final" {
        return Some(Modifier { stat: "Damage".into(), value, mod_type: "more".into() });
    }

    None
}

fn inc(stat: &str, value: f64) -> Modifier {
    Modifier { stat: stat.into(), value, mod_type: "increased".into() }
}

fn detect_element(s: &str) -> &'static str {
    if s.contains("fire") { "Fire" }
    else if s.contains("cold") { "Cold" }
    else if s.contains("lightning") { "Lightning" }
    else if s.contains("chaos") { "Chaos" }
    else { "Physical" }
}

pub fn get_support_modifiers_at_level(support_name: &str, level: u32) -> Vec<Modifier> {
    let lower = support_name.to_lowercase();

    // Try data-driven lookup first
    let index = gems::support_name_index();
    if let Some(skill_id) = index.get(&lower)
        .or_else(|| index.get(&lower.replace(" support", "")))
    {
        if let Some((level_mods, constant_mods)) = gems::lookup_support_mods(skill_id, level) {
            let mut mods: Vec<Modifier> = level_mods.iter()
                .filter_map(map_support_mod)
                .collect();
            for cm in &constant_mods {
                if let Some(m) = map_support_mod(cm) {
                    mods.push(m);
                }
            }
            if !mods.is_empty() {
                return mods;
            }
        }
    }

    // Fallback to hardcoded table for supports without parseable statMap
    hardcoded_support_mods(&lower, level)
}

pub fn get_support_modifiers(support_name: &str) -> Vec<Modifier> {
    get_support_modifiers_at_level(support_name, 20)
}

fn flat(stat: &str, value: f64) -> Modifier {
    Modifier { stat: stat.into(), value, mod_type: "flat".into() }
}

fn more(stat: &str, value: f64) -> Modifier {
    Modifier { stat: stat.into(), value, mod_type: "more".into() }
}

fn hardcoded_support_mods(name: &str, _level: u32) -> Vec<Modifier> {
    let mut mods = Vec::new();

    if name.contains("melee physical") { mods.push(more("PhysicalDamage", 49.0)); }
    if name.contains("brutality") { mods.push(more("PhysicalDamage", 59.0)); }
    if name.contains("elemental damage with attacks") {
        mods.push(more("FireDamage", 54.0));
        mods.push(more("ColdDamage", 54.0));
        mods.push(more("LightningDamage", 54.0));
    }
    if name.contains("faster attacks") { mods.push(more("AttackSpeed", 44.0)); }
    if name.contains("faster casting") { mods.push(more("AttackSpeed", 39.0)); }
    if name.contains("multistrike") {
        mods.push(more("AttackSpeed", 44.0));
        mods.push(more("Damage", -26.0));
    }
    if name.contains("unleash") { mods.push(more("Damage", -25.0)); }
    if name.contains("increased critical strikes") {
        mods.push(Modifier { stat: "CritChance".into(), value: 88.0, mod_type: "increased".into() });
    }
    if name.contains("increased critical damage") {
        mods.push(Modifier { stat: "CritMultiplier".into(), value: 88.0, mod_type: "flat".into() });
    }
    if name.contains("empower") { mods.push(more("Damage", 30.0)); }
    if name.contains("trinity") {
        mods.push(more("Damage", 41.0));
        mods.push(flat("FirePenetration", 15.0));
        mods.push(flat("ColdPenetration", 15.0));
        mods.push(flat("LightningPenetration", 15.0));
    }

    mods
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_controlled_destruction_from_json() {
        let mods = get_support_modifiers("Controlled Destruction Support");
        assert!(!mods.is_empty(), "should have mods from JSON");
        let dmg = mods.iter().find(|m| m.stat == "SpellDamage" || m.stat == "Damage").unwrap();
        assert_eq!(dmg.mod_type, "more");
        assert!((dmg.value - 39.0).abs() < 2.0, "value should be ~39, got {}", dmg.value);
    }

    #[test]
    fn test_controlled_destruction_has_crit_penalty() {
        let mods = get_support_modifiers("Controlled Destruction Support");
        let crit = mods.iter().find(|m| m.stat == "CritChance");
        assert!(crit.is_some(), "should have CritChance penalty from constant_mods");
        assert!(crit.unwrap().value < 0.0, "CritChance should be negative");
    }

    #[test]
    fn test_level_scaling() {
        let l1 = get_support_modifiers_at_level("Controlled Destruction Support", 1);
        let l20 = get_support_modifiers_at_level("Controlled Destruction Support", 20);
        let dmg_l1 = l1.iter().find(|m| m.stat == "SpellDamage" || m.stat == "Damage").unwrap();
        let dmg_l20 = l20.iter().find(|m| m.stat == "SpellDamage" || m.stat == "Damage").unwrap();
        assert!(dmg_l1.value < dmg_l20.value, "L1 ({}) should be less than L20 ({})", dmg_l1.value, dmg_l20.value);
    }

    #[test]
    fn test_unknown_support_empty() {
        let mods = get_support_modifiers("Nonexistent Support Gem");
        assert!(mods.is_empty());
    }

    #[test]
    fn test_added_cold_damage_from_json() {
        let mods = get_support_modifiers("Added Cold Damage Support");
        let min = mods.iter().find(|m| m.stat.contains("Cold") && m.stat.contains("Min"));
        let max = mods.iter().find(|m| m.stat.contains("Cold") && m.stat.contains("Max"));
        assert!(min.is_some(), "should have min cold damage, got {:?}", mods);
        assert!(max.is_some(), "should have max cold damage");
        assert!(min.unwrap().value > 0.0);
        assert!(max.unwrap().value > min.unwrap().value);
    }

    #[test]
    fn test_gmp_from_json() {
        let mods = get_support_modifiers("Greater Multiple Projectiles Support");
        assert!(!mods.is_empty(), "GMP should have mods");
        let dmg = mods.iter().find(|m| m.stat.contains("Damage"));
        assert!(dmg.is_some(), "GMP should have damage penalty");
        assert!(dmg.unwrap().value < 0.0, "GMP damage should be negative");
    }

    #[test]
    fn test_support_count() {
        let idx = gems::support_name_index();
        assert!(idx.len() > 100, "should have >100 support name mappings, got {}", idx.len());
    }
}
