#[cfg(test)]
mod tests {
    use crate::*;
    use crate::stat_parser::parse_stat_line;

    fn marauder(level: u32) -> BuildInput {
        BuildInput {
            level,
            class_id: 1,
            base_str: 32,
            base_dex: 14,
            base_int: 14,
            modifiers: vec![],
            allocated_keystones: vec![],
            ..Default::default()
        }
    }

    fn witch(level: u32) -> BuildInput {
        BuildInput {
            level,
            class_id: 3,
            base_str: 14,
            base_dex: 14,
            base_int: 32,
            modifiers: vec![],
            allocated_keystones: vec![],
            ..Default::default()
        }
    }

    fn m(stat: &str, value: f64, mod_type: &str) -> Modifier {
        Modifier {
            stat: stat.into(),
            value,
            mod_type: mod_type.into(),
        }
    }

    // ---- Marauder life build ------------------------------------------------

    #[test]
    fn marauder_life_build_has_substantial_life() {
        let mut input = marauder(90);
        input.modifiers = vec![
            m("Life", 50.0, "flat"),
            m("Life", 120.0, "increased"),
            m("Str", 80.0, "flat"),
            m("Armour", 500.0, "flat"),
            m("Armour", 80.0, "increased"),
            m("FireRes", 135.0, "flat"),
            m("ColdRes", 120.0, "flat"),
            m("LightningRes", 130.0, "flat"),
            m("Damage", 600.0, "flat"),
            m("Damage", 150.0, "increased"),
            m("AttackSpeed", 20.0, "increased"),
        ];

        let out = evaluate_build(input);

        assert!(out.life > 2000.0, "Life too low: {}", out.life);
        assert!(out.life < 10000.0, "Life too high: {}", out.life);
        assert!(out.armour > 500.0, "Armour too low: {}", out.armour);
        assert!(out.fire_res >= 75.0, "Fire res uncapped: {}", out.fire_res);
        assert!(out.cold_res >= 60.0, "Cold res too low: {}", out.cold_res);
        assert!(out.total_dps > 500.0, "DPS too low: {}", out.total_dps);
        assert!(out.total_ehp > 2000.0, "EHP too low: {}", out.total_ehp);
    }

    #[test]
    fn marauder_strength_scales_life_and_armour() {
        let base = marauder(90);
        let base_out = evaluate_build(base.clone());

        let mut boosted = base;
        boosted.modifiers.push(m("Str", 200.0, "flat"));
        let boosted_out = evaluate_build(boosted);

        assert!(
            boosted_out.life > base_out.life,
            "More str should mean more life: {} vs {}",
            boosted_out.life,
            base_out.life
        );
        assert!(
            boosted_out.armour > base_out.armour,
            "More str should mean more armour"
        );
    }

    // ---- CI Occultist ES build ----------------------------------------------

    #[test]
    fn ci_occultist_has_1_life_and_high_es() {
        let mut input = witch(95);
        input.modifiers = vec![
            m("EnergyShield", 800.0, "flat"),
            m("EnergyShield", 200.0, "increased"),
            m("Int", 150.0, "flat"),
            m("FireRes", 135.0, "flat"),
            m("ColdRes", 135.0, "flat"),
            m("LightningRes", 135.0, "flat"),
            m("Damage", 400.0, "flat"),
            m("CritChance", 80.0, "flat"),
            m("CritMultiplier", 100.0, "flat"),
        ];
        input.allocated_keystones.push("Chaos Inoculation".into());

        let out = evaluate_build(input);

        assert_eq!(out.life, 1.0, "CI life should be 1, got {}", out.life);
        assert!(out.energy_shield > 2000.0, "ES too low: {}", out.energy_shield);
        assert!(out.chaos_res >= 75.0, "Chaos res should be maxed with CI: {}", out.chaos_res);
        assert!(out.fire_res >= 75.0);
        assert!(out.cold_res >= 75.0);
        assert!(out.lightning_res >= 75.0);
    }

    #[test]
    fn ci_build_ehp_uses_es_pool() {
        let mut input = witch(90);
        input.modifiers = vec![m("EnergyShield", 500.0, "flat")];
        input.allocated_keystones.push("CI".into());
        let out = evaluate_build(input);

        assert!(out.total_ehp > out.energy_shield, "EHP should exceed raw ES due to mitigation");
    }

    // ---- Elemental Overload build -------------------------------------------

    #[test]
    fn elemental_overload_removes_crit_multi_adds_more_damage() {
        let mut base_input = marauder(80);
        base_input.modifiers = vec![
            m("Damage", 300.0, "flat"),
            m("CritChance", 30.0, "flat"),
            m("CritMultiplier", 50.0, "flat"),
        ];
        let base_out = evaluate_build(base_input.clone());

        let mut eo_input = base_input;
        eo_input.allocated_keystones.push("Elemental Overload".into());
        let eo_out = evaluate_build(eo_input);

        // EO removes crit multi benefit but adds 40% more damage
        // Crit multi should be near base (150 - 1000 -> clamped somehow)
        assert!(eo_out.crit_multiplier < base_out.crit_multiplier,
            "EO should reduce crit multi: {} vs {}", eo_out.crit_multiplier, base_out.crit_multiplier);
    }

    // ---- Stat parser with real tree node text --------------------------------

    #[test]
    fn parse_marauder_starting_area() {
        let nodes = vec![
            "+10 to Strength",
            "8% increased maximum Life",
            "+20 to maximum Life",
            "+10% to Fire Resistance",
            "12% increased Physical Damage",
            "5% increased Attack Speed",
            "+30 to Armour",
        ];

        let all_mods: Vec<Modifier> = nodes.iter()
            .flat_map(|n| parse_stat_line(n))
            .collect();

        assert!(all_mods.len() >= 7, "Should parse at least 7 mods, got {}", all_mods.len());
        assert!(all_mods.iter().any(|m| m.stat == "Str" && m.value == 10.0));
        assert!(all_mods.iter().any(|m| m.stat == "Life" && m.value == 8.0 && m.mod_type == "increased"));
        assert!(all_mods.iter().any(|m| m.stat == "Life" && m.value == 20.0 && m.mod_type == "flat"));
        assert!(all_mods.iter().any(|m| m.stat == "FireRes" && m.value == 10.0));
        assert!(all_mods.iter().any(|m| m.stat == "Armour" && m.value == 30.0 && m.mod_type == "flat"));
    }

    #[test]
    fn parse_witch_es_nodes() {
        let nodes = vec![
            "+10 to Intelligence",
            "+30 to maximum Energy Shield",
            "15% increased maximum Energy Shield",
            "+20% to Lightning Resistance",
        ];

        let all_mods: Vec<Modifier> = nodes.iter()
            .flat_map(|n| parse_stat_line(n))
            .collect();

        assert!(all_mods.iter().any(|m| m.stat == "Int" && m.value == 10.0));
        assert!(all_mods.iter().any(|m| m.stat == "EnergyShield" && m.value == 30.0 && m.mod_type == "flat"));
        assert!(all_mods.iter().any(|m| m.stat == "EnergyShield" && m.value == 15.0 && m.mod_type == "increased"));
        assert!(all_mods.iter().any(|m| m.stat == "LightningRes" && m.value == 20.0));
    }

    // ---- End-to-end: parsed stats -> build -> output -------------------------

    #[test]
    fn end_to_end_parsed_tree_build() {
        let node_stats = vec![
            "+10 to Strength",
            "+10 to Strength",
            "+10 to Strength",
            "8% increased maximum Life",
            "8% increased maximum Life",
            "10% increased maximum Life",
            "+20 to maximum Life",
            "+30 to maximum Life",
            "+30% to Fire Resistance",
            "+30% to Cold Resistance",
            "+30% to Lightning Resistance",
            "15% increased Physical Damage",
            "15% increased Physical Damage",
            "10% increased Attack Speed",
        ];

        let parsed_mods: Vec<Modifier> = node_stats.iter()
            .flat_map(|n| parse_stat_line(n))
            .collect();

        let mut input = marauder(80);
        input.modifiers = parsed_mods;

        let output = evaluate_build(input);

        assert!(output.strength > 60.0, "Str should be >60: {}", output.strength);
        assert!(output.fire_res >= -30.0, "Fire res should be better than default: {}", output.fire_res);
        assert!(output.life > 1000.0, "Should have decent life from tree nodes: {}", output.life);
    }

    #[test]
    fn end_to_end_ranger_dex_build() {
        let node_stats = vec![
            "+10 to Dexterity",
            "+10 to Dexterity",
            "+10 to Dexterity",
            "+10 to Dexterity",
            "10% increased Evasion Rating",
            "15% increased Evasion Rating",
            "+100 to Evasion Rating",
            "10% increased Attack Speed",
            "5% increased Attack Speed",
            "+20% to Cold Resistance",
            "+20% to Lightning Resistance",
        ];

        let parsed_mods: Vec<Modifier> = node_stats.iter()
            .flat_map(|n| parse_stat_line(n))
            .collect();

        let input = BuildInput {
            level: 85,
            class_id: 2,
            base_str: 14,
            base_dex: 32,
            base_int: 14,
            modifiers: parsed_mods,
            allocated_keystones: vec![],
            ..Default::default()
        };

        let output = evaluate_build(input);

        assert!(output.dexterity > 70.0, "Dex should be >70: {}", output.dexterity);
        assert!(output.evasion > 100.0, "Should have evasion from tree: {}", output.evasion);
        assert!(output.attack_speed > 1.1, "Should have attack speed: {}", output.attack_speed);
    }

    // ---- Performance: bulk evaluation ----------------------------------------

    #[test]
    fn perf_1000_evaluations_under_500ms() {
        let mut input = marauder(90);
        input.modifiers = vec![
            m("Life", 100.0, "flat"),
            m("Life", 80.0, "increased"),
            m("Str", 60.0, "flat"),
            m("Damage", 500.0, "flat"),
            m("Damage", 100.0, "increased"),
            m("AttackSpeed", 15.0, "increased"),
            m("FireRes", 135.0, "flat"),
            m("ColdRes", 120.0, "flat"),
            m("LightningRes", 130.0, "flat"),
            m("Armour", 300.0, "flat"),
            m("Armour", 40.0, "increased"),
            m("CritChance", 40.0, "flat"),
            m("CritMultiplier", 80.0, "flat"),
            m("BlockChance", 25.0, "flat"),
        ];

        let start = std::time::Instant::now();
        for _ in 0..1000 {
            let _ = evaluate_build(input.clone());
        }
        let elapsed = start.elapsed();

        let per_eval_us = elapsed.as_nanos() as f64 / 1_000_000.0;
        println!(
            "1000 evals: {:.1}ms total, {:.1}us each, {:.0} evals/sec",
            elapsed.as_micros() as f64 / 1000.0,
            per_eval_us,
            1_000_000_000.0 / (elapsed.as_nanos() as f64 / 1000.0)
        );

        assert!(elapsed.as_millis() < 500, "1000 evals took {}ms, should be <500ms", elapsed.as_millis());
    }

    #[test]
    fn perf_10000_evaluations_throughput() {
        let mut input = marauder(90);
        input.modifiers = vec![
            m("Life", 100.0, "flat"),
            m("Damage", 500.0, "flat"),
            m("FireRes", 135.0, "flat"),
        ];

        let start = std::time::Instant::now();
        for _ in 0..10_000 {
            let _ = evaluate_build(input.clone());
        }
        let elapsed = start.elapsed();

        let evals_per_sec = 10_000.0 / elapsed.as_secs_f64();
        println!("10k evals: {:.1}ms, {:.0} evals/sec", elapsed.as_millis(), evals_per_sec);

        assert!(evals_per_sec > 10_000.0, "Should sustain >10k evals/sec, got {:.0}", evals_per_sec);
    }

    // ---- Resistance mechanics -----------------------------------------------

    #[test]
    fn uncapped_resistances_default() {
        let out = evaluate_build(marauder(1));
        assert_eq!(out.fire_res, -60.0);
        assert_eq!(out.cold_res, -60.0);
        assert_eq!(out.lightning_res, -60.0);
        assert_eq!(out.chaos_res, -60.0);
    }

    #[test]
    fn overcapped_resistances_clamp() {
        let mut input = marauder(1);
        input.modifiers = vec![
            m("FireRes", 200.0, "flat"),   // 200 - 60 = 140, capped to 90
            m("ColdRes", 200.0, "flat"),
            m("LightningRes", 200.0, "flat"),
            m("ChaosRes", 200.0, "flat"),  // capped to 75
        ];
        let out = evaluate_build(input);
        assert!(out.fire_res <= 90.0, "Fire res over hard cap: {}", out.fire_res);
        assert!(out.chaos_res <= 75.0, "Chaos res over cap: {}", out.chaos_res);
    }

    // ---- Multiple modifier types stack correctly ----------------------------

    #[test]
    fn flat_increased_more_stack_correctly() {
        let mut input = marauder(80);
        // 500 flat damage, 100% increased, 50% more
        input.modifiers = vec![
            m("Damage", 500.0, "flat"),
            m("Damage", 100.0, "increased"),
            m("Damage", 50.0, "more"),
        ];
        let out = evaluate_build(input);
        // (0 + 500) * (1 + 100/100) * (1 + 50/100) = 500 * 2 * 1.5 = 1500 base damage
        // DPS = base_damage * speed * hit_chance / 100 (hit chance reduces it)
        assert!(out.total_dps > 500.0, "Stacked mods should give decent DPS: {}", out.total_dps);
    }

    #[test]
    fn multiple_more_multipliers_compound() {
        let mut input = marauder(80);
        input.modifiers = vec![
            m("Damage", 500.0, "flat"),
            m("Damage", 50.0, "more"),  // 1.5x
            m("Damage", 50.0, "more"),  // another 1.5x -> total 2.25x
        ];
        let out1 = evaluate_build(input.clone());

        let mut input2 = marauder(80);
        input2.modifiers = vec![
            m("Damage", 500.0, "flat"),
            m("Damage", 50.0, "more"),  // only 1.5x
        ];
        let out2 = evaluate_build(input2);

        assert!(
            out1.total_dps > out2.total_dps * 1.4,
            "Two 50% more should compound: {} vs {}",
            out1.total_dps,
            out2.total_dps
        );
    }

    // ---- Support gems flow through BuildInput --------------------------------

    #[test]
    fn support_gems_increase_dps() {
        let mut base = marauder(90);
        base.main_skill_id = "GroundSlam".into();
        let base_dps = evaluate_build(base.clone()).total_dps;

        let mut with_support = base;
        with_support.support_gems = vec!["Melee Physical Damage Support".into()];
        let supported_dps = evaluate_build(with_support).total_dps;

        assert!(supported_dps > base_dps * 1.3,
            "Support should increase DPS: {} vs {}", supported_dps, base_dps);
    }

    #[test]
    fn multiple_supports_stack() {
        let mut input = marauder(90);
        input.main_skill_id = "GroundSlam".into();
        input.support_gems = vec![
            "Melee Physical Damage Support".into(),
            "Faster Attacks Support".into(),
        ];
        let out = evaluate_build(input);
        assert!(out.total_dps > 200.0, "Stacked supports should give decent DPS: {}", out.total_dps);
    }

    // ---- Unique items flow through BuildInput --------------------------------

    #[test]
    fn equipped_unique_applies_mods() {
        let mut base = marauder(90);
        let base_life = evaluate_build(base.clone()).life;

        base.equipped_uniques = vec!["Kaom's Heart".into()];
        let with_kaom = evaluate_build(base).life;

        assert!(with_kaom > base_life + 400.0,
            "Kaom's Heart should add ~500 life: {} vs {}", with_kaom, base_life);
    }

    // ---- Flask effects flow through BuildInput --------------------------------

    #[test]
    fn active_flask_applies_mods() {
        let mut base = marauder(90);
        let base_out = evaluate_build(base.clone());

        base.active_flasks = vec!["Diamond Flask".into()];
        let with_flask = evaluate_build(base);

        assert!(with_flask.crit_chance > base_out.crit_chance,
            "Diamond flask should increase crit: {} vs {}", with_flask.crit_chance, base_out.crit_chance);
    }

    // ---- Weapon data flows through BuildInput ---------------------------------

    #[test]
    fn weapon_base_damage_increases_dps() {
        let mut base = marauder(90);
        base.main_skill_id = "GroundSlam".into();
        let base_dps = evaluate_build(base.clone()).total_dps;

        let mut with_weapon = base;
        with_weapon.weapon_phys_min = 100.0;
        with_weapon.weapon_phys_max = 200.0;
        with_weapon.weapon_aps = 1.5;
        with_weapon.weapon_crit = 6.0;
        let weapon_dps = evaluate_build(with_weapon).total_dps;

        assert!(weapon_dps > base_dps,
            "Weapon should increase DPS: {} vs {}", weapon_dps, base_dps);
    }

    #[test]
    fn weapon_aps_affects_attack_speed() {
        let mut input = marauder(90);
        input.weapon_aps = 2.0;
        input.weapon_phys_min = 50.0;
        input.weapon_phys_max = 100.0;
        let out = evaluate_build(input);
        assert!(out.attack_speed >= 2.0, "Weapon APS should set base speed: {}", out.attack_speed);
    }

    // ---- Full build: supports + uniques + weapon + tree ----------------------

    #[test]
    fn full_build_all_inputs() {
        let mut input = marauder(90);
        input.main_skill_id = "GroundSlam".into();
        input.ascendancy_name = "Juggernaut".into();
        input.support_gems = vec![
            "Melee Physical Damage Support".into(),
            "Brutality Support".into(),
        ];
        input.equipped_uniques = vec!["Starforge".into()];
        input.active_flasks = vec!["Lion's Roar".into()];
        input.weapon_phys_min = 100.0;
        input.weapon_phys_max = 350.0;
        input.weapon_aps = 1.35;
        input.weapon_crit = 5.0;
        input.modifiers = vec![
            m("Life", 80.0, "flat"),
            m("Life", 120.0, "increased"),
            m("Str", 100.0, "flat"),
            m("Armour", 1000.0, "flat"),
            m("FireRes", 135.0, "flat"),
            m("ColdRes", 130.0, "flat"),
            m("LightningRes", 125.0, "flat"),
        ];

        let out = evaluate_build(input);

        assert!(out.life > 2500.0, "Full build life: {}", out.life);
        assert!(out.total_dps > 3000.0, "Full build DPS: {}", out.total_dps);
        assert!(out.armour > 1000.0, "Full build armour: {}", out.armour);
        assert!(out.fire_res >= 75.0, "Full build fire res: {}", out.fire_res);
    }

    // ---- Impale DPS ---------------------------------------------------------

    #[test]
    fn impale_adds_dps_for_phys_builds() {
        let mut input = marauder(90);
        input.main_skill_id = "GroundSlam".into();
        input.modifiers = vec![
            m("Damage", 500.0, "flat"),
            m("PhysicalDamage", 50.0, "increased"),
        ];
        input.impale_chance = 100.0;
        let out = evaluate_build(input);
        assert!(out.impale_dps > 0.0, "Impale DPS should be > 0 with 100% chance: {}", out.impale_dps);
        assert!(out.combined_dps > out.total_dps, "Combined should include impale: {} vs {}", out.combined_dps, out.total_dps);
    }

    #[test]
    fn impale_zero_without_chance() {
        let mut input = marauder(90);
        input.main_skill_id = "GroundSlam".into();
        input.modifiers = vec![m("Damage", 500.0, "flat")];
        let out = evaluate_build(input);
        assert_eq!(out.impale_dps, 0.0, "Impale should be 0 without chance");
    }

    #[test]
    fn impale_stat_parser() {
        let mods = parse_stat_line("40% chance to Impale Enemies on Hit with Attacks");
        assert!(mods.iter().any(|m_| m_.stat == "ImpaleChance" && m_.value == 40.0), "mods: {:?}", mods);
    }

    // ---- Gain as extra damage -----------------------------------------------

    #[test]
    fn gain_as_extra_fire_increases_dps() {
        let mut base_input = marauder(90);
        base_input.modifiers = vec![
            m("Damage", 500.0, "flat"),
        ];
        let base_dps = evaluate_build(base_input.clone()).total_dps;

        base_input.modifiers.push(m("PhysGainAsFire", 20.0, "flat"));
        let with_gain = evaluate_build(base_input).total_dps;
        assert!(with_gain > base_dps, "Gain as extra fire should increase DPS: {} vs {}", with_gain, base_dps);
    }

    #[test]
    fn gain_as_extra_parsed_from_text() {
        let mods = parse_stat_line("Gain 25% of Physical Damage as Extra Fire Damage");
        assert!(mods.iter().any(|m_| m_.stat == "PhysGainAsFire" && m_.value == 25.0), "mods: {:?}", mods);
    }

    #[test]
    fn gain_as_extra_chaos_parsed() {
        let mods = parse_stat_line("Gain 15% of Physical Damage as Extra Chaos Damage");
        assert!(mods.iter().any(|m_| m_.stat == "PhysGainAsChaos" && m_.value == 15.0), "mods: {:?}", mods);
    }

    // ---- Buff effects -------------------------------------------------------

    #[test]
    fn onslaught_increases_attack_speed() {
        let mut base = marauder(90);
        let base_out = evaluate_build(base.clone());

        base.have_onslaught = true;
        let with_onslaught = evaluate_build(base);
        assert!(with_onslaught.attack_speed > base_out.attack_speed,
            "Onslaught should increase attack speed: {} vs {}", with_onslaught.attack_speed, base_out.attack_speed);
    }

    #[test]
    fn tailwind_increases_attack_speed() {
        let mut base = marauder(90);
        let base_out = evaluate_build(base.clone());

        base.have_tailwind = true;
        let with_tailwind = evaluate_build(base);
        assert!(with_tailwind.attack_speed > base_out.attack_speed,
            "Tailwind should increase attack speed: {} vs {}", with_tailwind.attack_speed, base_out.attack_speed);
    }

    #[test]
    fn arcane_surge_increases_spell_damage() {
        let mut base = witch(90);
        base.main_skill_id = "Fireball".into();
        base.modifiers = vec![m("Damage", 200.0, "flat")];
        let base_dps = evaluate_build(base.clone()).total_dps;

        base.have_arcane_surge = true;
        let with_surge = evaluate_build(base).total_dps;
        assert!(with_surge > base_dps,
            "Arcane Surge should increase spell DPS: {} vs {}", with_surge, base_dps);
    }
}
