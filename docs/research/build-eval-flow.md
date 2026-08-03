# SolvedExile Build Evaluation Flow

End-to-end trace of how a PoB code goes from paste to rendered stats,
reconstructed from minified JS chunks on 2026-08-03.

---

## 1. PoB Code Format

A PoB "build code" is: **Base64(zlib-deflate(XML))**

- URL-safe Base64 variant (`+/=` and `_-` both accepted)
- Whitespace is stripped before decoding
- Codes up to 512 KB are accepted for inline preview
- The decoded XML is a full PoB build document (see section 8)

```
User pastes code
  ↓  decodePobCode(code)        — base64 decode → inflate → XML string
  ↓  ew(xml)                    — fast preview extraction (class, level, main skill)
  ↓  classifyBuildInput(text)   — returns { kind: "pob-code", preview, loadable: true }
```

Encoding is the reverse: `encodePobCode(xml)` → deflate → base64.

---

## 2. Import Pipeline

When a user loads a build (paste, file open, cloud load):

```
classifyBuildInput(text)
  ↓
  kind: "pob-code"         → decodePobCode → XML
  kind: "pastebin-url"     → fetch raw paste → decodePobCode
  kind: "pobarchives-link" → fetch from pobarchives API
  kind: "unknown"          → try loading anyway
  ↓
migrate329xCode(code)       — version migration if needed
  ↓
Worker.evaluate(xml)        — full engine evaluation (see next section)
  ↓
React state update          — buildData, buildSource set
  ↓
UI renders                  — sidebar stats, active tab content
```

### Input Classification

```javascript
// Detected input kinds:
"pob-code"          // raw base64 build code (≥40 chars, alphanumeric+base64)
"pastebin-url"      // pastebin.com link
"pobarchives-link"  // pobarchives link
"poe-profile-url"   // pathofexile.com/account/... character URL
"unsupported-url"   // unrecognized URL
"unknown"           // fallback
```

---

## 3. Lua Engine Evaluation (`_wasm_eval`)

The core evaluation runs inside the Web Worker's Lua VM. The JS side
calls `P.doString(...)` with an inline Lua script:

```lua
-- GC relaxation for the heavy allocation storm
collectgarbage('setpause', 200)

local r = _wasm_eval(xmlString)          -- parse XML, load build, run calcs

r.build_info    = _wasm_build_info()     -- class, level, ascendancy, tree, etc.
r.items         = _wasm_extract_items()  -- equipped item data
r.build_items   = _wasm_extract_build_items() -- all items in the build
r.skill_groups  = _wasm_extract_skills(false) -- skill groups (no rich descriptions)

-- Config options extracted only on import/restore/config changes
-- (flag set by _wasm_eval; app keeps previous schema on ordinary edits)

-- Restore aggressive GC + adaptive step
collectgarbage('setpause', 100)
_wasm_gc_step()
```

The `_wasm_eval` function internally:
1. Calls `loadBuildFromXML(xmlText, name)` which sets PoB into BUILD mode
2. Runs `runCallback("OnFrame")` to trigger the full PoB calc pipeline
3. Extracts stats from `build.calcsTab` output tables
4. Returns a stats table

---

## 4. BuildStats Structure

The evaluation returns a `BuildStats` object. Reconstructed from field references:

```typescript
interface BuildStats {
  // === Offence ===
  total_dps: number;
  combined_dps: number;      // SelectedCombinedDPS from PoB
  full_dps: number;
  hit_dps: number;
  dot_dps: number;           // total_dot_dps
  culling_dps: number;
  bleed_dps: number;
  poison_dps: number;
  ignite_dps: number;
  average_damage: number;    // SelectedAverageDamage
  crit_chance: number;
  crit_multi: number;        // default 150
  attack_speed: number;      // SelectedSpeed
  hit_chance: number;        // default 100

  // === Defence ===
  life: number;
  mana: number;
  energy_shield: number;
  armour: number;
  evasion: number;
  ward: number;

  // === Resistances ===
  fire_resist: number;
  cold_resist: number;
  lightning_resist: number;
  chaos_resist: number;
  fire_resist_capped: number;
  cold_resist_capped: number;
  lightning_resist_capped: number;
  chaos_resist_capped: number;
  max_fire_resist: number;   // default 75
  max_cold_resist: number;
  max_lightning_resist: number;
  max_chaos_resist: number;

  // === EHP / Max Hit ===
  total_ehp: number;         // TotalEHP from PoB
  physical_ehp: number;
  fire_ehp: number;
  cold_ehp: number;
  lightning_ehp: number;
  chaos_ehp: number;
  max_hit_physical: number;
  max_hit_fire: number;
  max_hit_cold: number;
  max_hit_lightning: number;
  max_hit_chaos: number;

  // === Mitigation ===
  attack_block_chance: number;
  spell_block_chance: number;
  spell_suppression_chance: number;  // "suppression_chance" internally
  physical_damage_reduction: number;

  // === Recovery ===
  life_regen_per_sec: number;
  life_leech_per_hit: number;
  life_leech_rate: number;
  life_recharge: number;
  life_recovery: number;
  life_regen_recovery: number;
  mana_regen: number;
  mana_leech_per_hit: number;
  mana_leech_rate: number;
  mana_recovery: number;
  mana_regen_recovery: number;

  // === Attributes ===
  strength: number;          // "str_" internally (avoids JS keyword clash)
  dexterity: number;         // "dex"
  intelligence: number;      // "int"

  // === Misc ===
  move_speed_bonus: number;
  per_skill_dps: SkillDps[]; // per-skill DPS breakdown

  // === Raw map (PoB output keys) ===
  raw: Record<string, number>;  // direct PoB output fields (TotalEHP, SelectedDPS, etc.)
}
```

### Normalization

The JS side post-processes via `eT()`:
```javascript
function normalizeStats(stats) {
  const raw = stats.raw instanceof Map ? Object.fromEntries(stats.raw) : stats.raw ?? {};
  return {
    ...stats,
    strength:                raw.str_ ?? 0,
    dexterity:               raw.dex ?? 0,
    intelligence:            raw.int ?? 0,
    total_ehp:               raw["TotalEHP"],
    selected_display_dps:    raw["SelectedDPS"],
    selected_combined_dps:   raw["SelectedCombinedDPS"],
    selected_average_damage: raw["SelectedAverageDamage"],
    selected_speed:          raw["SelectedSpeed"],
    per_skill_dps:           stats.per_skill_dps ?? [],
  };
}
```

### Build Summary (for list/card display)

```javascript
function buildSummary(evaluation) {
  return {
    dps:        getDisplayedBuildDps(stats),
    life:       stats.life ?? 0,
    es:         stats.energy_shield ?? 0,
    ehp:        round(stats.total_ehp),
    mana:       round(stats.mana),
    armour:     round(stats.armour),
    evasion:    round(stats.evasion),
    ward:       round(stats.ward),
    physMaxHit: round(stats.max_hit_physical),
    level:      build_info.level,
    className:  build_info.class,
    ascendancy: build_info.ascendancy,
  };
}
```

---

## 5. Build Info Structure

Extracted by `_wasm_build_info()`:

```typescript
interface BuildInfo {
  class: string;                     // "Scion", "Witch", etc.
  level: number;
  ascendancy: string | null;         // "Necromancer", etc.
  secondary_ascendancy: string | null;
  secondary_ascendancy_id: string | null;
  tree_version: string;              // "3_29", "0_5" (PoE2)
  main_socket_group: number;         // 1-indexed
  allocated_nodes: number[];         // passive tree node IDs
  mastery_effects: Record<string, number>; // nodeId → effectId
  active_skills: string[];           // names of active skill gems
  bandit: string | null;             // "None", "Alira", etc.
  pantheon_major: string | null;
  pantheon_minor: string | null;
  keystones: string[];
  tree_socket_nodes: Record<string, any>; // jewel socket mappings
}
```

---

## 6. Item & Skill Extraction

### Items (`_wasm_extract_items`)

Items have a `slot` field used for equipment reconciliation:

```typescript
interface ExtractedItem {
  slot: string;    // "Weapon 1", "Helmet", "Ring 1", "Flask 1", etc.
  name: string;
  // ... full item data from PoB's Item class
}
```

The reconciliation check compares slots between the XML document and
the engine's item set to detect drift.

### Skill Groups (`_wasm_extract_skills`)

```typescript
interface SkillGroup {
  enabled: boolean;
  granted: boolean;   // granted by items/tree (not user-added)
  gems: Gem[];
}

interface Gem {
  name: string;
  enabled: boolean;
  is_support: boolean;
  // ... level, quality, gem_id, etc.
}
```

Rich gem descriptions (stat tooltips) are fetched on demand via a
separate Lua call when the user hovers a gem. This avoids blocking
the initial build load on tooltip generation.

---

## 7. Rust WASM Engine (`se_wasm`) Integration

### Initialization

```javascript
// Lazy singleton: fetched once, cached as a promise
async function loadSeWasm() {
  const resp = await fetch(`/wasm/se_wasm.js?v=${VERSION}`);
  const blob = new Blob([await resp.text()], { type: 'application/javascript' });
  const url  = URL.createObjectURL(blob);
  const mod  = await import(url);
  await mod.default({ module_or_path: `/wasm/se_wasm_bg.wasm?v=${VERSION}` });
  return mod;
}

// Game data loaded separately (timeless jewel zips)
async function initGameData(mod) {
  const files = await Promise.all(
    JEWEL_FILES.map(([id, name]) => fetch(`/secalc-data/game/${name}`).then(r => r.text()))
  );
  const data = {};
  JEWEL_FILES.forEach(([id], i) => { data[id] = files[i]; });
  mod.init_game_data(data);
}
```

### When Each Engine Fires

| Trigger | Engine | Method |
|---------|--------|--------|
| Import / full rebuild | Lua (wasmoon) | `_wasm_eval(xml)` in Worker |
| Item / skill / config change | Lua (wasmoon) | `_wasm_eval(xml)` in Worker |
| Tree node hover preview | Rust WASM | `evaluator.evaluate_delta(current, proposed)` |
| Node power heatmap sweep | Lua (wasmoon) | `_nps_setup(maxDepth, opts)` in Worker |
| Marginal Value sensitivity | Rust WASM | `evaluator.evaluate(perturbed_nodes)` per lever |
| Batch build ranking | Rust WASM | `rank_build_xmls(xmls)` |
| Timeless jewel resolution | Both | Lua for tree rebuild, Rust for LUT lookups |

The `NEXT_PUBLIC_CLIENT_WASM_TREE_EVAL` flag gates whether the Rust engine
is used for tree-level evaluation. When enabled, after each Lua full-eval
the app also creates a `WasmEvaluator` via `evaluator_from_build_xml(xml)`.

### evaluate_delta (Node Hover Preview)

```typescript
// WasmEvaluator.evaluate_delta: fast stat diff for hover preview
const result = evaluator.evaluate_delta(
  new Uint32Array(currentAllocatedNodes),
  new Uint32Array([...currentAllocatedNodes, hoveredNodeId])
);
// result = { current: BuildStats, proposed: BuildStats }
// UI shows the diff: proposed.life - current.life, etc.
```

This runs entirely in the Rust WASM module, no Lua round-trip.
The `WasmEvaluator` is backed by a "pre-resolved WarmState" containing
all mod data pre-parsed, so re-evaluation per node is fast.

---

## 8. PoB XML Document Structure

The XML is PoB's native format. Key elements:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<PathOfBuilding>
  <Build
    level="95"
    targetVersion="3_29"
    className="Witch"
    ascendClassName="Necromancer"
    mainSocketGroup="1"
    bandit="None"
    pantheonMajorGod="None"
    pantheonMinorGod="None">
  </Build>

  <Tree activeSpec="1">
    <Spec treeVersion="3_29">
      <URL><!-- passive tree URL with allocated node hashes --></URL>
      <Sockets>
        <Socket nodeId="26725" itemId="1"/>  <!-- jewel socket mappings -->
      </Sockets>
      <MasteryEffects>
        <!-- nodeId:effectId pairs -->
      </MasteryEffects>
    </Spec>
  </Tree>

  <Items activeItemSet="1">
    <Item id="1">
      <!-- PoB item text format (name, base, mods line by line) -->
    </Item>
    <Slot name="Helmet" itemId="1"/>
    <ItemSet id="1">
      <Slot name="Helmet" itemId="1"/>
    </ItemSet>
  </Items>

  <Skills activeSkillSet="1">
    <SkillSet id="1">
      <Skill mainActiveSkill="1" enabled="true" slot="" source="">
        <Gem ... nameSpec="Raise Zombie" level="21" quality="20" enabled="true"/>
        <Gem ... nameSpec="Minion Damage Support" level="21" quality="20" enabled="true"/>
      </Skill>
    </SkillSet>
  </Skills>

  <Config>
    <Input name="enemyIsBoss" string="Pinnacle"/>
    <Input name="conditionUsedMinionSkillRecently" boolean="true"/>
    <ConfigSet id="1">
      <!-- per-config-set overrides -->
    </ConfigSet>
  </Config>

  <Notes>
    <!-- freeform build notes -->
  </Notes>
</PathOfBuilding>
```

### XML Parsing (JS side)

SolvedExile uses `DOMParser` to parse the XML on the JS side for
lightweight operations (tab rendering, item/skill display, config sync):

```javascript
const doc = new DOMParser().parseFromString(xml, "text/xml");
const buildEl = doc.querySelector("Build");
const level = Number(buildEl.getAttribute("level"));
const className = buildEl.getAttribute("className");
```

The `projectBuildDocumentFromXml(xml)` function extracts a structured
representation of items, skill groups, and config from the XML without
running the Lua engine.

The `getActivePassiveTreeAllocation(xml)` function extracts the active
spec's allocated nodes and mastery effects.

---

## 9. Reconciliation (Engine vs. Document Drift)

After every evaluation, SolvedExile runs a reconciliation check that
compares the Lua engine's state against the source XML document:

```
Checks performed:
  - Tree node count: engine allocated_nodes vs XML node count
  - Class: engine class vs XML className
  - Main skill group: engine vs XML mainSocketGroup
  - Mastery effects: engine vs XML MasteryEffects
  - Equipped items: engine slots vs XML item slots
  - Skill group count: engine vs XML (excluding granted skills)
  - XML structural validation (validateBuildXml)
```

Drift is logged to `window.__seReconcile` and reported as
`console.error("[reconcile] engine/document drift after ...")`.

---

## 10. _wasm_preview_allocation (Fast Tree Interaction)

The Lua-side fast preview mechanism for tree node changes. Used by both
node hover previews (when Rust engine is unavailable) and the node power
sweep.

From code comments:
> "Uses initEnv CALCULATOR + specEnv reuse + perform — which is both
> accelerated and produces real per-node deltas."

The approach:
1. `override.addNodes` (or `removeNodes` for allocated-node scoring)
   is fed to PoB's calculator
2. The calculator runs a partial re-evaluation (not a full rebuild)
3. Returns delta stats vs. the current baseline
4. The shared output table is snapshotted (scalar fields only) to
   prevent mutation by subsequent calls

This is the same mechanism used by `_nps_setup` for the node power
sweep. Nodes are swept nearest-first by path distance from the current
allocation, bounded by `maxDepth` and a per-sweep calc budget.

---

## 11. Writer Tab Locking

Prevents multiple browser tabs from modifying the same build:

```javascript
navigator.locks.request('solved_exile_writer_tab', () => {
  isWriter = true;
  notifySubscribers();
  return new Promise(() => {}); // hold lock forever
});
```

Non-writer tabs can read but not edit. The lock is checked via
`navigator.locks.query()` on startup.

---

## 12. Snapshot Save/Restore

The engine supports saving a VM snapshot after initialization and
restoring it on subsequent page loads for faster boot:

```
Worker.init(opts)
  ↓ spawnBrowserWorker()
  ↓ sendAndWait({ type: "init", opts })
  ↓ Worker boots Lua VM + loads PoB data
  ↓ If snapshot exists: restore from snapshot, validateRestore
  ↓ If restore fails or no snapshot: cold boot
  ↓ Save new snapshot for next session
```

Controlled by `NEXT_PUBLIC_POB_ENGINE_SNAPSHOTS` flag.
The worker tracks `_autoRespawnCount` and `_timeoutStreak`
to detect and recover from crashes.
