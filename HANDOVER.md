# Session Handover - Twilight Strand Collective Build Planner

**Date:** 2026-08-05
**Repo:** 151 commits
**Status:** Production-ready MVP with Rust-first dual engine, binary codec, universal import/export, k3s deploy ready

## Quick Stats

| Metric | Count |
|--------|-------|
| Commits | 151+ |
| React components | 48 |
| Rust engine modules | 18 (7,501+ lines) |
| Rust tests | 292 |
| TS tests | 114 (+ 14 codec tests) |
| API routes | 9 |
| Generated game data | 53 cluster bases, 300 notables, 1,160 gems, 1,202 uniques, 3,397 tree nodes, 576 config options |
| Unique items (Rust) | 95+ |
| Support gems (Rust) | 50+ |
| Keystones (Rust) | 40 |
| Type errors | 0 |

## Architecture

### Dual Engine (Rust-first)

Three-phase eval pipeline:
1. Client-side XML parse for instant display
2. Rust WASM eval for accurate stats (sub-ms)
3. Lua eval in background for ground-truth validation

After Lua finishes, `runDivergenceCheck` compares stat-by-stat. Tree node clicks use Rust only for real-time recalc.

| Engine | Speed | Purpose |
|--------|-------|---------|
| Lua (wasmoon) | ~15s boot, ~8s eval | Full PoB accuracy, validation |
| Rust (WASM) | 50k evals/sec | Heatmap, optimizer, power report, node toggle |

### Rust Engine Coverage

| Category | Count | Details |
|----------|-------|---------|
| Unique items | 59 | Custom effect logic per item |
| Support gems | 28 | Level-20 more/increased modifiers |
| Keystones | 26 | CI, EO, RT, Acrobatics, etc. |
| Ascendancy classes | 19 | 7 classes, ~2-3 ascendancies each |
| Stat parser patterns | ~50 | Mod description line parsing |
| Watcher's Eye mods | 28 | 10 auras covered |
| Damage pipeline | Full | 5-type conversion chain, ailment DoT (bleed/poison/ignite), hit chance, impale |
| Snapshot builds | 5 | Cyclone Slayer, RF Jugg, CI Vortex Occ, LA Deadeye, Poison BV Assassin |
| Archetype benchmarks | 7 | + Champion Impale, Fire Elementalist |

### Import/Export

**Import:** TSC codes (`tsc1_`), PoB codes, raw XML, pastebin URLs, pobb.in URLs, GGG character profiles, poe.ninja build URLs.
**Export:** TSC binary, PoB code, raw XML, JSON, pastebin upload.

### Build Codec (`@tsc/build-codec`)

Binary format: `tsc1_` prefix + deflate + base64url. 2-3x smaller than XML, lossless roundtrip. Varint integers, length-prefixed strings, bitmask flags. Schema-versioned, forward compatible. 14 tests.

### Config Tab

68 options across 9 categories (General, Charges, Combat, Buffs, Enemy, Flasks, Skill Options, Defences, Map Mods, Minions). Presets for Mapping/Bossing/Uber Boss. Map presets. Custom modifier text input. Filter/search.

### EngineComparison

Live Lua vs Rust stat table. Per-stat values with %diff. Color-coded: green (<=1%), amber (1-5%), red (>5%).

## Data Pipeline

All game data auto-generated from PoB Lua source files.

```bash
pnpm data:fetch    # Download PoB files from GitHub
pnpm data:gen      # Generate TypeScript from Lua sources
```

Generated files: `cluster-data.generated.ts`, `gem-data.generated.ts`, `unique-data.generated.ts`.

## Deploy

**GH Actions** builds Docker image, pushes to GHCR on every push to main.

**k3s manifests** in `deploy/k3s/`:
```bash
kubectl apply -f namespace.yml
kubectl apply -f secrets.yml     # from secrets.yml.example
kubectl apply -f postgres.yml    # optional, for auth
kubectl apply -f app.yml         # 2 replicas + ingress + TLS
```

Works without Postgres (localStorage saves, auth returns 503 gracefully).

## Dev Commands

```bash
pnpm dev              # Dev server (port 3003)
pnpm test             # TS tests
pnpm engine:test      # Rust tests (292)
pnpm test:all         # All tests
pnpm typecheck        # TypeScript check
pnpm data:gen         # Regenerate game data
pnpm worker:build     # Rebuild Lua worker
```

## Known Issues

1. Turbopack caches stale modules sometimes; delete `.next/cache`
2. Auth needs server restart after first dep install
3. Rust engine covers 59/500+ uniques, 28 support gems, 26 keystones
4. Cluster optimizer prices are estimates unless "Check $" is clicked
5. Item/skill editor changes don't auto-recalculate (need re-import)

## What's Next (v0.2.0 Roadmap)

### P0 - Competitive parity
- [ ] Full config option coverage (match PoB Desktop)
- [ ] Jewel effect simulation (regular + cluster)
- [ ] Watcher's Eye mod support (28 mods in Rust, needs UI wiring)
- [ ] Expand Rust engine: more uniques (59/500+), supports (28/?), keystones (26/?)
- [ ] Full Rust engine parity with Lua (mirror phase)

### P1 - Differentiators
- [ ] Smart tree pathing (auto-route optimizer)
- [ ] Marginal value analysis (stat sensitivity per node)
- [ ] Meta statistics from poe.ninja data
- [ ] Timeless jewel seed search
- [ ] Cluster jewel optimizer with real trade prices (partially built)
- [ ] Build diff between tree versions (patch comparison)

### P2 - Polish
- [ ] Crafting bench simulation
- [ ] Unique ranking per slot
- [ ] Leveling guide for more builds
- [ ] i18n (Chinese, Korean, Russian)
- [ ] More themes
- [ ] Community guide authoring

## Key Files

- `apps/web/stores/build-store.ts` - Three-phase eval pipeline, config overrides
- `apps/web/engine/worker.ts` - Lua engine (wasmoon + PoB boot)
- `apps/web/engine/bridge.ts` - Main thread <-> Worker messaging
- `apps/web/engine/rust-bridge.ts` - Rust WASM bridge
- `apps/web/engine/rust-converter.ts` - Converts parsed builds to Rust input
- `apps/web/engine/import-export.ts` - Universal import/export
- `packages/engine/src/lib.rs` - Rust stat calculator (1,535 lines)
- `packages/engine/src/stat_parser.rs` - Mod line parser (1,082 lines)
- `packages/engine/src/damage.rs` - 5-type conversion chain + ailments
- `packages/build-codec/src/codec.ts` - Binary build format
- `apps/web/data/*.generated.ts` - Auto-generated game data
- `apps/web/components/settings/EngineComparison.tsx` - Dual engine divergence viewer
