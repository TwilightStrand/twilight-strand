# SolvedExile Rust WASM Binary Analysis

Extracted from live app on 2026-08-03.

## Binary Overview

| Property | Value |
|----------|-------|
| File | `/wasm/se_wasm_bg.wasm` |
| Size | **12.53 MB** (13,133,426 bytes) |
| WASM version | 1 |
| Code section | 8,477 KB (the compiled Rust logic) |
| Data section | 4,336 KB (embedded static data / string tables) |
| Toolchain | **Rust 1.93.1** (2026-02-11) |
| Binder | wasm-bindgen 0.2.118 |
| Linker | walrus 0.26.1 |

### WASM Sections

| Section | Size |
|---------|------|
| type | 1.8 KB |
| import | 2.5 KB |
| function | 3.5 KB |
| table | < 0.1 KB |
| memory | < 0.1 KB |
| export | 0.7 KB |
| element | 2.9 KB |
| data_count | < 0.1 KB |
| **code** | **8,477 KB** |
| **data** | **4,336 KB** |
| custom:producers | 0.1 KB |
| custom:target_features | 0.1 KB |

### Target Features

`mutable-globals`, `nontrapping-fptoint`, `bulk-memory`, `sign-ext`, `reference-types`, `multivalue`

## Exported Functions (24)

### Public API (7 module-level + 10 class methods)

```
// Module-level
evaluate_build_xml
evaluator_from_build_xml
has_timeless_luts
init_game_data
load_timeless_luts
rank_build_xmls

// WasmEvaluator methods
wasmevaluator_evaluate
wasmevaluator_evaluate_delta
wasmevaluator_new
wasmevaluator_node_count
wasmevaluator_rank_gem_candidates
wasmevaluator_rank_gem_plan_stats
wasmevaluator_rank_gem_target_baseline
wasmevaluator_rank_node_power
wasmevaluator_rank_unique_candidates
wasmevaluator_rank_variations

// Internal / wasm-bindgen housekeeping
__wbg_wasmevaluator_free
__wbindgen_malloc
__wbindgen_realloc
__wbindgen_exn_store
__externref_table_alloc
__externref_table_dealloc
__wbindgen_free
__wbindgen_start
```

### Imports

48 functions imported from `./se_wasm_bg.js` (the JS glue). All imports are `__wbg_*` bindings for JS interop (console logging, error construction, typed-array manipulation, etc.).

## Full TypeScript API (from `/wasm/se_wasm.d.ts`)

### `WasmEvaluator` class

```typescript
class WasmEvaluator {
  // Construct from a JSON-serialized WarmPayload string.
  // Payload generated server-side by /api/evaluate with include_warm_payload: true.
  constructor(payload_json: string);

  free(): void;
  [Symbol.dispose](): void;

  // Evaluate with given allocated node IDs. Returns BuildStats.
  evaluate(allocated_nodes: Uint32Array): any;

  // Compute stat deltas between current and proposed allocations.
  // Returns { current: BuildStats, proposed: BuildStats }.
  evaluate_delta(current_nodes: Uint32Array, proposed_nodes: Uint32Array): any;

  // Number of tree nodes with pre-resolved mods.
  node_count(): number;

  // Rank gem replacements for a socket group.
  // Only { id, level, quality } crosses the boundary; no XML.
  rank_gem_candidates(
    group_index: number, current_gem_id: string,
    candidate_ids: string, candidate_levels: Uint32Array,
    candidate_qualities: Uint32Array, metric: string
  ): Float64Array;

  // Plan-lane hit counters after a gem-rank pass: [hits, reroutes].
  rank_gem_plan_stats(): Uint32Array;

  // Baseline metric for gem-candidate deltas (sidebar-selected skill).
  rank_gem_target_baseline(
    group_index: number, _current_gem_id: string, metric: string
  ): number;

  // Score reachable passive-tree frontier (native Rust node-power).
  // max_depth == 0 means whole connected tree.
  rank_node_power(
    allocated_nodes: Uint32Array, max_depth: number,
    include_masteries: boolean, include_allocated: boolean
  ): any;

  // Rank unique-item swaps from lazily resolved candidate overlays.
  // Candidates parsed/resolved on first use, cached for reuse.
  rank_unique_candidates(
    slot_name: string, candidate_names: string, metric: string
  ): Float64Array;

  // Batch-rank variation overlays (item/mod-swap candidates).
  // Only top_n results cross the boundary, sorted by score descending.
  rank_variations(overlays: any, top_n: number): any;
}
```

### Module-level functions

```typescript
// Full build eval from PoB XML. Runs entirely client-side.
// Data version pinned to 3_28.
function evaluate_build_xml(xml: string): any;

// Construct warm evaluator from PoB XML. No server needed.
function evaluator_from_build_xml(xml: string): WasmEvaluator;

// Whether timeless LUTs are attached.
function has_timeless_luts(): boolean;

// Initialize game data from fetched bundle. Call once per page.
function init_game_data(bundle: any): void;

// Attach timeless-jewel LUTs.
// notable_entries: [[jewelTypeId, Uint8Array], ...]
//   2=LethalPride, 3=BrutalRestraint, 4=MilitantFaith,
//   5=ElegantHubris, 6=HeroicTragedy
// glorious_vanity_parts: Uint8Array[] (5 zlib parts)
function load_timeless_luts(notable_entries: any, glorious_vanity_parts: any): void;

// Batch-rank multiple builds by one metric. Invalid candidates → null.
function rank_build_xmls(xmls: any, metric: string): any;
```

Key detail from JSDoc: `evaluator_from_build_xml` was added so the `/rust` frontend can
"import a build, evaluate edits, preview tree changes, and rank node power **without
starting the Lua engine or contacting an evaluator service**." They are working toward
dropping the Lua dependency for interactive operations.

## Game Data Files (`/secalc-data/game/`)

All 15 files serve HTTP 200. These feed the Rust engine's `init_game_data` call.

| File | Size | Structure |
|------|------|-----------|
| `tree_3_28.json` | 509 KB | `{ classes, nodes, node_count }` |
| `mastery_effects_3_28.json` | (present) | mastery effect mappings |
| `tree_positions_3_28.json` | (present) | node x/y positions |
| `base_items_3_28.json` | 395 KB | 1,045 items: `{ name, type, tags, req, sockets, phys, crit, ... }` |
| `base_items.json` | (present) | spec-level base items |
| `gem_effects_3_28.json` | 2,128 KB | `{ entries }` |
| `uniques_3_28.json` | 933 KB | 1,266 uniques: `{ name, base_type, slot, mod_lines, metadata, ... }` |
| `watchers_eye_mods.json` | (present) | Watcher's Eye mod pool |
| `legion_passives.json` | (present) | legion/timeless passives |
| `mod_pool_items_3_28.json` | 5,136 KB | 11,511 mods: `{ id, type, affix, group, level, statLines, ... }` |
| `mod_pool_jewels_3_28.json` | (present) | jewel mod pool |
| `mod_pool_flasks_3_28.json` | (present) | flask mod pool |
| `gems_active_3_28.json` | 13,356 KB | `{ count, skills }` |
| `gems_support_3_28.json` | 1,249 KB | `{ count, supports }` |
| `game_data.json` | 7,685 KB | `{ bases, flask_mods, gems, item_mods, jewel_mods, tincture_mods, veiled_mods }` |

Note: data version is pinned to **3_28** for the Rust engine, while the Lua engine uses
3_29. This confirms the Rust engine lags one patch behind.

## Timeless Jewel LUTs (`/secalc-data/luts/`)

Pre-computed lookup tables for seed-based timeless jewel resolution.

| File | Size |
|------|------|
| `LethalPride.zip` | 2.16 MB |
| `BrutalRestraint.zip` | 2.02 MB |
| `MilitantFaith.zip` | 0.82 MB |
| `ElegantHubris.zip` | 2.38 MB |
| `HeroicTragedy.zip` | 2.07 MB |
| `GloriousVanity.zip.part0` | 5.00 MB |
| `GloriousVanity.zip.part1` | 5.00 MB |
| `GloriousVanity.zip.part2` | 5.00 MB |
| `GloriousVanity.zip.part3` | 5.00 MB |
| `GloriousVanity.zip.part4` | 1.70 MB |
| **Total** | **~31.1 MB** |

GloriousVanity is split into 5 parts (~22 MB total) for parallel fetching. These are zlib-compressed binary tables loaded via `load_timeless_luts`.

## Key Observations

1. **The Rust engine is substantial** - 8.5 MB of compiled code and 4.3 MB of embedded data.
   This is not a thin wrapper; it contains a full calculation pipeline.

2. **Data pinned to 3_28** - the Rust engine lags one version behind the Lua engine (which
   uses 3_29). This means some new-patch content may only be available via the Lua fallback
   until the Rust data is updated.

3. **Ranking APIs are the differentiator** - `rank_gem_candidates`, `rank_unique_candidates`,
   and `rank_variations` are batch operations that never marshal full `BuildStats` across the
   WASM boundary. Only compact scores cross. This is an optimization the Lua engine cannot match.

4. **WarmState/WarmPayload architecture** - the evaluator can be constructed from either:
   - A server-generated `WarmPayload` JSON (constructor)
   - Directly from PoB XML (`evaluator_from_build_xml`) - newer, no server needed

5. **Plan lanes for gem ranking** - `rank_gem_plan_stats` returns `[hits, reroutes]`,
   suggesting they have a compiled evaluation plan that fast-paths common gem swaps. Falls
   back to exact evaluation on cache miss ("reroute").

6. **31 MB of timeless jewel LUTs** - these are optional, lazy-loaded. Without them, timeless
   jewel builds "diverge from PoB" per the JSDoc.
