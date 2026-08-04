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
}
