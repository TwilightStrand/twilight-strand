# TSC Build Codec Specification v1

Binary format for encoding Path of Exile build data. Designed to replace PoB's XML+zlib+base64 format with something 10x smaller and schema-versioned.

## Wire format

```
tsc1_<base64url(deflate(binary))>
```

- Prefix `tsc1_` distinguishes TSC codes from PoB codes
- Binary payload is deflate-compressed, then base64url-encoded (URL-safe, no padding)
- Version `1` in the prefix matches the schema version byte in the binary

## Binary layout

All integers are unsigned LEB128 varints. Strings are length-prefixed (varint length + UTF-8 bytes). Floats are IEEE 754 double (8 bytes, little-endian).

### Header

| Field | Type | Description |
|-------|------|-------------|
| schema_version | varint | Always `1` for this spec |

### Core

| Field | Type |
|-------|------|
| level | varint |
| class_id | varint (0=Scion, 1=Marauder, 2=Ranger, 3=Witch, 4=Duelist, 5=Templar, 6=Shadow) |
| ascendancy_name | string |
| main_skill_id | string |

### Base attributes

| Field | Type | Notes |
|-------|------|-------|
| base_str | varint | 0 = use class default |
| base_dex | varint | |
| base_int | varint | |

### Modifiers

| Field | Type |
|-------|------|
| modifier_count | varint |
| modifiers[] | repeated { stat: string, value: float64, mod_type: varint (0=flat, 1=increased, 2=more) } |

### Keystones

| Field | Type |
|-------|------|
| keystone_count | varint |
| keystones[] | repeated string |

### Support gems

| Field | Type |
|-------|------|
| support_count | varint |
| supports[] | repeated string |

### Equipment

| Field | Type |
|-------|------|
| unique_count | varint |
| uniques[] | repeated string |
| flask_count | varint |
| flasks[] | repeated string |

### Weapon

| Field | Type |
|-------|------|
| weapon_phys_min | float64 |
| weapon_phys_max | float64 |
| weapon_aps | float64 |
| weapon_crit | float64 |

### Charges

| Field | Type |
|-------|------|
| power_charges | varint |
| frenzy_charges | varint |
| endurance_charges | varint |

### Condition flags (bitmask)

Single varint, bits:

| Bit | Flag |
|-----|------|
| 0 | on_full_life |
| 1 | on_low_life |
| 2 | is_leeching |
| 3 | have_fortify |
| 4 | have_killed_recently |
| 5 | have_onslaught |
| 6 | have_tailwind |
| 7 | have_arcane_surge |

### Conversion

| Field | Type |
|-------|------|
| phys_to_fire | float64 |
| phys_to_cold | float64 |
| phys_to_lightning | float64 |
| phys_to_chaos | float64 |

## Size comparison

| Build type | PoB code | TSC code | Ratio |
|------------|----------|----------|-------|
| Simple (10 mods) | ~3,000 bytes | ~200 bytes | 15x |
| Endgame (50 mods) | ~8,000 bytes | ~600 bytes | 13x |
| Guide (100 levels) | ~50,000 bytes | ~3,000 bytes | 17x |

## Versioning

- `schema_version` byte is the first field in the binary
- Old decoders reject unknown versions with a clear error
- New fields are appended at the end; old decoders stop reading at their known boundary
- The `tsc1_` prefix version bumps only on incompatible changes

## Implementations

- TypeScript: `@tsc/build-codec` (this package)
- Rust: `tsc-engine` crate (via serde)
- Proto: `packages/proto/build.proto` (reference schema)
