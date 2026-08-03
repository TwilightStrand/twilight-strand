# SolvedExile Engine Architecture (Deep Dive)

## Dual Engine System

SolvedExile runs **two calculation engines simultaneously**, not one:

### 1. PoB Lua Engine (via wasmoon)
- Runs the actual Path of Building Lua code in a Web Worker
- Uses `wasmoon 1.16.0` (Lua 5.4 compiled to WASM)
- Entry point: custom `HeadlessWrapper` shims injected before `Launch.lua`
- Handles: full build evaluation, item parsing, skill extraction, config options
- Bootstrap key: `pob-engine-bootstrap-2026-08-03-pob2662-3_29-v98-abyss-path-zorath-only`

### 2. Rust WASM Engine (`se_wasm`)
- Their own Rust-based calculation engine compiled to WebAssembly
- Loaded from `/wasm/se_wasm.js` + `/wasm/se_wasm_bg.wasm`
- Handles: fast re-evaluation, node power sweeps, sensitivity analysis, tree diffs
- Uses `wasm-bindgen` for JS interop
- Game data loaded from `/secalc-data/game/` (zip bundles)
- Timeless jewel LUTs from `/secalc-data/luts/`
- Feature flag: `NEXT_PUBLIC_CLIENT_WASM_TREE_EVAL`

## Rust Engine API (`se_wasm`)

```typescript
// Full build evaluation from PoB XML
export function evaluate_build_xml(xml: string): BuildStats;

// Create persistent evaluator for repeated fast evaluations
export function evaluator_from_build_xml(xml: string): WasmEvaluator;

// Batch ranking of multiple builds
export function rank_build_xmls(xmls: string[]): any;

// Game data initialization
export function init_game_data(data: Record<number, string>): void;

// Timeless jewel lookup tables
export function load_timeless_luts(luts: [number, Uint8Array][], vanity_parts: Uint8Array[]): void;
export function has_timeless_luts(): boolean;

// WasmEvaluator class - the core for interactive use
class WasmEvaluator {
  // Evaluate with given allocated node IDs
  evaluate(allocated_nodes: Uint32Array): BuildStats;
  
  // Compute stat deltas between current and proposed allocations
  // This is how node hover previews work
  evaluate_delta(current_nodes: Uint32Array, proposed_nodes: Uint32Array): {
    current: BuildStats;
    proposed: BuildStats;
  };
  
  // Additional methods found in API surface:
  // node_power, node_count, gem_id, gem_candidates, gem_plan_stats,
  // gem_target_baseline, item, parsed, mod_type, mod, skill_raw,
  // calc, load_json, evaluate_delta, initialized, buildspec
}
```

## How the Engines Work Together

The Lua engine is the "source of truth" for full evaluations. The Rust engine is the "fast path" for interactive operations:

1. **Import/Load**: User imports a PoB code
2. **Full Eval**: Lua engine runs the complete PoB pipeline (`_wasm_eval`)
3. **Extract**: Lua engine extracts build_info, items, skills, config_options
4. **Handoff**: Results sent to main thread, Rust engine initialized with the same build XML
5. **Interactive**: Rust engine handles tree node toggles, hover previews, node power sweeps
6. **Re-eval**: On major changes (items, skills, config), falls back to Lua for full recalc

## Worker Architecture

```
Main Thread (React)
  │
  ├── PobEngineWorker class
  │   ├── init(opts) → spawns Web Worker
  │   ├── sendAndWait(message) → request/response via postMessage  
  │   ├── Auto-respawn on crash (tracks timeout streaks)
  │   ├── Snapshot save/restore for fast boot
  │   └── Preview queue for real-time updates
  │
  └── Worker Thread
      ├── wasmoon LuaFactory → Lua VM
      │   ├── Virtual filesystem (PoB files mounted)
      │   ├── HeadlessWrapper shims (rendering, I/O, clipboard stubs)
      │   ├── Launch.lua → Main.lua → Build mode
      │   └── Custom _wasm_* bridge functions
      │
      └── se_wasm Rust module (loaded separately)
          ├── Game data initialization
          ├── Timeless jewel LUTs  
          └── Fast evaluation / node power
```

### Worker Message Protocol

Messages use `{id, type, opts}` format. Known types:
- `init` - initialize engine with gameId (poe1/poe2), timeout settings
- `validateRestore` - verify snapshot restore worked correctly
- Evaluation commands (evaluate, preview, node power sweep)

### Supported Games

The engine supports both `poe1` and `poe2` via the `gameId` parameter. The old `poe329x` variant has been retired.

## HeadlessWrapper Bridge

SolvedExile injects extensive Lua shims before loading PoB's `Launch.lua`. These replace all desktop-only PoB APIs with browser-compatible stubs:

### Rendering Stubs (no-op)
```lua
function SetDrawColor(r, g, b, a) end
function DrawImage(handle, x, y, w, h) end
function DrawImageQuad(handle, ...) end
function DrawString(x, y, align, height, font, text) end
function DrawStringWidth(height, font, text) return 0 end
function DrawStringCursorIndex(height, font, text, cx, cy) return 0 end
function NewImageHandle() return {} end
function SetWindowTitle(t) end
function GetCursorPos() return 0, 0 end
function ShowCursor(s) end
```

### Filesystem Stubs
```lua
function GetScriptPath() return "/pob" end
function GetRuntimePath() return "" end
function GetUserPath() return "" end
function MakeDir(p) end
function RemoveDir(p) end
```

### Key Bridge Functions
```lua
-- Module loading (replaces PoB's LoadModule)
function LoadModule(fn, ...)
  if not fn:match("%.lua") then fn = fn .. ".lua" end
  local f, e = loadfile(fn)
  if f then return f(...) else error("LoadModule() error: "..e) end
end

-- Build loading from XML (how PoB codes are imported)
function loadBuildFromXML(xmlText, name)
  _wasm_build_xml = xmlText  -- keep raw doc for early access
  mainObject.main:SetMode("BUILD", false, name or "", xmlText)
  runCallback("OnFrame")
  build = mainObject.main.modes["BUILD"]
end

-- Build loading from JSON (character import from pathofexile.com)
function loadBuildFromJSON(getItemsJSON, getPassiveSkillsJSON)
  mainObject.main:SetMode("BUILD", false, "")
  runCallback("OnFrame")
  build = mainObject.main.modes["BUILD"]
  local charData = build.importTab:ImportItemsAndSkills(getItemsJSON)
  build.importTab:ImportPassiveTreeAndJewels(getPassiveSkillsJSON, charData)
end
```

### Custom _wasm_* Functions

SolvedExile adds custom Lua functions prefixed with `_wasm_` that the JS bridge calls:

- `_wasm_eval(xml)` - evaluate a build from XML, returns stats
- `_wasm_build_info()` - extract build metadata
- `_wasm_extract_items()` - extract equipped items
- `_wasm_extract_build_items()` - extract all build items
- `_wasm_extract_skills(include_descriptions)` - extract skill groups
- `_wasm_preview_allocation` - fast preview for node hover
- `_wasm_rebuild_timeless_transforms_fast(spec)` - timeless jewel recalc
- `_wasm_gc_step` - adaptive garbage collection

## Node Power Implementation

The node power heatmap is one of the most computationally expensive features. Their implementation (from the Lua bridge code):

### Algorithm
1. Get the current build's calculator and allocated nodes
2. Sweep unallocated nodes nearest-first by path distance from current allocation
3. For each candidate node, temporarily allocate it and run the calc pipeline
4. Record the delta in offence and defence stats
5. Stop when `maxDepth` or calc budget is reached
6. Normalize deltas to produce heat values

### Options
- `metric` - which stat to sweep (defaults to combined offence + defence)
  - Damage stats: AverageDamage, TotalDot, *DPS* (includes minion contribution)
  - TakenHit stats: negated before delta (lower = better)
- `masteries` - score unallocated masteries by trying each effect
- `allocated` - score allocated nodes via removeNodes (loss if removed, signed)
- `clusters` - score cluster notables from `spec.tree.clusterNodeMap`
- `maxDepth` (Points setting) - 5, 10, 15, or All

### UI Controls (from screenshot)
- Points: 5 | 10 | 15 | All
- Metric dropdown: "Offence + Defence" (also single stats like DPS)
- Masteries checkbox
- Report button (generates a sorted report)
- Color scale: low (orange) to high (green)

### Key insight from code comments
> "Nodes are swept nearest-first by path distance and the sweep stops once maxDepth 
> or the unique-calc budget is reached, so the cost stays bounded to the reachable 
> frontier (PoB nodePowerMaxDepth)."

> "Uses the SAME fast preview mechanism _wasm_preview_allocation uses 
> (initEnv CALCULATOR + specEnv reuse + perform), which is both accelerated 
> and produces real per-node deltas."

## Sensitivity / Marginal Value

The "Marginal Value" feature (supporter early access) works by:
1. Creating a persistent `WasmEvaluator` from the build XML
2. Defining 18 "levers" (stat axes): Life, Block, Suppression, Attack Speed, Crit, etc.
3. For each lever, inject a small modifier into the build
4. Re-evaluate via the Rust WASM engine
5. Compute delta-EHP and delta-DPS
6. Rank levers by their marginal value

This is a sensitivity analysis: "which stat gives me the most DPS/EHP per point of investment?"

## GC Tuning

They've done careful garbage collection tuning for the Lua VM:

```lua
-- Normal: aggressive GC (setpause=100), starts fresh cycle on any heap growth
-- During evaluation: relaxed (setpause=200) to avoid thrashing during ~100MB 
-- parse+DB-rebuild allocation storm
-- After eval: restore to 100, run adaptive step (full collect on >25%/+64MB 
-- growth, else incremental)
collectgarbage('setpause', 200)  -- relaxed for eval
-- ... evaluation runs ...
collectgarbage('setpause', 100)  -- restore aggressive
_wasm_gc_step()                  -- adaptive cleanup
```

## Writer Tab Locking

Uses `navigator.locks` API to prevent multiple browser tabs from modifying the same build simultaneously:

```javascript
navigator.locks.request('solved_exile_writer_tab', () => {
  isWriter = true;
  notify();
  return new Promise(() => {}); // hold lock forever
});
```

## Environment Flags

| Flag | Purpose |
|------|---------|
| `NEXT_PUBLIC_CLIENT_WASM_TREE_EVAL` | Enable Rust WASM for tree evaluation |
| `NEXT_PUBLIC_POB_ENGINE_DEBUG` | Debug logging for engine |
| `NEXT_PUBLIC_POB_ENGINE_SNAPSHOTS` | Enable/disable snapshot save/restore |
| `NEXT_PUBLIC_SE_E2E_DEBUG` | E2E testing debug mode |

## Data Files

### `/secalc-data/game/` (Rust engine game data)
Zip files loaded into the Rust engine:
- Timeless jewel data (BrutalRestraint, MilitantFaith, ElegantHubris, HeroicTragedy, LethalPride)

### `/secalc-data/luts/` (Timeless jewel lookup tables)
Pre-computed lookup tables for fast timeless jewel evaluation:
- Individual jewel type zips
- `GloriousVanity.zip.part0` through `part4` (split due to size)

### `/pob-data/` (Lua engine data)
- `manifest.json` - version info, file list, tree versions
- `bundle.tar.gz` - all 263 PoB Lua files (~5 MB gzipped)
