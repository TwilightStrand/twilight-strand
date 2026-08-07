# Rust Engine Handover

## Session summary (2026-08-07, session 2)

v2 stat pipeline: raw stat lines now flow directly to Rust for v2 parsing, preserving conditions, flags, and per-charge multipliers. New stat patterns added. 6 new StatIds.

## Lua WASM Engine (complete, production-ready)
- Replaced wasmoon (Lua 5.4) with pob-web's C/WASM driver (Lua 5.2)
- Boot: 2.3s. Eval: 4s for endgame builds
- **Matches native LuaJIT headless exactly** (ES 11050, FullDPS 122.5M on CI Occultist)
- 94% of PoB desktop (6% gap is headless vs desktop, shared with native LuaJIT)
- Files: `apps/web/engine/worker.ts`, `bridge.ts`, `scripts/build-worker.mjs`
- Deps: `@zenfs/core@1.11.4`, `@zenfs/archives@1.0.5` (replaces `wasmoon`)
- Assets (gitignored): `public/data/pob/root.zip` (56MB), `public/data/pob/driver/`

## Rust WASM Engine (ModDB complete, v2 pipeline active)

### v2 stat pipeline (new this session)
- `convertToRustInput` now sends raw stat lines via `stat_lines: string[]` instead of pre-parsing with v1
- `evaluate_build` parses stat_lines with `parse_stats_v2()` directly into ModDB
- v2 preserves: conditions (DualWielding, OnFullLife, etc.), ModFlags (ATTACK, SPELL, MELEE, weapon types), per-charge multipliers
- Legacy `modifiers` field still used for programmatic mods (support gems, uniques, flasks, charges, buffs)
- `parseStatLine` from rust-bridge.ts still used for UI components (hover tooltips, node power, etc.)

### ModDB system (`src/mod_db.rs`)
- StatId(u16): 115 interned stats (was 109), no string hashing
- ModFlags(u32): 26 bitflags matching PoB's hex layout exactly
- KeywordFlags(u32): 24 bitflags with ANY/MATCH_ALL modes
- ModTag: conditions, per-charge multipliers, per-stat scaling, thresholds, limits
- ModDB: arena storage, per-stat index, parent chain, full eval loop
- BuildState: u64 condition bitfield, charges, attributes
- evaluate_build fully migrated to ModDB (old aggregate_mods removed)

### New StatIds this session
- PhysTakenAsFire/Cold/Lightning/Chaos (109-112): wired into EHP via phys shift reduction
- ActionSpeed (113): wired into attack_speed as multiplicative factor
- StunBlockRecovery (114): parsed but not yet used in calculations

### stat_parser coverage
- **Tree nodes: 69.7%** (3785/5428 stats parse)
- **Item mods: ~65%** (123/189 on CI Occultist build, up from ~42%)
- Remaining unparsed: flask mods (immunity, instant recovery), mechanical effects (projectile count, blind), cluster jewel metadata, item metadata (Mirrored, sockets)
- Patterns added this session: phys-taken-as-element, action speed, stun/block recovery, singular charge variants (+1 to Maximum Power Charge)
- Previous session: ES without "maximum", global crit multi, combined dual-res, weapon-specific damage, attack/melee phys damage, DoT multi per element, nearby enemy resistance as pen, max charges, aura effect on self, melee/attack crit chance variants

### Calc pipeline improvements
- Phys-taken-as-element shifts reduce effective phys damage in EHP calc
- Action speed multiplies attack speed (PoB-matching behavior)
- ElementalDamage inc/more routes to fire/cold/lightning type mods
- Conversion table populated from ModDB stats (not just BuildInput fields)
- BuildState populated from input flags (charges, dual wield, fortify, etc.)
- Hardcoded ascendancy approximations removed (tree data provides correct bonuses)

### Tests: 364 pass, 0 fail. WASM: 307KB.

## What to do next

### Priority 1: Close remaining divergences
v2 pipeline is active. CI Occultist dual-engine comparison (18 divergences >5%):
- **Working well**: Fire Res matches, Str close (78 vs 69), Accuracy close (580 vs 542)
- **ES 43% (2784 vs 6526)**: missing base gear ES flat values, possibly incomplete % ES from Int
- **Int 4x overshoot (370 vs 94)**: likely double-counting "to all Attributes" from tree+items
- **Armour/Evasion near zero**: base gear armour/evasion stats aren't sent (not mod lines)
- **Block/Spell Block zero**: parser doesn't match block chance text from tree nodes
- **DPS 0.2% (2968 vs 1.56M)**: gem/skill calculation gaps (Winter Orb not fully modeled)
- **Crit Multi 188 vs 352**: missing crit multi from items/tree

### Priority 2: stat_parser remaining gaps
Focus on patterns that affect DPS/defence for the test build:
- Flask immunity/instant recovery mods (10+ lines unparsed)
- Unique item mechanical effects (projectile count, blind, freeze spread)
- The 35% remaining item mods are mostly non-stat effects

### Priority 3: Gem level scaling
All gem data in `gems.rs` is hardcoded at level 20. Needs parameterization by gem level + quality.

### Priority 4: Support gem scaling
`supports.rs` has hardcoded level-20 multipliers. Real values depend on gem level.

## Build commands
```bash
cd packages/engine && cargo test        # 364 tests
cd packages/engine && bash build.sh     # WASM + copy to public/wasm/
cd apps/web && node scripts/build-worker.mjs  # Lua worker
```

## Test build for validation
CI Occultist from pobb.in/MwTyQN55T8tE:
- Desktop PoB: FullDPS 130,203,080 / ES 11,050 / CritMulti 667%
- Lua WASM: FullDPS 122,500,791 / ES 11,050 / CritMulti 657% (94%)
- XML: `/tmp/pob-test-xml.txt`, Code: `/tmp/pob-test-code.txt`
