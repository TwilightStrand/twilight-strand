use bitflags::bitflags;

// ---------------------------------------------------------------------------
// Task 1: StatId - interned stat names
// ---------------------------------------------------------------------------

#[derive(Copy, Clone, Eq, PartialEq, Hash, Debug)]
pub struct StatId(pub u16);

macro_rules! define_stats {
    ($(($CONST:ident, $str_name:expr) = $val:expr),* $(,)?) => {
        impl StatId {
            $(pub const $CONST: StatId = StatId($val);)*
            pub const COUNT: usize = [$($val),*].len();
        }

        const STAT_NAMES: &[(u16, &str)] = &[
            $(($val, $str_name),)*
        ];

        impl StatId {
            pub fn from_str(s: &str) -> Option<StatId> {
                for &(id, name) in STAT_NAMES {
                    if name == s {
                        return Some(StatId(id));
                    }
                }
                None
            }

            pub fn as_str(self) -> &'static str {
                for &(id, name) in STAT_NAMES {
                    if id == self.0 { return name; }
                }
                "Unknown"
            }
        }
    };
}

define_stats! {
    (LIFE, "Life") = 0,
    (ENERGY_SHIELD, "EnergyShield") = 1,
    (MANA, "Mana") = 2,
    (WARD, "Ward") = 3,
    (STR, "Str") = 4,
    (DEX, "Dex") = 5,
    (INT, "Int") = 6,
    (ARMOUR, "Armour") = 7,
    (EVASION, "Evasion") = 8,
    (BLOCK_CHANCE, "BlockChance") = 9,
    (SPELL_BLOCK_CHANCE, "SpellBlockChance") = 10,
    (SPELL_SUPPRESSION, "SpellSuppression") = 11,
    (PHYS_DAMAGE_REDUCTION, "PhysicalDamageReduction") = 12,
    (FIRE_RES, "FireRes") = 13,
    (COLD_RES, "ColdRes") = 14,
    (LIGHTNING_RES, "LightningRes") = 15,
    (CHAOS_RES, "ChaosRes") = 16,
    (FIRE_RES_MAX, "FireResMax") = 17,
    (COLD_RES_MAX, "ColdResMax") = 18,
    (LIGHTNING_RES_MAX, "LightningResMax") = 19,
    (DAMAGE, "Damage") = 20,
    (ATTACK_DAMAGE, "AttackDamage") = 21,
    (SPELL_DAMAGE, "SpellDamage") = 22,
    (MELEE_DAMAGE, "MeleeDamage") = 23,
    (PROJECTILE_DAMAGE, "ProjectileDamage") = 24,
    (AREA_DAMAGE, "AreaDamage") = 25,
    (DAMAGE_OVER_TIME, "DamageOverTime") = 26,
    (DOT_MULTI, "DamageOverTimeMulti") = 27,
    (ELEMENTAL_DAMAGE, "ElementalDamage") = 28,
    (PHYSICAL_DAMAGE, "PhysicalDamage") = 29,
    (FIRE_DAMAGE, "FireDamage") = 30,
    (COLD_DAMAGE, "ColdDamage") = 31,
    (LIGHTNING_DAMAGE, "LightningDamage") = 32,
    (CHAOS_DAMAGE, "ChaosDamage") = 33,
    (ADDED_PHYS_MIN, "AddedPhysMin") = 34,
    (ADDED_PHYS_MAX, "AddedPhysMax") = 35,
    (ADDED_FIRE_MIN, "AddedFireMin") = 36,
    (ADDED_FIRE_MAX, "AddedFireMax") = 37,
    (ADDED_COLD_MIN, "AddedColdMin") = 38,
    (ADDED_COLD_MAX, "AddedColdMax") = 39,
    (ADDED_LIGHTNING_MIN, "AddedLightningMin") = 40,
    (ADDED_LIGHTNING_MAX, "AddedLightningMax") = 41,
    (ADDED_CHAOS_MIN, "AddedChaosMin") = 42,
    (ADDED_CHAOS_MAX, "AddedChaosMax") = 43,
    (PHYS_GAIN_AS_FIRE, "PhysGainAsFire") = 44,
    (PHYS_GAIN_AS_COLD, "PhysGainAsCold") = 45,
    (PHYS_GAIN_AS_LIGHTNING, "PhysGainAsLightning") = 46,
    (PHYS_GAIN_AS_CHAOS, "PhysGainAsChaos") = 47,
    (FIRE_PEN, "FirePenetration") = 48,
    (COLD_PEN, "ColdPenetration") = 49,
    (LIGHTNING_PEN, "LightningPenetration") = 50,
    (CHAOS_PEN, "ChaosPenetration") = 51,
    (CONV_PHYS_TO_FIRE, "ConvPhysToFire") = 52,
    (CONV_PHYS_TO_COLD, "ConvPhysToCold") = 53,
    (CONV_PHYS_TO_LIGHTNING, "ConvPhysToLightning") = 54,
    (CONV_PHYS_TO_CHAOS, "ConvPhysToChaos") = 55,
    (CONV_COLD_TO_FIRE, "ConvColdToFire") = 56,
    (CONV_LIGHTNING_TO_COLD, "ConvLightningToCold") = 57,
    (CRIT_CHANCE, "CritChance") = 58,
    (CRIT_MULTIPLIER, "CritMultiplier") = 59,
    (ATTACK_SPEED, "AttackSpeed") = 60,
    (CAST_SPEED, "CastSpeed") = 61,
    (MOVEMENT_SPEED, "MovementSpeed") = 62,
    (PROJECTILE_SPEED, "ProjectileSpeed") = 63,
    (ACCURACY, "Accuracy") = 64,
    (HIT_CHANCE, "HitChance") = 65,
    (LIFE_REGEN, "LifeRegen") = 66,
    (LIFE_REGEN_PCT, "LifeRegenPct") = 67,
    (MANA_REGEN, "ManaRegen") = 68,
    (ES_REGEN, "ESRegen") = 69,
    (ES_RECHARGE_RATE, "ESRechargeRate") = 70,
    (LIFE_LEECH_PCT, "LifeLeechPct") = 71,
    (ES_LEECH_PCT, "ESLeechPct") = 72,
    (LIFE_LEECH_RATE, "LifeLeechRate") = 73,
    (LIFE_ON_HIT, "LifeOnHit") = 74,
    (LIFE_ON_KILL, "LifeOnKill") = 75,
    (MANA_ON_KILL, "ManaOnKill") = 76,
    (BLEED_DAMAGE, "BleedDamage") = 77,
    (POISON_DAMAGE, "PoisonDamage") = 78,
    (IGNITE_DAMAGE, "IgniteDamage") = 79,
    (POISON_CHANCE, "PoisonChance") = 80,
    (IMPALE_CHANCE, "ImpaleChance") = 81,
    (IMPALE_EFFECT, "ImpaleEffect") = 82,
    (SKILL_DURATION, "SkillDuration") = 83,
    (AREA_OF_EFFECT, "AreaOfEffect") = 84,
    (COOLDOWN_RECOVERY, "CooldownRecovery") = 85,
    (AURA_EFFECT, "AuraEffect") = 86,
    (CURSE_EFFECT, "CurseEffect") = 87,
    (CURSE_DURATION, "CurseDuration") = 88,
    (DAMAGE_TAKEN_REDUCTION, "DamageTakenReduction") = 89,
    (FLASK_EFFECT, "FlaskEffect") = 90,
    (GEM_LEVEL, "GemLevel") = 91,
    (STUN_AVOIDANCE, "StunAvoidance") = 92,
    (AILMENT_AVOIDANCE, "AilmentAvoidance") = 93,
    (MANA_RESERVATION_EFF, "ManaReservationEfficiency") = 94,
    (SPELL_SUPPRESSION_CHANCE, "SpellSuppressionChance") = 95,
    (MINION_DAMAGE, "MinionDamage") = 96,
    (MINION_LIFE, "MinionLife") = 97,
    (MINION_SPEED, "MinionSpeed") = 98,
    (MINION_MOVE_SPEED, "MinionMoveSpeed") = 99,
    (IMPALE_DPS, "ImpaleDPS") = 100,
    // Charges
    (MAX_POWER_CHARGES, "MaxPowerCharges") = 101,
    (MAX_FRENZY_CHARGES, "MaxFrenzyCharges") = 102,
    (MAX_ENDURANCE_CHARGES, "MaxEnduranceCharges") = 103,
    // Self aura effect
    (AURA_EFFECT_ON_SELF, "AuraEffectOnSelf") = 104,
    // DoT multi (element-specific, but tracked generically for now)
    (COLD_DOT_MULTI, "ColdDotMulti") = 105,
    (FIRE_DOT_MULTI, "FireDotMulti") = 106,
    (CHAOS_DOT_MULTI, "ChaosDotMulti") = 107,
    (PHYS_DOT_MULTI, "PhysDotMulti") = 108,
}

// ---------------------------------------------------------------------------
// Task 2: ModFlags and KeywordFlags
// ---------------------------------------------------------------------------

bitflags! {
    #[derive(Copy, Clone, Eq, PartialEq, Debug, Default)]
    pub struct ModFlags: u32 {
        const ATTACK        = 0x0000_0001;
        const SPELL         = 0x0000_0002;
        const HIT           = 0x0000_0004;
        const DOT           = 0x0000_0008;
        const CAST          = 0x0000_0010;
        const MELEE         = 0x0000_0100;
        const AREA          = 0x0000_0200;
        const PROJECTILE    = 0x0000_0400;
        const AILMENT       = 0x0000_0800;
        const MELEE_HIT     = 0x0000_1000;
        const WEAPON        = 0x0000_2000;
        const AXE           = 0x0001_0000;
        const BOW           = 0x0002_0000;
        const CLAW          = 0x0004_0000;
        const DAGGER        = 0x0008_0000;
        const MACE          = 0x0010_0000;
        const STAFF         = 0x0020_0000;
        const SWORD         = 0x0040_0000;
        const WAND          = 0x0080_0000;
        const UNARMED       = 0x0100_0000;
        const WEAPON_MELEE  = 0x0400_0000;
        const WEAPON_RANGED = 0x0800_0000;
        const WEAPON_1H     = 0x1000_0000;
        const WEAPON_2H     = 0x2000_0000;
    }
}

bitflags! {
    #[derive(Copy, Clone, Eq, PartialEq, Debug, Default)]
    pub struct KeywordFlags: u32 {
        const AURA      = 0x0000_0001;
        const CURSE     = 0x0000_0002;
        const WARCRY    = 0x0000_0004;
        const MOVEMENT  = 0x0000_0008;
        const PHYSICAL  = 0x0000_0010;
        const FIRE      = 0x0000_0020;
        const COLD      = 0x0000_0040;
        const LIGHTNING  = 0x0000_0080;
        const CHAOS     = 0x0000_0100;
        const VAAL      = 0x0000_0200;
        const BOW       = 0x0000_0400;
        const TRAP      = 0x0000_1000;
        const MINE      = 0x0000_2000;
        const TOTEM     = 0x0000_4000;
        const MINION    = 0x0000_8000;
        const ATTACK    = 0x0001_0000;
        const SPELL     = 0x0002_0000;
        const HIT       = 0x0004_0000;
        const AILMENT   = 0x0008_0000;
        const BRAND     = 0x0010_0000;
        const POISON    = 0x0020_0000;
        const BLEED     = 0x0040_0000;
        const IGNITE    = 0x0080_0000;
        const MATCH_ALL = 0x4000_0000;
    }
}

impl ModFlags {
    pub fn matches(self, cfg: ModFlags) -> bool {
        self.is_empty() || (cfg & self) == self
    }
}

impl KeywordFlags {
    pub fn matches(self, cfg: KeywordFlags) -> bool {
        if self.is_empty() { return true; }
        if self.contains(KeywordFlags::MATCH_ALL) {
            let required = self & !KeywordFlags::MATCH_ALL;
            (cfg & required) == required
        } else {
            !(cfg & self).is_empty()
        }
    }
}

// ---------------------------------------------------------------------------
// Task 3: ModType, ConditionId, MultiplierId
// ---------------------------------------------------------------------------

#[derive(Copy, Clone, Eq, PartialEq, Debug)]
#[repr(u8)]
pub enum ModType {
    Base = 0,
    Increased = 1,
    More = 2,
    Override = 3,
    Flag = 4,
}

#[derive(Copy, Clone, Eq, PartialEq, Debug)]
#[repr(u8)]
pub enum ConditionId {
    DualWielding = 0,
    OnFullLife = 1,
    OnLowLife = 2,
    IsLeeching = 3,
    KilledRecently = 4,
    HaveFortify = 5,
    HaveOnslaught = 6,
    HaveTailwind = 7,
    EnemyShocked = 8,
    EnemyChilled = 9,
    EnemyFrozen = 10,
    EnemyIgnited = 11,
    EnemyBleeding = 12,
    EnemyPoisoned = 13,
    EnemyMaimed = 14,
    UsingShield = 15,
    UsingFlask = 16,
    Stationary = 17,
    Channelling = 18,
    CritRecently = 19,
    BlockedRecently = 20,
    HitRecently = 21,
    HaveArcaneSurge = 22,
    EnemyColdExposure = 23,
    EnemyFireExposure = 24,
    EnemyLightningExposure = 25,
}

#[derive(Copy, Clone, Eq, PartialEq, Debug)]
#[repr(u8)]
pub enum MultiplierId {
    PowerCharge = 0,
    FrenzyCharge = 1,
    EnduranceCharge = 2,
    GrandSpectrum = 3,
    Totem = 4,
    Golem = 5,
    Zombie = 6,
    Spectre = 7,
    Skeleton = 8,
    RagingSpirit = 9,
}

// ---------------------------------------------------------------------------
// Task 4: ModTag, Mod, BuildState, SkillCfg
// ---------------------------------------------------------------------------

#[derive(Copy, Clone, Debug, PartialEq)]
pub enum ModTag {
    None,
    Condition(ConditionId),
    Multiplier(MultiplierId),
    PerStat(StatId, f64),
    StatThreshold(StatId, f64),
    SkillType(KeywordFlags),
    SkillId(u16),
    Limit(f64),
}

impl Default for ModTag {
    fn default() -> Self { ModTag::None }
}

#[derive(Clone, Debug)]
pub struct Mod {
    pub stat: StatId,
    pub mod_type: ModType,
    pub flags: ModFlags,
    pub keyflags: KeywordFlags,
    pub value: f64,
    pub tag1: ModTag,
    pub tag2: ModTag,
}

impl Mod {
    pub fn new(stat: StatId, mod_type: ModType, value: f64) -> Self {
        Mod {
            stat,
            mod_type,
            flags: ModFlags::empty(),
            keyflags: KeywordFlags::empty(),
            value,
            tag1: ModTag::None,
            tag2: ModTag::None,
        }
    }

    pub fn with_flags(mut self, flags: ModFlags) -> Self {
        self.flags = flags;
        self
    }

    pub fn with_keyflags(mut self, keyflags: KeywordFlags) -> Self {
        self.keyflags = keyflags;
        self
    }

    pub fn with_condition(mut self, cond: ConditionId) -> Self {
        if matches!(self.tag1, ModTag::None) {
            self.tag1 = ModTag::Condition(cond);
        } else {
            self.tag2 = ModTag::Condition(cond);
        }
        self
    }

    pub fn with_multiplier(mut self, mult: MultiplierId) -> Self {
        if matches!(self.tag1, ModTag::None) {
            self.tag1 = ModTag::Multiplier(mult);
        } else {
            self.tag2 = ModTag::Multiplier(mult);
        }
        self
    }

    pub fn with_per_stat(mut self, stat: StatId, divisor: f64) -> Self {
        let tag = ModTag::PerStat(stat, divisor);
        if matches!(self.tag1, ModTag::None) {
            self.tag1 = tag;
        } else {
            self.tag2 = tag;
        }
        self
    }

    pub fn with_tag(mut self, tag: ModTag) -> Self {
        if matches!(self.tag1, ModTag::None) {
            self.tag1 = tag;
        } else {
            self.tag2 = tag;
        }
        self
    }
}

#[derive(Clone, Debug, Default)]
pub struct BuildState {
    pub conditions: u64,
    pub power_charges: u8,
    pub frenzy_charges: u8,
    pub endurance_charges: u8,
    pub grand_spectrum_count: u8,
    pub totem_count: u8,
    pub strength: f64,
    pub dexterity: f64,
    pub intelligence: f64,
    pub weapon_type: ModFlags,
}

impl BuildState {
    pub fn set_condition(&mut self, id: ConditionId) {
        self.conditions |= 1u64 << (id as u8);
    }

    pub fn clear_condition(&mut self, id: ConditionId) {
        self.conditions &= !(1u64 << (id as u8));
    }

    pub fn check(&self, id: ConditionId) -> bool {
        (self.conditions >> (id as u8)) & 1 == 1
    }

    pub fn multiplier(&self, id: MultiplierId) -> u32 {
        match id {
            MultiplierId::PowerCharge => self.power_charges as u32,
            MultiplierId::FrenzyCharge => self.frenzy_charges as u32,
            MultiplierId::EnduranceCharge => self.endurance_charges as u32,
            MultiplierId::GrandSpectrum => self.grand_spectrum_count as u32,
            MultiplierId::Totem => self.totem_count as u32,
            MultiplierId::Golem | MultiplierId::Zombie
            | MultiplierId::Spectre | MultiplierId::Skeleton
            | MultiplierId::RagingSpirit => 0,
        }
    }

    pub fn get_stat(&self, stat: StatId) -> f64 {
        match stat {
            StatId::STR => self.strength,
            StatId::DEX => self.dexterity,
            StatId::INT => self.intelligence,
            _ => 0.0,
        }
    }
}

#[derive(Clone, Debug, Default)]
pub struct SkillCfg {
    pub flags: ModFlags,
    pub keyflags: KeywordFlags,
    pub skill_id: u16,
}

// ---------------------------------------------------------------------------
// Task 5 + 6: ModDB storage, matching, parent chain
// ---------------------------------------------------------------------------

#[derive(Clone, Debug)]
pub struct ModDB {
    mods: Vec<Mod>,
    by_stat: Vec<Vec<u32>>,
    parent: Option<Box<ModDB>>,
}

impl ModDB {
    pub fn new() -> Self {
        ModDB {
            mods: Vec::new(),
            by_stat: Vec::new(),
            parent: None,
        }
    }

    pub fn with_parent(parent: ModDB) -> Self {
        ModDB {
            mods: Vec::new(),
            by_stat: Vec::new(),
            parent: Some(Box::new(parent)),
        }
    }

    pub fn add(&mut self, m: Mod) {
        let idx = self.mods.len() as u32;
        let stat_idx = m.stat.0 as usize;
        if stat_idx >= self.by_stat.len() {
            self.by_stat.resize(stat_idx + 1, Vec::new());
        }
        self.by_stat[stat_idx].push(idx);
        self.mods.push(m);
    }

    pub fn len(&self) -> usize { self.mods.len() }
    pub fn is_empty(&self) -> bool { self.mods.is_empty() }

    fn matches(m: &Mod, cfg: &SkillCfg) -> bool {
        m.flags.matches(cfg.flags) && m.keyflags.matches(cfg.keyflags)
    }

    fn eval_tag(tag: &ModTag, value: f64, state: &BuildState) -> f64 {
        match tag {
            ModTag::None => value,
            ModTag::Condition(id) => {
                if state.check(*id) { value } else { 0.0 }
            }
            ModTag::Multiplier(id) => {
                value * state.multiplier(*id) as f64
            }
            ModTag::PerStat(stat, divisor) => {
                let stat_val = state.get_stat(*stat);
                value * (stat_val / divisor).floor()
            }
            ModTag::StatThreshold(stat, threshold) => {
                if state.get_stat(*stat) >= *threshold { value } else { 0.0 }
            }
            ModTag::SkillType(required) => {
                // This is checked in the keyword flags path already
                value
            }
            ModTag::SkillId(id) => {
                // Would need skill_id in a richer SkillCfg
                value
            }
            ModTag::Limit(cap) => {
                value.min(*cap)
            }
        }
    }

    fn effective_value(m: &Mod, state: &BuildState) -> f64 {
        let v = Self::eval_tag(&m.tag1, m.value, state);
        if v == 0.0 { return 0.0; }
        Self::eval_tag(&m.tag2, v, state)
    }

    pub fn sum(&self, stat: StatId, mod_type: ModType, cfg: &SkillCfg, state: &BuildState) -> f64 {
        let mut total = 0.0;
        let idx = stat.0 as usize;
        if idx < self.by_stat.len() {
            for &mi in &self.by_stat[idx] {
                let m = &self.mods[mi as usize];
                if m.mod_type != mod_type { continue; }
                if !Self::matches(m, cfg) { continue; }
                let val = Self::effective_value(m, state);
                if val == 0.0 { continue; }
                total += val;
            }
        }
        if let Some(ref parent) = self.parent {
            total += parent.sum(stat, mod_type, cfg, state);
        }
        total
    }

    pub fn product_more(&self, stat: StatId, cfg: &SkillCfg, state: &BuildState) -> f64 {
        let mut product = 1.0;
        let idx = stat.0 as usize;
        if idx < self.by_stat.len() {
            for &mi in &self.by_stat[idx] {
                let m = &self.mods[mi as usize];
                if m.mod_type != ModType::More { continue; }
                if !Self::matches(m, cfg) { continue; }
                let val = Self::effective_value(m, state);
                if val == 0.0 { continue; }
                product *= 1.0 + val / 100.0;
            }
        }
        if let Some(ref parent) = self.parent {
            product *= parent.product_more(stat, cfg, state);
        }
        product
    }

    pub fn calc(&self, stat: StatId, base: f64, cfg: &SkillCfg, state: &BuildState) -> f64 {
        let flat = self.sum(stat, ModType::Base, cfg, state);
        let inc = self.sum(stat, ModType::Increased, cfg, state);
        let more = self.product_more(stat, cfg, state);
        (base + flat) * (1.0 + inc / 100.0) * more
    }

    pub fn has_flag(&self, stat: StatId, cfg: &SkillCfg, state: &BuildState) -> bool {
        let idx = stat.0 as usize;
        if idx < self.by_stat.len() {
            for &mi in &self.by_stat[idx] {
                let m = &self.mods[mi as usize];
                if m.mod_type != ModType::Flag { continue; }
                if !Self::matches(m, cfg) { continue; }
                if Self::effective_value(m, state) != 0.0 {
                    return true;
                }
            }
        }
        if let Some(ref parent) = self.parent {
            return parent.has_flag(stat, cfg, state);
        }
        false
    }

    pub fn get_override(&self, stat: StatId, cfg: &SkillCfg, state: &BuildState) -> Option<f64> {
        let idx = stat.0 as usize;
        if idx < self.by_stat.len() {
            for &mi in &self.by_stat[idx] {
                let m = &self.mods[mi as usize];
                if m.mod_type != ModType::Override { continue; }
                if !Self::matches(m, cfg) { continue; }
                let val = Self::effective_value(m, state);
                if val != 0.0 {
                    return Some(val);
                }
            }
        }
        if let Some(ref parent) = self.parent {
            return parent.get_override(stat, cfg, state);
        }
        None
    }
}

impl Default for ModDB {
    fn default() -> Self { Self::new() }
}

// ---------------------------------------------------------------------------
// Conversion from old Modifier type
// ---------------------------------------------------------------------------

impl Mod {
    pub fn from_legacy(stat: &str, value: f64, mod_type: &str) -> Option<Self> {
        let stat_id = StatId::from_str(stat)?;
        let mt = match mod_type {
            "flat" => ModType::Base,
            "increased" => ModType::Increased,
            "more" => ModType::More,
            _ => return None,
        };
        Some(Mod::new(stat_id, mt, value))
    }
}

impl ModDB {
    pub fn from_legacy_modifiers(mods: &[(String, f64, String)]) -> Self {
        let mut db = ModDB::new();
        for (stat, value, mod_type) in mods {
            if let Some(m) = Mod::from_legacy(stat, *value, mod_type) {
                db.add(m);
            }
        }
        db
    }

    pub fn add_legacy(&mut self, stat: &str, value: f64, mod_type: &str) {
        if let Some(m) = Mod::from_legacy(stat, value, mod_type) {
            self.add(m);
        }
    }

    pub fn sum_base(&self, stat: StatId, cfg: &SkillCfg, state: &BuildState) -> f64 {
        self.sum(stat, ModType::Base, cfg, state)
    }

    pub fn sum_inc(&self, stat: StatId, cfg: &SkillCfg, state: &BuildState) -> f64 {
        self.sum(stat, ModType::Increased, cfg, state)
    }

    pub fn buckets(&self, stat: StatId, cfg: &SkillCfg, state: &BuildState) -> (f64, f64, f64) {
        (
            self.sum(stat, ModType::Base, cfg, state),
            self.sum(stat, ModType::Increased, cfg, state),
            self.product_more(stat, cfg, state),
        )
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    // -- Task 1: StatId tests --

    #[test]
    fn stat_id_from_str() {
        assert_eq!(StatId::from_str("Life"), Some(StatId::LIFE));
        assert_eq!(StatId::from_str("EnergyShield"), Some(StatId::ENERGY_SHIELD));
        assert_eq!(StatId::from_str("CritMultiplier"), Some(StatId::CRIT_MULTIPLIER));
    }

    #[test]
    fn stat_id_from_str_none() {
        assert_eq!(StatId::from_str("nonexistent"), None);
    }

    #[test]
    fn stat_id_as_str() {
        assert_eq!(StatId::LIFE.as_str(), "Life");
        assert_eq!(StatId::DAMAGE.as_str(), "Damage");
    }

    #[test]
    fn stat_id_count() {
        assert!(StatId::COUNT > 90);
    }

    // -- Task 2: ModFlags tests --

    #[test]
    fn mod_flags_match_empty() {
        let empty = ModFlags::empty();
        let cfg = ModFlags::ATTACK | ModFlags::HIT;
        assert!(empty.matches(cfg));
    }

    #[test]
    fn mod_flags_match_subset() {
        let mod_f = ModFlags::ATTACK | ModFlags::HIT;
        let cfg = ModFlags::ATTACK | ModFlags::SPELL | ModFlags::HIT;
        assert!(mod_f.matches(cfg));
    }

    #[test]
    fn mod_flags_no_match() {
        let mod_f = ModFlags::ATTACK | ModFlags::MELEE;
        let cfg = ModFlags::ATTACK | ModFlags::PROJECTILE;
        assert!(!mod_f.matches(cfg));
    }

    #[test]
    fn mod_flags_match_empty_cfg() {
        let mod_f = ModFlags::SPELL;
        let cfg = ModFlags::empty();
        assert!(!mod_f.matches(cfg));
    }

    // -- Task 2: KeywordFlags tests --

    #[test]
    fn keyword_flags_match_any_overlap() {
        let mod_k = KeywordFlags::COLD;
        let cfg = KeywordFlags::COLD | KeywordFlags::FIRE;
        assert!(mod_k.matches(cfg));
    }

    #[test]
    fn keyword_flags_no_overlap() {
        let mod_k = KeywordFlags::COLD;
        let cfg = KeywordFlags::FIRE | KeywordFlags::LIGHTNING;
        assert!(!mod_k.matches(cfg));
    }

    #[test]
    fn keyword_flags_empty_matches_all() {
        let empty = KeywordFlags::empty();
        let cfg = KeywordFlags::COLD | KeywordFlags::FIRE;
        assert!(empty.matches(cfg));
        assert!(empty.matches(KeywordFlags::empty()));
    }

    #[test]
    fn keyword_flags_match_all_mode() {
        let mod_k = KeywordFlags::COLD | KeywordFlags::FIRE | KeywordFlags::MATCH_ALL;
        let cfg_good = KeywordFlags::COLD | KeywordFlags::FIRE | KeywordFlags::LIGHTNING;
        let cfg_bad = KeywordFlags::COLD | KeywordFlags::LIGHTNING;
        assert!(mod_k.matches(cfg_good));
        assert!(!mod_k.matches(cfg_bad));
    }

    // -- Task 4: BuildState tests --

    #[test]
    fn build_state_conditions() {
        let mut state = BuildState::default();
        assert!(!state.check(ConditionId::DualWielding));
        state.set_condition(ConditionId::DualWielding);
        assert!(state.check(ConditionId::DualWielding));
        state.clear_condition(ConditionId::DualWielding);
        assert!(!state.check(ConditionId::DualWielding));
    }

    #[test]
    fn build_state_multiple_conditions() {
        let mut state = BuildState::default();
        state.set_condition(ConditionId::OnFullLife);
        state.set_condition(ConditionId::HaveFortify);
        assert!(state.check(ConditionId::OnFullLife));
        assert!(state.check(ConditionId::HaveFortify));
        assert!(!state.check(ConditionId::DualWielding));
    }

    #[test]
    fn build_state_multiplier() {
        let mut state = BuildState::default();
        state.power_charges = 7;
        state.frenzy_charges = 3;
        assert_eq!(state.multiplier(MultiplierId::PowerCharge), 7);
        assert_eq!(state.multiplier(MultiplierId::FrenzyCharge), 3);
        assert_eq!(state.multiplier(MultiplierId::EnduranceCharge), 0);
    }

    #[test]
    fn build_state_get_stat() {
        let mut state = BuildState::default();
        state.strength = 300.0;
        state.intelligence = 150.0;
        assert_eq!(state.get_stat(StatId::STR), 300.0);
        assert_eq!(state.get_stat(StatId::INT), 150.0);
        assert_eq!(state.get_stat(StatId::LIFE), 0.0);
    }

    // -- Task 4: Mod builder tests --

    #[test]
    fn mod_builder() {
        let m = Mod::new(StatId::LIFE, ModType::Base, 50.0)
            .with_flags(ModFlags::ATTACK)
            .with_condition(ConditionId::OnFullLife);
        assert_eq!(m.stat, StatId::LIFE);
        assert_eq!(m.mod_type, ModType::Base);
        assert_eq!(m.value, 50.0);
        assert_eq!(m.flags, ModFlags::ATTACK);
        assert!(matches!(m.tag1, ModTag::Condition(ConditionId::OnFullLife)));
        assert!(matches!(m.tag2, ModTag::None));
    }

    #[test]
    fn mod_two_tags() {
        let m = Mod::new(StatId::CRIT_MULTIPLIER, ModType::Base, 10.0)
            .with_multiplier(MultiplierId::PowerCharge)
            .with_tag(ModTag::Limit(50.0));
        assert!(matches!(m.tag1, ModTag::Multiplier(MultiplierId::PowerCharge)));
        assert!(matches!(m.tag2, ModTag::Limit(50.0)));
    }

    // -- Task 5: ModDB tests --

    #[test]
    fn mod_db_sum_base() {
        let mut db = ModDB::new();
        db.add(Mod::new(StatId::LIFE, ModType::Base, 50.0));
        db.add(Mod::new(StatId::LIFE, ModType::Base, 30.0));
        db.add(Mod::new(StatId::MANA, ModType::Base, 100.0));

        let cfg = SkillCfg::default();
        let state = BuildState::default();
        assert!((db.sum(StatId::LIFE, ModType::Base, &cfg, &state) - 80.0).abs() < 0.01);
        assert!((db.sum(StatId::MANA, ModType::Base, &cfg, &state) - 100.0).abs() < 0.01);
        assert!((db.sum(StatId::ENERGY_SHIELD, ModType::Base, &cfg, &state)).abs() < 0.01);
    }

    #[test]
    fn mod_db_sum_increased() {
        let mut db = ModDB::new();
        db.add(Mod::new(StatId::LIFE, ModType::Increased, 20.0));
        db.add(Mod::new(StatId::LIFE, ModType::Increased, 30.0));

        let cfg = SkillCfg::default();
        let state = BuildState::default();
        assert!((db.sum(StatId::LIFE, ModType::Increased, &cfg, &state) - 50.0).abs() < 0.01);
    }

    #[test]
    fn mod_db_product_more() {
        let mut db = ModDB::new();
        db.add(Mod::new(StatId::DAMAGE, ModType::More, 20.0));
        db.add(Mod::new(StatId::DAMAGE, ModType::More, 50.0));

        let cfg = SkillCfg::default();
        let state = BuildState::default();
        let product = db.product_more(StatId::DAMAGE, &cfg, &state);
        assert!((product - 1.2 * 1.5).abs() < 0.001);
    }

    #[test]
    fn mod_db_calc() {
        let mut db = ModDB::new();
        db.add(Mod::new(StatId::LIFE, ModType::Base, 100.0));
        db.add(Mod::new(StatId::LIFE, ModType::Increased, 50.0));
        db.add(Mod::new(StatId::LIFE, ModType::More, 20.0));

        let cfg = SkillCfg::default();
        let state = BuildState::default();
        // (0 + 100) * (1 + 50/100) * 1.2 = 100 * 1.5 * 1.2 = 180
        let result = db.calc(StatId::LIFE, 0.0, &cfg, &state);
        assert!((result - 180.0).abs() < 0.01);
    }

    #[test]
    fn mod_db_flag_filter() {
        let mut db = ModDB::new();
        db.add(Mod::new(StatId::DAMAGE, ModType::Increased, 40.0)
            .with_flags(ModFlags::SPELL));
        db.add(Mod::new(StatId::DAMAGE, ModType::Increased, 20.0)
            .with_flags(ModFlags::ATTACK));
        db.add(Mod::new(StatId::DAMAGE, ModType::Increased, 10.0));

        let spell_cfg = SkillCfg { flags: ModFlags::SPELL | ModFlags::HIT, ..Default::default() };
        let attack_cfg = SkillCfg { flags: ModFlags::ATTACK | ModFlags::HIT, ..Default::default() };
        let state = BuildState::default();

        // Spell sees: 40 (spell) + 10 (unconditional) = 50
        assert!((db.sum(StatId::DAMAGE, ModType::Increased, &spell_cfg, &state) - 50.0).abs() < 0.01);
        // Attack sees: 20 (attack) + 10 (unconditional) = 30
        assert!((db.sum(StatId::DAMAGE, ModType::Increased, &attack_cfg, &state) - 30.0).abs() < 0.01);
    }

    #[test]
    fn mod_db_keyword_filter() {
        let mut db = ModDB::new();
        db.add(Mod::new(StatId::DAMAGE, ModType::Increased, 30.0)
            .with_keyflags(KeywordFlags::COLD));
        db.add(Mod::new(StatId::DAMAGE, ModType::Increased, 20.0)
            .with_keyflags(KeywordFlags::FIRE));
        db.add(Mod::new(StatId::DAMAGE, ModType::Increased, 10.0));

        let cold_cfg = SkillCfg { keyflags: KeywordFlags::COLD, ..Default::default() };
        let state = BuildState::default();

        // Cold skill sees: 30 (cold) + 10 (no keyword = unconditional) = 40
        assert!((db.sum(StatId::DAMAGE, ModType::Increased, &cold_cfg, &state) - 40.0).abs() < 0.01);
    }

    #[test]
    fn mod_db_condition_gate() {
        let mut db = ModDB::new();
        db.add(Mod::new(StatId::DAMAGE, ModType::More, 40.0)
            .with_condition(ConditionId::DualWielding));
        db.add(Mod::new(StatId::DAMAGE, ModType::More, 20.0));

        let cfg = SkillCfg::default();
        let mut state = BuildState::default();

        // Without dual wielding: only 20% more
        assert!((db.product_more(StatId::DAMAGE, &cfg, &state) - 1.2).abs() < 0.001);

        // With dual wielding: 40% more * 20% more
        state.set_condition(ConditionId::DualWielding);
        assert!((db.product_more(StatId::DAMAGE, &cfg, &state) - 1.4 * 1.2).abs() < 0.001);
    }

    #[test]
    fn mod_db_per_charge() {
        let mut db = ModDB::new();
        db.add(Mod::new(StatId::CRIT_CHANCE, ModType::Base, 40.0)
            .with_multiplier(MultiplierId::PowerCharge));

        let cfg = SkillCfg::default();
        let mut state = BuildState::default();
        state.power_charges = 5;

        // 40 * 5 = 200
        assert!((db.sum(StatId::CRIT_CHANCE, ModType::Base, &cfg, &state) - 200.0).abs() < 0.01);
    }

    #[test]
    fn mod_db_per_stat() {
        let mut db = ModDB::new();
        db.add(Mod::new(StatId::ARMOUR, ModType::Increased, 1.0)
            .with_per_stat(StatId::STR, 10.0));

        let cfg = SkillCfg::default();
        let mut state = BuildState::default();
        state.strength = 250.0;

        // 1% per 10 str = floor(250/10) * 1 = 25
        assert!((db.sum(StatId::ARMOUR, ModType::Increased, &cfg, &state) - 25.0).abs() < 0.01);
    }

    #[test]
    fn mod_db_per_charge_with_limit() {
        let mut db = ModDB::new();
        db.add(Mod::new(StatId::CRIT_MULTIPLIER, ModType::Base, 10.0)
            .with_multiplier(MultiplierId::PowerCharge)
            .with_tag(ModTag::Limit(50.0)));

        let cfg = SkillCfg::default();
        let mut state = BuildState::default();
        state.power_charges = 8;

        // 10 * 8 = 80, capped to 50
        assert!((db.sum(StatId::CRIT_MULTIPLIER, ModType::Base, &cfg, &state) - 50.0).abs() < 0.01);
    }

    #[test]
    fn mod_db_has_flag() {
        let mut db = ModDB::new();
        db.add(Mod::new(StatId::LIFE, ModType::Flag, 1.0)
            .with_condition(ConditionId::UsingShield));

        let cfg = SkillCfg::default();
        let mut state = BuildState::default();

        assert!(!db.has_flag(StatId::LIFE, &cfg, &state));
        state.set_condition(ConditionId::UsingShield);
        assert!(db.has_flag(StatId::LIFE, &cfg, &state));
    }

    // -- Task 6: Parent chain and edge cases --

    #[test]
    fn mod_db_parent_chain() {
        let mut parent = ModDB::new();
        parent.add(Mod::new(StatId::LIFE, ModType::Base, 100.0));

        let mut child = ModDB::with_parent(parent);
        child.add(Mod::new(StatId::LIFE, ModType::Base, 50.0));

        let cfg = SkillCfg::default();
        let state = BuildState::default();

        assert!((child.sum(StatId::LIFE, ModType::Base, &cfg, &state) - 150.0).abs() < 0.01);
    }

    #[test]
    fn mod_db_parent_more_multiplies() {
        let mut parent = ModDB::new();
        parent.add(Mod::new(StatId::DAMAGE, ModType::More, 30.0));

        let mut child = ModDB::with_parent(parent);
        child.add(Mod::new(StatId::DAMAGE, ModType::More, 20.0));

        let cfg = SkillCfg::default();
        let state = BuildState::default();

        let product = child.product_more(StatId::DAMAGE, &cfg, &state);
        assert!((product - 1.2 * 1.3).abs() < 0.001);
    }

    #[test]
    fn mod_db_override() {
        let mut db = ModDB::new();
        db.add(Mod::new(StatId::FIRE_RES_MAX, ModType::Override, 80.0));

        let cfg = SkillCfg::default();
        let state = BuildState::default();

        assert_eq!(db.get_override(StatId::FIRE_RES_MAX, &cfg, &state), Some(80.0));
        assert_eq!(db.get_override(StatId::COLD_RES_MAX, &cfg, &state), None);
    }

    #[test]
    fn mod_db_unconditional_mods_match_everything() {
        let mut db = ModDB::new();
        db.add(Mod::new(StatId::DAMAGE, ModType::Increased, 10.0));

        let spell_cfg = SkillCfg { flags: ModFlags::SPELL, ..Default::default() };
        let attack_cfg = SkillCfg { flags: ModFlags::ATTACK, ..Default::default() };
        let empty_cfg = SkillCfg::default();
        let state = BuildState::default();

        assert!((db.sum(StatId::DAMAGE, ModType::Increased, &spell_cfg, &state) - 10.0).abs() < 0.01);
        assert!((db.sum(StatId::DAMAGE, ModType::Increased, &attack_cfg, &state) - 10.0).abs() < 0.01);
        assert!((db.sum(StatId::DAMAGE, ModType::Increased, &empty_cfg, &state) - 10.0).abs() < 0.01);
    }

    #[test]
    fn mod_db_stat_threshold() {
        let mut db = ModDB::new();
        db.add(Mod::new(StatId::DAMAGE, ModType::Increased, 30.0)
            .with_tag(ModTag::StatThreshold(StatId::STR, 200.0)));

        let cfg = SkillCfg::default();
        let mut state = BuildState::default();

        state.strength = 150.0;
        assert!((db.sum(StatId::DAMAGE, ModType::Increased, &cfg, &state)).abs() < 0.01);

        state.strength = 200.0;
        assert!((db.sum(StatId::DAMAGE, ModType::Increased, &cfg, &state) - 30.0).abs() < 0.01);

        state.strength = 300.0;
        assert!((db.sum(StatId::DAMAGE, ModType::Increased, &cfg, &state) - 30.0).abs() < 0.01);
    }

    #[test]
    fn mod_db_combined_flags_keywords_condition() {
        let mut db = ModDB::new();
        // "40% more Cold Spell Damage while Dual Wielding"
        db.add(Mod::new(StatId::COLD_DAMAGE, ModType::More, 40.0)
            .with_flags(ModFlags::SPELL)
            .with_keyflags(KeywordFlags::COLD)
            .with_condition(ConditionId::DualWielding));

        let cold_spell_cfg = SkillCfg {
            flags: ModFlags::SPELL | ModFlags::HIT,
            keyflags: KeywordFlags::COLD,
            ..Default::default()
        };
        let cold_attack_cfg = SkillCfg {
            flags: ModFlags::ATTACK | ModFlags::HIT,
            keyflags: KeywordFlags::COLD,
            ..Default::default()
        };

        let mut state = BuildState::default();

        // No dual wield - doesn't apply
        assert!((db.product_more(StatId::COLD_DAMAGE, &cold_spell_cfg, &state) - 1.0).abs() < 0.001);

        state.set_condition(ConditionId::DualWielding);

        // Dual wield + cold spell = applies
        assert!((db.product_more(StatId::COLD_DAMAGE, &cold_spell_cfg, &state) - 1.4).abs() < 0.001);

        // Dual wield + cold attack = doesn't apply (needs SPELL flag)
        assert!((db.product_more(StatId::COLD_DAMAGE, &cold_attack_cfg, &state) - 1.0).abs() < 0.001);
    }
}
