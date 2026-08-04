# Architecture

## Monorepo Structure

```
apps/web/                 Next.js 15 web application
  app/                    Pages + API routes
  components/             React UI (tree, items, skills, shell)
  stores/                 Zustand state (build, tree, UI)
  engine/                 Lua/Rust engine bridges + worker
  data/                   Generated game data (DO NOT EDIT)
  scripts/                Build + data generation scripts
  db/                     Database schema (Drizzle)
  lib/                    Shared utilities

packages/engine/          Rust WASM calculation engine
  src/lib.rs              Core stat calculator
  src/stat_parser.rs      Parse "10% increased Life" -> Modifier
  src/damage.rs           Damage types + conversion + DoT
  src/gems.rs             Skill gem base data
  src/supports.rs         Support gem multipliers (25 gems)
  src/keystones.rs        Keystone mechanics (15 keystones)
  src/ascendancy.rs       Class + ascendancy bonuses (18 ascendancies)
  src/weapons.rs          Weapon base DPS calculator (12 bases)
  src/flasks.rs           Flask effects + charges
  src/uniques.rs          Unique item special effects (30+)
  src/minions.rs          Minion DPS calculator (9 types)
  src/triggers.rs         CoC/CWDT/Spellslinger mechanics
  src/watchers_eye.rs     Watcher's Eye mod database (30 mods)
  src/node_power.rs       Node ranking for tree optimization
  src/pathfinder.rs       BFS path cost calculator

packages/pob-codec/       Base64+zlib PoB code encode/decode
packages/pob-data/        Data fetching scripts
```

## Data Pipeline

Source of truth: PoB's Lua data files (from GGG game data)

```
pnpm data:fetch           Download PoB Lua files + tree data
pnpm data:gen             Generate TypeScript from Lua sources
  -> cluster-data.generated.ts   (53 bases, 300 notables)
  -> gem-data.generated.ts       (821 gems, 1160 skills)
  -> unique-data.generated.ts    (1202 unique items)
  -> tree.json                   (passive tree nodes)
```

Re-run after `data:fetch` to update for new leagues.

## Dual Engine Architecture

1. **Lua engine** (wasmoon) - runs actual PoB code for accuracy
   - Boots in ~15s (cached to ~10s with IndexedDB)
   - Evaluates full builds with all edge cases
   - Source of truth for calc output

2. **Rust engine** (wasm-bindgen) - fast path for optimization
   - 50k evals/sec, <1ms per build
   - Powers: node power heatmap, power report, cluster optimizer
   - Phase: mirroring Lua output, eventual full replacement

## Key Design Decisions

- **Game data is generated, never hand-coded** - prevents inaccurate stats
- **Two-phase import** - instant XML parse for display, background engine eval for real calcs
- **Auth is optional** - app works fully without DATABASE_URL
- **Mobile-first sidebar** - collapsible on desktop, bottom sheet on mobile
- **Cluster optimizer** - full stack (Large + 2 Mediums), DPS per point ranking
- **Guides are test fixtures** - verify engine output, not a content product
