# Twilight Strand Collective - Build Planner

## What this project is

A web-based Path of Exile build planner (alternative to Path of Building). The core challenge is a Rust WASM calculation engine that must match PoB's output.

## The golden rule

**The PoB Lua source code is the specification.** Every calculation in the Rust engine must be a faithful translation of the corresponding Lua code, not a reimplementation from your understanding of PoE mechanics.

The full PoB source lives at `apps/web/public/data/pob/` (gitignored, fetched at build time). Before writing or modifying any Rust calculation code, read the corresponding Lua source first.

## PoB source map

These are the files you MUST read before touching the Rust engine:

| Lua module | Lines | Rust equivalent | What it does |
|---|---|---|---|
| `Modules/CalcSetup.lua` | 1,871 | `calc_setup.rs` (planned) | Merges mods from items, tree, skills, config into ModDB |
| `Modules/CalcPerform.lua` | 3,919 | `lib.rs` (partial) | Attributes, pools, conditions, keystones, auras, charges |
| `Modules/CalcOffence.lua` | 6,139 | `lib.rs` (partial) | Per-skill DPS: damage, crit, speed, conversion, ailments |
| `Modules/CalcDefence.lua` | 3,828 | `lib.rs` (partial) | EHP, armour, evasion, block, resist, regen, leech |
| `Modules/CalcActiveSkill.lua` | 924 | `active_skill.rs` (planned) | Gem + supports -> active skill with flags and mod list |
| `Modules/CalcTriggers.lua` | 1,617 | `triggers.rs` | Trigger rate capping (CoC, CwC, Spellslinger) |
| `Modules/ModParser.lua` | 6,955 | `stat_parser.rs` (needs replacement) | English stat text -> structured mods with flags |
| `Classes/ModStore.lua` | 928 | `mod_db.rs` | EvalMod, Sum, More, Flag, Override with tag evaluation |
| `Classes/ModDB.lua` | 357 | `mod_db.rs` | Hash-map mod storage, SumInternal with flag filtering |
| `Data/Global.lua` | - | `mod_db.rs` | ModFlag and KeywordFlag hex values |
| `Data/SkillStatMap.lua` | 2,374 | `supports.rs` / gems pipeline | Internal stat IDs -> modifier objects |

### How to use the source map

1. Find the calculation you need to implement or fix
2. Locate it in the Lua source (use the line references in HANDOVER.md or grep)
3. Read the Lua carefully, including edge cases
4. Write the Rust equivalent preserving the same logic, order of operations, and edge cases
5. Test against PoB's output for that specific calculation

## Architecture

```
PoB XML (pobb.in URL)
  -> pob-xml-parser.ts    (parse XML into items, skills, tree, config)
  -> rust-converter.ts    (transform into RustBuildInput)
  -> WASM evaluate_build  (Rust engine, ~1ms)
  -> RustCalcOutput       (all stats)
  -> BuildStats           (displayed in UI)
```

### Key files

- `apps/web/engine/pob-xml-parser.ts` - XML parser with active set filtering
- `apps/web/engine/rust-converter.ts` - Converts parsed data to RustBuildInput
- `apps/web/engine/rust-bridge.ts` - WASM bridge, TypeScript types
- `apps/web/stores/build-store.ts` - Evaluation orchestration
- `packages/engine/src/lib.rs` - Main evaluate_build pipeline
- `packages/engine/src/mod_db.rs` - ModDB with StatId, ModFlags, KeywordFlags, conditions
- `packages/engine/src/stat_parser.rs` - Stat text parser (7.3K lines, needs ModParser-based replacement)
- `packages/engine/src/gems.rs` - Data-driven gem lookup from JSON
- `packages/engine/data/gems.json` - 4.2MB generated gem data (1094 gems)

### PoB's mod system (the foundation)

A PoB mod is NOT just `{stat, value, type}`. It's a rich object:

```
name: String           stat name (e.g. "FireDamage")
type: ModType          BASE / INC / MORE / FLAG / OVERRIDE / LIST
value: f64             numeric value
flags: ModFlags        Attack, Spell, Melee, Projectile, etc. (bitfield)
keywordFlags: u32      Aura, Curse, Fire, Cold, Trap, Mine, etc. (bitfield)
source: String         where the mod came from
tags: []               conditions, multipliers, per-stat, thresholds
```

When PoB queries the ModDB (e.g. "sum all increased Fire Damage for spells"), it filters by:
- `mod.type == modType`
- `band(queryFlags, mod.flags) == mod.flags` (mod's flags must be a subset of the query's)
- `MatchKeywordFlags(queryKeywords, mod.keywordFlags)`

The Rust `mod_db.rs` already has `ModFlags`, `KeywordFlags`, `Mod`, and `ModDB` with this filtering logic. The problem is that mods are created without flags (via `add_legacy()` or `stat_parser.rs`). The fix is to populate flags from PoB's ModParser data.

Flag hex values in both Rust and PoB (`Data/Global.lua`) are identical by design.

## Dev commands

```bash
pnpm dev                                    # Dev server (Vite, port 5173)
pnpm test                                   # All TS tests
cd packages/engine && cargo test --lib      # Rust tests (572)
cd packages/engine && bash build.sh         # WASM build
node apps/web/scripts/gen-gem-level-data.mjs # Regenerate gem data
```

## Data generation scripts

Scripts under `apps/web/scripts/` generate JSON data from PoB's Lua files:
- `gen-gem-level-data.mjs` - All gem stats at all levels (produces `packages/engine/data/gems.json`)
- `gen-cluster-data.mjs` - Cluster jewel notables
- `gen-unique-data.mjs` - Unique item data
- `gen-config-options.mjs` - Config checkbox options

When adding new data-driven features, write a generator script that reads the Lua source files rather than hardcoding data in Rust.

## Testing strategy

- Test intermediate values, not just final output. If DPS is wrong, check which intermediate is off (base damage? crit? speed? resistance application?)
- Use `HANDOVER.md` for known PoB reference values
- Rust tests: `cargo test --lib` (must use `--lib` due to cdylib crate type)
- The CI test build is a Winter Orb Occultist (pobb.in/MwTyQN55T8tE) with 7 item sets; simpler single-set builds are better for initial accuracy work

## Common mistakes to avoid

1. **Don't pattern-match English stat text when PoB has structured data.** PoB's ModParser.lua already maps every stat description to structured mods. Use that mapping.
2. **Don't pre-compute gear values in TypeScript.** Passing `gear_es` as a pre-computed number loses the local/global mod distinction. Item processing belongs in Rust.
3. **Don't hardcode unique/keystone/support effects.** Generate from PoB's data files.
4. **Don't skip edge cases that "probably don't matter."** PoB handles hundreds of edge cases. Each skipped case compounds the accuracy error.
5. **Don't "fix accuracy" by tweaking formulas without reading the Lua source.** Find the Lua code, understand it, translate it.

## Accuracy targets

For any test build, stats should match PoB within these tolerances:
- Life/ES/Mana: within 2%
- DPS: within 5%
- Resistances: exact match
- Crit chance/multi: within 2%

If a stat is off by more than this, the cause is almost certainly a missing or incorrect mod, not a formula error. Check the ModDB contents first.
