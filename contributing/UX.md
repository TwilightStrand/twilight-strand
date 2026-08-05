# UX Principles

Design guidelines for Twilight Strand. This is a living document; update it as we learn.

## Philosophy

Build planners are inherently complex. The goal is not to hide that complexity but to reveal it progressively, so the first 30 seconds feel simple and the 30th hour still has depth.

We take cues from tools that handle density well: Blender (workspaces, context menus), Figma (inspector panels, command palette), VS Code (activity bar, progressive disclosure), and Linear (keyboard-first, smooth transitions).

## Core principles

### 1. Information hierarchy

Not all data is equally important. The three numbers a player checks first are DPS, Life, and EHP. Everything else is secondary.

**In practice:**
- Hero stat tiles at the top of the sidebar with large type
- Section headers that can collapse (Offence, Defence, Resistances)
- Detail on demand: hover for tooltips, click to expand, double-click to pin

**Anti-pattern:** flat lists where every stat has the same font size and weight.

### 2. Progressive disclosure

Show the 20% of features that cover 80% of use cases. The rest should be one click away, not zero clicks.

**In practice:**
- Config tab shows "relevant" options by default; "All" toggle reveals 576 options
- Analysis tools (PowerReport, UniqueRanker, TreeDiff) are in the Calcs tab, not cluttering the primary tabs
- The header "..." menu contains actions most users need less often (export, markdown, new build)

**Anti-pattern:** every feature visible on every screen.

### 3. Immediate feedback

Every interaction should produce a visible result within 100ms. The user should never wonder "did that work?"

**In practice:**
- Tree node allocation has a particle animation
- Stat values flash cyan when they change
- Config changes show a "Recalculate" banner
- Hover on tree nodes shows a stat delta tooltip via Rust WASM (sub-ms)

**Anti-pattern:** clicking a button and seeing nothing happen for seconds.

### 4. Keyboard-first

Power users live on the keyboard. Every frequent action should have a shortcut.

**In practice:**
- `Ctrl+I` to import
- `?` to show keyboard shortcuts
- Arrow keys navigate tabs
- Search focuses on `Ctrl+F` or `/`

**Future:** command palette (Ctrl+K) for any action by name, like VS Code/Figma/Linear.

### 5. Blueprint aesthetic

The visual language is technical and precise, like a schematic or engineering drawing. Not flashy, not minimal; informational.

**Elements:**
- Dot-grid background (20px spacing, 5-6% opacity)
- Hairline borders (1px, low opacity)
- Monospace typography for data
- Serif display font for headings
- Muted accent color (cyan) with high-contrast use only for active/important states
- Color encodes meaning: red = life/danger, cyan = ES/accent, blue = mana/info, amber = gold/warning

**Anti-pattern:** card shadows, rounded-everything, bright gradients, decorative elements.

### 6. Data comparison everywhere

A build planner's core loop is "what if I change X?" Every stat display should support comparison.

**In practice:**
- "Pin for compare" button snapshots current stats as a baseline
- Tree node hover shows +DPS/+Life delta
- Config changes trigger recalculation with visible before/after
- PowerReport shows DPS%/point for each potential allocation

**Future:** side-by-side delta bars, build timeline showing stat progression.

### 7. Mobile is view-first

Mobile users check builds on the go; they rarely edit on a phone. The mobile experience should prioritize reading stats and browsing the tree, not editing items.

**In practice:**
- Tappable stat summary bar (expands to 9-stat grid)
- Tree is view-only with long-press for tooltips
- Bottom tab navigation
- Import button always visible

**Anti-pattern:** trying to replicate the full desktop editing experience on a 375px screen.

## Component patterns

### Stat tiles
Large number, small label, colored by type. Used for DPS, Life, EHP at the top of the sidebar.

### Collapsible sections
Section header with title and +/- toggle. Default state depends on importance: Offence open, Mitigation closed.

### Analysis panels
Title, controls (mode selector, depth picker), action button ("Analyze"), results table. Always in the Calcs tab, never floating.

### Empty states
Tab-specific icon, title, 3 numbered hints, Import button. Animated ping on the icon.

### Action dropdowns
"..." button that opens a positioned menu. Used for secondary actions that don't need dedicated toolbar space.

## Color system

| Token | Use | Dark value |
|-------|-----|-----------|
| `accent` | Active states, interactive elements | `#4fe3f7` (cyan) |
| `life` | Life pool, HP | `#ff5c45` (red-orange) |
| `es` | Energy shield | `#4fe3f7` (cyan) |
| `mana` | Mana pool | `#7d95ff` (blue) |
| `offence` | DPS, damage stats | `#cfe0ff` (light blue) |
| `defence` | Armour, evasion, mitigation | `#9fb0d8` (muted blue) |
| `strength` | Str attribute | `#ff4d3a` (red) |
| `dexterity` | Dex attribute, capped res | `#5cf07a` (green) |
| `intelligence` | Int attribute | `#7d95ff` (blue) |
| `blood` | Danger, negative, delete | `#ff6b6b` (red) |
| `gold` | Warnings, notable borders | `#8ecdff` (gold-blue) |

## Themes

Four themes, each with a complete token set:
- **Dark** (default) - deep navy, cyan accent
- **Light** - white surface, teal accent
- **Astral** - deep indigo, purple accent
- **Nostalgia** - warm earth tones, amber accent

New themes should define all tokens. Use the dark theme as the reference implementation.

## Patterns from best-in-class tools

Research into Blender, Figma, VS Code, Linear, and D&D Beyond surfaced six patterns worth adopting. Organized by pattern, not by source tool.

### Command palette (VS Code, Figma, Linear)

A single `Ctrl+K` overlay that fuzzy-searches everything: tabs, config options, gem names, unique items, tree nodes, actions (import, export, save). VS Code switches modes with a prefix character (`>` for commands, no prefix for files). For us: no prefix searches nodes/items, `>` searches actions, `/` searches config options. Linear shows recently-used commands first, which helps repeat workflows.

**Status:** not yet implemented. High priority.

### Workspaces (Blender 2.8)

Blender's workspace tabs let users switch between purpose-built layouts (Modeling, Sculpting, Animation). Each workspace remembers which panels are open and how they're sized. For a build planner, 3-4 presets: **Build** (tree + stats), **Gear** (items + skills), **Analyze** (calcs + all analysis tools), **Config** (config + settings). Keyboard shortcuts 1-4 switch between them.

**Status:** partially addressed by tabs, but tabs show individual panels, not combinations. Could evolve toward workspace presets.

### Collapsed analysis cards with badges (Figma, D&D Beyond)

The calcs tab has 6+ analysis sections (PowerReport, ClusterSearch, TreeDiff, UniqueRanker, TimelessSearch, UpgradeSuggester). These should be collapsed accordions with a count badge ("3 upgrades found") so users see what's available without scrolling past empty sections.

**Status:** sections render inline; no collapse or badge counts yet.

### Context menus (Blender, Figma)

Right-click on a tree node: "Allocate / Path to / Show in Power Report / Search Trade." Right-click an item: "Edit / Replace / Price Check / Compare." Right-click a stat: "Pin / Explain / Show Breakdown." Replaces scattered buttons with discoverable per-element menus.

**Status:** not yet implemented.

### Keyboard shortcut hints on hover (Linear)

Show a small shortcut tag when hovering any interactive element. Instead of a separate shortcuts page, shortcuts teach themselves during use. Hover Import shows `Ctrl+I`, hover a tab shows `1-6`, hover search shows `/`.

**Status:** some elements have tooltips, but no systematic shortcut hints.

### Stat block with inline expand (D&D Beyond)

D&D Beyond shows core stats at a glance (HP, AC, speed) with details expanding inline. The sidebar should follow this: hero numbers at top (DPS, Life, EHP), then collapsed sections that expand to show per-type breakdowns. All conditional buffs (flasks, charges, onslaught) grouped in one place.

**Status:** hero tiles implemented. Collapsible sections exist. Conditional grouping not yet done.

## Accessibility

- All interactive elements keyboard-reachable
- Tab labels and stat sections use semantic headings
- Color is never the sole channel for information (always paired with text or icons)
- Minimum contrast ratio 4.5:1 for text on backgrounds
- Canvas tree has ARIA labels; tooltips provide text alternatives
