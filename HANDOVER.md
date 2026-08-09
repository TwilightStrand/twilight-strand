# Session Handover - Twilight Strand Collective Build Planner

**Date:** 2026-08-09
**Repo:** 180+ commits
**Status:** Lua engine removed. Rust-only with 1094 auto-generated gems. Accuracy tuning in progress.

## Quick Stats

| Metric | Count |
|--------|-------|
| React components | 51 |
| Rust engine | 20 modules, 19.4K+ lines |
| Rust tests | 572 |
| TS tests | 211 |
| Active gems (data-driven) | 793 |
| Support gems (data-driven) | 301 |
| Keystones (Rust) | 40 |
| API routes | 9 |

## What Changed This Session (22 commits)

### Lua Engine Removed, Rust-Only

The Lua WASM engine (wasmoon, 44MB boot, 4-6s eval) has been removed. The Rust WASM engine is now the sole calculation path (~1ms eval). Key changes:

- `apps/web/stores/build-store.ts`: removed `evaluateWithLua()`, `reconfigureLua()`, `runDivergenceCheck()`. Rust eval is the only path.
- `apps/web/engine/bridge.ts` and `worker.ts`: dead files (still exist, not deleted yet)
- `apps/web/engine/rust-converter.ts`: removed `compareLuaVsRust`, `EngineDivergence`
- CI updated: removed Lua worker build step, `next build` -> `pnpm build` (TanStack Start)

### Gem Data Pipeline

`apps/web/scripts/gen-gem-level-data.mjs` auto-discovers all gems from PoB's Lua data files (previously 17 hardcoded gems). Outputs `packages/engine/data/gems.json` (4.2MB compact) with 793 active + 301 support gems, including per-level damage, crit, effectiveness, and support modifier mappings.

### Rust Engine Changes

- `gems.rs`: fully data-driven from JSON. No more `GemMeta` hardcoded table.
- `supports.rs`: data-driven from JSON with `statMap` -> `Modifier` mapping. Hardcoded fallback for unmapped supports.
- `lib.rs`: Int ES bonus corrected to `floor(Int/10)` per PoB source. DoT/hit DPS separated. `base_multiplier` wired for attack gems. `full_dps` and max res caps added to CalcOutput.

### XML Parser Fixes

- `pob-xml-parser.ts`: active item/skill/config set filtering (was processing ALL sets, inflating stats 3-7x). Tree nodes read from `Spec nodes="..."` attribute (was URL-only, missing most builds). Charge counts extracted from `PlayerStat` XML elements. PoB internal item format parsing with `{tag}` prefix stripping and `Implicits: N` boundary.

### Converter Fixes

- Charges wired from config (power/frenzy/endurance with counts from PlayerStat)
- Boss type and enemy resistances from config
- Local defence mod filter prevents double-counting with `gear_es`/`gear_armour`/`gear_evasion`
- All CalcOutput fields mapped through to BuildStats

### Infrastructure

- Pre-push git hook: typecheck + web tests + Rust tests
- Zero TypeScript errors (3 pre-existing fixed)
- `cargo test` works with `--lib` flag (cdylib crate type issue)

## Accuracy State (CI Winter Orb Occultist, pobb.in/MwTyQN55T8tE)

**PoB reference:** 130M DPS, 11,050 ES, 93.5% crit, 10.16/s speed, 667% crit multi

| Stat | Rust | PoB | Ratio | Root cause |
|------|------|-----|-------|------------|
| DPS | 10.1M | 130M | 7.8% | Active set 6 references item IDs not in XML |
| ES | 4,135 | 11,050 | 37% | Same; items from phantom set slots missing |
| Crit | 86.1% | 93.5% | 92% | Close |
| Crit Multi | 278% | 667% | 42% | Missing gear crit multi (wrong set's items) |
| Speed | 4.85/s | 10.16/s | 48% | Missing frenzy speed from wrong support set |
| Resistances | 76/50/53/75 | 80/75/80/-35 | Partial | Some items missing |
| Block | 35% | - | Present | |
| Life | 1 | 1 | Exact | CI keystone |

**Important context:** This specific build has 7 item/skill sets. Active set 6 references item IDs (35, 37, 47, 68, 72, 76, 79) that have no corresponding `<Item>` elements in the XML. These are "phantom" items managed by PoB's internal clipboard. Simpler single-set builds should match much better.

## Known Issues / Next Steps

1. **Phantom item IDs in active sets**: some pobb.in builds reference item IDs that don't exist as `<Item>` elements. Fall back to a different set or skip gracefully.
2. **ES local-vs-global %**: `gear_es` is the computed item ES (local mods baked in). Global `% increased ES` applied on top double-scales. PoB uses additive local+global. Fix: reverse-engineer raw base ES from computed value and local mods (attempted, range notation parsing needs work).
3. **Dead Lua files**: `engine/bridge.ts`, `engine/worker.ts` still exist. `EngineRequest`/`EngineResponse` types still in `types.ts`. Safe to delete.
4. **`build-worker.mjs`**: still referenced in web app's `dev`/`build` scripts (removed in current code). The `public/engine-worker.js` output is dead.
5. **Channelling DPS formula**: Winter Orb stages set to 1 as workaround. Proper fix: stages affect hit rate (20% per stage after first) per PoB source (CalcOffence.lua).
6. **Test with simpler builds**: the multi-set CI Occultist is the hardest case. Test RF Jugg, Cyclone Slayer, etc. from pobb.in for accuracy on single-set builds.

## Dev Commands

```bash
pnpm dev                                    # Dev server (Vite, port 5173)
pnpm test                                   # All tests (211 web + codec)
cd packages/engine && cargo test --lib      # Rust tests (572)
cd packages/engine && bash build.sh         # WASM build (4.6MB)
node apps/web/scripts/gen-gem-level-data.mjs # Regenerate gem data from PoB
cd apps/web && npx tsc --noEmit             # TypeScript check (0 errors)
```

## Key Files

- `apps/web/engine/pob-xml-parser.ts` - XML parser with active set filtering, tree node extraction
- `apps/web/engine/rust-converter.ts` - XML stats to RustBuildInput, local defence filter, charge wiring
- `apps/web/engine/rust-bridge.ts` - WASM bridge, RustBuildInput/RustCalcOutput types
- `apps/web/stores/build-store.ts` - Rust-only eval orchestration
- `apps/web/scripts/gen-gem-level-data.mjs` - Auto-generates 1094 gems from PoB Lua data
- `packages/engine/src/lib.rs` - evaluate_build pipeline (attributes, pools, defences, DPS, ailments)
- `packages/engine/src/gems.rs` - Data-driven gem lookup from JSON
- `packages/engine/src/supports.rs` - Data-driven support gem modifiers
- `packages/engine/src/stat_parser.rs` - 7K+ line table-driven PoE stat text parser
- `packages/engine/data/gems.json` - 4.2MB generated gem data (1094 gems)

## PoB Source Code Reference

Read during this session for accuracy fixes:

- `apps/web/public/data/pob/Classes/Item.lua:2297-2359` - Item-level defence calc (local mods + quality)
- `apps/web/public/data/pob/Modules/CalcDefence.lua:827-1064` - Global ES from gear + mods
- `apps/web/public/data/pob/Modules/CalcPerform.lua:518` - `floor(Int/10)` as ES INC
- `apps/web/public/data/pob/Modules/CalcOffence.lua:2403-2419` - hitTimeOverride for channelling
- `apps/web/public/data/pob/Data/Skills/act_int.lua:20963-21062` - Winter Orb stage mechanics
