# Spec: Twilight Strand Collective - Build Planner

**Org:** Twilight Strand Collective (`twilight-strand-collective` on GitHub)
**Repo:** `twilight-strand-collective/build`
**Scope:** The build planner is the first project. The org will host additional PoE tools (atlas planner, etc.) over time.

## Objective

Build an open-source, web-based alternative to Path of Building and SolvedExile. The app lets players import PoB build codes, view and edit passive trees, items, skills, and configuration, and get accurate DPS/defence calculations for both PoE 1 and PoE 2, all in the browser with no download.

**Users:** PoE players who use Path of Building for theorycrafting, but want a web-based tool that's free, open, and not gated behind a paywall.

**Success looks like:** A user can paste a PoB code and within seconds see their full build: interactive passive tree, stat sidebar, items, skills, and calculation breakdowns. Feature parity with SolvedExile's free tier, with the Marginal Value / sensitivity analysis available to everyone for free.

## Architecture Overview

Dual-engine architecture (matching SolvedExile's proven approach):

```
Browser (Next.js)
  ├── React UI (stats, items, skills, config, calcs)
  ├── WebGL passive tree renderer
  └── Web Worker
      ├── wasmoon (Lua 5.4 WASM) ← runs PoB Lua code (Phase 1, source of truth)
      └── Rust WASM engine ← replaces Lua incrementally (Phase 2+)
```

### Phase 1: Ship with PoB Lua via wasmoon
- Bundle PoB's Lua files (MIT licensed, ~5 MB gzipped)
- Run in Web Worker via wasmoon 1.16.0
- HeadlessWrapper shims for browser environment
- Full calculation parity with desktop PoB
- Both PoE 1 and PoE 2 game data from day one
- PWA with service worker for offline/instant repeat visits

### Phase 2: Rust WASM engine (top-down approach)
- Rust crate compiled to WASM via wasm-bindgen + tsify
- Start with `evaluate_build_xml` as a black box (full evaluator, top-down)
- Get end-to-end working, then optimize internals incrementally
- Validate every calculation against Lua oracle
- Target: 43x faster than Lua-in-WASM for compute paths

### Phase 3: Feature differentiation
- Marginal Value sensitivity analysis (free for everyone)
- Build comparison
- Community sharing without login
- Gem/unique ranking and suggestions

## Tech Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Framework | Next.js (App Router) | 15.x | Matches SE, large ecosystem, SSR for share pages |
| Language | TypeScript | 5.x | Strict mode |
| Styling | Tailwind CSS | 4.x | Utility-first, matches SE approach |
| State | Zustand | 5.x | Lightweight, works well with Web Workers |
| Tree Render | WebGL (via regl or raw) | native | Better perf for heatmaps, zoom/pan, large node counts |
| Lua VM | wasmoon | 1.16.0 | Runs PoB Lua in browser, production-proven |
| Rust Engine | wasm-bindgen + tsify | 0.2.120 / 0.4.5 | Typed WASM API boundary |
| Rust Toolchain | Rust stable | 1.93+ | Target: wasm32-unknown-unknown |
| Backend | Supabase | latest | Auth, cloud saves, realtime (self-hostable) |
| Hosting | Cloudflare Pages | - | CDN, edge functions, free tier |
| Package Manager | pnpm | 10.x | Fast, strict |
| Monorepo | Turborepo | latest | Manage web + rust-engine packages |

## Commands

```bash
# Development
pnpm dev                    # Start Next.js dev server
pnpm dev:worker             # Build worker with watch mode

# Rust engine
cd packages/engine
cargo build --target wasm32-unknown-unknown --release
wasm-pack build --target web --out-dir ../../apps/web/public/wasm

# Testing
pnpm test                   # Vitest unit tests
pnpm test:e2e               # Playwright E2E
cargo test                  # Rust engine unit tests
pnpm test:oracle            # Run Lua vs Rust comparison tests

# Build & Deploy
pnpm build                  # Production build
pnpm lint                   # ESLint + Biome
pnpm typecheck              # tsc --noEmit
```

## Project Structure

```
open-exile/
├── apps/
│   └── web/                        # Next.js application
│       ├── app/                    # App Router pages
│       │   ├── layout.tsx
│       │   ├── page.tsx            # Main build planner
│       │   └── share/[code]/       # Shareable build URLs
│       ├── components/
│       │   ├── tree/               # Passive tree WebGL renderer
│       │   │   ├── TreeCanvas.tsx
│       │   │   ├── tree-renderer.ts    # WebGL drawing pipeline
│       │   │   ├── tree-camera.ts      # Zoom/pan/touch handling
│       │   │   ├── tree-sprites.ts     # Sprite atlas + texture loading
│       │   │   ├── tree-spatial.ts     # Spatial grid for hit testing
│       │   │   └── tree-shaders.ts     # GLSL shaders (nodes, heatmap, connections)
│       │   ├── stats/              # Stats sidebar
│       │   ├── items/              # Items tab
│       │   ├── skills/             # Skills tab
│       │   ├── config/             # Config tab
│       │   ├── calcs/              # Calculations tab
│       │   └── shell/              # App shell, header, tabs, layout
│       ├── engine/
│       │   ├── worker.ts           # Web Worker entry point
│       │   ├── bridge.ts           # Main thread ↔ Worker messaging
│       │   ├── pob-codec.ts        # PoB code encode/decode (base64+zlib)
│       │   ├── lua-shims.ts        # HeadlessWrapper Lua shim generation
│       │   └── types.ts            # BuildStats, Item, Skill types
│       ├── stores/                 # Zustand stores
│       │   ├── build-store.ts      # Current build state
│       │   ├── tree-store.ts       # Tree view state (zoom, selection)
│       │   └── ui-store.ts         # UI state (active tab, panels)
│       ├── data/                   # Static game data
│       │   ├── tree/               # Passive tree JSON + sprites
│       │   └── pob/                # PoB Lua bundle
│       └── public/
│           └── wasm/               # Rust engine WASM output
│
├── packages/
│   ├── engine/                     # Rust WASM calculation engine
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── lib.rs              # wasm-bindgen exports
│   │   │   ├── evaluator.rs        # Build evaluation pipeline
│   │   │   ├── mod_parser.rs       # Mod text parser
│   │   │   ├── calc_offence.rs     # Damage calculations
│   │   │   ├── calc_defence.rs     # Defence calculations
│   │   │   ├── tree.rs             # Passive tree logic
│   │   │   ├── items.rs            # Item parsing
│   │   │   ├── skills.rs           # Skill/gem handling
│   │   │   └── types.rs            # Shared types (BuildStats, etc.)
│   │   └── tests/
│   │       └── oracle/             # Lua vs Rust comparison tests
│   │
│   └── pob-data/                   # PoB data bundling scripts
│       ├── fetch.sh                # Download PoB Lua files from GitHub
│       ├── bundle.ts               # Pack into tar.gz
│       └── manifest.ts             # Generate manifest.json
│
├── SPEC.md
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

## Code Style

TypeScript strict mode. No `any` or `unknown` for API types; narrow everything.

```typescript
// Store pattern (Zustand)
interface BuildState {
  code: string | null;
  stats: BuildStats | null;
  loading: boolean;
  importBuild: (code: string) => Promise<void>;
}

export const useBuildStore = create<BuildState>((set, get) => ({
  code: null,
  stats: null,
  loading: false,
  async importBuild(code: string) {
    set({ loading: true });
    const xml = decodePobCode(code);
    const stats = await engineBridge.evaluate(xml);
    set({ code, stats, loading: false });
  },
}));

// Engine bridge (typed worker messaging)
type EngineRequest =
  | { type: "evaluate"; xml: string }
  | { type: "nodepower"; opts: NodePowerOpts }
  | { type: "preview"; currentNodes: number[]; proposedNodes: number[] };

type EngineResponse =
  | { type: "evaluated"; stats: BuildStats }
  | { type: "nodepower"; result: NodePowerResult }
  | { type: "preview"; delta: StatDelta };
```

Rust: standard formatting via `rustfmt`, clippy warnings as errors.

```rust
use wasm_bindgen::prelude::*;
use tsify::Tsify;
use serde::{Serialize, Deserialize};

#[derive(Tsify, Serialize, Deserialize)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct BuildStats {
    pub total_dps: f64,
    pub combined_dps: f64,
    pub total_ehp: f64,
    pub life: f64,
    pub energy_shield: f64,
    pub mana: f64,
    // ... ~60 fields matching PoB output
}

#[wasm_bindgen]
pub fn evaluate_build_xml(xml: &str) -> Result<JsValue, JsError> {
    let stats = engine::evaluate(xml)?;
    Ok(serde_wasm_bindgen::to_value(&stats)?)
}
```

## Testing Strategy

| Level | Framework | Location | Scope |
|-------|-----------|----------|-------|
| Unit (TS) | Vitest | `*.test.ts` colocated | Components, stores, codec, bridge |
| Unit (Rust) | cargo test | `packages/engine/tests/` | Calc functions, mod parser, tree logic |
| Oracle | Custom harness | `packages/engine/tests/oracle/` | Lua vs Rust output comparison for sample builds |
| E2E | Playwright | `apps/web/e2e/` | Import flow, tree interaction, tab navigation |
| Visual | Playwright screenshots | `apps/web/e2e/` | Tree rendering, stat display |

Oracle tests are the most important for the Rust engine: take a set of real PoB build codes, evaluate them through both Lua and Rust engines, and assert that key stats match within a tolerance (0.01% for DPS, exact for integer stats like life/mana).

## Data Pipeline

### PoB Lua Files
```
GitHub (PathOfBuildingCommunity/PathOfBuilding)
  → fetch.sh downloads specific tag (e.g. v2.66.2)
  → bundle.ts packs into tar.gz with manifest
  → Deployed to /data/pob/ as static assets
```

### Passive Tree Data
```
GGG passive tree JSON (from PoB or poecdn)
  → Processed into tree-{version}.json
  → Sprite atlases downloaded and served from /data/passive-skill/
```

### Game Data Updates
When a new PoE patch drops:
1. PoB Community updates their repo (usually within hours)
2. We run `pnpm data:update` to fetch new tag
3. Rebuild and deploy

## UI Tabs

Matching SolvedExile's tab structure for Phase 1:

| Tab | Content | Key Interactions |
|-----|---------|-----------------|
| Tree | Interactive passive tree canvas | Click to allocate/deallocate, hover for stat preview, node power heatmap, search, zoom/pan |
| Items | Equipment slots + item editor | Select slot, browse uniques, create/paste items, item sets |
| Skills | Socket groups | Add/remove groups, select active + support gems, skill sets |
| Config | Build configuration | Toggle options (enemy type, charges, flasks, etc.) |
| Calcs | Calculation breakdowns | Hit Damage, Crits, Accuracy, Ailments, Defence, EHP, Charges |
| Settings | App preferences | Theme, display options |

### Layout
- **Header:** Game version, class/level, build name, tab navigation, import/export
- **Left sidebar:** Persistent stats (Offence, Attributes, Max Hit, Defence, Recovery, Resistances, Mitigation)
- **Main area:** Active tab content
- **Bottom bar (mobile):** Condensed stats + tab navigation

## Key Features (Phase 1)

### Import/Export
- Paste PoB build codes (base64 + zlib + XML)
- Import from pastebin/pobb.in URLs
- Import from pathofexile.com character profile
- Export PoB code for sharing
- Shareable URLs (build state encoded in URL)

### Passive Tree
- Canvas 2D renderer with sprite atlases
- Smooth zoom (exponential, cursor-centered) and pan (with momentum)
- Touch support (pinch zoom, two-finger pan)
- Node power heatmap (DPS / Defence / Both)
- Node search with highlighting
- Stat delta preview on hover
- Class/ascendancy selection

### Calculations
- Full PoB-parity DPS/defence calculations via Lua engine
- Stat sidebar with live updates
- Detailed calculation breakdowns in Calcs tab
- Marginal Value sensitivity analysis (free, not paywalled)

### Build Management
- Local storage for builds (no account needed)
- Build history / snapshots
- Multiple loadouts

## Boundaries

### Always
- Run `pnpm typecheck` and `pnpm test` before commits
- Validate PoB codes on import (reject malformed input)
- Keep the Lua engine as oracle for Rust engine development
- Ship open source from day one
- All features free; no paywalled tiers

### Ask First
- Adding new dependencies
- Database schema changes
- Changes to the engine bridge protocol
- New data sources or external API integrations

### Never
- Commit secrets, API keys, or Supabase credentials
- Ship a Rust engine calculation without oracle validation
- Gate features behind payment
- Make the app dependent on a single hosting provider

## Success Criteria

### Phase 1 (MVP)
- [ ] User can paste a PoB code and see the full passive tree within 5 seconds
- [ ] All 7 class starting positions render correctly
- [ ] Stats sidebar shows correct Life, ES, Mana, DPS, resistances (matching PoB output)
- [ ] Items tab shows all equipped items with correct mods
- [ ] Skills tab shows all socket groups with correct gems
- [ ] Calcs tab shows full calculation breakdown
- [ ] Node power heatmap works for DPS/Defence/Both
- [ ] Works on mobile (responsive layout, touch tree interaction)
- [ ] Total JS bundle < 3 MB (excluding PoB data)
- [ ] First meaningful paint < 3 seconds on 4G
- [ ] PoB data lazy-loaded after initial render

### Phase 2 (Rust Engine)
- [ ] Rust engine can evaluate a build from XML
- [ ] Oracle tests pass for 50+ real builds (DPS within 0.01%, integers exact)
- [ ] Node power sweep runs via Rust engine
- [ ] evaluate_delta works for tree hover previews
- [ ] WASM binary < 5 MB

### Phase 3 (Differentiation)
- [ ] Marginal Value sensitivity analysis working (free)
- [ ] Build comparison side-by-side
- [ ] Shareable URLs with no login
- [ ] Gem/unique ranking suggestions
- [ ] Community build list

## Resolved Decisions

| Question | Decision |
|----------|----------|
| Project name | Twilight Strand Collective / `twilight-strand-collective/build` |
| Monorepo vs separate | Monorepo (Turborepo) |
| PoE 2 support | Both PoE 1 and PoE 2 from day one |
| PWA / Offline | Yes, PWA with service worker in Phase 1 |
| Tree renderer | WebGL from the start |
| Rust engine approach | Top-down: full evaluator first, then optimize internals |

## Open Questions

1. **Data hosting** - Static assets (PoB bundle, tree sprites) are ~50 MB. CDN cost model for a free open-source project? Cloudflare Pages has a generous free tier.
2. **WebGL library** - Raw WebGL2, regl (thin wrapper), or Three.js (overkill but familiar)? Recommendation: regl or raw WebGL2 for the sprite-based tree renderer.
3. **PoE 2 tree data** - Where does PoE 2 passive tree data come from? PoB Community may not have full PoE 2 support yet. Need to check poe2kit and community sources.
4. **License choice** - MIT (maximally permissive) or AGPL (forces derivatives to stay open)? MIT matches PoB; AGPL prevents someone from closing the fork.
