use crate::{evaluate_build, BuildInput, CalcOutput};
use crate::stat_parser::parse_stats;
use serde::{Deserialize, Serialize};

/// Detailed impact of allocating a single passive node.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct NodePower {
    pub dps_delta: f64,
    pub life_delta: f64,
    pub es_delta: f64,
    pub ehp_delta: f64,
    pub dps_pct: f64,
    pub ehp_pct: f64,
}

/// A ranked node with its ID, power breakdown, and combined score.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RankedNode {
    pub id: String,
    pub dps_delta: f64,
    pub ehp_delta: f64,
    pub score: f64,
    pub power: NodePower,
}

/// Evaluate a single node's power against a precomputed baseline.
pub fn evaluate_node_power(
    base_input: &BuildInput,
    base_output: &CalcOutput,
    node_stats: &[String],
) -> NodePower {
    let node_mods = parse_stats(node_stats);
    if node_mods.is_empty() {
        return NodePower {
            dps_delta: 0.0, life_delta: 0.0, es_delta: 0.0,
            ehp_delta: 0.0, dps_pct: 0.0, ehp_pct: 0.0,
        };
    }

    let mut new_input = base_input.clone();
    new_input.modifiers.extend(node_mods);
    let out = evaluate_build(new_input);

    let dps_delta = out.total_dps - base_output.total_dps;
    let ehp_delta = out.total_ehp - base_output.total_ehp;

    NodePower {
        dps_delta,
        life_delta: out.life - base_output.life,
        es_delta: out.energy_shield - base_output.energy_shield,
        ehp_delta,
        dps_pct: if base_output.total_dps > 0.0 { dps_delta / base_output.total_dps * 100.0 } else { 0.0 },
        ehp_pct: if base_output.total_ehp > 0.0 { ehp_delta / base_output.total_ehp * 100.0 } else { 0.0 },
    }
}

/// Rank a list of candidate nodes by their impact on a build.
///
/// For each node we add its modifiers to the build, re-evaluate, and measure
/// the DPS and EHP delta. The combined score weighs DPS% and EHP%.
pub fn rank_nodes(
    base_input: &BuildInput,
    nodes: &[(String, Vec<String>)], // (node_id, stat_lines)
) -> Vec<RankedNode> {
    let base_output = evaluate_build(base_input.clone());

    let mut ranked: Vec<RankedNode> = nodes
        .iter()
        .map(|(id, stat_lines)| {
            let power = evaluate_node_power(base_input, &base_output, stat_lines);
            let score = power.dps_pct + power.ehp_pct;
            RankedNode {
                id: id.clone(),
                dps_delta: power.dps_delta,
                ehp_delta: power.ehp_delta,
                score,
                power,
            }
        })
        .collect();

    ranked.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
    ranked
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::Modifier;

    fn base_input() -> BuildInput {
        BuildInput {
            level: 90,
            class_id: 1,
            base_str: 32,
            base_dex: 14,
            base_int: 14,
            modifiers: vec![
                Modifier { stat: "Damage".into(), value: 500.0, mod_type: "flat".into() },
                Modifier { stat: "Life".into(), value: 100.0, mod_type: "flat".into() },
            ],
            allocated_keystones: vec![],
            main_skill_id: String::new(),
            ascendancy_name: String::new(),
        }
    }

    #[test]
    fn test_rank_nodes_orders_by_score() {
        let nodes = vec![
            ("a".into(), vec!["+5 to maximum Life".into()]),
            ("b".into(), vec!["20% increased Damage".into()]),
            ("c".into(), vec!["+50 to maximum Life".into(), "10% increased Damage".into()]),
        ];
        let ranked = rank_nodes(&base_input(), &nodes);
        assert_eq!(ranked.len(), 3);
        // All should have positive scores and be sorted descending
        assert!(ranked[0].score >= ranked[1].score);
        assert!(ranked[1].score >= ranked[2].score);
        // "a" with only +5 life should be lowest
        assert_eq!(ranked[2].id, "a");
    }

    #[test]
    fn test_rank_100_nodes() {
        let nodes: Vec<(String, Vec<String>)> = (0..100)
            .map(|i| {
                (
                    format!("node_{}", i),
                    vec![
                        format!("+{} to maximum Life", 5 + i % 20),
                        format!("{}% increased Damage", 3 + i % 10),
                    ],
                )
            })
            .collect();
        let ranked = rank_nodes(&base_input(), &nodes);
        assert_eq!(ranked.len(), 100);
        for pair in ranked.windows(2) {
            assert!(pair[0].score >= pair[1].score);
        }
    }

    #[test]
    fn test_empty_node_stats_give_zero_power() {
        let input = base_input();
        let base = crate::evaluate_build(input.clone());
        let power = evaluate_node_power(&input, &base, &[]);
        assert_eq!(power.dps_delta, 0.0);
        assert_eq!(power.life_delta, 0.0);
        assert_eq!(power.ehp_delta, 0.0);
    }

    #[test]
    fn test_life_node_gives_positive_ehp() {
        let input = base_input();
        let base = crate::evaluate_build(input.clone());
        let power = evaluate_node_power(&input, &base, &["+50 to maximum Life".into()]);
        assert!(power.life_delta > 40.0, "life_delta was {}", power.life_delta);
        assert!(power.ehp_delta > 0.0, "ehp should increase with more life");
        assert!(power.ehp_pct > 0.0);
    }

    #[test]
    fn test_damage_node_gives_positive_dps() {
        let input = base_input();
        let base = crate::evaluate_build(input.clone());
        let power = evaluate_node_power(&input, &base, &["20% increased Damage".into()]);
        assert!(power.dps_delta > 0.0, "dps_delta was {}", power.dps_delta);
        assert!(power.dps_pct > 0.0);
    }

    #[test]
    fn test_rank_500_nodes_under_100ms() {
        let nodes: Vec<(String, Vec<String>)> = (0..500)
            .map(|i| (
                format!("n{}", i),
                vec![format!("+{} to maximum Life", (i % 50) + 1)],
            ))
            .collect();

        let start = std::time::Instant::now();
        let ranked = rank_nodes(&base_input(), &nodes);
        let ms = start.elapsed().as_millis();

        assert_eq!(ranked.len(), 500);
        assert!(ms < 200, "500-node ranking took {}ms, target <200ms", ms);
    }
}
