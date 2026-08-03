# PoB Code Format and SolvedExile Import/Export

## PoB Code Format

A PoB "build code" is a single string that encodes the entire build as XML. The format is:

```
Raw XML → zlib deflate (level 9) → raw bytes → Base64 (URL-safe variant)
```

### Encoding (`encodePobCode`)

```javascript
function encodePobCode(xml) {
  // 1. Minify: strip whitespace between XML tags
  xml = xml.replace(/>\s+</g, "><").trim();

  // 2. Compress: zlib deflate at level 9
  const compressed = pako.deflate(xml, { level: 9 });

  // 3. Binary → string (Latin-1 trick)
  let binary = "";
  for (let i = 0; i < compressed.length; i++)
    binary += String.fromCharCode(compressed[i]);

  // 4. Base64 encode, then URL-safe substitution
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}
```

### Decoding (`decodePobCode`)

```javascript
function decodePobCode(code) {
  code = code.trim();

  // Passthrough: already XML
  if (code.startsWith("<?xml") || code.startsWith("<PathOfBuilding"))
    return code;

  // 1. Reverse URL-safe Base64
  const b64 = code.replace(/-/g, "+").replace(/_/g, "/");

  // 2. Base64 decode → binary string
  const binary = atob(b64);

  // 3. String → Uint8Array
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++)
    bytes[i] = binary.charCodeAt(i);

  // 4. zlib inflate with a 32 MB safety limit
  const inflator = new pako.Inflate();
  let totalSize = 0;
  const origOnData = inflator.onData.bind(inflator);
  inflator.onData = (chunk) => {
    totalSize += chunk.length;
    if (totalSize > 0x2000000) // 32 MB
      throw Error("Build code expands past the size limit");
    origOnData(chunk);
  };
  inflator.push(bytes, true);

  if (inflator.err) throw Error(inflator.msg || "inflate failed");

  // 5. UTF-8 decode
  return new TextDecoder("utf-8", { ignoreBOM: true }).decode(inflator.result);
}
```

### Key details

- **Compression library**: pako (a JavaScript port of zlib)
- **Base64 variant**: URL-safe (`+` → `-`, `/` → `_`)
- **Safety**: 32 MB decompressed size limit to prevent decompression bombs
- **Passthrough**: if the input already starts with `<?xml` or `<PathOfBuilding`, it's returned as-is (raw XML is also accepted)
- **Whitespace**: the encoder strips inter-tag whitespace before compressing

## PoB XML Schema

The root element is `<PathOfBuilding>`. The document structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<PathOfBuilding>
  <Build
    className="Scion|Marauder|Ranger|Witch|Duelist|Templar|Shadow"
    ascendClassName="None|Ascendant|Juggernaut|..."
    level="1..100"
    mainSocketGroup="1"
    bandit="None|Oak|Alira|Kraityn"
    pantheonMajorGod="None|..."
    pantheonMinorGod="None|..."
    ...
  />

  <Tree activeSpec="1">
    <Spec treeVersion="3_29" nodes="12345,67890,...">
      <!-- comma-separated passive node IDs -->
      <!-- Masteries embedded as child elements or attributes -->
    </Spec>
    <!-- Additional specs for secondary trees / weapon swap -->
  </Tree>

  <Items activeItemSet="1">
    <Item id="1">
      <!-- PoB item text format (name, base, mods, one per line) -->
    </Item>
    <Slot name="Weapon 1" itemId="1" />
    <Slot name="Helmet" itemId="2" />
    ...
    <ItemSet id="1" title="Default">...</ItemSet>
  </Items>

  <Skills activeSkillSet="1">
    <SkillSet id="1">
      <Skill mainActiveSkill="1" enabled="true" slot="...">
        <Gem nameSpec="Fireball" level="20" quality="20" ... />
        <Gem nameSpec="Greater Multiple Projectiles Support" ... />
      </Skill>
    </SkillSet>
  </Skills>

  <Config>
    <Input name="enemyIsBoss" string="Sirus" />
    <Input name="usePowerCharges" boolean="true" />
    ...
    <ConfigSet id="1" title="Mapping">...</ConfigSet>
  </Config>

  <Notes>User notes as text content</Notes>
  <Party>...</Party>

  <!-- SolvedExile-specific: migration stamp (removed on migration) -->
  <Se329xPreview>overlay-version-string</Se329xPreview>
</PathOfBuilding>
```

### Key XML elements for parsing

| Element | Attributes | Notes |
|---------|-----------|-------|
| `Build` | className, ascendClassName, level, mainSocketGroup, bandit, pantheonMajorGod, pantheonMinorGod | Top-level build metadata |
| `Tree > Spec` | treeVersion, nodes (comma-separated IDs) | Passive tree allocation |
| `Items > Item` | id | Body is PoB item text (name, base, mods) |
| `Items > Slot` | name, itemId | Maps equipment slot to item ID |
| `Skills > Skill` | mainActiveSkill, enabled, slot | Socket group |
| `Skills > Skill > Gem` | nameSpec, level, quality, qualityId, enabled, skillId | Individual gem |
| `Config > Input` | name, string/boolean/number | Build configuration |

### Default stat values (empty/new build)

From SolvedExile's `rD` function, a fresh Scion level 1 build defaults to:

| Stat | Value |
|------|-------|
| Life | 50 |
| Mana | 40 |
| Energy Shield | 0 |
| Strength/Dex/Int | 20 each |
| Max resists | 75% each |
| Crit Multi | 150% |
| Starting node | 58833 (Scion) |
| Hit chance | 100% |

For PoE 2 builds, the default class is Ranger and the starting tree version is `0_5`.

## Build Input Recognition

SolvedExile's `recognizeBuildInput` function classifies pasted text into input types:

```
Input text
  │
  ├── Starts with <?xml or <PathOfBuilding
  │   └─→ { kind: "pob-xml", loadable: true }
  │
  ├── Starts with https://
  │   ├── app.solvedexile.com/s/... or /u/.../...
  │   │   └─→ { kind: "share-link", fetchable: true }
  │   ├── poe.ninja/builds/...
  │   │   └─→ { kind: "poe-ninja-link", loadable: false, BLOCKED }
  │   ├── pobb.in/(u/user/)?slug
  │   │   └─→ { kind: "pobbin-link", fetchable: true }
  │   ├── pastebin.com/(raw/)?id
  │   │   └─→ { kind: "pastebin-link", fetchable: true }
  │   ├── maxroll.gg/...
  │   │   └─→ { kind: "maxroll-link", fetchable: true }
  │   ├── poedb.tw/...  or poe2db.tw/...
  │   │   └─→ { kind: "poedb-link", fetchable: true }
  │   ├── pobarchives.com/build/slug
  │   │   └─→ { kind: "pobarchives-link", fetchable: true }
  │   └── anything else
  │       └─→ { kind: "unsupported-url", loadable: false }
  │
  ├── Length ≥ 40, matches [A-Za-z0-9+/=_-]+
  │   ├── Length ≤ 512KB → attempt decode, preview XML
  │   └─→ { kind: "pob-code", loadable: true }
  │
  └── Anything else
      └─→ { kind: "unknown", loadable: true }
```

### Fetchable URLs

For link types marked `fetchable: true`, SolvedExile proxies the fetch through its own API:

- Pastebin: `/api/import/paste?source=pastebin&id=<id>`
- pobb.in: `/api/import/paste?source=pobbin&id=<slug>`
- pobarchives: `/api/import/paste?source=pobarchives&id=<slug>`
- Maxroll, poedb: similar proxy pattern

poe.ninja builds are **blocked** (they don't carry PoB export codes).

## 3.29 Migration Logic

SolvedExile handles the PoE 3.28 → 3.29 tree version migration with a `migrate329xCode` function. This is needed because the 3.29 patch reorganized the passive tree, changing node IDs.

### Migration pipeline

1. **Detect**: check for `<Se329xPreview>` stamp element OR self-evidencing markers:
   - Fabricated node IDs (IDs that exist in the preview mapping table `rl`)
   - Preview-only config input names
   - Active spec with `treeVersion="3_28"`

2. **Parse**: `DOMParser` to parse the XML

3. **Map nodes**: for each `<Spec>`, iterate comma-separated node IDs:
   - If ID is in the preview-to-real mapping table → replace with real 3.29 ID
   - If ID has no mapping → drop it (allocation removed)
   - Track mapped and dropped nodes for the report

4. **Handle config inputs**: some config inputs were renamed or removed in 3.29:
   - `"rename-if-node-mapped"` disposition: rename the input key if the gate node was mapped
   - Otherwise: remove the input element

5. **Strip stamp**: remove the `<Se329xPreview>` element

6. **Re-encode**: serialize back to XML, then `encodePobCode` to produce the new build code

### Migration report

The function returns a detailed report:
```javascript
{
  previewVersion: "overlay-version" | null,
  treeVersion: { from: ["3_28"], to: "3_29" },
  mappedNodes: [{ id, newId, name, ascendancy }],
  droppedNodes: [{ id, name, ascendancy, reason }],
  droppedInputs: [{ key, reason }],
  keptInputs: [{ key, reason }],
  changed: boolean,
  notes: [string]
}
```

### Unstamped builds

For builds without the `<Se329xPreview>` stamp, migration still runs if the build "self-evidences" as a preview build. Two signals:
- Node IDs that appear in the fabricated-preview-ID mapping table
- Config input names that only existed in the preview

If neither signal is present, the build passes through unchanged.

## Data Relationships

```
PoB Code (string)
  ↓ decodePobCode()
PoB XML (string)
  ↓ DOMParser / regex
Build Document (structured)
  ├── build_info: class, level, ascendancy, tree_version, keystones, etc.
  ├── items: [{ slot, itemId }]
  ├── build_items: [{ id, text }]
  ├── skill_groups: [{ gems: [{ name, level, quality }], slot, enabled }]
  ├── config: [{ name, value }]
  └── tree: { specs: [{ version, nodes: number[], masteryEffects }] }
```

## Eval Cache (localStorage)

Build evaluations are cached in `solved_exile_eval_cache_v3`:

```json
{
  "code": "<base64 PoB code>",
  "xml": "<decompressed XML>",
  "evaluation": { "stats": {...}, "build_info": {...}, "items": [...], ... },
  "v": 7
}
```

The cache key includes a version (`v: 7`) so stale caches from schema changes are discarded. A "Rust evaluator" result (from `WasmEvaluator`) is never written to localStorage (checked with `eV()`).

## Build Session (localStorage)

Active build state in `solved_exile_build_session_v3`:

```json
{
  "saved": { "code": "...", "evaluation": {...} },
  "draft": { "code": "...", "evaluation": {...} }
}
```

The `saved`/`draft` split tracks whether the user has unsaved changes.
