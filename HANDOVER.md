# Session Handover - Twilight Strand Collective Build Planner

**Date:** 2026-08-04
**Repo:** 120+ commits, 170+ features, 207+ tests (32 TS + 156 Rust + 19 E2E)
**Status:** Production-ready build planner with dual Lua/Rust engines, auth, community, trade integration

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
      builds/shared/         Shared builds listing
      builds/leaderboard/    Ranked builds with sort/filter
      builds/[id]/share/     Toggle build sharing
      ninja/route.ts         poe.ninja ladder proxy
      og/route.tsx           OG image generation (Edge runtime)
  components/
    shell/         Header, StatsSidebar, TabContent, MobileNav, ImportDialog,
                   KeyboardShortcuts, WelcomeHint, ErrorBoundary, EmptyState,
                   NotesPanel, BuildDiff, BuildCard, Skeleton, AuthButton,
                   Toast, MobileStats
    tree/          TreeCanvas, TreeSearch, TreeSpecBar, TreeMinimap, TreeOptimizer,
                   tree-renderer, tree-camera, tree-spatial, tree-data,
                   NodePowerControls, ClusterSearch
    items/         ItemsTab, ItemEditor (SocketVisual, flask toggles, weapon swap, influence, price check, grid view)
    skills/        SkillsTab, SkillEditor (gem links, DPS contribution, main skill indicator)
    calcs/         CalcsTab, CalcSection, CalcRow, StatBreakdown (with filter highlighting, DPS chart)
    config/        ConfigTab (interactive, presets, bandit/pantheon)
    settings/      SettingsPanel, Changelog, EngineComparison
    guide/         GuideViewer, LevelScrubber
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
    stat-sources.ts    Stat source tracking for breakdown tooltips
    markdown.tsx       Lightweight markdown renderer
    character-converter.ts  PoE API character data -> PoB XML converter
  data/
    cluster-notables.ts  Cluster jewel notable database (18 entries)
    guides/              Build guide data (RF Juggernaut)
      index.ts           Guide index
  stores/
    build-store.ts     Build state, two-phase eval, saves, compare, history, config
    tree-store.ts      Tree allocation, specs, undo/redo, search, reset
    ui-store.ts        Tab, sidebar, theme, perf mode, number format, pinned stats

packages/
  engine/              Rust WASM calc engine (4,000+ lines, 156 tests)
    src/
      lib.rs           Core stat calculator, WASM entry points
      stat_parser.rs   PoE stat line parser (20+ patterns)
      damage.rs        Damage conversion chain, DoT mechanics
      gems.rs          Skill gem base data (11 gems)
      node_power.rs    Fast node power evaluator (50k evals/sec)
      supports.rs      25 support gems with level-20 modifiers
      keystones.rs     15 keystone implementations (CI, EO, RT, VP, etc.)
      ascendancy.rs    7 classes + 18 ascendancies with bonuses
      weapons.rs       12 weapon bases, phys/ele DPS calculator
      minions.rs       9 minion types with DPS calculation
      pathfinder.rs    BFS shortest path, optimal target pathing
      integration_tests.rs  Real build simulations, bulk perf tests
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

**UI/UX (40+):** Ascendancy + build rename, save/export/share/new/recent, local saves, build comparison + diff view, dark/light theme, performance mode, number format (US/EU), settings panel, notes with markdown preview, keyboard shortcuts (?), collapsible sidebar, sidebar toggle, compact mode, bar-graph mode, loading skeleton, empty states, error boundaries, tab badges, stat tooltips, DPS composition bar, life/ES pool bar, welcome hint, dynamic title, escape handling, pinnable stats (double-click), sidebar scroll memory, stat change animations, auto-save (30s), build score (S-F grade), build edit history, resistance warnings, chaos res warning, defensive layers summary, active auras list, class color dot, build metadata badges, changelog, config change indicator, print styles, smooth camera transitions, node allocation ripple animation, engine timing display, build summary cards, dynamic OG meta tags, recent builds dropdown, toast notifications with auto-dismiss, DPS breakdown chart, equipment grid (paper-doll) view, stat source breakdown tooltips, OG image generation API.

**Mobile (4):** Import in bottom nav, touch pinch-zoom, long-press to allocate, mobile stats bottom sheet.

**Editors (2):** Item editor (create/edit/delete with slot/rarity/mods), skill/gem editor (add/edit/delete with autocomplete).

**Guides (1):** Build guide system with level scrubber, RF Juggernaut guide with 5 leveling steps.

### Rust WASM Engine (4,000+ lines, 156 tests)

- **lib.rs** - Core stat calculator with PoE formulas, modifier aggregation (flat/increased/more), enemy config, boss resistances, resistance penetration, WASM entry points
- **stat_parser.rs** - Parses 30+ PoE stat text patterns into typed Modifiers including per-damage-type, added damage ranges, minion mods, aura/curse effect
- **damage.rs** - Damage type enum, conversion chain (Phys->Lightning->Cold->Fire->Chaos), hit DPS with penetration, Bleed/Poison/Ignite DoT
- **gems.rs** - 11 skill gems with base damage, crit, cast time, effectiveness
- **supports.rs** - 25 support gems with level-20 modifiers
- **keystones.rs** - 15 keystones (CI, EO, RT, MoM, VP, Blood Magic, Unwavering Stance, etc.)
- **ascendancy.rs** - 7 base classes + 18 ascendancies with stat bonuses
- **weapons.rs** - 12 weapon base types, phys/ele DPS calculator
- **minions.rs** - 9 minion types (SRS, Zombie, Spectre, Skeletons, 5 Golems) with DPS calc
- **node_power.rs** - Fast node power evaluator: 50,000 evals/sec, 100 nodes ranked in 6ms
- **pathfinder.rs** - BFS shortest path, optimal path to target notables
- **integration_tests.rs** - Real build simulations (Marauder life, CI Occultist, EO), bulk perf tests
- **build.sh** - wasm-pack build pipeline, outputs 154KB WASM binary

### Backend

- **Auth.js** - GitHub + Discord OAuth via NextAuth v5
- **PostgreSQL** - Drizzle ORM schema: users, accounts, sessions, builds tables
- **Builds API** - Save/load builds (authenticated), cloud storage
- **Trade API** - PoE trade API proxy with rate limit handling, price check utilities
- **Import API** - pobb.in/pastebin proxy, PoE account character fetch

### Infrastructure

- Dockerfile (multi-stage) + docker-compose (with PostgreSQL)
- GitHub Actions CI (typecheck + test + build + e2e, 4 jobs)
- 207+ tests (32 TypeScript + 156 Rust + 19 E2E assertions)
- PWA with offline caching (service worker v2)
- README.md, ROADMAP.md, CONTRIBUTING.md
- .env.example for auth/database config
- Issue templates (feature request, bug report)
- Competitor analysis (7 tools, 289 lines)
- Community page with poe.ninja ladder integration
- Shared builds with leaderboard and class filters
- OG image generation for social sharing
- Build page with server-side metadata for SEO
- Sitemap.xml + robots.txt

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
| WASM binary size | 154KB |
| Worker bundle | 234KB |

## Tested With

- Witch Occultist Lv 97 Winter Orb build (pobb.in/gthdKM9YU2CR): 1.7M DPS, 3289 ES, 116 nodes, full items/skills

## Known Issues

- CalcDefence.lua:2987 format edge case (non-blocking)
- Scoped import (tree/items/skills only) is UI-only placeholder
- PoE 2 support is a UI stub only
- `@tsc` npm scope likely claimed; need alternative for publishing
- Rust WASM engine runs alongside Lua but doesn't replace it yet (Phase 2 of integration plan)
- Auth requires PostgreSQL and OAuth credentials to function (graceful 503 without them)
- Cluster jewel optimizer uses heuristic + Rust estimates, not full engine calcs yet
- Item/skill editors don't re-trigger engine evaluation (requires re-import)

## Development Commands

```bash
pnpm install                                   # Install dependencies
pnpm data:fetch                                # Download PoB Lua files + tree data
pnpm dev                                       # Start dev server (port 3003)
node apps/web/scripts/build-worker.mjs         # Rebuild Lua engine worker
node apps/web/scripts/convert-tree-lua.mjs     # Convert tree data to JSON
pnpm test                                      # Run TypeScript tests (32)
pnpm typecheck                                 # Type check
node apps/web/scripts/e2e-test.mjs             # E2E integration test (19 assertions)
cd packages/engine && cargo test               # Run Rust tests (156)
cd packages/engine && bash build.sh            # Build Rust WASM (requires wasm-pack)
docker compose up --build                      # Full deployment with PostgreSQL
```

## Auth Setup

1. Create GitHub OAuth app and Discord OAuth app
2. Copy `apps/web/.env.example` to `apps/web/.env.local`
3. Fill in `DATABASE_URL`, `GITHUB_CLIENT_ID/SECRET`, `DISCORD_CLIENT_ID/SECRET`, `AUTH_SECRET`
4. Run `pnpm drizzle-kit push` to create database tables

## Future Roadmap

See ROADMAP.md for the full checklist. Key priorities:

1. **Rust engine Phase 2:** Replace Lua engine for real-time recalc (50k evals/sec vs ~8s per eval)
2. **Full config parity:** Match PoB Desktop's config coverage
3. **Cluster optimizer with trade prices:** Enumerate notable combinations, rank by value (DPS/chaos)
4. **i18n:** Chinese, Korean, Russian translations
5. **PoE 2 support:** Full PoE 2 tree and skill system
6. **Build optimizer AI:** Suggest optimal tree for a given skill

## Research Reference

All SolvedExile reverse-engineering is in `docs/research/`:
- `solvedexile-architecture.md` - Stack, tabs, UI, design tokens
- `engine-architecture.md` - Dual engine internals, Rust WASM API
- `build-eval-flow.md` - Full paste-to-render pipeline
- `tree-renderer.md` - Canvas 2D renderer, spatial grid, camera
- `pob-code-format.md` - Base64+zlib codec, input classification
- `feature-gap-analysis.md` - SE features comparison
- `data-sources.md` - Tree JSON, sprites, external APIs
