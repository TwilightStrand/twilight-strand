# Session Handover - Twilight Strand Collective Build Planner

**Date:** 2026-08-03
**Repo:** 25 commits, 97 files
**Status:** Phase 1 complete, Phase 2 in progress - PoB engine boots and enters BUILD mode

## What Was Built

### From Zero to Working App in One Session

Started with an empty directory. Reverse-engineered SolvedExile's architecture (dual Lua+Rust engine, 12.5 MB WASM binary, full API surface), wrote a spec, planned 16 tasks, executed all of them plus Phase 2 work.

### Architecture

```
apps/web/                    Next.js 15 (App Router, Turbopack, Tailwind 4)
  ├── app/                   Layout, page, globals.css
  ├── components/
  │   ├── shell/             Header, StatsSidebar, TabContent, MobileNav, ImportDialog
  │   ├── tree/              TreeCanvas, tree-renderer, tree-camera, tree-spatial, tree-data, NodePowerControls
  │   ├── items/             ItemsTab
  │   ├── skills/            SkillsTab
  │   ├── calcs/             CalcsTab, CalcSection, CalcRow
  │   └── config/            ConfigTab
  ├── engine/
  │   ├── worker.ts          Web Worker (wasmoon + PoB Lua bootstrap)
  │   ├── bridge.ts          Main thread ↔ Worker messaging
  │   ├── pob-codec.ts       Re-exports from @tsc/pob-codec
  │   ├── pob-xml-parser.ts  Client-side XML parser (fallback)
  │   ├── types.ts           BuildStats, ItemData, SkillGroup types
  │   └── shims/             Node.js shims for esbuild (empty, url, path)
  ├── stores/
  │   ├── build-store.ts     Build state (Zustand)
  │   ├── tree-store.ts      Tree allocation state
  │   └── ui-store.ts        Tab, sidebar, import dialog state
  ├── scripts/
  │   └── build-worker.mjs   esbuild script for worker bundling
  └── public/
      ├── data/              PoB Lua files, tree JSON, sprite atlases
      ├── manifest.json      PWA manifest
      └── sw.js              Service worker

packages/
  ├── engine/                Rust WASM calc engine (wasm-bindgen + tsify)
  │   └── src/lib.rs         BuildStats, WasmEvaluator, evaluate_build_xml (stubs)
  ├── pob-codec/             Publishable npm package (@tsc/pob-codec)
  │   └── src/index.ts       decodePobCode, encodePobCode, classifyBuildInput
  └── pob-data/              Data fetching scripts
      ├── fetch-pob.sh       Download PoB Lua files from GitHub
      ├── fetch-tree.sh      Download tree JSON + sprites from GGG
      └── gen-manifest.sh    Generate file-list.json for worker mounting

docs/research/               SolvedExile reverse-engineering (8 analysis docs)
```

### Key Milestones Reached

1. **PoB Lua engine boots in-browser** via wasmoon in a Web Worker
   - 327 files mounted (313 Lua + .jsonc + runtime)
   - Launch.lua → OnInit → Main module → BUILD mode all succeed
   - esbuild bundles the worker separately to avoid Turbopack issues with wasmoon's Node.js code
   - Node.js shims (module, url, fs, path) stub Emscripten's dead code paths

2. **Interactive passive tree** with 3,390 nodes
   - Canvas 2D renderer with sprite atlas icons from GGG's CDN
   - Spatial grid for O(1) hit testing
   - Zoom/pan with pointer events
   - Click to allocate, hover tooltips with stat text
   - Node power heatmap UI (stub scoring until real engine calcs)

3. **Full app shell** with 6 tabs, stats sidebar, mobile responsive

4. **Import flow** with PoB code decode (base64 + zlib)

## What's Working Right Now

- App renders at localhost:3003 with full tree, tabs, sidebar
- Import dialog opens (Import button in header)
- PoB engine initializes in ~3-5 seconds (mounting 327 files)
- Build XML is parsed, level is extracted correctly (tested: level=90)
- Client-side XML parser provides fallback data for items/skills

## What's NOT Working Yet

### Critical: PoB tree/calc loading is slow (10-30s)

The PoB engine boots and enters BUILD mode successfully. When `loadBuildFromXML` is called, it triggers loading of the passive tree data (3.29 tree.lua is ~2.9 MB of Lua tables). This takes 10-30 seconds in the wasmoon VM, which causes timeouts in the debug probe.

**What we've confirmed works:**
- `launch.main` initializes (Main module loads)
- `build` object is created with `characterLevel`, `viewMode`, `targetVersion`
- Tabs load: `notesTab`, `partyTab`, `importTab`, `configTab`
- `loadBuildFromXML` succeeds (returns without error, sets level correctly)

**What's slow/missing:**
- `treeTab` / `calcsTab` / `itemsTab` / `skillsTab` are nil after a quick load
- These tabs depend on `PassiveTree.lua` which loads the full 3.29 tree data
- The tree loading is the bottleneck (2.9 MB Lua table parsing in WASM)

**Shims that were needed and added:**
- `SetMainObject`, `runCallback` - PoB callback system
- `RenderInit`, `SetViewport`, `GetVirtualScreenSize`, `GetResourceCount` - rendering stubs
- `bit` library (LuaJIT compat for `bit.band`, `bit.bor`, etc.)
- `unpack`/`table.unpack` compat (Lua 5.4 moved unpack)
- `loadstring = load` (renamed in Lua 5.2+)
- `arg` table stub (Main.lua reads `arg[0]`)
- `lua-utf8` module shim (C extension replaced with Lua 5.4 utf8 lib)
- `io.open` with `/pob/` prefix and missing file blocklist
- `CheckForUpdate` disabled

### Next Steps (in priority order)

#### Step 1: Wait for tree loading or optimize it
The tree data takes 10-30s to parse. Options:
1. **Just wait** - increase the timeout in bridge.ts and show a loading indicator
2. **Pre-parse tree data** - convert tree.lua to JSON at build time, load via fetch
3. **Lazy-load tree tab** - init without tree, load it in background

The simplest approach: increase `defaultTimeout` in `bridge.ts` from 60s to 120s, and add a progress callback so the UI shows "Loading passive tree data..."

#### Step 2: Extract stats from calcsTab.mainOutput
Once the tree loads, `build.calcsTab.mainOutput` should have all the stats. The worker has a `debug` message type for probing:

```javascript
const w = new Worker('/engine-worker.js?v=' + Date.now());
// After ready:
w.postMessage({ id: 10, type: 'debug', code: `
  -- Wait for tree to finish loading
  for i = 1, 10 do runCallback("OnFrame") end
  if build.calcsTab and build.calcsTab.mainOutput then
    local out = build.calcsTab.mainOutput
    return "Life=" .. tostring(out.Life) .. " DPS=" .. tostring(out.TotalDPS)
  end
  return "calcsTab still nil"
` });
```

#### Step 3: Wire engine bridge into build store
**File:** `apps/web/stores/build-store.ts`
**Change:** Replace `parsePobXml(xml)` with `bridge.evaluate(xml)` call
**Add:** Engine init on app load with loading state

#### Step 4: Add engine status indicator
**File:** New component or in Header
**Show:** "Engine loading (mounting 327 files...)" → "Engine ready" → "Evaluating build..."

### Engine bridge already points to real worker

`bridge.ts` loads `/engine-worker.js` (the esbuild-bundled wasmoon worker). The build store currently bypasses it by using `parsePobXml()` directly. To switch:

```typescript
// In build-store.ts importBuild():
// Replace:
const { parsePobXml } = await import("@/engine/pob-xml-parser");
const result = parsePobXml(xml);
// With:
const { getEngineBridge } = await import("@/engine/bridge");
const bridge = getEngineBridge();
if (!bridge.isReady()) await bridge.init("poe1");
const result = await bridge.evaluate(xml);
```

## Exact Files to Edit for Next Steps

### Step 1: Debug stat extraction
**File:** `apps/web/engine/worker.ts` (handleEvaluate function, ~line 300)
**Action:** Add a `probe` message type that runs arbitrary Lua and returns the result. Use it to inspect the build object structure.

### Step 2: Wire real engine into main app
**File:** `apps/web/stores/build-store.ts`
**Action:** Replace `parsePobXml(xml)` with engine bridge calls. Add engine initialization on first import.

### Step 3: Add engine loading indicator
**File:** `apps/web/components/shell/Header.tsx` or new `EngineStatus.tsx`
**Action:** Show "Engine loading..." during the 3-5 second init, "Engine ready" when done.

### Step 4: Publish packages (when ready)
**Files:** `packages/pob-codec/package.json`, `packages/engine/Cargo.toml`
**Action:** `cd packages/pob-codec && npm publish` and `cd packages/engine && cargo publish`
**Note:** Both are publish-ready but set `private: false`. Don't publish until the API is stable.

## Development Commands

```bash
# Start dev server
pnpm dev                    # Builds worker + starts Next.js

# Rebuild worker after changes to engine/worker.ts
node apps/web/scripts/build-worker.mjs

# Fetch PoB data (if not already done)
pnpm data:fetch

# Regenerate file manifest after adding/removing PoB files
bash packages/pob-data/gen-manifest.sh

# Typecheck
pnpm typecheck

# Rust engine
cd packages/engine && cargo check --target wasm32-unknown-unknown
cd packages/engine && cargo test

# Run tests
pnpm test
```

## Dev Server

The dev server runs on port 3003 (3000-3002 are taken by other projects). Start with:
```bash
cd apps/web && npx next dev --turbopack -p 3003
```

## Browser Testing

Use the Chrome DevTools MCP (chrome-devtools-visible) to interact:
```javascript
// Test engine in browser console
const w = new Worker('/engine-worker.js?v=' + Date.now());
w.onmessage = (e) => console.log(JSON.stringify(e.data, null, 2));
w.postMessage({ id: 1, type: 'init', gameId: 'poe1' });
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
