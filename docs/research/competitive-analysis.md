# Competitive Analysis: Open-Source PoB Alternative

> **Update 2026-08-03**: Deep JS extraction revealed SolvedExile already has a
> **dual engine** architecture: PoB Lua via wasmoon (source of truth) *plus* their
> own Rust WASM engine (`se_wasm`) for fast interactive operations.  See
> `engine-architecture.md` for the full breakdown.

## SolvedExile Strengths to Match

- **Dual engine**: Lua for full PoB parity + Rust WASM for fast interactive evaluation
- Polished, dark-theme-first UI with starfield aesthetic
- PWA with mobile support
- Interactive passive tree with node power heatmap (DPS/Defence/Both, configurable depth + metric)
- Marginal Value sensitivity analysis (18 levers, delta-EHP / delta-DPS)
- Build snapshot/history system
- Timeless jewel support with pre-computed LUTs (split into parts for parallel loading)
- Writer tab locking via `navigator.locks` to prevent multi-tab conflicts
- Supports both PoE 1 and PoE 2 via `gameId` parameter
- Adaptive Lua GC tuning to avoid thrashing during heavy evals

## SolvedExile Weaknesses to Exploit

- **Bundle size**: 13 MB JS + 5 MB PoB data + WASM module = slow cold start
- **Dual engine complexity**: maintaining both Lua and Rust engines is a maintenance burden
- **Closed source**: Single developer risk, no community contributions
- **Price**: $150 lifetime is steep; free tier shows ads
- **PoB dependency**: still tied to PoB's Lua for full evaluation; the Rust engine handles a subset
- **No self-hosting**: Users depend on their infrastructure

## Technical Differentiation Opportunities

| Area | SolvedExile | Our Approach |
|------|-------------|-------------|
| Engine | PoB Lua via wasmoon (~slow, ~48 MB raw) | Rust WASM engine (fast, <2 MB). Keep Lua engine as validation oracle |
| Tree Render | Canvas 2D sprites | Canvas 2D or WebGL. Consider WebGPU for power overlays |
| Data | Bundle entire PoB data (~5 MB gz) | Parse PoE data files directly; lazy-load by content type |
| Backend | Supabase (proprietary hosting) | Self-hostable: Supabase or Pocketbase + Docker compose |
| Source | Closed | Open source, community-driven |
| Cost | $150 lifetime or ads | Free, self-hostable, optional hosted tier for cloud features |

## Phased Strategy

### Phase 1: Feature Parity via Pragmatic Shortcut
- Use the same wasmoon approach to get a working product fast
- Build the Next.js/SvelteKit frontend with the same tab structure
- PoB import/export from day one
- Interactive passive tree (Canvas 2D)
- Ship as open source immediately

### Phase 2: Rust Engine (parallel development)
- Implement the Rust WASM calc engine incrementally
- Start with ModParser (the hardest 658 KB to rewrite)
- Then CalcOffence (345 KB) and CalcDefence (206 KB)
- Validate every calculation against the Lua oracle
- Gradually route calculations through Rust, falling back to Lua

### Phase 3: Differentiation
- Features SolvedExile doesn't have or gates behind paywall:
  - Marginal Value / sensitivity analysis for free
  - Build comparison side-by-side
  - Community build sharing (no login required)
  - Gear upgrade suggestions
  - Leveling planner / skill progression
  - PoE 2 support (parallel game data)

### Phase 4: Ecosystem
- API for third-party tools
- Plugin system for community extensions
- Integration with poe.ninja, poe.trade, awakened poe trade
- Mobile-first responsive design (not just "works on mobile")

## Path of Building Source Reference

PoB is open source (Lua): https://github.com/PathOfBuildingCommunity/PathOfBuilding

SolvedExile pins to a specific PoB version (currently v2.66.2). They bundle the Lua files but don't modify them; they have a `HeadlessWrapper.lua` that provides browser-compatible shims for file I/O, rendering calls, and other desktop-only PoB APIs.

Key PoB modules to understand for the Rust rewrite:
- `Modules/ModParser.lua` (658 KB) - the mod text parser; converts text like "+20% increased Fire Damage" into structured mod objects
- `Modules/CalcOffence.lua` (345 KB) - damage pipeline: base damage, conversion, scaling, crit, hits per second, DoTs
- `Modules/CalcDefence.lua` (206 KB) - EHP, max hit taken, mitigation, avoidance, recovery
- `Modules/CalcPerform.lua` (197 KB) - orchestrates the full calculation
- `Classes/ModStore.lua` (29 KB) - modifier storage and retrieval
- `Classes/ModDB.lua` (11 KB) - modifier database
- `Classes/Item.lua` (89 KB) - item parsing and mod application

## Framework Choice

SolvedExile uses Next.js. For an open-source alternative, consider:

| Framework | Pros | Cons |
|-----------|------|------|
| Next.js | Same as SolvedExile, large ecosystem, SSR | Vercel lock-in risk, heavy |
| SvelteKit | Smaller bundles, simpler state, good DX | Smaller ecosystem |
| Solid Start | Fine-grained reactivity (good for stat updates) | Smallest ecosystem |
| Astro + React islands | Minimal JS by default, islands for interactive bits | More complex architecture |

Recommendation: **SvelteKit** or **Next.js**. SvelteKit gives smaller bundles and simpler state management (stores vs. hooks). Next.js gives the biggest hiring pool and ecosystem if the project grows.
