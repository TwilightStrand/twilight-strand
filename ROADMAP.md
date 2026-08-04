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
- [ ] Full config option coverage (match PoB Desktop)
- [ ] Power/Frenzy/Endurance charge integration
- [ ] Jewel effect simulation (regular + cluster)
- [ ] Watcher's Eye mod support
- [ ] Wire Rust WASM into browser for real-time recalc
- [ ] Full Rust engine parity with Lua (mirror phase)

### P1 - High value differentiators
- [ ] Smart tree pathing (auto-route optimizer)
- [ ] Marginal value analysis (stat sensitivity per node)
- [ ] Meta statistics from poe.ninja data
- [ ] Timeless jewel seed search
- [ ] Cluster jewel optimizer with real trade prices
- [ ] Build diff between tree versions (patch comparison)

### P2 - Polish
- [ ] Crafting bench simulation
- [ ] Unique ranking per slot (best unique for your build)
- [ ] Leveling guide for more builds (LA Deadeye, SRS Necro)
- [ ] i18n (start with Chinese, Korean, Russian)
- [ ] More themes (Astral, Nostalgia)
- [ ] Community guide authoring

### P3 - Future
- [ ] PoE 2 full support
- [ ] Build optimizer AI (suggest entire tree for a skill)
- [ ] Guild features (shared build library)
- [ ] Mobile native app (Capacitor/Tauri)
- [ ] Streaming integration (Twitch extension)
