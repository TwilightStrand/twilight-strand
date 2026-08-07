# Plan: Phase 1 - Conditional Modifier System Core Types

Phase 1 is purely additive. No existing code changes. All new code goes in `src/mod_db.rs` and `Cargo.toml` (bitflags dep). The existing 292 tests remain untouched and must continue to pass.

---

## Task 1: StatId interning table

**Description:** Create the `StatId(u16)` type with compile-time constants for all stat names used by the current engine, plus the ones PoB uses. Include `from_str()` for runtime lookup and `as_str()` for debug/display.

**Acceptance criteria:**
- [ ] `StatId` is `Copy + Clone + Eq + Hash`
- [ ] Constants cover all ~60 stat names currently in `lib.rs` and `stat_parser.rs` (Life, EnergyShield, Mana, Damage, FireDamage, etc.)
- [ ] `StatId::from_str("Life") == Some(StatId::LIFE)`
- [ ] `StatId::from_str("nonexistent") == None`
- [ ] `StatId::COUNT` constant gives total number of known stats

**Verification:**
- [ ] `cargo test stat_id` passes
- [ ] `cargo build` succeeds

**Dependencies:** None

**Files likely touched:** `src/mod_db.rs` (new), `src/lib.rs` (add `pub mod mod_db;`)

**Estimated scope:** S

---

## Task 2: ModFlags and KeywordFlags bitflags

**Description:** Define `ModFlags(u32)` and `KeywordFlags(u32)` using the `bitflags` crate, matching PoB's exact bit layout from the spec. Add the `bitflags` dependency to Cargo.toml.

**Acceptance criteria:**
- [ ] `ModFlags` has all 26 flags from the spec matching PoB's hex values
- [ ] `KeywordFlags` has all 24 flags from the spec matching PoB's hex values
- [ ] Flag matching: `ModFlags::ATTACK | ModFlags::HIT` matched by config `ATTACK | SPELL | HIT` (superset)
- [ ] Keyword matching: `KeywordFlags::COLD` matches config `COLD | ELEMENTAL` (any overlap)
- [ ] MATCH_ALL keyword: `COLD | MATCH_ALL` requires COLD present in config (all required)

**Verification:**
- [ ] `cargo test mod_flags` passes
- [ ] `cargo test keyword_flags` passes

**Dependencies:** None (parallel with Task 1)

**Files likely touched:** `Cargo.toml`, `src/mod_db.rs`

**Estimated scope:** S

---

## Task 3: ModType, ConditionId, MultiplierId enums

**Description:** Define the small enums for mod type classification, boolean conditions, and per-stack multipliers.

**Acceptance criteria:**
- [ ] `ModType` has variants: Base, Increased, More, Override, Flag
- [ ] `ConditionId` has ~25 initial variants covering the most common PoB conditions
- [ ] `MultiplierId` has ~10 initial variants (PowerCharge, FrenzyCharge, EnduranceCharge, GrandSpectrum, Totem, etc.)
- [ ] All are `Copy + Clone + Eq` and repr(u8)

**Verification:**
- [ ] `cargo build` succeeds

**Dependencies:** None (parallel with Tasks 1-2)

**Files likely touched:** `src/mod_db.rs`

**Estimated scope:** S

---

## Task 4: ModTag, Mod struct, BuildState, SkillCfg

**Description:** Define the `ModTag` discriminated union (condition/scaler), the `Mod` struct that carries the full modifier data, `BuildState` for runtime condition evaluation, and `SkillCfg` for query context.

**Acceptance criteria:**
- [ ] `ModTag` variants: None, Condition, Multiplier, PerStat, StatThreshold, SkillType, Limit
- [ ] `Mod` struct has: stat (StatId), mod_type (ModType), flags (ModFlags), keyflags (KeywordFlags), value (f64), tag1 (ModTag), tag2 (ModTag)
- [ ] `BuildState` has condition bitfield (u64), charge counts, attribute values, weapon type
- [ ] `BuildState::check(ConditionId) -> bool` works against the bitfield
- [ ] `BuildState::multiplier(MultiplierId) -> u32` returns charge/stack count
- [ ] `SkillCfg` has flags, keyflags, Default impl (all zeros)
- [ ] Convenience builder: `Mod::new(StatId, ModType, f64)` for the common no-condition case

**Verification:**
- [ ] `cargo test mod_struct` passes
- [ ] `cargo test build_state` passes

**Dependencies:** Tasks 1, 2, 3

**Files likely touched:** `src/mod_db.rs`

**Estimated scope:** M

---

## Task 5: ModDB storage and matching

**Description:** Implement `ModDB` with arena storage, per-stat index, and the core matching + evaluation loop (`sum`, `product_more`, `calc`, `has_flag`).

**Acceptance criteria:**
- [ ] `ModDB::new()` creates empty db
- [ ] `ModDB::add(mod)` stores mod and updates the stat index
- [ ] `sum(stat, ModType::Base, cfg, state)` returns sum of matching Base mods
- [ ] `sum(stat, ModType::Increased, cfg, state)` returns sum of matching Inc mods
- [ ] `product_more(stat, cfg, state)` returns product of `(1 + value/100)` for matching More mods
- [ ] `calc(stat, base, cfg, state)` returns `(base + flat) * (1 + inc/100) * more`
- [ ] `has_flag(stat, cfg, state)` returns true if any matching Flag mod exists
- [ ] Mods with non-matching flags are excluded
- [ ] Mods with non-matching keywords are excluded
- [ ] Mods with failing conditions return 0 (excluded from sum)
- [ ] Per-charge mods scale value by charge count from BuildState

**Verification:**
- [ ] `cargo test mod_db` passes (12+ test cases covering the above)

**Dependencies:** Task 4

**Files likely touched:** `src/mod_db.rs`

**Estimated scope:** M

---

## Task 6: Parent chain and edge cases

**Description:** Add parent ModDB support (hierarchical lookup) and handle edge cases: Override mods, empty stat buckets, zero-flag mods (match everything), MATCH_ALL keyword behavior.

**Acceptance criteria:**
- [ ] `ModDB::with_parent(parent)` creates a child that includes parent mods in queries
- [ ] `get_override(stat, cfg, state)` returns the Override value if present (highest priority)
- [ ] Mods with `flags = 0` match any SkillCfg (unconditional)
- [ ] Mods with `keyflags = 0` match any SkillCfg keywords
- [ ] MATCH_ALL keyword requires all flags present (not any)
- [ ] Multiple PerStat tags on the same mod compose correctly (multiply)

**Verification:**
- [ ] `cargo test parent_chain` passes
- [ ] `cargo test override_mods` passes
- [ ] `cargo test unconditional_mods` passes

**Dependencies:** Task 5

**Files likely touched:** `src/mod_db.rs`

**Estimated scope:** S

---

## Checkpoint: After Tasks 1-6

- [ ] `cargo test` passes (all 292 existing + all new mod_db tests)
- [ ] `cargo build` succeeds
- [ ] No changes to any existing `.rs` file except adding `pub mod mod_db;` to `lib.rs`
- [ ] ModDB can store, index, filter, and evaluate mods with flags, keywords, and conditions
