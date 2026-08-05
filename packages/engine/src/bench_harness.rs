#[cfg(test)]
mod archetype_tests {
    use crate::*;
    use std::time::Instant;

    fn m(stat: &str, value: f64, mod_type: &str) -> Modifier {
        Modifier { stat: stat.into(), value, mod_type: mod_type.into() }
    }

    // -----------------------------------------------------------------------
    // Build archetype constructors - realistic endgame builds
    // -----------------------------------------------------------------------

    fn phys_cyclone_slayer() -> BuildInput {
        BuildInput {
            level: 95,
            class_id: 4, // Duelist
            ascendancy_name: "Slayer".into(),
            main_skill_id: "Cyclone".into(),
            support_gems: vec![
                "Melee Physical Damage Support".into(),
                "Brutality Support".into(),
                "Faster Attacks Support".into(),
                "Increased Critical Strikes Support".into(),
            ],
            equipped_uniques: vec!["Starforge".into()],
            active_flasks: vec![
                "Lion's Roar".into(),
                "Diamond Flask".into(),
            ],
            weapon_phys_min: 120.0,
            weapon_phys_max: 380.0,
            weapon_aps: 1.35,
            weapon_crit: 5.0,
            power_charges: 0,
            frenzy_charges: 3,
            modifiers: vec![
                m("Life", 120.0, "flat"),
                m("Life", 180.0, "increased"),
                m("Str", 150.0, "flat"),
                m("Dex", 60.0, "flat"),
                m("Armour", 1500.0, "flat"),
                m("Armour", 80.0, "increased"),
                m("FireRes", 140.0, "flat"),
                m("ColdRes", 135.0, "flat"),
                m("LightningRes", 130.0, "flat"),
                m("ChaosRes", 40.0, "flat"),
                m("Damage", 80.0, "increased"),
                m("PhysicalDamage", 60.0, "increased"),
                m("AttackSpeed", 25.0, "increased"),
                m("CritChance", 60.0, "increased"),
                m("CritMultiplier", 80.0, "flat"),
                m("Accuracy", 500.0, "flat"),
                m("BlockChance", 20.0, "flat"),
                m("LifeRegenPct", 1.5, "flat"),
                m("LifeLeechPct", 0.8, "flat"),
            ],
            ..Default::default()
        }
    }

    fn rf_juggernaut() -> BuildInput {
        BuildInput {
            level: 92,
            class_id: 1,
            ascendancy_name: "Juggernaut".into(),
            main_skill_id: "RighteousFire".into(),
            equipped_uniques: vec!["Kaom's Heart".into()],
            active_flasks: vec![
                "Granite Flask".into(),
                "Basalt Flask".into(),
            ],
            endurance_charges: 6,
            modifiers: vec![
                m("Life", 200.0, "flat"),
                m("Life", 250.0, "increased"),
                m("Str", 200.0, "flat"),
                m("Armour", 3000.0, "flat"),
                m("Armour", 150.0, "increased"),
                m("FireRes", 169.0, "flat"), // overcapped
                m("ColdRes", 135.0, "flat"),
                m("LightningRes", 135.0, "flat"),
                m("ChaosRes", 60.0, "flat"),
                m("FireDamage", 80.0, "increased"),
                m("DamageOverTime", 60.0, "increased"),
                m("Damage", 40.0, "increased"),
                m("LifeRegenPct", 8.0, "flat"),
                m("LifeRegen", 100.0, "flat"),
                m("FireResMax", 3.0, "flat"),
            ],
            on_full_life: true,
            ..Default::default()
        }
    }

    fn ci_occultist_cold_dot() -> BuildInput {
        BuildInput {
            level: 94,
            class_id: 3, // Witch
            ascendancy_name: "Occultist".into(),
            main_skill_id: "Vortex".into(),
            allocated_keystones: vec!["Chaos Inoculation".into()],
            support_gems: vec![
                "Controlled Destruction Support".into(),
                "Efficacy Support".into(),
                "Swift Affliction Support".into(),
            ],
            modifiers: vec![
                m("EnergyShield", 800.0, "flat"),
                m("EnergyShield", 250.0, "increased"),
                m("Int", 200.0, "flat"),
                m("FireRes", 135.0, "flat"),
                m("ColdRes", 135.0, "flat"),
                m("LightningRes", 135.0, "flat"),
                m("ColdDamage", 100.0, "increased"),
                m("DamageOverTime", 80.0, "increased"),
                m("SpellDamage", 60.0, "increased"),
                m("Damage", 40.0, "increased"),
                m("CritChance", 80.0, "increased"),
                m("CritMultiplier", 60.0, "flat"),
                m("SpellSuppression", 40.0, "flat"),
            ],
            ..Default::default()
        }
    }

    fn lightning_arrow_deadeye() -> BuildInput {
        BuildInput {
            level: 93,
            class_id: 2, // Ranger
            ascendancy_name: "Deadeye".into(),
            main_skill_id: "LightningArrow".into(),
            support_gems: vec![
                "Elemental Damage with Attacks Support".into(),
                "Added Cold Damage Support".into(),
                "Lightning Penetration Support".into(),
                "Faster Attacks Support".into(),
            ],
            weapon_phys_min: 30.0,
            weapon_phys_max: 90.0,
            weapon_aps: 1.5,
            weapon_crit: 5.0,
            frenzy_charges: 4,
            power_charges: 3,
            modifiers: vec![
                m("Life", 80.0, "flat"),
                m("Life", 150.0, "increased"),
                m("Dex", 180.0, "flat"),
                m("Evasion", 2000.0, "flat"),
                m("Evasion", 120.0, "increased"),
                m("FireRes", 135.0, "flat"),
                m("ColdRes", 135.0, "flat"),
                m("LightningRes", 135.0, "flat"),
                m("Damage", 60.0, "increased"),
                m("ProjectileDamage", 40.0, "increased"),
                m("AttackSpeed", 30.0, "increased"),
                m("CritChance", 100.0, "increased"),
                m("CritMultiplier", 120.0, "flat"),
                m("Accuracy", 800.0, "flat"),
                m("LightningDamage", 50.0, "increased"),
                m("LightningPenetration", 15.0, "flat"),
                m("SpellSuppression", 60.0, "flat"),
                m("AddedLightningMin", 10.0, "flat"),
                m("AddedLightningMax", 200.0, "flat"),
            ],
            ..Default::default()
        }
    }

    fn poison_assassin() -> BuildInput {
        BuildInput {
            level: 92,
            class_id: 6, // Shadow
            ascendancy_name: "Assassin".into(),
            main_skill_id: "VipersStrike".into(),
            support_gems: vec![
                "Deadly Ailments Support".into(),
                "Unbound Ailments Support".into(),
                "Void Manipulation Support".into(),
            ],
            weapon_phys_min: 40.0,
            weapon_phys_max: 160.0,
            weapon_aps: 1.8,
            weapon_crit: 6.5,
            frenzy_charges: 4,
            power_charges: 4,
            modifiers: vec![
                m("Life", 100.0, "flat"),
                m("Life", 160.0, "increased"),
                m("Dex", 120.0, "flat"),
                m("Evasion", 1500.0, "flat"),
                m("Evasion", 80.0, "increased"),
                m("FireRes", 135.0, "flat"),
                m("ColdRes", 120.0, "flat"),
                m("LightningRes", 130.0, "flat"),
                m("ChaosRes", 60.0, "flat"),
                m("ChaosDamage", 60.0, "increased"),
                m("Damage", 40.0, "increased"),
                m("AttackSpeed", 20.0, "increased"),
                m("CritChance", 80.0, "increased"),
                m("CritMultiplier", 50.0, "flat"),
                m("PoisonChance", 100.0, "flat"),
                m("PoisonDamage", 0.0, "increased"),
                m("AddedChaosMin", 30.0, "flat"),
                m("AddedChaosMax", 60.0, "flat"),
            ],
            ..Default::default()
        }
    }

    fn champion_impale() -> BuildInput {
        BuildInput {
            level: 93,
            class_id: 4,
            ascendancy_name: "Champion".into(),
            main_skill_id: "GroundSlam".into(),
            support_gems: vec![
                "Melee Physical Damage Support".into(),
                "Brutality Support".into(),
                "Concentrated Effect Support".into(),
            ],
            equipped_uniques: vec!["Belly of the Beast".into()],
            active_flasks: vec!["Lion's Roar".into()],
            weapon_phys_min: 80.0,
            weapon_phys_max: 280.0,
            weapon_aps: 1.4,
            weapon_crit: 5.0,
            frenzy_charges: 3,
            have_fortify: true,
            modifiers: vec![
                m("Life", 150.0, "flat"),
                m("Life", 200.0, "increased"),
                m("Str", 180.0, "flat"),
                m("Armour", 2000.0, "flat"),
                m("Armour", 100.0, "increased"),
                m("FireRes", 140.0, "flat"),
                m("ColdRes", 135.0, "flat"),
                m("LightningRes", 130.0, "flat"),
                m("PhysicalDamage", 80.0, "increased"),
                m("MeleeDamage", 40.0, "increased"),
                m("Damage", 30.0, "increased"),
                m("AttackSpeed", 15.0, "increased"),
                m("Accuracy", 600.0, "flat"),
                m("CritChance", 40.0, "increased"),
                m("CritMultiplier", 50.0, "flat"),
                m("BlockChance", 30.0, "flat"),
                m("LifeRegenPct", 2.0, "flat"),
            ],
            ..Default::default()
        }
    }

    fn fire_convert_elementalist() -> BuildInput {
        BuildInput {
            level: 93,
            class_id: 3,
            ascendancy_name: "Elementalist".into(),
            main_skill_id: "Fireball".into(),
            support_gems: vec![
                "Elemental Focus Support".into(),
                "Burning Damage Support".into(),
                "Controlled Destruction Support".into(),
            ],
            power_charges: 4,
            conversion_phys_to_fire: 50.0,
            modifiers: vec![
                m("Life", 80.0, "flat"),
                m("Life", 140.0, "increased"),
                m("Int", 150.0, "flat"),
                m("EnergyShield", 300.0, "flat"),
                m("EnergyShield", 60.0, "increased"),
                m("FireRes", 140.0, "flat"),
                m("ColdRes", 135.0, "flat"),
                m("LightningRes", 135.0, "flat"),
                m("FireDamage", 120.0, "increased"),
                m("SpellDamage", 80.0, "increased"),
                m("Damage", 40.0, "increased"),
                m("CritChance", 100.0, "increased"),
                m("CritMultiplier", 80.0, "flat"),
                m("FirePenetration", 20.0, "flat"),
                m("Damage", 200.0, "flat"),
            ],
            ..Default::default()
        }
    }

    // -----------------------------------------------------------------------
    // Archetype validation tests - verify realistic stat ranges
    // -----------------------------------------------------------------------

    #[test]
    fn archetype_phys_cyclone_slayer() {
        let out = evaluate_build(phys_cyclone_slayer());
        assert!(out.life > 3500.0, "Cyclone Slayer life too low: {}", out.life);
        assert!(out.total_dps > 1000.0, "Cyclone Slayer DPS too low: {}", out.total_dps);
        assert!(out.fire_res >= 75.0, "Fire res not capped: {}", out.fire_res);
        assert!(out.cold_res >= 75.0, "Cold res not capped: {}", out.cold_res);
        assert!(out.armour > 3000.0, "Armour too low: {}", out.armour);
        assert!(out.crit_chance > 15.0, "Crit too low: {}", out.crit_chance);
        assert!(out.attack_speed > 2.0, "Attack speed too low: {}", out.attack_speed);
        assert!(out.total_ehp > 10000.0, "EHP too low: {}", out.total_ehp);
        assert!(out.life_regen > 50.0, "Life regen too low: {}", out.life_regen);
        assert!(out.combined_dps >= out.total_dps, "Combined should >= hit DPS");
        println!("Cyclone Slayer: life={:.0} dps={:.0} ehp={:.0} armour={:.0} crit={:.1}% aspd={:.2}",
            out.life, out.total_dps, out.total_ehp, out.armour, out.crit_chance, out.attack_speed);
    }

    #[test]
    fn archetype_rf_juggernaut() {
        let out = evaluate_build(rf_juggernaut());
        assert!(out.life > 5000.0, "RF Jugg life too low: {}", out.life);
        assert!(out.fire_res >= 75.0, "Fire res not capped: {}", out.fire_res);
        assert!(out.armour > 5000.0, "RF Jugg armour too low: {}", out.armour);
        assert!(out.life_regen > 300.0, "RF Jugg regen too low: {}", out.life_regen);
        assert!(out.phys_reduction > 15.0, "Phys reduction too low: {}", out.phys_reduction);
        assert!(out.total_ehp > 15000.0, "EHP too low: {}", out.total_ehp);
        println!("RF Jugg: life={:.0} regen={:.0}/s armour={:.0} fire_res={:.0}% ehp={:.0} phys_red={:.1}%",
            out.life, out.life_regen, out.armour, out.fire_res, out.total_ehp, out.phys_reduction);
    }

    #[test]
    fn archetype_ci_occultist() {
        let out = evaluate_build(ci_occultist_cold_dot());
        assert_eq!(out.life, 1.0, "CI should have 1 life: {}", out.life);
        assert!(out.energy_shield > 2500.0, "CI ES too low: {}", out.energy_shield);
        assert!(out.chaos_res >= 75.0, "CI chaos res not maxed: {}", out.chaos_res);
        assert!(out.total_ehp > 2000.0, "CI EHP too low: {}", out.total_ehp);
        assert!(out.suppression > 30.0, "Suppression too low: {}", out.suppression);
        println!("CI Occultist: es={:.0} ehp={:.0} dps={:.0} suppression={:.0}%",
            out.energy_shield, out.total_ehp, out.total_dps, out.suppression);
    }

    #[test]
    fn archetype_la_deadeye() {
        let out = evaluate_build(lightning_arrow_deadeye());
        assert!(out.life > 2500.0, "LA Deadeye life too low: {}", out.life);
        assert!(out.evasion > 3000.0, "Evasion too low: {}", out.evasion);
        assert!(out.total_dps > 500.0, "DPS too low: {}", out.total_dps);
        assert!(out.crit_chance > 10.0, "Crit too low: {}", out.crit_chance);
        assert!(out.attack_speed > 2.0, "Attack speed too low: {}", out.attack_speed);
        assert!(out.evade_chance > 20.0, "Evade chance too low: {}", out.evade_chance);
        assert!(out.suppression >= 60.0, "Suppression too low: {}", out.suppression);
        println!("LA Deadeye: life={:.0} evasion={:.0} dps={:.0} crit={:.1}% aspd={:.2} evade={:.1}%",
            out.life, out.evasion, out.total_dps, out.crit_chance, out.attack_speed, out.evade_chance);
    }

    #[test]
    fn archetype_poison_assassin() {
        let out = evaluate_build(poison_assassin());
        assert!(out.life > 2500.0, "Poison Assassin life too low: {}", out.life);
        assert!(out.poison_dps > 0.0, "Should have poison DPS: {}", out.poison_dps);
        assert!(out.combined_dps > out.total_dps, "Combined should include poison: combined={} hit={}", out.combined_dps, out.total_dps);
        assert!(out.crit_chance > 15.0, "Assassin crit too low: {}", out.crit_chance);
        println!("Poison Assassin: life={:.0} hit_dps={:.0} poison_dps={:.0} combined={:.0} crit={:.1}%",
            out.life, out.total_dps, out.poison_dps, out.combined_dps, out.crit_chance);
    }

    #[test]
    fn archetype_champion_impale() {
        let out = evaluate_build(champion_impale());
        assert!(out.life > 3500.0, "Champion life too low: {}", out.life);
        assert!(out.total_dps > 1000.0, "Champion DPS too low: {}", out.total_dps);
        assert!(out.armour > 3000.0, "Champion armour too low: {}", out.armour);
        assert!(out.block_chance > 25.0, "Block too low: {}", out.block_chance);
        assert!(out.phys_reduction > 30.0, "Phys reduction should include fortify: {}", out.phys_reduction);
        assert!(out.life_regen > 50.0, "Life regen too low: {}", out.life_regen);
        println!("Champion: life={:.0} dps={:.0} armour={:.0} block={:.0}% phys_red={:.1}% regen={:.0}/s",
            out.life, out.total_dps, out.armour, out.block_chance, out.phys_reduction, out.life_regen);
    }

    #[test]
    fn archetype_fire_elementalist() {
        let out = evaluate_build(fire_convert_elementalist());
        assert!(out.life > 2000.0, "Elementalist life too low: {}", out.life);
        assert!(out.energy_shield > 300.0, "ES too low: {}", out.energy_shield);
        assert!(out.total_dps > 500.0, "Fire Ele DPS too low: {}", out.total_dps);
        assert!(out.crit_chance > 15.0, "Crit too low: {}", out.crit_chance);
        println!("Fire Elementalist: life={:.0} es={:.0} dps={:.0} crit={:.1}% combined={:.0}",
            out.life, out.energy_shield, out.total_dps, out.crit_chance, out.combined_dps);
    }

    // -----------------------------------------------------------------------
    // Speed benchmarks
    // -----------------------------------------------------------------------

    fn all_archetypes() -> Vec<(&'static str, BuildInput)> {
        vec![
            ("Cyclone Slayer", phys_cyclone_slayer()),
            ("RF Juggernaut", rf_juggernaut()),
            ("CI Occultist", ci_occultist_cold_dot()),
            ("LA Deadeye", lightning_arrow_deadeye()),
            ("Poison Assassin", poison_assassin()),
            ("Champion Impale", champion_impale()),
            ("Fire Elementalist", fire_convert_elementalist()),
        ]
    }

    #[test]
    fn bench_all_archetypes_single() {
        for (name, input) in all_archetypes() {
            let start = Instant::now();
            let iterations = 10_000;
            for _ in 0..iterations {
                let _ = evaluate_build(input.clone());
            }
            let elapsed = start.elapsed();
            let per_eval_us = elapsed.as_nanos() as f64 / iterations as f64 / 1000.0;
            let evals_per_sec = 1_000_000.0 / per_eval_us;
            println!("{}: {:.1}us/eval ({:.0} evals/sec)", name, per_eval_us, evals_per_sec);
            assert!(per_eval_us < 1000.0, "{} too slow: {:.1}us", name, per_eval_us);
        }
    }

    #[test]
    fn bench_throughput_mixed_builds() {
        let builds = all_archetypes();
        let total_evals = 50_000;
        let start = Instant::now();
        for i in 0..total_evals {
            let (_, input) = &builds[i % builds.len()];
            let _ = evaluate_build(input.clone());
        }
        let elapsed = start.elapsed();
        let evals_per_sec = total_evals as f64 / elapsed.as_secs_f64();
        println!("Mixed throughput: {:.0} evals/sec ({} evals in {:.1}ms)",
            evals_per_sec, total_evals, elapsed.as_millis());
        assert!(evals_per_sec > 10_000.0, "Throughput too low: {:.0}", evals_per_sec);
    }

    #[test]
    fn bench_damage_conversion_pipeline() {
        let input = fire_convert_elementalist();
        let iterations = 10_000;
        let start = Instant::now();
        for _ in 0..iterations {
            let _ = evaluate_build(input.clone());
        }
        let elapsed = start.elapsed();
        let per_eval_us = elapsed.as_nanos() as f64 / iterations as f64 / 1000.0;
        println!("Damage conversion pipeline: {:.1}us/eval", per_eval_us);
        assert!(per_eval_us < 500.0, "Conversion pipeline too slow: {:.1}us", per_eval_us);
    }

    #[test]
    fn bench_stat_parser_real_items() {
        let item_mods = vec![
            "+89 to maximum Life",
            "40% increased Armour and Evasion",
            "+42% to Fire Resistance",
            "+36% to Cold Resistance",
            "Adds 15 to 30 Physical Damage",
            "(10-15)% increased Attack Speed",
            "+200 to Accuracy Rating",
            "15% increased Global Critical Strike Chance",
            "+25% to Critical Strike Multiplier",
            "Regenerate 3.5% of Life per second",
            "10% increased Movement Speed",
            "+30 to maximum Energy Shield",
            "0.4% of Attack Damage Leeched as Life",
            "+5% to Damage over Time Multiplier",
            "8% increased Mana Reservation Efficiency of Skills",
            "+1% to all maximum Elemental Resistances",
        ];

        let iterations = 10_000;
        let start = Instant::now();
        for _ in 0..iterations {
            for line in &item_mods {
                let _ = stat_parser::parse_stat_line(line);
            }
        }
        let elapsed = start.elapsed();
        let per_line_ns = elapsed.as_nanos() as f64 / (iterations * item_mods.len()) as f64;
        let lines_per_sec = 1_000_000_000.0 / per_line_ns;
        println!("Stat parser: {:.0}ns/line ({:.0}M lines/sec)", per_line_ns, lines_per_sec / 1_000_000.0);
        assert!(per_line_ns < 100_000.0, "Stat parser too slow: {:.0}ns/line", per_line_ns);
    }

    // -----------------------------------------------------------------------
    // Regression: output field completeness
    // -----------------------------------------------------------------------

    #[test]
    fn all_output_fields_populated() {
        for (name, input) in all_archetypes() {
            let out = evaluate_build(input);
            assert!(out.life > 0.0, "{}: life is 0", name);
            assert!(out.mana > 0.0, "{}: mana is 0", name);
            assert!(out.strength > 0.0, "{}: str is 0", name);
            assert!(out.dexterity > 0.0, "{}: dex is 0", name);
            assert!(out.intelligence > 0.0, "{}: int is 0", name);
            assert!(out.total_ehp > 0.0, "{}: ehp is 0", name);
            assert!(out.hit_chance > 0.0, "{}: hit_chance is 0", name);
            assert!(out.accuracy > 0.0, "{}: accuracy is 0", name);
            assert!(out.attack_speed > 0.0, "{}: attack_speed is 0", name);
            assert!(out.crit_multiplier >= 150.0, "{}: crit multi below base 150", name);
            assert!(out.combined_dps >= 0.0, "{}: combined_dps negative", name);
            assert!(out.mana_regen > 0.0, "{}: mana_regen is 0", name);
        }
    }

    #[test]
    fn charge_bonuses_applied() {
        let mut base = BuildInput {
            level: 90, class_id: 1, ..Default::default()
        };
        let base_out = evaluate_build(base.clone());

        base.power_charges = 3;
        let with_power = evaluate_build(base.clone());
        assert!(with_power.crit_chance > base_out.crit_chance,
            "Power charges should increase crit: {} vs {}", with_power.crit_chance, base_out.crit_chance);

        base.power_charges = 0;
        base.frenzy_charges = 3;
        let with_frenzy = evaluate_build(base.clone());
        assert!(with_frenzy.attack_speed > base_out.attack_speed,
            "Frenzy charges should increase attack speed: {} vs {}", with_frenzy.attack_speed, base_out.attack_speed);
    }

    #[test]
    fn fortify_reduces_damage_taken() {
        let mut base = BuildInput {
            level: 90, class_id: 1,
            modifiers: vec![m("Life", 100.0, "flat"), m("Armour", 1000.0, "flat")],
            ..Default::default()
        };
        let without = evaluate_build(base.clone());

        base.have_fortify = true;
        let with = evaluate_build(base);

        assert!(with.total_ehp > without.total_ehp,
            "Fortify should increase EHP: {} vs {}", with.total_ehp, without.total_ehp);
        assert!(with.phys_reduction > without.phys_reduction,
            "Fortify should increase phys reduction: {} vs {}", with.phys_reduction, without.phys_reduction);
    }

    #[test]
    fn max_res_applied() {
        let input = BuildInput {
            level: 90, class_id: 1,
            modifiers: vec![
                m("FireRes", 200.0, "flat"), // 200 - 60 = 140 uncapped
                m("FireResMax", 5.0, "flat"), // max = 80
            ],
            ..Default::default()
        };
        let out = evaluate_build(input);
        assert_eq!(out.fire_res, 80.0, "Fire res should cap at 80 with +5 max: {}", out.fire_res);
    }

    #[test]
    fn damage_conversion_works() {
        let mut input = BuildInput {
            level: 90, class_id: 1,
            modifiers: vec![
                m("Damage", 500.0, "flat"),
                m("FireDamage", 100.0, "increased"),
            ],
            conversion_phys_to_fire: 100.0,
            ..Default::default()
        };
        let with_conv = evaluate_build(input.clone());

        input.conversion_phys_to_fire = 0.0;
        let without_conv = evaluate_build(input);

        // With 100% phys->fire conversion and 100% inc fire damage, DPS should be higher
        assert!(with_conv.total_dps > without_conv.total_dps,
            "Conversion + fire inc should boost DPS: {} vs {}", with_conv.total_dps, without_conv.total_dps);
    }

    #[test]
    fn suppression_improves_ehp() {
        let mut base = BuildInput {
            level: 90, class_id: 2,
            modifiers: vec![m("Life", 100.0, "flat"), m("Evasion", 1000.0, "flat")],
            ..Default::default()
        };
        let without = evaluate_build(base.clone());

        base.modifiers.push(m("SpellSuppression", 100.0, "flat"));
        let with = evaluate_build(base);

        assert!(with.total_ehp > without.total_ehp,
            "100% suppression should increase EHP: {} vs {}", with.total_ehp, without.total_ehp);
        assert_eq!(with.suppression, 100.0);
    }

    // -----------------------------------------------------------------------
    // Aura reservation tests
    // -----------------------------------------------------------------------

    #[test]
    fn mana_reservation_reduces_unreserved() {
        let input = BuildInput {
            level: 90, class_id: 1,
            mana_reserved_pct: 50.0,
            ..Default::default()
        };
        let out = evaluate_build(input);
        assert!(out.mana_unreserved < out.mana, "Unreserved should be less than total");
        let expected = out.mana * 0.5;
        assert!((out.mana_unreserved - expected).abs() < 1.0,
            "50% reserved: unreserved={:.0} expected={:.0}", out.mana_unreserved, expected);
        assert!((out.mana_reserved_percent - 50.0).abs() < 0.01);
    }

    #[test]
    fn life_reservation_reduces_unreserved() {
        let input = BuildInput {
            level: 90, class_id: 1,
            life_reserved_pct: 35.0,
            ..Default::default()
        };
        let out = evaluate_build(input);
        assert!(out.life_unreserved < out.life, "Unreserved life should be less than total");
        let expected = out.life * 0.65;
        assert!((out.life_unreserved - expected).abs() < 1.0,
            "35% reserved: unreserved={:.0} expected={:.0}", out.life_unreserved, expected);
    }

    #[test]
    fn zero_reservation_full_unreserved() {
        let input = BuildInput {
            level: 90, class_id: 1,
            ..Default::default()
        };
        let out = evaluate_build(input);
        assert!((out.mana_unreserved - out.mana).abs() < 0.01,
            "No reservation: unreserved should equal total");
        assert!((out.life_unreserved - out.life).abs() < 0.01);
    }

    #[test]
    fn pain_attunement_on_low_life() {
        let mut input = BuildInput {
            level: 90, class_id: 3,
            main_skill_id: "Fireball".into(),
            modifiers: vec![m("Damage", 500.0, "flat")],
            life_reserved_pct: 65.0, // under 50% unreserved = low life
            allocated_keystones: vec!["Pain Attunement".into()],
            ..Default::default()
        };
        let with_pa = evaluate_build(input.clone());

        input.allocated_keystones.clear();
        let without_pa = evaluate_build(input);

        assert!(with_pa.total_dps > without_pa.total_dps * 1.2,
            "Pain Attunement should boost spell DPS on low life: {} vs {}", with_pa.total_dps, without_pa.total_dps);
    }

    // -----------------------------------------------------------------------
    // Mind over Matter tests
    // -----------------------------------------------------------------------

    #[test]
    fn mom_increases_ehp() {
        let mut base = BuildInput {
            level: 90, class_id: 1,
            modifiers: vec![m("Life", 100.0, "flat"), m("Mana", 200.0, "flat")],
            ..Default::default()
        };
        let without_mom = evaluate_build(base.clone());

        base.allocated_keystones.push("Mind over Matter".into());
        let with_mom = evaluate_build(base);

        assert!(with_mom.total_ehp > without_mom.total_ehp,
            "MoM should increase EHP: {} vs {}", with_mom.total_ehp, without_mom.total_ehp);
    }

    #[test]
    fn mom_with_reserved_mana() {
        let mut input = BuildInput {
            level: 90, class_id: 1,
            modifiers: vec![m("Life", 100.0, "flat"), m("Mana", 500.0, "flat")],
            allocated_keystones: vec!["Mind over Matter".into()],
            mana_reserved_pct: 80.0, // only 20% mana unreserved
            ..Default::default()
        };
        let high_reserve = evaluate_build(input.clone());

        input.mana_reserved_pct = 0.0;
        let no_reserve = evaluate_build(input);

        assert!(no_reserve.total_ehp > high_reserve.total_ehp,
            "MoM with full mana should give more EHP than with 80% reserved: {} vs {}",
            no_reserve.total_ehp, high_reserve.total_ehp);
    }

    // -----------------------------------------------------------------------
    // Leech rate tests
    // -----------------------------------------------------------------------

    #[test]
    fn life_leech_rate_calculated() {
        let input = BuildInput {
            level: 90, class_id: 1,
            modifiers: vec![
                m("Damage", 1000.0, "flat"),
                m("LifeLeechPct", 2.0, "flat"),
            ],
            ..Default::default()
        };
        let out = evaluate_build(input);
        assert!(out.life_leech_rate > 0.0, "Should have life leech rate: {}", out.life_leech_rate);
    }

    #[test]
    fn life_leech_capped_at_20pct() {
        let input = BuildInput {
            level: 90, class_id: 1,
            modifiers: vec![
                m("Damage", 100000.0, "flat"),
                m("LifeLeechPct", 50.0, "flat"),
            ],
            ..Default::default()
        };
        let out = evaluate_build(input);
        let max = out.life * 0.20;
        assert!((out.life_leech_rate - max).abs() < 1.0,
            "Leech should cap at 20% of life ({:.0}): got {:.0}", max, out.life_leech_rate);
    }

    #[test]
    fn no_leech_without_stat() {
        let input = BuildInput {
            level: 90, class_id: 1,
            modifiers: vec![m("Damage", 1000.0, "flat")],
            ..Default::default()
        };
        let out = evaluate_build(input);
        assert_eq!(out.life_leech_rate, 0.0, "No leech without LifeLeechPct");
    }

    #[test]
    fn es_leech_rate_calculated() {
        let input = BuildInput {
            level: 90, class_id: 3,
            modifiers: vec![
                m("Damage", 1000.0, "flat"),
                m("EnergyShield", 500.0, "flat"),
                m("ESLeechPct", 1.0, "flat"),
            ],
            ..Default::default()
        };
        let out = evaluate_build(input);
        assert!(out.es_leech_rate > 0.0, "Should have ES leech rate: {}", out.es_leech_rate);
    }

    // -----------------------------------------------------------------------
    // Ward tests
    // -----------------------------------------------------------------------

    #[test]
    fn ward_from_flat_mod() {
        let input = BuildInput {
            level: 90, class_id: 1,
            modifiers: vec![m("Ward", 500.0, "flat")],
            ..Default::default()
        };
        let out = evaluate_build(input);
        assert_eq!(out.ward, 500.0, "Ward should be 500: {}", out.ward);
    }

    #[test]
    fn ward_increases_ehp() {
        let base = BuildInput {
            level: 90, class_id: 1,
            modifiers: vec![m("Life", 100.0, "flat")],
            ..Default::default()
        };
        let without_ward = evaluate_build(base.clone());

        let mut with = base;
        with.modifiers.push(m("Ward", 1000.0, "flat"));
        let with_ward = evaluate_build(with);

        assert!(with_ward.total_ehp > without_ward.total_ehp,
            "Ward should increase EHP: {} vs {}", with_ward.total_ehp, without_ward.total_ehp);
    }

    // -----------------------------------------------------------------------
    // ES Recharge tests
    // -----------------------------------------------------------------------

    #[test]
    fn es_recharge_rate_calculated() {
        let input = BuildInput {
            level: 90, class_id: 3,
            modifiers: vec![m("EnergyShield", 500.0, "flat")],
            ..Default::default()
        };
        let out = evaluate_build(input);
        assert!(out.es_recharge_rate > 0.0, "Should have ES recharge: {}", out.es_recharge_rate);
        assert!(out.energy_shield > 0.0);
    }

    #[test]
    fn es_recharge_scales_with_es() {
        let small = BuildInput {
            level: 90, class_id: 3,
            modifiers: vec![m("EnergyShield", 100.0, "flat")],
            ..Default::default()
        };
        let large = BuildInput {
            level: 90, class_id: 3,
            modifiers: vec![m("EnergyShield", 1000.0, "flat")],
            ..Default::default()
        };
        let small_out = evaluate_build(small);
        let large_out = evaluate_build(large);
        assert!(large_out.es_recharge_rate > small_out.es_recharge_rate,
            "More ES should give more recharge: {} vs {}", large_out.es_recharge_rate, small_out.es_recharge_rate);
    }

    // -----------------------------------------------------------------------
    // Dual-wield tests
    // -----------------------------------------------------------------------

    #[test]
    fn dual_wield_increases_attack_speed() {
        let mut base = BuildInput {
            level: 90, class_id: 4,
            weapon_phys_min: 50.0, weapon_phys_max: 100.0,
            weapon_aps: 1.5, weapon_crit: 5.0,
            modifiers: vec![m("Damage", 100.0, "flat")],
            ..Default::default()
        };
        let single = evaluate_build(base.clone());

        base.is_dual_wield = true;
        base.weapon2_phys_min = 40.0;
        base.weapon2_phys_max = 80.0;
        base.weapon2_aps = 1.6;
        base.weapon2_crit = 6.0;
        let dual = evaluate_build(base);

        assert!(dual.attack_speed > single.attack_speed,
            "DW should have more attack speed (10% more): {} vs {}", dual.attack_speed, single.attack_speed);
        assert!(dual.block_chance > single.block_chance,
            "DW should have more block (+15%): {} vs {}", dual.block_chance, single.block_chance);
    }

    #[test]
    fn dual_wield_averages_weapons() {
        let input = BuildInput {
            level: 90, class_id: 4,
            weapon_phys_min: 100.0, weapon_phys_max: 200.0,
            weapon_aps: 1.0, weapon_crit: 5.0,
            weapon2_phys_min: 50.0, weapon2_phys_max: 100.0,
            weapon2_aps: 2.0, weapon2_crit: 7.0,
            is_dual_wield: true,
            modifiers: vec![m("Damage", 100.0, "flat")],
            ..Default::default()
        };
        let out = evaluate_build(input);
        // Average APS = (1.0 + 2.0) / 2 = 1.5, * 1.1 (DW more) * increased
        assert!(out.attack_speed >= 1.5, "Averaged APS should be >= 1.5: {}", out.attack_speed);
    }
}
