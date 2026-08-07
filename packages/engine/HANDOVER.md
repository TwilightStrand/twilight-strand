# Rust Engine Handover

## Session summary (2026-08-07)

9 commits. Two major features: Lua WASM driver replacement + Rust conditional modifier system.

## Lua WASM Engine (complete, production-ready)
- Replaced wasmoon (Lua 5.4) with pob-web's C/WASM driver (Lua 5.2)
- Boot: 2.3s. Eval: 4s for endgame builds
- **Matches native LuaJIT headless exactly** (ES 11050, FullDPS 122.5M on CI Occultist)
- 94% of PoB desktop (6% gap is headless vs desktop, shared with native LuaJIT)
- Files: `apps/web/engine/worker.ts`, `bridge.ts`, `scripts/build-worker.mjs`
- Deps: `@zenfs/core@1.11.4`, `@zenfs/archives@1.0.5` (replaces `wasmoon`)
- Assets (gitignored): `public/data/pob/root.zip` (56MB), `public/data/pob/driver/`

## Rust WASM Engine (ModDB complete, stat_parser expanding)

### ModDB system (`src/mod_db.rs`)
- StatId(u16): 109 interned stats, no string hashing
- ModFlags(u32): 26 bitflags matching PoB's hex layout exactly
- KeywordFlags(u32): 24 bitflags with ANY/MATCH_ALL modes
- ModTag: conditions, per-charge multipliers, per-stat scaling, thresholds, limits
- ModDB: arena storage, per-stat index, parent chain, full eval loop
- BuildState: u64 condition bitfield, charges, attributes
- evaluate_build fully migrated to ModDB (old aggregate_mods removed)

### stat_parser coverage
- **Tree nodes: 69.7%** (3785/5428 stats parse)
- **Item mods: ~42%** (431/1044 on CI Occultist build)
- Remaining unparsed: flask mods, charge generation, tinctures, mechanical effects
- Patterns added this session: ES without "maximum", global crit multi, combined dual-res, weapon-specific damage, attack/melee phys damage, DoT multi per element, nearby enemy resistance as pen, max charges, aura effect on self, melee/attack crit chance variants

### Calc pipeline improvements
- ElementalDamage inc/more routes to fire/cold/lightning type mods
- Conversion table populated from ModDB stats (not just BuildInput fields)
- BuildState populated from input flags (charges, dual wield, fortify, etc.)
- Hardcoded ascendancy approximations removed (tree data provides correct bonuses)

### Tests: 356 pass, 0 fail. WASM: 295KB.

## What to do next

### Priority 1: End-to-end Lua vs Rust comparison
The browser test only feeds item mods to Rust. The app's `rust-converter.ts` feeds tree nodes + items + keystones + support gems + uniques + flasks. Run a real build through the full converter pipeline and compare every stat.

Key: `build-store.ts` already has `compareLuaVsRust()` that runs automatically. Load a build in the UI and check console for `[dual-engine]` divergence logs.

### Priority 2: stat_parser remaining gaps
Focus on patterns that affect DPS/defence for the test build:
- Remaining 58% of item mods (mostly flask/unique-specific text that doesn't map to simple stats)
- The v2 parser strips conditions but `rust-converter.ts` calls v1 - switch to v2

### Priority 3: Gem level scaling
All gem data in `gems.rs` is hardcoded at level 20. Needs parameterization by gem level + quality.

### Priority 4: Support gem scaling
`supports.rs` has hardcoded level-20 multipliers. Real values depend on gem level.

## Build commands
```bash
cd packages/engine && cargo test        # 356 tests
cd packages/engine && bash build.sh     # WASM + copy to public/wasm/
cd apps/web && node scripts/build-worker.mjs  # Lua worker
```

## Test build for validation
CI Occultist from pobb.in/MwTyQN55T8tE:
- Desktop PoB: FullDPS 130,203,080 / ES 11,050 / CritMulti 667%
- Lua WASM: FullDPS 122,500,791 / ES 11,050 / CritMulti 657% (94%)
- XML: `/tmp/pob-test-xml.txt`, Code: `/tmp/pob-test-code.txt`
