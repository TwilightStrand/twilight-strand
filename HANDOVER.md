# Session Handover - Twilight Strand Collective Build Planner

**Date:** 2026-08-04
**Repo:** 90+ commits, 130+ features, 112+ tests (32 TS + 80 Rust)
**Status:** Production-ready MVP with Rust WASM engine, auth, and community features

## Architecture

```
apps/web/                    Next.js 15 (App Router, Turbopack, Tailwind 4)
  app/
    layout.tsx, page.tsx, globals.css
    api/
      auth/[...nextauth]/    Auth.js route handler (GitHub + Discord OAuth)
      import/route.ts        Proxy for pobb.in/pastebin URL imports
      character/route.ts     PoE account character API proxy
      trade/route.ts         PoE trade API proxy for price checking
      builds/route.ts        Cloud build save/load (authenticated)
  components/
    shell/         Header, StatsSidebar, TabContent, MobileNav, ImportDialog,
                   KeyboardShortcuts, WelcomeHint, ErrorBoundary, EmptyState,
                   NotesPanel, BuildDiff, BuildCard, Skeleton, AuthButton
    tree/          TreeCanvas, TreeSearch, TreeSpecBar, TreeMinimap, TreeOptimizer,
                   tree-renderer, tree-camera, tree-spatial, tree-data,
                   NodePowerControls, ClusterSearch
    items/         ItemsTab (SocketVisual, flask toggles, weapon swap, influence, price check)
    skills/        SkillsTab (gem links, DPS contribution, main skill indicator)
    calcs/         CalcsTab, CalcSection, CalcRow (with filter highlighting)
    config/        ConfigTab (interactive, presets, bandit/pantheon)
    settings/      SettingsPanel, Changelog, EngineComparison
  engine/
    worker.ts          Web Worker (wasmoon + PoB Lua + LuaJIT compat shims)
    bridge.ts          Main thread <> Worker messaging with progress callbacks
    rust-bridge.ts     Rust WASM engine bridge (evaluate, parse stats)
    pob-codec.ts       Re-exports from @tsc/pob-codec
    pob-xml-parser.ts  Client-side XML parser (Phase 1 instant display)
    cluster-types.ts   Cluster jewel optimizer types
    types.ts           BuildStats, ItemData, SkillGroup, GemData types
    shims/             Node.js shims for esbuild (empty, url, path)
  db/
    schema.ts          Drizzle ORM schema (users, accounts, sessions, builds)
    index.ts           Neon serverless PostgreSQL connection
  lib/
    auth.ts            Auth.js config (GitHub + Discord)
    trade.ts           Trade price check utilities
    stat-explanations.ts  Stat tooltip text
    build-score.ts     Build score/grade calculator
  data/
    cluster-notables.ts  Cluster jewel notable database (18 entries)
  stores/
    build-store.ts     Build state, two-phase eval, saves, compare, history, config
    tree-store.ts      Tree allocation, specs, undo/redo, search, reset
    ui-store.ts        Tab, sidebar, theme, perf mode, number format, pinned stats

packages/
  engine/              Rust WASM calc engine (1,500+ lines, 80 tests)
    src/
      lib.rs           Core stat calculator, WASM entry points
      stat_parser.rs   PoE stat line parser (20+ patterns)
      damage.rs        Damage conversion chain, DoT mechanics
      gems.rs          Skill gem base data (11 gems)
      node_power.rs    Fast node power evaluator (50k evals/sec)
      pathfinder.rs    BFS shortest path, optimal target pathing
    build.sh           wasm-pack build script
    INTEGRATION.md     5-phase Lua replacement plan
  pob-codec/           Publishable npm package (@tsc/pob-codec)
  pob-data/            Data fetching scripts
```

## What Was Built

### Frontend (130+ features)

**Passive Tree (20):** Interactive canvas, allocated nodes, three-tier connections, node search with glow + navigate, tooltips with adjacency, jewel socket diamonds, mastery stars, ascendancy styling, class start glows, hover path highlighting, tree specs, zoom controls, point counter + node type breakdown, minimap, undo/redo, tree reset, node power heatmap, keystones list, tree optimizer, tree efficiency metric.

**Import/Export (12):** PoB code decode/encode, pobb.in/pastebin proxy, PoE account import, XML drag-drop, scoped import, export clipboard, shareable URLs (hash), example builds, Ctrl+I, markdown export, import progress bar, auto-paste.

**Items (14):** Weapon swap (Set I/II), mod colors (crafted/fractured/enchant), flask toggles, socket visuals, item stat badges, copy item text, item search filter, rarity borders, item requirements, influence markers (Shaper/Elder/etc), "Provides" summary, equipment count, loadout bar, price check for uniques.

**Skills (9):** Gem link lines, gem color coding, vaal/awakened indicators, level/quality colors, main skill badge, click-to-set-main, DPS contribution %, socket group tooltip, enable/disable toggle.

**Config/Calcs (9):** Interactive checkboxes, config presets (Mapping/Bossing/Default), bandit/pantheon display, expanded calcs, filter highlighting, copy stats text, JSON export, DoT/recovery sections, cluster jewel search.

**UI/UX (35+):** Ascendancy + build rename, save/export/share/new/recent, local saves, build comparison + diff view, dark/light theme, performance mode, number format (US/EU), settings panel, notes panel, keyboard shortcuts (?), collapsible sidebar, sidebar toggle, compact mode, bar-graph mode, loading skeleton, empty states, error boundaries, tab badges, stat tooltips, DPS composition bar, life/ES pool bar, welcome hint, dynamic title, escape handling, pinnable stats (double-click), sidebar scroll memory, stat change animations, auto-save (30s), build score (S-F grade), build edit history, resistance warnings, chaos res warning, defensive layers summary, active auras list, class color dot, build metadata badges, changelog, config change indicator, print styles, smooth camera transitions, node allocation ripple animation, engine timing display, build summary cards, dynamic meta tags, recent builds dropdown.

**Mobile (3):** Import in bottom nav, touch pinch-zoom, long-press to allocate.

### Rust WASM Engine (1,500+ lines, 80 tests)

- **lib.rs** - Core stat calculator with PoE formulas (life/ES/mana/attributes/res/DPS/EHP), modifier aggregation (flat/increased/more), WASM entry points
- **stat_parser.rs** - Parses 20+ PoE stat text patterns into typed Modifiers (280 lines, 18 tests)
- **damage.rs** - Damage type enum, conversion chain (Phys->Lightning->Cold->Fire->Chaos), hit DPS, Bleed/Poison/Ignite DoT (505 lines, 16 tests)
- **gems.rs** - 11 skill gems with base damage, crit, cast time, effectiveness
- **node_power.rs** - Fast node power evaluator: 50,000 evals/sec, 100 nodes ranked in 6ms
- **pathfinder.rs** - BFS shortest path, optimal path to target notables (7 tests)
- **build.sh** - wasm-pack build pipeline, outputs 140KB WASM binary

### Backend

- **Auth.js** - GitHub + Discord OAuth via NextAuth v5
- **PostgreSQL** - Drizzle ORM schema: users, accounts, sessions, builds tables
- **Builds API** - Save/load builds (authenticated), cloud storage
- **Trade API** - PoE trade API proxy with rate limit handling, price check utilities
- **Import API** - pobb.in/pastebin proxy, PoE account character fetch

### Infrastructure

- Dockerfile (multi-stage) + docker-compose (with PostgreSQL)
- GitHub Actions CI (typecheck + test + build, 3 jobs)
- 112+ tests (32 TypeScript + 80 Rust)
- PWA with offline caching (service worker v2)
- README.md with setup instructions
- .env.example for auth/database config

## LuaJIT Compatibility Shims

| Shim | Issue | Fix |
|------|-------|-----|
| `string.format` | Lua 5.4 rejects `%d` with non-integer floats | Auto-floor numeric args for integer specifiers |
| `string.gsub` | Lua 5.4 rejects `%X` in replacement strings | Sanitize replacement strings, strip invalid `%` escapes |
| `bit` / `bit32` | LuaJIT's bit library vs Lua 5.4 native ops | Shim using `&`, `\|`, `~`, `<<`, `>>` operators |
| `unpack` / `table.unpack` | Moved between Lua versions | Cross-alias both |
| `loadstring` | Renamed to `load` in Lua 5.2+ | Alias `loadstring = load` |
| `jit` | PoB checks `jit.version` | Stub with `{ version = "disabled" }` |
| Timeless Jewel LUT | `assert` crashes when binary data missing | Graceful return of empty table |
| Tree JSON keys | dkjson parses numeric keys as strings | Post-parse `rekey_numeric` converts to integers |

## Performance

| Metric | Value |
|--------|-------|
| Lua engine boot | ~12s (mounting 327 files + dkjson tree parse) |
| Lua build evaluation | ~8s for 295KB XML (WOrb Occultist) |
| Rust single eval | 20us (49,255 evals/sec) |
| Rust rank 100 nodes | 5.95ms |
| Rust stat parsing | 61us for 8 lines |
| WASM binary size | 140KB |
| Worker bundle | 234KB |

## Tested With

- Witch Occultist Lv 97 Winter Orb build (pobb.in/gthdKM9YU2CR): 1.7M DPS, 3289 ES, 116 nodes, full items/skills

## Known Issues

- CalcDefence.lua:2987 format edge case (non-blocking)
- PoE account import lists characters but doesn't convert to PoB XML yet
- Scoped import (tree/items/skills only) is UI-only placeholder
- Config changes don't re-trigger engine evaluation yet
- PoE 2 support is a UI stub only
- `@tsc` npm scope likely claimed; need alternative for publishing
- Rust WASM engine runs alongside Lua but doesn't replace it yet (Phase 2 of integration plan)
- Auth requires PostgreSQL and OAuth credentials to function

## Development Commands

```bash
pnpm install                                   # Install dependencies
pnpm data:fetch                                # Download PoB Lua files + tree data
pnpm dev                                       # Start dev server (port 3003)
node apps/web/scripts/build-worker.mjs         # Rebuild Lua engine worker
node apps/web/scripts/convert-tree-lua.mjs     # Convert tree data to JSON
pnpm test                                      # Run TypeScript tests (32)
pnpm typecheck                                 # Type check
cd packages/engine && cargo test               # Run Rust tests (80)
cd packages/engine && bash build.sh            # Build Rust WASM (requires wasm-pack)
docker compose up --build                      # Full deployment with PostgreSQL
```

## Auth Setup

1. Create GitHub OAuth app and Discord OAuth app
2. Copy `apps/web/.env.example` to `apps/web/.env.local`
3. Fill in `DATABASE_URL`, `GITHUB_CLIENT_ID/SECRET`, `DISCORD_CLIENT_ID/SECRET`, `AUTH_SECRET`
4. Run `pnpm drizzle-kit push` to create database tables

## Future Roadmap

1. **Rust engine Phase 2:** Wire WASM evaluate into the hot path, run both engines, compare
2. **Rust engine Phase 3:** Parse tree/item modifiers in Rust, drop Lua dependency
3. **Cluster jewel optimizer:** Enumerate notable combinations, rank by DPS gain / price
4. **Community builds:** Shared build database with search and filtering
5. **Build guides:** Step-by-step leveling guides with gear progression
6. **PoE 2 support:** Full PoE 2 tree and skill system

## Research Reference

All SolvedExile reverse-engineering is in `docs/research/`:
- `solvedexile-architecture.md` - Stack, tabs, UI, design tokens
- `engine-architecture.md` - Dual engine internals, Rust WASM API
- `build-eval-flow.md` - Full paste-to-render pipeline
- `tree-renderer.md` - Canvas 2D renderer, spatial grid, camera
- `pob-code-format.md` - Base64+zlib codec, input classification
- `feature-gap-analysis.md` - SE features comparison
- `data-sources.md` - Tree JSON, sprites, external APIs
