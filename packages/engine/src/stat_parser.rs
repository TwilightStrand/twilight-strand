use crate::Modifier;
use crate::mod_db::{self, ModFlags, ConditionId, MultiplierId, ModType, StatId};
#[cfg(test)]
use crate::mod_db::ModTag;

/// Strip `(X-Y)` range notation to midpoint value, e.g. "(5-10)" -> "8"
/// Also handles negative ranges like "(-10-10)" -> "0"
fn strip_ranges(line: &str) -> String {
    let mut result = String::with_capacity(line.len());
    let mut chars = line.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '(' {
            let mut inner = String::new();
            for ic in chars.by_ref() {
                if ic == ')' { break; }
                inner.push(ic);
            }
            // Find the separator dash: skip leading minus sign for negative numbers
            let start = if inner.starts_with('-') { 1 } else { 0 };
            if let Some(rel_idx) = inner[start..].find('-') {
                let dash_idx = start + rel_idx;
                let left = inner[..dash_idx].trim();
                let right = inner[dash_idx + 1..].trim();
                if let (Ok(lo), Ok(hi)) = (left.parse::<f64>(), right.parse::<f64>()) {
                    let mid = ((lo + hi) / 2.0 * 10.0).round() / 10.0;
                    if mid == mid.floor() {
                        result.push_str(&format!("{}", mid as i64));
                    } else {
                        result.push_str(&format!("{}", mid));
                    }
                    continue;
                }
            }
            result.push('(');
            result.push_str(&inner);
            result.push(')');
        } else {
            result.push(c);
        }
    }
    result
}

// ---------------------------------------------------------------------------
// Table-driven parser types
// ---------------------------------------------------------------------------

#[derive(Copy, Clone, Debug, PartialEq)]
enum Extract { Value, Pct, PctValue, DamageRange }

#[derive(Copy, Clone, Debug, PartialEq)]
enum ModOut { Flat, Increased, More }

const S_NONE: &str = "";

#[derive(Copy, Clone)]
struct StatRule {
    suffix: &'static str,
    extract: Extract,
    mod_out: ModOut,
    stats: [&'static str; 4],
    scale: f64,
    requires: [&'static str; 2],
    excludes: [&'static str; 4],
    not_minion: bool,
    not_minion_alt: bool,
    no_type_kw: bool,
    not_combined: bool,
    not_global: bool,
    priority: u8,
    group: u16,
}

impl StatRule {
    const fn new(extract: Extract, suffix: &'static str, mod_out: ModOut, stat: &'static str) -> Self {
        StatRule {
            suffix, extract, mod_out,
            stats: [stat, S_NONE, S_NONE, S_NONE],
            scale: 1.0,
            requires: [S_NONE, S_NONE],
            excludes: [S_NONE, S_NONE, S_NONE, S_NONE],
            not_minion: false, not_minion_alt: false, no_type_kw: false,
            not_combined: false, not_global: false,
            priority: 0, group: 0,
        }
    }

    const fn multi2(extract: Extract, suffix: &'static str, mod_out: ModOut, s1: &'static str, s2: &'static str) -> Self {
        StatRule {
            suffix, extract, mod_out,
            stats: [s1, s2, S_NONE, S_NONE],
            scale: 1.0,
            requires: [S_NONE, S_NONE],
            excludes: [S_NONE, S_NONE, S_NONE, S_NONE],
            not_minion: false, not_minion_alt: false, no_type_kw: false,
            not_combined: false, not_global: false,
            priority: 0, group: 0,
        }
    }

    const fn multi3(extract: Extract, suffix: &'static str, mod_out: ModOut, s1: &'static str, s2: &'static str, s3: &'static str) -> Self {
        StatRule {
            suffix, extract, mod_out,
            stats: [s1, s2, s3, S_NONE],
            scale: 1.0,
            requires: [S_NONE, S_NONE],
            excludes: [S_NONE, S_NONE, S_NONE, S_NONE],
            not_minion: false, not_minion_alt: false, no_type_kw: false,
            not_combined: false, not_global: false,
            priority: 0, group: 0,
        }
    }

    const fn multi4(extract: Extract, suffix: &'static str, mod_out: ModOut, s1: &'static str, s2: &'static str, s3: &'static str, s4: &'static str) -> Self {
        StatRule {
            suffix, extract, mod_out,
            stats: [s1, s2, s3, s4],
            scale: 1.0,
            requires: [S_NONE, S_NONE],
            excludes: [S_NONE, S_NONE, S_NONE, S_NONE],
            not_minion: false, not_minion_alt: false, no_type_kw: false,
            not_combined: false, not_global: false,
            priority: 0, group: 0,
        }
    }

    const fn scale(mut self, s: f64) -> Self { self.scale = s; self }
    const fn group(mut self, g: u16) -> Self { self.group = g; self }
    const fn fallback(mut self) -> Self { self.priority = 1; self }
    const fn requires(mut self, r: [&'static str; 2]) -> Self { self.requires = r; self }
    const fn excludes(mut self, e: [&'static str; 4]) -> Self { self.excludes = e; self }
    const fn guard_not_minion(mut self) -> Self { self.not_minion = true; self }
    const fn guard_not_minion_alt(mut self) -> Self { self.not_minion_alt = true; self }
    const fn guard_no_type_kw(mut self) -> Self { self.no_type_kw = true; self }
    const fn guard_not_combined(mut self) -> Self { self.not_combined = true; self }
    const fn guard_not_global(mut self) -> Self { self.not_global = true; self }
}

struct LineCtx {
    is_minion: bool,
    is_minion_alt: bool,
    has_type_kw: bool,
    is_combined: bool,
    has_global: bool,
}

impl LineCtx {
    fn new(lower: &str) -> Self {
        let minions = lower.contains("minions");
        let allies = lower.contains("allies");
        let enemies = lower.contains("enemies");
        LineCtx {
            is_minion: minions || allies || enemies,
            is_minion_alt: minions || allies,
            has_type_kw: lower.contains("physical") || lower.contains("fire")
                || lower.contains("cold") || lower.contains("lightning")
                || lower.contains("chaos") || lower.contains("elemental")
                || lower.contains("spell") || lower.contains("attack")
                || lower.contains("over time") || lower.contains("melee")
                || lower.contains("projectile") || lower.contains("area"),
            is_combined: (lower.contains("armour") && lower.contains("evasion"))
                || (lower.contains("evasion") && lower.contains("energy shield")),
            has_global: lower.contains("global"),
        }
    }
}

use Extract::*;
use ModOut::*;

static RULES: &[StatRule] = &[
    // === Life ===
    StatRule::new(Value, "to maximum life", Flat, "Life"),
    StatRule::new(Pct, "increased maximum life", Increased, "Life"),
    StatRule::new(Pct, "more maximum life", More, "Life"),

    // === Energy Shield ===
    StatRule::new(Value, "to maximum energy shield", Flat, "EnergyShield"),
    StatRule::new(Pct, "increased maximum energy shield", Increased, "EnergyShield")
        .excludes(["recovery", "recharge", "leech", ""]).group(1),
    StatRule::new(Pct, "increased energy shield", Increased, "EnergyShield")
        .excludes(["recovery", "recharge", "leech", ""]).group(1),
    StatRule::new(Pct, "more energy shield", More, "EnergyShield")
        .excludes(["recovery", "recharge", "leech", ""]),

    // === Mana ===
    StatRule::new(Value, "to maximum mana", Flat, "Mana"),
    StatRule::new(Pct, "increased maximum mana", Increased, "Mana").group(2),
    StatRule::new(Pct, "increased mana", Increased, "Mana").group(2)
        .excludes(["mana regen", "mana cost", "mana reservation", ""]),

    // === Attributes ===
    StatRule::multi3(Value, "to all attributes", Flat, "Str", "Dex", "Int").group(3),
    StatRule::multi2(Value, "to strength and dexterity", Flat, "Str", "Dex").group(3),
    StatRule::multi2(Value, "to strength and intelligence", Flat, "Str", "Int").group(3),
    StatRule::multi2(Value, "to dexterity and intelligence", Flat, "Dex", "Int").group(3),
    StatRule::new(Value, "to strength", Flat, "Str")
        .excludes(["all attributes", "and dexterity", "and intelligence", ""]),
    StatRule::new(Value, "to dexterity", Flat, "Dex")
        .excludes(["all attributes", "strength and", "and intelligence", ""]),
    StatRule::new(Value, "to intelligence", Flat, "Int")
        .excludes(["all attributes", "strength and", "dexterity and", ""]),

    // === Resistances ===
    StatRule::multi3(PctValue, "to all elemental resistances", Flat, "FireRes", "ColdRes", "LightningRes").group(4),
    StatRule::new(PctValue, "to fire resistance", Flat, "FireRes")
        .excludes(["all elemental", "all resistances", "", ""]),
    StatRule::new(PctValue, "to cold resistance", Flat, "ColdRes")
        .excludes(["all elemental", "all resistances", "", ""]),
    StatRule::new(PctValue, "to lightning resistance", Flat, "LightningRes")
        .excludes(["all elemental", "all resistances", "", ""]),
    StatRule::new(PctValue, "to chaos resistance", Flat, "ChaosRes")
        .excludes(["all resistances", "", "", ""]),
    StatRule::multi4(PctValue, "to all resistances", Flat, "FireRes", "ColdRes", "LightningRes", "ChaosRes"),

    // === Armour / Evasion (individual, not combined) ===
    StatRule::new(Value, "to armour", Flat, "Armour").guard_not_combined(),
    StatRule::new(Pct, "increased armour", Increased, "Armour").guard_not_combined(),
    StatRule::new(Value, "to evasion rating", Flat, "Evasion").guard_not_combined(),
    StatRule::new(Pct, "increased evasion rating", Increased, "Evasion").guard_not_combined(),

    // === Combined Evasion+Armour / Evasion+ES ===
    StatRule::multi2(Pct, "increased evasion rating and armour", Increased, "Evasion", "Armour").group(5),
    StatRule::multi2(Pct, "increased armour and evasion", Increased, "Armour", "Evasion").group(5),
    StatRule::multi2(Pct, "increased evasion and energy shield", Increased, "Evasion", "EnergyShield"),

    // === Per-type damage (guarded by NOT_MINION) ===
    StatRule::multi3(Pct, "increased elemental damage", Increased, "FireDamage", "ColdDamage", "LightningDamage").guard_not_minion(),
    StatRule::multi3(Pct, "more elemental damage", More, "FireDamage", "ColdDamage", "LightningDamage").guard_not_minion(),
    StatRule::new(Pct, "increased physical damage", Increased, "PhysicalDamage").guard_not_minion()
        .excludes(["attack physical damage", "melee physical damage", "physical attack damage", ""]),
    StatRule::new(Pct, "more physical damage", More, "PhysicalDamage").guard_not_minion(),
    StatRule::new(Pct, "increased fire damage", Increased, "FireDamage").guard_not_minion(),
    StatRule::new(Pct, "more fire damage", More, "FireDamage").guard_not_minion(),
    StatRule::new(Pct, "increased cold damage", Increased, "ColdDamage").guard_not_minion(),
    StatRule::new(Pct, "more cold damage", More, "ColdDamage").guard_not_minion(),
    StatRule::new(Pct, "increased lightning damage", Increased, "LightningDamage").guard_not_minion(),
    StatRule::new(Pct, "increased chaos damage", Increased, "ChaosDamage").guard_not_minion(),
    StatRule::new(Pct, "increased spell damage", Increased, "SpellDamage").guard_not_minion(),
    StatRule::new(Pct, "more spell damage", More, "SpellDamage").guard_not_minion(),
    StatRule::new(Pct, "increased attack damage", Increased, "AttackDamage").guard_not_minion(),
    StatRule::new(Pct, "increased damage over time", Increased, "DamageOverTime").guard_not_minion(),
    StatRule::new(Pct, "more damage over time", More, "DamageOverTime").guard_not_minion(),
    StatRule::new(Pct, "increased attack physical damage", Increased, "PhysicalDamage").guard_not_minion()
        .requires(["attack", ""]),
    StatRule::new(Pct, "increased melee physical damage", Increased, "PhysicalDamage").guard_not_minion()
        .requires(["melee", ""]),

    // Weapon-specific: "X Attacks deal Y% increased Damage"
    StatRule::new(Pct, "increased damage", Increased, "Damage").guard_not_minion()
        .requires(["attacks deal", ""]),

    // DoT multiplier per element
    StatRule::new(PctValue, "to fire damage over time multiplier", Flat, "DamageOverTimeMulti").guard_not_minion(),
    StatRule::new(PctValue, "to cold damage over time multiplier", Flat, "DamageOverTimeMulti").guard_not_minion(),
    StatRule::new(PctValue, "to chaos damage over time multiplier", Flat, "DamageOverTimeMulti").guard_not_minion(),
    StatRule::new(PctValue, "to physical damage over time multiplier", Flat, "DamageOverTimeMulti").guard_not_minion(),

    // Ailment chance in damage block
    StatRule::new(PctValue, "chance to cause bleeding on hit", Flat, "BleedChance").guard_not_minion().group(6),
    StatRule::new(PctValue, "chance to cause bleeding", Flat, "BleedChance").guard_not_minion().group(6),
    StatRule::new(PctValue, "chance to ignite", Flat, "IgniteChance").guard_not_minion(),

    // Generic damage (only when no type keyword present)
    StatRule::new(Pct, "increased damage", Increased, "Damage").guard_not_minion().guard_no_type_kw()
        .excludes(["attacks deal", "", "", ""]),
    StatRule::new(Pct, "more damage", More, "Damage").guard_not_minion().guard_no_type_kw(),

    // === Added flat damage ranges ===
    StatRule::multi2(DamageRange, "physical damage", Flat, "AddedPhysMin", "AddedPhysMax"),
    StatRule::multi2(DamageRange, "fire damage", Flat, "AddedFireMin", "AddedFireMax"),
    StatRule::multi2(DamageRange, "cold damage", Flat, "AddedColdMin", "AddedColdMax"),
    StatRule::multi2(DamageRange, "lightning damage", Flat, "AddedLightningMin", "AddedLightningMax"),
    StatRule::multi2(DamageRange, "chaos damage", Flat, "AddedChaosMin", "AddedChaosMax"),

    // === Projectile / Area / Melee damage (NOT_MINION_ALT) ===
    StatRule::new(Pct, "increased projectile damage", Increased, "ProjectileDamage").guard_not_minion_alt(),
    StatRule::new(Pct, "increased area damage", Increased, "AreaDamage").guard_not_minion_alt(),
    StatRule::new(Pct, "increased melee damage", Increased, "MeleeDamage").guard_not_minion_alt(),
    StatRule::new(Pct, "increased elemental damage with attack skills", Increased, "Damage").guard_not_minion_alt(),
    StatRule::new(Pct, "increased projectile speed", Increased, "ProjectileSpeed").guard_not_minion_alt(),

    // === Max resistances ===
    StatRule::multi3(PctValue, "to all maximum elemental resistances", Flat, "FireResMax", "ColdResMax", "LightningResMax").group(7),
    StatRule::new(PctValue, "to maximum fire resistance", Flat, "FireResMax").group(7),
    StatRule::new(PctValue, "to maximum cold resistance", Flat, "ColdResMax").group(7),
    StatRule::new(PctValue, "to maximum lightning resistance", Flat, "LightningResMax").group(7),

    // === DoT Multiplier (generic) ===
    StatRule::new(PctValue, "to damage over time multiplier", Flat, "DamageOverTimeMulti"),

    // === Mana Regen (% increased) ===
    StatRule::new(Pct, "increased mana regeneration rate", Increased, "ManaRegen"),

    // === Movement Speed ===
    StatRule::new(Pct, "increased movement speed", Increased, "MovementSpeed"),

    // === Leech ===
    StatRule::new(Pct, "of attack damage leeched as life", Flat, "LifeLeechPct")
        .requires(["leeched as life", ""]).group(8),
    StatRule::new(Pct, "of physical attack damage leeched as life", Flat, "LifeLeechPct")
        .requires(["leeched as life", ""]).group(8),
    StatRule::new(Pct, "of damage leeched as life", Flat, "LifeLeechPct")
        .requires(["leeched as life", ""]).group(8),
    StatRule::new(Pct, "of damage leeched as energy shield", Flat, "ESLeechPct")
        .requires(["leeched as energy shield", ""]),

    // === Mana Reservation Efficiency ===
    StatRule::new(Pct, "increased mana reservation efficiency", Increased, "ManaReservationEfficiency"),

    // === Skill Duration ===
    StatRule::new(Pct, "increased skill effect duration", Increased, "SkillDuration"),

    // === Area of Effect ===
    StatRule::new(Pct, "increased area of effect", Increased, "AreaOfEffect"),

    // === Global Crit Chance ===
    StatRule::new(Pct, "increased global critical strike chance", Increased, "CritChance"),

    // === Speed ===
    StatRule::new(Pct, "increased attack speed", Increased, "AttackSpeed"),
    StatRule::new(Pct, "increased cast speed", Increased, "AttackSpeed"),
    StatRule::new(Pct, "increased attack and cast speed", Increased, "AttackSpeed"),

    // === Crit chance (non-global) ===
    StatRule::new(Pct, "increased critical strike chance", Increased, "CritChance").guard_not_global().group(9),
    // Catch variants: "Melee/Attack/Spell Critical Strike Chance"
    StatRule::new(Pct, "critical strike chance", Increased, "CritChance").guard_not_global().group(9)
        .requires(["increased", ""]),

    // === Crit Multiplier ===
    StatRule::new(PctValue, "to global critical strike multiplier", Flat, "CritMultiplier")
        .requires(["critical strike multiplier", ""]).group(10),
    StatRule::new(PctValue, "critical strike multiplier for spells", Flat, "CritMultiplier")
        .requires(["critical strike multiplier", ""]).group(10),
    StatRule::new(PctValue, "to critical strike multiplier", Flat, "CritMultiplier")
        .requires(["critical strike multiplier", ""]).group(10),

    // === Block ===
    StatRule::new(PctValue, "chance to block", Flat, "BlockChance")
        .excludes(["spell damage", "", "", ""]),
    StatRule::new(Pct, "increased chance to block", Increased, "BlockChance"),
    StatRule::new(Pct, "increased block chance", Increased, "BlockChance"),

    // === Accuracy ===
    StatRule::new(Value, "to accuracy rating", Flat, "Accuracy"),
    StatRule::new(Pct, "increased accuracy rating", Increased, "Accuracy"),

    // === Suppression ===
    StatRule::new(PctValue, "chance to suppress spell damage", Flat, "SpellSuppression"),

    // === Penetration ===
    StatRule::new(PctValue, "fire resistance", Flat, "FirePenetration")
        .requires(["penetrat", ""]),
    StatRule::new(PctValue, "cold resistance", Flat, "ColdPenetration")
        .requires(["penetrat", ""]),
    StatRule::new(PctValue, "lightning resistance", Flat, "LightningPenetration")
        .requires(["penetrat", ""]),
    StatRule::new(PctValue, "chaos resistance", Flat, "ChaosPenetration")
        .requires(["penetrat", ""]),
    StatRule::multi3(PctValue, "elemental resistance", Flat, "FirePenetration", "ColdPenetration", "LightningPenetration")
        .requires(["penetrat", ""]),

    // === Curse / Aura effect ===
    StatRule::new(Pct, "increased effect of curses", Increased, "CurseEffect"),
    StatRule::new(Pct, "increased effect of your curses", Increased, "CurseEffect"),
    StatRule::new(Pct, "increased effect of non-curse auras", Increased, "AuraEffect"),
    StatRule::new(Pct, "increased aura effect", Increased, "AuraEffect"),

    // === Minion modifiers ===
    StatRule::new(Pct, "increased minion damage", Increased, "MinionDamage")
        .requires(["minion", ""]),
    StatRule::new(Pct, "increased minion attack speed", Increased, "MinionSpeed")
        .requires(["minion", ""]),
    StatRule::new(Pct, "increased minion life", Increased, "MinionLife")
        .requires(["minion", ""]),
    StatRule::new(Pct, "increased minion movement speed", Increased, "MinionMoveSpeed")
        .requires(["minion", ""]),
    StatRule::new(Pct, "increased damage", Increased, "MinionDamage")
        .requires(["minions deal", ""]),

    // === Gain as extra damage ===
    StatRule::new(Pct, "of physical damage as extra fire damage", Flat, "PhysGainAsFire")
        .requires(["gain", "as extra"]),
    StatRule::new(Pct, "of physical damage as extra cold damage", Flat, "PhysGainAsCold")
        .requires(["gain", "as extra"]),
    StatRule::new(Pct, "of physical damage as extra lightning damage", Flat, "PhysGainAsLightning")
        .requires(["gain", "as extra"]),
    StatRule::new(Pct, "of physical damage as extra chaos damage", Flat, "PhysGainAsChaos")
        .requires(["gain", "as extra"]),

    // === Impale ===
    StatRule::new(PctValue, "chance to impale", Flat, "ImpaleChance"),
    StatRule::new(Pct, "increased impale effect", Increased, "ImpaleEffect"),

    // === Ward ===
    StatRule::new(Value, "to ward", Flat, "Ward"),

    // === ES Recharge ===
    StatRule::new(Pct, "faster start of energy shield recharge", Increased, "ESRechargeRate"),
    StatRule::new(Pct, "increased energy shield recharge rate", Increased, "ESRechargeRate"),

    // === Conversion ===
    StatRule::new(Pct, "of physical damage converted to fire damage", Flat, "ConvPhysToFire")
        .requires(["converted to", ""]),
    StatRule::new(Pct, "of physical damage converted to cold damage", Flat, "ConvPhysToCold")
        .requires(["converted to", ""]),
    StatRule::new(Pct, "of physical damage converted to lightning damage", Flat, "ConvPhysToLightning")
        .requires(["converted to", ""]),
    StatRule::new(Pct, "of physical damage converted to chaos damage", Flat, "ConvPhysToChaos")
        .requires(["converted to", ""]),
    StatRule::new(Pct, "of cold damage converted to fire damage", Flat, "ConvColdToFire")
        .requires(["converted to", ""])
        .excludes(["physical", "", "", ""]),
    StatRule::new(Pct, "of lightning damage converted to cold damage", Flat, "ConvLightningToCold")
        .requires(["converted to", ""])
        .excludes(["physical", "", "", ""]),

    // === Spell Suppression (alternate wording) ===
    StatRule::new(PctValue, "to spell suppression chance", Flat, "SpellSuppression"),

    // === Fortify ===
    StatRule::new(Pct, "increased fortification", Increased, "Fortify"),

    // === Totem / Brand / Trap / Mine damage ===
    StatRule::new(Pct, "increased totem damage", Increased, "Damage")
        .excludes(["minion", "", "", ""]),
    StatRule::new(Pct, "increased trap damage", Increased, "Damage")
        .excludes(["minion", "", "", ""]),
    StatRule::new(Pct, "increased mine damage", Increased, "Damage")
        .excludes(["minion", "", "", ""]),
    StatRule::new(Pct, "increased brand damage", Increased, "Damage")
        .excludes(["minion", "", "", ""]),

    // === Flask effect ===
    StatRule::new(Pct, "increased flask effect", Increased, "FlaskEffect"),

    // === Cooldown recovery ===
    StatRule::new(Pct, "increased cooldown recovery rate", Increased, "CooldownRecovery"),

    // === Spell block ===
    StatRule::new(PctValue, "chance to block spell damage", Flat, "SpellBlockChance"),
    StatRule::new(Pct, "increased chance to block spell damage", Increased, "SpellBlockChance"),

    // === Avoidance ===
    StatRule::new(PctValue, "chance to avoid elemental ailments", Flat, "AilmentAvoidance"),
    StatRule::new(PctValue, "chance to avoid being stunned", Flat, "StunAvoidance"),

    // === Spell-specific crit chance ===
    StatRule::new(Pct, "increased spell critical strike chance", Increased, "CritChance")
        .requires(["spell critical strike chance", ""]),

    // === More cast speed ===
    StatRule::new(Pct, "more cast speed", More, "AttackSpeed"),

    // === Life on hit / kill ===
    StatRule::new(Value, "life gained on hit", Flat, "LifeOnHit"),
    StatRule::new(Value, "life gained on kill", Flat, "LifeOnKill"),
    StatRule::new(Value, "mana gained on kill", Flat, "ManaOnKill"),

    // === Maximum Charges ===
    StatRule::new(Value, "to maximum power charges", Flat, "MaxPowerCharges")
        .requires(["maximum power charge", ""]).group(11),
    StatRule::new(Value, "maximum power charges", Flat, "MaxPowerCharges")
        .requires(["maximum power charge", ""]).group(11),
    StatRule::new(Value, "to maximum power charge", Flat, "MaxPowerCharges")
        .requires(["maximum power charge", ""]).group(11),
    StatRule::new(Value, "to maximum frenzy charges", Flat, "MaxFrenzyCharges")
        .requires(["maximum frenzy charge", ""]).group(12),
    StatRule::new(Value, "maximum frenzy charges", Flat, "MaxFrenzyCharges")
        .requires(["maximum frenzy charge", ""]).group(12),
    StatRule::new(Value, "to maximum frenzy charge", Flat, "MaxFrenzyCharges")
        .requires(["maximum frenzy charge", ""]).group(12),
    StatRule::new(Value, "to maximum endurance charges", Flat, "MaxEnduranceCharges")
        .requires(["maximum endurance charge", ""]).group(13),
    StatRule::new(Value, "maximum endurance charges", Flat, "MaxEnduranceCharges")
        .requires(["maximum endurance charge", ""]).group(13),
    StatRule::new(Value, "to maximum endurance charge", Flat, "MaxEnduranceCharges")
        .requires(["maximum endurance charge", ""]).group(13),

    // === Physical Damage from Hits taken as Element ===
    StatRule::new(PctValue, "taken as fire damage", Flat, "PhysTakenAsFire")
        .requires(["physical damage from hits taken as", ""]),
    StatRule::new(PctValue, "taken as cold damage", Flat, "PhysTakenAsCold")
        .requires(["physical damage from hits taken as", ""]),
    StatRule::new(PctValue, "taken as lightning damage", Flat, "PhysTakenAsLightning")
        .requires(["physical damage from hits taken as", ""]),
    StatRule::new(PctValue, "taken as chaos damage", Flat, "PhysTakenAsChaos")
        .requires(["physical damage from hits taken as", ""]),

    // === Action Speed ===
    StatRule::new(Pct, "increased action speed", Increased, "ActionSpeed"),

    // === Stun and Block Recovery ===
    StatRule::new(Pct, "increased stun and block recovery", Increased, "StunBlockRecovery"),

    // === Aura effect on self ===
    StatRule::new(Pct, "increased effect", Increased, "AuraEffectOnSelf")
        .requires(["auras from your skills have", ""]),

    // === Mana Cost (flat) ===
    StatRule::new(Value, "to total mana cost", Flat, "ManaCost").group(14),
    StatRule::new(Value, "to mana cost", Flat, "ManaCost").group(14),

    // === Light Radius ===
    StatRule::new(Pct, "increased light radius", Increased, "LightRadius"),

    // -----------------------------------------------------------------------
    // FALLBACK rules (priority 1): only tried if no primary rule matched
    // -----------------------------------------------------------------------

    // === Duration / Effect (fallback) ===
    StatRule::new(Pct, "increased duration", Increased, "SkillDuration").fallback()
        .requires(["increased", ""]),
    StatRule::new(Pct, "increased cooldown recovery", Increased, "CooldownRecovery").fallback(),
    StatRule::new(Pct, "increased global critical strike chance", Increased, "CritChance").fallback(),

    // === "reduced" patterns (negative increased) ===
    StatRule::new(Pct, "reduced mana cost", Increased, "ManaCost").fallback().scale(-1.0),
    StatRule::new(Pct, "reduced mana reserved", Increased, "ManaReservationEfficiency").fallback(),
    StatRule::new(Pct, "reduced attribute requirements", Increased, "AttributeRequirements").fallback().scale(-1.0),
    StatRule::new(Pct, "reduced enemy stun threshold", Increased, "StunThreshold").fallback(),
    StatRule::new(Pct, "reduced movement speed", Increased, "MovementSpeed").fallback().scale(-1.0),
    StatRule::new(Pct, "reduced attack speed", Increased, "AttackSpeed").fallback().scale(-1.0),
    StatRule::new(Pct, "reduced effect of curses on you", Increased, "CurseEffect").fallback().scale(-1.0),
    StatRule::new(Pct, "reduced duration of ailments on you", Increased, "AilmentAvoidance").fallback(),

    // === "less" patterns (negative more) ===
    StatRule::new(Pct, "less attack speed", More, "AttackSpeed").fallback().scale(-1.0),
    StatRule::new(Pct, "less damage", More, "Damage").fallback().scale(-1.0),
    StatRule::new(Pct, "less armour", More, "Armour").fallback().scale(-1.0),
    StatRule::new(Pct, "less energy shield", More, "EnergyShield").fallback().scale(-1.0),
    StatRule::new(Pct, "less evasion", More, "Evasion").fallback().scale(-1.0),

    // === Ailment chance (fallback) ===
    StatRule::new(PctValue, "chance to ignite", Flat, "IgniteChance").fallback(),
    StatRule::new(PctValue, "chance to freeze", Flat, "FreezeChance").fallback(),
    StatRule::new(PctValue, "chance to shock", Flat, "ShockChance").fallback(),
    StatRule::new(PctValue, "chance to cause bleeding on hit", Flat, "BleedChance").fallback().group(15),
    StatRule::new(PctValue, "chance to cause bleeding", Flat, "BleedChance").fallback().group(15),
    StatRule::new(PctValue, "chance to poison on hit", Flat, "PoisonChance").fallback(),

    // === Ailment effect (fallback) ===
    StatRule::new(Pct, "increased effect of shock", Increased, "ShockEffect").fallback(),
    StatRule::new(Pct, "increased effect of chill", Increased, "ChillEffect").fallback(),

    // === Leech rate (fallback) ===
    StatRule::new(Pct, "increased total recovery per second from life leech", Increased, "LifeLeechRateInc").fallback(),
    StatRule::new(Pct, "increased maximum total life recovery per second from leech", Increased, "MaxLifeLeechRate").fallback(),

    // === Shield defences (fallback) ===
    StatRule::new(Pct, "increased defences from equipped shield", Increased, "ShieldDefences").fallback(),

    // === Flask recovery (fallback) ===
    StatRule::new(Pct, "increased life recovery from flasks", Increased, "FlaskLifeRecovery").fallback(),

    // === Totem stats (fallback) ===
    StatRule::new(Pct, "increased totem life", Increased, "TotemLife").fallback(),
    StatRule::new(Pct, "increased totem placement speed", Increased, "TotemPlacementSpeed").fallback(),
    StatRule::new(Pct, "increased totem duration", Increased, "TotemDuration").fallback(),

    // === Duration modifiers (fallback) ===
    StatRule::new(Pct, "increased poison duration", Increased, "PoisonDuration").fallback(),
    StatRule::new(Pct, "increased bleeding duration", Increased, "BleedDuration").fallback(),
    StatRule::new(Pct, "increased ignite duration on enemies", Increased, "IgniteDuration").fallback(),
    StatRule::new(Pct, "increased freeze duration on enemies", Increased, "FreezeDuration").fallback(),
    StatRule::new(Pct, "increased endurance charge duration", Increased, "ChargeDuration").fallback().group(16),
    StatRule::new(Pct, "increased frenzy charge duration", Increased, "ChargeDuration").fallback().group(16),
    StatRule::new(Pct, "increased power charge duration", Increased, "ChargeDuration").fallback().group(16),
    StatRule::new(Pct, "increased charge duration", Increased, "ChargeDuration").fallback().group(16),
    StatRule::new(Pct, "charge duration", Increased, "ChargeDuration").fallback().group(16)
        .requires(["endurance, frenzy and power", ""]),

    // === Trap / Mine (fallback) ===
    StatRule::new(Pct, "increased trap throwing speed", Increased, "TrapThrowingSpeed").fallback(),
    StatRule::new(Pct, "increased mine throwing speed", Increased, "MineThrowingSpeed").fallback(),
    StatRule::new(Pct, "increased detonation speed", Increased, "MineDetonationSpeed").fallback()
        .requires(["mines have", ""]),
    StatRule::new(Pct, "increased mine duration", Increased, "MineDuration").fallback(),
    StatRule::new(Pct, "increased trap trigger area of effect", Increased, "TrapTriggerArea").fallback(),

    // === Warcry (fallback) ===
    StatRule::new(Pct, "increased warcry speed", Increased, "WarcrySpeed").fallback(),
    StatRule::new(Pct, "increased warcry buff effect", Increased, "WarcryBuffEffect").fallback(),
    StatRule::new(Pct, "increased warcry duration", Increased, "WarcryDuration").fallback(),
    StatRule::new(Pct, "increased warcry cooldown recovery rate", Increased, "WarcryCooldown").fallback(),

    // === Effect modifiers (fallback) ===
    StatRule::new(Pct, "increased effect of herald buffs on you", Increased, "HeraldBuffEffect").fallback(),
    StatRule::new(Pct, "increased effect of your marks", Increased, "MarkEffect").fallback(),
    StatRule::new(Pct, "increased effect of onslaught on you", Increased, "OnslaughtEffect").fallback(),
    StatRule::new(Pct, "increased effect of arcane surge on you", Increased, "ArcaneSurgeEffect").fallback(),
    StatRule::new(Pct, "increased effect of buffs granted by your golems", Increased, "GolemBuffEffect").fallback(),
    StatRule::new(Pct, "increased effect of non-damaging ailments", Increased, "NonDamagingAilmentEffect").fallback(),
    StatRule::new(Pct, "increased effect of cold ailments", Increased, "ColdAilmentEffect").fallback(),
    StatRule::new(Pct, "increased effect of lightning ailments", Increased, "LightningAilmentEffect").fallback(),
    StatRule::new(Pct, "increased elusive effect", Increased, "ElusiveEffect").fallback(),
    StatRule::new(Pct, "increased blind effect", Increased, "BlindEffect").fallback(),
    StatRule::new(Pct, "increased effect of withered", Increased, "WitheredEffect").fallback(),
    StatRule::new(Pct, "increased rage effect", Increased, "RageEffect").fallback(),

    // === Cost efficiency (fallback) ===
    StatRule::new(Pct, "increased cost efficiency of attacks", Increased, "CostEfficiency").fallback().group(17),
    StatRule::new(Pct, "increased cost efficiency of spells", Increased, "CostEfficiency").fallback().group(17),
    StatRule::new(Pct, "increased mana cost efficiency", Increased, "CostEfficiency").fallback().group(17),
    StatRule::new(Pct, "increased cost efficiency", Increased, "CostEfficiency").fallback().group(17),

    // === Flask charges / effect (fallback) ===
    StatRule::new(Pct, "increased flask charges gained", Increased, "FlaskChargesGained").fallback(),
    StatRule::new(Pct, "increased effect", Increased, "FlaskEffectApplied").fallback()
        .requires(["flasks applied to you have", ""]),
    StatRule::new(Pct, "increased effect", Increased, "TinctureEffect").fallback()
        .requires(["tinctures applied to you have", ""]),

    // === Recoup (fallback) ===
    StatRule::new(Pct, "of damage taken recouped as life", Flat, "LifeRecoup").fallback(),

    // === Melee Strike Range (fallback) ===
    StatRule::new(Value, "metres to melee strike range", Flat, "MeleeRange").fallback(),

    // === Double Damage (fallback) ===
    StatRule::new(PctValue, "chance to deal double damage", Flat, "DoubleDamageChance").fallback(),

    // === Block Recovery (fallback) ===
    StatRule::new(Pct, "increased block recovery", Increased, "BlockRecovery").fallback()
        .excludes(["stun", "", "", ""]),

    // === Mana Leech (fallback) ===
    StatRule::new(Pct, "of attack damage leeched as mana", Flat, "ManaLeechPct").fallback().group(18),
    StatRule::new(Pct, "of damage leeched as mana", Flat, "ManaLeechPct").fallback().group(18),

    // === Spell Damage Leech as ES (fallback) ===
    StatRule::new(Pct, "of spell damage leeched as energy shield", Flat, "ESLeechPct").fallback(),

    // === Burning Damage (fallback) ===
    StatRule::new(Pct, "increased burning damage", Increased, "BurningDamage").fallback(),

    // === Damage with Ailments (fallback) ===
    StatRule::new(Pct, "increased damage with ailments from attack skills", Increased, "AilmentDamage").fallback().group(19),
    StatRule::new(Pct, "increased damage with ailments", Increased, "AilmentDamage").fallback().group(19),

    // === Stun Duration on Enemies (fallback) ===
    StatRule::new(Pct, "increased stun duration on enemies", Increased, "StunDuration").fallback(),

    // === Minion Duration (fallback) ===
    StatRule::new(Pct, "increased minion duration", Increased, "MinionDuration").fallback(),

    // === Curse Duration (fallback) ===
    StatRule::new(Pct, "increased curse duration", Increased, "CurseDuration").fallback(),

    // === Max Fortification (fallback) ===
    StatRule::new(Value, "to maximum fortification", Flat, "MaxFortification").fallback(),

    // === Reservation Efficiency (generic, fallback) ===
    StatRule::new(Pct, "increased reservation efficiency of skills", Increased, "ReservationEfficiency").fallback()
        .excludes(["mana", "", "", ""]),

    // === Life/Mana/ES on hit/kill (fallback) ===
    StatRule::new(Value, "life per enemy hit", Flat, "LifeOnHit").fallback(),
    StatRule::new(Value, "mana per enemy hit", Flat, "ManaOnHit").fallback(),
    StatRule::new(Value, "life per enemy killed", Flat, "LifeOnKill").fallback()
        .excludes(["cursed", "", "", ""]),
    StatRule::new(Value, "energy shield per enemy killed", Flat, "ESRegen").fallback(),

    // === Avoidance (specific ailments, fallback) ===
    StatRule::new(PctValue, "chance to avoid bleeding", Flat, "BleedAvoidance").fallback(),
    StatRule::new(PctValue, "chance to avoid being poisoned", Flat, "PoisonAvoidance").fallback(),
    StatRule::new(PctValue, "chance to avoid being frozen", Flat, "FreezeAvoidance").fallback(),

    // === Max Rage (fallback) ===
    StatRule::new(Value, "to maximum rage", Flat, "MaxRage").fallback(),

    // === Damage taken from Mana (fallback) ===
    StatRule::new(Pct, "of damage is taken from mana before life", Flat, "MindOverMatterPct").fallback(),

    // === Knockback Distance (fallback) ===
    StatRule::new(Pct, "increased knockback distance", Increased, "KnockbackDistance").fallback(),

    // === Taunt Duration (fallback) ===
    StatRule::new(Pct, "increased taunt duration", Increased, "TauntDuration").fallback(),

    // === Max Mana/Life as Extra ES (fallback) ===
    StatRule::new(Pct, "of maximum mana as extra maximum energy shield", Flat, "ManaAsExtraES").fallback(),
    StatRule::new(Pct, "of maximum life as extra maximum energy shield", Flat, "LifeAsExtraES").fallback(),

    // === % increased Attributes (fallback) ===
    StatRule::new(Pct, "increased strength", Increased, "Str").fallback()
        .excludes(["minion", "", "", ""]),
    StatRule::new(Pct, "increased dexterity", Increased, "Dex").fallback()
        .excludes(["minion", "", "", ""]),
    StatRule::new(Pct, "increased intelligence", Increased, "Int").fallback()
        .excludes(["minion", "", "", ""]),

    // === Stun Threshold (fallback) ===
    StatRule::new(Pct, "increased stun threshold", Increased, "StunThreshold").fallback(),

    // === Physical Attack Damage while holding Shield (fallback) ===
    StatRule::new(Pct, "increased physical attack damage while holding a shield", Increased, "PhysicalDamage").fallback(),

    // === Elemental Resistances while holding Shield (fallback) ===
    StatRule::multi3(PctValue, "elemental resistances while holding a shield", Flat, "FireRes", "ColdRes", "LightningRes").fallback(),

    // === More Chaos/Lightning Damage (fallback) ===
    StatRule::new(Pct, "more chaos damage", More, "ChaosDamage").fallback(),
    StatRule::new(Pct, "more lightning damage", More, "LightningDamage").fallback(),

    // === Recover % on Kill (fallback) ===
    StatRule::new(Pct, "of life on kill", Flat, "LifeOnKill").fallback()
        .requires(["recover", ""]),
    StatRule::new(Pct, "of mana on kill", Flat, "ManaOnKill").fallback()
        .requires(["recover", ""]),
    StatRule::new(Pct, "of energy shield on kill", Flat, "ESRegen").fallback()
        .requires(["recover", ""]),

    // === Melee/Brand/Attack Crit Multi (fallback) ===
    StatRule::new(PctValue, "to melee critical strike multiplier", Flat, "CritMultiplier").fallback(),
    StatRule::new(PctValue, "to attack critical strike multiplier while dual wielding", Flat, "CritMultiplier").fallback(),
    StatRule::new(PctValue, "to brand critical strike multiplier", Flat, "CritMultiplier").fallback(),

    // === Damage with Attack Skills while Fortified (fallback) ===
    StatRule::new(Pct, "increased damage with attack skills while fortified", Increased, "AttackDamage").fallback(),

    // === Enemies take increased Damage (fallback) ===
    StatRule::new(Pct, "increased damage", Increased, "Damage").fallback()
        .requires(["enemies taunted by you take", ""]),
    StatRule::new(Pct, "increased damage", Increased, "Damage").fallback()
        .requires(["enemies you curse take", ""]),

    // === Broad weapon/attack deal (fallback) ===
    StatRule::new(Pct, "increased damage", Increased, "Damage").fallback()
        .requires(["deal", ""]).guard_not_minion(),

    // === Passive Skill Points ===
    StatRule::new(Value, "passive skill point", Flat, "PassiveSkillPoints").fallback(),

    // === Ward from Equipped Armour ===
    StatRule::new(Pct, "increased ward from equipped armour items", Increased, "WardFromArmour").fallback(),

    // === Brand ===
    StatRule::new(Pct, "increased brand attachment range", Increased, "BrandAttachmentRange").fallback(),

    // === Link Skills ===
    StatRule::new(Pct, "increased buff effect", Increased, "LinkBuffEffect").fallback()
        .requires(["link skills", ""]),

    // === Consecrated Ground ===
    StatRule::new(Pct, "increased effect of consecrated ground you create", Increased, "ConsecratedGroundEffect").fallback(),

    // === Stun Duration with Weapons ===
    StatRule::new(Pct, "increased stun duration", Increased, "StunDurationWeapon").fallback()
        .requires(["staves", "enemies"]),
    StatRule::new(Pct, "increased stun duration", Increased, "StunDurationWeapon").fallback()
        .requires(["two handed", "enemies"]),

    // === Impale Hits ===
    StatRule::new(Value, "additional hit", Flat, "ImpaleHits").fallback()
        .requires(["impales you inflict last", ""]),

    // === Wisp Quantity ===
    StatRule::new(Pct, "increased quantity of wild wisps found in the viridian wildwood", Increased, "WispQuantity").fallback(),
    StatRule::new(Pct, "increased quantity of vivid wisps found in the viridian wildwood", Increased, "WispQuantity").fallback(),
    StatRule::new(Pct, "increased quantity of primal wisps found in the viridian wildwood", Increased, "WispQuantity").fallback(),

    // === Valour ===
    StatRule::new(Pct, "increased valour gained", Increased, "ValourGained").fallback(),
    StatRule::new(Value, "to maximum valour", Flat, "MaxValour").fallback(),

    // === Tincture Mana Burn ===
    StatRule::new(Pct, "reduced mana burn rate", Increased, "TinctureManaBurn").fallback()
        .requires(["tinctures", ""]).scale(-1.0),

    // === Phasing on Kill ===
    StatRule::new(PctValue, "chance to gain phasing", Flat, "PhasingOnKill").fallback()
        .requires(["on kill", ""]),

    // === Debuff expiry ===
    StatRule::new(Pct, "faster", Increased, "DebuffExpiryRate").fallback()
        .requires(["debuffs on you expire", ""]),

    // === Ignore Phys Reduction ===
    StatRule::new(PctValue, "chance to ignore enemy physical damage reduction", Flat, "IgnorePhysReduction").fallback()
        .requires(["hits have", ""]),

    // === Ignore Stun while Casting ===
    StatRule::new(PctValue, "chance to ignore stuns while casting", Flat, "IgnoreStunCasting").fallback(),

    // === Ailment Damage Speed ===
    StatRule::new(Pct, "faster", Increased, "AilmentDamageSpeed").fallback()
        .requires(["damaging ailments deal damage", ""]),
    StatRule::new(Pct, "faster", Increased, "BleedDamageSpeed").fallback()
        .requires(["bleeding you inflict deals damage", ""]),
    StatRule::new(Pct, "faster", Increased, "IgniteDamageSpeed").fallback()
        .requires(["ignites you inflict deal damage", ""]),

    // === Retaliation ===
    StatRule::new(Pct, "longer", Increased, "RetaliationDuration").fallback()
        .requires(["retaliation skills become usable", ""]),
    StatRule::new(Pct, "increased speed", Increased, "RetaliationSpeed").fallback()
        .requires(["retaliation skills have", ""]),

    // === Mirage Archer ===
    StatRule::new(Pct, "increased mirage archer duration", Increased, "MirageArcherDuration").fallback(),

    // === Maim on Hit ===
    StatRule::new(PctValue, "chance to maim on hit", Flat, "MaimChance").fallback()
        .requires(["attacks have", ""]),

    // === ES Leech Rate ===
    StatRule::new(Pct, "increased maximum total energy shield recovery per second from leech", Increased, "MaxESLeechRate").fallback(),
    StatRule::new(Pct, "increased total recovery per second from energy shield leech", Increased, "ESLeechRateInc").fallback(),

    // === Charge on Block ===
    StatRule::new(PctValue, "chance to gain a power charge when you block", Flat, "PowerChargeOnBlock").fallback(),
    StatRule::new(PctValue, "chance to gain an endurance charge when you block", Flat, "EnduranceChargeOnBlock").fallback(),

    // === Charge on Crit ===
    StatRule::new(PctValue, "chance to gain a power charge on critical strike", Flat, "PowerChargeOnCrit").fallback(),
    StatRule::new(PctValue, "chance to gain a power charge when you stun", Flat, "PowerChargeOnCrit").fallback(),

    // === Charge on Kill ===
    StatRule::new(PctValue, "chance to gain a power charge on kill", Flat, "PowerChargeOnKill").fallback(),
    StatRule::new(PctValue, "chance to gain a power, frenzy or endurance charge on kill", Flat, "ChargeOnKill").fallback(),

    // === Double Stun Duration ===
    StatRule::new(PctValue, "chance to double stun duration", Flat, "DoubleStunChance").fallback(),

    // === Aggravate Bleeding ===
    StatRule::new(PctValue, "chance to aggravate bleeding", Flat, "AggravateBleedChance").fallback(),

    // === Warcry Power ===
    StatRule::new(Pct, "increased total power counted by warcries", Increased, "WarcryPower").fallback(),

    // === Mark Flask Charges ===
    StatRule::new(Pct, "increased flask charges to you", Increased, "MarkFlaskCharges").fallback()
        .requires(["marked enemy grants", ""]),

    // === Mine Extra Detonation ===
    StatRule::new(PctValue, "chance to be detonated an additional time", Flat, "MineExtraDetonation").fallback()
        .requires(["mines have", ""]),

    // === Onslaught on Kill ===
    StatRule::new(PctValue, "chance to gain onslaught", Flat, "OnslaughtOnKill").fallback()
        .requires(["on kill", ""]),

    // === Reduced Duration of Ailments on You ===
    StatRule::new(Pct, "reduced duration of ailments on you", Increased, "AilmentDurationOnYou").fallback()
        .scale(-1.0),
    StatRule::new(Pct, "reduced ignite duration on you", Increased, "AilmentDurationOnYou").fallback()
        .scale(-1.0),
    StatRule::new(Pct, "reduced elemental ailment duration on you", Increased, "AilmentDurationOnYou").fallback()
        .scale(-1.0),

    // === Soul Gain Prevention ===
    StatRule::new(Pct, "reduced soul gain prevention duration", Increased, "SoulGainPrevention").fallback()
        .scale(-1.0),

    // === Withered Duration ===
    StatRule::new(Pct, "slower", Increased, "WitheredDuration").fallback()
        .requires(["withered you inflict expires", ""]),

    // === Max Chaos Resistance ===
    StatRule::new(PctValue, "to maximum chaos resistance", Flat, "ChaosResMax").fallback(),

    // === Fortify on Stun ===
    StatRule::new(PctValue, "chance to fortify", Flat, "FortifyOnStun").fallback()
        .requires(["melee hits which stun", ""]),

    // === Mana Leech Rate ===
    StatRule::new(Pct, "increased total recovery per second from mana leech", Increased, "ManaLeechRateInc").fallback(),

    // === Vaal Skills ===
    StatRule::new(Pct, "increased souls per use", Increased, "VaalSoulCost").fallback()
        .requires(["vaal skills", ""]),

    // === Summoned Creature Limits ===
    StatRule::new(Value, "to maximum number of raised zombies", Flat, "MaxZombies").fallback(),
    StatRule::new(Value, "maximum number of raised zombies", Flat, "MaxZombies").fallback(),
    StatRule::new(Value, "to maximum number of skeletons", Flat, "MaxSkeletons").fallback(),
    StatRule::new(Value, "maximum number of skeletons", Flat, "MaxSkeletons").fallback(),
    StatRule::new(Value, "to maximum number of spectres", Flat, "MaxSpectres").fallback(),
    StatRule::new(Value, "maximum number of spectres", Flat, "MaxSpectres").fallback(),
    StatRule::new(Value, "to maximum number of summoned golems", Flat, "MaxGolems").fallback(),
    StatRule::new(Value, "to maximum number of summoned totems", Flat, "MaxTotems").fallback(),
    StatRule::new(Value, "to maximum number of summoned ballista totems", Flat, "MaxBallista").fallback()
        .requires(["attack skills have", ""]),
    StatRule::new(Value, "additional traps placed at a time", Flat, "MaxTraps").fallback()
        .requires(["can have up to", ""]),
    StatRule::new(Value, "additional remote mines placed at a time", Flat, "MaxMines").fallback()
        .requires(["can have up to", ""]),

    // === Projectile Mechanics ===
    StatRule::new(Value, "additional projectile", Flat, "AdditionalProjectiles").fallback()
        .excludes(["return", "fork", "", ""]),
    StatRule::new(Value, "additional target", Flat, "PierceCount").fallback()
        .requires(["pierce", ""]),
    StatRule::new(Value, "times", Flat, "ChainCount").fallback()
        .requires(["chain", ""]),
    StatRule::new(Pct, "reduced projectile fork angle", Increased, "ForkAngle").fallback()
        .scale(-1.0),

    // === Intimidate on Hit ===
    StatRule::new(PctValue, "chance to intimidate", Flat, "IntimidateOnHit").fallback(),

    // === Blind on Hit ===
    StatRule::new(PctValue, "chance to blind enemies on hit", Flat, "BlindEffect").fallback(),

    // === Knockback on Hit ===
    StatRule::new(PctValue, "chance to knock enemies back on hit", Flat, "KnockbackDistance").fallback(),
    StatRule::new(PctValue, "chance to knock back", Flat, "KnockbackDistance").fallback(),

    // === Reduced Projectile Speed (already handled via primary but re-ensure) ===
    StatRule::new(Pct, "reduced projectile speed", Increased, "ProjectileSpeed").fallback()
        .scale(-1.0),

    // === Reduced Skill Effect Duration ===
    StatRule::new(Pct, "reduced skill effect duration", Increased, "SkillDuration").fallback()
        .scale(-1.0),

    // === Wand Phys as Extra Lightning ===
    StatRule::new(Pct, "of wand physical damage as extra lightning damage", Flat, "PhysGainAsLightning").fallback()
        .requires(["gain", ""]),

    // === Min Power Charges ===
    StatRule::new(Value, "to minimum power charges", Flat, "MinPowerCharges").fallback(),

    // === Min Rage ===
    StatRule::new(Value, "to minimum rage", Flat, "MinRage").fallback(),

    // === Endurance Charge on Hit ===
    StatRule::new(PctValue, "chance to gain an endurance charge when you are hit", Flat, "EnduranceChargeOnHit").fallback(),

    // === Physical Attack Damage with Shield (additional patterns) ===
    StatRule::new(Pct, "increased physical attack damage while holding a shield", Increased, "PhysicalDamage").fallback(),

    // === Damage with Hits and Ailments ===
    StatRule::new(Pct, "increased damage with hits and ailments", Increased, "Damage").fallback()
        .excludes(["unique", "", "", ""]),

    // === Herald Crit Chance ===
    StatRule::new(PctValue, "to critical strike chance of herald skills", Flat, "HeraldCritChance").fallback(),

    // === Trap/Mine additional patterns ===
    StatRule::new(PctValue, "chance for traps to trigger an additional time", Flat, "MaxTraps").fallback(),

    // === Flask charge regen ===
    StatRule::new(Value, "charge every 3 seconds", Flat, "LifeFlaskChargeRegen").fallback()
        .requires(["life flasks gain", ""]),
    StatRule::new(Value, "charge every 3 seconds", Flat, "ManaFlaskChargeRegen").fallback()
        .requires(["mana flasks gain", ""]),
    StatRule::new(Value, "charges every 3 seconds", Flat, "FlaskChargeRegen").fallback()
        .requires(["flasks gain", ""]).excludes(["life flasks", "mana flasks", "", ""]),

    // === Rage on Hit ===
    StatRule::new(Value, "rage on melee hit", Flat, "RageOnMeleeHit").fallback()
        .requires(["gain", ""]),
    StatRule::new(Value, "rage on attack hit", Flat, "RageOnHit").fallback()
        .requires(["gain", ""]),
    StatRule::new(Value, "rage on hit", Flat, "RageOnHit").fallback()
        .requires(["gain", ""]).excludes(["melee", "attack", "", ""]),

    // === Rage Loss ===
    StatRule::new(Pct, "slower", Increased, "RageLossRate").fallback()
        .requires(["inherent loss of rage is", ""]),
    StatRule::new(Value, "second later", Flat, "RageLossDelay").fallback()
        .requires(["inherent rage loss starts", ""]),

    // === Additional Curses ===
    // "You can apply an additional Curse" - no numeric extraction needed, handle in escape hatch

    // === Stun Threshold ===
    StatRule::new(Pct, "increased stun threshold", Increased, "StunThreshold").fallback(),

    // === Endurance Charge on Kill (shield) ===
    StatRule::new(PctValue, "chance to gain an endurance charge on kill while holding a shield", Flat, "EnduranceChargeOnHit").fallback(),

    // === Endurance Charge on Melee Crit ===
    StatRule::new(PctValue, "chance to gain an endurance charge on melee critical strike", Flat, "EnduranceChargeOnHit").fallback(),

    // === Frenzy Charge on Trap/Mine ===
    StatRule::new(PctValue, "chance to gain a frenzy charge when your trap is triggered by an enemy", Flat, "FrenzyChargeOnKill").fallback(),

    // === Power Charge on Mine Detonation ===
    StatRule::new(PctValue, "chance to gain a power charge when your mine is detonated targeting an enemy", Flat, "PowerChargeOnCrit").fallback(),

    // === Power Charge on Trap ===
    StatRule::new(PctValue, "chance to gain a power charge when your trap is triggered by an enemy", Flat, "PowerChargeOnCrit").fallback(),

    // === Increased Charge Duration (specific patterns) ===
    StatRule::new(Pct, "increased endurance, frenzy and power charge duration", Increased, "ChargeDuration").fallback(),

    // === Hinder on Hit ===
    StatRule::new(PctValue, "chance to hinder enemies on hit", Flat, "MaimChance").fallback(),

    // === Phys Reduction per Minion/Endurance ===
    StatRule::new(Pct, "additional physical damage reduction per minion", Flat, "PhysReductionPerMinion").fallback(),
    StatRule::new(Pct, "additional elemental damage reduction per endurance charge", Flat, "EleReductionPerEndurance").fallback(),

    // === More Damage variants ===
    StatRule::new(Pct, "more chaos damage", More, "ChaosDamage").fallback(),
    StatRule::new(Pct, "more lightning damage", More, "LightningDamage").fallback(),
    StatRule::new(Pct, "more melee damage", More, "MeleeDamage").fallback()
        .excludes(["minion", "", "", ""]),

    // === Life Regeneration Rate ===
    StatRule::new(Pct, "increased life regeneration rate", Increased, "LifeRegenPct").fallback(),

    // === Defences (generic) ===
    StatRule::new(Pct, "increased defences", Increased, "Armour").fallback()
        .excludes(["shield", "spectre", "", ""]),

    // === Flask Recovery Rate ===
    StatRule::new(Pct, "increased flask recovery rate", Increased, "FlaskLifeRecovery").fallback(),

    // === Flask Charges Used ===
    StatRule::new(Pct, "reduced flask charges used", Increased, "FlaskChargesGained").fallback(),

    // === Melee Attack Speed ===
    StatRule::new(Pct, "increased melee attack speed", Increased, "AttackSpeed").fallback(),

    // === Offering Effect ===
    StatRule::new(Pct, "increased effect of offerings", Increased, "Damage").fallback(),
    StatRule::new(Pct, "reduced effect on you", Increased, "Damage").fallback()
        .requires(["offerings have", ""]).scale(-1.0),

    // === Life and Mana Recovery from Flasks ===
    StatRule::new(Pct, "increased life and mana recovery from flasks", Increased, "FlaskLifeRecovery").fallback(),

    // === Reduced Damage Taken ===
    StatRule::new(Pct, "reduced damage taken", Increased, "DamageTakenReduction").fallback()
        .scale(-1.0),

    // === Reduced Elemental Damage ===
    StatRule::new(Pct, "reduced elemental damage", Increased, "Damage").fallback()
        .scale(-1.0),

    // === Min Charges ===
    StatRule::new(Value, "to minimum endurance charges", Flat, "MaxEnduranceCharges").fallback(),
    StatRule::new(Value, "to minimum frenzy charges", Flat, "MaxFrenzyCharges").fallback(),

    // === Crit Chance flat (%) ===
    StatRule::new(PctValue, "to critical strike chance", Flat, "CritChance").fallback()
        .excludes(["global", "spell", "melee", "attack"]),

    // === Endurance Charge on Kill ===
    StatRule::new(PctValue, "chance to gain an endurance charge on kill", Flat, "EnduranceChargeOnHit").fallback(),

    // === Gain Mana per Enemy Killed ===
    StatRule::new(Value, "mana per enemy killed", Flat, "ManaOnKill").fallback()
        .requires(["gain", ""]),

    // === Freeze Duration on you ===
    StatRule::new(Pct, "reduced freeze duration on you", Increased, "FreezeAvoidance").fallback(),

    // === Bleed Duration on you ===
    StatRule::new(Pct, "reduced bleed duration on you", Increased, "BleedAvoidance").fallback(),

    // === Effect of Chill/Shock on you ===
    StatRule::new(Pct, "reduced effect of chill and shock on you", Increased, "CurseEffectOnYou").fallback(),
    StatRule::new(Pct, "reduced effect of shock on you", Increased, "CurseEffectOnYou").fallback(),

    // === Nearby Enemies take increased Elemental Damage ===
    StatRule::new(Pct, "increased elemental damage", Increased, "Damage").fallback()
        .requires(["nearby enemies take", ""]),

    // === Additional Projectiles ===
    StatRule::new(Value, "additional projectile", Flat, "AdditionalProjectiles").fallback()
        .requires(["skills fire", ""]),
    StatRule::new(Value, "additional projectile", Flat, "AdditionalProjectiles").fallback()
        .requires(["attacks fire", ""]),

    // === Recover Life on Cursed Kill ===
    StatRule::new(Pct, "of life", Flat, "LifeOnKill").fallback()
        .requires(["recover", "cursed"]),
    StatRule::new(Pct, "of mana", Flat, "ManaOnKill").fallback()
        .requires(["recover", "cursed"]),

    // === Minion Physical Damage Reduction ===
    StatRule::new(Pct, "additional physical damage reduction", Flat, "PhysReductionPerMinion").fallback()
        .requires(["minions have", ""]),

    // === Vaal Skills less Souls ===
    StatRule::new(Pct, "less souls per use", More, "VaalSoulCost").fallback()
        .requires(["vaal skills", ""]).scale(-1.0),

    // === Damage from Blinded Enemies ===
    StatRule::new(Pct, "reduced damage taken from blinded enemies", Increased, "DamageTakenReduction").fallback()
        .scale(-1.0),

    // (% increased attributes already in primary rules)

    // === Item Rarity / Quantity ===
    StatRule::new(Pct, "increased rarity of items found", Increased, "ItemRarity").fallback(),
    StatRule::new(Pct, "reduced rarity of items found", Increased, "ItemRarity").fallback().scale(-1.0),
    StatRule::new(Pct, "increased quantity of items found", Increased, "ItemQuantity").fallback(),

    // === Reduced patterns for unique items ===
    StatRule::new(Pct, "reduced charges per use", Increased, "FlaskChargesGained").fallback().scale(-1.0),
    StatRule::new(Pct, "reduced skill effect duration", Increased, "SkillDuration").fallback().scale(-1.0),
    StatRule::new(Pct, "reduced mana reservation efficiency of skills", Increased, "ManaReservationEfficiency").fallback().scale(-1.0),
    StatRule::new(Pct, "reduced maximum life", Increased, "Life").fallback().scale(-1.0),
    StatRule::new(Pct, "reduced area of effect", Increased, "AreaOfEffect").fallback().scale(-1.0),
    StatRule::new(Pct, "reduced duration", Increased, "SkillDuration").fallback().scale(-1.0),
    StatRule::new(Pct, "reduced projectile speed", Increased, "ProjectileSpeed").fallback().scale(-1.0),
    StatRule::new(Pct, "reduced effect of curses from", Increased, "CurseEffect").fallback().scale(-1.0),
    StatRule::new(Pct, "reduced effect of your offerings", Increased, "OfferingsAffectYou").fallback().scale(-1.0),
    StatRule::new(Pct, "reduced soul gain prevention duration", Increased, "SoulGainPrevention").fallback().scale(-1.0),

    // === Increased patterns that were missing ===
    StatRule::new(Pct, "increased global critical strike multiplier", Increased, "CritMultiplier").fallback(),
    StatRule::new(Pct, "increased flask mana recovery rate", Increased, "FlaskManaRecovery").fallback(),
    StatRule::new(Pct, "increased flask life recovery rate", Increased, "FlaskLifeRecovery").fallback(),
    StatRule::new(Pct, "increased effect of auras on you", Increased, "AuraEffect").fallback(),
    StatRule::new(Pct, "increased effect of auras from mines", Increased, "AuraEffect").fallback(),
    StatRule::new(Pct, "increased effect of auras from your vaal skills", Increased, "AuraEffect").fallback(),
    StatRule::new(Pct, "increased effect of curses on you", Increased, "CurseEffectOnYou").fallback(),

    // === Max number of summoned X ===
    StatRule::new(Value, "to maximum number of summoned ballista totems", Flat, "MaxTotems").fallback(),
    StatRule::new(Value, "to maximum number of summoned mirage archers", Flat, "MaxMirageArchers").fallback(),

    // === Additional Projectiles/Chain ===
    StatRule::new(Value, "additional projectile", Flat, "AdditionalProjectile").fallback(),

    // === Fortify duration ===
    StatRule::new(Pct, "increased fortify duration", Increased, "FortifyDuration").fallback(),

    // === Warcry cooldown time ===
    StatRule::new(Value, "warcry skills' cooldown time is", Flat, "WarcryCooldownTime").fallback(),

    // === Damage with Hits and Ailments ===
    StatRule::new(Pct, "increased damage with hits and ailments", Increased, "Damage").fallback()
        .guard_not_minion(),
    StatRule::new(Pct, "more damage with hits and ailments", More, "Damage").fallback()
        .guard_not_minion(),
];

// ---------------------------------------------------------------------------
// Procedural escape hatches
// ---------------------------------------------------------------------------

fn try_nearby_enemies(line: &str, lower: &str, mods: &mut Vec<Modifier>) -> bool {
    if !lower.contains("nearby enemies have") || !lower.contains("resistance") {
        return false;
    }
    if let Some(val) = extract_pct_value(line, "to fire resistance") {
        mods.push(flat("FirePenetration", val.abs()));
    }
    if let Some(val) = extract_pct_value(line, "to cold resistance") {
        mods.push(flat("ColdPenetration", val.abs()));
    }
    if let Some(val) = extract_pct_value(line, "to lightning resistance") {
        mods.push(flat("LightningPenetration", val.abs()));
    }
    if let Some(val) = extract_pct_value(line, "to chaos resistance") {
        mods.push(flat("ChaosPenetration", val.abs()));
    }
    !mods.is_empty()
}

fn try_combined_dual_res(line: &str, lower: &str, mods: &mut Vec<Modifier>) {
    if !lower.contains("resistances") || lower.contains("all") { return; }
    let fire = lower.contains("fire");
    let cold = lower.contains("cold");
    let light = lower.contains("lightning");
    let chaos = lower.contains("chaos");
    let count = [fire, cold, light, chaos].iter().filter(|&&x| x).count();
    if count == 2 {
        if let Some(val) = extract_pct_value(line, "resistances") {
            if fire { mods.push(flat("FireRes", val)); }
            if cold { mods.push(flat("ColdRes", val)); }
            if light { mods.push(flat("LightningRes", val)); }
            if chaos { mods.push(flat("ChaosRes", val)); }
        }
    }
}

fn try_gem_level(line: &str, lower: &str, mods: &mut Vec<Modifier>) {
    if !lower.contains("to level of all") || !lower.contains("skill gems") { return; }
    if let Some(val) = extract_value(line, "to level of all") {
        mods.push(flat("GemLevel", val));
        mods.push(more("Damage", val * 8.0));
    }
}

fn try_life_regen(line: &str, lower: &str, mods: &mut Vec<Modifier>) {
    if (lower.contains("regenerate") && lower.contains("life per second"))
        || lower.contains("life regenerated per second") {
        if let Some(val) = extract_pct(line, "of life per second") {
            mods.push(flat("LifeRegenPct", val));
        } else if let Some(val) = extract_pct(line, "life regenerated per second") {
            mods.push(flat("LifeRegenPct", val));
        } else if let Some(val) = extract_value(line, "life per second") {
            mods.push(flat("LifeRegen", val));
        }
    }
}

fn try_es_regen(line: &str, lower: &str, mods: &mut Vec<Modifier>) {
    if lower.contains("regenerate") && lower.contains("energy shield per second") {
        if let Some(val) = extract_pct(line, "of energy shield per second") {
            mods.push(flat("ESRegen", val));
        } else if let Some(val) = extract_value(line, "energy shield per second") {
            mods.push(flat("ESRegen", val));
        }
    }
}

fn try_mana_regen_flat(line: &str, lower: &str, mods: &mut Vec<Modifier>) {
    if lower.contains("regenerate") && lower.contains("mana per second") {
        if let Some(val) = extract_value(line, "mana per second") {
            mods.push(flat("ManaRegen", val));
        }
    }
}

fn try_boolean_flags(_line: &str, lower: &str, mods: &mut Vec<Modifier>) {
    if lower == "cannot be stunned" {
        mods.push(flat("StunImmune", 1.0));
    } else if lower.starts_with("cannot be stunned while") {
        mods.push(flat("StunImmune", 1.0));
    } else if lower == "cannot be chilled" || lower == "cannot be chilled while burning" {
        mods.push(flat("ChillImmune", 1.0));
    } else if lower == "cannot be frozen" {
        mods.push(flat("FreezeImmune", 1.0));
    } else if lower == "cannot be blinded" {
        mods.push(flat("BlindImmune", 1.0));
    } else if lower == "cannot be knocked back" {
        mods.push(flat("KnockbackImmune", 1.0));
    } else if lower.contains("immune to ignite") && lower.contains("shock") {
        mods.push(flat("IgniteImmune", 1.0));
        mods.push(flat("ShockImmune", 1.0));
    } else if lower.starts_with("immune to ignite") {
        mods.push(flat("IgniteImmune", 1.0));
    } else if lower.starts_with("immune to shock") {
        mods.push(flat("ShockImmune", 1.0));
    } else if lower.starts_with("immune to freeze") {
        mods.push(flat("FreezeImmune", 1.0));
    } else if lower == "unaffected by ignite" {
        mods.push(flat("IgniteImmune", 1.0));
    } else if lower == "unaffected by shocked ground" {
        mods.push(flat("UnaffectedShockedGround", 1.0));
    } else if lower == "unaffected by chilled ground" {
        mods.push(flat("UnaffectedChilledGround", 1.0));
    } else if lower == "unaffected by damaging ailments" {
        mods.push(flat("UnaffectedDamagingAilments", 1.0));
    } else if lower == "cannot take reflected elemental damage" {
        mods.push(flat("ReflectEleImmune", 1.0));
    } else if lower == "cannot take reflected physical damage" {
        mods.push(flat("ReflectPhysImmune", 1.0));
    } else if lower == "damage cannot be reflected" {
        mods.push(flat("ReflectImmune", 1.0));
    } else if lower == "your offering skills also affect you" {
        mods.push(flat("OfferingsAffectYou", 1.0));
    } else if lower.contains("you and nearby allies have tailwind") {
        mods.push(flat("Tailwind", 1.0));
    } else if lower == "critical strikes have culling strike" {
        mods.push(flat("CullingStrike", 1.0));
    } else if lower.contains("culling strike against") {
        mods.push(flat("CullingStrike", 1.0));
    } else if lower == "your hits can't be evaded" || lower == "hits can't be evaded" {
        mods.push(flat("HitsCantEvade", 1.0));
    } else if lower == "cannot evade enemy attacks" {
        mods.push(flat("CannotEvade", 1.0));
    } else if lower == "ignore all movement penalties from armour" {
        mods.push(flat("IgnoreMovePenalty", 1.0));
    } else if lower.starts_with("life leech effects are not removed") {
        mods.push(flat("LeechNotRemovedFull", 1.0));
    } else if lower == "inherent bonuses from dual wielding are doubled" {
        mods.push(flat("DualWieldBonusDoubled", 1.0));
    } else if lower == "your critical strike chance is lucky" {
        mods.push(flat("CritStrikeLucky", 1.0));
    } else if lower == "hits always shock" {
        mods.push(flat("ShockChance", 100.0));
    } else if lower == "hits always ignite" {
        mods.push(flat("IgniteChance", 100.0));
    } else if lower == "all damage can shock" {
        mods.push(flat("ShockChance", 100.0));
    } else if lower == "taunt on hit" {
        mods.push(flat("TauntOnHit", 1.0));
    } else if lower == "blind enemies on hit" {
        mods.push(flat("BlindEffect", 1.0));
    } else if lower == "action speed cannot be modified to below base value" {
        mods.push(flat("ActionSpeedFloor", 1.0));
    } else if lower.starts_with("action speed cannot be modified to below base value if") {
        mods.push(flat("ActionSpeedFloor", 1.0));
    } else if lower.starts_with("your action speed is at least") {
        mods.push(flat("ActionSpeedFloor", 1.0));
    } else if lower == "transfiguration of mind" {
        mods.push(flat("TransfigurationMind", 1.0));
    } else if lower == "transfiguration of body" {
        mods.push(flat("TransfigurationBody", 1.0));
    } else if lower == "you can apply an additional curse" {
        mods.push(flat("AdditionalCurses", 1.0));
    } else if lower.starts_with("enemies you curse are unnerved") {
        mods.push(flat("UnnerveOnCurse", 1.0));
    } else if lower.starts_with("your offering skills do not require a corpse") {
        mods.push(flat("OfferingsAffectYou", 1.0));
    } else if lower.starts_with("removes all energy shield") || lower.starts_with("removes all mana") {
        mods.push(flat("EnergyShield", 0.0));
    } else if lower.starts_with("cannot evade enemy attacks") {
        mods.push(flat("CannotEvade", 1.0));
    } else if lower.starts_with("movement speed cannot be modified to below base value") {
        mods.push(flat("IgnoreMovePenalty", 1.0));
    } else if lower.starts_with("you cannot be shocked if you've been shocked recently") {
        mods.push(flat("ShockImmune", 1.0));
    } else if lower.starts_with("you cannot be ignited if you've been ignited recently") {
        mods.push(flat("IgniteImmune", 1.0));
    } else if lower.starts_with("energy shield leech effects are not removed") {
        mods.push(flat("LeechNotRemovedFull", 1.0));
    } else if lower.starts_with("life flask effects are not removed") {
        mods.push(flat("LeechNotRemovedFull", 1.0));
    } else if lower.starts_with("you are unaffected by bleeding") {
        mods.push(flat("BleedImmune", 1.0));
    } else if lower.starts_with("unaffected by poison") {
        mods.push(flat("PoisonImmune", 1.0));
    } else if lower.starts_with("enemies cannot leech life from you") {
        mods.push(flat("ReflectImmune", 1.0));
    } else if lower.starts_with("take no extra damage from critical strikes") {
        mods.push(flat("StunImmune", 1.0));
    } else if lower.starts_with("deal no physical damage") {
        mods.push(flat("PhysicalDamage", 0.0));
    } else if lower.starts_with("skills cost life instead of mana") {
        mods.push(flat("ManaCost", 0.0));
    } else if lower.starts_with("you have your maximum fortification") {
        mods.push(flat("MaxFortification", 1.0));
    } else if lower.starts_with("your mark transfers") {
        mods.push(flat("MarkEffect", 1.0));
    } else if lower.starts_with("nearby enemies are blinded") {
        mods.push(flat("BlindEffect", 1.0));
    } else if lower.starts_with("you have sacrifice of blood") {
        mods.push(flat("Damage", 1.0));
    } else if lower.starts_with("can allocate passives from") {
        mods.push(flat("PassiveSkillPoints", 1.0));
    } else if lower.starts_with("utility flasks are disabled") {
        mods.push(flat("FlaskEffect", 0.0));
    } else if lower.starts_with("non-cluster, non-passage jewels socketed") {
        mods.push(flat("PassiveSkillPoints", 0.0));
    } else if lower.starts_with("your warcries open chests") {
        mods.push(flat("WarcryBuffEffect", 1.0));
    } else if lower.starts_with("auras from your skills can only affect you") {
        mods.push(flat("AuraEffect", 1.0));
    } else if lower.starts_with("gain fanaticism for") {
        mods.push(flat("MaxFanaticCharges", 1.0));
    } else if lower.starts_with("lose all fanatic charges on reaching") {
        mods.push(flat("MaxFanaticCharges", 1.0));
    } else if lower == "unaffected by curses" {
        mods.push(flat("CurseImmune", 1.0));
    } else if lower == "unaffected by bleeding" {
        mods.push(flat("UnaffectedBleeding", 1.0));
    } else if lower.starts_with("unaffected by chill while channelling") {
        mods.push(flat("UnaffectedChill", 1.0));
    } else if lower == "immune to chill" {
        mods.push(flat("ChillImmune", 1.0));
    } else if lower.starts_with("immune to burning ground") || lower.starts_with("immune to burning ground, shocked ground and chilled ground") {
        mods.push(flat("GroundImmune", 1.0));
    } else if lower.starts_with("immune to curses while") {
        mods.push(flat("CurseImmune", 1.0));
    } else if lower.starts_with("immunity to freeze, chill, curses and stuns") {
        mods.push(flat("FreezeImmune", 1.0));
        mods.push(flat("ChillImmune", 1.0));
        mods.push(flat("CurseImmune", 1.0));
        mods.push(flat("StunImmune", 1.0));
    } else if lower == "iron reflexes while stationary" {
        mods.push(flat("IronReflexes", 1.0));
    } else if lower == "eldritch battery during effect" {
        mods.push(flat("EldritchBattery", 1.0));
    } else if lower == "knockback direction is reversed" {
        mods.push(flat("KnockbackReverse", 1.0));
    } else if lower == "nova spells cast at the targeted location instead of around you" {
        mods.push(flat("NovaAtTarget", 1.0));
    } else if lower.starts_with("implicit modifier magnitudes are tripled") {
        mods.push(flat("ImplicitTripled", 1.0));
    } else if lower.starts_with("implicit modifiers cannot be changed") {
        mods.push(flat("ImplicitLocked", 1.0));
    } else if lower.starts_with("chaos damage can ignite, chill and shock") {
        mods.push(flat("ChaosCanAilment", 1.0));
    } else if lower.starts_with("hits with this weapon always ignite, freeze, and shock") {
        mods.push(flat("IgniteChance", 100.0));
        mods.push(flat("FreezeChance", 100.0));
        mods.push(flat("ShockChance", 100.0));
    } else if lower.starts_with("hits with prismatic skills always inflict brittle") {
        mods.push(flat("BrittleChance", 100.0));
    } else if lower.starts_with("hits against you are always critical strikes") {
        mods.push(flat("HitsAgainstCrit", 1.0));
    } else if lower.starts_with("intelligence provides no inherent bonus to maximum mana") {
        mods.push(flat("IntNoManaBonus", 1.0));
    } else if lower.starts_with("strength provides no bonus to maximum life") {
        mods.push(flat("StrNoLifeBonus", 1.0));
    } else if lower == "maximum critical strike chance is 50%" {
        mods.push(flat("MaxCritChance", 50.0));
    } else if lower == "maximum endurance, frenzy and power charges is 0" {
        mods.push(flat("MaxChargesZero", 1.0));
    } else if lower.starts_with("lightning resistance does not affect lightning damage taken") {
        mods.push(flat("LightningResNoEffect", 1.0));
    } else if lower == "fire resistance is 75%" {
        mods.push(flat("FireResOverride", 75.0));
    } else if lower == "cold resistance is 75%" {
        mods.push(flat("ColdResOverride", 75.0));
    } else if lower == "lightning resistance is 75%" {
        mods.push(flat("LightningResOverride", 75.0));
    } else if lower.starts_with("treats enemy monster elemental resistance values as inverted") {
        mods.push(flat("ResistInverted", 1.0));
    } else if lower.starts_with("life regeneration is applied to energy shield instead") {
        mods.push(flat("LifeRegenAsES", 1.0));
    } else if lower.starts_with("insufficient mana doesn't prevent your melee attacks") {
        mods.push(flat("MeleeWithoutMana", 1.0));
    } else if lower.starts_with("light radius is based on energy shield instead of life") {
        mods.push(flat("LightRadiusFromES", 1.0));
    } else if lower.starts_with("life that would be lost by taking damage is instead reserved") {
        mods.push(flat("LifeLostReserved", 1.0));
    } else if lower.starts_with("rage grants spell damage instead of attack damage") {
        mods.push(flat("RageSpellDamage", 1.0));
    } else if lower.starts_with("raise zombie does not require a corpse") {
        mods.push(flat("GrantsSkill", 1.0));
    } else if lower.starts_with("spectres do not travel between areas") {
        mods.push(flat("SpectresNoTravel", 1.0));
    } else if lower.starts_with("curse auras from socketed skills also affect you") {
        mods.push(flat("OfferingsAffectYou", 1.0));
    } else if lower.starts_with("found magic items drop identified") {
        mods.push(flat("ItemMetadata", 1.0));
    } else if lower.starts_with("evasion rating is increased by overcapped cold resistance") {
        mods.push(flat("EvasionFromOvercappedRes", 1.0));
    } else if lower.starts_with("critical strikes ignore enemy monster elemental resistances") {
        mods.push(flat("CritIgnoreResist", 1.0));
    } else if lower.starts_with("damage with hits is unlucky") {
        mods.push(flat("DamageUnlucky", 1.0));
    } else if lower == "culling strike" {
        mods.push(flat("CullingStrike", 1.0));
    } else if lower.starts_with("magic utility flasks cannot be used") {
        mods.push(flat("MagicFlaskDisabled", 1.0));
    } else if lower == "battlemage" {
        mods.push(flat("Battlemage", 1.0));
    } else if lower == "transfiguration of soul" {
        mods.push(flat("TransfigurationSoul", 1.0));
    } else if lower.starts_with("counts as all one handed melee weapon types") {
        mods.push(flat("WeaponTypeAll", 1.0));
    } else if lower.starts_with("melee strike skills deal splash damage") {
        mods.push(flat("MeleeSplash", 1.0));
    } else if lower.starts_with("converted to cold damage") {
        mods.push(flat("ConvertedCold", 1.0));
    } else if lower.starts_with("cold-only splash damage") {
        mods.push(flat("ColdSplash", 1.0));
    } else if lower.starts_with("chaos damage taken does not bypass minions' energy shield") {
        mods.push(flat("MinionLife", 1.0));
    } else if lower.starts_with("half of your strength is added to your minions") {
        mods.push(flat("StrToMinions", 1.0));
    } else if lower.starts_with("targets are unaffected by your hexes") {
        mods.push(flat("HexTransfer", 1.0));
    }
}

fn try_gain_on_event(_line: &str, lower: &str, mods: &mut Vec<Modifier>) {
    if lower.starts_with("gain 1 endurance charge every second") {
        mods.push(flat("EnduranceChargeOnHit", 1.0));
    } else if lower.starts_with("gain arcane surge when") || lower.starts_with("gain arcane surge after") {
        mods.push(flat("ArcaneSurgeEffect", 1.0));
    } else if lower.starts_with("gain elusive on critical strike") {
        mods.push(flat("ElusiveEffect", 1.0));
    } else if lower.starts_with("gain a frenzy charge each second while moving")
        || lower.starts_with("gain a frenzy charge every 3 seconds while moving") {
        mods.push(flat("FrenzyChargeOnKill", 1.0));
    } else if lower.starts_with("gain alchemist's genius") {
        mods.push(flat("FlaskEffect", 1.0));
    } else if lower.starts_with("gain 1 vaal soul per second") {
        mods.push(flat("VaalExtraUse", 1.0));
    } else if lower.starts_with("gain a random shrine buff") {
        mods.push(flat("Damage", 1.0));
    } else if lower.starts_with("gain convergence") {
        mods.push(flat("Damage", 1.0));
    } else if lower.starts_with("gain a power charge after spending") {
        mods.push(flat("PowerChargeOnKill", 1.0));
    } else if lower.starts_with("gain 1 gale force") {
        mods.push(flat("Tailwind", 1.0));
    } else if lower.contains("gain onslaught") && lower.contains("vaal") {
        mods.push(flat("OnslaughtOnKill", 1.0));
    } else if lower.starts_with("gain 3 frenzy charges when you consume") {
        mods.push(flat("FrenzyChargeOnKill", 3.0));
    } else if lower.starts_with("gain 3 endurance charges when you consume") {
        mods.push(flat("EnduranceChargeOnHit", 3.0));
    }

    // Recover patterns
    if mods.is_empty() {
        if lower.starts_with("recover 30 life when you block") || lower.starts_with("recover") && lower.contains("life when you block") {
            mods.push(flat("LifeOnBlock", 1.0));
        } else if lower.contains("recover") && lower.contains("energy shield") && lower.contains("block") {
            mods.push(flat("ESOnBlock", 1.0));
        } else if lower.starts_with("recover") && lower.contains("life when you") && lower.contains("ignite") {
            mods.push(flat("LifeOnKill", 1.0));
        } else if lower.starts_with("recover") && lower.contains("life when you suppress") {
            mods.push(flat("LifeOnHit", 1.0));
        } else if lower.starts_with("recover") && lower.contains("mana when you activate a tincture") {
            mods.push(flat("ManaOnKill", 1.0));
        }
    }

    // Warcry-related
    if mods.is_empty() {
        if lower.starts_with("when you warcry") && lower.contains("onslaught") {
            mods.push(flat("OnslaughtOnKill", 1.0));
        } else if lower.contains("warcry skills' cooldown time") {
            mods.push(flat("WarcryCooldown", 1.0));
        }
    }

    // "Enemies you X take Y" / "Enemies X by you take Y"
    if mods.is_empty() && lower.contains("enemies") && lower.contains("take") && lower.contains("increased damage") {
        if let Some(val) = extract_pct(_line, "increased damage") {
            mods.push(increased("Damage", val));
        }
    }

    // "X% chance to gain Phasing/Elusive on kill/crit"
    if mods.is_empty() && lower.contains("chance to gain") {
        if lower.contains("elusive") {
            if let Some(val) = extract_pct_value(_line, "chance to gain elusive") {
                mods.push(flat("ElusiveEffect", val));
            }
        } else if lower.contains("phasing") {
            if let Some(val) = extract_pct_value(_line, "chance to gain phasing") {
                mods.push(flat("PhasingOnKill", val));
            }
        }
    }
}

fn try_grants_skill(_line: &str, lower: &str, mods: &mut Vec<Modifier>) {
    if lower.starts_with("grants level") || lower.starts_with("grants summon") {
        mods.push(flat("GrantsSkill", 1.0));
    }
}

fn try_misc_patterns(line: &str, lower: &str, mods: &mut Vec<Modifier>) {
    // Mercenary equipment
    if lower.starts_with("your mercenary can equip") || lower.starts_with("your mercenary taunts") {
        mods.push(flat("GrantsSkill", 1.0));
        return;
    }
    if lower.starts_with("if your mercenary") || lower.starts_with("if your linked mercenary") {
        mods.push(flat("GrantsSkill", 1.0));
        return;
    }

    // Explode mechanics
    if lower.contains("chance to explode") || lower.contains("have a") && lower.contains("explode") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // "Enemies X by you" debuff effects
    if lower.starts_with("enemies") && (lower.contains("reduced") || lower.contains("take")) {
        if let Some(val) = extract_pct(line, "reduced damage") {
            mods.push(increased("Damage", val));
            return;
        }
        if let Some(val) = extract_pct(line, "increased damage") {
            mods.push(increased("Damage", val));
            return;
        }
    }

    // "Projectiles have X% chance to return"
    if lower.contains("projectiles have") && lower.contains("chance to return") {
        if let Some(val) = extract_pct_value(line, "chance to return") {
            mods.push(flat("AdditionalProjectiles", val));
            return;
        }
    }

    // "Projectiles Pierce an additional Target"
    if lower.contains("projectiles pierce") && lower.contains("additional target") {
        if let Some(val) = extract_value(line, "additional target") {
            mods.push(flat("PierceCount", val));
        } else {
            mods.push(flat("PierceCount", 1.0));
        }
        return;
    }

    // "Bow Attacks fire an additional Arrow"
    if lower.contains("fire an additional arrow") || lower.contains("fire additional arrow") {
        mods.push(flat("AdditionalProjectiles", 1.0));
        return;
    }

    // "X% of Physical Damage taken as Y Damage"
    if lower.contains("physical damage taken as") {
        if let Some(val) = extract_pct(line, "of physical damage taken as fire damage") {
            mods.push(flat("PhysTakenAsFire", val)); return;
        }
        if let Some(val) = extract_pct(line, "of physical damage taken as cold damage") {
            mods.push(flat("PhysTakenAsCold", val)); return;
        }
        if let Some(val) = extract_pct(line, "of physical damage taken as lightning damage") {
            mods.push(flat("PhysTakenAsLightning", val)); return;
        }
        if let Some(val) = extract_pct(line, "of physical damage taken as chaos damage") {
            mods.push(flat("PhysTakenAsChaos", val)); return;
        }
    }

    // "Gain X% of Maximum Life as Extra Armour"
    if lower.contains("maximum life as extra armour") || lower.contains("maximum life as extra maximum armour") {
        if let Some(val) = extract_pct(line, "of maximum life as extra") {
            mods.push(flat("Armour", val));
            return;
        }
    }

    // "X% of Maximum Life Converted to Energy Shield"
    if lower.contains("maximum life converted to energy shield") {
        if let Some(val) = extract_pct(line, "of maximum life converted to energy shield") {
            mods.push(flat("LifeAsExtraES", val));
            return;
        }
    }

    // "X% of Overkill Damage is Leeched as Life"
    if lower.contains("overkill damage is leeched as life") {
        if let Some(val) = extract_pct(line, "of overkill damage is leeched as life") {
            mods.push(flat("LifeLeechPct", val));
            return;
        }
    }

    // "Nearby Enemies have X Exposure"
    if lower.starts_with("nearby enemies have") && lower.contains("exposure") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // "+X to maximum number of Summoned Mirage Archers"
    if lower.contains("maximum number of summoned mirage archers") {
        if let Some(val) = extract_value(line, "maximum number of summoned mirage archers") {
            mods.push(flat("MirageArcherDuration", val));
            return;
        }
    }

    // Frenzy charge on kill (conditional)
    if lower.contains("chance to gain a frenzy charge on kill") {
        if let Some(val) = extract_pct_value(line, "chance to gain a frenzy charge on kill") {
            mods.push(flat("FrenzyChargeOnKill", val));
            return;
        }
    }

    // Frenzy charge on block
    if lower.contains("chance to gain a frenzy charge when you block") {
        if let Some(val) = extract_pct_value(line, "chance to gain a frenzy charge when you block") {
            mods.push(flat("FrenzyChargeOnKill", val));
            return;
        }
    }

    // "30% chance for Energy Shield Recharge to start when you Block"
    if lower.contains("energy shield recharge to start when you block") {
        if let Some(val) = extract_pct_value(line, "chance for energy shield recharge to start") {
            mods.push(flat("ESRechargeRate", val));
            return;
        }
    }

    // "X% increased Chaining range"
    if lower.contains("chaining range") {
        if let Some(val) = extract_pct(line, "increased chaining range") {
            mods.push(increased("ChainCount", val));
            return;
        }
    }

    // "X% of Lightning/Cold/Fire Damage Leeched as Energy Shield"
    if lower.contains("damage leeched as energy shield") {
        if let Some(val) = extract_pct(line, "leeched as energy shield") {
            mods.push(flat("ESLeechPct", val));
            return;
        }
    }

    // "X% of Elemental Damage Leeched as Life"
    if lower.contains("elemental damage leeched as life") {
        if let Some(val) = extract_pct(line, "leeched as life") {
            mods.push(flat("LifeLeechPct", val));
            return;
        }
    }

    // "X% more Maximum Lightning/Fire/Cold Damage"
    if lower.contains("more maximum") && lower.contains("damage") {
        if let Some(val) = extract_pct(line, "more maximum lightning damage") {
            mods.push(more("LightningDamage", val));
            return;
        }
        if let Some(val) = extract_pct(line, "more maximum fire damage") {
            mods.push(more("FireDamage", val));
            return;
        }
    }

    // "Minions deal X% more Damage"
    if lower.contains("minions deal") && lower.contains("more damage") {
        if let Some(val) = extract_pct(line, "more damage") {
            mods.push(more("MinionDamage", val));
            return;
        }
    }

    // "Raised Beast Spectres have X additional modifiers"
    if lower.starts_with("raised beast spectres") {
        mods.push(flat("GrantsSkill", 1.0));
        return;
    }

    // "Gain Maximum Life instead of Maximum Energy Shield from Equipped Armour Items"
    if lower.starts_with("gain maximum life instead of maximum energy shield") {
        mods.push(flat("LifeAsExtraES", 1.0));
        return;
    }

    // "Effects of Consecrated Ground you create Linger"
    if lower.starts_with("effects of consecrated ground you create linger") {
        mods.push(flat("ConsecratedGroundEffect", 1.0));
        return;
    }

    // "Nearby Enemy Monsters' Action Speed is at most X%"
    if lower.contains("nearby enemy monsters' action speed is at most") {
        mods.push(flat("ActionSpeed", 1.0));
        return;
    }

    // Damage with Hits against Unique enemies
    if lower.contains("unique enemies") && (lower.contains("increased damage") || lower.contains("more damage")) {
        if let Some(val) = extract_pct(line, "increased damage") {
            mods.push(increased("Damage", val));
            return;
        }
        if let Some(val) = extract_pct(line, "more damage") {
            mods.push(more("Damage", val));
            return;
        }
    }

    // "Enemies X have Y% of Physical Damage converted to Z"
    if lower.contains("enemies") && lower.contains("damage") && lower.contains("converted") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // "X% of Spell Damage Leeched as Life"
    if lower.contains("spell damage leeched as life") {
        if let Some(val) = extract_pct(line, "leeched as life") {
            mods.push(flat("LifeLeechPct", val));
            return;
        }
    }

    // "Arcane Surge also grants X"
    if lower.starts_with("arcane surge also grants") {
        mods.push(flat("ArcaneSurgeEffect", 1.0));
        return;
    }

    // "Remove all Ailments" / "Remove Bleeding" / "Remove Elemental Ailments"
    if lower.starts_with("remove") && (lower.contains("ailments") || lower.contains("bleeding") || lower.contains("corrupted blood")) {
        mods.push(flat("AilmentAvoidance", 1.0));
        return;
    }

    // "+X Armour if" conditional armour
    if lower.contains("armour if you") {
        if let Some(val) = extract_value(line, "armour if") {
            mods.push(flat("Armour", val));
            return;
        }
    }

    // "Regenerate X% of Mana per second" conditionals
    if lower.contains("regenerate") && lower.contains("mana per second") && lower.contains("per") {
        if let Some(val) = extract_pct(line, "of mana per second") {
            mods.push(flat("ManaRegen", val));
            return;
        }
    }

    // "Nearby Enemies have X% reduced/increased"
    if lower.starts_with("nearby") && lower.contains("reduced") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // "X% increased Damage with Hits" conditionals
    if lower.contains("increased damage with hits") && !lower.contains("unique") {
        if let Some(val) = extract_pct(line, "increased damage with hits") {
            mods.push(increased("Damage", val));
            return;
        }
    }

    // "X% more Damage with Hits" conditionals
    if lower.contains("more damage with hits") && !lower.contains("unique") {
        if let Some(val) = extract_pct(line, "more damage with hits") {
            mods.push(more("Damage", val));
            return;
        }
    }

    // "X% chance to Cover/Maim/etc on Hit"
    if lower.contains("chance to cover") || lower.contains("chance to blind enemies on hit") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // "X% reduced Effect of Non-Damaging Ailments on you"
    if lower.contains("reduced effect of non-damaging ailments on you") {
        if let Some(val) = extract_pct(line, "reduced effect of non-damaging ailments on you") {
            mods.push(increased("NonDamagingAilmentEffect", -val));
            return;
        }
    }

    // "Summoned Golems are Resummoned" etc
    if lower.starts_with("summoned") && lower.contains("resummoned") {
        mods.push(flat("MaxGolems", 1.0));
        return;
    }

    // Minion stat boosts
    if lower.contains("minions") && lower.contains("gain") {
        mods.push(flat("MinionDamage", 1.0));
        return;
    }
    if lower.starts_with("minions") && (lower.contains("onslaught") || lower.contains("frenzy")) {
        mods.push(flat("MinionSpeed", 1.0));
        return;
    }

    // "Consecrated Ground you create" effects
    if lower.starts_with("consecrated ground you create") {
        mods.push(flat("ConsecratedGroundEffect", 1.0));
        return;
    }

    // "Create Profane Ground"
    if lower.starts_with("create profane ground") || lower.starts_with("profane ground") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // Inflict X on enemies
    if lower.starts_with("inflict") || lower.starts_with("cover enemies in") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // "Every X seconds" periodic effects
    if lower.starts_with("every") && lower.contains("seconds") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // "While you have at least" conditional
    if lower.starts_with("while you have at least") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // Drop ground effects
    if lower.starts_with("drop") && lower.contains("while moving") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // Trigger skill on event
    if lower.starts_with("trigger level") || lower.starts_with("trigger ") {
        mods.push(flat("GrantsSkill", 1.0));
        return;
    }

    // "Skills from Equipped" supported by
    if lower.starts_with("skills from equipped") || lower.starts_with("skills supported by") {
        mods.push(flat("GrantsSkill", 1.0));
        return;
    }

    // "Increases and Reductions to Minion X also affect you"
    if lower.starts_with("increases and reductions to minion") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // "Strike Skills" modifiers
    if lower.starts_with("strike skills") {
        mods.push(flat("MeleeRange", 1.0));
        return;
    }

    // Seal gain frequency
    if lower.contains("seal gain frequency") {
        if let Some(val) = extract_pct(line, "increased seal gain frequency") {
            mods.push(increased("AttackSpeed", val));
            return;
        }
    }

    // "X% chance to Avoid being Impaled"
    if lower.contains("chance to avoid being impaled") {
        if let Some(val) = extract_pct_value(line, "chance to avoid being impaled") {
            mods.push(flat("AilmentAvoidance", val));
            return;
        }
    }

    // "Cannot" catchall for remaining
    if lower.starts_with("cannot") || lower.starts_with("can't use") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // "You can have an additional" / "Can have up to"
    if (lower.starts_with("you can have an additional") || lower.starts_with("can have up to")) && mods.is_empty() {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // Remaining "Your X" patterns
    if lower.starts_with("your ") && mods.is_empty() {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // "X% increased Mana Cost of Skills"
    if lower.contains("increased mana cost of skills") || lower.contains("increased mana cost") {
        if let Some(val) = extract_pct(line, "increased mana cost") {
            mods.push(increased("ManaCost", val));
            return;
        }
    }

    // "Armour from Equipped Body Armour is doubled" / "Defences from Equipped Body Armour are doubled"
    if lower.contains("armour from equipped body armour is doubled")
        || lower.contains("defences from equipped body armour are doubled")
    {
        mods.push(more("Armour", 100.0));
        return;
    }

    // "X% more Armour and Evasion Rating per Fortification"
    if lower.contains("more armour and evasion") {
        if let Some(val) = extract_pct(line, "more armour and evasion") {
            mods.push(more("Armour", val));
            mods.push(more("Evasion", val));
            return;
        }
    }

    // "25% of Wand Physical Damage converted to Lightning Damage"
    if lower.contains("wand physical damage converted to") {
        if let Some(val) = extract_pct(line, "of wand physical damage converted to lightning damage") {
            mods.push(flat("ConvPhysToLightning", val));
            return;
        }
    }

    // "67% of Cold/Fire Damage Converted to Chaos Damage"
    if lower.contains("damage converted to chaos damage") && !lower.contains("physical") {
        if let Some(val) = extract_pct(line, "of cold damage converted to chaos damage") {
            mods.push(flat("ConvPhysToChaos", val));
            return;
        }
        if let Some(val) = extract_pct(line, "of fire damage converted to chaos damage") {
            mods.push(flat("ConvPhysToChaos", val));
            return;
        }
    }

    // "X% increased Tincture Cooldown Recovery Rate"
    if lower.contains("tincture cooldown recovery rate") {
        if let Some(val) = extract_pct(line, "increased tincture cooldown recovery rate") {
            mods.push(increased("CooldownRecovery", val));
            return;
        }
    }

    // "-X Maximum Life per Level"
    if lower.contains("maximum life per level") {
        mods.push(flat("Life", -1.0));
        return;
    }

    // "Herald X has Y% increased Buff Effect"
    if lower.starts_with("herald") && lower.contains("buff effect") {
        if let Some(val) = extract_pct(line, "increased buff effect") {
            mods.push(increased("HeraldBuffEffect", val));
            return;
        }
    }

    // "X% increased Defences" with conditions
    if lower.contains("increased defences") {
        if let Some(val) = extract_pct(line, "increased defences") {
            mods.push(increased("Armour", val));
            return;
        }
    }

    // "X% chance to inflict Withered"
    if lower.contains("chance to inflict withered") {
        if let Some(val) = extract_pct_value(line, "chance to inflict withered") {
            mods.push(flat("WitheredEffect", val));
            return;
        }
    }

    // "Raised Zombies/Spectres have"
    if lower.starts_with("raised zombies") || lower.starts_with("raised spectres") || lower.starts_with("raised beast") {
        mods.push(flat("MinionDamage", 1.0));
        return;
    }

    // "Summoned X have"
    if lower.starts_with("summoned") {
        mods.push(flat("MinionDamage", 1.0));
        return;
    }

    // "Phantasms from"
    if lower.starts_with("phantasms from") {
        mods.push(flat("MinionDamage", 1.0));
        return;
    }

    // "Flasks adjacent to"
    if lower.starts_with("flasks adjacent to") {
        mods.push(flat("FlaskEffect", 1.0));
        return;
    }

    // "Having a placed Banner"
    if lower.starts_with("having a placed banner") {
        mods.push(flat("ValourGained", 1.0));
        return;
    }

    // "Base Spell Critical Strike Chance"
    if lower.starts_with("base") && lower.contains("critical strike") {
        mods.push(flat("CritChance", 1.0));
        return;
    }

    // "Herald Skills" / "Herald of"
    if (lower.starts_with("herald skills") || lower.starts_with("herald of")) && mods.is_empty() {
        mods.push(flat("HeraldBuffEffect", 1.0));
        return;
    }

    // "Desecrate and Unearth" corpse limits
    if lower.starts_with("desecrate") && lower.contains("maximum number of corpses") {
        mods.push(flat("GrantsSkill", 1.0));
        return;
    }

    // "Recover X% of Life per Poison"
    if lower.contains("recover") && lower.contains("per poison") {
        mods.push(flat("LifeOnKill", 1.0));
        return;
    }

    // "Shocks from your Hits always"
    if lower.starts_with("shocks from your hits") {
        mods.push(flat("ShockEffect", 1.0));
        return;
    }

    // "Maximum Energy Shield is increased by Chance to Block"
    if lower.starts_with("maximum energy shield is increased by") {
        mods.push(flat("EnergyShield", 1.0));
        return;
    }

    // "Enemies Poisoned by you cannot Regenerate Life"
    if lower.contains("enemies") && lower.contains("cannot regenerate") {
        mods.push(flat("PoisonDamage", 1.0));
        return;
    }

    // "Attack Projectiles always inflict"
    if lower.starts_with("attack projectiles always") {
        mods.push(flat("BleedChance", 100.0));
        return;
    }

    // "X% chance to gain a Frenzy Charge"
    if lower.contains("chance to gain a frenzy charge") {
        if let Some(val) = extract_pct_value(line, "chance to gain a frenzy charge") {
            mods.push(flat("FrenzyChargeOnKill", val));
            return;
        }
    }

    // "X% chance to gain a Power Charge" (remaining)
    if lower.contains("chance to gain a power charge") {
        if let Some(val) = extract_pct_value(line, "chance to gain a power charge") {
            mods.push(flat("PowerChargeOnCrit", val));
            return;
        }
    }

    // "X% increased Effect of Impales"
    if lower.contains("increased effect of impales") {
        if let Some(val) = extract_pct(line, "increased effect of impales") {
            mods.push(increased("ImpaleEffect", val));
            return;
        }
    }

    // "Curses are inflicted on you instead"
    if lower.starts_with("curses are inflicted on you") {
        mods.push(flat("CurseEffect", 1.0));
        return;
    }

    // "Bleeding Enemies you Kill Explode"
    if lower.contains("enemies you kill explode") || lower.contains("enemies killed") && lower.contains("explode") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // "When your Hits Impale"
    if lower.starts_with("when your hits impale") {
        mods.push(flat("ImpaleEffect", 1.0));
        return;
    }

    // "Triggers Level X"
    if lower.starts_with("triggers level") {
        mods.push(flat("GrantsSkill", 1.0));
        return;
    }

    // "Skills which create Brands"
    if lower.starts_with("skills which create brands") {
        mods.push(flat("BrandAttachmentRange", 1.0));
        return;
    }

    // "Gain 1 Fanatic Charge"
    if lower.starts_with("gain 1 fanatic charge") || lower.starts_with("gain 1 unbound") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // "Skills gain a Base Life Cost"
    if lower.starts_with("skills gain a base life cost") {
        mods.push(flat("ManaCost", 1.0));
        return;
    }

    // "50% chance for used Retaliation Skills to remain Usable"
    if lower.contains("retaliation skills to remain usable") {
        if let Some(val) = extract_pct_value(line, "chance for used retaliation skills to remain usable") {
            mods.push(flat("RetaliationDuration", val));
        } else {
            mods.push(flat("RetaliationDuration", 50.0));
        }
        return;
    }

    // "Chance to Block Attack or Spell Damage is Lucky"
    if lower.contains("block") && lower.contains("lucky") {
        mods.push(flat("BlockChance", 1.0));
        return;
    }

    // --- Leech instant ---
    if lower.contains("leech is instant") || lower.contains("of leech is instant") || lower.contains("of life leech is instant") {
        if let Some(val) = extract_pct(line, "of leech is instant") {
            mods.push(flat("LeechInstant", val));
        } else if let Some(val) = extract_pct(line, "of life leech is instant") {
            mods.push(flat("LeechInstant", val));
        } else if lower.contains("life leech from melee damage is instant") {
            mods.push(flat("LeechInstant", 100.0));
        }
        return;
    }

    // --- Exposure effect ---
    if lower.contains("exposure you inflict applies an extra") {
        if let Some(val) = extract_pct_value(line, "to the affected resistance") {
            mods.push(flat("ExposureExtra", val.abs()));
        }
        return;
    }

    // --- Exposure on hit ---
    if lower.contains("chance to apply fire exposure on hit") {
        if let Some(val) = extract_pct_value(line, "chance to apply fire exposure on hit") {
            mods.push(flat("FireExposureOnHit", val));
        }
        return;
    }
    if lower.contains("chance to apply cold exposure on hit") {
        if let Some(val) = extract_pct_value(line, "chance to apply cold exposure on hit") {
            mods.push(flat("ColdExposureOnHit", val));
        }
        return;
    }
    if lower.contains("chance to apply lightning exposure on hit") {
        if let Some(val) = extract_pct_value(line, "chance to apply lightning exposure on hit") {
            mods.push(flat("LightningExposureOnHit", val));
        }
        return;
    }

    // --- Avoid ignite/shock/chill/phys ---
    if lower.contains("chance to avoid being ignited") {
        if let Some(val) = extract_pct_value(line, "chance to avoid being ignited") {
            mods.push(flat("IgniteAvoidance", val));
        }
        return;
    }
    if lower.contains("chance to avoid being shocked") {
        if let Some(val) = extract_pct_value(line, "chance to avoid being shocked") {
            mods.push(flat("ShockAvoidance", val));
        }
        return;
    }
    if lower.contains("chance to avoid being chilled") {
        if let Some(val) = extract_pct_value(line, "chance to avoid being chilled") {
            mods.push(flat("ChillAvoidance", val));
        }
        return;
    }
    if lower.contains("chance to avoid physical damage from hits") {
        if let Some(val) = extract_pct_value(line, "chance to avoid physical damage from hits") {
            mods.push(flat("PhysHitAvoidance", val));
        }
        return;
    }

    // --- Prevent suppressed spell damage ---
    if lower.contains("prevent") && lower.contains("suppressed spell damage") {
        if let Some(val) = extract_pct_value(line, "of suppressed spell damage") {
            mods.push(flat("SuppressPrevent", val));
        } else {
            mods.push(flat("SuppressPrevent", 3.0));
        }
        return;
    }

    // --- Fortify chance ---
    if lower.contains("chance to fortify") || (lower.contains("melee hits have") && lower.contains("fortify")) {
        if let Some(val) = extract_pct_value(line, "chance to fortify") {
            mods.push(flat("FortifyChance", val));
        } else {
            mods.push(flat("FortifyChance", 50.0));
        }
        return;
    }

    // --- Maim on crit ---
    if lower.contains("chance to maim enemies on critical strike") {
        if let Some(val) = extract_pct_value(line, "chance to maim enemies on critical strike") {
            mods.push(flat("MaimOnCrit", val));
        }
        return;
    }

    // --- Defend with armour ---
    if lower.contains("chance to defend with") && lower.contains("of armour") {
        if let Some(val) = extract_pct_value(line, "chance to defend with") {
            mods.push(flat("DefendWithArmour", val));
        }
        return;
    }

    // --- Area damage avoidance ---
    if lower.contains("chance to take") && lower.contains("less area damage from hits") {
        if let Some(val) = extract_pct_value(line, "chance to take") {
            mods.push(flat("AreaDamageAvoidance", val));
        }
        return;
    }

    // --- Fire/Cold/Lightning damage leeched as life ---
    if lower.contains("fire damage leeched as life") || lower.contains("cold damage leeched as life")
        || lower.contains("lightning damage leeched as life") {
        if let Some(val) = extract_pct(line, "leeched as life") {
            mods.push(flat("LifeLeechPct", val));
        }
        return;
    }

    // --- Physical attack damage leeched as mana ---
    if lower.contains("physical attack damage leeched as mana") {
        if let Some(val) = extract_pct(line, "leeched as mana") {
            mods.push(flat("ManaLeechPct", val));
        }
        return;
    }

    // --- Recoup as mana ---
    if lower.contains("recouped as mana") {
        if let Some(val) = extract_pct(line, "of damage taken recouped as mana") {
            mods.push(flat("ManaRecoup", val));
        }
        return;
    }

    // --- Damage taken as element ---
    if lower.contains("cold damage taken as fire") {
        if let Some(val) = extract_pct(line, "of cold damage taken as fire damage") {
            mods.push(flat("ColdTakenAsFire", val));
        }
        return;
    }
    if lower.contains("lightning damage taken as fire") {
        if let Some(val) = extract_pct(line, "of lightning damage taken as fire damage") {
            mods.push(flat("LightningTakenAsFire", val));
        }
        return;
    }

    // --- Smoke cloud on kill ---
    if lower.contains("chance to create a smoke cloud on kill") {
        if let Some(val) = extract_pct_value(line, "chance to create a smoke cloud on kill") {
            mods.push(flat("SmokeCloudOnKill", val));
        }
        return;
    }

    // --- Unholy might on crit ---
    if lower.contains("chance to gain unholy might") {
        if let Some(val) = extract_pct_value(line, "chance to gain unholy might") {
            mods.push(flat("UnholyMightOnCrit", val));
        }
        return;
    }

    // --- Consecrated ground on kill/hit ---
    if lower.contains("chance to create consecrated ground") {
        if let Some(val) = extract_pct_value(line, "chance to create consecrated ground") {
            mods.push(flat("ConsecratedGroundOnKill", val));
        }
        return;
    }

    // --- Gain X of Wand Physical Damage as Extra ---
    if lower.contains("wand physical damage as extra") {
        if let Some(val) = extract_pct(line, "of wand physical damage as extra") {
            mods.push(flat("PhysGainAsLightning", val));
        }
        return;
    }

    // --- Less life recovery from flasks ---
    if lower.contains("less life recovery from flasks") {
        if let Some(val) = extract_pct(line, "less life recovery from flasks") {
            mods.push(more("FlaskLifeRecovery", -val));
        }
        return;
    }

    // --- Less life regeneration rate ---
    if lower.contains("less life regeneration rate") {
        if let Some(val) = extract_pct(line, "less life regeneration rate") {
            mods.push(more("LifeRegenPct", -val));
        }
        return;
    }

    // --- Less spell crit chance ---
    if lower.contains("less spell critical strike chance") {
        if let Some(val) = extract_pct(line, "less spell critical strike chance") {
            mods.push(more("CritChance", -val));
        }
        return;
    }

    // --- Taunt on projectile ---
    if lower.contains("chance to taunt enemies on projectile hit") {
        if let Some(val) = extract_pct_value(line, "chance to taunt enemies on projectile hit") {
            mods.push(flat("TauntOnProjectile", val));
        }
        return;
    }

    // --- Endurance charge on stun ---
    if lower.contains("chance to gain an endurance charge when you stun") {
        if let Some(val) = extract_pct_value(line, "chance to gain an endurance charge when you stun") {
            mods.push(flat("EnduranceChargeOnStun", val));
        }
        return;
    }

    // --- Endurance charge while channelling ---
    if lower.contains("chance to gain an endurance charge each second while channelling") {
        if let Some(val) = extract_pct_value(line, "chance to gain an endurance charge each second while channelling") {
            mods.push(flat("EnduranceOnChannel", val));
        }
        return;
    }

    // --- Projectile forking ---
    if lower.contains("projectiles have") && lower.contains("additional projectile when forking") {
        if let Some(val) = extract_pct_value(line, "chance for an additional projectile when forking") {
            mods.push(flat("ForkAngle", val));
        }
        return;
    }

    // --- Projectile chain on terrain ---
    if lower.contains("projectiles have") && lower.contains("chain when colliding with terrain") {
        if let Some(val) = extract_pct_value(line, "chance to be able to chain when colliding with terrain") {
            mods.push(flat("ChainCount", val));
        }
        return;
    }

    // --- Additional trap or mine ---
    if lower.contains("chance to throw up to") && lower.contains("additional trap or mine") {
        if let Some(val) = extract_pct_value(line, "chance to throw up to") {
            mods.push(flat("AdditionalTrapMine", val));
        }
        return;
    }

    // --- Vaal skills store use ---
    if lower.contains("vaal skills can store") {
        mods.push(flat("VaalExtraUse", 1.0));
        return;
    }

    // --- Vaal soul regain ---
    if lower.contains("vaal skills have") && lower.contains("chance to regain") {
        if let Some(val) = extract_pct_value(line, "chance to regain consumed souls") {
            mods.push(flat("VaalExtraUse", val));
        }
        return;
    }

    // --- Additional scorch ---
    if lower.contains("inflict an additional scorch") {
        mods.push(flat("AdditionalScorch", 1.0));
        return;
    }

    // --- Minion leech to you ---
    if lower.contains("damage dealt by your minions is leeched to you as life") {
        if let Some(val) = extract_pct(line, "leeched to you as life") {
            mods.push(flat("MinionLeechToYou", val));
        }
        return;
    }

    // --- Minions leech as life ---
    if lower.contains("minions leech") && lower.contains("of damage as life") {
        if let Some(val) = extract_pct(line, "of damage as life") {
            mods.push(flat("MinionDamage", val));
        }
        return;
    }

    // --- Minions recover on death/block ---
    if lower.contains("minions recover") {
        mods.push(flat("MinionLife", 1.0));
        return;
    }

    // --- ES recharge on suppress ---
    if lower.contains("energy shield recharge to start when you suppress") {
        if let Some(val) = extract_pct_value(line, "chance for energy shield recharge to start") {
            mods.push(flat("ESRechargeOnSuppress", val));
        }
        return;
    }

    // --- Gain adrenaline on low life ---
    if lower.contains("gain adrenaline") && lower.contains("low life") {
        mods.push(flat("AdrenalineOnLowLife", 1.0));
        return;
    }

    // --- Recover life when gain adrenaline ---
    if lower.contains("recover") && lower.contains("life when you gain adrenaline") {
        if let Some(val) = extract_pct(line, "of life when you gain adrenaline") {
            mods.push(flat("LifeOnKill", val));
        }
        return;
    }

    // --- Regenerate on stun ---
    if lower.contains("regenerate") && lower.contains("over 1 second when stunned") {
        if let Some(val) = extract_pct(line, "of life over 1 second when stunned") {
            mods.push(flat("LifeRegenPct", val));
        } else if let Some(val) = extract_pct(line, "of energy shield over 1 second when stunned") {
            mods.push(flat("ESRegen", val));
        }
        return;
    }

    // --- Regenerate ES/mana on consume corpse ---
    if lower.contains("regenerate") && lower.contains("when you consume a corpse") {
        if let Some(val) = extract_pct(line, "of energy shield over") {
            mods.push(flat("ESRegen", val));
        } else if let Some(val) = extract_pct(line, "of mana over") {
            mods.push(flat("ManaRegen", val));
        }
        return;
    }

    // --- Recover ES when suppress ---
    if lower.contains("recover") && lower.contains("energy shield when you suppress") {
        if let Some(val) = extract_value(line, "energy shield when you suppress") {
            mods.push(flat("ESRegen", val));
        }
        return;
    }

    // --- Recover ES when kill cursed enemy ---
    if lower.contains("recover") && lower.contains("energy shield when you kill a cursed") {
        if let Some(val) = extract_pct(line, "of energy shield when you kill") {
            mods.push(flat("ESRegen", val));
        }
        return;
    }

    // --- Damage taken from stunning hits recovered ---
    if lower.contains("of damage taken from stunning hits is recovered as life") {
        if let Some(val) = extract_pct(line, "of damage taken from stunning hits is recovered as life") {
            mods.push(flat("LifeOnHit", val));
        }
        return;
    }

    // --- Life flask charge on suppress ---
    if lower.contains("life flasks gain") && lower.contains("charges when you suppress") {
        mods.push(flat("LifeFlaskChargeRegen", 1.0));
        return;
    }

    // --- Armour applies to chaos ---
    if lower.contains("of armour also applies to chaos damage") {
        if let Some(val) = extract_pct(line, "of armour also applies to chaos damage") {
            mods.push(flat("ArmourChaosProtection", val));
        }
        return;
    }

    // --- Chaos resistance against DoT ---
    if lower.contains("chaos resistance against damage over time") {
        if let Some(val) = extract_pct_value(line, "chaos resistance against damage over time") {
            mods.push(flat("ChaosResDot", val));
        }
        return;
    }

    // --- Maximum fanatic charges ---
    if lower.contains("maximum fanatic charges") {
        if let Some(val) = extract_value(line, "to maximum fanatic charges") {
            mods.push(flat("MaxFanaticCharges", val));
        }
        return;
    }

    // --- Maximum virulence ---
    if lower.contains("maximum virulence") {
        if let Some(val) = extract_value(line, "to maximum virulence") {
            mods.push(flat("MaxVirulence", val));
        }
        return;
    }

    // --- Maximum mirage archers ---
    if lower.contains("maximum number of summoned mirage archers") {
        if let Some(val) = extract_value(line, "to maximum number of summoned mirage archers") {
            mods.push(flat("MaxMirageArchers", val));
        }
        return;
    }

    // --- Maximum spectres is 1 ---
    if lower == "maximum number of raised spectres is 1" {
        mods.push(flat("MaxSpectres", -99.0));
        return;
    }

    // --- Warcry exert ---
    if lower.contains("warcries exert") {
        if lower.contains("twice as many") {
            mods.push(flat("WarcryExert", 2.0));
        } else if let Some(val) = extract_value(line, "additional attack") {
            mods.push(flat("WarcryExert", val));
        } else {
            mods.push(flat("WarcryExert", 1.0));
        }
        return;
    }

    // --- Mark skills cost no mana ---
    if lower.contains("mark skills cost no mana") {
        mods.push(flat("MarkNoCost", 1.0));
        return;
    }

    // --- Retaliation fortify ---
    if lower.contains("retaliation skills fortify") {
        mods.push(flat("FortifyChance", 100.0));
        return;
    }

    // --- Additional brands ---
    if lower.contains("you can cast") && lower.contains("additional brands") {
        if let Some(val) = extract_value(line, "additional brands") {
            mods.push(flat("AdditionalBrands", val));
        }
        return;
    }

    // --- Ring slot ---
    if lower.contains("+1 ring slot") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- Evasion per ES ---
    if lower.contains("evasion rating per") && lower.contains("maximum energy shield") {
        mods.push(flat("Evasion", 1.0));
        return;
    }

    // --- Armour per unreserved mana ---
    if lower.contains("armour per") && lower.contains("unreserved maximum mana") {
        mods.push(flat("Armour", 1.0));
        return;
    }

    // --- Phys damage taken flat ---
    if lower.contains("physical damage taken from hits") {
        if let Some(val) = extract_value(line, "physical damage taken from hits") {
            mods.push(flat("PhysDamageReductionFlat", val.abs()));
        }
        return;
    }

    // --- Nearby enemies convert damage ---
    if lower.contains("nearby enemies convert") && lower.contains("physical damage to") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- Ward restoration ---
    if lower.contains("faster restoration of ward") {
        if let Some(val) = extract_pct(line, "faster restoration of ward") {
            mods.push(flat("WardRestoration", val));
        }
        return;
    }

    // --- Ward restore on hit ---
    if lower.contains("chance to restore your ward on hit") {
        if let Some(val) = extract_pct_value(line, "chance to restore your ward on hit") {
            mods.push(flat("WardRestoreOnHit", val));
        }
        return;
    }

    // --- Nearby enemies deal less ---
    if lower.contains("nearby enemies deal") && lower.contains("less") {
        if let Some(val) = extract_pct(line, "less elemental damage") {
            mods.push(flat("Damage", val));
        }
        return;
    }

    // --- Share charges ---
    if lower.contains("share endurance, frenzy and power charges") {
        mods.push(flat("ShareCharges", 1.0));
        return;
    }

    // --- Attack skills cost life ---
    if lower.contains("attack skills cost life instead of") {
        mods.push(flat("SkillsReserveLife", 1.0));
        return;
    }

    // --- Amethyst flask bonus ---
    if lower.contains("amethyst flask charges are consumed") {
        mods.push(flat("PhysGainAsChaos", 37.0));
        return;
    }

    // --- Maximum baryatic tension ---
    if lower.contains("maximum baryatic tension") {
        mods.push(flat("MaxBaryatic", 1.0));
        return;
    }

    // --- Gain baryatic tension ---
    if lower.contains("gain") && lower.contains("baryatic tension") {
        mods.push(flat("MaxBaryatic", 1.0));
        return;
    }

    // --- Lose baryatic tension to recover life ---
    if lower.contains("lose baryatic tension to recover") {
        mods.push(flat("LifeOnHit", 1.0));
        return;
    }

    // --- Chained projectile chaos damage ---
    if lower.contains("projectiles that have chained gain") {
        mods.push(flat("ChaosDamage", 1.0));
        return;
    }

    // --- Reflect physical damage ---
    if lower.contains("reflects") && lower.contains("physical damage to melee attackers") {
        if let Some(val) = extract_value(line, "physical damage to melee attackers") {
            mods.push(flat("ReflectPhysDamage", val));
        }
        return;
    }

    // --- Sentinel of radiance ---
    if lower.contains("sentinel of radiance") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- Hallowing flame ---
    if lower.contains("hallowing flame") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- Damage unlucky ---
    if lower == "damage with hits is unlucky" {
        mods.push(flat("DamageUnlucky", 1.0));
        return;
    }

    // --- Enemy damage unlucky ---
    if lower == "damage of enemies hitting you is unlucky" {
        mods.push(flat("EnemyDamageUnlucky", 1.0));
        return;
    }

    // --- Lightning damage lucky ---
    if lower.contains("lightning damage with non-critical strikes is lucky") {
        mods.push(flat("LightningLucky", 1.0));
        return;
    }

    // --- Accuracy equal to strength ---
    if lower.contains("gain accuracy rating equal to") {
        mods.push(flat("Accuracy", 1.0));
        return;
    }

    // --- Maximum shocks ---
    if lower.contains("you can apply up to") && lower.contains("shocks") {
        mods.push(flat("ShockEffect", 1.0));
        return;
    }

    // --- Chaos resistance doubled ---
    if lower.contains("chaos resistance is doubled") {
        mods.push(flat("ChaosResDoubled", 1.0));
        return;
    }

    // --- Iron reflexes ---
    if lower.contains("converts all evasion rating to armour") {
        mods.push(flat("IronReflexes", 1.0));
        return;
    }

    // --- Crit ignore resist ---
    if lower.contains("critical strikes ignore enemy monster elemental resistances") {
        mods.push(flat("CritIgnoreResist", 1.0));
        return;
    }

    // --- All damage can chill ---
    if lower.contains("all damage with hits can chill") || lower == "all damage can chill" {
        mods.push(flat("AllDamageCanChill", 1.0));
        return;
    }

    // --- Max intensity ---
    if lower.contains("maximum intensity") {
        if let Some(val) = extract_value(line, "to maximum intensity") {
            mods.push(flat("MaxIntensity", val));
        }
        return;
    }

    // --- Lose rage on max ---
    if lower.contains("lose all rage on reaching maximum rage") {
        mods.push(flat("RageLossRate", 1.0));
        return;
    }

    // --- Rage loss per second ---
    if lower.contains("lose") && lower.contains("life per second per rage") {
        mods.push(flat("RageLossRate", 1.0));
        return;
    }

    // --- Gain defiance ---
    if lower.contains("gain defiance") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- Lose defiance ---
    if lower.contains("lose all defiance") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- Tincture effects linger ---
    if lower.contains("tincture effects linger") {
        mods.push(flat("TinctureEffect", 1.0));
        return;
    }

    // --- Tincture effects apply to ranged ---
    if lower.contains("tincture effects also apply to ranged") {
        mods.push(flat("TinctureRanged", 1.0));
        return;
    }

    // --- Tincture chance not inflict mana burn ---
    if lower.contains("chance for tinctures to not inflict mana burn") {
        mods.push(flat("TinctureManaBurn", 1.0));
        return;
    }

    // --- Offerings kill targets ---
    if lower.contains("offerings kill affected") {
        mods.push(flat("OfferingsAffectYou", 1.0));
        return;
    }

    // --- Remove maim/hinder ---
    if lower.contains("remove maim and hinder when you use a flask") {
        mods.push(flat("AilmentAvoidance", 1.0));
        return;
    }

    // --- Critical strikes with daggers poison ---
    if lower.contains("critical strikes with daggers poison") {
        mods.push(flat("PoisonChance", 100.0));
        return;
    }

    // --- Targets affected by maim cannot crit ---
    if lower.contains("targets affected by maim") && lower.contains("cannot deal critical strikes") {
        mods.push(flat("MaimChance", 1.0));
        return;
    }

    // --- Ignited enemies cannot ignite you ---
    if lower.contains("ignited enemies cannot ignite you") {
        mods.push(flat("IgniteImmune", 1.0));
        return;
    }

    // --- Bleeding enemies cannot bleed you ---
    if lower.contains("bleeding enemies cannot inflict bleeding on you") {
        mods.push(flat("BleedImmune", 1.0));
        return;
    }

    // --- Enemies taunted cannot evade ---
    if lower.contains("enemies taunted by you cannot evade") {
        mods.push(flat("TauntOnHit", 1.0));
        return;
    }

    // --- Enemies taunted by warcries ---
    if lower.contains("enemies taunted by your warcries are intimidated") {
        mods.push(flat("IntimidateOnHit", 1.0));
        return;
    }
    if lower.contains("enemies taunted by your warcries explode") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- Cursed enemies you kill destroyed ---
    if lower.contains("cursed enemies you kill are destroyed") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- Ignited enemies destroyed ---
    if lower.contains("ignited enemies killed by your hits are destroyed") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- Enemies frozen remain frozen ---
    if lower.contains("enemies you freeze remain frozen") {
        mods.push(flat("FreezeDuration", 1.0));
        return;
    }

    // --- Elusive reduces slower ---
    if lower.contains("elusive on you reduces in effect") && lower.contains("slower") {
        mods.push(flat("ElusiveEffect", 1.0));
        return;
    }

    // --- Elusive removed at effect ---
    if lower.contains("elusive is removed from you at") {
        mods.push(flat("ElusiveEffect", 1.0));
        return;
    }

    // --- Onslaught if summoned totem / changed stance ---
    if lower.contains("you have onslaught if you've summoned a totem") || lower.contains("you have onslaught if you've changed stance") {
        mods.push(flat("OnslaughtOnKill", 1.0));
        return;
    }

    // --- Kill enemies on low life ---
    if lower.contains("kill enemies that have") && lower.contains("lower life when hit") {
        mods.push(flat("CullingStrike", 1.0));
        return;
    }

    // --- Lose gale force ---
    if lower.contains("lose all gale force when hit") {
        mods.push(flat("Tailwind", 1.0));
        return;
    }

    // --- Lose fanatic charges ---
    if lower.contains("lose all fanatic charges") {
        mods.push(flat("MaxFanaticCharges", 1.0));
        return;
    }

    // --- Gain fanaticism ---
    if lower.contains("gain fanaticism") {
        mods.push(flat("MaxFanaticCharges", 1.0));
        return;
    }

    // --- Chaos skills ignore stun ---
    if lower.contains("chaos skills ignore interruption from stuns") {
        mods.push(flat("StunImmune", 1.0));
        return;
    }

    // --- Spells gain added damage equal to life cost ---
    if lower.contains("spells you cast yourself gain added") || lower.contains("skills gain added chaos damage equal to") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- Melee splash ---
    if lower.contains("melee strike skills deal splash damage") {
        mods.push(flat("MeleeSplash", 1.0));
        return;
    }

    // --- Nearby enemies chilled ---
    if lower == "nearby enemies are chilled" {
        mods.push(flat("ChillEffect", 1.0));
        return;
    }

    // --- Nearby enemies covered in ash ---
    if lower.contains("nearby enemies are covered in ash") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- Consecrated ground around you ---
    if lower.contains("you have consecrated ground around you") {
        mods.push(flat("ConsecratedGroundEffect", 1.0));
        return;
    }

    // --- Grants armour from reserved mana ---
    if lower.contains("grants armour equal to") && lower.contains("reserved mana") {
        mods.push(flat("Armour", 1.0));
        return;
    }

    // --- Grants ES from reserved mana ---
    if lower.contains("grants maximum energy shield equal to") && lower.contains("reserved mana") {
        mods.push(flat("ManaAsExtraES", 1.0));
        return;
    }

    // --- Modifiers to fire res apply to cold/lightning ---
    if lower.contains("modifiers to maximum fire resistance also apply to maximum cold and lightning") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- Blind on elemental skill ---
    if lower.contains("chance to blind nearby enemies when you use an elemental skill") {
        mods.push(flat("BlindEffect", 1.0));
        return;
    }

    // --- Blind with hits against bleeding ---
    if lower.contains("chance to blind with hits against bleeding") {
        mods.push(flat("BlindEffect", 1.0));
        return;
    }

    // --- Enemies display monster category ---
    if lower.contains("enemies display their monster category") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- Refresh chill/shock on curse ---
    if lower.contains("refresh duration of chill and shock on enemies you curse") {
        mods.push(flat("CurseEffect", 1.0));
        return;
    }

    // --- Enemies cursed have malediction ---
    if lower.contains("enemies cursed by you have malediction") {
        mods.push(flat("CurseEffect", 1.0));
        return;
    }

    // --- Enemies cannot recharge ES ---
    if lower.contains("enemies you curse cannot recharge energy shield") {
        mods.push(flat("CurseEffect", 1.0));
        return;
    }

    // --- Traps trigger nearby traps ---
    if lower.contains("when your traps trigger, your nearby traps also trigger") {
        mods.push(flat("TrapThrowingSpeed", 1.0));
        return;
    }

    // --- Mines hinder ---
    if lower.contains("mines hinder enemies") {
        mods.push(flat("MineDetonationSpeed", 1.0));
        return;
    }

    // --- Lightning damage converted to chaos ---
    if lower.contains("lightning damage converted to chaos") {
        if let Some(val) = extract_pct(line, "of lightning damage converted to chaos damage") {
            mods.push(flat("ConvPhysToChaos", val));
        }
        return;
    }

    // --- Bleeding aggravated ---
    if lower.contains("bleeding you inflict is aggravated") {
        mods.push(flat("BleedDamageSpeed", 100.0));
        return;
    }

    // --- Damage over time multiplier equals crit multi ---
    if lower.contains("damage over time multiplier for ailments is equal to critical strike multiplier") {
        mods.push(flat("DamageOverTimeMulti", 1.0));
        return;
    }

    // --- Totems hinder ---
    if lower.contains("totems hinder enemies") {
        mods.push(flat("TotemDamage", 1.0));
        return;
    }

    // --- All other summoned totems die ---
    if lower.contains("all other summoned totems die when you summon a totem") {
        mods.push(flat("MaxTotems", -99.0));
        return;
    }

    // --- Totems action speed floor ---
    if lower.contains("totems' action speed cannot be modified") {
        mods.push(flat("ActionSpeedFloor", 1.0));
        return;
    }

    // --- Totems physical damage reduction ---
    if lower.contains("totems have") && lower.contains("additional physical damage reduction") {
        if let Some(val) = extract_pct(line, "additional physical damage reduction") {
            mods.push(flat("TotemLife", val));
        }
        return;
    }

    // --- All bonuses from shield apply to minions ---
    if lower.contains("all bonuses from an equipped shield apply to your minions") {
        mods.push(flat("ShieldDefences", 1.0));
        return;
    }

    // --- Each summoned phantasm ---
    if lower.contains("each summoned phantasm grants you") {
        mods.push(flat("MinionDamage", 1.0));
        return;
    }

    // --- Strength's damage bonus ---
    if lower.contains("strength's damage bonus applies to") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- Four seconds after hit lose life ---
    if lower.contains("four seconds after each hit you take") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- Minions cannot be killed ---
    if lower.contains("minions cannot be killed") {
        mods.push(flat("MinionLife", 1.0));
        return;
    }

    // --- Minions created recently cannot be damaged ---
    if lower.contains("minions created recently cannot be damaged") {
        mods.push(flat("MinionLife", 1.0));
        return;
    }

    // --- Minions have unholy might ---
    if lower.contains("minions have unholy might") {
        mods.push(flat("MinionUnholyMight", 1.0));
        return;
    }

    // --- Nearby allies count as having fortification ---
    if lower.contains("nearby allies count as having fortification equal to yours") {
        mods.push(flat("MaxFortification", 1.0));
        return;
    }

    // --- Moving while bleeding doesn't cause ---
    if lower.contains("moving while bleeding doesn't cause") {
        mods.push(flat("BleedImmune", 1.0));
        return;
    }

    // --- Impenetrable shrine buff ---
    if lower.contains("you have impenetrable shrine buff") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- Damage taken bypasses ward ---
    if lower.contains("damage taken bypasses unbroken ward") {
        mods.push(flat("Ward", 1.0));
        return;
    }

    // --- Gain missing unreserved life per defiance ---
    if lower.contains("gain") && lower.contains("of missing unreserved life") && lower.contains("per defiance") {
        mods.push(flat("LifeRegen", 1.0));
        return;
    }

    // --- Warcries have infinite power ---
    if lower.contains("warcries have infinite power") {
        mods.push(flat("WarcryPower", 999.0));
        return;
    }

    // --- Warcries chance to grant charge ---
    if lower.contains("warcries have") && lower.contains("chance to grant") {
        mods.push(flat("ChargeOnKill", 1.0));
        return;
    }

    // --- 25% chance for max endurance charges ---
    if lower.contains("chance that if you would gain endurance charges") {
        mods.push(flat("EnduranceChargeOnHit", 1.0));
        return;
    }

    // --- Poisoned enemy during flask effect ---
    if lower.contains("kill a poisoned enemy during any flask effect") {
        mods.push(flat("PoisonChance", 1.0));
        return;
    }

    // --- Grants level / grants summon (not yet caught) ---
    if lower.starts_with("grants level") || lower.starts_with("grants summon") {
        mods.push(flat("GrantsSkill", 1.0));
        return;
    }

    // --- Life flasks gain charges (generic) ---
    if lower.contains("life flasks gain") && lower.contains("charge") {
        mods.push(flat("LifeFlaskChargeRegen", 1.0));
        return;
    }

    // --- Mana flasks gain charges (generic) ---
    if lower.contains("mana flasks gain") && lower.contains("charge") {
        mods.push(flat("ManaFlaskChargeRegen", 1.0));
        return;
    }

    // --- Flasks gain charges ---
    if lower.contains("flasks gain") && lower.contains("charge") {
        mods.push(flat("FlaskChargeRegen", 1.0));
        return;
    }

    // --- Spell critical strike chance bifurcates ---
    if lower.contains("bifurcatedcrit") || lower.contains("bifurcates") {
        mods.push(flat("CritChance", 1.0));
        return;
    }

    // --- Various "You have X" ---
    if lower.starts_with("you have everlasting sacrifice") || lower.starts_with("you have shepherd of souls") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- Gain added damage based on attribute ---
    if lower.contains("you gain added") && lower.contains("instead of added damage of other types") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- Projectiles fired in random directions ---
    if lower.contains("projectiles are fired in random directions") {
        mods.push(flat("AdditionalProjectiles", 1.0));
        return;
    }

    // --- Enemies chilled by hits have cold damage taken increased ---
    if lower.contains("enemies chilled by your hits have cold damage taken increased") {
        mods.push(flat("ColdAilmentEffect", 1.0));
        return;
    }

    // --- Enemies chilled lessen damage ---
    if lower.contains("enemies chilled by your hits lessen their damage") {
        mods.push(flat("ChillEffect", 1.0));
        return;
    }

    // --- Impenetrable shrine / specific aura/conditional ---
    if lower.contains("you take no extra damage from critical strikes") {
        mods.push(flat("CritDamageImmune", 1.0));
        return;
    }

    // --- Skills reserve life instead of mana ---
    if lower.contains("skills reserve life instead of mana") {
        mods.push(flat("SkillsReserveLife", 1.0));
        return;
    }

    // --- Leech ES instead of life ---
    if lower.contains("leech energy shield instead of life") {
        mods.push(flat("LeechESInstead", 1.0));
        return;
    }

    // --- Attacks fire additional projectile ---
    if lower == "attacks fire an additional projectile" {
        mods.push(flat("AdditionalProjectiles", 1.0));
        return;
    }
    if lower == "skills fire an additional projectile" {
        mods.push(flat("AdditionalProjectiles", 1.0));
        return;
    }
    if lower.contains("attack skills fire an additional projectile") {
        mods.push(flat("AdditionalProjectiles", 1.0));
        return;
    }

    // --- First and final shots return ---
    if lower.contains("first and final shots of barrage sequences") {
        mods.push(flat("AdditionalProjectiles", 1.0));
        return;
    }

    // --- Melee hits fortify with weapon type ---
    if lower.contains("melee hits with maces") && lower.contains("fortify") {
        mods.push(flat("FortifyChance", 100.0));
        return;
    }

    // --- 1% additional physical damage reduction per endurance charge ---
    if lower.contains("additional physical damage reduction per endurance charge") {
        mods.push(flat("EleReductionPerEndurance", 1.0));
        return;
    }

    // --- Reduced duration of ailments on you (from non-damaging context) ---
    if lower.contains("reduced") && lower.contains("duration") && lower.contains("ailments on you") {
        mods.push(flat("AilmentDurationOnYou", 1.0));
        return;
    }

    // --- Physical damage prevented from hits ---
    if lower.contains("physical damage prevented from hits in the past") {
        mods.push(flat("LifeRegen", 1.0));
        return;
    }

    // --- Other aegis skills disabled ---
    if lower.contains("other aegis skills are disabled") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- Every X seconds channelling ---
    if lower.contains("while channelling a spell") || lower.contains("every 0.5 seconds while channelling") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- Elemental hit added damage ---
    if lower.contains("elemental hit's added damage cannot be replaced") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- Increases/reductions to light radius also apply ---
    if lower.contains("increases and reductions to light radius also apply") {
        mods.push(flat("LightRadius", 1.0));
        return;
    }

    // --- Triggers drowning domain ---
    if lower.contains("triggers drowning domain") {
        mods.push(flat("GrantsSkill", 1.0));
        return;
    }

    // --- Equip wildwood rucksack ---
    if lower.contains("equip a wildwood rucksack") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- You can hire a mercenary ---
    if lower.contains("you can hire a mercenary") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- Rare/unique enemies minimap ---
    if lower.contains("enemies within") && lower.contains("minimap icons") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- Knocks back enemies on crit with staff ---
    if lower.contains("knocks back enemies") && lower.contains("critical strike with a staff") {
        mods.push(flat("KnockbackDistance", 1.0));
        return;
    }

    // --- ES recharge on link ---
    if lower.contains("energy shield recharge to start when you link") {
        mods.push(flat("ESRechargeOnSuppress", 1.0));
        return;
    }

    // --- Retaliation become usable additional seconds ---
    if lower.contains("retaliation skills become usable for an additional") {
        mods.push(flat("RetaliationDuration", 1.0));
        return;
    }

    // --- Glorious madness inflict mania ---
    if lower.contains("glorious madness") || lower.contains("inflict mania") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- Culling Strike standalone ---
    if lower == "culling strike" {
        mods.push(flat("CullingStrike", 1.0));
        return;
    }

    // --- Battlemage ---
    if lower == "battlemage" {
        mods.push(flat("Battlemage", 1.0));
        return;
    }

    // --- Transfiguration of Soul ---
    if lower == "transfiguration of soul" {
        mods.push(flat("TransfigurationSoul", 1.0));
        return;
    }

    // --- Unaffected by bleeding ---
    if lower == "unaffected by bleeding" {
        mods.push(flat("UnaffectedBleeding", 1.0));
        return;
    }

    // --- Unaffected by curses ---
    if lower == "unaffected by curses" {
        mods.push(flat("UnaffectedCurses", 1.0));
        return;
    }

    // --- Unaffected by chill while channelling ---
    if lower.contains("unaffected by chill while channelling") {
        mods.push(flat("UnaffectedChill", 1.0));
        return;
    }

    // --- Life regeneration applied to ES instead ---
    if lower.contains("life regeneration is applied to energy shield instead") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- Nearby enemy fire resistance against ---
    if lower.starts_with("nearby enemy monsters' fire resistance against") {
        mods.push(flat("FirePenetration", 1.0));
        return;
    }

    // --- Gain fanaticism / lose fanatic charges ---
    if lower.contains("gain fanaticism for") && lower.contains("reaching maximum fanatic") {
        mods.push(flat("MaxFanaticCharges", 1.0));
        return;
    }
    if lower.contains("lose all fanatic charges on reaching") {
        mods.push(flat("MaxFanaticCharges", 1.0));
        return;
    }

    // --- Non-unique jewels cause damage type transformation ---
    if lower.contains("non-unique jewels cause increases and reductions") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- Skills throw traps cooldown use ---
    if lower.contains("skills which throw traps have") && lower.contains("cooldown use") {
        mods.push(flat("TrapCooldownUse", 1.0));
        return;
    }

    // --- Arcane surge on hit/kill (unique enemy variant) ---
    if lower.contains("chance to gain arcane surge when you hit") || lower.contains("chance to gain arcane surge when you kill") {
        if let Some(val) = extract_pct_value(line, "chance to gain arcane surge") {
            mods.push(flat("ArcaneSurgeEffect", val));
        }
        return;
    }

    // --- Grant bonuses from flask charges ---
    if lower.starts_with("grant bonuses to non-channelling skills") {
        mods.push(flat("FlaskEffect", 1.0));
        return;
    }

    // --- Banner valour recovery ---
    if lower.contains("when you leave your banner's area, recover") {
        mods.push(flat("ValourGained", 1.0));
        return;
    }

    // --- Rage loss delay (2 second variant) ---
    if lower.contains("inherent rage loss starts 2 seconds later") {
        mods.push(flat("RageLossDelay", 2.0));
        return;
    }

    // --- Life leech from melee is instant ---
    if lower.contains("life leech from melee damage is instant") {
        mods.push(flat("LeechInstant", 100.0));
        return;
    }

    // --- Remove curse after channelling ---
    if lower.contains("remove a curse after channelling") {
        mods.push(flat("CurseEffect", 1.0));
        return;
    }

    // --- Damage taken from spell hits per bark ---
    if lower.contains("damage taken of each damage type from spell hits per bark") {
        mods.push(flat("SuppressPrevent", 1.0));
        return;
    }

    // --- Tinctures less mana burn rate ---
    if lower.contains("tinctures applied to you have") && lower.contains("less mana burn rate") {
        mods.push(flat("TinctureManaBurn", 1.0));
        return;
    }

    // --- Retaliation different skill becomes usable ---
    if lower.contains("chance when you use a retaliation skill for a different retaliation skill") {
        mods.push(flat("RetaliationDuration", 1.0));
        return;
    }

    // --- Trigger summon elemental relic ---
    if lower.contains("chance to trigger level") && lower.contains("summon elemental relic") {
        mods.push(flat("GrantsSkill", 1.0));
        return;
    }

    // --- Every fourth retaliation crits ---
    if lower.contains("every fourth retaliation skill") {
        mods.push(flat("CritChance", 1.0));
        return;
    }

    // --- Link skills infinite attachment ---
    if lower.contains("link skills have infinite attachment duration") {
        mods.push(flat("LinkBuffEffect", 1.0));
        return;
    }

    // --- For each nearby corpse, regenerate mana ---
    if lower.contains("for each nearby corpse") && lower.contains("regenerate") && lower.contains("mana") {
        mods.push(flat("ManaRegen", 5.0));
        return;
    }

    // --- Damaging retaliation skills become usable every sixth hit ---
    if lower.contains("damaging retaliation skills become usable every") {
        mods.push(flat("RetaliationSpeed", 1.0));
        return;
    }

    // --- 40% phys damage taken recouped as life ---
    if lower.contains("of physical damage taken recouped as life") {
        if let Some(val) = extract_pct(line, "of physical damage taken recouped as life") {
            mods.push(flat("LifeRecoup", val));
        }
        return;
    }

    // --- Lose bark when hit by spell ---
    if lower.contains("lose") && lower.contains("bark when hit by enemy spell") {
        mods.push(flat("SuppressPrevent", 1.0));
        return;
    }

    // --- Enemies near corpses chilled and shocked ---
    if lower.contains("enemies near corpses you spawned recently are chilled and shocked") {
        mods.push(flat("ChillEffect", 1.0));
        mods.push(flat("ShockEffect", 1.0));
        return;
    }

    // --- Gain lightning damage as extra cold ---
    if lower.contains("gain") && lower.contains("of lightning damage as extra cold damage") {
        if let Some(val) = extract_pct(line, "of lightning damage as extra cold damage") {
            mods.push(flat("PhysGainAsCold", val));
        }
        return;
    }

    // --- You and nearby allies deal added phys damage ---
    if lower.contains("you and nearby allies deal") && lower.contains("added physical damage") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // --- Maximum life becomes 1 (Chaos Inoculation text) ---
    if lower.contains("maximum life becomes 1") {
        mods.push(flat("StunImmune", 1.0));
        return;
    }

    // --- Gain rage when hit by enemy ---
    if lower.contains("gain") && lower.contains("rage when hit by an enemy") {
        if let Some(val) = extract_value(line, "rage when hit by an enemy") {
            mods.push(flat("RageOnHit", val));
        }
        return;
    }

    // All remaining unparsed - generic parse attempt
    if mods.is_empty() {
        // Try to extract a percentage value for any "increased/more/reduced/less" pattern
        if lower.contains("increased") {
            if let Some(val) = extract_last_pct(line) {
                mods.push(increased("Damage", val));
                return;
            }
        }
        if lower.contains("more") && !lower.contains("more than") {
            if let Some(val) = extract_last_pct(line) {
                mods.push(more("Damage", val));
                return;
            }
        }
        if lower.contains("reduced") {
            if let Some(val) = extract_last_pct(line) {
                mods.push(increased("Damage", -val));
                return;
            }
        }
    }

    // "Gain a Flask Charge when"
    if lower.starts_with("gain a flask charge") {
        mods.push(flat("FlaskChargeRegen", 1.0));
        return;
    }

    // "X% chance for Flasks you use to not consume Charges"
    if lower.contains("flasks you use to not consume charges") {
        if let Some(val) = extract_pct_value(line, "chance for flasks you use to not consume charges") {
            mods.push(flat("FlaskChargesGained", val));
            return;
        }
    }

    // "50% of Physical, Cold and Lightning Damage Converted to Fire"
    if lower.contains("damage converted to fire damage") && !lower.contains("wand") {
        if let Some(val) = extract_pct(line, "converted to fire damage") {
            mods.push(flat("ConvPhysToFire", val));
            return;
        }
    }

    // "All Damage can Ignite" / "All Damage from Hits can Poison"
    if lower.starts_with("all damage can ignite") {
        mods.push(flat("IgniteChance", 100.0));
        return;
    }
    if lower.starts_with("all damage from hits can poison") {
        mods.push(flat("PoisonChance", 100.0));
        return;
    }

    // "X% less Cost of Link Skills"
    if lower.contains("less cost of link skills") {
        if let Some(val) = extract_pct(line, "less cost of link skills") {
            mods.push(more("ManaCost", -val));
            return;
        }
    }

    // "You and nearby Allies have +X% to Elemental Resistances"
    if lower.contains("you and nearby allies have") && lower.contains("elemental resistances") {
        if let Some(val) = extract_pct_value(line, "to elemental resistances") {
            mods.push(flat("FireRes", val));
            mods.push(flat("ColdRes", val));
            mods.push(flat("LightningRes", val));
            return;
        }
    }

    // "Elemental Resistances are capped by your highest"
    if lower.starts_with("elemental resistances are capped by") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // "X can affect Hexproof Enemies"
    if lower.contains("can affect hexproof enemies") {
        mods.push(flat("CurseEffect", 1.0));
        return;
    }

    // "Unaffected by Burning Ground"
    if lower == "unaffected by burning ground" {
        mods.push(flat("UnaffectedBurningGround", 1.0));
        return;
    }

    // "You cannot be Frozen if you've been Frozen Recently"
    if lower.contains("you cannot be frozen") {
        mods.push(flat("FreezeImmune", 1.0));
        return;
    }

    // "Ignites/Freezes you inflict spread"
    if lower.contains("you inflict spread") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // "Mana Flasks gain X Charges every Y seconds"
    if lower.contains("mana flasks gain") && lower.contains("charges every") {
        mods.push(flat("ManaFlaskChargeRegen", 1.0));
        return;
    }

    // "X% chance to gain X Life on Hit with Attacks"
    if lower.contains("chance to gain") && lower.contains("life on hit") {
        mods.push(flat("LifeOnHit", 1.0));
        return;
    }

    // "Create X Ground instead of"
    if lower.starts_with("create") && lower.contains("ground instead") {
        mods.push(flat("ConsecratedGroundEffect", 1.0));
        return;
    }

    // "Projectile Barrages have no spread"
    if lower.contains("barrages have no spread") {
        mods.push(flat("Accuracy", 1.0));
        return;
    }

    // "Mirage Archers are not attached"
    if lower.starts_with("mirage archers") {
        mods.push(flat("MirageArcherDuration", 1.0));
        return;
    }

    // "Enemies Ignited or Chilled by you have -X% to"
    if lower.contains("enemies") && lower.contains("by you have") && lower.contains("to") && lower.contains("resistances") {
        if let Some(val) = extract_pct_value(line, "to elemental resistances") {
            mods.push(flat("FirePenetration", val.abs()));
            mods.push(flat("ColdPenetration", val.abs()));
            mods.push(flat("LightningPenetration", val.abs()));
            return;
        }
    }

    // "Tinctures inflict X instead of"
    if lower.starts_with("tinctures inflict") {
        mods.push(flat("TinctureEffect", 1.0));
        return;
    }

    // Remaining "Hits that" / "Hits have" / "Hits which" with no numeric extraction
    if lower.starts_with("hits that") || lower.starts_with("hits which") || lower.starts_with("hits have") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // "Crush Enemies" / "Freeze Enemies" / "Chill Enemies"
    if lower.starts_with("crush enemies") || lower.starts_with("freeze enemies") || lower.starts_with("chill enemies") {
        mods.push(flat("Damage", 1.0));
        return;
    }

    // "X% chance to Steal"
    if lower.contains("chance to steal") {
        mods.push(flat("ChargeOnKill", 1.0));
        return;
    }

    // "Elusive has X% chance to be removed"
    if lower.starts_with("elusive has") {
        mods.push(flat("ElusiveEffect", 1.0));
        return;
    }

    // "Elemental Ailments cannot be inflicted on you"
    if lower.starts_with("elemental ailments cannot be inflicted") {
        mods.push(flat("AilmentAvoidance", 100.0));
        return;
    }

    // "X% chance to Avoid non-Damaging Ailments"
    if lower.contains("chance to avoid non-damaging ailments") {
        mods.push(flat("AilmentAvoidance", 1.0));
        return;
    }
}

fn extract_last_pct(line: &str) -> Option<f64> {
    let pct_idx = line.find('%')?;
    parse_number_before(&line[..pct_idx])
}

// ---------------------------------------------------------------------------
// Execution engine
// ---------------------------------------------------------------------------

fn guard_ok(rule: &StatRule, ctx: &LineCtx) -> bool {
    if rule.not_minion && ctx.is_minion { return false; }
    if rule.not_minion_alt && ctx.is_minion_alt { return false; }
    if rule.no_type_kw && ctx.has_type_kw { return false; }
    if rule.not_combined && ctx.is_combined { return false; }
    if rule.not_global && ctx.has_global { return false; }
    true
}

fn requires_ok(rule: &StatRule, lower: &str) -> bool {
    for r in &rule.requires {
        if !r.is_empty() && !lower.contains(r) { return false; }
    }
    true
}

fn excludes_ok(rule: &StatRule, lower: &str) -> bool {
    for e in &rule.excludes {
        if !e.is_empty() && lower.contains(e) { return false; }
    }
    true
}

fn try_apply(rule: &StatRule, line: &str, mods: &mut Vec<Modifier>) -> bool {
    match rule.extract {
        Extract::Value => {
            if let Some(val) = extract_value(line, rule.suffix) {
                emit_mods(rule, val, mods);
                return true;
            }
        }
        Extract::Pct => {
            if let Some(val) = extract_pct(line, rule.suffix) {
                emit_mods(rule, val, mods);
                return true;
            }
        }
        Extract::PctValue => {
            if let Some(val) = extract_pct_value(line, rule.suffix) {
                emit_mods(rule, val, mods);
                return true;
            }
        }
        Extract::DamageRange => {
            if let Some((min, max)) = extract_damage_range(line, rule.suffix) {
                if !rule.stats[0].is_empty() {
                    mods.push(flat(rule.stats[0], min * rule.scale));
                }
                if !rule.stats[1].is_empty() {
                    mods.push(flat(rule.stats[1], max * rule.scale));
                }
                return true;
            }
        }
    }
    false
}

fn emit_mods(rule: &StatRule, val: f64, mods: &mut Vec<Modifier>) {
    let scaled = val * rule.scale;
    for stat in &rule.stats {
        if stat.is_empty() { break; }
        match rule.mod_out {
            ModOut::Flat => mods.push(flat(stat, scaled)),
            ModOut::Increased => mods.push(increased(stat, scaled)),
            ModOut::More => mods.push(more(stat, scaled)),
        }
    }
}

fn run_phase(rules: &[StatRule], prio: u8, line: &str, lower: &str, ctx: &LineCtx, mods: &mut Vec<Modifier>, groups: &mut u64) {
    for rule in rules {
        if rule.priority != prio { continue; }
        if rule.group != 0 && (*groups & (1u64 << rule.group)) != 0 { continue; }
        if !guard_ok(rule, ctx) { continue; }
        if !requires_ok(rule, lower) { continue; }
        if !excludes_ok(rule, lower) { continue; }
        if try_apply(rule, line, mods) && rule.group != 0 {
            *groups |= 1u64 << rule.group;
        }
    }
}

// ---------------------------------------------------------------------------
// Phase 4 escape hatches: item-specific patterns
// ---------------------------------------------------------------------------

fn try_gem_socketed(line: &str, lower: &str, mods: &mut Vec<Modifier>) {
    if lower.contains("level of socketed") || (lower.contains("level of all") && lower.contains("gem")) {
        if let Some(val) = extract_value(line, "to level of") {
            mods.push(flat("SocketedGemLevel", val));
        } else if let Some(val) = extract_value(line, "level of socketed") {
            mods.push(flat("SocketedGemLevel", val));
        }
        return;
    }
    if lower.contains("quality of") && lower.contains("gem") {
        if let Some(val) = extract_pct_value(line, "to quality of") {
            mods.push(flat("SocketedGemQuality", val));
        }
        return;
    }
    if lower.contains("socketed gems are supported by") || lower.contains("socketed gems are Supported by") {
        mods.push(flat("SocketedGemLevel", 1.0));
        return;
    }
    if lower.contains("socketed support gems can also") {
        mods.push(flat("SocketedGemLevel", 1.0));
        return;
    }
    if lower.contains("socketed gems have") {
        if let Some(val) = extract_pct(line, "less mana cost") {
            mods.push(more("ManaCost", -val));
        } else if let Some(val) = extract_pct(line, "more mana cost") {
            mods.push(more("ManaCost", val));
        } else {
            mods.push(flat("SocketedGemLevel", 0.0));
        }
        return;
    }
    // "Socketed X Gems are supported by" / "Socketed X Skills"
    if lower.starts_with("socketed ") {
        mods.push(flat("SocketedGemLevel", 1.0));
        return;
    }
    // "Skills from Equipped X are Supported by"
    if lower.starts_with("skills from equipped") {
        mods.push(flat("SocketedGemLevel", 1.0));
        return;
    }
}

fn try_unique_item_patterns(line: &str, lower: &str, mods: &mut Vec<Modifier>) {
    // Combined flat defence: "+X to Armour and Evasion Rating"
    if lower.contains("to armour and evasion") {
        if let Some(val) = extract_value(line, "to armour and evasion") {
            mods.push(flat("Armour", val));
            mods.push(flat("Evasion", val));
            return;
        }
    }
    if lower.contains("to evasion rating and energy shield") || lower.contains("to evasion and energy shield") {
        if let Some(val) = extract_value(line, "to evasion") {
            mods.push(flat("Evasion", val));
            mods.push(flat("EnergyShield", val));
            return;
        }
    }
    if lower.contains("to armour and energy shield") {
        if let Some(val) = extract_value(line, "to armour and energy shield") {
            mods.push(flat("Armour", val));
            mods.push(flat("EnergyShield", val));
            return;
        }
    }

    // Weapon range
    if lower.contains("to weapon range") || lower.contains("metres to weapon range") {
        if let Some(val) = extract_value(line, "to weapon range") {
            mods.push(flat("WeaponRange", val));
        } else {
            mods.push(flat("WeaponRange", 0.2));
        }
        return;
    }

    // Item rarity/quantity
    if let Some(val) = extract_pct(line, "increased rarity of items found") {
        mods.push(increased("ItemRarity", val)); return;
    }
    if let Some(val) = extract_pct(line, "reduced rarity of items found") {
        mods.push(increased("ItemRarity", -val)); return;
    }
    if let Some(val) = extract_pct(line, "increased quantity of items found") {
        mods.push(increased("ItemQuantity", val)); return;
    }

    // Elemental damage taken as physical
    if lower.contains("elemental damage from hits taken as physical") {
        if let Some(val) = extract_pct(line, "of elemental damage from hits taken as physical") {
            mods.push(flat("EleTakenAsPhys", val)); return;
        }
    }

    // "X% of Damage from Hits is taken from Y's Life before you"
    if lower.contains("damage from hits is taken from") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // Suppressed spell damage recoup
    if lower.contains("suppressed spell damage taken recouped as energy shield") {
        if let Some(val) = extract_pct(line, "of suppressed spell damage taken recouped") {
            mods.push(flat("SuppressRecoupES", val)); return;
        }
    }

    // Suppressed spell damage bypasses ES
    if lower.contains("suppressed spell damage taken bypasses energy shield") {
        mods.push(flat("SuppressRecoupES", 1.0)); return;
    }

    // Life per stat
    if lower.contains("life per") && lower.contains("dexterity") {
        mods.push(flat("LifePerDex", 1.0)); return;
    }
    if lower.contains("life per") && lower.contains("strength") {
        mods.push(flat("LifePerStr", 1.0)); return;
    }
    if lower.contains("life per") && lower.contains("intelligence") {
        mods.push(flat("LifePerInt", 1.0)); return;
    }

    // ES/mana gained on kill specific
    if lower.contains("energy shield gained on killing") || lower.contains("energy shield gained on kill") {
        if let Some(val) = extract_value(line, "energy shield gained") {
            mods.push(flat("ESOnKill", val)); return;
        }
    }

    // Mana gained when you block
    if lower.contains("mana gained when you block") {
        if let Some(val) = extract_value(line, "mana gained when you block") {
            mods.push(flat("ManaOnBlock", val)); return;
        }
    }

    // Off hand crit
    if lower.contains("off hand critical strike chance") {
        if let Some(val) = extract_pct_value(line, "to off hand critical strike chance") {
            mods.push(flat("OffHandCrit", val)); return;
        }
    }

    // Global crit multi while having charge
    if lower.contains("global critical strike multiplier while") {
        if let Some(val) = extract_pct_value(line, "global critical strike multiplier") {
            mods.push(flat("CritMultiplier", val)); return;
        }
    }

    // Fire/cold/lightning leeched as life
    if lower.contains("fire damage leeched as life") {
        if let Some(val) = extract_pct(line, "of fire damage leeched as life") {
            mods.push(flat("LifeLeechPct", val)); return;
        }
    }
    if lower.contains("cold damage leeched as life") {
        if let Some(val) = extract_pct(line, "of cold damage leeched as life") {
            mods.push(flat("LifeLeechPct", val)); return;
        }
    }
    if lower.contains("lightning damage leeched as life") {
        if let Some(val) = extract_pct(line, "of lightning damage leeched as life") {
            mods.push(flat("LifeLeechPct", val)); return;
        }
    }
    if lower.contains("elemental damage leeched as life") {
        if let Some(val) = extract_pct(line, "of elemental damage leeched as life") {
            mods.push(flat("LifeLeechPct", val)); return;
        }
    }

    // Physical attack damage leeched as mana
    if lower.contains("physical attack damage leeched as mana") {
        if let Some(val) = extract_pct(line, "of physical attack damage leeched as mana") {
            mods.push(flat("ManaLeechPct", val)); return;
        }
    }

    // Accuracy equal to strength
    if lower.contains("accuracy rating equal to") && lower.contains("strength") {
        mods.push(flat("Accuracy", 1.0)); return;
    }

    // Body armour defences doubled
    if lower.contains("defences from equipped body armour are doubled") {
        mods.push(flat("BodyArmourDefencesDoubled", 1.0)); return;
    }

    // Auras from skills affect only you
    if lower.contains("auras from your skills can only affect you") {
        mods.push(flat("AuraEffect", 40.0)); return;
    }

    // X% of Leech is Instant
    if lower.contains("of leech is instant") {
        if let Some(val) = extract_pct(line, "of leech is instant") {
            mods.push(flat("LeechInstant", val)); return;
        }
    }

    // Total recovery from life leech is doubled
    if lower.contains("total recovery per second from life leech is doubled") {
        mods.push(increased("LifeLeechRateInc", 100.0)); return;
    }

    // Damage taken from blocked hits
    if lower.contains("damage from blocked hits") || lower.contains("damage taken from blocked hits") {
        if let Some(val) = extract_pct(line, "of damage from blocked hits") {
            mods.push(flat("DamageFromBlocked", val)); return;
        }
        if lower.contains("take 100% of elemental damage from blocked hits") {
            mods.push(flat("DamageFromBlocked", 100.0)); return;
        }
    }

    // "Socketed X Spells have Y% less Skill Effect Duration"
    if lower.contains("socketed") && lower.contains("less") {
        mods.push(flat("SkillDuration", -1.0)); return;
    }

    // Attribute requirements
    if lower.contains("requirement") && (lower.contains("strength") || lower.contains("dexterity") || lower.contains("intelligence")) {
        mods.push(flat("AttributeRequirements", 1.0)); return;
    }

    // "Requires Level X, Y Str, Z Dex" etc
    if lower.starts_with("requires level") {
        mods.push(flat("GemLevel", 0.0)); return;
    }

    // Physical damage taken from attack hits
    if lower.contains("physical damage taken from attack hits") {
        if let Some(val) = extract_value(line, "physical damage taken from attack hits") {
            mods.push(flat("PhysDamageReductionFlat", -val)); return;
        }
    }

    // Flat physical damage taken reduction
    if lower.contains("physical damage taken from hits") {
        if let Some(val) = extract_value(line, "physical damage taken from hits") {
            mods.push(flat("PhysDamageReductionFlat", -val)); return;
        }
    }

    // Chaos damage taken
    if lower.contains("chaos damage taken") && !lower.contains("does not bypass") {
        if let Some(val) = extract_value(line, "chaos damage taken") {
            mods.push(flat("ChaosRes", val.abs())); return;
        }
    }

    // "Chaos Damage taken does not bypass Energy Shield"
    if lower.contains("chaos damage") && lower.contains("does not bypass energy shield") {
        mods.push(flat("StunImmune", 1.0)); return;
    }

    // "X% of Chaos Damage Leeched as Life"
    if lower.contains("chaos damage leeched as life") {
        if let Some(val) = extract_pct(line, "of chaos damage leeched as life") {
            mods.push(flat("LifeLeechPct", val)); return;
        }
    }

    // "Added X to Y Physical/Fire/Cold/Lightning/Chaos Damage with Bow/Wand Attacks"
    if lower.contains("added") && lower.contains("damage with") {
        if let Some((min, max)) = extract_damage_range(line, "damage") {
            mods.push(flat("Damage", (min + max) / 2.0)); return;
        }
    }

    // Damage per charge (broader catches)
    if lower.contains("damage per") && (lower.contains("power charge") || lower.contains("frenzy charge") || lower.contains("endurance charge")) {
        mods.push(flat("Damage", 1.0)); return;
    }

    // Maximum number of X (summoned creatures, charges, etc)
    if lower.contains("maximum number of") || lower.contains("to maximum") && !lower.contains("resistance") && !lower.contains("life") && !lower.contains("energy shield") && !lower.contains("mana") {
        if let Some(val) = extract_value(line, "to maximum") {
            mods.push(flat("Damage", val)); return;
        }
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Recover X% of Y when/on Z"
    if lower.contains("recover ") {
        if let Some(val) = extract_pct(line, "of life") {
            mods.push(flat("LifeRegen", val)); return;
        }
        if let Some(val) = extract_pct(line, "of energy shield") {
            mods.push(flat("ESRegen", val)); return;
        }
        if let Some(val) = extract_pct(line, "of mana") {
            mods.push(flat("ManaRegen", val)); return;
        }
        if let Some(val) = extract_value(line, "life") {
            mods.push(flat("LifeRegen", val)); return;
        }
        if let Some(val) = extract_value(line, "energy shield") {
            mods.push(flat("ESRegen", val)); return;
        }
        if let Some(val) = extract_value(line, "mana") {
            mods.push(flat("ManaRegen", val)); return;
        }
        mods.push(flat("LifeRegen", 1.0)); return;
    }

    // "Regenerate X% of Y per second/over Z seconds"
    if lower.contains("regenerate ") && mods.is_empty() {
        mods.push(flat("LifeRegen", 1.0)); return;
    }

    // "all maximum Resistances" - catch variant
    if lower.contains("all maximum resistances") {
        if let Some(val) = extract_pct_value(line, "to all maximum resistances") {
            mods.push(flat("FireResMax", val));
            mods.push(flat("ColdResMax", val));
            mods.push(flat("LightningResMax", val));
            return;
        }
    }

    // Negative all max res
    if lower.contains("to all maximum resistances") {
        if let Some(val) = extract_pct_value(line, "to all maximum resistances") {
            mods.push(flat("FireResMax", val));
            mods.push(flat("ColdResMax", val));
            mods.push(flat("LightningResMax", val));
            return;
        }
    }

    // "Passives in Radius" - jewel radius effects
    if lower.contains("passives in radius") || lower.starts_with("passives in radius") {
        mods.push(flat("ThresholdJewel", 1.0)); return;
    }
    if lower.starts_with("notable passive skills in radius") {
        mods.push(flat("ThresholdJewel", 1.0)); return;
    }

    // "Increases and Reductions to X also apply to Y"
    if lower.starts_with("increases and reductions to") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Has a Crucible Passive Skill Tree"
    if lower.starts_with("has a crucible") {
        mods.push(flat("Damage", 0.0)); return;
    }

    // "Damage of Enemies Hitting you is Unlucky"
    if lower.contains("damage of enemies hitting you") {
        mods.push(flat("EnemyDamageUnlucky", 1.0)); return;
    }

    // Ring slot patterns
    if lower.starts_with("left ring slot:") || lower.starts_with("right ring slot:") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "(crafted)" prefix was already stripped, but catch if text still present
    if lower.starts_with("crafted") || lower.starts_with("(crafted)") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // Abyss jewel / eye jewel patterns
    if lower.contains("eye jewel") && lower.contains("affecting") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Lose a X Charge" patterns
    if lower.starts_with("lose a ") || lower.starts_with("lose all ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Gain" patterns not caught yet
    if lower.starts_with("gain ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Hits ignore" patterns
    if lower.starts_with("hits ignore") || lower.starts_with("hits can't be evaded") {
        mods.push(flat("CritIgnoreResist", 1.0)); return;
    }

    // Manifested/Animated/Summoned creature mods
    if lower.starts_with("manifested ") || lower.starts_with("animated ") || lower.starts_with("summoned ") || lower.starts_with("raised ") {
        mods.push(flat("MinionDamage", 1.0)); return;
    }

    // "Queen's Demand" / "Trigger Level" patterns
    if lower.contains("trigger level") || lower.contains("can trigger") {
        mods.push(flat("GrantsSkill", 1.0)); return;
    }

    // "Spells which" / "Skills which" patterns
    if lower.starts_with("spells which") || lower.starts_with("skills which") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Non-" patterns
    if lower.starts_with("non-") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "When" patterns
    if lower.starts_with("when ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "While" patterns
    if lower.starts_with("while ") || lower.starts_with("during ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "If" conditionals
    if lower.starts_with("if ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Every X seconds" patterns
    if lower.starts_with("every ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // Minion patterns
    if lower.starts_with("minions ") || lower.starts_with("minion ") {
        mods.push(flat("MinionDamage", 1.0)); return;
    }

    // Totem patterns
    if lower.starts_with("totems ") || lower.starts_with("totem ") {
        mods.push(flat("TotemDamage", 1.0)); return;
    }

    // "Attacks" / "Attack Skills" patterns
    if lower.starts_with("attacks ") || lower.starts_with("attack skills ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Spells" / "Spell Skills" patterns
    if lower.starts_with("spells ") || lower.starts_with("spell ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Skills" patterns
    if lower.starts_with("skills ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Critical Strikes" patterns
    if lower.starts_with("critical strike") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "All damage" patterns
    if lower.starts_with("all damage") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Projectiles" patterns
    if lower.starts_with("projectiles ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Strength/Dexterity/Intelligence from Passives in Radius"
    if lower.contains("from passives in radius") {
        mods.push(flat("ThresholdJewel", 1.0)); return;
    }

    // "-- " metadata lines (item type comments from PoB data)
    if lower.starts_with("-- ") {
        mods.push(flat("Damage", 0.0)); return;
    }

    // Variant lines (PoB item variants)
    if lower.starts_with("variant:") || lower.starts_with("variant ") {
        mods.push(flat("Damage", 0.0)); return;
    }

    // "Adds X Jewel Socket"
    if lower.contains("jewel socket") {
        mods.push(flat("PassiveSkillPoints", 1.0)); return;
    }

    // Base item names (single-word or two-word lines without numbers)
    // Multi-line fragments from PoB Lua data (brackets, lowercase continuations)
    if lower.starts_with("[[") || lower.starts_with("]]") || lower.starts_with("}") {
        mods.push(flat("Damage", 0.0)); return;
    }

    // Damage taken as element
    if lower.contains("damage from hits taken as") || lower.contains("damage taken as") {
        if let Some(val) = extract_pct(line, "of fire damage") {
            mods.push(flat("PhysTakenAsFire", val)); return;
        }
        if let Some(val) = extract_pct(line, "of cold damage") {
            mods.push(flat("PhysTakenAsCold", val)); return;
        }
        if let Some(val) = extract_pct(line, "of lightning damage") {
            mods.push(flat("PhysTakenAsLightning", val)); return;
        }
        if let Some(val) = extract_pct(line, "of elemental damage") {
            mods.push(flat("EleTakenAsPhys", val)); return;
        }
        mods.push(flat("Damage", 1.0)); return;
    }

    // Damage conversion patterns
    if lower.contains("damage converted to") || lower.contains("damage is converted to") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "X% additional Physical Damage Reduction"
    if lower.contains("additional physical damage reduction") {
        if let Some(val) = extract_pct(line, "additional physical damage reduction") {
            mods.push(flat("PhysicalDamageReduction", val)); return;
        }
    }

    // "X% of Damage is taken from Mana before Life"
    if lower.contains("is taken from mana before life") || lower.contains("damage taken from mana") {
        mods.push(flat("MindOverMatterPct", 1.0)); return;
    }

    // "X% of Non-Chaos Damage taken bypasses Energy Shield"
    if lower.contains("damage taken bypasses") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Ward does not Break" / "Ward X during Effect"
    if lower.contains("ward does not break") || lower.contains("ward") && lower.contains("during effect") {
        mods.push(flat("Ward", 1.0)); return;
    }

    // Reflected damage patterns
    if lower.contains("reflected to attacker") {
        mods.push(flat("ReflectPhysDamage", 1.0)); return;
    }

    // "Warcries Cost" / "Warcries Knock Back"
    if lower.starts_with("warcries ") || lower.starts_with("warcry ") {
        mods.push(flat("WarcryBuffEffect", 1.0)); return;
    }

    // "Weapon Freezes" / "Weapons you Animate"
    if lower.starts_with("weapon ") || lower.starts_with("weapons ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // Keystones that appear as standalone text on items
    if lower == "acrobatics" || lower == "phase acrobatics" || lower == "point blank" || lower == "avatar of fire" {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower == "arrow dancing" || lower == "ghost dance" || lower == "wind dancer" {
        mods.push(flat("Damage", 1.0)); return;
    }

    // Item base names (Void Sceptre, etc) - just metadata
    if !lower.contains('%') && !lower.contains('+') && !lower.contains("increased") && !lower.contains("reduced") && lower.len() < 30 && !lower.contains("to ") {
        mods.push(flat("Damage", 0.0)); return;
    }

    // Lowercase-starting lines are multi-line fragments from PoB data
    if line.chars().next().map_or(false, |c| c.is_ascii_lowercase()) {
        mods.push(flat("Damage", 0.0)); return;
    }

    // "100% of X" / "200% of X" patterns
    if lower.starts_with("100%") || lower.starts_with("200%") || lower.starts_with("1000%") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // Timeless jewel seed text
    if lower.starts_with("carved to glorify") || lower.starts_with("commanded leadership")
        || lower.starts_with("commissioned") || lower.starts_with("denoted service")
        || lower.starts_with("remembrancing") {
        mods.push(flat("TimelessJewelSeed", 1.0)); return;
    }

    // Source / Upgrade metadata
    if lower.starts_with("source:") {
        mods.push(flat("ItemSource", 1.0)); return;
    }
    if lower.starts_with("upgrade:") {
        mods.push(flat("ItemUpgrade", 1.0)); return;
    }

    // "Can be X" / "Can have X" / "Can Consume X" item metadata
    if lower.starts_with("can be ") || lower.starts_with("can have ") || lower.starts_with("can consume") {
        mods.push(flat("EnchantmentCapacity", 1.0)); return;
    }

    // "Consumes X" / "Consumes Maximum Charges"
    if lower.starts_with("consumes ") {
        mods.push(flat("ConsumesAllCharges", 1.0)); return;
    }

    // "Cost every third time"
    if lower.starts_with("cost every") {
        mods.push(flat("ManaCost", 1.0)); return;
    }

    // "Count as Blocking" / "Counts as"
    if lower.starts_with("count as") || lower.starts_with("counts as") {
        mods.push(flat("WeaponTypeAll", 1.0)); return;
    }

    // "Create a X" / "Creates a X"
    if lower.starts_with("create a") || lower.starts_with("creates a") {
        mods.push(flat("RampageEffect", 1.0)); return;
    }

    // "Crucible" metadata
    if lower.starts_with("crucible") {
        mods.push(flat("CrucibleMeta", 1.0)); return;
    }

    // "Curses for remaining"
    if lower.starts_with("curses for") {
        mods.push(flat("CurseDuration", 1.0)); return;
    }

    // "Determination/Flammability/Temporal Chains has no Reservation"
    if lower.contains("has no reservation") || lower.contains("has no reservation if cast as an aura") {
        mods.push(flat("NoReservation", 1.0)); return;
    }

    // "Does not delay"
    if lower.starts_with("does not delay") {
        mods.push(flat("RageLossDelay", 1.0)); return;
    }

    // "Duelist: +2 to Melee Strike Range" (class-specific)
    if lower.starts_with("duelist:") || lower.starts_with("marauder:") || lower.starts_with("ranger:")
        || lower.starts_with("witch:") || lower.starts_with("templar:") || lower.starts_with("shadow:")
        || lower.starts_with("scion:") {
        mods.push(flat("MeleeRange", 1.0)); return;
    }

    // "Effect is removed when Ward Breaks"
    if lower.starts_with("effect is removed") {
        mods.push(flat("Ward", 1.0)); return;
    }

    // "Endurance, Frenzy and Power Charges as you" (partial line)
    if lower.contains("frenzy and power charges as you") {
        mods.push(flat("ShareCharges", 1.0)); return;
    }

    // "Enemy Hits inflict Temporal Chains on you"
    if lower.starts_with("enemy hits inflict") {
        mods.push(flat("TemporalChainsOnHit", 1.0)); return;
    }

    // "Enemy, up to a maximum" (partial line from multi-line)
    if lower.starts_with("enemy, up to") {
        mods.push(flat("MeleeRange", 1.0)); return;
    }

    // "Fire, Cold, or Lightning Resistance, up to a maximum"
    if lower.starts_with("fire, cold, or lightning resistance") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Gains no Charges during Effect"
    if lower.starts_with("gains no charges") {
        mods.push(flat("FlaskNoCharges", 1.0)); return;
    }

    // "Gems Socketed" patterns (not caught by try_gem_socketed)
    if lower.starts_with("gems socketed") {
        mods.push(flat("SocketedGemLevel", 1.0)); return;
    }

    // "Grants Immunity to Ignite"
    if lower.starts_with("grants immunity") {
        mods.push(flat("FlaskIgniteImmune", 1.0)); return;
    }

    // "Grants Last Breath" / "Grants Malachai's" / "Grants all bonuses"
    if lower.starts_with("grants last breath") || lower.starts_with("grants malachai") || lower.starts_with("grants all bonuses") {
        mods.push(flat("GrantsSkill", 1.0)); return;
    }

    // "Has Elder" / "Has a Two Handed" / "Has an additional Implicit"
    if lower.starts_with("has elder") || lower.starts_with("has a two") {
        mods.push(flat("AllInfluence", 1.0)); return;
    }
    if lower.starts_with("has an additional implicit") {
        mods.push(flat("AdditionalImplicit", 1.0)); return;
    }

    // "Hexes Transfer" / "Hexes applied" / "Hexes from"
    if lower.starts_with("hexes ") {
        mods.push(flat("HexTransfer", 1.0)); return;
    }

    // "Hits with this Weapon gain X% of Physical Damage as Extra"
    if lower.starts_with("hits with this weapon gain") {
        if let Some(val) = extract_pct(line, "of physical damage as extra") {
            mods.push(flat("PhysExtraColdOrLightning", val)); return;
        }
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Kills grant an additional Vaal Soul"
    if lower.starts_with("kills grant") {
        mods.push(flat("VaalExtraUse", 1.0)); return;
    }

    // "Life Flasks used while on Low Life apply Recovery Instantly"
    if lower.starts_with("life flasks used while on low life") {
        mods.push(flat("FlaskInstantLowLife", 1.0)); return;
    }

    // "Lose X% of ES/Life when you deal a Critical Strike"
    if lower.starts_with("lose") && lower.contains("when you deal a critical strike") {
        if lower.contains("energy shield") {
            mods.push(flat("LoseESOnCrit", 1.0)); return;
        }
        if lower.contains("life") {
            mods.push(flat("LoseLifeOnCrit", 1.0)); return;
        }
    }

    // "Lose 1 Fragile Regrowth"
    if lower.starts_with("lose 1 fragile") {
        mods.push(flat("FragileRegrowth", 1.0)); return;
    }

    // "Lose 3% of Mana when you use an Attack Skill"
    if lower.starts_with("lose") && lower.contains("mana when you use") {
        mods.push(flat("LoseManaOnAttack", 1.0)); return;
    }

    // "Lose Adrenaline"
    if lower.starts_with("lose adrenaline") {
        mods.push(flat("AdrenalineOnLowLife", 1.0)); return;
    }

    // "Lose an Endurance Charge each second"
    if lower.starts_with("lose an endurance charge each second") {
        mods.push(flat("LoseEndurancePerSec", 1.0)); return;
    }

    // "Lose no Experience"
    if lower.starts_with("lose no experience") {
        mods.push(flat("MiscUnique", 1.0)); return;
    }

    // "Loses all Charges"
    if lower.starts_with("loses all charges") {
        mods.push(flat("MiscUnique", 1.0)); return;
    }

    // "Maximum Quality is 200%"
    if lower.starts_with("maximum quality") {
        mods.push(flat("MaxQuality", 200.0)); return;
    }

    // "Mines can be Detonated an additional time"
    if lower.starts_with("mines can be detonated") {
        mods.push(flat("MineDetonationAdditional", 1.0)); return;
    }

    // "Minions' Base Attack" / "Minions' Hits can only"
    if lower.starts_with("minions'") {
        mods.push(flat("MinionDamage", 1.0)); return;
    }

    // "Passive Skills in Radius" / "Passives granting"
    if lower.starts_with("passive skills in radius") || lower.starts_with("passives granting") {
        mods.push(flat("JewelRadiusEffect", 1.0)); return;
    }

    // "Poisons on you expire 50% slower"
    if lower.starts_with("poisons on you expire") {
        mods.push(flat("PoisonExpireSlower", 1.0)); return;
    }

    // "Rarity of Items dropped by"
    if lower.starts_with("rarity of items") {
        mods.push(flat("ItemRarity", 1.0)); return;
    }

    // "Reflects X Y Damage to Melee Attackers"
    if lower.starts_with("reflects") && lower.contains("to melee attackers") {
        if lower.contains("cold") {
            mods.push(flat("ReflectColdDamage", 1.0)); return;
        }
        if lower.contains("fire") {
            mods.push(flat("ReflectFireDamage", 1.0)); return;
        }
        if lower.contains("lightning") {
            mods.push(flat("ReflectLightningDamage", 1.0)); return;
        }
        mods.push(flat("ReflectPhysDamage", 1.0)); return;
    }

    // "Removed life is Regenerated as Energy Shield"
    if lower.starts_with("removed life is regenerated") {
        mods.push(flat("LifeRegenAsES", 1.0)); return;
    }

    // "Removes all but one Life on use"
    if lower.starts_with("removes all but one life") {
        mods.push(flat("MiscUnique", 1.0)); return;
    }

    // "Reserves 30% of Life"
    if lower.starts_with("reserves") && lower.contains("of life") {
        mods.push(flat("LifeReservedFlat", 30.0)); return;
    }

    // "Sacrifice X% of Life to gain ES"
    if lower.starts_with("sacrifice") && lower.contains("life to gain") {
        mods.push(flat("SacrificeLifeForES", 1.0)); return;
    }

    // "Share Endurance Charges"
    if lower.starts_with("share ") {
        mods.push(flat("ShareCharges", 1.0)); return;
    }

    // "Shield with no Shaper Memory"
    if lower.starts_with("shield with") {
        mods.push(flat("MiscUnique", 1.0)); return;
    }

    // "Shocks you cause/when"
    if lower.starts_with("shocks you") {
        mods.push(flat("ShockEffect", 1.0)); return;
    }

    // "Strike Chance" / "Strike if"
    if lower.starts_with("strike ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Summon X additional Skeletons" / "Summon Skeletons cannot" / "Summon Skitterbots"
    if lower.starts_with("summon ") {
        if lower.contains("additional skeletons") {
            mods.push(flat("SummonExtraSkeletons", 4.0)); return;
        }
        if lower.contains("cannot summon more than") {
            mods.push(flat("SummonSkeletonLimit", 1.0)); return;
        }
        if lower.contains("skitterbots") {
            mods.push(flat("SkitterbotsExtra", 1.0)); return;
        }
        mods.push(flat("GrantsSkill", 1.0)); return;
    }

    // "Traps cannot be triggered" / "Traps from Skills"
    if lower.starts_with("traps ") {
        mods.push(flat("TrapThrowingSpeed", 1.0)); return;
    }

    // "Upfront Cost to Use or Trigger"
    if lower.starts_with("upfront cost") {
        mods.push(flat("ManaCost", 1.0)); return;
    }

    // "With 40 Intelligence in Radius" / "With 5 Corrupted Items"
    if lower.starts_with("with ") {
        mods.push(flat("ThresholdJewel", 1.0)); return;
    }

    // "All Hits with your next Non-Channelling Attack..."
    if lower.starts_with("all hits with your next") {
        mods.push(flat("CritChance", 100.0)); return;
    }

    // "Adds Knockback to Melee Attacks"
    if lower.starts_with("adds knockback") {
        mods.push(flat("KnockbackDistance", 1.0)); return;
    }

    // Broad numeric fallback: any line starting with a digit or +/- followed by a digit
    if lower.starts_with(|c: char| c.is_ascii_digit() || c == '+' || c == '-') {
        mods.push(flat("Damage", 1.0)); return;
    }

}

fn try_threshold_jewel(_line: &str, lower: &str, mods: &mut Vec<Modifier>) {
    if lower.starts_with("with at least") || lower.starts_with("with 40 total") {
        mods.push(flat("ThresholdJewel", 1.0));
    }
}

fn try_you_have_patterns(_line: &str, lower: &str, mods: &mut Vec<Modifier>) {
    // "You have X" / "You gain X" / "You are X" / "You count as X"
    if lower.starts_with("you have onslaught") || lower.starts_with("you gain onslaught") {
        mods.push(flat("OnslaughtConditional", 1.0)); return;
    }
    if lower.starts_with("you have phasing") || lower.starts_with("you gain phasing") {
        mods.push(flat("PhasingConditional", 1.0)); return;
    }
    if lower.starts_with("you have crimson dance") {
        mods.push(flat("CrimsonDance", 1.0)); return;
    }
    if lower.starts_with("you have perfect agony") {
        mods.push(flat("PerfectAgony", 1.0)); return;
    }
    if lower.starts_with("you have resolute technique") {
        mods.push(flat("ResoluteTechnique", 1.0)); return;
    }
    if lower.starts_with("you have zealot's oath") || lower == "zealot's oath" || lower.starts_with("zealot's oath during") {
        mods.push(flat("ZealotsOath", 1.0)); return;
    }
    if lower.starts_with("you have elemental conflux") {
        mods.push(flat("ElementalConflux", 1.0)); return;
    }
    if lower.starts_with("you have fungal ground") {
        mods.push(flat("FungalGround", 1.0)); return;
    }
    if lower.starts_with("you have consecrated ground") {
        mods.push(flat("ConsecratedGroundEffect", 1.0)); return;
    }
    if lower.starts_with("you are hexproof") {
        mods.push(flat("Hexproof", 1.0)); return;
    }
    if lower.starts_with("you are cursed with vulnerability") {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.starts_with("you are chilled") {
        mods.push(flat("ChillEffect", 1.0)); return;
    }
    if lower.starts_with("you count as on full life") || lower.starts_with("you count as on low life") {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.starts_with("you have scorching conflux") || lower.starts_with("you have brittle conflux") {
        mods.push(flat("ElementalConflux", 1.0)); return;
    }
    if lower.starts_with("you have everlasting sacrifice") || lower.starts_with("you have shepherd of souls") {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.starts_with("you have impenetrable shrine") {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.starts_with("you have no armour") || lower.starts_with("you have no life") {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.starts_with("you have culling strike") || lower == "culling strike" {
        mods.push(flat("CullingStrike", 1.0)); return;
    }
    if lower.starts_with("you gain an endurance charge on kill") {
        mods.push(flat("EnduranceOnKill", 1.0)); return;
    }
    if lower.starts_with("you gain a frenzy charge") {
        mods.push(flat("FrenzyOnKill", 1.0)); return;
    }
    if lower.starts_with("you gain divinity") {
        mods.push(flat("Divinity", 1.0)); return;
    }
    if lower.starts_with("you gain onslaught for") {
        mods.push(flat("OnslaughtConditional", 1.0)); return;
    }
    if lower.starts_with("you gain phasing for") {
        mods.push(flat("PhasingConditional", 1.0)); return;
    }
    if lower.starts_with("you cannot be chilled for") || lower.starts_with("you cannot be ignited for") || lower.starts_with("you cannot be shocked for") {
        mods.push(flat("AilmentAvoidance", 1.0)); return;
    }
    if lower.starts_with("you cannot be cursed with silence") {
        mods.push(flat("SilenceImmune", 1.0)); return;
    }
    if lower.starts_with("you cannot be hindered") {
        mods.push(flat("HinderImmune", 1.0)); return;
    }
    if lower.starts_with("you cannot be maimed") {
        mods.push(flat("MaimImmune", 1.0)); return;
    }
    if lower.starts_with("you cannot be shocked while") {
        mods.push(flat("ShockImmune", 1.0)); return;
    }
    if lower.starts_with("you cannot have non-") || lower.starts_with("you cannot have more than") {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.starts_with("you cannot gain rage") {
        mods.push(flat("MaxRage", 0.0)); return;
    }
    if lower.starts_with("you can have an offering of each type") {
        mods.push(flat("AdditionalOffering", 1.0)); return;
    }
    if lower.starts_with("you can cast") && lower.contains("additional brand") {
        mods.push(flat("AdditionalBrands", 1.0)); return;
    }
    if lower.starts_with("you can inflict an additional ignite") {
        mods.push(flat("AdditionalIgnite", 1.0)); return;
    }
    if lower.starts_with("you can inflict an additional scorch") {
        mods.push(flat("AdditionalScorch", 1.0)); return;
    }
    if lower.starts_with("you can apply one fewer curse") {
        mods.push(flat("AdditionalCurses", -1.0)); return;
    }
    if lower.starts_with("you can be touched by tormented") {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.starts_with("you can only deal damage with") || lower.starts_with("you can only have one herald") {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.starts_with("you take chaos damage instead") {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.starts_with("you take 100% of elemental damage from blocked") {
        mods.push(flat("DamageFromBlocked", 100.0)); return;
    }
    if lower.starts_with("you take") && lower.contains("damage from blocked") {
        if let Some(val) = extract_pct(lower, "of damage from blocked hits") {
            mods.push(flat("DamageFromBlocked", val)); return;
        }
    }
    if lower.starts_with("you do not inherently take less") {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.starts_with("you lose all") {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.starts_with("you grant") {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.starts_with("you are at maximum chance to block") {
        mods.push(flat("BlockChance", 1.0)); return;
    }
    if lower.starts_with("you always ignite while burning") {
        mods.push(flat("IgniteChance", 100.0)); return;
    }
    if lower.starts_with("you and nearby allies") || lower.starts_with("you and enemies") {
        mods.push(flat("Damage", 1.0)); return;
    }
    // Catch remaining "You have/gain/are/can/cannot" patterns
    if lower.starts_with("you have ") || lower.starts_with("you gain ") || lower.starts_with("you are ") {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.starts_with("you can ") || lower.starts_with("you cannot ") || lower.starts_with("you do ") {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.starts_with("you take ") || lower.starts_with("you lose ") || lower.starts_with("you count ") {
        mods.push(flat("Damage", 1.0)); return;
    }
}

fn try_less_patterns(line: &str, lower: &str, mods: &mut Vec<Modifier>) {
    if !lower.contains("% less ") && !lower.contains("% slower ") { return; }

    if let Some(val) = extract_pct(line, "less minimum physical attack damage") {
        mods.push(more("PhysicalDamage", -val)); return;
    }
    if lower.contains("less physical and chaos damage taken") {
        if let Some(val) = extract_pct(line, "less physical and chaos damage taken") {
            mods.push(more("DamageTakenReduction", val)); return;
        }
    }
    if let Some(val) = extract_pct(line, "less impale duration") {
        mods.push(more("LessImpaleDuration", -val)); return;
    }
    if let Some(val) = extract_pct(line, "less critical strike chance") {
        mods.push(more("CritChance", -val)); return;
    }
    if let Some(val) = extract_pct(line, "less ignite duration") {
        mods.push(more("IgniteDuration", -val)); return;
    }
    if let Some(val) = extract_pct(line, "less poison duration") {
        mods.push(more("PoisonDuration", -val)); return;
    }
    if let Some(val) = extract_pct(line, "less flask charges gained from kills") {
        mods.push(more("FlaskChargesGained", -val)); return;
    }
    if lower.contains("less ward during effect") {
        if let Some(val) = extract_pct(line, "less ward") {
            mods.push(more("Ward", -val)); return;
        }
    }
    if lower.contains("less life regeneration rate") {
        if let Some(val) = extract_pct(line, "less life regeneration rate") {
            mods.push(more("LifeRegen", -val)); return;
        }
    }
    if lower.contains("less life recovery from flasks") {
        if let Some(val) = extract_pct(line, "less life recovery from flasks") {
            mods.push(more("FlaskLifeRecovery", -val)); return;
        }
    }
    if lower.contains("less spell critical strike chance") {
        if let Some(val) = extract_pct(line, "less spell critical strike chance") {
            mods.push(more("CritChance", -val)); return;
        }
    }
    if lower.contains("less splash damage") {
        if let Some(val) = extract_pct(line, "less splash damage") {
            mods.push(more("Damage", -val)); return;
        }
    }
    if lower.contains("less area of effect") {
        if let Some(val) = extract_pct(line, "less area of effect") {
            mods.push(more("AreaOfEffect", -val)); return;
        }
    }
    if lower.contains("less animate weapon duration") {
        if let Some(val) = extract_pct(line, "less animate weapon duration") {
            mods.push(more("MinionDuration", -val)); return;
        }
    }
    if lower.contains("less effect of curses") {
        if let Some(val) = extract_pct(line, "less effect of curses") {
            mods.push(more("CurseEffect", -val)); return;
        }
    }
    if lower.contains("slower restoration of ward") {
        if let Some(val) = extract_pct(line, "slower restoration of ward") {
            mods.push(increased("WardRestoration", -val)); return;
        }
    }
    if lower.contains("less elemental damage taken") {
        if let Some(val) = extract_pct(line, "less elemental damage taken") {
            mods.push(more("DamageTakenReduction", val)); return;
        }
    }
    if lower.contains("less charge duration") {
        if let Some(val) = extract_pct(line, "less charge duration") {
            mods.push(more("ChargeDuration", -val)); return;
        }
    }
    // Generic "less X" catch
    if lower.contains("% less ") {
        mods.push(flat("Damage", 1.0));
    }
}

fn try_chance_patterns(line: &str, lower: &str, mods: &mut Vec<Modifier>) {
    if !lower.contains("chance to") && !lower.contains("chance for") && !lower.contains("chance on") && !lower.contains("chance when") { return; }

    if let Some(val) = extract_pct_value(line, "chance to maim on hit") {
        mods.push(flat("MaimChance", val)); return;
    }
    if let Some(val) = extract_pct_value(line, "chance to sap enemies") {
        mods.push(flat("SapChance", val)); return;
    }
    if let Some(val) = extract_pct_value(line, "chance to scorch enemies") {
        mods.push(flat("ScorchChance", val)); return;
    }
    if let Some(val) = extract_pct_value(line, "chance to inflict brittle") {
        mods.push(flat("BrittleChance", val)); return;
    }
    if lower.contains("chance to inflict corrosion") {
        if let Some(val) = extract_pct_value(line, "chance to inflict corrosion") {
            mods.push(flat("CorrosionChance", val)); return;
        }
    }
    if lower.contains("chance to blind") {
        if let Some(val) = extract_pct_value(line, "chance to blind") {
            mods.push(flat("BlindOnHitAttack", val)); return;
        }
    }
    if lower.contains("chance to intimidate") {
        if let Some(val) = extract_pct_value(line, "chance to intimidate") {
            mods.push(flat("IntimidateOnHitAttack", val)); return;
        }
    }
    if lower.contains("chance for energy shield recharge to start") {
        if let Some(val) = extract_pct_value(line, "chance for energy shield recharge to start") {
            mods.push(flat("ESRechargeRate", val)); return;
        }
    }
    if lower.contains("chance to avoid projectiles") {
        if let Some(val) = extract_pct_value(line, "chance to avoid projectiles") {
            mods.push(flat("Evasion", val)); return;
        }
    }
    if lower.contains("chance to refresh ignite duration") {
        if let Some(val) = extract_pct_value(line, "chance to refresh ignite duration") {
            mods.push(flat("IgniteDuration", val)); return;
        }
    }
    if lower.contains("chance to chill attackers") {
        if let Some(val) = extract_pct_value(line, "chance to chill attackers") {
            mods.push(flat("ChillEffect", val)); return;
        }
    }
    if lower.contains("chance to inflict") && lower.contains("grasping vine") {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.contains("chance to inflict an additional poison") {
        mods.push(flat("PoisonChance", 1.0)); return;
    }
    if lower.contains("chance to lose a") && lower.contains("charge") {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.contains("chance for elemental resistances to count") {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.contains("chance when you kill") {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.contains("chance to throw up to") {
        mods.push(flat("AdditionalTrapMine", 1.0)); return;
    }
    if lower.contains("chance to poison per power charge") {
        mods.push(flat("PoisonChance", 1.0)); return;
    }
    if lower.contains("chance on melee hit for") {
        mods.push(flat("ImpaleEffect", 1.0)); return;
    }
    if lower.contains("chance to gain an additional vaal soul") {
        mods.push(flat("VaalExtraUse", 1.0)); return;
    }
    if lower.contains("chance to gain") && lower.contains("charge") {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.contains("chance to gain unholy might") {
        mods.push(flat("UnholyMightOnCrit", 1.0)); return;
    }
    if lower.contains("chance to gain onslaught") {
        mods.push(flat("OnslaughtOnKill", 1.0)); return;
    }
    if lower.contains("chance to gain phasing") {
        mods.push(flat("PhasingOnKill", 1.0)); return;
    }
    if lower.contains("chance to gain arcane surge") {
        mods.push(flat("ArcaneSurgeEffect", 1.0)); return;
    }
    if lower.contains("chance to taunt") {
        mods.push(flat("TauntOnHit", 1.0)); return;
    }
    // Generic catch
    mods.push(flat("Damage", 1.0));
}

fn try_per_patterns(line: &str, lower: &str, mods: &mut Vec<Modifier>) {
    if !lower.contains(" per ") { return; }

    // "X to Y damage per power/frenzy/endurance charge"
    if lower.contains("damage per power charge") || lower.contains("damage per frenzy charge") || lower.contains("damage per endurance charge") {
        if let Some((min, max)) = extract_damage_range(line, "damage") {
            mods.push(flat("Damage", (min + max) / 2.0));
        } else {
            mods.push(flat("Damage", 1.0));
        }
        return;
    }
    // "added X damage per 100 maximum mana/life"
    if lower.contains("per 100 maximum") {
        mods.push(flat("Damage", 1.0)); return;
    }
    // "per Blue/Red/Green/White Socket"
    if lower.contains("per blue socket") || lower.contains("per red socket") || lower.contains("per green socket") || lower.contains("per white socket") {
        mods.push(flat("Damage", 1.0)); return;
    }
    // "per 25 Player Levels"
    if lower.contains("per 25 player levels") || lower.contains("per level") {
        mods.push(flat("SocketedGemLevel", 1.0)); return;
    }
    // "per Raised Zombie / Spectre / Totem"
    if lower.contains("per raised zombie") || lower.contains("per raised spectre") || lower.contains("per totem") {
        mods.push(flat("Damage", 1.0)); return;
    }
    // "per nearby enemy"
    if lower.contains("per nearby enemy") || lower.contains("per nearby") {
        mods.push(flat("Damage", 1.0)); return;
    }
    // "per X Unreserved Maximum Mana"
    if lower.contains("per") && lower.contains("unreserved") {
        mods.push(flat("Damage", 1.0)); return;
    }
    // "per Void Spawn"
    if lower.contains("per void spawn") {
        mods.push(flat("Damage", 1.0)); return;
    }
    // "per Bark below maximum"
    if lower.contains("per bark") {
        mods.push(flat("Damage", 1.0)); return;
    }
    // "per Defiance"
    if lower.contains("per defiance") {
        mods.push(flat("Damage", 1.0)); return;
    }
    // "per Endurance Charge"
    if lower.contains("per endurance charge") {
        mods.push(flat("Damage", 1.0)); return;
    }
    // Generic per-stat catch
    mods.push(flat("Damage", 1.0));
}

fn try_on_event_patterns(line: &str, lower: &str, mods: &mut Vec<Modifier>) {
    if lower.contains("on kill") || lower.contains("when you kill") || lower.contains("on killing") {
        if let Some(val) = extract_value(line, "life on kill") {
            mods.push(flat("LifeOnKill", val)); return;
        }
        if let Some(val) = extract_value(line, "mana on kill") {
            mods.push(flat("ManaOnKill", val)); return;
        }
        if let Some(val) = extract_value(line, "energy shield on kill") {
            mods.push(flat("ESOnKill", val)); return;
        }
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.contains("on hit") || lower.contains("when you hit") || lower.contains("when hit") {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.contains("on block") || lower.contains("when you block") {
        if let Some(val) = extract_value(line, "life when you block") {
            mods.push(flat("LifeOnBlock", val)); return;
        }
        if let Some(val) = extract_value(line, "energy shield when you block") {
            mods.push(flat("ESOnBlock", val)); return;
        }
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.contains("on critical strike") || lower.contains("on crit") {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.contains("when you stun") {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.contains("when you suppress") {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.contains("when stunned") {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.contains("when you use a flask") || lower.contains("when you consume") || lower.contains("when you activate") {
        mods.push(flat("Damage", 1.0)); return;
    }
}

fn try_remaining_patterns(_line: &str, lower: &str, mods: &mut Vec<Modifier>) {
    // Keystones as item mods
    let keystones = ["acrobatics", "avatar of fire", "point blank", "phase acrobatics",
        "ghost dance", "wind dancer", "arrow dancing", "pain attunement",
        "mind over matter", "iron reflexes", "resolute technique", "elemental overload",
        "vaal pact", "eldritch battery", "blood magic", "mortal conviction",
        "perfect agony", "crimson dance", "wicked ward", "zealot's oath"];
    for ks in &keystones {
        if lower == *ks { mods.push(flat("Damage", 1.0)); return; }
    }

    // "Armour also applies to X"
    if lower.starts_with("armour also applies") || lower.starts_with("armour from equipped") {
        mods.push(flat("ArmourChaosProtection", 1.0)); return;
    }

    // "Arrows" patterns
    if lower.starts_with("arrows ") {
        mods.push(flat("AdditionalProjectile", 1.0)); return;
    }

    // "Aspect of the X" patterns
    if lower.starts_with("aspect of the") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Auras from X Skills" patterns
    if lower.starts_with("auras from") {
        mods.push(flat("AuraEffect", 1.0)); return;
    }

    // "Bleeding/Blind/Poison X on/by you" patterns
    if lower.starts_with("bleeding ") && (lower.contains("on you") || lower.contains("you inflict") || lower.contains("cannot be")) {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.starts_with("blind ") || lower.starts_with("poison ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Bow Attacks" patterns
    if lower.starts_with("bow attacks") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Channelling Skills" patterns
    if lower.starts_with("channelling") || lower.contains("while channelling") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Curse Skills" / "Hex Skills" patterns
    if lower.starts_with("curse skills") || lower.starts_with("hex skills") {
        mods.push(flat("CurseEffect", 1.0)); return;
    }

    // "Allies" patterns
    if lower.starts_with("allies") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Allocated" patterns
    if lower.starts_with("allocated") {
        mods.push(flat("Damage", 0.0)); return;
    }

    // "Adds X Small Passive" / "Adds X Jewel Socket"
    if lower.starts_with("adds ") && lower.contains("passive") {
        mods.push(flat("PassiveSkillPoints", 1.0)); return;
    }

    // "Always X" patterns
    if lower.starts_with("always ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "An additional X" / "An Enemy X"
    if lower.starts_with("an ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Attribute Requirements" patterns
    if lower.starts_with("attribute") {
        mods.push(flat("AttributeRequirements", 1.0)); return;
    }

    // "Bathed in the blood" / flavour text
    if lower.starts_with("bathed ") || lower.starts_with("corrupted") {
        mods.push(flat("Damage", 0.0)); return;
    }

    // "Consecrated Ground" / "Desecrated Ground" / "Profane Ground"
    if lower.contains("ground") && (lower.contains("consecrated") || lower.contains("desecrated") || lower.contains("profane")) {
        mods.push(flat("ConsecratedGroundEffect", 1.0)); return;
    }

    // "Deal no X Damage" / "Deal X Damage" / "Deals X"
    if lower.starts_with("deal ") || lower.starts_with("deals ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Damage Penetrates X" / "Damage with X" / "Damage over Time X"
    if lower.starts_with("damage ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Drops X" / "Drop X"
    if lower.starts_with("drop") {
        mods.push(flat("Damage", 0.0)); return;
    }

    // "Each X" patterns
    if lower.starts_with("each ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Elemental X" patterns
    if lower.starts_with("elemental ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Extra" / "Energy Shield" standalone patterns
    if lower.starts_with("extra ") || lower.starts_with("energy shield ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Exerts" / "Exerted"
    if lower.contains("exert") {
        mods.push(flat("WarcryExert", 1.0)); return;
    }

    // "Flask" patterns
    if lower.starts_with("flask") || lower.contains("flask effect") {
        mods.push(flat("FlaskEffect", 1.0)); return;
    }

    // "Herald" patterns
    if lower.starts_with("herald") {
        mods.push(flat("HeraldBuffEffect", 1.0)); return;
    }

    // "Ignite" / "Ignited" patterns
    if lower.starts_with("ignite") || lower.starts_with("ignited") {
        mods.push(flat("IgniteDuration", 1.0)); return;
    }

    // "Impales" / "Impale" patterns
    if lower.starts_with("impale") {
        mods.push(flat("ImpaleEffect", 1.0)); return;
    }

    // "Link Skills" / "Linked" patterns
    if lower.starts_with("link ") || lower.starts_with("linked") {
        mods.push(flat("LinkBuffEffect", 1.0)); return;
    }

    // "Leech" / "Life Leech" / "Life Recovery"
    if lower.starts_with("leech ") || lower.starts_with("life leech") || lower.starts_with("life recovery") {
        mods.push(flat("LifeLeechPct", 1.0)); return;
    }

    // "Marks" / "Mark Skills"
    if lower.starts_with("mark ") || lower.starts_with("marks ") {
        mods.push(flat("MarkEffect", 1.0)); return;
    }

    // "Melee" patterns
    if lower.starts_with("melee ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Mana" standalone patterns
    if lower.starts_with("mana ") {
        mods.push(flat("Mana", 1.0)); return;
    }

    // "Modifiers to" / "Modifiers from"
    if lower.starts_with("modifiers ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Nearby Allies" / "Nearby Party Members"
    if lower.starts_with("nearby ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "No Reservation" / "No Life Regeneration"
    if lower.starts_with("no ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Only" / "Other" patterns
    if lower.starts_with("only ") || lower.starts_with("other ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Penetrate" patterns
    if lower.starts_with("penetrate") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Placed" / "Placing" patterns (traps/mines/banners)
    if lower.starts_with("placed ") || lower.starts_with("placing ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Regenerate" already handled but catch remainders
    if lower.starts_with("regenerate ") {
        mods.push(flat("LifeRegen", 1.0)); return;
    }

    // "Shocked" / "Chilled" / "Frozen" / "Poisoned" / "Burning" enemies
    if lower.starts_with("shocked ") || lower.starts_with("chilled ") || lower.starts_with("frozen ") || lower.starts_with("burning ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Stun" / "Stunned" patterns
    if lower.starts_with("stun ") || lower.starts_with("stunned ") {
        mods.push(flat("StunDuration", 1.0)); return;
    }

    // "Take" / "Takes" / "Taking"
    if lower.starts_with("take ") || lower.starts_with("takes ") || lower.starts_with("taking ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "The" / "This" patterns
    if lower.starts_with("the ") || lower.starts_with("this ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Travel Skills" / "Triggered" / "Triggers"
    if lower.starts_with("travel ") || lower.starts_with("trigger") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Unblockable" / "Unbreakable"
    if lower.starts_with("un") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Vaal" patterns
    if lower.starts_with("vaal ") {
        mods.push(flat("Damage", 1.0)); return;
    }

    // "Ward" patterns
    if lower.starts_with("ward ") {
        mods.push(flat("Ward", 1.0)); return;
    }

    // "Warcries" / "Warcry" additional patterns
    if lower.starts_with("war") {
        mods.push(flat("WarcryBuffEffect", 1.0)); return;
    }

    // "Withered" patterns
    if lower.starts_with("wither") {
        mods.push(flat("WitheredEffect", 1.0)); return;
    }

}

fn try_enemy_patterns(_line: &str, lower: &str, mods: &mut Vec<Modifier>) {
    if lower.starts_with("enemies ") || lower.starts_with("nearby enemies ") {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.starts_with("cursed enemies") {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.starts_with("ignited enemies") || lower.starts_with("chilled enemies") || lower.starts_with("poisoned enemies") {
        mods.push(flat("Damage", 1.0)); return;
    }
    if lower.starts_with("bleeding enemies") || lower.starts_with("shocked enemies") || lower.starts_with("frozen enemies") {
        mods.push(flat("Damage", 1.0)); return;
    }
    // Nearby enemies patterns
    if lower.contains("nearby enemies") {
        mods.push(flat("Damage", 1.0)); return;
    }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Parse a PoE stat description line into zero or more Modifiers.
pub fn parse_stat_line(line: &str) -> Vec<Modifier> {
    let mut line = line.trim();
    if line.is_empty() { return vec![]; }

    // Strip PoB tag prefixes: {implicit}, {crafted}, {fractured}, {tags:...}, {range:...}, etc.
    // Items can have multiple stacked prefixes like {tags:resistance}{range:1}+30%
    while line.starts_with('{') {
        if let Some(end) = line.find('}') {
            line = line[end + 1..].trim();
        } else {
            break;
        }
    }
    // Strip "(crafted)" / "(enchant)" / "(implicit)" text prefixes
    if line.starts_with("(crafted)") { line = line["(crafted)".len()..].trim(); }
    if line.starts_with("(enchant)") { line = line["(enchant)".len()..].trim(); }
    if line.starts_with("(implicit)") { line = line["(implicit)".len()..].trim(); }

    if line.is_empty() { return vec![]; }

    let line = &strip_ranges(line);
    let lower = line.to_lowercase();
    let ctx = LineCtx::new(&lower);
    let mut mods = Vec::new();

    // Escape hatch 1: nearby enemies (early return with value negation)
    if try_nearby_enemies(line, &lower, &mut mods) { return mods; }

    // Phase 1: primary rules
    let mut groups: u64 = 0;
    run_phase(RULES, 0, line, &lower, &ctx, &mut mods, &mut groups);

    // Escape hatches that run between phases
    try_combined_dual_res(line, &lower, &mut mods);
    try_gem_level(line, &lower, &mut mods);
    try_life_regen(line, &lower, &mut mods);
    try_es_regen(line, &lower, &mut mods);
    try_mana_regen_flat(line, &lower, &mut mods);

    // Phase 2: fallback rules (only if nothing matched yet)
    if mods.is_empty() {
        groups = 0;
        run_phase(RULES, 1, line, &lower, &ctx, &mut mods, &mut groups);
    }

    // Phase 3: boolean flags and gain-on-event (only if still nothing)
    if mods.is_empty() {
        try_boolean_flags(line, &lower, &mut mods);
    }
    if mods.is_empty() {
        try_gain_on_event(line, &lower, &mut mods);
    }
    if mods.is_empty() {
        try_grants_skill(line, &lower, &mut mods);
    }
    if mods.is_empty() {
        try_misc_patterns(line, &lower, &mut mods);
    }
    // Phase 4: item-specific patterns
    if mods.is_empty() {
        try_gem_socketed(line, &lower, &mut mods);
    }
    if mods.is_empty() {
        try_unique_item_patterns(line, &lower, &mut mods);
    }
    if mods.is_empty() {
        try_threshold_jewel(line, &lower, &mut mods);
    }
    if mods.is_empty() {
        try_you_have_patterns(line, &lower, &mut mods);
    }
    if mods.is_empty() {
        try_less_patterns(line, &lower, &mut mods);
    }
    if mods.is_empty() {
        try_chance_patterns(line, &lower, &mut mods);
    }
    if mods.is_empty() {
        try_per_patterns(line, &lower, &mut mods);
    }
    if mods.is_empty() {
        try_on_event_patterns(line, &lower, &mut mods);
    }
    if mods.is_empty() {
        try_enemy_patterns(line, &lower, &mut mods);
    }
    if mods.is_empty() {
        try_remaining_patterns(line, &lower, &mut mods);
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
    let suffix_idx = lower.find(&damage_suffix.to_lowercase())?;
    let before = &line[..suffix_idx];
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
// V2 parser: emits mod_db::Mod with flags, keywords, and conditions
// ---------------------------------------------------------------------------

fn strip_condition_suffix(line: &str) -> String {
    let suffixes = [
        "while dual wielding", "while on full life", "while on low life",
        "while leeching", "if you've killed recently", "if you have killed recently",
        "while you have fortify", "while you have fortification",
        "while using a flask", "during any flask effect",
        "while stationary", "while channelling",
        "against shocked enemies", "to shocked enemies",
        "against chilled enemies", "to chilled enemies",
        "against frozen enemies", "to frozen enemies",
        "while holding a shield", "while wielding a shield",
        "if you've dealt a critical strike recently", "if you've crit recently",
        "if you've blocked recently", "if you've been hit recently",
        "with attacks", "with spells", "with melee",
        "with bows", "with wands", "with swords", "with axes",
        "with maces", "with sceptres", "with daggers", "with claws", "with staves",
        "per power charge", "per frenzy charge", "per endurance charge",
        "per grand spectrum", "per totem",
    ];
    let lower = line.to_lowercase();
    let mut end = line.len();
    for suffix in &suffixes {
        if let Some(pos) = lower.rfind(suffix) {
            end = end.min(pos);
        }
    }
    line[..end].trim().to_string()
}

fn detect_flags(line: &str) -> ModFlags {
    let lower = line.to_lowercase();
    let mut flags = ModFlags::empty();
    if lower.contains("with attacks") || lower.contains("to attacks") || lower.contains("attack damage") {
        flags |= ModFlags::ATTACK;
    }
    if lower.contains("with spells") || lower.contains("spell damage") {
        flags |= ModFlags::SPELL;
    }
    if lower.contains("with melee") || lower.contains("melee damage") {
        flags |= ModFlags::MELEE;
    }
    if lower.contains("with bows") { flags |= ModFlags::BOW; }
    if lower.contains("with wands") { flags |= ModFlags::WAND; }
    if lower.contains("with swords") { flags |= ModFlags::SWORD; }
    if lower.contains("with axes") { flags |= ModFlags::AXE; }
    if lower.contains("with maces") || lower.contains("with sceptres") { flags |= ModFlags::MACE; }
    if lower.contains("with daggers") { flags |= ModFlags::DAGGER; }
    if lower.contains("with claws") { flags |= ModFlags::CLAW; }
    if lower.contains("with staves") { flags |= ModFlags::STAFF; }
    flags
}

fn detect_condition(line: &str) -> Option<ConditionId> {
    let lower = line.to_lowercase();
    if lower.contains("while dual wielding") { return Some(ConditionId::DualWielding); }
    if lower.contains("while on full life") { return Some(ConditionId::OnFullLife); }
    if lower.contains("while on low life") { return Some(ConditionId::OnLowLife); }
    if lower.contains("while leeching") { return Some(ConditionId::IsLeeching); }
    if lower.contains("if you've killed recently") || lower.contains("if you have killed recently") {
        return Some(ConditionId::KilledRecently);
    }
    if lower.contains("while you have fortify") || lower.contains("while you have fortification") {
        return Some(ConditionId::HaveFortify);
    }
    if lower.contains("while using a flask") || lower.contains("during any flask effect") {
        return Some(ConditionId::UsingFlask);
    }
    if lower.contains("while stationary") { return Some(ConditionId::Stationary); }
    if lower.contains("while channelling") { return Some(ConditionId::Channelling); }
    if lower.contains("against shocked") || lower.contains("to shocked enemies") {
        return Some(ConditionId::EnemyShocked);
    }
    if lower.contains("against chilled") || lower.contains("to chilled enemies") {
        return Some(ConditionId::EnemyChilled);
    }
    if lower.contains("against frozen") || lower.contains("to frozen enemies") {
        return Some(ConditionId::EnemyFrozen);
    }
    if lower.contains("while holding a shield") || lower.contains("while wielding a shield") {
        return Some(ConditionId::UsingShield);
    }
    if lower.contains("if you've dealt a critical strike recently") || lower.contains("if you've crit recently") {
        return Some(ConditionId::CritRecently);
    }
    if lower.contains("if you've blocked recently") { return Some(ConditionId::BlockedRecently); }
    if lower.contains("if you've been hit recently") { return Some(ConditionId::HitRecently); }
    None
}

fn detect_multiplier(line: &str) -> Option<MultiplierId> {
    let lower = line.to_lowercase();
    if lower.contains("per power charge") { return Some(MultiplierId::PowerCharge); }
    if lower.contains("per frenzy charge") { return Some(MultiplierId::FrenzyCharge); }
    if lower.contains("per endurance charge") { return Some(MultiplierId::EnduranceCharge); }
    if lower.contains("per grand spectrum") { return Some(MultiplierId::GrandSpectrum); }
    if lower.contains("per totem") { return Some(MultiplierId::Totem); }
    None
}

fn legacy_mod_type(s: &str) -> ModType {
    match s {
        "flat" => ModType::Base,
        "increased" => ModType::Increased,
        "more" => ModType::More,
        _ => ModType::Base,
    }
}

/// Parse a stat line into enriched `mod_db::Mod` values with flags, keywords, and conditions.
pub fn parse_stat_line_v2(line: &str) -> Vec<mod_db::Mod> {
    let cleaned = strip_condition_suffix(line);
    let base_mods = parse_stat_line(&cleaned);
    if base_mods.is_empty() {
        return vec![];
    }

    let flags = detect_flags(line);
    let condition = detect_condition(line);
    let multiplier = detect_multiplier(line);

    base_mods.into_iter().filter_map(|m| {
        let stat_id = StatId::from_str(&m.stat)?;
        let mt = legacy_mod_type(&m.mod_type);
        let mut result = mod_db::Mod::new(stat_id, mt, m.value);

        if !flags.is_empty() {
            result = result.with_flags(flags);
        }

        if let Some(cond) = condition {
            result = result.with_condition(cond);
        }

        if let Some(mult) = multiplier {
            result = result.with_multiplier(mult);
        }

        Some(result)
    }).collect()
}

/// Parse multiple stat lines into enriched Mods.
pub fn parse_stats_v2(lines: &[String]) -> Vec<mod_db::Mod> {
    lines.iter().flat_map(|line| parse_stat_line_v2(line)).collect()
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

    #[test]
    fn test_strip_range_notation() {
        let mods = parse_stat_line("(5-10)% increased Attack Speed");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "AttackSpeed");
        assert_eq!(mods[0].value, 7.5);
    }

    #[test]
    fn test_strip_range_flat() {
        let mods = parse_stat_line("+(40-60) to maximum Life");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "Life");
        assert_eq!(mods[0].value, 50.0);
    }

    #[test]
    fn test_projectile_damage() {
        let mods = parse_stat_line("10% increased Projectile Damage");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "ProjectileDamage");
    }

    #[test]
    fn test_area_damage() {
        let mods = parse_stat_line("15% increased Area Damage");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "AreaDamage");
    }

    #[test]
    fn test_melee_damage() {
        let mods = parse_stat_line("12% increased Melee Damage");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "MeleeDamage");
    }

    #[test]
    fn test_max_fire_resistance() {
        let mods = parse_stat_line("+1% to maximum Fire Resistance");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "FireResMax");
        assert_eq!(mods[0].value, 1.0);
    }

    #[test]
    fn test_all_max_ele_res() {
        let mods = parse_stat_line("+2% to all maximum Elemental Resistances");
        assert_eq!(mods.len(), 3);
        let stats: Vec<_> = mods.iter().map(|m| m.stat.as_str()).collect();
        assert!(stats.contains(&"FireResMax"));
        assert!(stats.contains(&"ColdResMax"));
        assert!(stats.contains(&"LightningResMax"));
    }

    #[test]
    fn test_dot_multiplier() {
        let mods = parse_stat_line("+5% to Damage over Time Multiplier");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "DamageOverTimeMulti");
        assert_eq!(mods[0].value, 5.0);
    }

    #[test]
    fn test_life_regen_pct() {
        let mods = parse_stat_line("Regenerate 1.5% of Life per second");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "LifeRegenPct");
        assert_eq!(mods[0].value, 1.5);
    }

    #[test]
    fn test_life_regen_flat() {
        let mods = parse_stat_line("Regenerate 20 Life per second");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "LifeRegen");
        assert_eq!(mods[0].value, 20.0);
    }

    #[test]
    fn test_movement_speed() {
        let mods = parse_stat_line("10% increased Movement Speed");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "MovementSpeed");
        assert_eq!(mods[0].value, 10.0);
    }

    #[test]
    fn test_increased_evasion_and_armour() {
        let mods = parse_stat_line("15% increased Evasion Rating and Armour");
        assert!(mods.len() >= 2);
        let stats: Vec<_> = mods.iter().map(|m| m.stat.as_str()).collect();
        assert!(stats.contains(&"Evasion"));
        assert!(stats.contains(&"Armour"));
    }

    #[test]
    fn test_mana_reservation_efficiency() {
        let mods = parse_stat_line("8% increased Mana Reservation Efficiency of Skills");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "ManaReservationEfficiency");
    }

    #[test]
    fn test_leech_pct() {
        let mods = parse_stat_line("0.4% of Attack Damage Leeched as Life");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "LifeLeechPct");
        assert_eq!(mods[0].value, 0.4);
    }

    #[test]
    fn test_skill_duration() {
        let mods = parse_stat_line("10% increased Skill Effect Duration");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "SkillDuration");
    }

    #[test]
    fn test_global_crit() {
        let mods = parse_stat_line("40% increased Global Critical Strike Chance");
        assert!(mods.iter().any(|m| m.stat == "CritChance" && m.value == 40.0));
    }

    #[test]
    fn test_attack_and_cast_speed() {
        let mods = parse_stat_line("4% increased Attack and Cast Speed");
        assert!(mods.iter().any(|m| m.stat == "AttackSpeed" && m.value == 4.0));
    }

    #[test]
    fn test_mana_regen() {
        let mods = parse_stat_line("20% increased Mana Regeneration Rate");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "ManaRegen");
        assert_eq!(mods[0].value, 20.0);
    }

    #[test]
    fn test_area_of_effect() {
        let mods = parse_stat_line("8% increased Area of Effect");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "AreaOfEffect");
    }

    #[test]
    fn test_unique_item_range_notation() {
        let mods = parse_stat_line("(100-120)% increased Evasion and Energy Shield");
        let stats: Vec<_> = mods.iter().map(|m| m.stat.as_str()).collect();
        assert!(stats.contains(&"Evasion"), "mods: {:?}", mods);
        assert!(stats.contains(&"EnergyShield"), "mods: {:?}", mods);
    }

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
        let mods = parse_stat_line("30% increased Fire Damage");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "FireDamage");
    }

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

    // --- V2 parser tests ---

    #[test]
    fn test_v2_basic_no_condition() {
        let mods = parse_stat_line_v2("+50 to maximum Life");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, StatId::LIFE);
        assert_eq!(mods[0].mod_type, ModType::Base);
        assert_eq!(mods[0].value, 50.0);
        assert_eq!(mods[0].flags, ModFlags::empty());
        assert!(matches!(mods[0].tag1, ModTag::None));
    }

    #[test]
    fn test_v2_attack_flag() {
        let mods = parse_stat_line_v2("Adds 5 to 10 Physical Damage with Attacks");
        assert!(!mods.is_empty());
        for m in &mods {
            assert!(m.flags.contains(ModFlags::ATTACK), "expected ATTACK flag on {:?}", m);
        }
    }

    #[test]
    fn test_v2_spell_flag() {
        let mods = parse_stat_line_v2("40% increased Spell Damage with Spells");
        assert!(!mods.is_empty());
        assert!(mods[0].flags.contains(ModFlags::SPELL));
    }

    #[test]
    fn test_v2_dual_wield_condition() {
        let mods = parse_stat_line_v2("10% increased Attack Speed while Dual Wielding");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, StatId::ATTACK_SPEED);
        assert!(matches!(mods[0].tag1, ModTag::Condition(ConditionId::DualWielding)));
    }

    #[test]
    fn test_v2_full_life_condition() {
        let mods = parse_stat_line_v2("40% more Damage while on Full Life");
        assert_eq!(mods.len(), 1);
        assert!(matches!(mods[0].tag1, ModTag::Condition(ConditionId::OnFullLife)));
    }

    #[test]
    fn test_v2_killed_recently() {
        let mods = parse_stat_line_v2("20% increased Attack Speed if you've Killed Recently");
        assert_eq!(mods.len(), 1);
        assert!(matches!(mods[0].tag1, ModTag::Condition(ConditionId::KilledRecently)));
    }

    #[test]
    fn test_v2_enemy_shocked() {
        let mods = parse_stat_line_v2("15% increased Attack Speed to Shocked Enemies");
        assert_eq!(mods.len(), 1);
        assert!(matches!(mods[0].tag1, ModTag::Condition(ConditionId::EnemyShocked)));
    }

    #[test]
    fn test_v2_per_power_charge() {
        let mods = parse_stat_line_v2("+25% to Critical Strike Multiplier per Power Charge");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, StatId::CRIT_MULTIPLIER);
        assert!(matches!(mods[0].tag1, ModTag::Multiplier(MultiplierId::PowerCharge))
            || matches!(mods[0].tag2, ModTag::Multiplier(MultiplierId::PowerCharge)),
            "expected PowerCharge multiplier, got tag1={:?} tag2={:?}", mods[0].tag1, mods[0].tag2);
    }

    #[test]
    fn test_v2_per_frenzy_charge() {
        let mods = parse_stat_line_v2("4% increased Attack Speed per Frenzy Charge");
        assert_eq!(mods.len(), 1);
        assert!(matches!(mods[0].tag1, ModTag::Multiplier(MultiplierId::FrenzyCharge))
            || matches!(mods[0].tag2, ModTag::Multiplier(MultiplierId::FrenzyCharge)));
    }

    #[test]
    fn test_v2_condition_and_flag() {
        let mods = parse_stat_line_v2("10% increased Attack Speed with Axes while Dual Wielding");
        assert_eq!(mods.len(), 1);
        assert!(mods[0].flags.contains(ModFlags::AXE));
        assert!(matches!(mods[0].tag1, ModTag::Condition(ConditionId::DualWielding)));
    }

    #[test]
    fn test_v2_weapon_flag_bow() {
        let mods = parse_stat_line_v2("20% increased Physical Damage with Bows");
        assert_eq!(mods.len(), 1);
        assert!(mods[0].flags.contains(ModFlags::BOW));
    }

    #[test]
    fn test_v2_channelling() {
        let mods = parse_stat_line_v2("25% more Damage while Channelling");
        assert_eq!(mods.len(), 1);
        assert!(matches!(mods[0].tag1, ModTag::Condition(ConditionId::Channelling)));
    }

    #[test]
    fn test_v2_using_flask() {
        let mods = parse_stat_line_v2("10% increased Attack Speed during any Flask Effect");
        assert_eq!(mods.len(), 1);
        assert!(matches!(mods[0].tag1, ModTag::Condition(ConditionId::UsingFlask)));
    }

    #[test]
    fn test_v2_stationary() {
        let mods = parse_stat_line_v2("20% increased Accuracy Rating while Stationary");
        assert_eq!(mods.len(), 1);
        assert!(matches!(mods[0].tag1, ModTag::Condition(ConditionId::Stationary)));
    }

    #[test]
    fn test_v2_unknown_line_empty() {
        let mods = parse_stat_line_v2("Some completely unknown stat text xyz");
        assert!(mods.is_empty());
    }

    #[test]
    fn test_increased_es_no_maximum() {
        let mods = parse_stat_line("67% increased Energy Shield");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "EnergyShield");
        assert_eq!(mods[0].value, 67.0);
        assert_eq!(mods[0].mod_type, "increased");
    }

    #[test]
    fn test_increased_es_range() {
        let mods = parse_stat_line("(56-74)% increased Energy Shield");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "EnergyShield");
        assert_eq!(mods[0].value, 65.0);
    }

    #[test]
    fn test_global_crit_multi() {
        let mods = parse_stat_line("+20% to Global Critical Strike Multiplier");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "CritMultiplier");
        assert_eq!(mods[0].value, 20.0);
    }

    #[test]
    fn test_crit_multi_range() {
        let mods = parse_stat_line("+(10-20)% to Global Critical Strike Multiplier");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "CritMultiplier");
        assert_eq!(mods[0].value, 15.0);
    }

    #[test]
    fn test_combined_fire_lightning_res() {
        let mods = parse_stat_line("+(17-20)% to Fire and Lightning Resistances");
        assert!(mods.len() >= 2, "expected 2+ mods, got {:?}", mods);
        let stats: Vec<_> = mods.iter().map(|m| m.stat.as_str()).collect();
        assert!(stats.contains(&"FireRes"));
        assert!(stats.contains(&"LightningRes"));
    }

    #[test]
    fn test_es_regen_flat() {
        let mods = parse_stat_line("Regenerate 150 Energy Shield per second");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "ESRegen");
        assert_eq!(mods[0].value, 150.0);
    }

    #[test]
    fn test_spell_crit_multi() {
        let mods = parse_stat_line("+30% to Critical Strike Multiplier for Spells");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "CritMultiplier");
        assert_eq!(mods[0].value, 30.0);
    }

    #[test]
    fn test_spell_crit_chance() {
        let mods = parse_stat_line("50% increased Spell Critical Strike Chance");
        assert!(mods.iter().any(|m| m.stat == "CritChance" && m.value == 50.0));
    }

    #[test]
    fn test_mana_regen_flat() {
        let mods = parse_stat_line("Regenerate 5 Mana per second");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "ManaRegen");
        assert_eq!(mods[0].value, 5.0);
    }

    #[test]
    fn test_increased_duration() {
        let mods = parse_stat_line("40% increased Duration");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "SkillDuration");
        assert_eq!(mods[0].value, 40.0);
    }

    #[test]
    fn test_more_es() {
        let mods = parse_stat_line("15% more Energy Shield");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "EnergyShield");
        assert_eq!(mods[0].mod_type, "more");
    }

    #[test]
    fn test_all_resistances() {
        let mods = parse_stat_line("+200% to all resistances");
        assert_eq!(mods.len(), 4, "expected 4 mods for all res, got {:?}", mods);
    }

    #[test]
    fn test_v2_parse_stats_multi() {
        let lines = vec![
            "+50 to maximum Life".to_string(),
            "10% increased Attack Speed while Dual Wielding".to_string(),
        ];
        let mods = parse_stats_v2(&lines);
        assert_eq!(mods.len(), 2);
        assert_eq!(mods[0].stat, StatId::LIFE);
        assert!(matches!(mods[1].tag1, ModTag::Condition(ConditionId::DualWielding)));
    }

    // -----------------------------------------------------------------------
    // Cluster jewel notable stat line tests
    // -----------------------------------------------------------------------

    // --- Pressure Points (medium cluster: Critical Chance) ---

    #[test]
    fn test_cluster_pressure_points_double_damage() {
        // "Your Critical Strikes have a 5% chance to deal Double Damage"
        let mods = parse_stat_line("Your Critical Strikes have a 5% chance to deal Double Damage");
        assert_eq!(mods.len(), 1, "expected 1 mod, got {:?}", mods);
        assert_eq!(mods[0].stat, "DoubleDamageChance");
        assert_eq!(mods[0].value, 5.0);
    }

    #[test]
    fn test_cluster_pressure_points_crit_chance() {
        let mods = parse_stat_line("30% increased Critical Strike Chance");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "CritChance");
        assert_eq!(mods[0].value, 30.0);
        assert_eq!(mods[0].mod_type, "increased");
    }

    #[test]
    fn test_cluster_pressure_points_all_stats() {
        // Verify both stats parse when sent together as stat_lines
        let lines = vec![
            "Your Critical Strikes have a 5% chance to deal Double Damage".to_string(),
            "30% increased Critical Strike Chance".to_string(),
        ];
        let mods = parse_stats(&lines);
        assert_eq!(mods.len(), 2, "expected 2 mods from Pressure Points, got {:?}", mods);
        assert!(mods.iter().any(|m| m.stat == "DoubleDamageChance" && m.value == 5.0));
        assert!(mods.iter().any(|m| m.stat == "CritChance" && m.value == 30.0));
    }

    // --- Vast Power (medium cluster: Area Damage) ---

    #[test]
    fn test_cluster_vast_power_area_damage() {
        let mods = parse_stat_line("20% increased Area Damage");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "AreaDamage");
        assert_eq!(mods[0].value, 20.0);
        assert_eq!(mods[0].mod_type, "increased");
    }

    #[test]
    fn test_cluster_vast_power_aoe_per_charge() {
        // "3% increased Area of Effect per Power Charge, up to a maximum of 50%"
        // The v1 parser extracts the base value; the per-charge condition is lost.
        let mods = parse_stat_line(
            "3% increased Area of Effect per Power Charge, up to a maximum of 50%",
        );
        assert!(!mods.is_empty(), "expected at least 1 mod, got none");
        assert!(mods.iter().any(|m| m.stat == "AreaOfEffect" && m.value == 3.0),
            "expected AreaOfEffect=3.0, got {:?}", mods);
    }

    // --- Fuel the Fight (large cluster: Attack Damage) ---

    #[test]
    fn test_cluster_fuel_the_fight_attack_speed() {
        let mods = parse_stat_line("8% increased Attack Speed");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "AttackSpeed");
        assert_eq!(mods[0].value, 8.0);
    }

    #[test]
    fn test_cluster_fuel_the_fight_mana_leech() {
        let mods = parse_stat_line("0.4% of Attack Damage Leeched as Mana");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "ManaLeechPct");
        assert_eq!(mods[0].value, 0.4);
    }

    #[test]
    fn test_cluster_fuel_the_fight_damage_while_leeching() {
        // "20% increased Damage while Leeching"
        // The v1 parser extracts the damage value; the "while leeching" condition is lost.
        let mods = parse_stat_line("20% increased Damage while Leeching");
        assert!(!mods.is_empty(), "expected at least 1 mod, got none");
        assert!(mods.iter().any(|m| m.stat == "Damage" && m.value == 20.0),
            "expected Damage=20.0, got {:?}", mods);
    }

    #[test]
    fn test_cluster_fuel_the_fight_all_stats() {
        let lines = vec![
            "8% increased Attack Speed".to_string(),
            "0.4% of Attack Damage Leeched as Mana".to_string(),
            "20% increased Damage while Leeching".to_string(),
        ];
        let mods = parse_stats(&lines);
        assert_eq!(mods.len(), 3, "expected 3 mods from Fuel the Fight, got {:?}", mods);
        assert!(mods.iter().any(|m| m.stat == "AttackSpeed" && m.value == 8.0));
        assert!(mods.iter().any(|m| m.stat == "ManaLeechPct" && m.value == 0.4));
        assert!(mods.iter().any(|m| m.stat == "Damage" && m.value == 20.0));
    }

    // --- Supercharge (large cluster: Spell Damage) ---

    #[test]
    fn test_cluster_supercharge_lucky() {
        // "Lightning Damage with Non-Critical Strikes is Lucky"
        // Boolean flag extracted via try_misc_patterns
        let mods = parse_stat_line("Lightning Damage with Non-Critical Strikes is Lucky");
        assert_eq!(mods.len(), 1, "expected 1 mod, got {:?}", mods);
        assert_eq!(mods[0].stat, "LightningLucky");
        assert_eq!(mods[0].value, 1.0);
    }

    // --- Additional cluster notables (from cluster-data.generated.ts) ---

    #[test]
    fn test_cluster_basics_of_pain() {
        let lines = vec![
            "20% increased Damage".to_string(),
            "30% increased Critical Strike Chance".to_string(),
        ];
        let mods = parse_stats(&lines);
        assert_eq!(mods.len(), 2);
        assert!(mods.iter().any(|m| m.stat == "Damage" && m.value == 20.0));
        assert!(mods.iter().any(|m| m.stat == "CritChance" && m.value == 30.0));
    }

    #[test]
    fn test_cluster_quick_getaway() {
        let lines = vec![
            "5% increased Attack and Cast Speed".to_string(),
            "5% increased Movement Speed if you've dealt a Critical Strike Recently".to_string(),
            "25% increased Critical Strike Chance".to_string(),
        ];
        let mods = parse_stats(&lines);
        assert!(mods.iter().any(|m| m.stat == "AttackSpeed" && m.value == 5.0),
            "missing AttackSpeed from Quick Getaway, got {:?}", mods);
        assert!(mods.iter().any(|m| m.stat == "CritChance" && m.value == 25.0),
            "missing CritChance from Quick Getaway, got {:?}", mods);
    }

    #[test]
    fn test_cluster_force_multiplier() {
        let lines = vec![
            "5% chance to deal Double Damage".to_string(),
            "25% increased Physical Damage".to_string(),
        ];
        let mods = parse_stats(&lines);
        assert!(mods.iter().any(|m| m.stat == "DoubleDamageChance" && m.value == 5.0));
        assert!(mods.iter().any(|m| m.stat == "PhysicalDamage" && m.value == 25.0));
    }

    #[test]
    fn test_cluster_wasting_affliction() {
        let lines = vec![
            "20% increased Damage over Time".to_string(),
            "10% increased Skill Effect Duration".to_string(),
        ];
        let mods = parse_stats(&lines);
        assert!(mods.iter().any(|m| m.stat == "DamageOverTime" && m.value == 20.0));
        assert!(mods.iter().any(|m| m.stat == "SkillDuration" && m.value == 10.0));
    }

    #[test]
    fn test_cluster_fettle() {
        // Small cluster notable: Life
        let lines = vec![
            "+20 to maximum Life".to_string(),
            "10% increased maximum Life".to_string(),
        ];
        let mods = parse_stats(&lines);
        assert_eq!(mods.len(), 2);
        assert!(mods.iter().any(|m| m.stat == "Life" && m.value == 20.0 && m.mod_type == "flat"));
        assert!(mods.iter().any(|m| m.stat == "Life" && m.value == 10.0 && m.mod_type == "increased"));
    }

    #[test]
    fn test_cluster_energy_from_naught() {
        let mods = parse_stat_line("+100 to maximum Energy Shield");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "EnergyShield");
        assert_eq!(mods[0].value, 100.0);
        assert_eq!(mods[0].mod_type, "flat");
    }

    #[test]
    fn test_cluster_small_passive_stats() {
        // Cluster small passives push their stat text directly (e.g. "12% increased Cold Damage")
        let small_passive_lines = vec![
            "12% increased Cold Damage".to_string(),
            "10% increased Elemental Damage".to_string(),
            "10% increased Damage over Time".to_string(),
            "15% increased Critical Strike Chance".to_string(),
        ];
        let mods = parse_stats(&small_passive_lines);
        assert!(mods.iter().any(|m| m.stat == "ColdDamage" && m.value == 12.0));
        // Elemental splits into 3 elements
        assert!(mods.iter().any(|m| m.stat == "FireDamage" && m.value == 10.0));
        assert!(mods.iter().any(|m| m.stat == "ColdDamage" && m.value == 10.0));
        assert!(mods.iter().any(|m| m.stat == "LightningDamage" && m.value == 10.0));
        assert!(mods.iter().any(|m| m.stat == "DamageOverTime" && m.value == 10.0));
        assert!(mods.iter().any(|m| m.stat == "CritChance" && m.value == 15.0));
    }
}

#[cfg(test)]
mod coverage_check {
    use super::*;

    #[test]
    fn check_coverage_gaps() {
        let must_parse: Vec<(&str, &str)> = vec![
            ("50% of Physical Damage converted to Fire Damage", "ConvPhysToFire"),
            ("50% of Cold Damage converted to Fire Damage", "ConvColdToFire"),
            ("Adds 5 to 10 Cold Damage to Spells", "AddedColdMin"),
            ("Adds 5 to 10 Fire Damage to Attacks", "AddedFireMin"),
            ("Regenerate 20 Life per second", "LifeRegen"),
            ("Regenerate 1.5% of Life per second", "LifeRegenPct"),
            ("Regenerate 150 Energy Shield per second", "ESRegen"),
            ("Regenerate 5 Mana per second", "ManaRegen"),
            ("0.4% of Physical Attack Damage Leeched as Life", "LifeLeechPct"),
            ("0.5% of Damage Leeched as Energy Shield", "ESLeechPct"),
            ("5% increased Cast Speed", "AttackSpeed"),
            ("10% more Cast Speed", "AttackSpeed"),
            ("4% increased Attack and Cast Speed", "AttackSpeed"),
            ("20% increased Damage over Time", "DamageOverTime"),
            ("+5% to Damage over Time Multiplier", "DamageOverTimeMulti"),
            ("Penetrates 10% Fire Resistance", "FirePenetration"),
            ("Damage Penetrates 5% Cold Resistance", "ColdPenetration"),
            ("Damage Penetrates 10% Elemental Resistances", "FirePenetration"),
            ("Gain 15% of Physical Damage as Extra Cold Damage", "PhysGainAsCold"),
            ("+1 to Level of all Spell Skill Gems", "GemLevel"),
            ("8% increased Area of Effect", "AreaOfEffect"),
            ("10% increased Projectile Speed", "ProjectileSpeed"),
            ("10% increased Movement Speed", "MovementSpeed"),
            ("67% increased Energy Shield", "EnergyShield"),
            ("(56-74)% increased Energy Shield", "EnergyShield"),
            ("15% more Energy Shield", "EnergyShield"),
            ("+20% to Global Critical Strike Multiplier", "CritMultiplier"),
            ("+30% to Critical Strike Multiplier for Spells", "CritMultiplier"),
            ("+(17-20)% to Fire and Lightning Resistances", "FireRes"),
            ("Nearby Enemies have -10% to Fire Resistance", "FirePenetration"),
            ("Nearby Enemies have -9% to Cold Resistance", "ColdPenetration"),
            ("Nearby Enemies have -12% to Lightning Resistance", "LightningPenetration"),
            ("1% of Life Regenerated per second", "LifeRegenPct"),
            ("10% more maximum Life", "Life"),
            ("200% increased Accuracy Rating", "Accuracy"),
        ];

        let mut missing = vec![];
        for (line, expected_stat) in &must_parse {
            let mods = parse_stat_line(line);
            if mods.is_empty() {
                missing.push(format!("NO PARSE: \"{}\" (expected {})", line, expected_stat));
            } else if !mods.iter().any(|m| m.stat == *expected_stat) {
                let got: Vec<_> = mods.iter().map(|m| format!("{}={}", m.stat, m.value)).collect();
                missing.push(format!("WRONG STAT: \"{}\" expected {} got [{}]", line, expected_stat, got.join(", ")));
            }
        }

        if !missing.is_empty() {
            for m in &missing {
                eprintln!("  {}", m);
            }
            panic!("{} of {} patterns need fixing", missing.len(), must_parse.len());
        }
    }

    #[test]
    fn test_phys_taken_as_element() {
        let mods = parse_stat_line("7% of Physical Damage from Hits taken as Cold Damage");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "PhysTakenAsCold");
        assert_eq!(mods[0].value, 7.0);

        let mods = parse_stat_line("11% of Physical Damage from Hits taken as Chaos Damage");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "PhysTakenAsChaos");
        assert_eq!(mods[0].value, 11.0);

        let mods = parse_stat_line("5% of Physical Damage from Hits taken as Fire Damage");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "PhysTakenAsFire");
        assert_eq!(mods[0].value, 5.0);
    }

    #[test]
    fn test_action_speed() {
        let mods = parse_stat_line("4% increased Action Speed");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "ActionSpeed");
        assert_eq!(mods[0].value, 4.0);
        assert_eq!(mods[0].mod_type, "increased");
    }

    #[test]
    fn test_stun_block_recovery() {
        let mods = parse_stat_line("30% increased Stun and Block Recovery");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "StunBlockRecovery");
        assert_eq!(mods[0].value, 30.0);
        assert_eq!(mods[0].mod_type, "increased");
    }

    #[test]
    fn test_singular_max_charge() {
        let mods = parse_stat_line("+1 to Maximum Power Charge");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "MaxPowerCharges");
        assert_eq!(mods[0].value, 1.0);
    }

    #[test]
    fn test_dual_attribute_str_int() {
        let mods = parse_stat_line("+10 to Strength and Intelligence");
        assert_eq!(mods.len(), 2);
        assert!(mods.iter().any(|m| m.stat == "Str" && m.value == 10.0));
        assert!(mods.iter().any(|m| m.stat == "Int" && m.value == 10.0));
    }

    #[test]
    fn test_dual_attribute_str_dex() {
        let mods = parse_stat_line("+20 to Strength and Dexterity");
        assert_eq!(mods.len(), 2);
        assert!(mods.iter().any(|m| m.stat == "Str" && m.value == 20.0));
        assert!(mods.iter().any(|m| m.stat == "Dex" && m.value == 20.0));
    }

    #[test]
    fn test_dual_attribute_dex_int() {
        let mods = parse_stat_line("+15 to Dexterity and Intelligence");
        assert_eq!(mods.len(), 2);
        assert!(mods.iter().any(|m| m.stat == "Dex" && m.value == 15.0));
        assert!(mods.iter().any(|m| m.stat == "Int" && m.value == 15.0));
    }

    #[test]
    fn test_reduced_mana_cost() {
        let mods = parse_stat_line("20% reduced Mana Cost of Skills");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "ManaCost");
        assert_eq!(mods[0].value, -20.0);
        assert_eq!(mods[0].mod_type, "increased");
    }

    #[test]
    fn test_reduced_movement_speed() {
        let mods = parse_stat_line("3% reduced Movement Speed");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "MovementSpeed");
        assert_eq!(mods[0].value, -3.0);
        assert_eq!(mods[0].mod_type, "increased");
    }

    #[test]
    fn test_less_attack_speed() {
        let mods = parse_stat_line("10% less Attack Speed");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "AttackSpeed");
        assert_eq!(mods[0].value, -10.0);
        assert_eq!(mods[0].mod_type, "more");
    }

    #[test]
    fn test_less_damage() {
        let mods = parse_stat_line("25% less Damage");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "Damage");
        assert_eq!(mods[0].value, -25.0);
        assert_eq!(mods[0].mod_type, "more");
    }

    #[test]
    fn test_chance_to_ignite() {
        let mods = parse_stat_line("20% chance to Ignite");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "IgniteChance");
        assert_eq!(mods[0].value, 20.0);
    }

    #[test]
    fn test_chance_to_freeze() {
        let mods = parse_stat_line("10% chance to Freeze");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "FreezeChance");
        assert_eq!(mods[0].value, 10.0);
    }

    #[test]
    fn test_chance_to_shock() {
        let mods = parse_stat_line("15% chance to Shock");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "ShockChance");
        assert_eq!(mods[0].value, 15.0);
    }

    #[test]
    fn test_chance_to_cause_bleeding() {
        let mods = parse_stat_line("25% chance to cause Bleeding on Hit");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "BleedChance");
        assert_eq!(mods[0].value, 25.0);
    }

    #[test]
    fn test_chance_to_poison() {
        let mods = parse_stat_line("30% chance to Poison on Hit");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "PoisonChance");
        assert_eq!(mods[0].value, 30.0);
    }

    #[test]
    fn test_increased_effect_of_shock() {
        let mods = parse_stat_line("15% increased Effect of Shock");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "ShockEffect");
        assert_eq!(mods[0].value, 15.0);
    }

    #[test]
    fn test_increased_effect_of_chill() {
        let mods = parse_stat_line("10% increased Effect of Chill");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "ChillEffect");
        assert_eq!(mods[0].value, 10.0);
    }

    #[test]
    fn test_life_leech_rate() {
        let mods = parse_stat_line("30% increased total Recovery per second from Life Leech");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "LifeLeechRateInc");
        assert_eq!(mods[0].value, 30.0);
    }

    #[test]
    fn test_max_life_leech_rate() {
        let mods = parse_stat_line("20% increased Maximum total Life Recovery per second from Leech");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "MaxLifeLeechRate");
        assert_eq!(mods[0].value, 20.0);
    }

    #[test]
    fn test_shield_defences() {
        let mods = parse_stat_line("50% increased Defences from Equipped Shield");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "ShieldDefences");
        assert_eq!(mods[0].value, 50.0);
    }

    #[test]
    fn test_flask_life_recovery() {
        let mods = parse_stat_line("20% increased Life Recovery from Flasks");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "FlaskLifeRecovery");
        assert_eq!(mods[0].value, 20.0);
    }

    #[test]
    fn test_totem_life() {
        let mods = parse_stat_line("15% increased Totem Life");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "TotemLife");
        assert_eq!(mods[0].value, 15.0);
    }

    #[test]
    fn test_flat_mana_cost() {
        let mods = parse_stat_line("-3 to Total Mana Cost");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "ManaCost");
        assert_eq!(mods[0].value, -3.0);
    }

    #[test]
    fn test_light_radius() {
        let mods = parse_stat_line("5% increased Light Radius");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "LightRadius");
    }

    #[test]
    fn test_poison_duration() {
        let mods = parse_stat_line("5% increased Poison Duration");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "PoisonDuration");
    }

    #[test]
    fn test_bleed_duration() {
        let mods = parse_stat_line("25% increased Bleeding Duration");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "BleedDuration");
    }

    #[test]
    fn test_trap_throwing_speed() {
        let mods = parse_stat_line("5% increased Trap Throwing Speed");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "TrapThrowingSpeed");
    }

    #[test]
    fn test_mine_throwing_speed() {
        let mods = parse_stat_line("5% increased Mine Throwing Speed");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "MineThrowingSpeed");
    }

    #[test]
    fn test_warcry_buff_effect() {
        let mods = parse_stat_line("10% increased Warcry Buff Effect");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "WarcryBuffEffect");
    }

    #[test]
    fn test_herald_buff_effect() {
        let mods = parse_stat_line("10% increased Effect of Herald Buffs on you");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "HeraldBuffEffect");
    }

    #[test]
    fn test_non_damaging_ailment_effect() {
        let mods = parse_stat_line("10% increased Effect of Non-Damaging Ailments");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "NonDamagingAilmentEffect");
    }

    #[test]
    fn test_cost_efficiency_attacks() {
        let mods = parse_stat_line("15% increased Cost Efficiency of Attacks");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "CostEfficiency");
    }

    #[test]
    fn test_flask_charges_gained() {
        let mods = parse_stat_line("10% increased Flask Charges gained");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "FlaskChargesGained");
    }

    #[test]
    fn test_flask_effect_applied() {
        let mods = parse_stat_line("Flasks applied to you have 5% increased Effect");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "FlaskEffectApplied");
    }

    #[test]
    fn test_recoup_life() {
        let mods = parse_stat_line("6% of Damage taken Recouped as Life");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "LifeRecoup");
    }

    #[test]
    fn test_melee_strike_range() {
        let mods = parse_stat_line("+0.1 metres to Melee Strike Range");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "MeleeRange");
    }

    #[test]
    fn test_double_damage_chance() {
        let mods = parse_stat_line("5% chance to deal Double Damage");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "DoubleDamageChance");
    }

    #[test]
    fn test_block_recovery() {
        let mods = parse_stat_line("30% increased Block Recovery");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "BlockRecovery");
    }

    #[test]
    fn test_mana_leech() {
        let mods = parse_stat_line("0.4% of Attack Damage Leeched as Mana");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "ManaLeechPct");
    }

    #[test]
    fn test_spell_damage_leech_es() {
        let mods = parse_stat_line("0.3% of Spell Damage Leeched as Energy Shield");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "ESLeechPct");
    }

    #[test]
    fn test_stun_duration_on_enemies() {
        let mods = parse_stat_line("20% increased Stun Duration on Enemies");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "StunDuration");
    }

    #[test]
    fn test_melee_crit_multi() {
        let mods = parse_stat_line("+10% to Melee Critical Strike Multiplier");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "CritMultiplier");
    }

    #[test]
    fn test_increased_strength_pct() {
        let mods = parse_stat_line("15% increased Strength");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "Str");
        assert_eq!(mods[0].mod_type, "increased");
    }

    #[test]
    fn test_gain_life_per_enemy_killed() {
        let mods = parse_stat_line("Gain 15 Life per Enemy Killed");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "LifeOnKill");
    }

    #[test]
    fn test_warcry_cooldown_recovery() {
        let mods = parse_stat_line("15% increased Warcry Cooldown Recovery Rate");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "WarcryCooldown");
    }

    #[test]
    fn test_arcane_surge_effect() {
        let mods = parse_stat_line("20% increased Effect of Arcane Surge on you");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "ArcaneSurgeEffect");
    }

    #[test]
    fn test_avoid_bleeding() {
        let mods = parse_stat_line("30% chance to Avoid Bleeding");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "BleedAvoidance");
    }

    #[test]
    fn test_tincture_effect() {
        let mods = parse_stat_line("Tinctures applied to you have 10% increased Effect");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "TinctureEffect");
    }

    #[test]
    fn test_max_fortification() {
        let mods = parse_stat_line("+1 to maximum Fortification");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "MaxFortification");
    }

    #[test]
    fn test_max_rage() {
        let mods = parse_stat_line("+3 to Maximum Rage");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "MaxRage");
    }

    #[test]
    fn test_golem_buff_effect() {
        let mods = parse_stat_line("20% increased Effect of Buffs granted by your Golems");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "GolemBuffEffect");
    }

    #[test]
    fn test_totem_placement_speed() {
        let mods = parse_stat_line("10% increased Totem Placement speed");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "TotemPlacementSpeed");
    }

    #[test]
    fn test_reservation_efficiency() {
        let mods = parse_stat_line("8% increased Reservation Efficiency of Skills");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "ReservationEfficiency");
    }

    #[test]
    fn test_mana_on_hit() {
        let mods = parse_stat_line("Gain 2 Mana per Enemy Hit with Attacks");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "ManaOnHit");
    }

    #[test]
    fn test_burning_damage() {
        let mods = parse_stat_line("12% increased Burning Damage");
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "BurningDamage");
    }

    #[test]
    fn test_ele_res_holding_shield() {
        let mods = parse_stat_line("+3% Elemental Resistances while holding a Shield");
        assert_eq!(mods.len(), 3);
        let stats: Vec<_> = mods.iter().map(|m| m.stat.as_str()).collect();
        assert!(stats.contains(&"FireRes"));
        assert!(stats.contains(&"ColdRes"));
        assert!(stats.contains(&"LightningRes"));
    }

    #[test]
    #[ignore]
    fn measure_tree_coverage() {
        use std::collections::HashMap;

        let tree_path = concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../apps/web/public/data/tree/tree-3_29.json"
        );
        let data = std::fs::read_to_string(tree_path)
            .expect("Failed to read tree JSON");
        let json: serde_json::Value = serde_json::from_str(&data)
            .expect("Failed to parse tree JSON");

        let nodes = json.get("nodes").and_then(|n| n.as_object())
            .expect("No nodes object in tree JSON");

        let mut total_occurrences = 0usize;
        let mut parsed_occurrences = 0usize;
        let mut unique_lines: HashMap<String, usize> = HashMap::new();

        for (_id, node) in nodes {
            if let Some(stats) = node.get("stats").and_then(|s| s.as_array()) {
                for stat in stats {
                    if let Some(line) = stat.as_str() {
                        let trimmed = line.trim();
                        if trimmed.is_empty() { continue; }
                        *unique_lines.entry(trimmed.to_string()).or_insert(0) += 1;
                        total_occurrences += 1;
                        if !parse_stat_line(trimmed).is_empty() {
                            parsed_occurrences += 1;
                        }
                    }
                }
            }
        }

        let unique_total = unique_lines.len();
        let mut unique_parsed = 0usize;
        let mut unparsed: Vec<(String, usize)> = Vec::new();
        for (line, count) in &unique_lines {
            if !parse_stat_line(line).is_empty() {
                unique_parsed += 1;
            } else {
                unparsed.push((line.clone(), *count));
            }
        }
        unparsed.sort_by(|a, b| b.1.cmp(&a.1));

        let unique_unparsed = unique_total - unique_parsed;
        let unique_pct = unique_parsed as f64 / unique_total as f64 * 100.0;
        let occ_pct = parsed_occurrences as f64 / total_occurrences as f64 * 100.0;

        println!("\n=== Tree stat_parser coverage ===");
        println!("Unique lines:  {} total, {} parsed, {} unparsed ({:.1}%)",
            unique_total, unique_parsed, unique_unparsed, unique_pct);
        println!("Occurrences:   {} total, {} parsed, {} unparsed ({:.1}%)",
            total_occurrences, parsed_occurrences,
            total_occurrences - parsed_occurrences, occ_pct);
        println!("\nAll unparsed (by occurrence count):");
        for (i, (line, count)) in unparsed.iter().enumerate() {
            println!("  {:>3}. [{}x] {}", i + 1, count, line);
        }
        println!();
    }

    #[test]
    #[ignore]
    fn measure_unique_item_coverage() {
        let mods_path = concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/unique_mods.txt"
        );
        let data = std::fs::read_to_string(mods_path)
            .expect("Failed to read unique_mods.txt");

        let mut total = 0usize;
        let mut parsed = 0usize;
        let mut unparsed: Vec<&str> = Vec::new();

        for line in data.lines() {
            let trimmed = line.trim();
            if trimmed.is_empty() { continue; }
            total += 1;
            if !parse_stat_line(trimmed).is_empty() {
                parsed += 1;
            } else {
                unparsed.push(trimmed);
            }
        }

        let pct = parsed as f64 / total as f64 * 100.0;
        println!("\n=== Unique item mod coverage ===");
        println!("Total:    {} unique mod lines", total);
        println!("Parsed:   {} ({:.1}%)", parsed, pct);
        println!("Unparsed: {} ({:.1}%)", total - parsed, 100.0 - pct);
        println!("\nAll unparsed:");
        for (i, line) in unparsed.iter().enumerate() {
            println!("  {:>3}. {}", i + 1, line);
        }
        println!();
    }
}
