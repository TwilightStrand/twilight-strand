use crate::Modifier;
use crate::mod_db::{self, ModFlags, KeywordFlags, ConditionId, MultiplierId, ModTag, ModType, StatId};

/// Strip `(X-Y)` range notation to midpoint value, e.g. "(5-10)" -> "8"
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
            if let Some(dash_idx) = inner.find('-') {
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
    StatRule::new(Pct, "increased maximum energy shield", Increased, "EnergyShield").group(1),
    StatRule::new(Pct, "increased energy shield", Increased, "EnergyShield").group(1),
    StatRule::new(Pct, "more energy shield", More, "EnergyShield"),

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
// Public API
// ---------------------------------------------------------------------------

/// Parse a PoE stat description line into zero or more Modifiers.
pub fn parse_stat_line(line: &str) -> Vec<Modifier> {
    let line = line.trim();
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
}
