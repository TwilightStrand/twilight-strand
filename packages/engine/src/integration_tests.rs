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

    // ---- stat_lines v2 pipeline tests ----------------------------------------

    #[test]
    fn stat_lines_v2_basic_life_and_res() {
        let mut input = marauder(90);
        input.stat_lines = vec![
            "+50 to maximum Life".into(),
            "120% increased maximum Life".into(),
            "+80 to Strength".into(),
            "+40% to Fire Resistance".into(),
        ];
        let out = evaluate_build(input);
        assert!(out.life > 500.0, "stat_lines should produce life: {}", out.life);
        assert!(out.fire_res > -60.0, "stat_lines should add fire res: {}", out.fire_res);
        assert!(out.strength > 32.0, "stat_lines should add str: {}", out.strength);
    }

    #[test]
    fn stat_lines_v2_matches_legacy_modifiers() {
        let mut legacy = marauder(90);
        legacy.modifiers = vec![
            m("Life", 50.0, "flat"),
            m("Life", 120.0, "increased"),
            m("Str", 80.0, "flat"),
            m("FireRes", 40.0, "flat"),
        ];
        let legacy_out = evaluate_build(legacy);

        let mut v2 = marauder(90);
        v2.stat_lines = vec![
            "+50 to maximum Life".into(),
            "120% increased maximum Life".into(),
            "+80 to Strength".into(),
            "+40% to Fire Resistance".into(),
        ];
        let v2_out = evaluate_build(v2);

        assert!((legacy_out.life - v2_out.life).abs() < 1.0,
            "Life should match: legacy={} v2={}", legacy_out.life, v2_out.life);
        assert!((legacy_out.fire_res - v2_out.fire_res).abs() < 0.1,
            "Fire res should match: legacy={} v2={}", legacy_out.fire_res, v2_out.fire_res);
        assert!((legacy_out.strength - v2_out.strength).abs() < 1.0,
            "Str should match: legacy={} v2={}", legacy_out.strength, v2_out.strength);
    }

    #[test]
    fn stat_lines_v2_conditional_mod_respected() {
        let mut input = marauder(90);
        input.stat_lines = vec![
            "20% increased Attack Speed while Dual Wielding".into(),
        ];
        input.is_dual_wield = false;
        let without = evaluate_build(input.clone());

        input.is_dual_wield = true;
        let with_dw = evaluate_build(input);

        assert!(with_dw.attack_speed > without.attack_speed,
            "Conditional mod should only apply when condition met: dw={} no_dw={}",
            with_dw.attack_speed, without.attack_speed);
    }

    #[test]
    fn stat_lines_v2_per_charge_multiplier() {
        let mut input = marauder(90);
        input.stat_lines = vec![
            "5% increased Attack Speed per Frenzy Charge".into(),
        ];
        input.main_skill_id = "GroundSlam".into();
        input.weapon_phys_min = 100.0;
        input.weapon_phys_max = 200.0;
        input.weapon_aps = 1.5;
        input.weapon_crit = 5.0;
        input.frenzy_charges = 0;
        let zero_charges = evaluate_build(input.clone());

        input.frenzy_charges = 5;
        let five_charges = evaluate_build(input);

        assert!(five_charges.attack_speed > zero_charges.attack_speed,
            "Per-charge mod should scale with charges: 5c={} 0c={}",
            five_charges.attack_speed, zero_charges.attack_speed);
    }

    #[test]
    fn gear_stats_affect_output() {
        let mut input = witch(90);
        input.gear_armour = 1000.0;
        input.gear_evasion = 500.0;
        input.gear_es = 300.0;
        input.gear_block = 20.0;
        let out = evaluate_build(input);
        assert!(out.armour > 900.0, "gear_armour should contribute: {}", out.armour);
        assert!(out.evasion > 400.0, "gear_evasion should contribute: {}", out.evasion);
        assert!(out.energy_shield > 200.0, "gear_es should contribute: {}", out.energy_shield);
        assert!(out.block_chance >= 20.0, "gear_block should contribute: {}", out.block_chance);
    }

    // ========================================================================
    // Precise numeric output tests
    // Pin exact values to catch calc divergences from PoB formulas.
    // ========================================================================

    fn assert_near(actual: f64, expected: f64, epsilon: f64, label: &str) {
        assert!(
            (actual - expected).abs() <= epsilon,
            "{}: expected {}, got {} (diff {})",
            label, expected, actual, (actual - expected).abs()
        );
    }

    // ---- Issue 1: ES calc - int bonus is percentage, not flat ---------------

    #[test]
    fn es_int_bonus_is_percentage_not_flat() {
        // Witch level 90, base_int=32, gear_es=200, no ES mods.
        // intelligence = 32, int_bonus = floor(32/5) = 6 (% increased ES)
        // ES = (200 + 0) * (1 + (0 + 6)/100) * 1.0 = 200 * 1.06 = 212
        // If int were wrongly treated as flat: ES = (200 + 6) * 1.0 = 206
        let mut input = witch(90);
        input.gear_es = 200.0;
        let out = evaluate_build(input);
        assert_near(out.energy_shield, 212.0, 1.0, "ES with int-as-percentage");
        // Must NOT be 206 (the flat-int-bonus mistake)
        assert!(
            (out.energy_shield - 206.0).abs() > 3.0,
            "ES {} is too close to 206 (flat-int bug)",
            out.energy_shield
        );
    }

    #[test]
    fn es_with_int_mods_and_gear() {
        // Witch level 90, base_int=32, +150 int, gear_es=400, +100% inc ES
        // intelligence = 32 + 150 = 182
        // int_bonus = floor(182/5) = 36
        // ES = (400 + 0) * (1 + (100 + 36)/100) * 1.0 = 400 * 2.36 = 944
        let mut input = witch(90);
        input.gear_es = 400.0;
        input.modifiers = vec![
            m("Int", 150.0, "flat"),
            m("EnergyShield", 100.0, "increased"),
        ];
        let out = evaluate_build(input);
        assert_near(out.energy_shield, 944.0, 1.0, "ES with int+inc");
    }

    #[test]
    fn es_with_flat_and_more() {
        // Witch level 90, base_int=32, gear_es=300, +100 flat ES, +50% inc ES, 30% more ES
        // intelligence = 32, int_bonus = floor(32/5) = 6
        // ES = (300 + 100) * (1 + (50 + 6)/100) * (1 + 30/100) = 400 * 1.56 * 1.3 = 811.2 -> 811
        let mut input = witch(90);
        input.gear_es = 300.0;
        input.modifiers = vec![
            m("EnergyShield", 100.0, "flat"),
            m("EnergyShield", 50.0, "increased"),
            m("EnergyShield", 30.0, "more"),
        ];
        let out = evaluate_build(input);
        assert_near(out.energy_shield, 811.0, 1.0, "ES with flat+inc+more");
    }

    // ---- Issue 2: Attribute calculation order --------------------------------

    #[test]
    fn attributes_computed_before_life() {
        // Marauder level 90, +200 flat str
        // strength = 32 + 200 = 232
        // life base = 38 + 89*12 + floor(232/2) = 38 + 1068 + 116 = 1222
        let mut input = marauder(90);
        input.modifiers = vec![m("Str", 200.0, "flat")];
        let out = evaluate_build(input);
        assert_near(out.strength, 232.0, 0.1, "strength with +200 flat");
        assert_near(out.life, 1222.0, 1.0, "life with str bonus");
    }

    #[test]
    fn attributes_computed_before_mana() {
        // Witch level 90, +100 flat int
        // intelligence = 32 + 100 = 132
        // mana base = 34 + 89*6 + floor(132/2) = 34 + 534 + 66 = 634
        let mut input = witch(90);
        input.modifiers = vec![m("Int", 100.0, "flat")];
        let out = evaluate_build(input);
        assert_near(out.intelligence, 132.0, 0.1, "int with +100 flat");
        assert_near(out.mana, 634.0, 1.0, "mana with int bonus");
    }

    #[test]
    fn attributes_computed_before_es() {
        // Witch level 90, +200 int, gear_es=500
        // intelligence = 32 + 200 = 232
        // int_bonus = floor(232/5) = 46
        // ES = (500 + 0) * (1 + (0 + 46)/100) * 1.0 = 500 * 1.46 = 730
        let mut input = witch(90);
        input.gear_es = 500.0;
        input.modifiers = vec![m("Int", 200.0, "flat")];
        let out = evaluate_build(input);
        assert_near(out.intelligence, 232.0, 0.1, "int");
        assert_near(out.energy_shield, 730.0, 1.0, "ES scales with computed int");
    }

    // ---- Issue 3: Resistance calc with Kitava penalty -----------------------

    #[test]
    fn resistance_kitava_penalty_exact() {
        // No res mods: fire_res = 0 - 60 = -60
        let out = evaluate_build(marauder(90));
        assert_near(out.fire_res, -60.0, 0.1, "fire_res default");
        assert_near(out.cold_res, -60.0, 0.1, "cold_res default");
        assert_near(out.lightning_res, -60.0, 0.1, "lightning_res default");
        assert_near(out.chaos_res, -60.0, 0.1, "chaos_res default");
    }

    #[test]
    fn resistance_partial_cap() {
        // +75 fire res: 75 - 60 = 15
        let mut input = marauder(90);
        input.modifiers = vec![m("FireRes", 75.0, "flat")];
        let out = evaluate_build(input);
        assert_near(out.fire_res, 15.0, 0.1, "fire_res +75 after kitava");
    }

    #[test]
    fn resistance_exactly_capped() {
        // +135 fire res: 135 - 60 = 75 = max cap
        let mut input = marauder(90);
        input.modifiers = vec![m("FireRes", 135.0, "flat")];
        let out = evaluate_build(input);
        assert_near(out.fire_res, 75.0, 0.1, "fire_res capped at 75");
    }

    #[test]
    fn resistance_overcapped_stays_at_max() {
        // +200 fire res: 200 - 60 = 140, capped to max 75
        let mut input = marauder(90);
        input.modifiers = vec![m("FireRes", 200.0, "flat")];
        let out = evaluate_build(input);
        assert_near(out.fire_res, 75.0, 0.1, "fire_res overcapped");
    }

    #[test]
    fn resistance_with_raised_max() {
        // +5 max fire res, +200 fire res: max=80, res = min(140, 80) = 80
        let mut input = marauder(90);
        input.modifiers = vec![
            m("FireRes", 200.0, "flat"),
            m("FireResMax", 5.0, "flat"),
        ];
        let out = evaluate_build(input);
        assert_near(out.fire_res, 80.0, 0.1, "fire_res with raised max");
    }

    // ---- Issue 4: gear_block feeds into block_chance ------------------------

    #[test]
    fn gear_block_plus_mod_block() {
        // gear_block=30, +20 flat block: 30 + 20 = 50
        let mut input = marauder(90);
        input.gear_block = 30.0;
        input.modifiers = vec![m("BlockChance", 20.0, "flat")];
        let out = evaluate_build(input);
        assert_near(out.block_chance, 50.0, 0.1, "block from gear+mod");
    }

    #[test]
    fn gear_block_alone() {
        // gear_block=25, no mods: block = 25
        let mut input = marauder(90);
        input.gear_block = 25.0;
        let out = evaluate_build(input);
        assert_near(out.block_chance, 25.0, 0.1, "block from gear alone");
    }

    #[test]
    fn block_clamped_at_75_from_gear_and_mods() {
        // gear_block=50, +40 flat block: 50 + 40 = 90, clamped to 75
        let mut input = marauder(90);
        input.gear_block = 50.0;
        input.modifiers = vec![m("BlockChance", 40.0, "flat")];
        let out = evaluate_build(input);
        assert_near(out.block_chance, 75.0, 0.1, "block clamped at 75");
    }

    // ---- Issue 5: Mana regen = mana * 1.75% base per second -----------------

    #[test]
    fn mana_regen_base_rate() {
        // Marauder 90: mana = 34 + 89*6 + floor(14/2) = 575
        // base_mana_regen = 575 * 0.0175 = 10.0625
        let out = evaluate_build(marauder(90));
        assert_near(out.mana, 575.0, 1.0, "mana");
        assert_near(out.mana_regen, 575.0 * 0.0175, 0.01, "mana_regen base");
    }

    #[test]
    fn mana_regen_with_flat_and_increased() {
        // Marauder 90: mana = 575
        // base_regen = 575 * 0.0175 = 10.0625
        // +5 flat mana regen, +100% inc mana regen
        // regen = (10.0625 + 5) * (1 + 100/100) = 15.0625 * 2.0 = 30.125
        let mut input = marauder(90);
        input.modifiers = vec![
            m("ManaRegen", 5.0, "flat"),
            m("ManaRegen", 100.0, "increased"),
        ];
        let out = evaluate_build(input);
        assert_near(out.mana_regen, 30.125, 0.01, "mana_regen with flat+inc");
    }

    // ---- Precise life calculations ------------------------------------------

    #[test]
    fn bare_marauder_exact_life() {
        // Marauder 90: life = 38 + 89*12 + floor(32/2) = 38 + 1068 + 16 = 1122
        let out = evaluate_build(marauder(90));
        assert_near(out.life, 1122.0, 0.1, "bare marauder life");
    }

    #[test]
    fn life_with_flat_and_increased() {
        // Marauder 90: base life = 1122
        // +50 flat, +80% inc: (1122 + 50) * 1.8 = 1172 * 1.8 = 2109.6 -> 2110
        let mut input = marauder(90);
        input.modifiers = vec![
            m("Life", 50.0, "flat"),
            m("Life", 80.0, "increased"),
        ];
        let out = evaluate_build(input);
        assert_near(out.life, 2110.0, 1.0, "life with flat+inc");
    }

    #[test]
    fn life_with_flat_inc_more() {
        // Marauder 90: base life = 1122
        // +50 flat, +100% inc, +30% more:
        // (1122 + 50) * (1 + 100/100) * (1 + 30/100) = 1172 * 2.0 * 1.3 = 3047.2 -> 3047
        let mut input = marauder(90);
        input.modifiers = vec![
            m("Life", 50.0, "flat"),
            m("Life", 100.0, "increased"),
            m("Life", 30.0, "more"),
        ];
        let out = evaluate_build(input);
        assert_near(out.life, 3047.0, 1.0, "life with flat+inc+more");
    }

    // ---- Precise accuracy calculation ----------------------------------------

    #[test]
    fn accuracy_exact_base() {
        // Marauder 90, dex=14: accuracy base = (90-1)*2 + 14*2 = 178 + 28 = 206
        let out = evaluate_build(marauder(90));
        assert_near(out.accuracy, 206.0, 0.1, "accuracy base");
    }

    #[test]
    fn accuracy_scales_with_dex() {
        // Marauder 90, +100 dex: dex = 114
        // accuracy base = 89*2 + 114*2 = 178 + 228 = 406
        let mut input = marauder(90);
        input.modifiers = vec![m("Dex", 100.0, "flat")];
        let out = evaluate_build(input);
        assert_near(out.dexterity, 114.0, 0.1, "dex with +100 flat");
        assert_near(out.accuracy, 406.0, 0.1, "accuracy with dex");
    }

    // ---- Full known build: pin all key stats --------------------------------

    #[test]
    fn full_known_build_marauder() {
        // Marauder level 90:
        // +100 str, +50 dex, +30 int
        // str=132, dex=64, int=44
        // life base = 38 + 1068 + floor(132/2) = 1172
        // mana base = 34 + 534 + floor(44/2) = 590
        // +50 flat life, +80% inc life -> (1172+50)*1.8 = 2199.6 -> 2200
        // gear_es=100 -> int_bonus = floor(44/5) = 8 -> ES = 100 * 1.08 = 108
        // +135 fire res -> 135-60 = 75 (capped)
        // +100 cold res -> 100-60 = 40
        // gear_block=20, +15 block -> 35
        let mut input = marauder(90);
        input.gear_es = 100.0;
        input.gear_block = 20.0;
        input.modifiers = vec![
            m("Str", 100.0, "flat"),
            m("Dex", 50.0, "flat"),
            m("Int", 30.0, "flat"),
            m("Life", 50.0, "flat"),
            m("Life", 80.0, "increased"),
            m("FireRes", 135.0, "flat"),
            m("ColdRes", 100.0, "flat"),
            m("BlockChance", 15.0, "flat"),
        ];
        let out = evaluate_build(input);

        assert_near(out.strength, 132.0, 0.1, "str");
        assert_near(out.dexterity, 64.0, 0.1, "dex");
        assert_near(out.intelligence, 44.0, 0.1, "int");
        assert_near(out.life, 2200.0, 1.0, "life");
        assert_near(out.mana, 590.0, 1.0, "mana");
        assert_near(out.energy_shield, 108.0, 1.0, "ES");
        assert_near(out.fire_res, 75.0, 0.1, "fire_res capped");
        assert_near(out.cold_res, 40.0, 0.1, "cold_res");
        assert_near(out.lightning_res, -60.0, 0.1, "lightning_res default");
        assert_near(out.chaos_res, -60.0, 0.1, "chaos_res default");
        assert_near(out.block_chance, 35.0, 0.1, "block_chance");
        // mana_regen = 590 * 0.0175 = 10.325
        assert_near(out.mana_regen, 590.0 * 0.0175, 0.01, "mana_regen");
        // accuracy base = 89*2 + 64*2 = 178 + 128 = 306
        assert_near(out.accuracy, 306.0, 0.1, "accuracy");
    }

    #[test]
    fn full_known_build_witch_es() {
        // Witch level 95:
        // +200 int: int = 32 + 200 = 232
        // gear_es = 600, +150 flat ES, +120% inc ES
        // int_bonus = floor(232/5) = 46
        // ES = (600 + 150) * (1 + (120 + 46)/100) * 1.0 = 750 * 2.66 = 1995.0
        // mana base = 34 + 94*6 + floor(232/2) = 34 + 564 + 116 = 714
        let mut input = witch(95);
        input.gear_es = 600.0;
        input.modifiers = vec![
            m("Int", 200.0, "flat"),
            m("EnergyShield", 150.0, "flat"),
            m("EnergyShield", 120.0, "increased"),
        ];
        let out = evaluate_build(input);

        assert_near(out.intelligence, 232.0, 0.1, "int");
        assert_near(out.energy_shield, 1995.0, 1.0, "ES");
        assert_near(out.mana, 714.0, 1.0, "mana");
    }
}
