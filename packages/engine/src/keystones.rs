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
            "Iron Grip" => {}
            "Ancestral Bond" => {
                mods.push(Modifier { stat: "Damage".into(), value: -100.0, mod_type: "more".into() });
            }
            "Vaal Pact" => {
                mods.push(Modifier { stat: "LifeLeechRate".into(), value: 100.0, mod_type: "more".into() });
                mods.push(Modifier { stat: "LifeRegen".into(), value: -99999.0, mod_type: "flat".into() });
            }
            "Zealot's Oath" => {}
            "Ghost Reaver" => {}
            "Blood Magic" => {
                mods.push(Modifier { stat: "Mana".into(), value: -99999.0, mod_type: "flat".into() });
            }
            "Unwavering Stance" => {
                mods.push(Modifier { stat: "Evasion".into(), value: -99999.0, mod_type: "flat".into() });
            }
            "Iron Reflexes" => {}
            "Point Blank" => {
                mods.push(Modifier { stat: "Damage".into(), value: 30.0, mod_type: "more".into() });
            }
            "Avatar of Fire" => {}
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
            main_skill_id: String::new(),
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
}
