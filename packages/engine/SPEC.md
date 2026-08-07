# Spec: Conditional Modifier System

## Objective

Replace the Rust engine's flat `Modifier { stat: String, value: f64, mod_type: String }` with a conditional modifier system that matches PoB's ModDB semantics. The current system applies every mod unconditionally and uses string comparison for stat names. The new system uses interned stat IDs, bitflag filtering, and compact condition evaluation to produce identical results to PoB while maintaining 300k+ evals/sec throughput.

## Tech Stack

- Rust 2024 edition, wasm-bindgen 0.2.120, serde 1, tsify-next 0.5
- New dep: `bitflags` crate (zero-cost abstractions over integer bitflags)
- Build: `cargo test` / `bash build.sh` (wasm-pack)

## Architecture

### Mod struct (40 bytes, cache-line friendly)

```rust
struct Mod {
    stat:     StatId,        // u16 - interned stat name
    mod_type: ModType,       // u8 enum: Base|Inc|More|Override|Flag
    _pad:     u8,
    flags:    ModFlags,      // u32 bitflags - attack/spell/weapon context
    keyflags: KeywordFlags,  // u32 bitflags - skill tags
    value:    f64,           // the numeric value
    tag1:     ModTag,        // condition/scaler (16 bytes)
    tag2:     ModTag,        // second condition (16 bytes) - covers 99% of mods
}
// Total: 2 + 1 + 1 + 4 + 4 + 8 + 16 + 16 = 52 bytes
// Could pack tighter but clarity wins at this scale
```

### StatId (u16, compile-time interned)

~400 stat names known at compile time. A `match` block maps `&str -> StatId`. No heap allocation, no hashing at runtime.

```rust
#[derive(Copy, Clone, Eq, PartialEq, Hash)]
struct StatId(u16);

impl StatId {
    const LIFE: StatId = StatId(0);
    const ENERGY_SHIELD: StatId = StatId(1);
    const MANA: StatId = StatId(2);
    const DAMAGE: StatId = StatId(3);
    // ... ~400 total, generated or hand-written
    fn from_str(s: &str) -> Option<StatId> { /* match block */ }
}
```

### ModFlags (u32, matching PoB's ModFlag exactly)

```rust
bitflags! {
    struct ModFlags: u32 {
        const ATTACK       = 0x00_0001;
        const SPELL        = 0x00_0002;
        const HIT          = 0x00_0004;
        const DOT          = 0x00_0008;
        const CAST         = 0x00_0010;
        const MELEE        = 0x00_0100;
        const AREA         = 0x00_0200;
        const PROJECTILE   = 0x00_0400;
        const AILMENT      = 0x00_0800;
        const MELEE_HIT    = 0x00_1000;
        const WEAPON       = 0x00_2000;
        const AXE          = 0x01_0000;
        const BOW          = 0x02_0000;
        const CLAW         = 0x04_0000;
        const DAGGER       = 0x08_0000;
        const MACE         = 0x10_0000;
        const STAFF        = 0x20_0000;
        const SWORD        = 0x40_0000;
        const WAND         = 0x80_0000;
        const UNARMED      = 0x0100_0000;
        const WEAPON_MELEE = 0x0400_0000;
        const WEAPON_RANGED= 0x0800_0000;
        const WEAPON_1H    = 0x1000_0000;
        const WEAPON_2H    = 0x2000_0000;
    }
}
```

Match rule: `(mod.flags & cfg.flags) == mod.flags` (all mod flags present in config).

### KeywordFlags (u32, matching PoB's KeywordFlag)

```rust
bitflags! {
    struct KeywordFlags: u32 {
        const AURA      = 0x0000_0001;
        const CURSE     = 0x0000_0002;
        const WARCRY    = 0x0000_0004;
        const MOVEMENT  = 0x0000_0008;
        const PHYSICAL  = 0x0000_0010;
        const FIRE      = 0x0000_0020;
        const COLD      = 0x0000_0040;
        const LIGHTNING  = 0x0000_0080;
        const CHAOS     = 0x0000_0100;
        const VAAL      = 0x0000_0200;
        const BOW       = 0x0000_0400;
        const TRAP      = 0x0000_1000;
        const MINE      = 0x0000_2000;
        const TOTEM     = 0x0000_4000;
        const MINION    = 0x0000_8000;
        const ATTACK    = 0x0001_0000;
        const SPELL     = 0x0002_0000;
        const HIT       = 0x0004_0000;
        const AILMENT   = 0x0008_0000;
        const BRAND     = 0x0010_0000;
        const POISON    = 0x0020_0000;
        const BLEED     = 0x0040_0000;
        const IGNITE    = 0x0080_0000;
        const MATCH_ALL = 0x4000_0000;
    }
}
```

Match rule: if MATCH_ALL set, `(cfg & mod) == mod`; otherwise `(cfg & mod) != 0` or `mod == 0`.

### ModTag: condition/scaler (16 bytes, inline)

PoB mods carry 0-N "tags" that gate or scale the value. We support up to 2 tags per mod (covers >99% of real mods). Each tag is a discriminated union:

```rust
#[repr(u8)]
enum ModTag {
    None = 0,
    // Boolean conditions (gate: mod excluded if false)
    Condition(ConditionId),        // index into known conditions table
    // Value scalers (multiply value by count/ratio)
    Multiplier(MultiplierId),      // per power charge, per totem, etc.
    PerStat(StatId, f64),          // per N of stat (e.g., per 10 Str -> divisor=10)
    // Threshold gates
    StatThreshold(StatId, f64),    // requires stat >= threshold
    // Skill targeting
    SkillType(KeywordFlags),       // mod only applies to skills with these keywords
    SkillId(u16),                  // specific skill gem ID
    SlotName(SlotId),              // only from this equipment slot
    // Limit (caps the total scaled value)
    Limit(f64),
}
```

**ConditionId** (u8, 256 possible conditions):
```rust
enum ConditionId {
    DualWielding, OnFullLife, OnLowLife, IsLeeching,
    KilledRecently, HaveFortify, HaveOnslaught, HaveTailwind,
    EnemyShocked, EnemyChilled, EnemyFrozen, EnemyIgnited,
    EnemyBleeding, EnemyPoisoned, EnemyMaimed,
    UsingShield, UsingFlask, Stationary, Channelling,
    CritRecently, BlockedRecently, HitRecently,
    // ... ~60 total, covers all PoB conditions
}
```

**MultiplierId** (u8):
```rust
enum MultiplierId {
    PowerCharge, FrenzyCharge, EnduranceCharge,
    GrandSpectrum, Totem, Golem, Zombie, Spectre,
    // ... ~30 total
}
```

### ModDB: grouped storage with parent chain

```rust
struct ModDB {
    mods: Vec<Mod>,                          // contiguous arena
    by_stat: Vec<SmallVec<[u32; 4]>>,       // StatId -> indices into mods
    parent: Option<Box<ModDB>>,              // for hierarchical lookup (player -> enemy)
}
```

### SkillCfg: query context

```rust
struct SkillCfg {
    flags: ModFlags,
    keyflags: KeywordFlags,
    slot: SlotId,
    skill_id: u16,
}

impl Default for SkillCfg {
    fn default() -> Self { /* all zeros = matches everything unconditional */ }
}
```

### BuildState: runtime state for condition evaluation

```rust
struct BuildState {
    conditions: u64,          // bitfield of active ConditionIds (up to 64)
    power_charges: u8,
    frenzy_charges: u8,
    endurance_charges: u8,
    grand_spectrum_count: u8,
    totem_count: u8,
    strength: f64,
    dexterity: f64,
    intelligence: f64,
    weapon_type: ModFlags,
}
```

### Core eval loop (hot path)

```rust
impl ModDB {
    fn sum(&self, stat: StatId, mod_type: ModType, cfg: &SkillCfg, state: &BuildState) -> f64 {
        let mut total = 0.0;
        if let Some(indices) = self.by_stat.get(stat.0 as usize) {
            for &idx in indices {
                let m = &self.mods[idx as usize];
                if m.mod_type != mod_type { continue; }
                if m.flags.bits() != 0 && (cfg.flags & m.flags) != m.flags { continue; }
                if m.keyflags.bits() != 0 {
                    if m.keyflags.contains(KeywordFlags::MATCH_ALL) {
                        if (cfg.keyflags & m.keyflags) != m.keyflags { continue; }
                    } else if (cfg.keyflags & m.keyflags).is_empty() { continue; }
                }
                let val = self.eval_tags(m, state);
                if val == 0.0 { continue; } // condition failed
                total += val;
            }
        }
        if let Some(parent) = &self.parent {
            total += parent.sum(stat, mod_type, cfg, state);
        }
        total
    }

    fn eval_tags(&self, m: &Mod, state: &BuildState) -> f64 {
        let mut val = m.value;
        val = self.apply_tag(m.tag1, val, state);
        if val == 0.0 { return 0.0; }
        val = self.apply_tag(m.tag2, val, state);
        val
    }

    fn apply_tag(&self, tag: ModTag, val: f64, state: &BuildState) -> f64 {
        match tag {
            ModTag::None => val,
            ModTag::Condition(id) => if state.check(id) { val } else { 0.0 },
            ModTag::Multiplier(id) => val * state.multiplier(id) as f64,
            ModTag::PerStat(stat, div) => val * (state.get_stat(stat) / div).floor(),
            ModTag::StatThreshold(stat, thresh) => if state.get_stat(stat) >= thresh { val } else { 0.0 },
            ModTag::Limit(cap) => val.min(cap),
            _ => val,
        }
    }
}
```

### Performance vs PoB's Lua ModDB

| Aspect | PoB Lua | Rust new |
|--------|---------|----------|
| Stat lookup | string hash table | direct index (u16) |
| Flag match | `band()` Lua call | native `&` op |
| Condition eval | Lua function call per tag | match on u8 enum |
| Mod storage | Lua tables (64 bytes+ each) | packed struct (52 bytes) |
| Allocation | per-mod table alloc | arena Vec, zero alloc during eval |
| Parent chain | Lua method call | single pointer follow |

## Migration path

### Phase 1: New types (no behavior change)
Add `mod_db.rs` with `Mod`, `ModDB`, `StatId`, `ModFlags`, `KeywordFlags`, `ModTag`, `SkillCfg`, `BuildState`. Unit tests for matching logic. Old code untouched.

### Phase 2: stat_parser emits Mod
Update `stat_parser.rs` to produce `Vec<Mod>` (with a compat wrapper that still returns `Vec<Modifier>` for existing callers). Parse conditions from stat text ("while dual wielding" -> tag).

### Phase 3: evaluate_build uses ModDB
Rewrite the calc pipeline in `evaluate_build` to populate a ModDB and query it with SkillCfg. Old `aggregate_mods` removed. All 292 tests must still pass.

### Phase 4: Cleanup
Remove `Modifier` struct, `aggregate_mods`, hardcoded ascendancy/support/unique approximations (replaced by proper mod emission).

## Testing Strategy

- `mod_db.rs`: unit tests for flag matching, keyword matching, condition evaluation, per-charge scaling, parent chain
- `stat_parser.rs`: existing tests + new tests verifying flags/conditions on parsed mods
- `lib.rs`: existing 292 snapshot/integration tests must pass after migration
- Benchmark: `evaluate_build` must stay under 10us (current ~3us, budget for richer eval)

## Boundaries

- **Always**: Run `cargo test` before committing. Maintain backwards compat on WASM API.
- **Ask first**: Adding crate deps beyond `bitflags`, changing `BuildInput`/`CalcOutput` fields.
- **Never**: Breaking existing 292 tests. Removing stat_parser patterns.

## Success criteria

1. All 292 existing tests pass
2. `evaluate_build` stays under 10us per call
3. ModDB handles all 30 ModFlag values and all 25 KeywordFlag values from PoB
4. Condition tags handle per-charge, per-stat, boolean gates, thresholds
5. stat_parser emits Mods with correct flags for the top 50 mod patterns
6. Flag/keyword matching produces identical results to PoB's `band()` logic
