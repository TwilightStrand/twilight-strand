# Session Handover - Twilight Strand Collective Build Planner

**Date:** 2026-08-05
**Repo:** 160+ commits
**Status:** v0.2.0 complete. Activity bar UX. Lua engine accuracy under investigation.

## Quick Stats

| Metric | Count |
|--------|-------|
| React components | 51 |
| Rust engine | 18 modules, 7,501+ lines |
| Rust tests | 292 |
| TS tests | 114 (+ 14 codec tests) |
| API routes | 9 |
| Generated data | clusters, gems, uniques, config (576), corruption implicits (371) |
| Unique items (Rust) | 95+ |
| Support gems (Rust) | 50+ |
| Keystones (Rust) | 40 |
| Themes | 4 (Dark, Light, Astral, Nostalgia) |
| Languages | 4 (EN, ZH, KO, RU) |

## Layout

Activity bar (48px vertical, left edge) + thin status bar (36px) replaces old tab header. Paper doll equipment view available. Stats sidebar with hero tiles (DPS, Life, EHP).

## Active Investigation: Lua Engine DPS Accuracy

**Problem:** Lua PoB engine in WASM shows 1.8M DPS for a build that PoB Desktop calculates at 130M. ES: 2,958 vs 11,050.

**Debug state (from instrumentation):**
```
build=yes items=89 slotted=1 cfg=45 pwr=on frz=on skills=6
mainGrp=1 ordSlots=131 itemsWithMods=64 hasItemModData=yes
dps=1819534 es=2958 life=1 ver=3_0
```

**What works:** Build loads, config applies (charges on), resistances correct (81/71/81/-35), CI detected (Life=1), block correct (29%), tree nodes allocated (113/121).

**What fails:** Item mods (64 items have mods) don't flow into CalcSetup's calculation environment. modDB only has 8 entries. Items exist in orderedSlots but CalcSetup isn't processing them.

**Next steps:**
1. Check `orderedSlots[i].selItemId` via new debug (slotsWithItem, slotsWithMods)
2. If slots have items, check why CalcSetup skips them
3. Likely cause: `item.modList` is a PoB ModList class object that wasmoon's `ipairs` can't iterate
4. Test build: https://pobb.in/MwTyQN55T8tE

## What Was Built This Session

### v0.2.0 Roadmap (all P0/P1/P2 complete)
- Config tab: 576 auto-generated options from PoB ConfigOptions.lua
- Watcher's Eye aura-conditional mod wiring
- Cluster jewel notable resolution
- 35 new uniques, 20 supports, 15 keystones in Rust engine
- Expanded stat_parser (conversion, spell block, gem levels, etc.)
- Smart tree pathing with BFS travel cost
- TreeDiff, TimelessSearch, UniqueRanker, UpgradeSuggester, MetaStats
- PowerReport respec-candidate mode
- i18n (zh/ko/ru), 2 new leveling guides, GuideEditor
- Binary corruption implicit data (371 mods)

### UX Overhaul
- Activity bar (VS Code pattern) replaces horizontal tabs
- Thin status bar replaces dense header
- Paper doll equipment layout (PoE character panel)
- Blueprint dot-grid background
- Hero stat tiles in sidebar
- Better empty states with tab-specific hints
- Mobile expandable stat grid
- Header actions collapsed to dropdown

### Performance
- Tree renderer: connection batching (5k to ~5 strokes), node batching, off-screen canvas caching, sprite clip skip at low zoom
- Lazy-loaded gem/unique data (900KB out of bundle)
- Lua boot split (44MB essential vs 138MB deferred)
- ConfigControl memoized, camera state throttled

### Docs
- CONTRIBUTING.md rewritten
- contributing/UX.md with design principles, patterns from Blender/Figma/VS Code research
- SPEC.md for activity bar + paper doll

## Dev Commands

```bash
pnpm dev              # Dev server (port 3003)
pnpm test             # TS tests
pnpm engine:test      # Rust tests (292)
pnpm typecheck        # TypeScript check
pnpm data:gen         # Regenerate all game data
node apps/web/scripts/build-worker.mjs  # Rebuild Lua worker (required after worker.ts changes)
```

## Key Files

- `apps/web/app/page.tsx` - Main layout (ActivityBar + StatusBar + sidebar + content)
- `apps/web/components/shell/ActivityBar.tsx` - Vertical icon nav
- `apps/web/components/shell/StatusBar.tsx` - Thin top bar
- `apps/web/components/items/PaperDoll.tsx` - Spatial equipment layout
- `apps/web/engine/worker.ts` - Lua engine worker (with debug instrumentation)
- `apps/web/engine/rust-converter.ts` - XML to Rust engine bridge
- `apps/web/engine/pob-xml-parser.ts` - Client-side XML parser (extracts config)
- `packages/engine/src/lib.rs` - Rust stat calculator
- `contributing/UX.md` - Design principles
