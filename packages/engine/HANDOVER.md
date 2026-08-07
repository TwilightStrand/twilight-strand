# Rust Engine Handover

## What was built this session

### Lua WASM Engine (complete, working)
- Replaced wasmoon (Lua 5.4) with pob-web's C/WASM driver (Lua 5.2)
- Engine boots in 2.3s, evaluates endgame builds in 4s
- Matches native LuaJIT headless output exactly (ES 11050, FullDPS 122.5M on CI Occultist)
- Files: `apps/web/engine/worker.ts`, `apps/web/engine/bridge.ts`, `apps/web/scripts/build-worker.mjs`
- Dependencies: `@zenfs/core@1.11.4`, `@zenfs/archives@1.0.5` (replaces `wasmoon`)
- Static assets (gitignored, built on deploy): `public/data/pob/root.zip` (56MB with timeless jewel data), `public/data/pob/driver/` (driver.mjs, driver.wasm, lua-utf8.wasm)

### Rust Engine ModDB (Phase 1-3 complete, Phase 4 in progress)

#### ModDB system (`src/mod_db.rs`, 1090 lines)
- `StatId(u16)`: 101 interned stat names, no string hashing
- `ModFlags(u32)`: 26 bitflags matching PoB's exact hex layout
- `KeywordFlags(u32)`: 24 bitflags with ANY/MATCH_ALL modes
- `ModTag`: conditions (DualWielding, OnFullLife, etc.), per-charge multipliers, per-stat scaling, limits
- `ModDB`: arena storage, per-stat index, parent chain, full eval loop
- `BuildState`: u64 condition bitfield, charges, attributes

#### evaluate_build uses ModDB
- All stat lookups go through `db.calc()`, `db.sum_base()`, `db.sum_inc()`, `db.product_more()`
- Old `aggregate_mods` + `HashMap<String, (f64,f64,f64)>` removed
- BuildState populated from input flags (charges, dual wield, full life, etc.)
- Hardcoded ascendancy approximations removed (tree data provides correct bonuses)
- ElementalDamage inc/more properly routes to fire/cold/lightning type mods
- Conversion table populated from both BuildInput fields and ModDB stats

#### stat_parser expansion
- `parse_stat_line_v2()` with flag/condition detection
- 39% parse rate on real item mods (was 34%)
- Bulk pattern expansion in progress (agent running)
- `strip_condition_suffix()` strips "while dual wielding" etc. before base parsing

#### Tests: 355 pass, 0 fail

## What needs to happen next

### Priority 1: stat_parser coverage (currently 39%, target 80%+)
The biggest bottleneck. 640 out of 1041 item mods from the CI Occultist build don't parse. Common missing patterns:
- Conversion: "X% of Physical Damage converted to Fire Damage"
- Added damage with context: "Adds X to Y Cold Damage to Spells"
- Leech: "X% of Damage Leeched as Life"
- DoT multiplier: "+X% to Damage over Time Multiplier"
- Penetration: "Damage Penetrates X% Fire Resistance"
- Gain-as-extra: "Gain X% of Physical Damage as Extra Cold Damage"
- Nearby enemies: "Nearby Enemies have -X% to Cold Resistance"

### Priority 2: Browser comparison test
The browser test currently only feeds item mods to the Rust engine (no tree nodes, no keystones). The proper comparison should use `rust-converter.ts` which includes tree node stats, keystones, support gems, equipped uniques, and flask mods. When stat_parser coverage improves, rerun via the app's built-in dual-engine comparison (build-store.ts already runs `compareLuaVsRust`).

### Priority 3: Gem data
All gem damage/crit/speed values are hardcoded at level 20. Needs gem level scaling. The `gems.rs` module has ~30 gems with static data. PoB has thousands of gem definitions loaded from data files.

### Priority 4: Support gem mechanics
`supports.rs` has hardcoded level-20 values for ~30 support gems. The real values should come from the build's gem data (level, quality affect the multipliers).

## Build commands
```bash
# Rust engine
cd packages/engine
cargo test                    # Run all 355 tests
bash build.sh                 # Build WASM + copy to apps/web/public/wasm/

# Lua WASM worker
cd apps/web
node scripts/build-worker.mjs # Build engine-worker.js
pnpm dev                      # Start dev server

# PoB data (must be built separately)
# root.zip at apps/web/public/data/pob/root.zip (gitignored)
# Driver at apps/web/public/data/pob/driver/ (gitignored)
# Both copied from vendor/pob-web/packages/driver/dist/release/
```

## Key files
| File | Purpose |
|------|---------|
| `packages/engine/src/mod_db.rs` | ModDB, StatId, ModFlags, KeywordFlags, BuildState |
| `packages/engine/src/lib.rs` | evaluate_build (main calc pipeline) |
| `packages/engine/src/stat_parser.rs` | Parse PoE stat text to Modifier/Mod |
| `packages/engine/src/keystones.rs` | Keystone effects |
| `packages/engine/src/damage.rs` | Damage conversion pipeline |
| `packages/engine/src/gems.rs` | Gem base damage data |
| `apps/web/engine/worker.ts` | Lua WASM worker (pob-web driver) |
| `apps/web/engine/rust-converter.ts` | Lua output -> Rust input converter |
| `apps/web/engine/rust-bridge.ts` | Rust WASM bridge |

## Test build for validation
CI Occultist from pobb.in/MwTyQN55T8tE:
- Desktop PoB: FullDPS 130,203,080 / ES 11,050 / CritMulti 667%
- Lua WASM: FullDPS 122,500,791 / ES 11,050 / CritMulti 657% (94% of desktop)
- Rust engine: not yet comparable (needs tree nodes + better stat_parser coverage)
- Build XML saved at `/tmp/pob-test-xml.txt`
- Build code at `/tmp/pob-test-code.txt`
