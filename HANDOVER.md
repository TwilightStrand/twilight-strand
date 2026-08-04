# Session Handover - Twilight Strand Collective Build Planner

**Date:** 2026-08-04
**Repo:** 35 commits
**Status:** Phase 1 and Phase 2 complete. PoB engine produces real calc numbers in the browser.

## What Was Built

### From Zero to Working Build Planner

Started with an empty directory. Reverse-engineered SolvedExile's architecture, wrote a spec, planned 16 tasks, executed all of them, then completed the engine integration (Phase 2) across two sessions.

### Architecture

```
apps/web/                    Next.js 15 (App Router, Turbopack, Tailwind 4)
  ├── app/
  │   ├── layout.tsx, page.tsx, globals.css
  │   └── api/import/route.ts  Proxy for pobb.in/pastebin URL imports
  ├── components/
  │   ├── shell/             Header (with EngineStatus), StatsSidebar, TabContent, MobileNav, ImportDialog
  │   ├── tree/              TreeCanvas, tree-renderer, tree-camera, tree-spatial, tree-data, NodePowerControls
  │   ├── items/             ItemsTab
  │   ├── skills/            SkillsTab
  │   ├── calcs/             CalcsTab, CalcSection, CalcRow
  │   └── config/            ConfigTab
  ├── engine/
  │   ├── worker.ts          Web Worker (wasmoon + PoB Lua bootstrap + LuaJIT compat shims)
  │   ├── bridge.ts          Main thread <> Worker messaging with progress callbacks
  │   ├── pob-codec.ts       Re-exports from @tsc/pob-codec
  │   ├── pob-xml-parser.ts  Client-side XML parser (Phase 1 instant display)
  │   ├── types.ts           BuildStats, ItemData, SkillGroup types
  │   └── shims/             Node.js shims for esbuild (empty, url, path)
  ├── stores/
  │   ├── build-store.ts     Build state (Zustand) with two-phase eval
  │   ├── tree-store.ts      Tree allocation state (synced from engine)
  │   └── ui-store.ts        Tab, sidebar, import dialog state
  ├── scripts/
  │   ├── build-worker.mjs   esbuild script for worker bundling
  │   └── convert-tree-lua.mjs  Converts tree.lua/sprites.lua to JSON at build time
  └── public/
      ├── data/              PoB Lua files, tree JSON, sprite atlases
      ├── manifest.json      PWA manifest
      └── sw.js              Service worker

packages/
  ├── engine/                Rust WASM calc engine (stubs, not yet used)
  ├── pob-codec/             Publishable npm package (@tsc/pob-codec)
  └── pob-data/              Data fetching scripts (fetch-pob.sh, fetch-tree.sh, gen-manifest.sh)

docs/research/               SolvedExile reverse-engineering (8 analysis docs)
```

## What's Working

### Engine Pipeline (fully operational)
- **PoB Lua engine boots in-browser** via wasmoon in a Web Worker (~5s boot)
- **Tree data pre-converted to JSON** at build time (2.9 MB Lua -> 1.7 MB JSON in 59ms), parsed with dkjson inside Lua to create native tables
- **All build tabs initialize**: itemsTab, treeTab, skillsTab, calcsTab, configTab, notesTab, partyTab, importTab
- **Real calc output** from calcsTab.mainOutput: DPS, life, ES, mana, resistances, attributes, mitigation, block, suppression
- **Two-phase import**: instant XML parse for immediate display, then engine evaluation in background

### Import Flow
- **PoB codes** (base64 + zlib): decoded via @tsc/pob-codec
- **Raw XML**: parsed directly
- **pobb.in URLs**: fetched via `/api/import` proxy route (`/pob/{id}` endpoint)
- **pastebin URLs**: fetched via `/api/import` proxy route (`/raw/{id}` endpoint)

### UI
- **Header**: shows ascendancy name (e.g. "Occultist Lv 97"), engine status indicator with progress
- **Stats sidebar**: real calc numbers (DPS, life/ES/mana, attributes, armour/evasion, resistances, block/suppression, Total EHP)
- **Passive tree**: 3,390 nodes with canvas renderer, allocated nodes lit up from engine spec
- **Items tab**: equipment and flasks from engine's itemsTab
- **Skills tab**: socket groups with gems, levels, quality from engine's skillsTab
- **Mobile responsive** with bottom nav

### Tested With
- Witch Occultist Lv 97 Winter Orb build (from pobb.in): 1.7M DPS, 3289 ES, 116 allocated nodes, all items/skills populated

## LuaJIT Compatibility Shims

The PoB codebase targets LuaJIT, but wasmoon uses PUC Lua 5.4. Several shims were needed:

| Shim | Issue | Fix |
|------|-------|-----|
| `string.format` | Lua 5.4 rejects `%d` with non-integer floats | Auto-floor numeric args for integer specifiers |
| `string.gsub` | Lua 5.4 rejects `%X` in replacement strings where X is not digit/% | Sanitize replacement strings, strip invalid `%` escapes |
| `bit` / `bit32` | LuaJIT's bit library vs Lua 5.4 native bitwise ops | Shim using `&`, `\|`, `~`, `<<`, `>>` operators |
| `unpack` / `table.unpack` | Moved between Lua versions | Cross-alias both |
| `loadstring` | Renamed to `load` in Lua 5.2+ | Alias `loadstring = load` |
| `jit` | PoB checks `jit.version` | Stub with `{ version = "disabled" }` |
| Timeless Jewel LUT | `assert` crashes when binary data files missing | Graceful return of empty table |
| Tree JSON keys | dkjson parses numeric keys as strings | Post-parse `rekey_numeric` converts back to integers |

## What's NOT Working / Known Issues

1. **CalcDefence edge case**: one remaining `string.format` error deep in defence breakdown calculations. Build still loads and produces stats; only some breakdown detail text is missing.
2. **Tree node rendering**: allocated nodes show connections but node icons don't change to "allocated" appearance (needs tree-renderer.ts update to use different sprite frames).
3. **No build editing**: builds are view-only. Changing items/skills/tree nodes doesn't recalculate.
4. **Crit Multiplier display**: shows raw engine value (e.g. "4%") which may need interpretation - PoB returns this in different units depending on the skill type.
5. **`@tsc` npm scope**: likely already claimed on npm. Need to pick alternative scope for publishing.
6. **Remaining prior work**: `/Users/alkj/code/github/pob-mcp` has a PoB MCP bridge using native LuaJIT + HeadlessWrapper (subprocess approach, different from our WASM approach).

## Next Steps (priority order)

1. **Build editing** - let users modify tree nodes, swap items, change skills and recalculate
2. **Tree renderer allocated state** - use allocated sprite frames for allocated nodes
3. **ES Recharge / Mana Regen** in sidebar (add to BuildStats type and extraction)
4. **Share builds** - generate PoB codes from current build state (encodePobCode already exists)
5. **Performance** - engine boot + eval takes ~15-20s. Consider caching the initialized engine state in IndexedDB, or pre-compiling Lua bytecode
6. **Publish @tsc/pob-codec** to npm (pick available scope first)

## Development Commands

```bash
# Start dev server
pnpm dev                    # Builds worker + starts Next.js on port 3003

# Rebuild worker after changes to engine/worker.ts
node apps/web/scripts/build-worker.mjs

# Convert tree data to JSON (after fetching new PoB data)
node apps/web/scripts/convert-tree-lua.mjs 3_29

# Fetch PoB data (if not already done)
pnpm data:fetch

# Regenerate file manifest after adding/removing PoB files
bash packages/pob-data/gen-manifest.sh

# Typecheck
pnpm typecheck
```

## Dev Server

Port 3003 (3000-3002 taken by other projects):
```bash
cd apps/web && npx next dev --turbopack -p 3003
```

## Browser Testing

Use Chrome DevTools MCP (chrome-devtools-visible):
```javascript
// Test engine in browser console
const w = new Worker('/engine-worker.js?v=' + Date.now());
w.onmessage = (e) => console.log(JSON.stringify(e.data, null, 2));
w.postMessage({ id: 1, type: 'init', gameId: 'poe1' });
// After ready, evaluate a build:
// w.postMessage({ id: 2, type: 'evaluate', xml: '<PathOfBuilding>...' });
```

## Research Reference

All SolvedExile reverse-engineering is in `docs/research/`:
- `solvedexile-architecture.md` - Stack, tabs, UI, design tokens, monetization
- `engine-architecture.md` - Dual engine internals, Rust WASM API, HeadlessWrapper
- `build-eval-flow.md` - Full paste-to-render pipeline, BuildStats model
- `tree-renderer.md` - Canvas 2D renderer, spatial grid, camera, sprites
- `pob-code-format.md` - Base64+zlib codec, input classification, migration
- `se-wasm-binary-analysis.md` - 12.5 MB WASM binary, .d.ts types, game data
- `feature-gap-analysis.md` - SE features we have vs don't have
- `data-sources.md` - Tree JSON, sprites, external APIs
