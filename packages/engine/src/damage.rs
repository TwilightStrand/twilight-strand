use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// The five damage types in PoE, ordered by conversion chain priority.
/// Conversion flows: Physical -> Lightning -> Cold -> Fire -> Chaos
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum DamageType {
    Physical,
    Lightning,
    Cold,
    Fire,
    Chaos,
}

impl DamageType {
    pub const ALL: [DamageType; 5] = [
        DamageType::Physical,
        DamageType::Lightning,
        DamageType::Cold,
        DamageType::Fire,
        DamageType::Chaos,
    ];

    pub const ELEMENTAL: [DamageType; 3] = [
        DamageType::Lightning,
        DamageType::Cold,
        DamageType::Fire,
    ];

    pub fn conversion_targets(self) -> &'static [DamageType] {
        match self {
            DamageType::Physical => &[DamageType::Lightning, DamageType::Cold, DamageType::Fire, DamageType::Chaos],
            DamageType::Lightning => &[DamageType::Cold, DamageType::Fire, DamageType::Chaos],
            DamageType::Cold => &[DamageType::Fire, DamageType::Chaos],
            DamageType::Fire => &[DamageType::Chaos],
            DamageType::Chaos => &[],
        }
    }
}

/// Per-type damage values before and after conversion/scaling.
#[derive(Debug, Clone, Default)]
pub struct DamageSet {
    pub values: HashMap<DamageType, f64>,
}

impl DamageSet {
    pub fn new() -> Self {
        Self { values: HashMap::new() }
    }

    pub fn get(&self, dt: DamageType) -> f64 {
        self.values.get(&dt).copied().unwrap_or(0.0)
    }

    pub fn set(&mut self, dt: DamageType, val: f64) {
        self.values.insert(dt, val);
    }

    pub fn add(&mut self, dt: DamageType, val: f64) {
        *self.values.entry(dt).or_insert(0.0) += val;
    }

    pub fn total(&self) -> f64 {
        self.values.values().sum()
    }
}

/// Conversion percentages from one type to another.
/// Key: (source, target), Value: percentage (0-100).
/// Total conversion from any source is capped at 100%.
pub type ConversionTable = HashMap<(DamageType, DamageType), f64>;

/// Apply damage conversion following PoE's chain order.
///
/// For each source type (processed in chain order), any conversion
/// percentages are applied. If total conversion from a source exceeds
/// 100%, percentages are scaled down proportionally.
pub fn apply_conversion(base: &DamageSet, conversions: &ConversionTable) -> DamageSet {
    let mut result = DamageSet::new();

    for &source in &DamageType::ALL {
        let base_val = base.get(source);
        if base_val <= 0.0 {
            continue;
        }

        let targets = source.conversion_targets();
        let mut total_conv_pct: f64 = 0.0;
        let mut conv_entries: Vec<(DamageType, f64)> = Vec::new();

        for &target in targets {
            let pct = conversions.get(&(source, target)).copied().unwrap_or(0.0);
            if pct > 0.0 {
                conv_entries.push((target, pct));
                total_conv_pct += pct;
            }
        }

        // Cap total conversion at 100% by scaling down proportionally
        let scale = if total_conv_pct > 100.0 {
            100.0 / total_conv_pct
        } else {
            1.0
        };

        for (target, pct) in &conv_entries {
            let effective_pct = pct * scale;
            let converted = base_val * effective_pct / 100.0;
            result.add(*target, converted);
        }

        let remaining_pct = (100.0 - total_conv_pct.min(100.0)) / 100.0;
        result.add(source, base_val * remaining_pct);
    }

    result
}

/// Per-type modifier buckets: (flat, increased%, more_multiplier)
pub type DamageModifiers = HashMap<DamageType, (f64, f64, f64)>;

/// Apply increased/more modifiers to each damage type independently.
pub fn apply_damage_modifiers(damage: &DamageSet, mods: &DamageModifiers) -> DamageSet {
    let mut result = DamageSet::new();
    for &dt in &DamageType::ALL {
        let base = damage.get(dt);
        if base <= 0.0 && !mods.contains_key(&dt) {
            continue;
        }
        let (flat, inc, more) = mods.get(&dt).copied().unwrap_or((0.0, 0.0, 1.0));
        let val = (base + flat) * (1.0 + inc / 100.0) * more;
        if val > 0.0 {
            result.set(dt, val);
        }
    }
    result
}

// ---------------------------------------------------------------------------
// Hit damage calculation
// ---------------------------------------------------------------------------

/// Result of a single hit damage calculation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HitResult {
    pub per_type: HashMap<String, f64>,
    pub total_hit: f64,
    pub avg_hit: f64,
    pub dps: f64,
    pub crit_chance: f64,
    pub crit_multi: f64,
    pub attack_speed: f64,
    pub hit_chance: f64,
}

/// Calculate hit DPS from base damage, conversion, modifiers, crit, speed, and accuracy.
pub fn calc_hit_dps(
    base_damage: &DamageSet,
    conversions: &ConversionTable,
    type_mods: &DamageModifiers,
    global_inc: f64,
    global_more: f64,
    crit_chance: f64,
    crit_multi: f64,
    attack_speed: f64,
    hit_chance: f64,
) -> HitResult {
    // 1. Apply conversion
    let converted = apply_conversion(base_damage, conversions);

    // 2. Apply per-type modifiers
    let typed = apply_damage_modifiers(&converted, type_mods);

    // 3. Apply global increased/more
    let mut final_damage = DamageSet::new();
    for &dt in &DamageType::ALL {
        let val = typed.get(dt);
        if val > 0.0 {
            let scaled = val * (1.0 + global_inc / 100.0) * global_more;
            final_damage.set(dt, scaled);
        }
    }

    let total_hit = final_damage.total();
    let effective_crit = crit_chance.clamp(0.0, 100.0);
    let avg_hit = total_hit * (1.0 + (effective_crit / 100.0) * (crit_multi / 100.0 - 1.0));
    let dps = avg_hit * attack_speed * (hit_chance / 100.0);

    let mut per_type = HashMap::new();
    for &dt in &DamageType::ALL {
        let v = final_damage.get(dt);
        if v > 0.0 {
            per_type.insert(format!("{:?}", dt), v);
        }
    }

    HitResult {
        per_type,
        total_hit,
        avg_hit,
        dps,
        crit_chance: effective_crit,
        crit_multi,
        attack_speed,
        hit_chance,
    }
}

// ---------------------------------------------------------------------------
// Damage over Time
// ---------------------------------------------------------------------------

/// Result of DoT calculation for a single ailment type.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DotResult {
    pub base_dps: f64,
    pub total_dps: f64,
    pub duration: f64,
    pub stacks: u32,
    pub total_damage: f64,
}

/// Calculate Bleed DPS.
///
/// Bleed base = 70% of physical hit damage.
/// Duration default: 5 seconds.
/// Only one bleed instance by default (Crimson Dance allows 8).
pub fn calc_bleed(
    phys_hit: f64,
    bleed_inc: f64,
    bleed_more: f64,
    duration_inc: f64,
    crimson_dance: bool,
) -> DotResult {
    let base = phys_hit * 0.7;
    let base_dps = base * (1.0 + bleed_inc / 100.0) * bleed_more;
    let duration = 5.0 * (1.0 + duration_inc / 100.0);
    let stacks = if crimson_dance { 8 } else { 1 };
    let total_dps = base_dps * stacks as f64;
    let total_damage = total_dps * duration;

    DotResult { base_dps, total_dps, duration, stacks, total_damage }
}

/// Calculate Poison DPS.
///
/// Poison base = 20% of combined physical + chaos hit damage.
/// Default duration: 2 seconds. Poisons stack infinitely.
/// `stacks` approximated as attack_speed * duration * chance.
pub fn calc_poison(
    phys_hit: f64,
    chaos_hit: f64,
    poison_inc: f64,
    poison_more: f64,
    duration_inc: f64,
    poison_chance: f64,
    attack_speed: f64,
) -> DotResult {
    let base = (phys_hit + chaos_hit) * 0.2;
    let base_dps = base * (1.0 + poison_inc / 100.0) * poison_more;
    let duration = 2.0 * (1.0 + duration_inc / 100.0);
    let effective_chance = (poison_chance / 100.0).min(1.0);
    let stacks = (attack_speed * duration * effective_chance).ceil() as u32;
    let total_dps = base_dps * stacks as f64;
    let total_damage = base_dps * duration * stacks as f64;

    DotResult { base_dps, total_dps, duration, stacks, total_damage }
}

/// Calculate Ignite DPS.
///
/// Ignite base = 90% of fire hit damage (or 56% of combined damage with
/// Elemental Equilibrium-style effects, but we use the simple path here).
/// Default duration: 4 seconds. Only one ignite at a time.
pub fn calc_ignite(
    fire_hit: f64,
    ignite_inc: f64,
    ignite_more: f64,
    duration_inc: f64,
) -> DotResult {
    let base = fire_hit * 0.9;
    let base_dps = base * (1.0 + ignite_inc / 100.0) * ignite_more;
    let duration = 4.0 * (1.0 + duration_inc / 100.0);
    let stacks = 1;
    let total_dps = base_dps;
    let total_damage = total_dps * duration;

    DotResult { base_dps, total_dps, duration, stacks, total_damage }
}

/// Aggregate DPS from all DoT sources.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct DotSummary {
    pub bleed_dps: f64,
    pub poison_dps: f64,
    pub ignite_dps: f64,
    pub total_dot_dps: f64,
}

impl DotSummary {
    pub fn new(bleed: Option<&DotResult>, poison: Option<&DotResult>, ignite: Option<&DotResult>) -> Self {
        let bleed_dps = bleed.map(|b| b.total_dps).unwrap_or(0.0);
        let poison_dps = poison.map(|p| p.total_dps).unwrap_or(0.0);
        let ignite_dps = ignite.map(|i| i.total_dps).unwrap_or(0.0);
        DotSummary {
            bleed_dps,
            poison_dps,
            ignite_dps,
            total_dot_dps: bleed_dps + poison_dps + ignite_dps,
        }
    }
}

// ---------------------------------------------------------------------------
// Damage effectiveness (for spells)
// ---------------------------------------------------------------------------

/// Apply spell damage effectiveness to added damage.
/// PoE spells have a "damage effectiveness" value (e.g., 0.6 = 60%)
/// that scales any added flat damage.
pub fn apply_effectiveness(flat_damage: f64, effectiveness: f64) -> f64 {
    flat_damage * effectiveness
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_no_conversion() {
        let mut base = DamageSet::new();
        base.set(DamageType::Physical, 100.0);
        let conv = ConversionTable::new();
        let result = apply_conversion(&base, &conv);
        assert!((result.get(DamageType::Physical) - 100.0).abs() < 0.01);
        assert!(result.get(DamageType::Fire).abs() < 0.01);
    }

    #[test]
    fn test_full_phys_to_fire() {
        let mut base = DamageSet::new();
        base.set(DamageType::Physical, 100.0);
        let mut conv = ConversionTable::new();
        conv.insert((DamageType::Physical, DamageType::Fire), 100.0);
        let result = apply_conversion(&base, &conv);
        assert!(result.get(DamageType::Physical).abs() < 0.01);
        assert!((result.get(DamageType::Fire) - 100.0).abs() < 0.01);
    }

    #[test]
    fn test_partial_conversion() {
        let mut base = DamageSet::new();
        base.set(DamageType::Physical, 100.0);
        let mut conv = ConversionTable::new();
        conv.insert((DamageType::Physical, DamageType::Cold), 40.0);
        conv.insert((DamageType::Physical, DamageType::Fire), 30.0);
        let result = apply_conversion(&base, &conv);
        assert!((result.get(DamageType::Physical) - 30.0).abs() < 0.01);
        assert!((result.get(DamageType::Cold) - 40.0).abs() < 0.01);
        assert!((result.get(DamageType::Fire) - 30.0).abs() < 0.01);
        assert!((result.total() - 100.0).abs() < 0.01);
    }

    #[test]
    fn test_over_100_conversion_scales_down() {
        let mut base = DamageSet::new();
        base.set(DamageType::Physical, 200.0);
        let mut conv = ConversionTable::new();
        conv.insert((DamageType::Physical, DamageType::Lightning), 60.0);
        conv.insert((DamageType::Physical, DamageType::Cold), 60.0);
        // Total 120% -> scaled to 100%
        let result = apply_conversion(&base, &conv);
        assert!(result.get(DamageType::Physical).abs() < 0.01, "phys should be 0");
        assert!((result.total() - 200.0).abs() < 0.01, "total should be preserved");
        // Each gets 50% (60/120 * 100)
        assert!((result.get(DamageType::Lightning) - 100.0).abs() < 0.01);
        assert!((result.get(DamageType::Cold) - 100.0).abs() < 0.01);
    }

    #[test]
    fn test_chained_conversion() {
        // Phys -> Lightning 50%, then Lightning -> Cold 50%
        // PoE conversion applies per-type on base damage only.
        // Phys 100: 50% -> Lightning = 50 converted, 50 remains phys
        // Lightning 50 (base only, NOT including converted): 50% -> Cold = 25 converted, 25 remains
        // The 50 that converted from phys->lightning stays as lightning (already converted once)
        let mut base = DamageSet::new();
        base.set(DamageType::Physical, 100.0);
        base.set(DamageType::Lightning, 50.0);
        let mut conv = ConversionTable::new();
        conv.insert((DamageType::Physical, DamageType::Lightning), 50.0);
        conv.insert((DamageType::Lightning, DamageType::Cold), 50.0);
        let result = apply_conversion(&base, &conv);
        // Phys: 50 remains
        assert!((result.get(DamageType::Physical) - 50.0).abs() < 0.01);
        // Lightning: 50 (from phys conversion) + 25 (50% of base 50 stays) = 75
        assert!((result.get(DamageType::Lightning) - 75.0).abs() < 0.01);
        // Cold: 25 (50% of base 50 lightning)
        assert!((result.get(DamageType::Cold) - 25.0).abs() < 0.01);
        assert!((result.total() - 150.0).abs() < 0.01);
    }

    #[test]
    fn test_damage_modifiers() {
        let mut damage = DamageSet::new();
        damage.set(DamageType::Physical, 100.0);
        damage.set(DamageType::Fire, 50.0);
        let mut mods = DamageModifiers::new();
        mods.insert(DamageType::Physical, (0.0, 50.0, 1.0)); // 50% increased
        mods.insert(DamageType::Fire, (10.0, 0.0, 1.2)); // +10 flat, 20% more
        let result = apply_damage_modifiers(&damage, &mods);
        assert!((result.get(DamageType::Physical) - 150.0).abs() < 0.01);
        assert!((result.get(DamageType::Fire) - 72.0).abs() < 0.01); // (50+10)*1.2
    }

    #[test]
    fn test_hit_dps() {
        let mut base = DamageSet::new();
        base.set(DamageType::Physical, 100.0);
        let conv = ConversionTable::new();
        let mods = DamageModifiers::new();
        let result = calc_hit_dps(
            &base, &conv, &mods,
            0.0, 1.0, // global inc/more
            5.0, 150.0, // crit chance/multi
            1.0, 100.0, // attack speed, hit chance
        );
        assert!(result.dps > 0.0);
        assert!((result.total_hit - 100.0).abs() < 0.01);
    }

    #[test]
    fn test_bleed() {
        let result = calc_bleed(1000.0, 0.0, 1.0, 0.0, false);
        assert!((result.base_dps - 700.0).abs() < 0.01);
        assert_eq!(result.stacks, 1);
        assert!((result.duration - 5.0).abs() < 0.01);
    }

    #[test]
    fn test_bleed_crimson_dance() {
        let result = calc_bleed(1000.0, 0.0, 1.0, 0.0, true);
        assert_eq!(result.stacks, 8);
        assert!((result.total_dps - 5600.0).abs() < 0.01);
    }

    #[test]
    fn test_poison() {
        let result = calc_poison(500.0, 300.0, 0.0, 1.0, 0.0, 100.0, 2.0);
        // base = (500+300)*0.2 = 160 dps per stack
        assert!((result.base_dps - 160.0).abs() < 0.01);
        // stacks = ceil(2.0 * 2.0 * 1.0) = 4
        assert_eq!(result.stacks, 4);
        assert!((result.total_dps - 640.0).abs() < 0.01);
    }

    #[test]
    fn test_ignite() {
        let result = calc_ignite(1000.0, 50.0, 1.0, 0.0);
        // base = 1000 * 0.9 = 900, with 50% inc = 1350
        assert!((result.base_dps - 1350.0).abs() < 0.01);
        assert_eq!(result.stacks, 1);
        assert!((result.duration - 4.0).abs() < 0.01);
    }

    #[test]
    fn test_dot_summary() {
        let bleed = calc_bleed(1000.0, 0.0, 1.0, 0.0, false);
        let ignite = calc_ignite(1000.0, 0.0, 1.0, 0.0);
        let summary = DotSummary::new(Some(&bleed), None, Some(&ignite));
        assert!(summary.total_dot_dps > 0.0);
        assert_eq!(summary.poison_dps, 0.0);
        assert!((summary.bleed_dps - 700.0).abs() < 0.01);
        assert!((summary.ignite_dps - 900.0).abs() < 0.01);
    }

    #[test]
    fn test_effectiveness() {
        assert!((apply_effectiveness(100.0, 0.6) - 60.0).abs() < 0.01);
        assert!((apply_effectiveness(100.0, 1.0) - 100.0).abs() < 0.01);
    }

    #[test]
    fn test_total_preserved_through_conversion() {
        let mut base = DamageSet::new();
        base.set(DamageType::Physical, 500.0);
        base.set(DamageType::Cold, 200.0);

        let mut conv = ConversionTable::new();
        conv.insert((DamageType::Physical, DamageType::Fire), 50.0);
        conv.insert((DamageType::Cold, DamageType::Fire), 100.0);

        let result = apply_conversion(&base, &conv);
        assert!(
            (result.total() - 700.0).abs() < 0.01,
            "total should be preserved: got {}",
            result.total()
        );
    }
}
