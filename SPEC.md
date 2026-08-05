# Spec: Activity Bar + Paper Doll Equipment

## Objective

Replace the horizontal tab bar with a vertical activity bar (like VS Code / D&D Beyond) and replace the flat equipment list with a paper doll layout (like PoE's in-game character panel). The goal is to free horizontal space, reduce header clutter, and make the equipment screen instantly recognizable to PoE players.

## Current layout

```
+-------------------------------------------------------+
| Logo | PoE1 | Build | Tabs(6) | Import | ... | Login  |  <- header (dense)
+------+------------------------------------------------+
| Stats |              Tab content                       |
| side  |              (tree/items/calcs/etc)             |
| bar   |                                                |
+------+------------------------------------------------+
```

Problems: header competes with tab bar for horizontal space; items tab uses a flat slot list; no spatial relationship between equipment slots.

## Proposed layout

```
+--+------+--------------------------------------------+
|  | Logo | Build Name   Lv 90 Deadeye   Import  ...   |  <- minimal status bar
|  +------+--------------------------------------------+
|  |      |                                            |
|⬡ | Stats|         Main content area                  |
|⚔ | side |         (tree / items / calcs)              |
|◈ | bar  |                                            |
|⚙ |      |                                            |
|△ |      |                                            |
|☰ |      |                                            |
+--+------+--------------------------------------------+
48px        variable          remaining width
```

### Activity bar

- 48px wide vertical strip on the left edge
- 6 icon buttons stacked vertically: Tree, Items, Skills, Config, Calcs, Settings
- Active tab highlighted with left border accent + filled background
- Tooltip on hover showing tab name + keyboard shortcut (1-6)
- Bottom: Import button icon + "..." actions
- On mobile: unchanged (keep bottom nav)

### Status bar (replaces header)

- Single row, thin (36-40px)
- Left: logo text "TS" or small icon
- Center: build name, level, class/ascendancy, key stats (DPS, Life)
- Right: Import button, actions menu, auth
- No tab buttons (moved to activity bar)

### Paper doll equipment

Replaces the flat slot list in ItemsTab with a spatial layout mirroring PoE's character panel:

```
         [Helmet]
[Weapon]  [Amul]  [Weapon2]
         [Body]
[Gloves] [Belt]  [Boots]
  [Ring1]       [Ring2]

  [F1] [F2] [F3] [F4] [F5]
```

- Each slot is a clickable card (60x80px) with item name, rarity border color, and base type
- Empty slots show a dim outline with the slot name
- Clicking a slot opens the item detail/editor in the right panel (same as current)
- Rarity border colors match the game: Normal (gray), Magic (blue), Rare (yellow), Unique (orange)
- Selected slot highlighted with accent border

### Stats sidebar

- Stays between activity bar and content
- Collapsible with the existing toggle
- Hero stat tiles at top (already implemented)
- No structural changes needed

## Tech stack

Uses existing stack (Next.js 15, React, Tailwind, Zustand). No new dependencies.

## Files to change

| File | Change |
|------|--------|
| `apps/web/app/page.tsx` | Replace `Header` + flex layout with activity bar layout |
| `apps/web/components/shell/Header.tsx` | Refactor into `StatusBar` (thin) |
| `apps/web/components/shell/ActivityBar.tsx` | **New** - vertical icon nav |
| `apps/web/components/items/PaperDoll.tsx` | **New** - spatial equipment layout |
| `apps/web/components/items/ItemsTab.tsx` | Use PaperDoll instead of flat list |
| `apps/web/components/shell/TabContent.tsx` | No change (content rendering stays) |
| `apps/web/stores/ui-store.ts` | No change (activeTab stays) |

## Implementation order

1. ActivityBar component (icon buttons, active state, tooltips)
2. StatusBar component (refactored from Header, thin single row)
3. Page layout (wire ActivityBar + StatusBar + sidebar + content)
4. PaperDoll component (spatial slot grid)
5. Wire PaperDoll into ItemsTab
6. Test all tabs render correctly
7. Mobile: verify bottom nav still works, no regressions

## Boundaries

- **Always:** keep all existing tab components working; no functional changes to tree/calcs/config/skills
- **Ask first:** if layout doesn't work well on specific screen sizes
- **Never:** remove mobile bottom nav; break keyboard shortcuts

## Success criteria

- Activity bar renders on desktop with 6 clickable icons
- Clicking an icon switches the active tab (same as current tabs)
- Keyboard shortcuts 1-6 still work
- Header is replaced by a thin status bar (under 40px)
- Items tab shows paper doll layout with slots positioned spatially
- Clicking a paper doll slot opens the item detail panel
- Empty slots show dim outlines with slot names
- Mobile layout unchanged (bottom nav, no activity bar)
- All existing tests pass
- Typecheck clean

## Open questions

1. Should the activity bar show badges (item count, notification dots)?
2. Should Settings be in the activity bar or just in the "..." menu?
3. Should the paper doll show item icons/art or just text + rarity color?
