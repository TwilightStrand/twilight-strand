# Spec: Timeless Jewel Support

## Goal

Exact timeless jewel calculations matching PoB output, using PoB's binary LUT data for seed-specific results. The five PoE1 timeless jewels (Glorious Vanity, Lethal Pride, Brutal Restraint, Militant Faith, Elegant Hubris) must produce correct stats for any seed. Later phases add tree visualization and seed enumeration for optimization.

## Background

Timeless jewels transform passive tree nodes within their radius. Each jewel has a seed number and a conqueror name. The seed determines which mods are added to or replace small passives and notables. The conqueror determines which keystone replacement is granted. The transformation is fully deterministic per (jewel_type, seed, node_id).

## The five jewel types

| Jewel | Faction | Small passives | Notables | Keystones |
|---|---|---|---|---|
| Glorious Vanity | Vaal | Replaced with Vaal-themed mod (from LUT) | Replaced entirely (from LUT) | Replaced by conqueror keystone (Xibaqua/Zerphi/Ahuana/Doryani) |
| Lethal Pride | Karui | +2 or +4 Str added (attribute node = +2) | 1 addition from LUT (replace or add) | Conqueror keystone (Kaom/Rakiata/Kiloava/Akoya) |
| Brutal Restraint | Maraketh | +2 or +4 Dex added (attribute node = +2) | 1 addition from LUT (replace or add) | Conqueror keystone (Deshret/Balbala/Asenath/Nasima) |
| Militant Faith | Templar | +3 or +2 Devotion (attribute node = replace with devotion node) | 1 addition from LUT (replace or add) | Conqueror keystone (Avarius/Dominus/Maxarius/Venarius) |
| Elegant Hubris | Eternal | Replaced with blank (no stats) | Replaced with single themed mod (from LUT) | Conqueror keystone (Cadiro/Victario/Caspiro/Chitus) |

### How LUT results map to mods

The LUT returns indices into the `LegionPassives.lua` data:
- Values `< timelessJewelAdditions (337)` are **addition** indices: the stat is added on top of existing node stats
- Values `>= 337` are **replacement** indices: `value - 337 + 1` indexes into the `nodes` array, which fully replaces the node
- Glorious Vanity is special: variable-length entries encode a replacement node index plus stat roll values
- For Karui/Maraketh/Templar small passives, no LUT lookup is needed; the logic is hardcoded (attribute check -> +2, else -> +4/+5)
- Elegant Hubris small passives need no LUT; they always become blank

### Stat rolls

Each addition/node in `LegionPassives.lua` has min/max stat values. The LUT encodes the rolled value for each stat. When building stat text, PoB substitutes the `(min-max)` range placeholder with the actual rolled value.

## Data pipeline

```
LegionPassives.lua  --(gen script)-->  timeless-passives.json   (additions[] + nodes[])
NodeIndexMapping.lua --(gen script)--> timeless-node-index.json (nodeId -> binIndex)
*.bin LUT files      --(runtime)-----> loaded by Rust/WASM engine at eval time
```

### gen-timeless-data.mjs

A new generation script (`apps/web/scripts/gen-timeless-data.mjs`) parses the two Lua files and produces:

1. `packages/engine/data/timeless-passives.json`: the additions and nodes arrays with their stat keys, stat descriptions (`sd`), display names (`dn`), stat min/max/fmt, and `sortedStats`. Stripped of visual-only fields (icons, positions, orbit).

2. `packages/engine/data/timeless-node-index.json`: maps node IDs to their index in the binary LUT, plus the `size` and `sizeNotable` counts, and seed min/max per jewel type.

### Binary LUT loading

The `.bin` files (3.4MB - 103MB each) are loaded at runtime. For the WASM engine:
- Non-GV jewels: single flat byte array, indexed as `data[nodeIndex * seedRange + seedOffset]`
- GV: variable-length entries with a sizes header, per-node sub-arrays
- Load on demand (lazy) per jewel type, keep in WASM memory

Total uncompressed LUT sizes:
- BrutalRestraint.bin: 3.4MB
- ElegantHubris.bin: 3.6MB
- LethalPride.bin: 3.6MB
- MilitantFaith.bin: 3.6MB
- GloriousVanity.bin: 52MB

## Radius detection

PoB computes `nodesInRadius` at tree load time using Euclidean distance from socket position:

```
distSquared = (node.x - socket.x)^2 + (node.y - socket.y)^2
if distSquared <= radiusInfo.outerSquared:
    node is in radius
```

Timeless jewels use `radiusIndex = 3` (Large radius, outer = 1800 in 3.16+ trees). Node positions come from the tree JSON (group position + orbit angle * orbit radius).

### Where radius is computed

Two options:
1. **TypeScript side** (preferred for Phase 1): compute `nodesInRadius` per jewel socket in `rust-converter.ts` using the tree node position data already available. Pass only affected nodes to the Rust engine.
2. **Rust side**: embed tree positions in engine data. More self-contained but larger data footprint.

Phase 1 uses option 1. The tree renderer already has node positions; the converter can compute distance and filter.

## Engine integration

### Current state

- `timeless.rs` has hash-based `transform_node_typed()` that picks from hardcoded mod pools. This does NOT match specific seeds.
- `lib.rs` already loops over `input.timeless_jewels`, calls `transform_node_typed()`, parses stat lines via `stat_parser`.
- `rust-converter.ts` already detects timeless jewels from item mods and passes `TimelessJewelInput` with `affected_nodes`.
- `affected_nodes` currently includes ALL allocated nodes (no radius filtering).

### Target state

1. `rust-converter.ts` computes radius-filtered `affected_nodes` per jewel socket (only nodes within 1800 distance of socket position)
2. The Rust engine loads LUT binary data and `timeless-passives.json` at init
3. For each timeless jewel + affected node, the engine:
   - Reads the LUT to get the addition/replacement index and stat rolls
   - Looks up the structured mod data from `timeless-passives.json`
   - Substitutes rolled values into stat descriptions
   - Parses stat descriptions into mods (via stat_parser) and adds to ModDB
   - For keystones: matches conqueror type + id against legion node ids
   - For small passives (non-GV, non-EH): applies the hardcoded attribute logic
4. The existing `stat_parser` path remains; LUT data produces better stat descriptions with exact roll values

### Data flow through evaluate_build

```
TimelessJewelInput {
  jewel_type, seed, conqueror,
  socket_node_id,         // NEW: which socket this jewel is in
  affected_nodes: [{      // now radius-filtered
    node_id, node_type,
    original_name,        // NEW: needed for attribute-node detection
  }]
}
```

## UI requirements (Phase 2+)

### Tree renderer
- Nodes in timeless jewel radius get a visual indicator (border color or glow)
- Affected nodes show their replacement/addition stats on hover
- Radius circle drawn around the jewel socket
- Keystones in radius show their replacement name

### Seed search (Phase 3)
- User selects a jewel socket and jewel type
- Specifies desired stats to maximize (e.g., "maximize +% Fire Damage")
- Engine enumerates seeds, scores each, returns top N
- Runs in a web worker to avoid blocking UI

## Phases

### Phase 1: Calc-only (no UI changes)

LUT-based exact calculations. Timeless jewel mods flow into ModDB and affect all downstream stats (life, ES, DPS, resistances). Radius filtering in TypeScript. Accuracy target: match PoB within existing tolerances.

### Phase 2: Tree visualization

Show affected nodes, replacement stats, radius circles on the passive tree. Hover tooltips show before/after node stats.

### Phase 3: Seed optimizer

Enumerate seeds to find optimal stats for a given build. Parallelized via web workers. Scoring function configurable by user.

## Non-goals

- Heroic Tragedy (PoE2 Kalguur jewel, type 6) and Abyss jewels (types 7-11) are out of scope
- Glorious Vanity deity selection UI in Phase 1 (conqueror comes from item mods)
- Cluster jewel interaction with timeless jewels (cluster nodes are not in the base tree)
- Tattoo interaction (tattoos replace nodes before timeless jewels apply; handled separately)
- Mobile/touch UI for seed search
- Trade integration for finding jewels with specific seeds

## Risks

- **GloriousVanity.bin is 52MB.** Lazy-loading by node helps, but the initial download is large. Consider serving compressed (zip parts exist) and decompressing in a worker.
- **Stat parser gaps.** Some LegionPassives stat descriptions may not parse correctly through `stat_parser`. The gen script should flag any stat lines that fail to parse, and those become blockers.
- **Roll value precision.** Stats with `fmt = "g"` need special handling (per_minute -> /60, permyriad -> /100, _ms -> /1000). The `replaceHelperFunc` in PassiveSpec.lua defines these conversions.
