# Data Sources and Game Data

## Tree Data

SolvedExile serves tree data as JSON at `/data/tree-{version}.json`.

Current tree version: **3.29**

Structure of `tree-3_29.json`:
```
{
  "alternate_ascendancies": ...,
  "min_x": ..., "max_x": ..., "min_y": ..., "max_y": ...,
  "jewelSlots": [...],
  "groups": {...},
  "points": ...,
  "tree": ...,
  "nodes": { ... },       // 3,397 nodes
  "classes": [...],        // 7 classes
  "constants": {...},
  "extraImages": {...},
  "sprites": {...}
}
```

Historical tree versions available:
- 3_29 (current)
- 3_29_ruthless
- 3_28, 3_28_alternate, 3_28_ruthless, 3_28_ruthless_alternate
- 3_27, 3_27_alternate, 3_27_ruthless, 3_27_ruthless_alternate
- 3_19 (legion, for timeless jewels)

Lazy-loaded tree versions are ~300 KB gzipped each.

## Tree Assets

Sprite-based rendering. Assets served from `/data/passive-skill/`:
- `group-background-3.png` - node group backgrounds
- `skills-3.jpg` - skill node icons (sprite atlas)
- `skills-disabled-3.jpg` - disabled state icons
- `mastery-3.png`, `mastery-disabled-3.png`, `mastery-connected-3.png`, `mastery-active-*` - mastery states
- `frame-3.png` - node frames
- `line-3.png` - connection lines
- `background-3.png` - tree background
- `bloodline-3.webp` - class start areas
- `ascendancy-3.webp` - ascendancy areas
- `tattoo-active-effect-3.png` - tattoo overlay

## Gem Data

`/data/gem-colors.json` - maps gem names to STR/DEX/INT colors

Full gem data lives in the PoB bundle: `/pob/Data/Gems.lua` (411 KB)

## Cluster Jewels

- `/data/cluster_skills.json` - cluster jewel notable/small passive data
- `/client-data/cluster-builder.json` - client-side cluster jewel builder config

## Timeless Jewels

- `/api/zorath` - abyss jewel seed data
- PoB bundle includes pre-computed seed data:
  - `AbyssAmanamu.bin`, `AbyssKurgal.bin`, `AbyssTecrod.bin`, `AbyssUlaman.bin`, `AbyssZorath.bin` (~3.6 MB each)
  - `BrutalRestraint.bin`, `ElegantHubris.bin`, `HeroicTragedy.bin` (~3.4-3.6 MB each)
  - `LethalPride.bin`, `MilitantFaith.bin` (~3.6 MB each)
  - `gv-seeds.bin` (51.6 MB, segmented)

## Official Data Sources

The actual game data can be extracted from:
- **PoE data files**: GGPK/bundle extraction (poe-dat-viewer, PyPoE, RePoE)
- **pathofexile.com API**: Character profiles, league data
- **PoB GitHub**: https://github.com/PathOfBuildingCommunity/PathOfBuilding
  - Already has parsed/structured Lua data files
  - Updated by community for each patch
- **RePoE**: https://github.com/brather1ng/RePoE - exported game data as JSON
- **poe-dat-viewer**: Browser-based dat file viewer

## Price Data

SolvedExile uses `api.poe.watch` for item pricing. Alternatives:
- poe.ninja API (more popular, better coverage)
- Official trade API (rate limited)
- poe2.re (for PoE 2)

## CSP (Content Security Policy)

From their response headers, the allowed connections:
```
connect-src 'self'
  https://*.supabase.co
  https://api.poe.watch
  https://www.pathofexile.com
  https://data.solvedexile.com
```

This confirms the complete list of external data sources.
