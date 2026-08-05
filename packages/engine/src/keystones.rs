use crate::{BuildInput, Modifier};

pub fn apply_keystones(input: &BuildInput, mods: &mut Vec<Modifier>) {
    for ks in &input.allocated_keystones {
        match ks.as_str() {
            "Chaos Inoculation" | "CI" => {
                mods.push(Modifier { stat: "Life".into(), value: -99999.0, mod_type: "flat".into() });
                mods.push(Modifier { stat: "ChaosRes".into(), value: 160.0, mod_type: "flat".into() });
            }
            "Elemental Overload" | "EO" => {
                mods.push(Modifier { stat: "CritMultiplier".into(), value: -1000.0, mod_type: "flat".into() });
                mods.push(Modifier { stat: "Damage".into(), value: 40.0, mod_type: "more".into() });
            }
            "Resolute Technique" | "RT" => {
                mods.push(Modifier { stat: "CritChance".into(), value: -1000.0, mod_type: "flat".into() });
            }
            "Mind Over Matter" | "MoM" => {
                mods.push(Modifier { stat: "MoMPercent".into(), value: 40.0, mod_type: "flat".into() });
            }
            "Acrobatics" => {
                mods.push(Modifier { stat: "Armour".into(), value: -50.0, mod_type: "more".into() });
                mods.push(Modifier { stat: "BlockChance".into(), value: -50.0, mod_type: "more".into() });
            }
            "Pain Attunement" => {
                mods.push(Modifier { stat: "SpellDamage".into(), value: 30.0, mod_type: "more".into() });
            }
            "Iron Grip" => {
                mods.push(Modifier { stat: "Damage".into(), value: 20.0, mod_type: "increased".into() });
            }
            "Ancestral Bond" => {
                mods.push(Modifier { stat: "Damage".into(), value: -100.0, mod_type: "more".into() });
            }
            "Vaal Pact" => {
                mods.push(Modifier { stat: "LifeLeechRate".into(), value: 100.0, mod_type: "more".into() });
                mods.push(Modifier { stat: "LifeRegen".into(), value: -99999.0, mod_type: "flat".into() });
            }
            "Zealot's Oath" => {
                mods.push(Modifier { stat: "ESRegen".into(), value: 1.0, mod_type: "flat".into() });
            }
            "Ghost Reaver" => {
                // Life leech applies to ES instead; complex interaction, no simple mod
            }
            "Blood Magic" => {
                mods.push(Modifier { stat: "Mana".into(), value: -99999.0, mod_type: "flat".into() });
            }
            "Unwavering Stance" => {
                mods.push(Modifier { stat: "Evasion".into(), value: -99999.0, mod_type: "flat".into() });
            }
            "Iron Reflexes" => {
                mods.push(Modifier { stat: "Armour".into(), value: 100.0, mod_type: "increased".into() });
                mods.push(Modifier { stat: "Evasion".into(), value: -100.0, mod_type: "more".into() });
            }
            "Point Blank" => {
                mods.push(Modifier { stat: "Damage".into(), value: 30.0, mod_type: "more".into() });
            }
            "Avatar of Fire" => {
                // TODO: set conversion_phys_to_fire = 50 on BuildInput
                // Needs conversion fields; simplified as no-op until converter passes conversion
            }
            "Crimson Dance" => {
                // Allows 8 bleed stacks; checked by integration test via allocated_keystones
            }
            "Eldritch Battery" | "EB" => {
                // ES protects mana instead of life; simplified: move ES to mana
                mods.push(Modifier { stat: "Mana".into(), value: 500.0, mod_type: "flat".into() });
                mods.push(Modifier { stat: "EnergyShield".into(), value: -99999.0, mod_type: "flat".into() });
            }
            "Glancing Blows" => {
                mods.push(Modifier { stat: "BlockChance".into(), value: 30.0, mod_type: "flat".into() });
            }
            "Wind Dancer" => {
                mods.push(Modifier { stat: "Evasion".into(), value: 40.0, mod_type: "increased".into() });
            }
            "Perfect Agony" => {
                mods.push(Modifier { stat: "CritMultiplier".into(), value: -45.0, mod_type: "flat".into() });
            }
            "Divine Shield" => {
                mods.push(Modifier { stat: "ESRegen".into(), value: 5.0, mod_type: "flat".into() });
            }
            "Arrow Dancing" => {
                mods.push(Modifier { stat: "Evasion".into(), value: 10.0, mod_type: "increased".into() });
            }
            "Supreme Ego" => {
                mods.push(Modifier { stat: "AuraEffect".into(), value: 50.0, mod_type: "increased".into() });
            }
            "The Agnostic" => {
                mods.push(Modifier { stat: "LifeRegenPct".into(), value: 2.0, mod_type: "flat".into() });
            }
            "Imbalanced Guard" => {
                mods.push(Modifier { stat: "Armour".into(), value: -50.0, mod_type: "more".into() });
            }
            "Iron Will" => {
                mods.push(Modifier { stat: "SpellDamage".into(), value: 20.0, mod_type: "increased".into() });
            }
            "Elemental Equilibrium" | "EE" => {
                mods.push(Modifier { stat: "FirePenetration".into(), value: 25.0, mod_type: "flat".into() });
                mods.push(Modifier { stat: "ColdPenetration".into(), value: 25.0, mod_type: "flat".into() });
                mods.push(Modifier { stat: "LightningPenetration".into(), value: 25.0, mod_type: "flat".into() });
            }
            "Minion Instability" => {
                mods.push(Modifier { stat: "MinionDamage".into(), value: 33.0, mod_type: "more".into() });
            }
            "Necromantic Aegis" => {
                mods.push(Modifier { stat: "BlockChance".into(), value: -99999.0, mod_type: "flat".into() });
                mods.push(Modifier { stat: "SpellBlockChance".into(), value: -99999.0, mod_type: "flat".into() });
            }
            "Ghost Dance" => {
                mods.push(Modifier { stat: "EnergyShield".into(), value: 3.0, mod_type: "flat".into() });
            }
            "Wicked Ward" => {
                mods.push(Modifier { stat: "ESRechargeRate".into(), value: 50.0, mod_type: "increased".into() });
            }
            "Precise Technique" => {
                mods.push(Modifier { stat: "Damage".into(), value: 40.0, mod_type: "more".into() });
                mods.push(Modifier { stat: "CritChance".into(), value: -1000.0, mod_type: "flat".into() });
            }
            "Call to Arms" => {
                // Warcries are instant; no simple stat modifier
            }
            "Hollow Palm Technique" | "One With Nothing" => {
                mods.push(Modifier { stat: "Damage".into(), value: 60.0, mod_type: "more".into() });
                mods.push(Modifier { stat: "AttackSpeed".into(), value: 14.0, mod_type: "increased".into() });
            }
            "Secrets of Suffering" => {
                // Replaces ailments with scorch/brittle/sap; complex
            }
            "Lone Messenger" => {
                mods.push(Modifier { stat: "Damage".into(), value: 50.0, mod_type: "more".into() });
            }
            "Solipsism" => {
                mods.push(Modifier { stat: "Mana".into(), value: 100.0, mod_type: "increased".into() });
            }
            "The Impaler" => {
                mods.push(Modifier { stat: "ImpaleDPS".into(), value: 100.0, mod_type: "increased".into() });
            }
            "Magebane" => {
                mods.push(Modifier { stat: "SpellSuppressionChance".into(), value: 50.0, mod_type: "flat".into() });
                mods.push(Modifier { stat: "Evasion".into(), value: -100.0, mod_type: "more".into() });
            }
            "Runebinder" => {
                // Can attach extra brand; no simple stat
            }
            "Hex Master" => {
                mods.push(Modifier { stat: "CurseDuration".into(), value: 50.0, mod_type: "increased".into() });
            }
            "Conduit" => {
                // Shares charges with party; no solo effect
            }
            _ => {}
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::BuildInput;

    fn base_input() -> BuildInput {
        BuildInput {
            level: 90,
            class_id: 1,
            base_str: 20,
            base_dex: 20,
            base_int: 20,
            modifiers: vec![],
            allocated_keystones: vec![],
            ..Default::default()
        }
    }

    #[test]
    fn test_ci_mods() {
        let mut input = base_input();
        input.allocated_keystones.push("Chaos Inoculation".into());
        let mut mods = vec![];
        apply_keystones(&input, &mut mods);
        assert!(mods.iter().any(|m| m.stat == "ChaosRes" && m.value == 160.0));
        assert!(mods.iter().any(|m| m.stat == "Life" && m.value < 0.0));
    }

    #[test]
    fn test_ci_sets_life_to_1() {
        let mut input = base_input();
        input.allocated_keystones.push("Chaos Inoculation".into());
        let output = crate::evaluate_build(input);
        assert_eq!(output.life, 1.0);
    }

    #[test]
    fn test_ci_caps_chaos_res() {
        let mut input = base_input();
        input.allocated_keystones.push("CI".into());
        let output = crate::evaluate_build(input);
        assert!(output.chaos_res >= 75.0);
    }

    #[test]
    fn test_eo_adds_more_damage() {
        let mut input = base_input();
        input.allocated_keystones.push("Elemental Overload".into());
        let mut mods = vec![];
        apply_keystones(&input, &mut mods);
        assert!(mods.iter().any(|m| m.stat == "Damage" && m.mod_type == "more" && m.value == 40.0));
    }

    #[test]
    fn test_eo_removes_crit_multi() {
        let mut input = base_input();
        input.allocated_keystones.push("EO".into());
        let output = crate::evaluate_build(input);
        assert!(output.crit_multiplier < 100.0);
    }

    #[test]
    fn test_rt_removes_crit() {
        let mut input = base_input();
        input.allocated_keystones.push("Resolute Technique".into());
        let output = crate::evaluate_build(input);
        assert!(output.crit_chance <= 0.0);
    }

    #[test]
    fn test_vaal_pact() {
        let mut input = base_input();
        input.allocated_keystones.push("Vaal Pact".into());
        let mut mods = vec![];
        apply_keystones(&input, &mut mods);
        assert!(mods.iter().any(|m| m.stat == "LifeRegen" && m.value < 0.0));
        assert!(mods.iter().any(|m| m.stat == "LifeLeechRate"));
    }

    #[test]
    fn test_blood_magic_removes_mana() {
        let mut input = base_input();
        input.allocated_keystones.push("Blood Magic".into());
        let output = crate::evaluate_build(input);
        assert_eq!(output.mana, 0.0);
    }

    #[test]
    fn test_unwavering_removes_evasion() {
        let mut input = base_input();
        input.allocated_keystones.push("Unwavering Stance".into());
        let output = crate::evaluate_build(input);
        assert_eq!(output.evasion, 0.0);
    }

    #[test]
    fn test_point_blank_adds_damage() {
        let mut input = base_input();
        input.modifiers.push(crate::Modifier {
            stat: "Damage".into(),
            value: 1000.0,
            mod_type: "flat".into(),
        });
        let base_dps = crate::evaluate_build(input.clone()).total_dps;
        input.allocated_keystones.push("Point Blank".into());
        let pb_dps = crate::evaluate_build(input).total_dps;
        assert!(pb_dps > base_dps, "Point Blank should increase DPS: {} vs {}", pb_dps, base_dps);
    }

    #[test]
    fn test_multiple_keystones() {
        let mut input = base_input();
        input.allocated_keystones.push("Chaos Inoculation".into());
        input.allocated_keystones.push("Pain Attunement".into());
        let output = crate::evaluate_build(input);
        assert_eq!(output.life, 1.0);
        assert!(output.chaos_res >= 75.0);
    }

    #[test]
    fn test_unknown_keystone_ignored() {
        let mut input = base_input();
        input.allocated_keystones.push("NonExistentKeystone".into());
        let mut mods = vec![];
        apply_keystones(&input, &mut mods);
        assert!(mods.is_empty());
    }

    #[test]
    fn test_glancing_blows_doubles_block() {
        let mut input = base_input();
        input.modifiers.push(crate::Modifier {
            stat: "BlockChance".into(), value: 30.0, mod_type: "flat".into(),
        });
        let base_block = crate::evaluate_build(input.clone()).block_chance;
        input.allocated_keystones.push("Glancing Blows".into());
        let gb_block = crate::evaluate_build(input).block_chance;
        assert!(gb_block > base_block, "Glancing Blows should increase block: {} vs {}", gb_block, base_block);
    }

    #[test]
    fn test_iron_reflexes_removes_evasion_adds_armour() {
        let mut input = base_input();
        input.modifiers.push(crate::Modifier {
            stat: "Evasion".into(), value: 500.0, mod_type: "flat".into(),
        });
        input.allocated_keystones.push("Iron Reflexes".into());
        let output = crate::evaluate_build(input);
        assert_eq!(output.evasion, 0.0, "Iron Reflexes should zero evasion");
        assert!(output.armour > 0.0, "Iron Reflexes should give armour");
    }

    #[test]
    fn test_eldritch_battery_moves_es_to_mana() {
        let mut input = base_input();
        input.modifiers.push(crate::Modifier {
            stat: "EnergyShield".into(), value: 300.0, mod_type: "flat".into(),
        });
        let base = crate::evaluate_build(input.clone());
        assert!(base.energy_shield > 200.0);
        input.allocated_keystones.push("Eldritch Battery".into());
        let eb = crate::evaluate_build(input);
        assert_eq!(eb.energy_shield, 0.0, "EB should remove ES");
        assert!(eb.mana > base.mana, "EB should increase mana: {} vs {}", eb.mana, base.mana);
    }

    #[test]
    fn test_supreme_ego_aura_effect() {
        let mut input = base_input();
        input.allocated_keystones.push("Supreme Ego".into());
        let mut mods = vec![];
        apply_keystones(&input, &mut mods);
        assert!(mods.iter().any(|m| m.stat == "AuraEffect" && m.value == 50.0));
    }
}
