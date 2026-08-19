# Plan: Timeless Jewels Phase 1 (Calc-Only)

Reference: `SPEC-timeless-jewels.md`

## Task 1: Gen script for LegionPassives data

Write `apps/web/scripts/gen-timeless-data.mjs` that parses:
- `Data/TimelessJewelData/LegionPassives.lua` -> `packages/engine/data/timeless-passives.json`
- `Data/TimelessJewelData/NodeIndexMapping.lua` -> `packages/engine/data/timeless-node-index.json`

The passives JSON contains `{ additions: [...], nodes: [...] }` where each entry has `id`, `dn`, `sd[]`, `sortedStats[]`, `stats{}` (with min/max/fmt per stat key). Strip visual-only fields.

The node-index JSON contains `{ nodeIdToIndex: {nodeId: {index, size}}, size, sizeNotable }`.

**Acceptance criteria:**
- [ ] Script runs with `node apps/web/scripts/gen-timeless-data.mjs`
- [ ] Output matches LegionPassives.lua entry count: 337 additions, 110+ nodes
- [ ] Every `sd` stat line from the Lua file round-trips through the JSON
- [ ] NodeIndexMapping produces 1937 entries (matching `size` in Lua)

## Task 2: Radius-filtered affected_nodes in rust-converter.ts

Add node position data to the tree node interface and compute which allocated nodes fall within Large radius (1800 units, squared = 3240000) of each jewel socket.

Changes to `rust-converter.ts`:
- Accept tree node positions (x, y from the tree JSON)
- For each timeless jewel, find its socket's position from `JewelSocketEntry.nodeId`
- Filter `affected_nodes` to only those within radius
- Add `original_name` field to `TimelessAffectedNode` for attribute-node detection

Changes to `pob-xml-parser.ts` / tree data:
- Ensure node position data (x, y) is available in the `TreeNode` interface

**Acceptance criteria:**
- [ ] Only nodes within 1800 distance of socket are in `affected_nodes`
- [ ] Non-allocated nodes are excluded
- [ ] Ascendancy, mastery, and socket nodes are excluded
- [ ] Test with a known build: node count per socket matches PoB's `nodesInRadius[3]` count

## Task 3: Load LUT binary data in Rust engine

Add LUT loading to the Rust engine:
- Load `timeless-passives.json` at compile time (`include_str!`) or at init
- Accept binary LUT data as a `&[u8]` parameter (passed from JS side)
- Implement `read_lut(seed, node_id, jewel_type)` matching PoB's `DataLegionLookUpTableHelper.lua`
- For non-GV jewels: `data[nodeIndex * seedRange + seedOffset]`
- For GV: variable-length entries with sizes header, per-node arrays (defer full GV support if needed)

New file: `packages/engine/src/timeless_lut.rs`

**Acceptance criteria:**
- [ ] `read_lut` for Lethal Pride / Brutal Restraint / Militant Faith / Elegant Hubris returns the same index as PoB for 5 known (seed, nodeId) pairs per jewel type
- [ ] Handles out-of-range seeds gracefully (return empty)
- [ ] Elegant Hubris seed division by 20 matches PoB
- [ ] Unit tests verify LUT index lookups against PoB reference values

## Task 4: LUT-based transform replacing hash-based transform

Rewrite the timeless jewel processing in `lib.rs` to use LUT data instead of the hash-based `transform_node_typed()`:

For notables:
- Read LUT -> get index list
- If index >= 337: replacement node from `timeless-passives.json` nodes array
- If index < 337: addition from additions array, stat text appended
- Substitute rolled values into stat descriptions using min/max/fmt

For small passives (non-GV):
- Karui: +2 Str if attribute node, else +4 Str
- Maraketh: +2 Dex if attribute node, else +4 Dex
- Templar: replace attribute nodes with devotion node, else +5 Devotion
- Eternal: replace with blank (no mods)

For GV small passives:
- Read LUT -> get replacement node index and roll value
- Look up node in nodes array, substitute roll

For keystones:
- Match `{conqueror_type}_keystone_{conqueror_id}` against legion nodes
- Replace with matched keystone node's stats

**Acceptance criteria:**
- [ ] Lethal Pride seed 15000, socket near Iron Reflexes: stats match PoB within tolerance
- [ ] Elegant Hubris seed 27800: all notables get exactly 1 replacement mod, smalls are blank
- [ ] Militant Faith: Devotion accumulation from small passives is correct
- [ ] Keystone replacements produce correct stat lines for all 20 conqueror keystones
- [ ] Falls back to hash-based transform when LUT data is not available

## Task 5: Wire LUT binary data from JS to WASM

Serve `.bin` files from the web app and pass them to the WASM engine:
- Fetch `.bin` files lazily (only when a timeless jewel of that type is detected)
- Pass binary data to `evaluate_build` or a separate init function
- Handle the GV file size (52MB) by loading compressed zip parts and decompressing in JS

Changes:
- `apps/web/engine/rust-bridge.ts`: add function to load/cache LUT data
- `apps/web/stores/build-store.ts`: trigger LUT loading when timeless jewels detected
- WASM API: accept `&[u8]` for LUT data per jewel type

**Acceptance criteria:**
- [ ] LUT files load on demand (not at page load)
- [ ] Non-GV files load in < 500ms on a typical connection
- [ ] Engine produces correct results after LUT is loaded
- [ ] Graceful fallback (hash-based) if LUT fails to load

## Task 6: Attribute-node detection

PoB checks if a small passive is an attribute node (Str/Dex/Int) to determine the smaller bonus (+2 instead of +4). This requires knowing the original node name.

- Pass `original_name` from tree data through `TimelessAffectedNode`
- In Rust, check if name matches "Strength", "Dexterity", or "Intelligence"
- Apply the correct bonus amount

**Acceptance criteria:**
- [ ] Attribute nodes near a Lethal Pride socket get +2 Str (not +4)
- [ ] Non-attribute small passives get +4 Str
- [ ] Tattooed nodes are treated as attribute nodes (match PoB behavior)

## Task 7: End-to-end accuracy test

Create test builds with known timeless jewels and verify full calc output:
- Import a PoB build with Lethal Pride and compare life/strength
- Import a PoB build with Elegant Hubris and compare ES/DPS
- Import a PoB build with Militant Faith (Dominus) and compare Inner Conviction effect
- Import a PoB build with Brutal Restraint and compare dexterity/evasion

**Acceptance criteria:**
- [ ] Life within 2% of PoB for builds with Lethal Pride
- [ ] DPS within 5% of PoB for builds with Elegant Hubris
- [ ] Resistances exact match for builds with Militant Faith
- [ ] At least 4 test builds with timeless jewels pass accuracy targets

## Dependency order

```
Task 1 (gen script)
  -> Task 3 (LUT loading, needs JSON data)
    -> Task 4 (LUT-based transform, needs LUT reader)

Task 2 (radius filtering, independent of engine work)

Task 5 (JS->WASM wiring, needs Task 3 API)

Task 6 (attribute detection, needs Task 2 for original_name)

Task 7 (end-to-end, needs all above)
```

Tasks 1 and 2 can run in parallel. Task 3 depends on 1. Tasks 4 and 5 depend on 3. Task 6 depends on 2. Task 7 is the final integration test.
