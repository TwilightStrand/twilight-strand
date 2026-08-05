# Twilight Strand Roadmap

Track progress and upcoming features. Check boxes indicate completion.

## Shipped (v0.1.0)

### Engine
- [x] PoB Lua engine in browser via wasmoon
- [x] Rust WASM engine (50k evals/sec, 139 tests)
- [x] Tree data JSON preloading
- [x] LuaJIT compat shims (gsub, format, timeless jewels)
- [x] Per-skill DPS, DoT, leech, ward, mana reservation
- [x] 15 keystones, 18 ascendancies, 25 support gems, 12 weapon bases

### Import/Export
- [x] PoB code, pobb.in, pastebin, XML file, PoE account
- [x] Export clipboard, shareable URLs, markdown, JSON
- [x] Example builds, build guides with level scrubber

### Passive Tree
- [x] Node allocation, search, tooltips, minimap, zoom, specs
- [x] Animations, hover highlighting, adjacency indicator
- [x] Node power heatmap, keystones list, class glows
- [x] Tree optimizer, pathfinder, efficiency metric

### Items & Skills
- [x] Item editor (create/edit/delete)
- [x] Skill/gem editor with autocomplete
- [x] Weapon swap, mod colors, influences, sockets
- [x] Price check via trade API
- [x] Flask toggles, item stat badges

### UI/UX
- [x] Dark/light theme, compact sidebar, bar-graph mode
- [x] Build comparison with diff view
- [x] Build score rating (S-F)
- [x] Keyboard shortcuts, welcome hint
- [x] Notes with markdown preview
- [x] Mobile touch gestures, PWA offline

### Community
- [x] Auth (GitHub + Discord OAuth)
- [x] PostgreSQL build storage
- [x] Community builds page with leaderboard
- [x] poe.ninja ladder integration

### Infrastructure
- [x] Dockerfile + docker-compose + PostgreSQL
- [x] GitHub Actions CI (171 tests)
- [x] SEO (sitemap, robots, OG meta)
- [x] Competitor analysis (7 tools)

---

## In Progress (v0.2.0)

### P0 - Critical for competitive parity
- [x] Power/Frenzy/Endurance charge integration
- [x] Wire Rust WASM into browser for real-time recalc
- [x] Full config option coverage (576 options auto-generated from PoB ConfigOptions.lua)
- [x] Watcher's Eye mod support (28 Rust mods, aura-conditional wiring in converter)
- [x] Jewel effect simulation (cluster notables resolved from generated data, fed to Rust)
- [x] Full Rust engine parity push (95+ uniques, 50+ supports, 40 keystones, expanded stat_parser with conversion/spell block/ailment avoid/gem levels)

### P1 - High value differentiators
- [x] Meta statistics from poe.ninja data (class distribution, top skills, avg stats)
- [x] Marginal value analysis (respec candidates + best-to-allocate in PowerReport)
- [x] Smart tree pathing (BFS pathfinding with travel cost, DPS/point ranking, depth selector)
- [x] Build diff between tree versions (patch comparison with stat-level diffs)
- [x] Timeless jewel search (conqueror keystones, notable radius analysis, all 5 jewel types)
- [x] Cluster jewel optimizer with real trade prices (apply to build, price check via trade API)

### P2 - Polish
- [x] Unique ranking per slot (evaluate all uniques against current build via Rust)
- [x] Crafting bench simulation (prefix/suffix/bench mods, already built)
- [x] More themes (Astral deep indigo + Nostalgia warm earth tones, original palettes)
- [x] Leveling guide for more builds (LA Deadeye, SRS Necro added to RF Jugg)
- [x] i18n (infrastructure + Chinese, Korean, Russian translations, locale picker in settings)
- [x] Community guide authoring (GuideEditor component with step editor, class/ascendancy picker)

### P3 - Future
- [ ] PoE 2 full support
- [ ] Build optimizer AI (suggest entire tree for a skill)
- [ ] Guild features (shared build library)
- [ ] Mobile native app (Capacitor/Tauri)
- [ ] Streaming integration (Twitch extension)
