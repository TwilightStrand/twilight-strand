# Rust Engine Handover

## Last updated: 2026-08-08

## Lua WASM Engine (production-ready)

- pob-web C/WASM driver (Lua 5.2), boots in 2.3s, evals in 4s
- Matches native LuaJIT headless exactly (ES 11050, FullDPS 122.5M on CI Occultist)
- 94% of PoB desktop (6% gap is headless vs desktop, shared with native LuaJIT)
- Files: `apps/web/engine/worker.ts`, `bridge.ts`, `scripts/build-worker.mjs`
- Assets (gitignored): `public/data/pob/root.zip` (56MB), `public/data/pob/driver/`

## Rust WASM Engine

### Size and shape

- **15.7K lines** of Rust across 19 source files
- **601 tests**, all passing
- **494KB WASM** output after `wasm-opt -Os`
- **497 StatIds** (0-496) defined via `define_stats!` macro in `mod_db.rs`

### ModDB system (`src/mod_db.rs`, 1756 lines)

- `StatId(u16)`: 497 interned stats, no string hashing at runtime
- `ModFlags(u32)`: 24 bitflags (attack/spell/melee/weapon types) matching PoB's hex layout
- `KeywordFlags(u32)`: 23 bitflags with ANY/MATCH_ALL modes
- `ModType`: Base, Increased, More, Override, Flag
- `ModTag`: Condition (26 conditions), Multiplier (10 types), PerStat, StatThreshold, SkillType, SkillId, Limit
- `ModDB`: arena Vec storage, per-stat index (`Vec<Vec<u32>>`), parent chain, full eval loop
- `BuildState`: u64 condition bitfield, charge counts, attribute values, weapon type
- `SkillCfg`: flags + keyflags + skill_id for filtering
- Convenience: `calc()`, `buckets()`, `has_flag()`, `get_override()`, `from_legacy_modifiers()`

### stat_parser (`src/stat_parser.rs`, 7109 lines)

Table-driven parser: `StatRule` structs with suffix matching, extract modes (Value/Pct/PctValue/DamageRange), and mod output type.

- **100% tree stat coverage** (all unique lines in tree-3_29.json parse)
- **100% unique item mod coverage** (all lines in tests/unique_mods.txt parse)
- Supports: range notation `(X-Y)` midpoint, conditions, per-charge multipliers, ModFlags, KeywordFlags
- Two entry points: `parse_stat_line()` (returns legacy `Vec<Modifier>`) and `parse_stats_v2()` (returns `Vec<mod_db::Mod>` with full condition/flag data)

### Calc pipeline (`src/lib.rs`, evaluate_build)

`BuildInput` -> `CalcOutput` pipeline:

1. **Attributes**: class base + flat/inc/more from ModDB, feeds into BuildState
2. **Pools**: Life (38 + level*12 + str/2), ES (gear_es + flat, inc includes int/5), Mana (34 + level*6 + int/2)
3. **Defences**: Armour/Evasion from gear + str/dex bonuses, block from gear + mods (capped 75%), suppression
4. **Resistances**: flat sum - 60 kitava penalty, capped at max res (75 + max res mods)
5. **DPS**: damage.rs conversion pipeline with per-type mods, global+tag-based inc/more, crit, speed
6. **Ailments**: bleed (phys), poison (phys+chaos), ignite (fire) with Crimson Dance support
7. **Triggers**: Cast on Crit, Spellslinger, CWDT rate capping
8. **Minions**: separate base DPS with minion damage/speed scaling
9. **Impale**: chance * stacks * 10% * effect * res_mult
10. **Regen/Leech**: life/mana/ES regen, leech capped at 20% of pool
11. **EHP**: (pool + ward + ES) / damage_taken / block / evasion / suppression, with MoM and phys-taken-as-element

### Supporting modules

| File | Lines | Purpose |
|------|-------|---------|
| `damage.rs` | 505 | DamageSet, ConversionTable, DamageModifiers, calc_hit_dps, bleed/poison/ignite |
| `gems.rs` | 332 | Hardcoded level-20 gem data (base damage, cast time, crit, tags, effectiveness) |
| `supports.rs` | 328 | Hardcoded level-20 support gem modifier lists |
| `keystones.rs` | 328 | Keystone passive effects (CI, EO, RT, Acrobatics, etc.) |
| `ascendancy.rs` | 303 | Class base stats, ascendancy name lookup |
| `uniques.rs` | 614 | Hardcoded unique item effects |
| `weapons.rs` | 136 | Weapon base lookup and DPS calc |
| `triggers.rs` | 238 | Trigger type detection and rate calculation |
| `node_power.rs` | 188 | rank_nodes: evaluate DPS/EHP delta per tree node |
| `pathfinder.rs` | 173 | Shortest-path tree allocation helper |
| `minions.rs` | 97 | Minion base DPS and scaling |
| `flasks.rs` | 182 | Flask mod lookup and charge scaling |
| `watchers_eye.rs` | 143 | Watcher's Eye aura-conditional mod lookup |
| `bench_harness.rs` | 864 | Benchmark test utilities |
| `integration_tests.rs` | 1237 | Full-pipeline integration tests + dual-engine comparison |
| `snapshot_tests.rs` | 202 | Snapshot comparison tests |

### v2 stat pipeline

- `convertToRustInput` (TypeScript) sends raw stat lines via `stat_lines: string[]`
- `evaluate_build` parses them with `parse_stats_v2()` directly into ModDB, preserving conditions/flags/multipliers
- Legacy `modifiers` field still used for programmatic mods (support gems, uniques, flasks, charges, buffs)
- `parseStatLine` from rust-bridge.ts still used for UI components (hover tooltips, node power)

### Known divergences from Lua engine

Last validated against CI Occultist (pobb.in/MwTyQN55T8tE), 2026-08-08:

Lua WASM reference: FullDPS 122,500,791 / ES 11,050 / CritMulti 657%

| Stat | Rust (proxy) | Lua WASM | Rust/Lua | Root cause |
|------|-------------|----------|----------|------------|
| ES | 3,168 | 11,050 | 28.7% | No gear_es in proxy input; real build has ~1500+ base ES from gear |
| FullDPS | 0 | 122,500,791 | 0% | Vortex not in gems.rs; cold DoT pipeline not implemented |
| CritMulti | 210% | 657% | 32.0% | Proxy has only +60 flat crit multi; real build has ~500+ from tree/items |
| Life | 1 | 1 | MATCH | CI keystone working correctly |
| Mana | 708 | ~700 | MATCH | Formula correct (34 + 93*6 + 116) |
| Str | 14 | 14 | MATCH | No str mods in build |
| Dex | 14 | 14 | MATCH | No dex mods in build |
| Int | 232 | ~300+ | PARTIAL | Proxy uses +200 flat; real build has more from tree |
| Resistances | 75/75/75/75 | 75/75/75/75 | MATCH | Kitava penalty and CI chaos res correct |
| Armour | 2 | ~0 | MATCH | No armour gear on ES build |
| Evasion | 2 | ~0 | MATCH | No evasion gear on ES build |

Stats that work correctly in the proxy:
- Life/ES pool selection (CI sets life=1, ES becomes primary)
- Resistance calculation with Kitava penalty and cap
- Chaos Inoculation maxing chaos res
- Attribute calculation (base + flat mods)
- Int-to-ES percentage bonus (int/5 as % increased)
- Mana formula (base + level scaling + int/2)

Blocking gaps (largest impact first):
1. **DPS: 0%** - Vortex (cold DoT) has no gem entry; DoT DPS pipeline missing for cold spells
2. **ES: 28.7%** - Proxy input has no gear_es; real build needs gear import
3. **CritMulti: 32%** - Proxy input has minimal crit multi; real build needs tree/item crit multi import

### What to do next

**Priority 1: Gem level scaling**
All gem data in `gems.rs` is hardcoded at level 20. Needs parameterization by gem level + quality. Same for `supports.rs`.

**Priority 2: Close dual-engine divergences**
Run both engines on the CI Occultist build, compare stat-by-stat, fix the remaining gaps (ES, Int, DPS).

**Priority 3: Real skill system**
Current approach picks a single main_skill_id and applies gem tags. Needs socket group parsing with linked support gems applying their modifiers to the correct skill.

**Priority 4: Optimization features**
Once Rust matches Lua output, use the speed advantage (~sub-millisecond evals) for:
- Optimal cluster jewel search with price data
- Real-time node toggling with instant stat recalc
- Batch evaluation of tree variations

## Web App

Migrated from Next.js to TanStack Start (React Router + SSR). Auth wired up with @auth/core (GitHub/Discord OAuth).

Routes: `/` (home), `/build/:id` (build viewer), `/community`, API routes, sitemap, robots.txt.

## Build commands

```bash
cd packages/engine && cargo test        # 601 tests
cd packages/engine && bash build.sh     # WASM + copy to public/wasm/ (494KB)
cd apps/web && node scripts/build-worker.mjs  # Lua worker
pnpm dev                                 # Full dev server
```

## Test build for validation

CI Occultist from pobb.in/MwTyQN55T8tE:
- Desktop PoB: FullDPS 130,203,080 / ES 11,050 / CritMulti 667%
- Lua WASM: FullDPS 122,500,791 / ES 11,050 / CritMulti 657% (94%)
