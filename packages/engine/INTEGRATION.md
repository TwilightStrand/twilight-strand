# Rust Engine Integration Plan

## Status: Phase 1 - Core Formulas

The Rust WASM engine implements PoE stat calculation formulas.
Currently running independently; not yet wired into the frontend.

## Phases

### Phase 1: Core Formulas (DONE)
- Modifier aggregation (flat/increased/more)
- Life, mana, ES, attributes
- Armour, evasion, accuracy
- Resistances with penalty and cap
- Basic DPS, crit, attack speed
- Hit chance, EHP
- 19 Rust tests passing

### Phase 2: Integration
- Build wasm-pack output
- Load WASM module in the web worker alongside Lua
- Extract modifiers from Lua build data -> Rust BuildInput
- Run both engines, compare in EngineComparison UI

### Phase 3: Tree/Item Modifiers
- Parse passive tree node stats into Modifier format
- Parse item mod lines into Modifier format
- Handle PoE-specific mechanics: damage conversion, DoT, minions

### Phase 4: Validation
- Test against 100+ real builds
- Accept <1% deviation from Lua engine
- Performance benchmarks: target <1ms per evaluation

### Phase 5: Replace
- Drop Lua engine
- Use Rust for all calculations
- Enable optimization features (cluster search, pathfinding)

## Architecture

```
BuildInput (modifiers from tree/items/skills/config)
  |
  v
aggregate_mods() -> HashMap<stat, (flat, increased%, more*)>
  |
  v
calc_stat(base, flat, inc, more) -> final value
  |
  v
CalcOutput (life, ES, DPS, resistances, etc.)
```

The modifier system mirrors PoE's calculation order:
1. Sum all flat additions
2. Sum all increased/reduced percentages
3. Multiply all more/less multipliers
4. Final = (base + flat) * (1 + sum_inc/100) * product_more
