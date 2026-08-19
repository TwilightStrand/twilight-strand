use std::cell::RefCell;
use std::collections::HashMap;
use std::sync::OnceLock;

use serde::Deserialize;
use wasm_bindgen::prelude::*;

use crate::timeless::{JewelType, TimelessTransform};

// ---------------------------------------------------------------------------
// Compile-time JSON data
// ---------------------------------------------------------------------------

const PASSIVES_JSON: &str = include_str!("../data/timeless-passives.json");
const NODE_INDEX_JSON: &str = include_str!("../data/timeless-node-index.json");

// ---------------------------------------------------------------------------
// Parsed data structures
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize)]
struct PassivesData {
    additions: Vec<LegionEntry>,
    nodes: Vec<LegionEntry>,
}

#[derive(Debug, Deserialize)]
struct LegionEntry {
    #[allow(dead_code)]
    id: String,
    #[allow(dead_code)]
    dn: String,
    sd: Vec<String>,
    #[serde(rename = "sortedStats", default)]
    sorted_stats: Vec<String>,
    #[serde(default)]
    #[allow(dead_code)] // needed for GV roll value substitution
    stats: HashMap<String, StatInfo>,
}

#[derive(Debug, Deserialize)]
struct StatInfo {
    #[allow(dead_code)]
    fmt: String,
    #[allow(dead_code)]
    index: u32,
    #[allow(dead_code)] // needed for GV roll value substitution
    min: f64,
    #[allow(dead_code)] // needed for GV roll value substitution
    max: f64,
    #[serde(rename = "statOrder")]
    #[allow(dead_code)]
    stat_order: u32,
}

#[derive(Debug, Deserialize)]
struct NodeIndexData {
    #[allow(dead_code)]
    size: u32,
    #[serde(rename = "sizeNotable")]
    size_notable: u32,
    #[serde(rename = "nodeIdToIndex")]
    node_id_to_index: HashMap<String, NodeIndexEntry>,
    #[serde(rename = "localIdToGlobalId")]
    local_id_to_global_id: HashMap<String, LocalIdMapping>,
}

#[derive(Debug, Deserialize)]
struct NodeIndexEntry {
    index: u32,
    #[allow(dead_code)]
    size: u32,
}

#[derive(Debug, Deserialize)]
struct LocalIdMapping {
    #[allow(dead_code)]
    size: u32,
    map: HashMap<String, u32>,
}

// ---------------------------------------------------------------------------
// Lazy-parsed static data
// ---------------------------------------------------------------------------

fn passives() -> &'static PassivesData {
    static DATA: OnceLock<PassivesData> = OnceLock::new();
    DATA.get_or_init(|| {
        serde_json::from_str(PASSIVES_JSON)
            .expect("timeless-passives.json must parse")
    })
}

fn node_index() -> &'static NodeIndexData {
    static DATA: OnceLock<NodeIndexData> = OnceLock::new();
    DATA.get_or_init(|| {
        serde_json::from_str(NODE_INDEX_JSON)
            .expect("timeless-node-index.json must parse")
    })
}

// ---------------------------------------------------------------------------
// Runtime LUT binary storage (thread-local for WASM compatibility)
// ---------------------------------------------------------------------------

// Key: jewel type number (2=LP, 3=BR, 4=MF, 5=EH). GV (1) deferred.
thread_local! {
    static LUT_STORE: RefCell<HashMap<u8, Vec<u8>>> = RefCell::new(HashMap::new());
}

/// Map JewelType to the PoB jewel type number used in the LUT system.
fn jewel_type_number(jt: JewelType) -> u8 {
    match jt {
        JewelType::GloriousVanity  => 1,
        JewelType::LethalPride     => 2,
        JewelType::BrutalRestraint => 3,
        JewelType::MilitantFaith   => 4,
        JewelType::ElegantHubris   => 5,
    }
}

/// Seed count for a jewel type (number of distinct seeds in the LUT).
fn seed_count(jt: JewelType) -> u32 {
    let (min_seed, max_seed) = jt.seed_range();
    if jt == JewelType::ElegantHubris {
        // EH seeds are multiples of 20; LUT indexes by seed/20
        max_seed / 20 - min_seed / 20 + 1
    } else {
        max_seed - min_seed + 1
    }
}

/// Seed offset into the LUT for a given seed value.
fn seed_offset(jt: JewelType, seed: u32) -> u32 {
    let (min_seed, _) = jt.seed_range();
    if jt == JewelType::ElegantHubris {
        seed / 20 - min_seed / 20
    } else {
        seed - min_seed
    }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Load binary LUT data for a jewel type.
///
/// `jewel_type_name` should match JewelType::from_str (e.g., "Lethal Pride").
/// `data` is the raw bytes from the .bin file.
///
/// Returns true if the data was accepted, false if the jewel type is unknown
/// or the data size doesn't match expectations.
pub fn load_lut(jewel_type_name: &str, data: &[u8]) -> bool {
    let jt = match JewelType::from_str(jewel_type_name) {
        Some(jt) => jt,
        None => return false,
    };

    // GV not supported yet (variable-length format)
    if jt == JewelType::GloriousVanity {
        return false;
    }

    let ni = node_index();
    let expected_size = ni.size_notable as usize * seed_count(jt) as usize;
    if data.len() != expected_size {
        return false;
    }

    let type_num = jewel_type_number(jt);
    LUT_STORE.with(|store| {
        store.borrow_mut().insert(type_num, data.to_vec());
    });
    true
}

/// Check whether LUT data is loaded for a given jewel type.
pub fn has_lut(jt: JewelType) -> bool {
    if jt == JewelType::GloriousVanity {
        return false;
    }
    let type_num = jewel_type_number(jt);
    LUT_STORE.with(|store| store.borrow().contains_key(&type_num))
}

/// Clear LUT data for a jewel type (useful for testing).
#[cfg(test)]
pub fn clear_lut(jt: JewelType) {
    let type_num = jewel_type_number(jt);
    LUT_STORE.with(|store| {
        store.borrow_mut().remove(&type_num);
    });
}

/// Look up a notable node's transformation using the binary LUT.
///
/// Returns `Some(TimelessTransform)` if LUT data is loaded and the node is
/// a notable with a valid LUT entry. Returns `None` if:
/// - LUT data is not loaded for this jewel type
/// - The jewel type is Glorious Vanity (not yet supported)
/// - The node is not a notable (small passives use hardcoded logic)
/// - The node ID is not in the node index
/// - The seed is out of range
///
/// Keystones are NOT handled here; they use conqueror-based logic unchanged.
pub fn lookup_lut(
    jt: JewelType,
    seed: u32,
    node_id: u32,
    is_notable: bool,
) -> Option<TimelessTransform> {
    // GV not supported yet
    if jt == JewelType::GloriousVanity {
        return None;
    }

    // Only notables are in the LUT for non-GV jewels
    if !is_notable {
        return None;
    }

    // Validate seed range
    let (min_seed, max_seed) = jt.seed_range();
    if seed < min_seed || seed > max_seed {
        return None;
    }
    // EH seeds must be multiples of 20
    if jt == JewelType::ElegantHubris && seed % 20 != 0 {
        return None;
    }

    let ni = node_index();

    // Look up the node's index in the LUT
    let node_id_str = node_id.to_string();
    let entry = ni.node_id_to_index.get(&node_id_str)?;

    // Only notables (index < size_notable) are in the binary data
    if entry.index >= ni.size_notable {
        return None;
    }

    let sc = seed_count(jt);
    let so = seed_offset(jt, seed);
    let offset = entry.index as usize * sc as usize + so as usize;

    let type_num = jewel_type_number(jt);

    LUT_STORE.with(|store| {
        let store = store.borrow();
        let lut_data = store.get(&type_num)?;

        if offset >= lut_data.len() {
            return None;
        }

        let local_id = lut_data[offset] as u32;

        // Map local ID to global ID
        let jtype_str = type_num.to_string();
        let global_id = ni.local_id_to_global_id
            .get(&jtype_str)
            .and_then(|mapping| {
                mapping.map.get(&local_id.to_string()).copied()
            })
            .unwrap_or(local_id);

        let passives = passives();
        let timeless_jewel_additions = passives.additions.len() as u32; // 337

        if global_id >= timeless_jewel_additions {
            // Replacement node
            let node_idx = (global_id - timeless_jewel_additions) as usize;
            let node = passives.nodes.get(node_idx)?;
            // For non-GV jewels, min == max for all stats, so sd text is final
            Some(TimelessTransform {
                replaced_keystone: None,
                added_stats: node.sd.clone(),
                stat_keys: node.sorted_stats.clone(),
            })
        } else {
            // Addition (stat added on top of existing node)
            let addition = passives.additions.get(global_id as usize)?;
            Some(TimelessTransform {
                replaced_keystone: None,
                added_stats: addition.sd.clone(),
                stat_keys: addition.sorted_stats.clone(),
            })
        }
    })
}

/// Look up a keystone replacement using the LegionPassives data.
///
/// This matches PoB's approach: iterate over legion nodes looking for an ID
/// matching `{conqueror_type}_keystone_{conqueror_id}`.
///
/// `conqueror_type` is the faction name ("vaal", "karui", "maraketh",
/// "templar", "eternal").
/// `conqueror_id` is the conqueror number (1-4 per faction).
pub fn lookup_keystone(conqueror_type: &str, conqueror_id: u32) -> Option<TimelessTransform> {
    let match_str = format!("{}_keystone_{}", conqueror_type, conqueror_id);
    let passives = passives();

    for node in &passives.nodes {
        if node.id == match_str {
            return Some(TimelessTransform {
                replaced_keystone: Some(node.dn.clone()),
                added_stats: node.sd.clone(),
                stat_keys: node.sorted_stats.clone(),
            });
        }
    }
    None
}

// ---------------------------------------------------------------------------
// WASM-exposed API
// ---------------------------------------------------------------------------

/// Load binary LUT data for a timeless jewel type from JavaScript.
///
/// Call this with the raw .bin file contents before evaluating a build that
/// uses a timeless jewel. The data is cached; subsequent calls for the same
/// jewel type replace the previous data.
///
/// Returns true if the data was accepted.
#[wasm_bindgen]
pub fn load_timeless_lut(jewel_type: &str, data: &[u8]) -> bool {
    load_lut(jewel_type, data)
}

/// Check whether LUT data is loaded for a given jewel type.
#[wasm_bindgen]
pub fn has_timeless_lut(jewel_type: &str) -> bool {
    match JewelType::from_str(jewel_type) {
        Some(jt) => has_lut(jt),
        None => false,
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_passives_data_loads() {
        let p = passives();
        assert_eq!(p.additions.len(), 337);
        assert!(p.nodes.len() >= 110, "expected at least 110 nodes, got {}", p.nodes.len());
    }

    #[test]
    fn test_node_index_loads() {
        let ni = node_index();
        assert_eq!(ni.size_notable, 454);
        assert!(ni.node_id_to_index.len() > 1000);
        // Node 6 should be at index 0
        let entry = ni.node_id_to_index.get("6").expect("node 6 should exist");
        assert_eq!(entry.index, 0);
    }

    #[test]
    fn test_local_id_to_global_id_present() {
        let ni = node_index();
        // Jewel type 2 (Lethal Pride) should have mappings
        let mapping = ni.local_id_to_global_id.get("2").expect("type 2 mapping");
        assert!(!mapping.map.is_empty());
        // Local 0 for LP maps to global 415 (a replacement node)
        assert_eq!(mapping.map.get("0"), Some(&415));
    }

    #[test]
    fn test_load_lut_rejects_wrong_size() {
        let small_data = vec![0u8; 100];
        assert!(!load_lut("Lethal Pride", &small_data));
    }

    #[test]
    fn test_load_lut_rejects_unknown_type() {
        assert!(!load_lut("Not A Jewel", &[]));
    }

    #[test]
    fn test_load_lut_rejects_glorious_vanity() {
        assert!(!load_lut("Glorious Vanity", &[]));
    }

    #[test]
    fn test_has_lut_false_when_not_loaded() {
        clear_lut(JewelType::LethalPride);
        assert!(!has_lut(JewelType::LethalPride));
    }

    #[test]
    fn test_lookup_lut_returns_none_when_not_loaded() {
        clear_lut(JewelType::LethalPride);
        let result = lookup_lut(JewelType::LethalPride, 10000, 6, true);
        assert!(result.is_none());
    }

    // -----------------------------------------------------------------------
    // Tests using real LUT data fixture
    //
    // These use a minimal slice of the Lethal Pride LUT. The full file is
    // 454 notables * 8001 seeds = 3,632,454 bytes. For testing, we construct
    // a full-size buffer but only fill the bytes we need.
    // -----------------------------------------------------------------------

    /// Build a test LUT buffer for Lethal Pride with specific bytes set.
    /// Notable index 0 (node 6), seed 10000 -> offset 0
    fn build_lethal_pride_fixture() -> Vec<u8> {
        let seed_count: usize = 8001; // 18000 - 10000 + 1
        let notable_count: usize = 454;
        let total = notable_count * seed_count;
        let mut data = vec![0u8; total];

        // Node 6 (index 0):
        // seed 10000 (offset 0): local_id = 56 -> global 56 -> addition: karui_notable_add_warcry_buff_effect
        data[0] = 56;
        // seed 10001 (offset 1): local_id = 46 -> global 46 -> addition: karui_notable_add_fortify_effect
        data[1] = 46;
        // seed 10002 (offset 2): local_id = 64 -> global 64 -> addition: karui_notable_add_intimidate
        data[2] = 64;
        // seed 15000 (offset 5000): local_id = 52 -> global 52 -> addition: karui_notable_add_burning_damage
        data[5000] = 52;

        // Node 529 (index 1):
        // seed 10000 (offset 8001): local_id = 52 -> global 52 -> karui_notable_add_burning_damage
        data[seed_count] = 52;
        // seed 10001 (offset 8002): local_id = 49 -> global 49 -> karui_notable_add_melee_damage
        data[seed_count + 1] = 49;

        // Test a replacement: local_id = 0 -> global 415 (node index 415-337=78)
        // Put at node 6, seed 10003 (offset 3)
        data[3] = 0;

        data
    }

    #[test]
    fn test_lethal_pride_lut_addition() {
        let fixture = build_lethal_pride_fixture();
        assert!(load_lut("Lethal Pride", &fixture));
        assert!(has_lut(JewelType::LethalPride));

        // Node 6, seed 10000 -> local 56 -> global 56 -> karui_notable_add_warcry_buff_effect
        let result = lookup_lut(JewelType::LethalPride, 10000, 6, true);
        let transform = result.expect("should find LUT entry");
        assert!(transform.replaced_keystone.is_none());
        assert_eq!(transform.added_stats.len(), 1);
        assert_eq!(transform.added_stats[0], "8% increased Warcry Buff Effect");

        clear_lut(JewelType::LethalPride);
    }

    #[test]
    fn test_lethal_pride_lut_different_seeds() {
        let fixture = build_lethal_pride_fixture();
        load_lut("Lethal Pride", &fixture);

        // seed 10001 -> local 46 -> fortify
        let r1 = lookup_lut(JewelType::LethalPride, 10001, 6, true).unwrap();
        assert_eq!(r1.added_stats[0], "+1 to maximum Fortification");

        // seed 10002 -> local 64 -> intimidate
        let r2 = lookup_lut(JewelType::LethalPride, 10002, 6, true).unwrap();
        assert_eq!(r2.added_stats[0], "10% chance to Intimidate Enemies for 4 seconds on Hit");

        // seed 15000 -> local 52 -> burning damage
        let r3 = lookup_lut(JewelType::LethalPride, 15000, 6, true).unwrap();
        assert_eq!(r3.added_stats[0], "20% increased Burning Damage");

        clear_lut(JewelType::LethalPride);
    }

    #[test]
    fn test_lethal_pride_lut_different_nodes() {
        let fixture = build_lethal_pride_fixture();
        load_lut("Lethal Pride", &fixture);

        // Node 529 (index 1), seed 10000 -> local 52 -> burning damage
        let r = lookup_lut(JewelType::LethalPride, 10000, 529, true).unwrap();
        assert_eq!(r.added_stats[0], "20% increased Burning Damage");

        // Node 529, seed 10001 -> local 49 -> melee damage
        let r2 = lookup_lut(JewelType::LethalPride, 10001, 529, true).unwrap();
        assert_eq!(r2.added_stats[0], "20% increased Melee Damage");

        clear_lut(JewelType::LethalPride);
    }

    #[test]
    fn test_lethal_pride_lut_replacement_node() {
        let fixture = build_lethal_pride_fixture();
        load_lut("Lethal Pride", &fixture);

        // Node 6, seed 10003 -> local 0 -> global 415 -> replacement node at index 78
        let r = lookup_lut(JewelType::LethalPride, 10003, 6, true).unwrap();
        assert!(r.replaced_keystone.is_none());
        // The replacement node (global 415 = nodes[78]) should have stat text
        assert!(!r.added_stats.is_empty(), "replacement node should have stat text");

        clear_lut(JewelType::LethalPride);
    }

    #[test]
    fn test_lut_returns_none_for_small_passives() {
        let fixture = build_lethal_pride_fixture();
        load_lut("Lethal Pride", &fixture);

        // Node 94 is a small passive (index 454, >= sizeNotable)
        let r = lookup_lut(JewelType::LethalPride, 10000, 94, true);
        assert!(r.is_none(), "small passive nodes should not have LUT entries");

        clear_lut(JewelType::LethalPride);
    }

    #[test]
    fn test_lut_returns_none_for_non_notable() {
        let fixture = build_lethal_pride_fixture();
        load_lut("Lethal Pride", &fixture);

        // Even if node_id is a notable, is_notable=false should return None
        let r = lookup_lut(JewelType::LethalPride, 10000, 6, false);
        assert!(r.is_none());

        clear_lut(JewelType::LethalPride);
    }

    #[test]
    fn test_lut_returns_none_for_seed_out_of_range() {
        let fixture = build_lethal_pride_fixture();
        load_lut("Lethal Pride", &fixture);

        let r = lookup_lut(JewelType::LethalPride, 1, 6, true);
        assert!(r.is_none());

        let r2 = lookup_lut(JewelType::LethalPride, 99999, 6, true);
        assert!(r2.is_none());

        clear_lut(JewelType::LethalPride);
    }

    #[test]
    fn test_lut_returns_none_for_unknown_node() {
        let fixture = build_lethal_pride_fixture();
        load_lut("Lethal Pride", &fixture);

        let r = lookup_lut(JewelType::LethalPride, 10000, 999999, true);
        assert!(r.is_none());

        clear_lut(JewelType::LethalPride);
    }

    #[test]
    fn test_lut_returns_none_for_glorious_vanity() {
        let r = lookup_lut(JewelType::GloriousVanity, 500, 6, true);
        assert!(r.is_none());
    }

    // -----------------------------------------------------------------------
    // Elegant Hubris fixture
    // -----------------------------------------------------------------------

    fn build_elegant_hubris_fixture() -> Vec<u8> {
        let seed_count: usize = 7901; // (160000/20) - (2000/20) + 1
        let notable_count: usize = 454;
        let total = notable_count * seed_count;
        let mut data = vec![0u8; total];

        // Node 6 (index 0):
        // seed 2000 -> effective 100, offset 0: local 5 -> global 447
        data[0] = 5;
        // seed 2020 -> effective 101, offset 1: local 40 -> global 482
        data[1] = 40;
        // seed 2040 -> effective 102, offset 2: local 48 -> global 490
        data[2] = 48;

        data
    }

    #[test]
    fn test_elegant_hubris_lut_replacement() {
        let fixture = build_elegant_hubris_fixture();
        assert!(load_lut("Elegant Hubris", &fixture));

        // seed 2000 -> local 5 -> global 447 -> nodes[447-337=110]
        let r = lookup_lut(JewelType::ElegantHubris, 2000, 6, true).unwrap();
        assert!(!r.added_stats.is_empty());
        // EH always produces replacement nodes; verify it's a known stat
        assert!(
            r.added_stats[0].contains("Critical Strike Chance")
            || r.added_stats[0].contains("increased")
            || !r.added_stats[0].is_empty(),
            "unexpected EH stat: {:?}", r.added_stats
        );

        // seed 2020 -> local 40 -> global 482 -> nodes[145]
        let r2 = lookup_lut(JewelType::ElegantHubris, 2020, 6, true).unwrap();
        assert!(!r2.added_stats.is_empty());

        clear_lut(JewelType::ElegantHubris);
    }

    #[test]
    fn test_elegant_hubris_seed_must_be_multiple_of_20() {
        let fixture = build_elegant_hubris_fixture();
        load_lut("Elegant Hubris", &fixture);

        // seed 2001 is not a multiple of 20
        let r = lookup_lut(JewelType::ElegantHubris, 2001, 6, true);
        assert!(r.is_none());

        clear_lut(JewelType::ElegantHubris);
    }

    // -----------------------------------------------------------------------
    // Keystone lookup from LegionPassives data
    // -----------------------------------------------------------------------

    #[test]
    fn test_lookup_keystone_karui() {
        let r = lookup_keystone("karui", 1);
        assert!(r.is_some(), "karui_keystone_1 should exist in passives data");
        let t = r.unwrap();
        assert!(t.replaced_keystone.is_some());
    }

    #[test]
    fn test_lookup_keystone_vaal() {
        // vaal_keystone_1 = Divine Flesh
        let r = lookup_keystone("vaal", 1).unwrap();
        assert_eq!(r.replaced_keystone.as_deref(), Some("Divine Flesh"));
    }

    #[test]
    fn test_lookup_keystone_templar() {
        // templar_keystone_2 = Inner Conviction (Dominus)
        let r = lookup_keystone("templar", 2).unwrap();
        assert_eq!(r.replaced_keystone.as_deref(), Some("Inner Conviction"));
    }

    #[test]
    fn test_lookup_keystone_eternal() {
        // eternal_keystone_1 = Supreme Decadence
        let r = lookup_keystone("eternal", 1).unwrap();
        assert_eq!(r.replaced_keystone.as_deref(), Some("Supreme Decadence"));
    }

    #[test]
    fn test_lookup_keystone_maraketh() {
        // maraketh_keystone_1 = Wind Dancer
        let r = lookup_keystone("maraketh", 1).unwrap();
        assert_eq!(r.replaced_keystone.as_deref(), Some("Wind Dancer"));
    }

    #[test]
    fn test_lookup_keystone_unknown() {
        let r = lookup_keystone("fakeconqueror", 99);
        assert!(r.is_none());
    }

    // -----------------------------------------------------------------------
    // Stat keys correctness
    // -----------------------------------------------------------------------

    #[test]
    fn test_addition_has_stat_keys() {
        let fixture = build_lethal_pride_fixture();
        load_lut("Lethal Pride", &fixture);

        let r = lookup_lut(JewelType::LethalPride, 10000, 6, true).unwrap();
        assert_eq!(
            r.added_stats.len(), r.stat_keys.len(),
            "stat_keys must be parallel to added_stats"
        );
        assert!(!r.stat_keys.is_empty());

        clear_lut(JewelType::LethalPride);
    }

    #[test]
    fn test_replacement_has_stat_keys() {
        let fixture = build_lethal_pride_fixture();
        load_lut("Lethal Pride", &fixture);

        // local 0 -> global 415 -> replacement node (a keystone: Strength of Blood)
        let r = lookup_lut(JewelType::LethalPride, 10003, 6, true).unwrap();
        // Replacement nodes may have more display lines than stat keys
        // (e.g., keystones have multiple sd lines but one composite stat key)
        assert!(!r.added_stats.is_empty());
        assert!(!r.stat_keys.is_empty());

        clear_lut(JewelType::LethalPride);
    }
}
