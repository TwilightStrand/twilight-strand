# Session Handover - Twilight Strand Collective Build Planner

**Date:** 2026-08-04
**Repo:** 60+ commits this session, 90+ features
**Status:** Feature-complete MVP - full PoB engine running in browser with real calc output

## What Was Built This Session

### Engine
- Full PoB Lua engine running in-browser via wasmoon in a Web Worker
- Tree data preloaded as JSON (bypasses 10-30s Lua table parsing)
- 4 LuaJIT compat shims: string.gsub, string.format %d, timeless jewel graceful fail, tree JSON key retyping
- Two-phase import: instant XML parse for display, background engine evaluation for real calcs
- Per-skill DPS extraction, items/skills/allocated nodes from engine
- DoT breakdown (bleed/poison/ignite/impale), leech rates, ward, mana reservation

### Import/Export
- PoB code decode/encode (base64 + zlib)
- pobb.in and pastebin URL proxy API
- PoE account character import API
- XML file drag-and-drop upload
- Scoped import UI (full/tree/items/skills)
- Export PoB code to clipboard
- Shareable URLs (build in URL hash)
- 3 functional example builds
- Ctrl+I shortcut, auto-paste import

### Passive Tree
- Interactive canvas with zoom/pan/touch
- Allocated node highlighting with gold connections
- Three-tier connection styling (allocated/frontier/unallocated)
- Node search with cyan glow highlighting
- Search results dropdown with click-to-navigate
- Node tooltips with stat descriptions
- Jewel socket diamond rendering
- Mastery star node rendering
- Ascendancy node styling (golden amber)
- Class start area radial gradients
- Hover path highlighting
- Tree spec management (multiple specs)
- Zoom controls (+/-/percentage/center)
- Point counter (used/total)
- Minimap with viewport rectangle
- Undo/redo (Ctrl+Z)
- Tree reset button
- Node power heatmap

### Items/Skills/Config/Calcs
- Items tab with weapon swap, mod colors, flask toggles, socket visuals, item stat badges, copy item text, item search filter, rarity borders
- Skills tab with gem link lines, gem color coding, vaal/awakened indicators, level/quality colors, main skill indicator, click-to-set-main
- Config tab with interactive checkboxes, bandit/pantheon display, build info
- Calcs tab with DoT section, recovery section, filter highlighting, copy stats button, speed/max-hit sections

### UI/UX
- Build rename, save/export/share/new buttons
- Recent builds dropdown
- Local build saves (localStorage)
- Build comparison with stat deltas and diff view
- Dark/light theme with localStorage persistence
- Performance mode (disables animations)
- Number format (US/EU)
- Settings panel
- Notes panel with markdown editor
- Keyboard shortcuts overlay (?)
- Collapsible sidebar sections
- Sidebar toggle (show/hide)
- Loading skeleton
- Empty states with import CTA
- Error boundaries
- Tab notification badges
- Stat explanation tooltips
- Welcome hint for new users
- Dynamic document title
- Mana reservation display with overcap indicators
- PoE 1/2 version toggle
- Build edit history

### Mobile
- Mobile import in bottom nav
- Touch pinch-to-zoom, long-press to allocate
- Responsive layout

### Infrastructure
- Dockerfile + docker-compose
- GitHub Actions CI (typecheck + test + build)
- 22+ automated tests
- README.md
- Enhanced PWA with offline caching
- Lua-to-JSON tree converter script

## Architecture

```
apps/web/                    Next.js 15 (App Router, Turbopack, Tailwind 4)
  ├── app/
  │   ├── layout.tsx, page.tsx, globals.css
  │   └── api/
  │       ├── import/route.ts    Proxy for pobb.in/pastebin URL imports
  │       └── character/route.ts PoE account character API proxy
  ├── components/
  │   ├── shell/             Header, StatsSidebar, TabContent, MobileNav, ImportDialog,
  │   │                      KeyboardShortcuts, WelcomeHint, ErrorBoundary, EmptyState,
  │   │                      NotesPanel, BuildDiff, Skeleton
  │   ├── tree/              TreeCanvas, TreeSearch, TreeSpecBar, TreeMinimap,
  │   │                      tree-renderer, tree-camera, tree-spatial, tree-data,
  │   │                      NodePowerControls
  │   ├── items/             ItemsTab (with SocketVisual, flask toggles, weapon swap)
  │   ├── skills/            SkillsTab (with gem links, main skill indicator)
  │   ├── calcs/             CalcsTab, CalcSection, CalcRow
  │   ├── config/            ConfigTab (interactive, bandit/pantheon)
  │   └── settings/          SettingsPanel (theme, perf mode, number format, notes)
  ├── engine/
  │   ├── worker.ts          Web Worker (wasmoon + PoB Lua bootstrap + LuaJIT compat shims)
  │   ├── bridge.ts          Main thread <> Worker messaging with progress callbacks
  │   ├── pob-codec.ts       Re-exports from @tsc/pob-codec
  │   ├── pob-xml-parser.ts  Client-side XML parser (Phase 1 instant display)
  │   ├── types.ts           BuildStats, ItemData, SkillGroup, GemData types
  │   └── shims/             Node.js shims for esbuild (empty, url, path)
  ├── lib/
  │   └── stat-explanations.ts  Stat tooltip text map
  ├── stores/
  │   ├── build-store.ts     Build state (Zustand) with two-phase eval, saves, compare, history
  │   ├── tree-store.ts      Tree allocation, specs, undo/redo, search
  │   └── ui-store.ts        Tab, sidebar, theme, perf mode, number format
  ├── scripts/
  │   ├── build-worker.mjs   esbuild script for worker bundling
  │   └── convert-tree-lua.mjs  Converts tree.lua/sprites.lua to JSON at build time
  └── public/
      ├── data/              PoB Lua files, tree JSON, sprite atlases
      ├── manifest.json      PWA manifest
      └── sw.js              Service worker (v2 with pre-caching)

packages/
  ├── engine/                Rust WASM calc engine (stubs, not yet used)
  ├── pob-codec/             Publishable npm package (@tsc/pob-codec)
  └── pob-data/              Data fetching scripts (fetch-pob.sh, fetch-tree.sh, gen-manifest.sh)
```

## LuaJIT Compatibility Shims

| Shim | Issue | Fix |
|------|-------|-----|
| `string.format` | Lua 5.4 rejects `%d` with non-integer floats | Auto-floor numeric args for integer specifiers |
| `string.gsub` | Lua 5.4 rejects `%X` in replacement strings where X is not digit/% | Sanitize replacement strings, strip invalid `%` escapes |
| `bit` / `bit32` | LuaJIT's bit library vs Lua 5.4 native bitwise ops | Shim using `&`, `|`, `~`, `<<`, `>>` operators |
| `unpack` / `table.unpack` | Moved between Lua versions | Cross-alias both |
| `loadstring` | Renamed to `load` in Lua 5.2+ | Alias `loadstring = load` |
| `jit` | PoB checks `jit.version` | Stub with `{ version = "disabled" }` |
| Timeless Jewel LUT | `assert` crashes when binary data files missing | Graceful return of empty table |
| Tree JSON keys | dkjson parses numeric keys as strings | Post-parse `rekey_numeric` converts back to integers |

## Tested With

- Witch Occultist Lv 97 Winter Orb build (from pobb.in/gthdKM9YU2CR): 1.7M DPS, 3289 ES, 116 allocated nodes, all items/skills populated

## Known Issues

- CalcDefence.lua:2987 format edge case (non-blocking, build loads fine)
- PoE account character import shows character list but doesn't convert to PoB XML yet
- Scoped import (tree/items/skills only) is UI-only placeholder
- Example builds use minimal XML (no tree allocation or items)
- Config changes don't re-trigger engine evaluation yet
- PoE 2 support is a UI stub only
- `@tsc` npm scope likely claimed; need alternative for publishing

## Development Commands

```bash
pnpm install
pnpm data:fetch              # Download PoB Lua files + tree data
pnpm dev                      # Start dev server
node apps/web/scripts/build-worker.mjs    # Rebuild engine worker
node apps/web/scripts/convert-tree-lua.mjs # Convert tree data to JSON
pnpm test                     # Run tests
pnpm typecheck                # Type check
docker compose up --build     # Docker deployment
```

## Dev Server

Port 3003 (3000-3002 taken by other projects):
```bash
cd apps/web && npx next dev --turbopack -p 3003
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
