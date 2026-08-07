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

/// Parse a PoE stat description line into zero or more Modifiers.
pub fn parse_stat_line(line: &str) -> Vec<Modifier> {
    let line = line.trim();
    if line.is_empty() {
        return vec![];
    }

    // Pre-pass: replace (X-Y) ranges with midpoint
    let line = &strip_ranges(line);

    let mut mods = Vec::new();

    // --- Nearby Enemies resistance reduction (treated as penetration) --------
    // Must come before resistance patterns to avoid matching as player res
    {
        let lower = line.to_lowercase();
        if lower.contains("nearby enemies have") && lower.contains("resistance") {
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
            if !mods.is_empty() {
                return mods;
            }
        }
    }

    // --- Life ---------------------------------------------------------------
    if let Some(val) = extract_value(line, "to maximum life") {
        mods.push(flat("Life", val));
    }
    if let Some(val) = extract_pct(line, "increased maximum life") {
        mods.push(increased("Life", val));
    }
    if let Some(val) = extract_pct(line, "more maximum life") {
        mods.push(more("Life", val));
    }

    // --- Energy Shield ------------------------------------------------------
    if let Some(val) = extract_value(line, "to maximum energy shield") {
        mods.push(flat("EnergyShield", val));
    }
    if let Some(val) = extract_pct(line, "increased maximum energy shield") {
        mods.push(increased("EnergyShield", val));
    } else if let Some(val) = extract_pct(line, "increased energy shield") {
        mods.push(increased("EnergyShield", val));
    }
    if let Some(val) = extract_pct(line, "more energy shield") {
        mods.push(more("EnergyShield", val));
    }

    // --- Mana ---------------------------------------------------------------
    if let Some(val) = extract_value(line, "to maximum mana") {
        mods.push(flat("Mana", val));
    }
    if let Some(val) = extract_pct(line, "increased maximum mana") {
        mods.push(increased("Mana", val));
    } else if let Some(val) = extract_pct(line, "increased mana") {
        let l = line.to_lowercase();
        if !l.contains("mana regen") && !l.contains("mana cost") && !l.contains("mana reservation") {
            mods.push(increased("Mana", val));
        }
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
    if let Some(val) = extract_pct_value(line, "to all resistances") {
        mods.push(flat("FireRes", val));
        mods.push(flat("ColdRes", val));
        mods.push(flat("LightningRes", val));
        mods.push(flat("ChaosRes", val));
    }
    // Combined dual-resistance patterns: "to Fire and Lightning Resistances"
    {
        let lower = line.to_lowercase();
        if lower.contains("resistances") && !lower.contains("all") {
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
    }

    // --- Armour / Evasion ---------------------------------------------------
    {
        let lower = line.to_lowercase();
        let is_combined = (lower.contains("armour") && lower.contains("evasion"))
            || (lower.contains("evasion") && lower.contains("energy shield"));

        if !is_combined {
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
        }
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

    // --- Projectile / Area / Melee damage ------------------------------------
    {
        let lower = line.to_lowercase();
        let is_minion = lower.contains("minions") || lower.contains("allies");
        if !is_minion {
            if let Some(val) = extract_pct(line, "increased projectile damage") {
                mods.push(increased("ProjectileDamage", val));
            }
            if let Some(val) = extract_pct(line, "increased area damage") {
                mods.push(increased("AreaDamage", val));
            }
            if let Some(val) = extract_pct(line, "increased melee damage") {
                mods.push(increased("MeleeDamage", val));
            }
            if let Some(val) = extract_pct(line, "increased elemental damage with attack skills") {
                mods.push(increased("Damage", val));
            }
            if let Some(val) = extract_pct(line, "increased projectile speed") {
                mods.push(increased("ProjectileSpeed", val));
            }
        }
    }

    // --- Combined Evasion and Armour / Evasion and Energy Shield -----------
    {
        let lower = line.to_lowercase();
        if lower.contains("evasion") && lower.contains("armour") && lower.contains("increased") {
            if let Some(val) = extract_pct(line, "increased evasion rating and armour") {
                mods.push(increased("Evasion", val));
                mods.push(increased("Armour", val));
            } else if let Some(val) = extract_pct(line, "increased armour and evasion") {
                mods.push(increased("Armour", val));
                mods.push(increased("Evasion", val));
            }
        }
        if lower.contains("evasion") && lower.contains("energy shield") && lower.contains("increased") {
            if let Some(val) = extract_pct(line, "increased evasion and energy shield") {
                mods.push(increased("Evasion", val));
                mods.push(increased("EnergyShield", val));
            }
        }
    }

    // --- Max resistances ---------------------------------------------------
    if let Some(val) = extract_pct_value(line, "to all maximum elemental resistances") {
        mods.push(flat("FireResMax", val));
        mods.push(flat("ColdResMax", val));
        mods.push(flat("LightningResMax", val));
    } else {
        if let Some(val) = extract_pct_value(line, "to maximum fire resistance") {
            mods.push(flat("FireResMax", val));
        }
        if let Some(val) = extract_pct_value(line, "to maximum cold resistance") {
            mods.push(flat("ColdResMax", val));
        }
        if let Some(val) = extract_pct_value(line, "to maximum lightning resistance") {
            mods.push(flat("LightningResMax", val));
        }
    }

    // --- DoT Multiplier ----------------------------------------------------
    if let Some(val) = extract_pct_value(line, "to damage over time multiplier") {
        mods.push(flat("DamageOverTimeMulti", val));
    }

    // --- Life Regen --------------------------------------------------------
    {
        let lower = line.to_lowercase();
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

    // --- Mana Regen --------------------------------------------------------
    if let Some(val) = extract_pct(line, "increased mana regeneration rate") {
        mods.push(increased("ManaRegen", val));
    }

    // --- Movement Speed ----------------------------------------------------
    if let Some(val) = extract_pct(line, "increased movement speed") {
        mods.push(increased("MovementSpeed", val));
    }

    // --- Leech -------------------------------------------------------------
    {
        let lower = line.to_lowercase();
        if lower.contains("leeched as life") {
            if let Some(val) = extract_pct(line, "of attack damage leeched as life") {
                mods.push(flat("LifeLeechPct", val));
            } else if let Some(val) = extract_pct(line, "of physical attack damage leeched as life") {
                mods.push(flat("LifeLeechPct", val));
            } else if let Some(val) = extract_pct(line, "of damage leeched as life") {
                mods.push(flat("LifeLeechPct", val));
            }
        }
        if lower.contains("leeched as energy shield") {
            if let Some(val) = extract_pct(line, "of damage leeched as energy shield") {
                mods.push(flat("ESLeechPct", val));
            }
        }
    }

    // --- Mana Reservation Efficiency ---------------------------------------
    if let Some(val) = extract_pct(line, "increased mana reservation efficiency") {
        mods.push(increased("ManaReservationEfficiency", val));
    }

    // --- Skill Duration ----------------------------------------------------
    if let Some(val) = extract_pct(line, "increased skill effect duration") {
        mods.push(increased("SkillDuration", val));
    }

    // --- Area of Effect ----------------------------------------------------
    if let Some(val) = extract_pct(line, "increased area of effect") {
        mods.push(increased("AreaOfEffect", val));
    }

    // --- Global Crit (matches "increased Global Critical Strike Chance") ---
    if let Some(val) = extract_pct(line, "increased global critical strike chance") {
        mods.push(increased("CritChance", val));
    }

    // --- Speed --------------------------------------------------------------
    if let Some(val) = extract_pct(line, "increased attack speed") {
        mods.push(increased("AttackSpeed", val));
    }
    if let Some(val) = extract_pct(line, "increased cast speed") {
        mods.push(increased("AttackSpeed", val));
    }
    // "increased Attack and Cast Speed" - both in one line
    if let Some(val) = extract_pct(line, "increased attack and cast speed") {
        mods.push(increased("AttackSpeed", val));
    }

    // --- Crit ---------------------------------------------------------------
    if !line.to_lowercase().contains("global") {
        if let Some(val) = extract_pct(line, "increased critical strike chance") {
            mods.push(increased("CritChance", val));
        }
    }
    {
        let lower = line.to_lowercase();
        if lower.contains("critical strike multiplier") {
            if let Some(val) = extract_pct_value(line, "to global critical strike multiplier") {
                mods.push(flat("CritMultiplier", val));
            } else if let Some(val) = extract_pct_value(line, "critical strike multiplier for spells") {
                mods.push(flat("CritMultiplier", val));
            } else if let Some(val) = extract_pct_value(line, "to critical strike multiplier") {
                mods.push(flat("CritMultiplier", val));
            }
        }
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

    // --- Gain as extra damage -----------------------------------------------
    {
        let lower = line.to_lowercase();
        if lower.contains("gain") && lower.contains("as extra") {
            if lower.contains("physical") && lower.contains("fire") {
                if let Some(val) = extract_pct(line, "of physical damage as extra fire damage") {
                    mods.push(flat("PhysGainAsFire", val));
                }
            }
            if lower.contains("physical") && lower.contains("cold") {
                if let Some(val) = extract_pct(line, "of physical damage as extra cold damage") {
                    mods.push(flat("PhysGainAsCold", val));
                }
            }
            if lower.contains("physical") && lower.contains("lightning") {
                if let Some(val) = extract_pct(line, "of physical damage as extra lightning damage") {
                    mods.push(flat("PhysGainAsLightning", val));
                }
            }
            if lower.contains("physical") && lower.contains("chaos") {
                if let Some(val) = extract_pct(line, "of physical damage as extra chaos damage") {
                    mods.push(flat("PhysGainAsChaos", val));
                }
            }
        }
    }

    // --- Impale -------------------------------------------------------------
    {
        let lower = line.to_lowercase();
        if lower.contains("chance to impale") {
            if let Some(val) = extract_pct_value(line, "chance to impale") {
                mods.push(flat("ImpaleChance", val));
            }
        }
        if lower.contains("impale effect") {
            if let Some(val) = extract_pct(line, "increased impale effect") {
                mods.push(increased("ImpaleEffect", val));
            }
        }
    }

    // --- Ward ---------------------------------------------------------------
    if let Some(val) = extract_value(line, "to ward") {
        mods.push(flat("Ward", val));
    }

    // --- ES Recharge --------------------------------------------------------
    if let Some(val) = extract_pct(line, "faster start of energy shield recharge") {
        mods.push(increased("ESRechargeRate", val));
    }
    if let Some(val) = extract_pct(line, "increased energy shield recharge rate") {
        mods.push(increased("ESRechargeRate", val));
    }

    // --- Conversion --------------------------------------------------------
    {
        let lower = line.to_lowercase();
        if lower.contains("converted to") {
            if lower.contains("physical") && lower.contains("fire") {
                if let Some(val) = extract_pct(line, "of physical damage converted to fire damage") {
                    mods.push(flat("ConvPhysToFire", val));
                }
            }
            if lower.contains("physical") && lower.contains("cold") {
                if let Some(val) = extract_pct(line, "of physical damage converted to cold damage") {
                    mods.push(flat("ConvPhysToCold", val));
                }
            }
            if lower.contains("physical") && lower.contains("lightning") {
                if let Some(val) = extract_pct(line, "of physical damage converted to lightning damage") {
                    mods.push(flat("ConvPhysToLightning", val));
                }
            }
            if lower.contains("physical") && lower.contains("chaos") {
                if let Some(val) = extract_pct(line, "of physical damage converted to chaos damage") {
                    mods.push(flat("ConvPhysToChaos", val));
                }
            }
            if lower.contains("cold") && lower.contains("fire") && !lower.contains("physical") {
                if let Some(val) = extract_pct(line, "of cold damage converted to fire damage") {
                    mods.push(flat("ConvColdToFire", val));
                }
            }
            if lower.contains("lightning") && lower.contains("cold") && !lower.contains("physical") {
                if let Some(val) = extract_pct(line, "of lightning damage converted to cold damage") {
                    mods.push(flat("ConvLightningToCold", val));
                }
            }
        }
    }

    // --- Spell Suppression (alternate wording) -----------------------------
    if let Some(val) = extract_pct_value(line, "to spell suppression chance") {
        mods.push(flat("SpellSuppression", val));
    }

    // --- Fortify -----------------------------------------------------------
    if let Some(val) = extract_pct(line, "increased fortification") {
        mods.push(increased("Fortify", val));
    }

    // --- Gem levels --------------------------------------------------------
    {
        let lower = line.to_lowercase();
        if lower.contains("to level of all") && lower.contains("skill gems") {
            if let Some(val) = extract_value(line, "to level of all") {
                mods.push(flat("GemLevel", val));
                mods.push(more("Damage", val * 8.0));
            }
        }
    }

    // --- Totem / Brand / Trap / Mine damage --------------------------------
    {
        let lower = line.to_lowercase();
        if !lower.contains("minion") {
            if let Some(val) = extract_pct(line, "increased totem damage") {
                mods.push(increased("Damage", val));
            }
            if let Some(val) = extract_pct(line, "increased trap damage") {
                mods.push(increased("Damage", val));
            }
            if let Some(val) = extract_pct(line, "increased mine damage") {
                mods.push(increased("Damage", val));
            }
            if let Some(val) = extract_pct(line, "increased brand damage") {
                mods.push(increased("Damage", val));
            }
        }
    }

    // --- Flask effect -------------------------------------------------------
    if let Some(val) = extract_pct(line, "increased flask effect") {
        mods.push(increased("FlaskEffect", val));
    }

    // --- Cooldown recovery --------------------------------------------------
    if let Some(val) = extract_pct(line, "increased cooldown recovery rate") {
        mods.push(increased("CooldownRecovery", val));
    }

    // --- Spell block -------------------------------------------------------
    if let Some(val) = extract_pct_value(line, "chance to block spell damage") {
        mods.push(flat("SpellBlockChance", val));
    }

    // --- Elemental ailment avoidance ----------------------------------------
    if let Some(val) = extract_pct_value(line, "chance to avoid elemental ailments") {
        mods.push(flat("AilmentAvoidance", val));
    }

    // --- Stun avoidance ----------------------------------------------------
    if let Some(val) = extract_pct_value(line, "chance to avoid being stunned") {
        mods.push(flat("StunAvoidance", val));
    }

    // --- ES Regen (flat) ----------------------------------------------------
    {
        let lower = line.to_lowercase();
        if lower.contains("regenerate") && lower.contains("energy shield per second") {
            if let Some(val) = extract_pct(line, "of energy shield per second") {
                mods.push(flat("ESRegen", val));
            } else if let Some(val) = extract_value(line, "energy shield per second") {
                mods.push(flat("ESRegen", val));
            }
        }
    }

    // --- Mana Regen (flat) --------------------------------------------------
    {
        let lower = line.to_lowercase();
        if lower.contains("regenerate") && lower.contains("mana per second") {
            if let Some(val) = extract_value(line, "mana per second") {
                mods.push(flat("ManaRegen", val));
            }
        }
    }

    // --- Spell-specific crit chance ------------------------------------------
    {
        let lower = line.to_lowercase();
        if lower.contains("spell critical strike chance") {
            if let Some(val) = extract_pct(line, "increased spell critical strike chance") {
                mods.push(increased("CritChance", val));
            }
        }
    }

    // --- Cast Speed (separate from Attack Speed) ----------------------------
    {
        let lower = line.to_lowercase();
        if lower.contains("more cast speed") {
            if let Some(val) = extract_pct(line, "more cast speed") {
                mods.push(more("AttackSpeed", val));
            }
        }
    }

    // --- Conversion (alternate wording: "X% of Physical Damage taken as") ---
    {
        let lower = line.to_lowercase();
        if lower.contains("damage") && (lower.contains("taken as") || lower.contains("converted to")) {
            if !lower.contains("converted to") {
                // "taken as" variants - damage shift, not calc-affecting in same way
                // but still useful to track
            }
        }
    }

    // --- Life on hit / kill -------------------------------------------------
    if let Some(val) = extract_value(line, "life gained on hit") {
        mods.push(flat("LifeOnHit", val));
    }
    if let Some(val) = extract_value(line, "life gained on kill") {
        mods.push(flat("LifeOnKill", val));
    }
    if let Some(val) = extract_value(line, "mana gained on kill") {
        mods.push(flat("ManaOnKill", val));
    }

    // --- Maximum Charges ----------------------------------------------------
    {
        let lower = line.to_lowercase();
        if lower.contains("maximum power charge") {
            if let Some(val) = extract_value(line, "to maximum power charges") {
                mods.push(flat("MaxPowerCharges", val));
            } else if let Some(val) = extract_value(line, "maximum power charges") {
                mods.push(flat("MaxPowerCharges", val));
            }
        }
        if lower.contains("maximum frenzy charge") {
            if let Some(val) = extract_value(line, "to maximum frenzy charges") {
                mods.push(flat("MaxFrenzyCharges", val));
            } else if let Some(val) = extract_value(line, "maximum frenzy charges") {
                mods.push(flat("MaxFrenzyCharges", val));
            }
        }
        if lower.contains("maximum endurance charge") {
            if let Some(val) = extract_value(line, "to maximum endurance charges") {
                mods.push(flat("MaxEnduranceCharges", val));
            } else if let Some(val) = extract_value(line, "maximum endurance charges") {
                mods.push(flat("MaxEnduranceCharges", val));
            }
        }
    }

    // --- Aura effect on self -------------------------------------------------
    {
        let lower = line.to_lowercase();
        if lower.contains("auras from your skills have") && lower.contains("increased effect") {
            if let Some(val) = extract_pct(line, "increased effect") {
                mods.push(increased("AuraEffectOnSelf", val));
            }
        }
    }

    // --- Duration / Effect ---------------------------------------------------
    {
        let lower = line.to_lowercase();
        if mods.is_empty() && lower.contains("increased") && lower.contains("duration") {
            if let Some(val) = extract_pct(line, "increased duration") {
                mods.push(increased("SkillDuration", val));
            }
        }

        if lower.contains("cooldown recovery") {
            if let Some(val) = extract_pct(line, "increased cooldown recovery") {
                mods.push(increased("CooldownRecovery", val));
            }
        }

        if mods.is_empty() && lower.contains("global critical strike chance") {
            if let Some(val) = extract_pct(line, "increased global critical strike chance") {
                mods.push(increased("CritChance", val));
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
    // Strip condition/flag suffixes before passing to the base parser
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

    // --- Range notation stripping ---

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

    // --- New patterns ---

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
        // Real unique item mod: "(100-120)% increased Evasion and Energy Shield"
        let mods = parse_stat_line("(100-120)% increased Evasion and Energy Shield");
        let stats: Vec<_> = mods.iter().map(|m| m.stat.as_str()).collect();
        assert!(stats.contains(&"Evasion"), "mods: {:?}", mods);
        assert!(stats.contains(&"EnergyShield"), "mods: {:?}", mods);
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

    // --- V2 parser tests: flags, conditions, multipliers ---

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
        // Note: "against Shocked Enemies" triggers the is_minion guard in v1 parser
        // for generic "Damage". Use a typed damage stat that bypasses it.
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

    // --- New pattern coverage tests ---

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
        // These are the most common patterns from real endgame builds
        let must_parse: Vec<(&str, &str)> = vec![
            // Conversion
            ("50% of Physical Damage converted to Fire Damage", "ConvPhysToFire"),
            ("50% of Cold Damage converted to Fire Damage", "ConvColdToFire"),
            // Added damage with context suffixes
            ("Adds 5 to 10 Cold Damage to Spells", "AddedColdMin"),
            ("Adds 5 to 10 Fire Damage to Attacks", "AddedFireMin"),
            // Regen
            ("Regenerate 20 Life per second", "LifeRegen"),
            ("Regenerate 1.5% of Life per second", "LifeRegenPct"),
            ("Regenerate 150 Energy Shield per second", "ESRegen"),
            ("Regenerate 5 Mana per second", "ManaRegen"),
            // Leech
            ("0.4% of Physical Attack Damage Leeched as Life", "LifeLeechPct"),
            ("0.5% of Damage Leeched as Energy Shield", "ESLeechPct"),
            // Speed
            ("5% increased Cast Speed", "AttackSpeed"),
            ("10% more Cast Speed", "AttackSpeed"),
            ("4% increased Attack and Cast Speed", "AttackSpeed"),
            // DoT
            ("20% increased Damage over Time", "DamageOverTime"),
            ("+5% to Damage over Time Multiplier", "DamageOverTimeMulti"),
            // Penetration
            ("Penetrates 10% Fire Resistance", "FirePenetration"),
            ("Damage Penetrates 5% Cold Resistance", "ColdPenetration"),
            ("Damage Penetrates 10% Elemental Resistances", "FirePenetration"),
            // Gain as extra
            ("Gain 15% of Physical Damage as Extra Cold Damage", "PhysGainAsCold"),
            // Gem level
            ("+1 to Level of all Spell Skill Gems", "GemLevel"),
            // AoE/proj
            ("8% increased Area of Effect", "AreaOfEffect"),
            ("10% increased Projectile Speed", "ProjectileSpeed"),
            // Movement
            ("10% increased Movement Speed", "MovementSpeed"),
            // ES
            ("67% increased Energy Shield", "EnergyShield"),
            ("(56-74)% increased Energy Shield", "EnergyShield"),
            ("15% more Energy Shield", "EnergyShield"),
            // Crit multi variants
            ("+20% to Global Critical Strike Multiplier", "CritMultiplier"),
            ("+30% to Critical Strike Multiplier for Spells", "CritMultiplier"),
            // Combined res
            ("+(17-20)% to Fire and Lightning Resistances", "FireRes"),
            // Nearby enemies resistance (treated as pen)
            ("Nearby Enemies have -10% to Fire Resistance", "FirePenetration"),
            ("Nearby Enemies have -9% to Cold Resistance", "ColdPenetration"),
            ("Nearby Enemies have -12% to Lightning Resistance", "LightningPenetration"),
            // Life regen alternate wording
            ("1% of Life Regenerated per second", "LifeRegenPct"),
            // More life
            ("10% more maximum Life", "Life"),
            // Increased accuracy (alternate wording)
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
}
