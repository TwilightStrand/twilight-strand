# Competitor Analysis - August 2026

## Executive Summary

Twilight Strand Collective (TSC) enters a market with an entrenched desktop incumbent (Path of Building), a well-funded web competitor (SolvedExile), and several niche tools. Our differentiation: open source, Rust WASM speed (50k evals/sec), community features, and zero-install web delivery. We trail PoB on edge-case calc accuracy and item editing; we lead on optimization tooling, sharing, and accessibility.

GGG launched an official in-game PoE 2 build planner in patch 0.5 (May 2026), but it only reads downloaded `.build` files - it does not calculate stats or edit builds. This validates external planners as permanent fixtures in the ecosystem.

## Competitor Matrix

| Feature | TSC | PoB Desktop | SolvedExile | poe.ninja | Maxroll | PoE Planner |
|---------|-----|-------------|-------------|-----------|---------|-------------|
| Web-based | Yes | No | Yes | Yes | Yes | Yes |
| Full calc engine | Yes (Lua+Rust) | Yes (Lua) | Yes (Rust) | No | Partial | No |
| Open source | Yes | Yes | No | No | No | No |
| Self-hostable | Yes (Docker) | N/A | No | No | No | No |
| Item editor | No | Yes | Yes | No | No | No |
| Crafting sim | No | Yes | No | No | No | No |
| Price check | Yes | No | Yes | Built-in | No | No |
| Shareable URLs | Yes | No | Yes | Yes | Yes | Yes |
| Cloud saves | Yes (Postgres) | No | Paid | No | Yes | No |
| Mobile support | Yes | No | Yes | Yes | Yes | Yes |
| Build optimizer | Yes (Rust) | No | Partial | No | No | No |
| Community builds | Yes | No | No | Ladder only | Yes | No |
| Leaderboard | Yes | No | No | Ladder | No | No |
| Offline/PWA | Yes | Yes (native) | Yes | No | No | No |
| PoE 2 support | Stub | Yes | Yes | Yes | Yes | Yes |
| i18n | No | No | 11 langs | 4 langs | 10+ langs | No |

## Detailed Competitor Profiles

### 1. Path of Building (Desktop - Community Fork)

**Status:** Gold standard. ~95% market share among serious players. Community fork maintained by LocalIdentity and team. Released PoB2 for PoE 2 (Jan 2026) in partnership with Maxroll.

**Strengths:**
- Most accurate calculations (thousands of edge cases handled over 8+ years)
- Full item editor with crafting bench simulation
- Comprehensive configuration (every mechanic, every interaction)
- Offline, zero latency after initial load
- PoE 2 support launched Jan 2026

**Our gaps vs PoB:**
- [ ] Item editor (create/modify/craft items inline)
- [ ] Crafting bench simulation
- [ ] Full configuration coverage (map mods, custom modifiers, conditional mechanics)
- [ ] Edge case calc accuracy (conditional triggers, triggered skills, minion calcs)
- [ ] Charge generation modeling
- [ ] Specific jewel effect simulation (Watcher's Eye, Forbidden Flame/Flesh)
- [ ] Full cluster jewel passive tree simulation
- [ ] Animated Guardian / Spectre / Golem configuration
- [ ] Impale stacking calculator
- [ ] Multiple skill rotation DPS

**Our advantages over PoB:**
- [x] Zero-install web app (works on any device with a browser)
- [x] Shareable URLs (instant build sharing)
- [x] Community builds with leaderboard and browsing
- [x] Rust WASM engine (50k evals/sec for optimization)
- [x] Modern UI with dark/light theme, compact mode
- [x] Mobile support (touch, pinch-zoom, responsive)
- [x] PWA with offline caching
- [x] Trade price check integration
- [x] Build comparison with visual stat deltas
- [x] Cloud saves with auth (GitHub/Discord)
- [x] Build score rating (S-F grades)
- [x] Cluster jewel optimizer
- [x] Tree pathfinder (optimal route to notables)
- [x] Node power ranking at 50k/sec
- [x] Print styles / markdown export
- [x] Keyboard shortcuts overlay

### 2. SolvedExile (Web)

**Status:** Primary web competitor. Closed source. Some features behind supporter paywall. Supports PoE 1 and PoE 2 (PoE 2 tabs marked "coming soon"). Uses Rust WASM for calculations.

**Strengths:**
- Polished UI with multiple themes (Astral/Daybreak/Nostalgia)
- Smart tree pathing mode (auto-route between pinned nodes)
- Timeless jewel seed search
- Price check with corruption/ilvl/online filters
- Unique ranking per slot by build impact
- Marginal value analysis (stat sensitivity per passive)
- 11 language translations
- Guide hint pips (per-slot notes for build guides)
- Observatory/Compare mode for side-by-side builds
- Loadout management (multiple gear sets per build)

**Features we now match (from earlier gap):**
- [x] PoB code import/export
- [x] Pastebin / pobb.in URL import
- [x] PoE account character import
- [x] Interactive passive tree with zoom/pan/touch
- [x] Node power heatmap
- [x] Node search with highlighting
- [x] Stats sidebar
- [x] Items tab with weapon swap
- [x] Skills tab with socket groups
- [x] Config tab
- [x] Calcs tab with breakdown
- [x] PWA / installable
- [x] PoE 1 + PoE 2 support (stub)
- [x] Build management
- [x] Undo/redo
- [x] Upload .xml file
- [x] Example builds
- [x] Build rename
- [x] Notes panel
- [x] Ctrl+I shortcut
- [x] Tree spec management
- [x] Scoped import UI
- [x] Performance mode
- [x] Number format options
- [x] EHP in sidebar
- [x] Build comparison

**Remaining gaps vs SolvedExile:**
- [ ] Smart tree pathing (auto-route with obstacle avoidance) - we have BFS pathfinder but not smart routing
- [ ] Timeless jewel seed search
- [ ] Price check with advanced filters (corruption, ilvl, online status)
- [ ] Unique ranking per slot
- [ ] Marginal value analysis (stat sensitivity per node)
- [ ] 9 additional themes beyond dark/light
- [ ] 11 language translations
- [ ] Galaxy supporter visualization
- [ ] Guide hint pips per slot
- [ ] Item sets (New/Copy/Rename/Delete)
- [ ] Skill sets management
- [ ] Crafting bench integration

**Our advantages over SolvedExile:**
- [x] Open source (MIT license)
- [x] No paywall (all features free)
- [x] Self-hostable (Docker compose)
- [x] Rust WASM engine with benchmarked 50k evals/sec
- [x] Community leaderboard with class filters
- [x] Build score rating system
- [x] Cluster jewel optimizer with notable database
- [x] Tree pathfinder with BFS
- [x] Markdown / JSON export
- [x] Build diff view with sorted deltas
- [x] Print stylesheet
- [x] Node allocation animation
- [x] Smooth camera transitions
- [x] Auto-save with timestamp
- [x] Sidebar bar-graph mode
- [x] Pinnable stats (double-click)
- [x] Config presets (Mapping/Bossing)
- [x] Active auras list
- [x] Defensive layers summary
- [x] DPS composition bar
- [x] Stat change flash animation
- [x] PostgreSQL + community build sharing

### 3. poe.ninja Builds

**Status:** Definitive source for meta analysis. Scrapes the PoE ladder in real-time. Not a build planner; it's a statistical analysis tool.

**Strengths:**
- Real ladder data (thousands of characters)
- Population statistics (skill/item/ascendancy popularity)
- Historical trends across leagues
- DPS/life/ES distribution graphs
- Individual character inspection
- Gem link analysis
- PoE 2 builds section live

**Our gaps vs poe.ninja:**
- [ ] Real ladder data integration
- [ ] Meta statistics (skill/item popularity percentages)
- [ ] Historical build trends across leagues
- [ ] Ladder depth tracking
- [ ] Skill tree heatmap from population data
- [ ] DPS/life distribution graphs from ladder
- [ ] Automatic gear tier analysis

**Our advantages over poe.ninja:**
- [x] Full calculation engine (poe.ninja shows raw imported stats only)
- [x] Interactive tree editing and "what if" analysis
- [x] Item/skill modification and impact preview
- [x] Build creation from scratch
- [x] Config toggles that change calculated output
- [x] Cloud save and build management

**Integration opportunity:** Fetch poe.ninja build data to populate example builds and meta statistics.

### 4. Maxroll PoE / PoE 2

**Status:** Major content platform. Partnered with PoB Community Fork team for PoB2 release (Jan 2026). Has its own PoE Planner tool for both PoE 1 and PoE 2.

**Strengths:**
- Curated, expert-written build guides with leveling progression
- PoB import/export integration
- Community builds sharing platform
- Damage and defensive stat checking
- Custom config support
- Atlas tree planner
- Beginner-friendly content and tooltips
- 10+ language support

**Our gaps vs Maxroll:**
- [ ] Curated build guides with leveling progression
- [ ] Atlas tree planner
- [ ] Beginner-friendly tutorial content
- [ ] Expert-written guide infrastructure
- [ ] Content creator partnerships

**Our advantages over Maxroll:**
- [x] Full calc engine running client-side (Maxroll is partial)
- [x] Rust WASM optimization engine
- [x] Open source
- [x] Build optimizer (cluster jewels, tree pathing)
- [x] Self-hostable
- [x] No ads

### 5. Craft of Exile

**Status:** Premier crafting simulation tool. Not a build planner. Launching "Craft of Exile 2" refactor with PoE 2 support.

**Strengths:**
- Crafting probability calculation
- Mass simulation for expected outcomes
- Mod pool visualization
- Expected cost calculation per craft method
- Fossil and essence crafting support
- Completely browser-based

**Competitive position:** Different market segment. Potential integration point - link to Craft of Exile from item slots or add crafting simulation as a module.

### 6. PoE Planner (poeplanner.com)

**Status:** Lightweight passive tree planner. Supports PoE 1 and PoE 2. No calc engine.

**Strengths:**
- Clean, fast passive tree interface
- Atlas tree planner
- Equipment and skills display
- Shareable build URLs

**Our advantages:** We do everything PoE Planner does plus full calculations, items, skills, and optimization. Not a meaningful competitor.

### 7. GGG Official Build Planner (PoE 2 in-game)

**Status:** Released in PoE 2 patch 0.5 (May 2026). Read-only - imports `.build` files to highlight suggested skill paths. No stat calculation. No editing.

**Impact on us:** Validates that build planners are a permanent part of the ecosystem. GGG will not build a full calc engine ("it's not on us to decide what's good"). Community tools remain essential. Potential `.build` file format import support for TSC.

## Priority Roadmap Based on Gaps

### P0 - Must have for competitive parity with SolvedExile
1. **Item editor** - create/modify items inline, add/remove mods
2. **Full config coverage** - every PoB config option mapped and interactive
3. **Charge integration** - power/frenzy/endurance generation and display
4. **Item sets** - New/Copy/Rename/Delete for gear configurations
5. **Skill sets** - manage multiple skill configurations

### P1 - High-value differentiators
1. **Marginal value analysis** - stat sensitivity per passive node (leverage Rust speed)
2. **poe.ninja data integration** - meta stats, popular builds, ladder import
3. **Timeless jewel seed search** - iterate seeds via Rust engine
4. **Smart tree pathing** - auto-route optimizer with multi-target support
5. **PoE 2 full support** - tree, skills, items for PoE 2

### P2 - Community and content
1. **Leveling guide system** - step-by-step progression with gear checkpoints
2. **Crafting bench simulation** - integrate crafting cost estimation
3. **Build guide authoring** - let community write guides attached to builds
4. **i18n** - start with top 5 languages (EN, KR, ZH, RU, PT-BR)

### P3 - Polish and moat
1. **Unique ranking per slot** - "best helmet for this build" via Rust batch eval
2. **Advanced price check** - corruption, ilvl, online filters
3. **Additional themes** - 4-6 more color schemes
4. **.build file import** - support GGG's PoE 2 build planner format

## Our Unique Selling Points (USPs)

1. **Open source** - no vendor lock-in, community contributions, forkable
2. **Rust WASM speed** - 50k evals/sec enables optimization features that are impossible in Lua-based tools (marginal value analysis, cluster jewel search, timeless jewel enumeration)
3. **Community leaderboard** - social build sharing with rankings, class filters, DPS sorting
4. **Zero-install web app** - works everywhere, shares via URL, no download
5. **Self-hostable** - guilds and communities can run private instances
6. **Build optimizer** - cluster jewel + tree path optimization with price data integration
7. **No paywall** - every feature is free (SolvedExile gates some behind supporter tier)
8. **Dual engine validation** - Lua engine for accuracy, Rust engine for speed, comparison UI to verify

## Conclusion

TSC is feature-competitive with SolvedExile on ~80% of capabilities and offers several unique features (optimizer, leaderboard, open source, self-hosting). The main gaps are item editing, advanced price checks, and i18n. Against desktop PoB, we trade calc accuracy depth for accessibility, speed, and social features. The Rust WASM engine is our strategic moat - no competitor can match 50k evals/sec in the browser, and this enables optimization features that redefine what a build planner can do.
