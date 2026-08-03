# Build Plan: Twilight Strand Collective - Build Planner (Phase 1 MVP)

## Dependency Graph

```
T1: Monorepo scaffolding
 ├── T2: App shell (layout, header, tabs)
 │    └── T5: Import flow (paste PoB code → decode → display)
 ├── T3: PoB data pipeline (fetch Lua files + tree data)
 │    └── T4: Engine worker + Lua bootstrap
 │         └── T6: Build evaluation (code → Lua → BuildStats)
 │              ├── T7: Stats sidebar
 │              ├── T8: Items tab
 │              ├── T9: Skills tab
 │              └── T10: Calcs tab
 ├── T11: WebGL tree renderer (load data, draw nodes)
 │    └── T12: Tree interaction (zoom/pan, click, hover preview)
 │         └── T13: Node power heatmap
 ├── T14: Config tab
 ├── T15: Rust engine skeleton
 └── T16: PWA + service worker
```

---

## Task 1: Monorepo Scaffolding

**Description:** Initialize the monorepo with pnpm workspaces, Turborepo, and the base project structure. Set up TypeScript, ESLint, and the Rust engine crate skeleton. Get `pnpm dev` booting a blank Next.js page.

**Acceptance criteria:**
- [ ] pnpm workspace with `apps/web` and `packages/engine`
- [ ] Turborepo config with `dev`, `build`, `lint`, `typecheck` pipelines
- [ ] Next.js 15 app in `apps/web` with App Router, TypeScript strict, Tailwind 4
- [ ] Rust crate in `packages/engine` with `Cargo.toml`, wasm-bindgen, tsify deps
- [ ] Shared tsconfig base
- [ ] `pnpm dev` starts Next.js on localhost
- [ ] `cargo check` passes in `packages/engine`
- [ ] `.gitignore` covers node_modules, target/, .next/, .env

**Verification:**
- [ ] `pnpm dev` starts without errors
- [ ] `pnpm build` produces production build
- [ ] `pnpm typecheck` passes
- [ ] `cargo check --target wasm32-unknown-unknown` passes in packages/engine

**Dependencies:** None

**Files likely touched:**
- `package.json`, `pnpm-workspace.yaml`, `turbo.json`
- `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/tailwind.config.ts`
- `apps/web/app/layout.tsx`, `apps/web/app/page.tsx`
- `packages/engine/Cargo.toml`, `packages/engine/src/lib.rs`

**Estimated scope:** Medium (8 config files + 3 source files, but all boilerplate)

---

## Task 2: App Shell (Layout, Header, Tabs)

**Description:** Build the app shell matching SolvedExile's layout: header with game version/class info, tab navigation (Tree, Items, Skills, Config, Calcs, Settings), left stats sidebar placeholder, and main content area. Responsive with mobile bottom tab bar.

**Acceptance criteria:**
- [ ] Header with logo/name, game version picker placeholder, class/level display placeholder
- [ ] Tab bar with 6 tabs, active tab highlighted, URL-synced (`?tab=tree`)
- [ ] Left sidebar area (empty, for stats later)
- [ ] Main content area renders active tab's placeholder content
- [ ] Mobile: bottom tab bar, collapsed sidebar
- [ ] Dark theme by default using CSS custom properties matching PoE aesthetic

**Verification:**
- [ ] All 6 tabs clickable, content area changes
- [ ] Browser back/forward navigates tabs
- [ ] Responsive: resize to mobile shows bottom tabs
- [ ] `pnpm build` succeeds

**Dependencies:** Task 1

**Files likely touched:**
- `apps/web/app/layout.tsx`, `apps/web/app/page.tsx`
- `apps/web/components/shell/Header.tsx`
- `apps/web/components/shell/TabBar.tsx`
- `apps/web/components/shell/StatsSidebar.tsx`
- `apps/web/components/shell/MobileNav.tsx`
- `apps/web/app/globals.css` (design tokens)
- `apps/web/stores/ui-store.ts`

**Estimated scope:** Medium

---

## Task 3: PoB Data Pipeline

**Description:** Create scripts to fetch PoB Lua files from the PathOfBuildingCommunity GitHub repo at a pinned tag, download passive tree JSON and sprite atlases, and bundle everything for serving as static assets. This data is the foundation for both the Lua engine and tree renderer.

**Acceptance criteria:**
- [ ] `pnpm data:fetch` downloads PoB Lua files from a pinned tag (v2.66.2)
- [ ] `pnpm data:bundle` creates a tar.gz of the Lua files with a manifest.json
- [ ] Passive tree JSON (tree-3_29.json) downloaded and placed in `apps/web/public/data/`
- [ ] Sprite atlases (skills, frames, mastery, connections) downloaded
- [ ] manifest.json lists all files with sizes and content hash
- [ ] `.gitignore` excludes the downloaded data (it's fetched on build)
- [ ] Scripts work for both PoE 1 (3.29) and PoE 2 tree versions

**Verification:**
- [ ] `pnpm data:fetch` completes without errors
- [ ] `apps/web/public/data/pob/manifest.json` exists with correct file count
- [ ] `apps/web/public/data/tree/tree-3_29.json` is valid JSON with `nodes` key
- [ ] Sprite PNGs exist in `apps/web/public/data/passive-skill/`

**Dependencies:** Task 1

**Files likely touched:**
- `packages/pob-data/fetch.sh`
- `packages/pob-data/bundle.ts`
- `packages/pob-data/manifest.ts`
- `packages/pob-data/package.json`
- Root `package.json` (add `data:fetch`, `data:bundle` scripts)

**Estimated scope:** Medium

---

## Task 4: Engine Worker + Lua Bootstrap

**Description:** Set up the Web Worker that runs the PoB Lua engine via wasmoon. Boot the Lua VM, mount the PoB files into a virtual filesystem, inject HeadlessWrapper shims, and run Launch.lua. The worker should accept messages and respond with results. This is the calculation backbone.

**Acceptance criteria:**
- [ ] Web Worker boots wasmoon and loads Lua 5.4 VM
- [ ] PoB Lua files fetched and mounted into virtual filesystem
- [ ] HeadlessWrapper shims injected (rendering, I/O, clipboard stubs)
- [ ] `Launch.lua` and `OnInit` run successfully
- [ ] Worker accepts `{type: "init", gameId: "poe1"}` message
- [ ] Worker reports ready status to main thread
- [ ] Engine bridge class on main thread manages worker lifecycle (spawn, message, timeout, respawn)
- [ ] TypeScript types for all worker messages

**Verification:**
- [ ] Console shows "PoB engine initialized" after worker boots
- [ ] No Lua errors in console
- [ ] `pnpm build` succeeds (worker bundled correctly)
- [ ] Unit tests for bridge message serialization

**Dependencies:** Task 3

**Files likely touched:**
- `apps/web/engine/worker.ts`
- `apps/web/engine/bridge.ts`
- `apps/web/engine/lua-shims.ts`
- `apps/web/engine/types.ts`

**Estimated scope:** Large (complex wasmoon integration, but well-documented from SE research)

---

## Checkpoint: After Tasks 1-4
- [ ] Monorepo builds and dev server runs
- [ ] App shell renders with tabs
- [ ] PoB data is downloaded and bundled
- [ ] Lua engine boots in Web Worker without errors
- [ ] **Review with human before proceeding**

---

## Task 5: Import Flow (Paste PoB Code)

**Description:** Build the PoB code import UI. User pastes a build code (or URL), it gets decoded (base64 + zlib → XML), and sent to the Lua engine for evaluation. Show loading state during evaluation.

**Acceptance criteria:**
- [ ] Import dialog/area accepts pasted text
- [ ] `decodePobCode` handles base64 (URL-safe and standard) + zlib inflate
- [ ] `encodePobCode` handles zlib deflate + base64 (for export)
- [ ] Input classification: detects PoB codes, pastebin URLs, raw XML
- [ ] Pastebin/pobb.in URLs fetched via `/api/import` proxy route
- [ ] Decoded XML sent to engine worker for evaluation
- [ ] Loading spinner while engine processes
- [ ] Error handling for invalid codes

**Verification:**
- [ ] Paste a real PoB code → loading → stats appear
- [ ] Paste a pastebin URL → fetches and decodes
- [ ] Paste garbage → shows error message
- [ ] Unit tests for decodePobCode/encodePobCode with known test vectors

**Dependencies:** Task 2, Task 4

**Files likely touched:**
- `apps/web/engine/pob-codec.ts`
- `apps/web/components/shell/ImportDialog.tsx`
- `apps/web/app/api/import/route.ts`
- `apps/web/stores/build-store.ts`

**Estimated scope:** Medium

---

## Task 6: Build Evaluation (Code → Lua → BuildStats)

**Description:** Wire up the full evaluation pipeline in the Lua engine. When a PoB XML is sent to the worker, call `loadBuildFromXML`, run the calc pipeline, and extract structured BuildStats (DPS, defence, attributes, items, skills). Define the BuildStats TypeScript type matching PoB's output.

**Acceptance criteria:**
- [ ] Worker handles `{type: "evaluate", xml: string}` messages
- [ ] Lua calls `loadBuildFromXML(xml)` → `runCallback("OnFrame")` → extracts stats
- [ ] BuildStats type defined with 60+ fields (offence, defence, attributes, resistances, EHP, etc.)
- [ ] Items extracted with slot, name, mods, quality
- [ ] Skill groups extracted with active gem + support gems
- [ ] Build info extracted (class, ascendancy, level, bandit, pantheon)
- [ ] Results sent back to main thread via postMessage
- [ ] Build store updated with evaluation results

**Verification:**
- [ ] Import a known PoB code → BuildStats matches desktop PoB output
- [ ] DPS, Life, ES, Mana values match within rounding
- [ ] Resistances show correct values
- [ ] Items show in correct slots

**Dependencies:** Task 5

**Files likely touched:**
- `apps/web/engine/worker.ts` (add evaluate handler)
- `apps/web/engine/types.ts` (BuildStats, ItemData, SkillGroup types)
- `apps/web/engine/lua-shims.ts` (add _wasm_eval, _wasm_extract_* functions)
- `apps/web/stores/build-store.ts`

**Estimated scope:** Large

---

## Task 7: Stats Sidebar

**Description:** Build the persistent left sidebar showing key build stats. Displays Offence (Skill DPS, Crit, Attack Speed, Hit Chance), Attributes (Str/Dex/Int), Max Hit Taken, Defence (Armour, Evasion, Evade%), Recovery, Resistances, and Mitigation. Updates live when build changes.

**Acceptance criteria:**
- [ ] Sidebar reads from build store
- [ ] Sections: Offence, Attributes, Max Hit Taken, Defence, Recovery, Resistances, Mitigation
- [ ] Color-coded values (red for negative resistances, stat-colored for attributes)
- [ ] Resistance format: `-60 /75%` (current / max)
- [ ] Responsive: collapses on mobile, expandable
- [ ] Empty state when no build loaded

**Verification:**
- [ ] Import a build → sidebar shows correct stats
- [ ] Values match desktop PoB
- [ ] Mobile: sidebar collapsed, shows summary bar

**Dependencies:** Task 6

**Files likely touched:**
- `apps/web/components/stats/StatsSidebar.tsx`
- `apps/web/components/stats/StatSection.tsx`
- `apps/web/components/stats/StatRow.tsx`

**Estimated scope:** Small

---

## Task 8: Items Tab

**Description:** Build the Items tab showing all equipment slots, equipped items with their mods, item sets, and weapon swap. Layout: left column with slot list, right area with selected item details.

**Acceptance criteria:**
- [ ] All slots listed: Weapon, Off Hand, Helmet, Body, Gloves, Boots, Amulet, Left Ring, Right Ring, Belt, Flask 1-5
- [ ] Weapon swap (Set I / Set II)
- [ ] Clicking a slot shows item details (name, base, mods, quality, sockets)
- [ ] Item mods color-coded (prefix/suffix/implicit/crafted)
- [ ] Empty slots show "Empty" with slot name
- [ ] Item set selector (Default, New, Copy, Rename, Delete)

**Verification:**
- [ ] Import a geared build → all items show in correct slots
- [ ] Item mods display matches PoB
- [ ] Weapon swap toggles between sets

**Dependencies:** Task 6

**Files likely touched:**
- `apps/web/components/items/ItemsTab.tsx`
- `apps/web/components/items/SlotList.tsx`
- `apps/web/components/items/ItemDetail.tsx`
- `apps/web/components/items/ItemMods.tsx`

**Estimated scope:** Medium

---

## Task 9: Skills Tab

**Description:** Build the Skills tab showing socket groups with active and support gems. Layout: left column with socket group list, right area with group details and gem selector.

**Acceptance criteria:**
- [ ] Socket groups listed with active gem name and linked support count
- [ ] Selected group shows all gems with level, quality, enabled state
- [ ] Gem icons color-coded by attribute (red/green/blue)
- [ ] Skill set selector (like item sets)
- [ ] Add/remove socket group buttons
- [ ] Main skill indicator

**Verification:**
- [ ] Import a build → socket groups show correctly
- [ ] Gem names, levels, and qualities match PoB
- [ ] Active vs support gems visually distinct

**Dependencies:** Task 6

**Files likely touched:**
- `apps/web/components/skills/SkillsTab.tsx`
- `apps/web/components/skills/SocketGroupList.tsx`
- `apps/web/components/skills/SocketGroup.tsx`
- `apps/web/components/skills/GemSlot.tsx`

**Estimated scope:** Medium

---

## Task 10: Calcs Tab

**Description:** Build the Calculations tab showing the full stat breakdown. Two-column layout: left for offence stats (Hit Damage, Attack/Cast Rate, Crits, Accuracy, Ailments, Skill Mechanics), right for defence stats (Attributes, Life, Mana, ES, Resists, Armour/Evasion, EHP, Max Hit, Charges).

**Acceptance criteria:**
- [ ] Two-column layout with section cards
- [ ] Sections: Hit Damage, Attack/Cast Rate, Crits, Accuracy, Ignite, Non-Damaging Ailments, Skill Mechanics (left); Attributes, Life, Mana, ES, Resists, Armour & Evasion, Damage Avoidance, Effective HP, Max Hit Taken, Other Defences, Charges & Rage (right)
- [ ] Section headers color-coded by category
- [ ] Values with proper formatting (decimal places, percentages, suffixes)
- [ ] Filter/search box to find specific stats

**Verification:**
- [ ] Import a build → all calc sections populated
- [ ] DPS, crit, attack speed values match PoB
- [ ] EHP and max hit taken values match

**Dependencies:** Task 6

**Files likely touched:**
- `apps/web/components/calcs/CalcsTab.tsx`
- `apps/web/components/calcs/CalcSection.tsx`
- `apps/web/components/calcs/CalcRow.tsx`

**Estimated scope:** Medium

---

## Checkpoint: After Tasks 5-10
- [ ] Full import → evaluate → display pipeline works end-to-end
- [ ] Stats sidebar, Items, Skills, and Calcs tabs all populate from a real PoB code
- [ ] Values match desktop PoB
- [ ] **Review with human before proceeding to tree renderer**

---

## Task 11: WebGL Tree Renderer (Static Display)

**Description:** Build the WebGL-based passive tree renderer. Load tree JSON data (3,397 nodes, groups, connections), load sprite atlases as textures, and draw the full passive tree. No interaction yet; just static rendering with correct node positions, icons, frames, and connection lines.

**Acceptance criteria:**
- [ ] Loads tree-3_29.json and parses node positions, groups, connections
- [ ] Sprite atlases loaded as WebGL textures
- [ ] Nodes drawn with correct icons from sprite atlas
- [ ] Node frames drawn (normal, notable, keystone, mastery, ascendancy)
- [ ] Connection lines drawn between linked nodes
- [ ] Group backgrounds rendered
- [ ] Class starting areas visible
- [ ] Canvas fills available space, respects DPR

**Verification:**
- [ ] Tree renders visually similar to SolvedExile/PoB
- [ ] All 7 class areas visible
- [ ] Notable and keystone nodes visually distinct
- [ ] No visual glitches at default zoom

**Dependencies:** Task 3 (tree data)

**Files likely touched:**
- `apps/web/components/tree/TreeCanvas.tsx`
- `apps/web/components/tree/tree-renderer.ts`
- `apps/web/components/tree/tree-sprites.ts`
- `apps/web/components/tree/tree-shaders.ts`
- `apps/web/components/tree/tree-data.ts` (parser for tree JSON)

**Estimated scope:** Large

---

## Task 12: Tree Interaction (Zoom, Pan, Click, Hover)

**Description:** Add camera controls and node interaction to the tree renderer. Smooth exponential zoom centered on cursor, momentum-based pan, touch support. Click nodes to allocate/deallocate (with BFS pathfinding to nearest allocated node). Hover shows stat delta preview via engine.

**Acceptance criteria:**
- [ ] Exponential zoom (scroll wheel + pinch), centered on cursor position
- [ ] Pan with mouse drag and touch drag, with momentum/inertia
- [ ] Spatial grid index for O(1) node hit testing at any zoom level
- [ ] Click unallocated node → BFS path to nearest allocated node → allocate path
- [ ] Click allocated node → deallocate (if leaf)
- [ ] Hover node → debounced (120ms) engine call → show stat delta tooltip
- [ ] Allocated nodes visually highlighted (brightness boost)
- [ ] Node search: type to filter, matching nodes highlighted

**Verification:**
- [ ] Zoom in/out smoothly on desktop and mobile
- [ ] Pan feels natural with momentum
- [ ] Click a node near Scion start → path highlights → allocate
- [ ] Hover shows "+X% increased damage" style delta
- [ ] Search "life" highlights life nodes

**Dependencies:** Task 11, Task 6

**Files likely touched:**
- `apps/web/components/tree/tree-camera.ts`
- `apps/web/components/tree/tree-spatial.ts`
- `apps/web/components/tree/tree-renderer.ts` (add interaction layer)
- `apps/web/stores/tree-store.ts`

**Estimated scope:** Large

---

## Task 13: Node Power Heatmap

**Description:** Implement the node power heatmap overlay. Sweep unallocated nodes within N points of current allocation, evaluate each one's DPS/defence impact, and color-code nodes from low (cold) to high (hot). Configurable depth (5/10/15/All), metric (Offence+Defence, single stats), and mastery scoring.

**Acceptance criteria:**
- [ ] Toggle buttons: Off / DPS / Defence / Both
- [ ] Points depth selector: 5, 10, 15, All
- [ ] Metric dropdown (Offence + Defence, or specific stat keys)
- [ ] Masteries checkbox (score unallocated masteries)
- [ ] Color scale rendered: low (orange/red) → high (green)
- [ ] Status line: "Scored N nodes within M points"
- [ ] Sweep runs in Lua engine (later Rust), results cached per allocation state
- [ ] Heatmap rendered as WebGL overlay (alpha-blended glow per node)

**Verification:**
- [ ] Import a build → enable DPS heatmap → nodes color by impact
- [ ] Changing depth (5 → 15) scores more nodes
- [ ] Allocating a node invalidates and re-runs the sweep
- [ ] Performance: sweep completes within 2s for depth=5

**Dependencies:** Task 12, Task 6

**Files likely touched:**
- `apps/web/components/tree/NodePowerControls.tsx`
- `apps/web/components/tree/tree-renderer.ts` (heatmap overlay)
- `apps/web/engine/worker.ts` (add nodepower sweep handler)
- `apps/web/engine/lua-shims.ts` (add _nps_setup Lua function)

**Estimated scope:** Large

---

## Task 14: Config Tab

**Description:** Build the Config tab showing build configuration options. Maps PoB's ConfigOptions.lua - toggles for enemy type, charges, flasks, boss settings, etc. Changes trigger engine re-evaluation.

**Acceptance criteria:**
- [ ] Config options rendered from engine-provided schema
- [ ] Input types: checkbox, dropdown, number input
- [ ] Grouped by category (General, Charges, Skill Options, Map Modifiers, etc.)
- [ ] Changes sent to engine, trigger re-evaluation
- [ ] Stats sidebar updates after config change
- [ ] Config state persisted in build data

**Verification:**
- [ ] Import a build → config tab shows current settings
- [ ] Toggle "Enemy is a Boss" → DPS changes
- [ ] Enable power charges → crit chance updates

**Dependencies:** Task 6

**Files likely touched:**
- `apps/web/components/config/ConfigTab.tsx`
- `apps/web/components/config/ConfigSection.tsx`
- `apps/web/components/config/ConfigControl.tsx`

**Estimated scope:** Medium

---

## Task 15: Rust Engine Skeleton

**Description:** Set up the Rust WASM engine with a working build pipeline. Define the public API surface (matching se_wasm's approach), implement a stub evaluator that parses XML and returns dummy BuildStats, and wire it into the Next.js build so the WASM binary is served from `/wasm/`.

**Acceptance criteria:**
- [ ] `wasm-pack build` produces working WASM + JS glue + .d.ts
- [ ] Public API: `evaluate_build_xml(xml) -> BuildStats`
- [ ] Public API: `WasmEvaluator` class with `evaluate(nodes)` and `evaluate_delta(current, proposed)`
- [ ] BuildStats struct with tsify derives matching TypeScript types
- [ ] XML parsing (basic PoB XML structure)
- [ ] Stub implementation returns zeroed stats
- [ ] WASM output copied to `apps/web/public/wasm/` during build
- [ ] Turbo pipeline includes Rust build step

**Verification:**
- [ ] `wasm-pack build --target web` succeeds
- [ ] Generated .d.ts matches expected API surface
- [ ] Import WASM module in browser → call evaluate_build_xml → get BuildStats back
- [ ] `cargo test` passes

**Dependencies:** Task 1

**Files likely touched:**
- `packages/engine/Cargo.toml`
- `packages/engine/src/lib.rs`
- `packages/engine/src/types.rs`
- `packages/engine/src/evaluator.rs`
- `packages/engine/src/xml_parser.rs`
- `turbo.json` (add engine build)

**Estimated scope:** Medium

---

## Task 16: PWA + Service Worker

**Description:** Add PWA support with a service worker that caches the app shell and PoB data for offline use and instant repeat visits. Add web app manifest for install-to-homescreen.

**Acceptance criteria:**
- [ ] `manifest.json` with name, icons, theme color, display: standalone
- [ ] Service worker caches app shell (HTML, JS, CSS)
- [ ] Service worker caches PoB data bundle after first load
- [ ] Repeat visits boot from cache (instant load)
- [ ] Cache invalidation on new deployment
- [ ] Apple touch icon and meta tags for iOS

**Verification:**
- [ ] Chrome DevTools → Application → Manifest shows valid manifest
- [ ] Service worker registered and active
- [ ] Disconnect network → app still loads from cache
- [ ] Lighthouse PWA audit passes

**Dependencies:** Task 2

**Files likely touched:**
- `apps/web/public/manifest.json`
- `apps/web/public/sw.js` (or next-pwa config)
- `apps/web/app/layout.tsx` (meta tags)

**Estimated scope:** Small

---

## Final Checkpoint: Phase 1 Complete
- [ ] Full import → evaluate → display pipeline
- [ ] Interactive WebGL passive tree with node power heatmap
- [ ] All 6 tabs functional with real data
- [ ] Stats sidebar with live updates
- [ ] PWA installable and works offline
- [ ] Mobile responsive
- [ ] PoB code export
- [ ] Rust engine skeleton builds and serves stubs
- [ ] **Review with human: ready for public alpha?**
