use std::collections::{HashMap, HashSet, VecDeque};
use serde::{Serialize, Deserialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PathResult {
    pub path: Vec<u32>,
    pub cost: usize,
    pub notables_gained: Vec<u32>,
}

pub fn shortest_path(
    from: u32,
    to: u32,
    neighbors: &HashMap<u32, Vec<u32>>,
) -> Option<Vec<u32>> {
    if from == to {
        return Some(vec![from]);
    }

    let mut visited = HashSet::new();
    let mut parent: HashMap<u32, u32> = HashMap::new();
    let mut queue = VecDeque::new();

    visited.insert(from);
    queue.push_back(from);

    while let Some(current) = queue.pop_front() {
        if let Some(nbrs) = neighbors.get(&current) {
            for &next in nbrs {
                if visited.contains(&next) {
                    continue;
                }
                visited.insert(next);
                parent.insert(next, current);

                if next == to {
                    let mut path = vec![to];
                    let mut node = to;
                    while let Some(&p) = parent.get(&node) {
                        path.push(p);
                        node = p;
                        if node == from {
                            break;
                        }
                    }
                    path.reverse();
                    return Some(path);
                }

                queue.push_back(next);
            }
        }
    }

    None
}

pub fn optimal_path_to_targets(
    allocated: &HashSet<u32>,
    targets: &[u32],
    neighbors: &HashMap<u32, Vec<u32>>,
) -> Vec<PathResult> {
    let mut results = Vec::new();

    for &target in targets {
        if allocated.contains(&target) {
            continue;
        }

        let mut best_path: Option<Vec<u32>> = None;
        let mut best_cost = usize::MAX;

        for &alloc in allocated {
            if let Some(path) = shortest_path(alloc, target, neighbors) {
                let cost = path.iter().filter(|n| !allocated.contains(n)).count();
                if cost < best_cost {
                    best_cost = cost;
                    best_path = Some(path);
                }
            }
        }

        if let Some(path) = best_path {
            let new_nodes: Vec<u32> = path
                .iter()
                .filter(|n| !allocated.contains(n))
                .copied()
                .collect();

            results.push(PathResult {
                path: new_nodes,
                cost: best_cost,
                notables_gained: vec![target],
            });
        }
    }

    results.sort_by_key(|r| r.cost);
    results
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_graph() -> HashMap<u32, Vec<u32>> {
        let mut g: HashMap<u32, Vec<u32>> = HashMap::new();
        g.insert(1, vec![2]);
        g.insert(2, vec![1, 3]);
        g.insert(3, vec![2, 4, 6]);
        g.insert(4, vec![3, 5]);
        g.insert(5, vec![4]);
        g.insert(6, vec![3, 7]);
        g.insert(7, vec![6]);
        g
    }

    #[test]
    fn test_shortest_path_linear() {
        let g = sample_graph();
        let path = shortest_path(1, 5, &g).unwrap();
        assert_eq!(path, vec![1, 2, 3, 4, 5]);
    }

    #[test]
    fn test_shortest_path_branch() {
        let g = sample_graph();
        let path = shortest_path(1, 7, &g).unwrap();
        assert_eq!(path, vec![1, 2, 3, 6, 7]);
    }

    #[test]
    fn test_same_node() {
        let g = sample_graph();
        let path = shortest_path(3, 3, &g).unwrap();
        assert_eq!(path, vec![3]);
    }

    #[test]
    fn test_no_path() {
        let mut g = sample_graph();
        g.insert(99, vec![]);
        assert!(shortest_path(1, 99, &g).is_none());
    }

    #[test]
    fn test_optimal_targets() {
        let g = sample_graph();
        let allocated: HashSet<u32> = [1, 2, 3].iter().copied().collect();
        let results = optimal_path_to_targets(&allocated, &[5, 7], &g);
        assert_eq!(results.len(), 2);
        assert!(results.iter().all(|r| r.cost == 2));
    }

    #[test]
    fn test_already_allocated_skipped() {
        let g = sample_graph();
        let allocated: HashSet<u32> = [1, 2, 3].iter().copied().collect();
        let results = optimal_path_to_targets(&allocated, &[3], &g);
        assert_eq!(results.len(), 0);
    }

    #[test]
    fn test_mixed_targets() {
        let g = sample_graph();
        let allocated: HashSet<u32> = [1, 2, 3].iter().copied().collect();
        let results = optimal_path_to_targets(&allocated, &[3, 4, 7], &g);
        // 3 already allocated, 4 costs 1, 7 costs 2
        assert_eq!(results.len(), 2);
        assert_eq!(results[0].cost, 1); // node 4
        assert_eq!(results[1].cost, 2); // node 7
    }
}
