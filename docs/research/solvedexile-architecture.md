# SolvedExile Architecture Analysis

Reverse-engineered from the live app at `app.solvedexile.com` on 2026-08-03.
Built by Adam (Subtractem), currently in alpha. 66 supporters.

## Stack Summary

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js + Turbopack | App Router, React 19 |
| Styling | Tailwind CSS | 82 CSS custom properties, dark-theme-first |
| Calc Engine | wasmoon 1.16 | Lua 5.4 VM compiled to WebAssembly |
| State | No external state lib | React hooks + localStorage |
| Tree Rendering | Canvas 2D | Sprite-based, custom renderer |
| Backend | Supabase | Auth (email/OAuth), cloud saves, realtime subscriptions |
| Hosting | Cloudflare | CDN + WAF, 403 to bots |
| Price Data | api.poe.watch | External trade data |
| Official API | pathofexile.com | Character import |
| Static Data | data.solvedexile.com | Dedicated data CDN |
| JS Bundle | 13 MB total | 31 Turbopack chunks |
| PoB Data | ~48 MB raw / ~5 MB gz | 263 Lua files bundled as tar.gz |

## The Core Trick: PoB-in-a-Browser

SolvedExile doesn't re-implement PoB's calculation engine. It runs the **actual PoB Lua code** in-browser via WebAssembly. The pipeline:

1. On first load, download `pob-data/bundle.tar.gz` (~5 MB gzipped, 48 MB raw)
2. Unpack into a virtual filesystem inside a **Web Worker**
3. Boot `wasmoon` (Lua 5.4 compiled to WASM via Emscripten)
4. Load PoB's `HeadlessWrapper.lua` as the entry point
5. Import/parse PoB export codes, run the full calc pipeline
6. Return structured results to the main thread via `postMessage`

Source PoB version: **v2.66.2** (commit `b23da8f841e4b0bc167b0b4401ea002d7d45f807`)

This gives them exact PoB parity for free. Every mod interaction, every edge case, every calculation is identical to desktop PoB because it *is* PoB. The tradeoff: massive initial download and Lua-in-WASM execution speed.

## Key PoB Files Bundled

The heaviest files in their bundle:

```
/pob/Modules/
  ModParser.lua         658 KB   # mod text parsing (the hardest part to rewrite)
  CalcOffence.lua       345 KB   # damage calculations
  CalcDefence.lua       206 KB   # defensive calculations
  CalcPerform.lua       197 KB   # build evaluation
  CalcSections.lua      189 KB   # UI stat sections
  ConfigOptions.lua     248 KB   # configuration toggles

/pob/Data/
  stat_descriptions.lua 4.4 MB   # stat text templates
  ModCache.lua          2.4 MB   # pre-parsed mod data
  ModItemExclusive.lua  3.1 MB   # item-exclusive mods
  Gems.lua              411 KB   # all gem data
  TradeSiteStats.lua    2.5 MB   # trade stat mappings

/pob/Classes/
  CompareTab.lua        198 KB   # build comparison
  ItemsTab.lua          196 KB   # item management
  TreeTab.lua           116 KB   # tree tab logic
  Item.lua               89 KB   # item parsing
  PassiveSpec.lua        83 KB   # spec management
```

## API Endpoints

| Endpoint | Purpose | Type |
|----------|---------|------|
| `/api/evaluate` | Server-side build evaluation (fallback/heavy calc) | Internal |
| `/api/import` | Import PoB codes / account characters | Internal |
| `/api/credits-galaxy` | Supporter list with tiers | Internal |
| `/api/zorath` | Timeless jewel seed data | Internal |
| `data.solvedexile.com` | Static game data CDN | Static |
| `api.poe.watch` | Item price data | External |
| `pathofexile.com` | Official PoE API | External |
| `*.supabase.co` | Auth, cloud saves, subscriptions | Backend |

## Client-Side Storage Keys

| Key | Purpose |
|-----|---------|
| `solved_exile_build_code` | Current PoB export code (compressed base64) |
| `solved_exile_build_session_v3` | Active build state: `{saved, draft}` |
| `solved_exile_eval_cache_v3` | Cached evaluation: `{code, xml, evaluation, v}` |
| `solved_exile_snapshots` | Build history (array, observed 4 entries) |
| `solved_exile_recent_builds` | Recently opened builds list |
| `solved_exile_active_tab` | Current tab selection |
| `solved_exile_writer_tab` | Writer/editor tab state |

## UI Structure

### Tabs

| Tab ID | Label | Content |
|--------|-------|---------|
| `tab-tree` | Tree | Interactive passive tree (Canvas 2D), node power overlay (DPS/Defence/Both), Timeless jewel support, search |
| `tab-items` | Items | Equipment slots, item editor, unique browser, "Create Item" / "Paste Item", item sets, weapon swap, 5 flask slots |
| `tab-skills` | Skills | Socket groups (active + support gems), skill sets, bench crafting |
| `tab-config` | Config | Build configuration toggles (maps PoB's ConfigOptions) |
| `tab-calcs` | Calcs | Full calc breakdown: Hit Damage, Attack/Cast Rate, Crits, Accuracy, Ignite, Ailments, Skill Mechanics, Attributes, Life/Mana/ES, Resists, Armour/Evasion, EHP, Max Hit Taken, Charges |
| `tab-coach` | Settings | App settings (internally "Coach") |
| `tab-galaxy` | Galaxy | Supporter visualization; interactive star field |

### Layout

- **Header**: PoE version picker, class/level selector, build name, loadout bar, tab navigation, undo/save/login/manual buttons
- **Left sidebar**: Persistent stats panel (Offense, Attributes, Max Hit Taken, Defense, Recovery, Resistances, Mitigation)
- **Main area**: Tab content
- **Right edge**: Notes drawer, history panel (collapsible)
- **Bottom bar (mobile)**: Condensed stats + tab navigation
- **Footer**: Rotating supporter callouts, feedback button

### Design Tokens (selected)

```css
--bg-deep:       #050810    /* page background */
--bg-card:       #0d1328    /* card surfaces */
--blood:         #ff6b6b    /* negative values */
--teal:          #4fe3f7    /* energy shield, accent */
--gold:          #8ecdff    /* positive values */
--strength:      #ff4d3a    /* STR */
--dexterity:     #5cf07a    /* DEX */
--intelligence:  #7d95ff    /* INT */
--life:          #ff5c45    /* life */
--es:            #4fe3f7    /* energy shield */
--mana:          #7d95ff    /* mana */
--font-display:  "Marcellus", Georgia, serif
--font-body:     ui-sans-serif, system-ui, sans-serif
```

Theme color: `#050810` (very dark navy). Starfield background canvas animation.

## Monetization

**Philosophy**: "Core build planning will ALWAYS be free. Supporters fund the work and may see experiments early; those features will then become available to everyone else."

### Free Tier
- Full build planning (tree, items, skills, config, calcs)
- PoB import/export
- All calculations
- Shows ads

### Supporter Tier
- **Singularity**: $150 lifetime, 50 seats, never expires
- Also available via Ko-fi memberships and one-time support
- Benefits:
  - Ad-free
  - Early access to experiments (e.g. "Marginal Value" feature)
  - Cloud storage
  - Share links
  - Heavy server-side analysis (coming soon)
  - Star in Galaxy visualization

### Supporter Tiers (Galaxy)
- Nebula
- Singularity ($150 lifetime)
- Starlight
- Comet

66 supporters at time of analysis. Payment through Ko-fi.

## Marginal Value Feature

Gated behind supporter early access on the Calcs tab. Described as: "Ranks 18 levers; Life, Block, Suppression, Attack Speed, Crit (and more) by delta-EHP / delta-DPS. Each lever is injected into your build and re-evaluated by the engine. This shows the relative value of each stat without hand-testing custom modifiers."

This is a sensitivity analysis tool. It perturbs each stat individually and measures the DPS/EHP impact. A strong differentiating feature.
