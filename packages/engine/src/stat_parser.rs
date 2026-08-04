use crate::Modifier;

/// Parse a PoE stat description line into zero or more Modifiers.
pub fn parse_stat_line(line: &str) -> Vec<Modifier> {
    let line = line.trim();
    if line.is_empty() {
        return vec![];
    }

    let mut mods = Vec::new();

    // --- Life ---------------------------------------------------------------
    if let Some(val) = extract_value(line, "to maximum life") {
        mods.push(flat("Life", val));
    }
    if let Some(val) = extract_pct(line, "increased maximum life") {
        mods.push(increased("Life", val));
    }

    // --- Energy Shield ------------------------------------------------------
    if let Some(val) = extract_value(line, "to maximum energy shield") {
        mods.push(flat("EnergyShield", val));
    }
    if let Some(val) = extract_pct(line, "increased maximum energy shield") {
        mods.push(increased("EnergyShield", val));
    }

    // --- Mana ---------------------------------------------------------------
    if let Some(val) = extract_value(line, "to maximum mana") {
        mods.push(flat("Mana", val));
    }
    if let Some(val) = extract_pct(line, "increased maximum mana") {
        mods.push(increased("Mana", val));
    }

    // --- Attributes ---------------------------------------------------------
    if let Some(val) = extract_value(line, "to all attributes") {
        mods.push(flat("Str", val));
        mods.push(flat("Dex", val));
        mods.push(flat("Int", val));
    } else {
        if let Some(val) = extract_value(line, "to strength") {
            mods.push(flat("Str", val));
        }
        if let Some(val) = extract_value(line, "to dexterity") {
            mods.push(flat("Dex", val));
        }
        if let Some(val) = extract_value(line, "to intelligence") {
            mods.push(flat("Int", val));
        }
    }

    // --- Resistances --------------------------------------------------------
    if let Some(val) = extract_pct_value(line, "to all elemental resistances") {
        mods.push(flat("FireRes", val));
        mods.push(flat("ColdRes", val));
        mods.push(flat("LightningRes", val));
    } else {
        if let Some(val) = extract_pct_value(line, "to fire resistance") {
            mods.push(flat("FireRes", val));
        }
        if let Some(val) = extract_pct_value(line, "to cold resistance") {
            mods.push(flat("ColdRes", val));
        }
        if let Some(val) = extract_pct_value(line, "to lightning resistance") {
            mods.push(flat("LightningRes", val));
        }
    }
    if let Some(val) = extract_pct_value(line, "to chaos resistance") {
        mods.push(flat("ChaosRes", val));
    }

    // --- Armour / Evasion ---------------------------------------------------
    if let Some(val) = extract_value(line, "to armour") {
        mods.push(flat("Armour", val));
    }
    if let Some(val) = extract_pct(line, "increased armour") {
        mods.push(increased("Armour", val));
    }
    if let Some(val) = extract_value(line, "to evasion rating") {
        mods.push(flat("Evasion", val));
    }
    if let Some(val) = extract_pct(line, "increased evasion rating") {
        mods.push(increased("Evasion", val));
    }

    // --- Per-type damage ----------------------------------------------------
    // Order matters: check specific types before generic "increased damage"
    {
        let lower = line.to_lowercase();
        let is_minion = lower.contains("minions") || lower.contains("allies") || lower.contains("enemies");

        // Elemental damage (fire + cold + lightning)
        if !is_minion {
            if let Some(val) = extract_pct(line, "increased elemental damage") {
                mods.push(increased("FireDamage", val));
                mods.push(increased("ColdDamage", val));
                mods.push(increased("LightningDamage", val));
            }
            if let Some(val) = extract_pct(line, "more elemental damage") {
                mods.push(more("FireDamage", val));
                mods.push(more("ColdDamage", val));
                mods.push(more("LightningDamage", val));
            }
        }

        // Individual damage types
        if !is_minion {
            if let Some(val) = extract_pct(line, "increased physical damage") {
                mods.push(increased("PhysicalDamage", val));
            }
            if let Some(val) = extract_pct(line, "more physical damage") {
                mods.push(more("PhysicalDamage", val));
            }
            if let Some(val) = extract_pct(line, "increased fire damage") {
                mods.push(increased("FireDamage", val));
            }
            if let Some(val) = extract_pct(line, "more fire damage") {
                mods.push(more("FireDamage", val));
            }
            if let Some(val) = extract_pct(line, "increased cold damage") {
                mods.push(increased("ColdDamage", val));
            }
            if let Some(val) = extract_pct(line, "more cold damage") {
                mods.push(more("ColdDamage", val));
            }
            if let Some(val) = extract_pct(line, "increased lightning damage") {
                mods.push(increased("LightningDamage", val));
            }
            if let Some(val) = extract_pct(line, "increased chaos damage") {
                mods.push(increased("ChaosDamage", val));
            }

            // Spell / Attack damage
            if let Some(val) = extract_pct(line, "increased spell damage") {
                mods.push(increased("SpellDamage", val));
            }
            if let Some(val) = extract_pct(line, "more spell damage") {
                mods.push(more("SpellDamage", val));
            }
            if let Some(val) = extract_pct(line, "increased attack damage") {
                mods.push(increased("AttackDamage", val));
            }

            // Damage over time
            if let Some(val) = extract_pct(line, "increased damage over time") {
                mods.push(increased("DamageOverTime", val));
            }
            if let Some(val) = extract_pct(line, "more damage over time") {
                mods.push(more("DamageOverTime", val));
            }
        }

        // Global damage (generic, after specific types)
        if !is_minion {
            // Only match generic "increased damage" when no type keyword is present
            let has_type_keyword = lower.contains("physical") || lower.contains("fire")
                || lower.contains("cold") || lower.contains("lightning")
                || lower.contains("chaos") || lower.contains("elemental")
                || lower.contains("spell") || lower.contains("attack")
                || lower.contains("over time");
            if !has_type_keyword {
                if let Some(val) = extract_pct(line, "increased damage") {
                    mods.push(increased("Damage", val));
                }
                if let Some(val) = extract_pct(line, "more damage") {
                    mods.push(more("Damage", val));
                }
            }
        }
    }

    // --- Added flat damage ranges -------------------------------------------
    if let Some((min, max)) = extract_damage_range(line, "physical damage") {
        mods.push(flat("AddedPhysMin", min));
        mods.push(flat("AddedPhysMax", max));
    }
    if let Some((min, max)) = extract_damage_range(line, "fire damage") {
        mods.push(flat("AddedFireMin", min));
        mods.push(flat("AddedFireMax", max));
    }
    if let Some((min, max)) = extract_damage_range(line, "cold damage") {
        mods.push(flat("AddedColdMin", min));
        mods.push(flat("AddedColdMax", max));
    }
    if let Some((min, max)) = extract_damage_range(line, "lightning damage") {
        mods.push(flat("AddedLightningMin", min));
        mods.push(flat("AddedLightningMax", max));
    }
    if let Some((min, max)) = extract_damage_range(line, "chaos damage") {
        mods.push(flat("AddedChaosMin", min));
        mods.push(flat("AddedChaosMax", max));
    }

    // --- Speed --------------------------------------------------------------
    if let Some(val) = extract_pct(line, "increased attack speed") {
        mods.push(increased("AttackSpeed", val));
    }
    if let Some(val) = extract_pct(line, "increased cast speed") {
        mods.push(increased("AttackSpeed", val));
    }

    // --- Crit ---------------------------------------------------------------
    if let Some(val) = extract_pct(line, "increased critical strike chance") {
        mods.push(increased("CritChance", val));
    }
    if let Some(val) = extract_pct_value(line, "to critical strike multiplier") {
        mods.push(flat("CritMultiplier", val));
    }

    // --- Block --------------------------------------------------------------
    if let Some(val) = extract_pct_value(line, "chance to block") {
        mods.push(flat("BlockChance", val));
    }
    if let Some(val) = extract_pct(line, "increased block chance") {
        mods.push(increased("BlockChance", val));
    }

    // --- Accuracy -----------------------------------------------------------
    if let Some(val) = extract_value(line, "to accuracy rating") {
        mods.push(flat("Accuracy", val));
    }
    if let Some(val) = extract_pct(line, "increased accuracy rating") {
        mods.push(increased("Accuracy", val));
    }

    // --- Suppression --------------------------------------------------------
    if let Some(val) = extract_pct_value(line, "chance to suppress spell damage") {
        mods.push(flat("SpellSuppression", val));
    }

    // --- Penetration --------------------------------------------------------
    {
        let lower = line.to_lowercase();
        if lower.contains("penetrat") {
            if let Some(val) = extract_pct_value(line, "fire resistance") {
                if lower.contains("penetrat") { mods.push(flat("FirePenetration", val)); }
            }
            if let Some(val) = extract_pct_value(line, "cold resistance") {
                if lower.contains("penetrat") { mods.push(flat("ColdPenetration", val)); }
            }
            if let Some(val) = extract_pct_value(line, "lightning resistance") {
                if lower.contains("penetrat") { mods.push(flat("LightningPenetration", val)); }
            }
            if let Some(val) = extract_pct_value(line, "chaos resistance") {
                if lower.contains("penetrat") { mods.push(flat("ChaosPenetration", val)); }
            }
            if let Some(val) = extract_pct_value(line, "elemental resistance") {
                if lower.contains("penetrat") {
                    mods.push(flat("FirePenetration", val));
                    mods.push(flat("ColdPenetration", val));
                    mods.push(flat("LightningPenetration", val));
                }
            }
        }
    }

    // --- Curse effect -------------------------------------------------------
    if let Some(val) = extract_pct(line, "increased effect of curses") {
        mods.push(increased("CurseEffect", val));
    }
    if let Some(val) = extract_pct(line, "increased effect of your curses") {
        mods.push(increased("CurseEffect", val));
    }

    // --- Aura effect --------------------------------------------------------
    if let Some(val) = extract_pct(line, "increased effect of non-curse auras") {
        mods.push(increased("AuraEffect", val));
    }
    if let Some(val) = extract_pct(line, "increased aura effect") {
        mods.push(increased("AuraEffect", val));
    }

    // --- Minion modifiers ---------------------------------------------------
    {
        let lower = line.to_lowercase();
        if lower.contains("minion") {
            if let Some(val) = extract_pct(line, "increased minion damage") {
                mods.push(increased("MinionDamage", val));
            }
            if let Some(val) = extract_pct(line, "increased minion attack speed") {
                mods.push(increased("MinionSpeed", val));
            }
            if let Some(val) = extract_pct(line, "increased minion life") {
                mods.push(increased("MinionLife", val));
            }
            if let Some(val) = extract_pct(line, "increased minion movement speed") {
                mods.push(increased("MinionMoveSpeed", val));
            }
        }
        if lower.contains("minions deal") && lower.contains("increased damage") {
            if let Some(val) = extract_pct(line, "increased damage") {
                mods.push(increased("MinionDamage", val));
            }
        }
    }

    mods
}

/// Parse multiple stat lines (from a passive node or item).
pub fn parse_stats(lines: &[String]) -> Vec<Modifier> {
    lines.iter().flat_map(|line| parse_stat_line(line)).collect()
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn flat(stat: &str, value: f64) -> Modifier {
    Modifier {
        stat: stat.into(),
        value,
        mod_type: "flat".into(),
    }
}

fn increased(stat: &str, value: f64) -> Modifier {
    Modifier {
        stat: stat.into(),
        value,
        mod_type: "increased".into(),
    }
}

fn more(stat: &str, value: f64) -> Modifier {
    Modifier {
        stat: stat.into(),
        value,
        mod_type: "more".into(),
    }
}

/// Extract "Adds X to Y <type> damage" ranges
fn extract_damage_range(line: &str, damage_suffix: &str) -> Option<(f64, f64)> {
    let lower = line.to_lowercase();
    if !lower.contains("adds") || !lower.contains(&damage_suffix.to_lowercase()) {
        return None;
    }
    // Pattern: "Adds X to Y <type> damage"
    let suffix_idx = lower.find(&damage_suffix.to_lowercase())?;
    let before = &line[..suffix_idx];
    // Find two numbers separated by "to"
    let parts: Vec<&str> = before.split_whitespace().collect();
    let mut nums = Vec::new();
    for part in &parts {
        if let Ok(n) = part.parse::<f64>() {
            nums.push(n);
        }
    }
    if nums.len() >= 2 {
        Some((nums[nums.len() - 2], nums[nums.len() - 1]))
    } else {
        None
    }
}

/// "+123 to maximum life" -> 123
fn extract_value(line: &str, suffix: &str) -> Option<f64> {
    let lower = line.to_lowercase();
    if !lower.contains(&suffix.to_lowercase()) {
        return None;
    }
    let idx = lower.find(&suffix.to_lowercase())?;
    parse_number_before(&line[..idx])
}

/// "15% increased maximum life" -> 15
fn extract_pct(line: &str, suffix: &str) -> Option<f64> {
    let lower = line.to_lowercase();
    if !lower.contains(&suffix.to_lowercase()) {
        return None;
    }
    let idx = lower.find(&suffix.to_lowercase())?;
    let before = &line[..idx].trim_end();
    let pct_idx = before.rfind('%')?;
    parse_number_before(&before[..pct_idx])
}

/// "+30% to fire resistance" -> 30
fn extract_pct_value(line: &str, suffix: &str) -> Option<f64> {
    let lower = line.to_lowercase();
    if !lower.contains(&suffix.to_lowercase()) {
        return None;
    }
    if let Some(pct_idx) = line.find('%') {
        return parse_number_before(&line[..pct_idx]);
    }
    extract_value(line, suffix)
}

fn parse_number_before(s: &str) -> Option<f64> {
    let s = s.trim_end();
    let num_str: String = s
        .chars()
        .rev()
        .take_while(|c| c.is_ascii_digit() || *c == '.' || *c == '-' || *c == '+')
        .collect::<String>()
        .chars()
        .rev()
        .collect();
    num_str.trim_start_matches('+').parse().ok()
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_flat_life() {
        let mods = parse_stat_line("+50 to maximum Life");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "Life");
        assert_eq!(mods[0].value, 50.0);
        assert_eq!(mods[0].mod_type, "flat");
    }

    #[test]
    fn test_increased_life() {
        let mods = parse_stat_line("8% increased maximum Life");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "Life");
        assert_eq!(mods[0].value, 8.0);
        assert_eq!(mods[0].mod_type, "increased");
    }

    #[test]
    fn test_all_attributes() {
        let mods = parse_stat_line("+10 to all Attributes");
        assert_eq!(mods.len(), 3);
        assert!(mods.iter().all(|m| m.value == 10.0));
        let stats: Vec<_> = mods.iter().map(|m| m.stat.as_str()).collect();
        assert!(stats.contains(&"Str"));
        assert!(stats.contains(&"Dex"));
        assert!(stats.contains(&"Int"));
    }

    #[test]
    fn test_fire_res() {
        let mods = parse_stat_line("+30% to Fire Resistance");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "FireRes");
        assert_eq!(mods[0].value, 30.0);
    }

    #[test]
    fn test_all_ele_res() {
        let mods = parse_stat_line("+12% to all Elemental Resistances");
        assert_eq!(mods.len(), 3);
        let stats: Vec<_> = mods.iter().map(|m| m.stat.as_str()).collect();
        assert!(stats.contains(&"FireRes"));
        assert!(stats.contains(&"ColdRes"));
        assert!(stats.contains(&"LightningRes"));
    }

    #[test]
    fn test_increased_armour() {
        let mods = parse_stat_line("25% increased Armour");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "Armour");
        assert_eq!(mods[0].value, 25.0);
        assert_eq!(mods[0].mod_type, "increased");
    }

    #[test]
    fn test_crit_multi() {
        let mods = parse_stat_line("+25% to Critical Strike Multiplier");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "CritMultiplier");
        assert_eq!(mods[0].value, 25.0);
    }

    #[test]
    fn test_attack_speed() {
        let mods = parse_stat_line("10% increased Attack Speed");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "AttackSpeed");
        assert_eq!(mods[0].value, 10.0);
        assert_eq!(mods[0].mod_type, "increased");
    }

    #[test]
    fn test_cast_speed() {
        let mods = parse_stat_line("5% increased Cast Speed");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "AttackSpeed");
        assert_eq!(mods[0].value, 5.0);
    }

    #[test]
    fn test_unknown_line() {
        let mods = parse_stat_line("Some completely unknown stat text xyz");
        assert!(mods.is_empty());
    }

    #[test]
    fn test_empty_line() {
        assert!(parse_stat_line("").is_empty());
        assert!(parse_stat_line("   ").is_empty());
    }

    #[test]
    fn test_multiple_lines() {
        let lines = vec![
            "+50 to maximum Life".to_string(),
            "+30% to Fire Resistance".to_string(),
            "10% increased Attack Speed".to_string(),
        ];
        let mods = parse_stats(&lines);
        assert_eq!(mods.len(), 3);
    }

    #[test]
    fn test_flat_accuracy() {
        let mods = parse_stat_line("+200 to Accuracy Rating");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "Accuracy");
        assert_eq!(mods[0].value, 200.0);
    }

    #[test]
    fn test_spell_suppression() {
        let mods = parse_stat_line("+15% chance to Suppress Spell Damage");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "SpellSuppression");
        assert_eq!(mods[0].value, 15.0);
    }

    #[test]
    fn test_more_damage() {
        let mods = parse_stat_line("39% more Damage");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "Damage");
        assert_eq!(mods[0].value, 39.0);
        assert_eq!(mods[0].mod_type, "more");
    }

    #[test]
    fn test_flat_es() {
        let mods = parse_stat_line("+100 to maximum Energy Shield");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "EnergyShield");
        assert_eq!(mods[0].value, 100.0);
    }

    #[test]
    fn test_chaos_res() {
        let mods = parse_stat_line("+17% to Chaos Resistance");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "ChaosRes");
        assert_eq!(mods[0].value, 17.0);
    }

    #[test]
    fn test_no_double_match_attributes() {
        let mods = parse_stat_line("+10 to Strength");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "Str");
    }

    // --- Per-type damage tests ---

    #[test]
    fn test_increased_fire_damage() {
        let mods = parse_stat_line("30% increased Fire Damage");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "FireDamage");
        assert_eq!(mods[0].value, 30.0);
        assert_eq!(mods[0].mod_type, "increased");
    }

    #[test]
    fn test_increased_elemental_damage() {
        let mods = parse_stat_line("20% increased Elemental Damage");
        assert_eq!(mods.len(), 3);
        let stats: Vec<_> = mods.iter().map(|m| m.stat.as_str()).collect();
        assert!(stats.contains(&"FireDamage"));
        assert!(stats.contains(&"ColdDamage"));
        assert!(stats.contains(&"LightningDamage"));
    }

    #[test]
    fn test_increased_spell_damage() {
        let mods = parse_stat_line("40% increased Spell Damage");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "SpellDamage");
        assert_eq!(mods[0].mod_type, "increased");
    }

    #[test]
    fn test_more_physical_damage() {
        let mods = parse_stat_line("49% more Physical Damage");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "PhysicalDamage");
        assert_eq!(mods[0].mod_type, "more");
    }

    #[test]
    fn test_increased_damage_over_time() {
        let mods = parse_stat_line("20% increased Damage over Time");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "DamageOverTime");
        assert_eq!(mods[0].mod_type, "increased");
    }

    // --- Added damage range tests ---

    #[test]
    fn test_adds_physical_damage() {
        let mods = parse_stat_line("Adds 10 to 20 Physical Damage");
        assert_eq!(mods.len(), 2);
        assert_eq!(mods[0].stat, "AddedPhysMin");
        assert_eq!(mods[0].value, 10.0);
        assert_eq!(mods[1].stat, "AddedPhysMax");
        assert_eq!(mods[1].value, 20.0);
    }

    #[test]
    fn test_adds_fire_damage() {
        let mods = parse_stat_line("Adds 50 to 80 Fire Damage");
        assert_eq!(mods.len(), 2);
        assert_eq!(mods[0].stat, "AddedFireMin");
        assert_eq!(mods[0].value, 50.0);
        assert_eq!(mods[1].stat, "AddedFireMax");
        assert_eq!(mods[1].value, 80.0);
    }

    #[test]
    fn test_adds_cold_damage() {
        let mods = parse_stat_line("Adds 30 to 60 Cold Damage");
        assert_eq!(mods.len(), 2);
        assert_eq!(mods[0].stat, "AddedColdMin");
        assert_eq!(mods[0].value, 30.0);
    }

    #[test]
    fn test_minion_damage_now_matched() {
        let mods = parse_stat_line("Minions deal 30% increased Damage");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "MinionDamage");
        assert_eq!(mods[0].value, 30.0);
    }

    #[test]
    fn test_generic_damage_not_matched_when_typed() {
        // "increased Fire Damage" should produce FireDamage, NOT also generic Damage
        let mods = parse_stat_line("30% increased Fire Damage");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "FireDamage");
    }

    // --- Minion / Aura / Curse tests ---

    #[test]
    fn test_minion_damage_increased() {
        let mods = parse_stat_line("30% increased Minion Damage");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "MinionDamage");
        assert_eq!(mods[0].value, 30.0);
        assert_eq!(mods[0].mod_type, "increased");
    }

    #[test]
    fn test_minions_deal_increased_damage() {
        let mods = parse_stat_line("Minions deal 25% increased Damage");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "MinionDamage");
        assert_eq!(mods[0].value, 25.0);
    }

    #[test]
    fn test_minion_attack_speed() {
        let mods = parse_stat_line("10% increased Minion Attack Speed");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "MinionSpeed");
    }

    #[test]
    fn test_minion_life() {
        let mods = parse_stat_line("20% increased Minion Life");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "MinionLife");
    }

    #[test]
    fn test_aura_effect() {
        let mods = parse_stat_line("15% increased effect of Non-Curse Auras");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "AuraEffect");
        assert_eq!(mods[0].value, 15.0);
    }

    #[test]
    fn test_curse_effect_your_curses() {
        let mods = parse_stat_line("20% increased effect of your Curses");
        assert!(mods.iter().any(|m| m.stat == "CurseEffect" && m.value == 20.0));
    }
}
