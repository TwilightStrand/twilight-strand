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

    // --- Damage (only match global, not "Minions deal X% increased Damage") --
    {
        let lower = line.to_lowercase();
        let is_global_damage = (lower.contains("increased damage") || lower.contains("more damage"))
            && !lower.contains("minions")
            && !lower.contains("allies")
            && !lower.contains("enemies");
        if is_global_damage {
            if let Some(val) = extract_pct(line, "increased damage") {
                mods.push(increased("Damage", val));
            }
            if let Some(val) = extract_pct(line, "more damage") {
                mods.push(Modifier {
                    stat: "Damage".into(),
                    value: val,
                    mod_type: "more".into(),
                });
            }
        }
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
        let mods = parse_stat_line("Minions deal 20% increased Damage");
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
}
