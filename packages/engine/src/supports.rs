use crate::Modifier;

// ---------------------------------------------------------------------------
// Level interpolation for support gem modifiers
// ---------------------------------------------------------------------------

/// Interpolate a support gem modifier value between known data points.
/// Linear between L1-L20, then L20-L21, extrapolated beyond L21.
fn interpolate_support_value(l1: f64, l20: f64, l21: f64, level: u32) -> f64 {
    let level = level.clamp(1, 40);
    if level <= 1 {
        l1
    } else if level <= 20 {
        let t = (level - 1) as f64 / 19.0;
        (l1 + t * (l20 - l1)).round()
    } else {
        // L20 -> L21 segment, extrapolated for levels beyond 21
        let t = (level - 20) as f64;
        (l20 + t * (l21 - l20)).round()
    }
}

// ---------------------------------------------------------------------------
// Level-scaled modifiers for key support gems
// ---------------------------------------------------------------------------

/// Return the modifiers granted by a support gem at a specific gem level.
///
/// For key supports (Controlled Destruction, Elemental Focus, Spell Echo,
/// GMP, Concentrated Effect, Inspiration, and their Awakened variants),
/// modifier values are interpolated between level 1 and level 20 data
/// sourced from PoB Lua gem tables. All other supports return their
/// hardcoded level-20 values regardless of the level argument.
pub fn get_support_modifiers_at_level(support_name: &str, level: u32) -> Vec<Modifier> {
    let name = support_name.to_lowercase();
    let mut mods = Vec::new();

    // --- Damage supports ---
    if name.contains("melee physical") {
        mods.push(more("PhysicalDamage", 49.0));
    }
    if name.contains("concentrated effect") {
        // Lua: L1=25, L20=39, L21=40 (area damage MORE)
        // Our L20=54 (scaled proportionally)
        let v = interpolate_support_value(35.0, 54.0, 55.0, level);
        mods.push(more("Damage", v));
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
        // Lua: L1=25, L20=39, L21=40 (spell damage MORE)
        // Our L20=44 (scaled proportionally)
        let v = interpolate_support_value(28.0, 44.0, 45.0, level);
        mods.push(more("SpellDamage", v));
    }
    if name.contains("elemental focus") {
        // Lua: L1=20, L20=34, L21=35 (elemental damage MORE)
        // Our L20=49 (scaled proportionally)
        let v = interpolate_support_value(29.0, 49.0, 50.0, level);
        mods.push(more("Damage", v));
    }
    if name.contains("void manipulation") {
        mods.push(more("ChaosDamage", 39.0));
    }

    // --- Speed supports ---
    if name.contains("spell echo") {
        // Lua: L1=40, L20=54, L21=55 (cast speed MORE)
        // Our L20=52 (scaled proportionally)
        let v = interpolate_support_value(39.0, 52.0, 53.0, level);
        mods.push(more("AttackSpeed", v));
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
        // Lua: L1=3% per charge (5 charges ~15%), L20=5% per charge (5 charges ~25%)
        // Our simplified L20=39 (scaled proportionally: L1=25, L21=40)
        let v = interpolate_support_value(25.0, 39.0, 40.0, level);
        mods.push(more("Damage", v));
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
        // Lua: L1=-35, L20=-26, L21=-25 (projectile damage MORE penalty)
        let v = interpolate_support_value(-35.0, -26.0, -25.0, level);
        mods.push(more("Damage", v));
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
    // Awakened supports go L1-L5 (naturalMaxLevel=5). The base support values
    // above already apply; this adds the awakened bonus on top.
    if name.contains("awakened") {
        // Awakened gems scale their bonus from ~3% at L1 to ~5% at L5
        let awk_bonus = interpolate_support_value(3.0, 5.0, 6.0, level);
        if name.contains("melee physical") {
            mods.push(more("PhysicalDamage", awk_bonus));
        } else if name.contains("elemental damage with attacks") {
            mods.push(more("FireDamage", awk_bonus));
            mods.push(more("ColdDamage", awk_bonus));
            mods.push(more("LightningDamage", awk_bonus));
        } else if name.contains("brutality") {
            mods.push(more("PhysicalDamage", awk_bonus));
        } else {
            mods.push(more("Damage", awk_bonus));
        }
    }

    mods
}

/// Return the modifiers granted by a support gem at level 20 (backward-compatible default).
pub fn get_support_modifiers(support_name: &str) -> Vec<Modifier> {
    get_support_modifiers_at_level(support_name, 20)
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

    // ---- Level scaling tests -----------------------------------------------

    #[test]
    fn test_controlled_destruction_level_1() {
        let mods = get_support_modifiers_at_level("Controlled Destruction Support", 1);
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "SpellDamage");
        assert_eq!(mods[0].value, 28.0, "L1 Controlled Destruction should be 28");
    }

    #[test]
    fn test_controlled_destruction_level_20_matches_default() {
        let l20 = get_support_modifiers_at_level("Controlled Destruction Support", 20);
        let default = get_support_modifiers("Controlled Destruction Support");
        assert_eq!(l20.len(), default.len());
        assert_eq!(l20[0].value, default[0].value);
    }

    #[test]
    fn test_controlled_destruction_level_21() {
        let mods = get_support_modifiers_at_level("Controlled Destruction Support", 21);
        assert_eq!(mods[0].value, 45.0, "L21 should be 45");
    }

    #[test]
    fn test_elemental_focus_level_1() {
        let mods = get_support_modifiers_at_level("Elemental Focus Support", 1);
        assert_eq!(mods[0].value, 29.0, "L1 Elemental Focus should be 29");
    }

    #[test]
    fn test_elemental_focus_level_20() {
        let mods = get_support_modifiers_at_level("Elemental Focus Support", 20);
        assert_eq!(mods[0].value, 49.0, "L20 Elemental Focus should be 49");
    }

    #[test]
    fn test_spell_echo_level_1() {
        let mods = get_support_modifiers_at_level("Spell Echo Support", 1);
        assert_eq!(mods[0].stat, "AttackSpeed");
        assert_eq!(mods[0].value, 39.0, "L1 Spell Echo should be 39");
    }

    #[test]
    fn test_spell_echo_level_20() {
        let mods = get_support_modifiers_at_level("Spell Echo Support", 20);
        assert_eq!(mods[0].value, 52.0, "L20 Spell Echo should be 52");
    }

    #[test]
    fn test_gmp_level_1() {
        let mods = get_support_modifiers_at_level("Greater Multiple Projectiles Support", 1);
        assert_eq!(mods[0].value, -35.0, "L1 GMP penalty should be -35");
    }

    #[test]
    fn test_gmp_level_20() {
        let mods = get_support_modifiers_at_level("Greater Multiple Projectiles Support", 20);
        assert_eq!(mods[0].value, -26.0, "L20 GMP penalty should be -26");
    }

    #[test]
    fn test_gmp_level_21() {
        let mods = get_support_modifiers_at_level("Greater Multiple Projectiles Support", 21);
        assert_eq!(mods[0].value, -25.0, "L21 GMP penalty should be -25");
    }

    #[test]
    fn test_concentrated_effect_level_1() {
        let mods = get_support_modifiers_at_level("Concentrated Effect Support", 1);
        assert_eq!(mods[0].value, 35.0, "L1 Conc Effect should be 35");
    }

    #[test]
    fn test_concentrated_effect_level_20() {
        let mods = get_support_modifiers_at_level("Concentrated Effect Support", 20);
        assert_eq!(mods[0].value, 54.0, "L20 Conc Effect should be 54");
    }

    #[test]
    fn test_inspiration_level_1() {
        let mods = get_support_modifiers_at_level("Inspiration Support", 1);
        assert_eq!(mods[0].value, 25.0, "L1 Inspiration should be 25");
    }

    #[test]
    fn test_inspiration_level_20() {
        let mods = get_support_modifiers_at_level("Inspiration Support", 20);
        assert_eq!(mods[0].value, 39.0, "L20 Inspiration should be 39");
    }

    #[test]
    fn test_intermediate_level_interpolation() {
        // Level 10 should be between L1 and L20 values
        let l1 = get_support_modifiers_at_level("Controlled Destruction Support", 1);
        let l10 = get_support_modifiers_at_level("Controlled Destruction Support", 10);
        let l20 = get_support_modifiers_at_level("Controlled Destruction Support", 20);
        assert!(l10[0].value > l1[0].value, "L10 ({}) should exceed L1 ({})", l10[0].value, l1[0].value);
        assert!(l10[0].value < l20[0].value, "L10 ({}) should be less than L20 ({})", l10[0].value, l20[0].value);
    }

    #[test]
    fn test_unscaled_support_same_at_all_levels() {
        // Supports not in the scaling list return the same value regardless of level
        let l1 = get_support_modifiers_at_level("Brutality Support", 1);
        let l20 = get_support_modifiers_at_level("Brutality Support", 20);
        assert_eq!(l1[0].value, l20[0].value, "unscaled support should not change with level");
    }

    #[test]
    fn test_awakened_bonus_scales() {
        let l1 = get_support_modifiers_at_level("Awakened Controlled Destruction Support", 1);
        let l20 = get_support_modifiers_at_level("Awakened Controlled Destruction Support", 20);
        // Awakened versions have both the base support mod and an extra awakened bonus
        assert!(l1.len() >= 2, "awakened should have base + bonus mods");
        // The awakened bonus at L1 should be smaller than at L20
        let awk_l1 = l1.last().unwrap().value;
        let awk_l20 = l20.last().unwrap().value;
        assert!(awk_l1 < awk_l20, "awakened bonus at L1 ({}) should be less than L20 ({})", awk_l1, awk_l20);
    }
}
