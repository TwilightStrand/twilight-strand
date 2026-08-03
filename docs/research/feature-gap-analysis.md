# Feature Gap Analysis: Twilight Strand vs SolvedExile

Audited 2026-08-03 from live app (data-testid enumeration + settings page).

## 1. Features SE has that we ARE planning to match

- PoB code import/export (base64 + zlib)
- Pastebin / pobb.in URL import
- PoE account character import (pathofexile.com)
- Interactive passive tree (Canvas 2D, zoom/pan/touch)
- Node power heatmap (Off / DPS / Defence / Both)
- Stat delta preview on node hover
- Node search with highlighting
- Stats sidebar (Offence, Attributes, Max Hit, Defence, Recovery, Resistances, Mitigation)
- Items tab with all 15 equipment slots + 5 flasks + weapon swap (Set I/II)
- Item sets (New / Copy / Rename / Delete)
- Skills tab with socket groups
- Skill sets (New / Copy / Rename / Delete)
- Config tab (general, enemy stats, combat, map mods, custom modifiers)
- Calcs tab with full breakdown
- PWA / installable app
- PoE 1 + PoE 2 support (version-route-picker)
- Build management (local saves, recent builds)
- Undo/redo (header-undo-button)

## 2. Features SE has that we are NOT planning (gaps to consider)

### High priority (should add to plan)
- **Loadouts** (`build-loadout-bar`, `build-loadout-manage`, `build-loadout-select`): multiple loadout variants within a single build
- **Scoped import** (Full build / Items only / Skills only / Tree only): import subsets, not just full builds
- **Upload .xml file**: drag-and-drop or file picker for PoB XML
- **Example builds**: 18 pre-loaded builds for new users to explore
- **Build rename** (`build-file-name`): editable build name in header
- **Notes panel** (`notes-drawer-tab`, markdown + PoB modes, preview toggle): per-build notes with markdown
- **History panel** (`history-collapsed-tab`, `history-mobile-tab`): build edit history / undo timeline
- **Keyboard shortcut: Ctrl+I** to open import dialog
- **Tree spec management** (`tree-spec-bar`, `tree-spec-select`, `tree-spec-bar-toggle`): multiple tree specs per build
- **Bench/crafting** (`loadout-view-bench`): crafting bench integration on items tab

### Medium priority
- **Pathfinder tree pathing mode** (`settings-pathing-mode-smart`): auto-routes between pinned destinations with obstacle avoidance
- **Timeless jewel hunt** (`timeless-hunt-toggle`): search for optimal timeless jewel seeds
- **Price check integration** (`settings-pricecheck-*`): trade search with corruption, ilvl, online filters
- **Unique ranking** (`rank-slot-uniques`): rank uniques for a given slot by build impact
- **Marginal Value** (`marginal-perk-callout`): stat sensitivity analysis (we plan this but it's not in Phase 1 tasks)
- **Guide hint pips** (`guide-hint-pip`): per-slot guide notes for build guides

### Low priority (nice to have)
- **Multiple themes** (Astral / Daybreak / Nostalgia): we have dark only
- **Accent color picker** (12 options: cyan, ember, gold, rose, etc.)
- **Language selection** (11 languages): i18n support
- **Number format options** (US / EU / EU-space)
- **Performance mode** toggle: disables animation for slower devices
- **Galaxy supporter visualization**: the star field for supporters
- **"Tap for node info" touch mode**: mobile tap shows details panel vs direct toggle
- **EHP in sidebar toggle**: optional effective hit pool rows
- **Observatory / Compare** (`OBSERVATORY`, `COMPARE` in builds panel): build comparison view
- **Cloud builds** (supporter feature): sync across devices

## 3. Features we ARE planning that SE does NOT have (advantages)

- **Open source**: community contributions, forks, self-hosting
- **No paywall**: all features free (Marginal Value, cloud saves)
- **Self-hostable**: Docker compose deployment
- **Rust WASM engine**: faster than Lua-in-WASM for interactive ops
- **No ads**: completely ad-free
- **Shareable URLs without login**: build state in URL hash
- **Community build sharing**: browse and share without accounts

## Recommended additions to Phase 1

Based on this audit, these SE features are user-facing and expected:

1. **Loadouts** - users switching between leveling/mapping/bossing gear sets
2. **Scoped import** - "import just the tree from this code" is common
3. **Example builds** - critical for onboarding; without them, an empty app feels broken
4. **Build rename** - basic UX expectation
5. **Notes panel** - power users annotate builds heavily
6. **Ctrl+I shortcut** - muscle memory for SE users switching to us
7. **Upload .xml** - many users have .xml files saved locally
8. **Tree spec management** - multiple specs per build is a PoB standard
