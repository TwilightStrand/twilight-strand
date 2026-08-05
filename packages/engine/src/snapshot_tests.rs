#[cfg(test)]
mod tests {
    use crate::*;
    use std::fs;
    use std::path::PathBuf;

    #[derive(serde::Deserialize)]
    struct SnapshotBuild {
        name: String,
        input: BuildInput,
        snapshot: Option<SnapshotOutput>,
    }

    #[derive(serde::Deserialize, serde::Serialize, Clone)]
    struct SnapshotOutput {
        life: f64,
        energy_shield: f64,
        mana: f64,
        strength: f64,
        dexterity: f64,
        intelligence: f64,
        armour: f64,
        evasion: f64,
        fire_res: f64,
        cold_res: f64,
        lightning_res: f64,
        chaos_res: f64,
        total_dps: f64,
        combined_dps: f64,
        total_ehp: f64,
        crit_chance: f64,
        crit_multiplier: f64,
        attack_speed: f64,
        hit_chance: f64,
        life_regen: f64,
        bleed_dps: f64,
        poison_dps: f64,
        ignite_dps: f64,
        impale_dps: f64,
    }

    impl From<&CalcOutput> for SnapshotOutput {
        fn from(o: &CalcOutput) -> Self {
            SnapshotOutput {
                life: round2(o.life),
                energy_shield: round2(o.energy_shield),
                mana: round2(o.mana),
                strength: round2(o.strength),
                dexterity: round2(o.dexterity),
                intelligence: round2(o.intelligence),
                armour: round2(o.armour),
                evasion: round2(o.evasion),
                fire_res: round2(o.fire_res),
                cold_res: round2(o.cold_res),
                lightning_res: round2(o.lightning_res),
                chaos_res: round2(o.chaos_res),
                total_dps: round2(o.total_dps),
                combined_dps: round2(o.combined_dps),
                total_ehp: round2(o.total_ehp),
                crit_chance: round2(o.crit_chance),
                crit_multiplier: round2(o.crit_multiplier),
                attack_speed: round2(o.attack_speed),
                hit_chance: round2(o.hit_chance),
                life_regen: round2(o.life_regen),
                bleed_dps: round2(o.bleed_dps),
                poison_dps: round2(o.poison_dps),
                ignite_dps: round2(o.ignite_dps),
                impale_dps: round2(o.impale_dps),
            }
        }
    }

    fn round2(v: f64) -> f64 {
        (v * 100.0).round() / 100.0
    }

    fn snapshot_path() -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tests/snapshots/builds.json")
    }

    fn load_builds() -> Vec<SnapshotBuild> {
        let content = fs::read_to_string(snapshot_path()).expect("Failed to read builds.json");
        serde_json::from_str(&content).expect("Failed to parse builds.json")
    }

    #[test]
    fn snapshot_all_builds_evaluate() {
        let builds = load_builds();
        assert!(!builds.is_empty(), "No builds in snapshot file");

        for build in &builds {
            let output = evaluate_build(build.input.clone());
            println!("=== {} ===", build.name);
            println!("  life={:.0} es={:.0} mana={:.0}", output.life, output.energy_shield, output.mana);
            println!("  str={:.0} dex={:.0} int={:.0}", output.strength, output.dexterity, output.intelligence);
            println!("  armour={:.0} evasion={:.0}", output.armour, output.evasion);
            println!("  fire={:.0} cold={:.0} light={:.0} chaos={:.0}", output.fire_res, output.cold_res, output.lightning_res, output.chaos_res);
            println!("  dps={:.1} combined={:.1} ehp={:.0}", output.total_dps, output.combined_dps, output.total_ehp);
            println!("  crit={:.1}% multi={:.0} aspd={:.2} hit={:.1}%", output.crit_chance, output.crit_multiplier, output.attack_speed, output.hit_chance);
            println!("  regen={:.1}/s bleed={:.1} poison={:.1} ignite={:.1} impale={:.1}", output.life_regen, output.bleed_dps, output.poison_dps, output.ignite_dps, output.impale_dps);

            assert!(output.life > 0.0 || output.energy_shield > 0.0, "{}: no pool", build.name);
            assert!(output.mana > 0.0, "{}: no mana", build.name);
        }
    }

    #[test]
    fn snapshot_update_and_verify() {
        let mut builds = load_builds();
        let mut any_updated = false;
        let mut mismatches: Vec<String> = Vec::new();

        for build in &mut builds {
            let output = evaluate_build(build.input.clone());
            let current = SnapshotOutput::from(&output);

            if let Some(ref snap) = build.snapshot {
                let diffs = compare_snapshot(snap, &current, &build.name);
                if !diffs.is_empty() {
                    mismatches.extend(diffs);
                }
            } else {
                println!("[snapshot] Recording first snapshot for: {}", build.name);
                build.snapshot = Some(current);
                any_updated = true;
            }
        }

        if any_updated {
            let json = serde_json::to_string_pretty(&builds
                .iter()
                .map(|b| {
                    serde_json::json!({
                        "name": b.name,
                        "input": b.input,
                        "snapshot": b.snapshot
                    })
                })
                .collect::<Vec<_>>()
            ).unwrap();
            fs::write(snapshot_path(), json).expect("Failed to write snapshots");
            println!("[snapshot] Snapshots updated. Run tests again to verify.");
        }

        if !mismatches.is_empty() {
            println!("\n=== SNAPSHOT MISMATCHES ===");
            for m in &mismatches {
                println!("  {}", m);
            }
            panic!("{} snapshot mismatches found. If intentional (engine improvement), delete snapshot field and re-run to update.", mismatches.len());
        }
    }

    fn compare_snapshot(expected: &SnapshotOutput, actual: &SnapshotOutput, name: &str) -> Vec<String> {
        let mut diffs = Vec::new();
        let tolerance = 0.01; // 1% tolerance

        macro_rules! check {
            ($field:ident) => {
                let e = expected.$field;
                let a = actual.$field;
                if e.abs() > 0.01 {
                    let pct = ((a - e) / e).abs();
                    if pct > tolerance {
                        diffs.push(format!("{} {}: expected {:.2}, got {:.2} ({:.1}% off)",
                            name, stringify!($field), e, a, pct * 100.0));
                    }
                } else if (a - e).abs() > 1.0 {
                    diffs.push(format!("{} {}: expected {:.2}, got {:.2}",
                        name, stringify!($field), e, a));
                }
            }
        }

        check!(life);
        check!(energy_shield);
        check!(mana);
        check!(strength);
        check!(dexterity);
        check!(intelligence);
        check!(armour);
        check!(evasion);
        check!(fire_res);
        check!(cold_res);
        check!(lightning_res);
        check!(chaos_res);
        check!(total_dps);
        check!(combined_dps);
        check!(total_ehp);
        check!(crit_chance);
        check!(crit_multiplier);
        check!(attack_speed);
        check!(hit_chance);
        check!(life_regen);
        check!(bleed_dps);
        check!(poison_dps);
        check!(ignite_dps);
        check!(impale_dps);

        diffs
    }
}
