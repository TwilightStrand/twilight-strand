# SolvedExile Passive Tree Renderer

Reverse-engineered from the 717 KB chunk `3ci6214gfmuga.js` on 2026-08-03.

## Overview

The tree is rendered using **Canvas 2D** in a single `<canvas>` element managed by a React component (`r9`, a `React.memo` component). All drawing is imperative. No WebGL, no PixiJS. The component carries ~200 `useRef` and `useState` hooks managing camera state, sprite atlases, node maps, interaction state, and cached render layers.

## Camera / Zoom / Pan

### State
Camera state lives in a ref (`Z`):
```js
Z.current = { x: 0, y: 0, scale: 0.15 }
// x, y = world offset from canvas center
// scale = zoom factor (range 0.02 to 1.5)
```

### Mouse wheel zoom
Zoom uses exponential scaling centered on the cursor:
```js
// on wheel event
let newScale = Math.max(0.02, Math.min(1.5, oldScale * Math.exp(-0.001 * deltaY)));
let dx = mouseX - canvasWidth / 2;
let dy = mouseY - canvasHeight / 2;
newPos = {
  x: dx - (dx - oldX) / oldScale * newScale,
  y: dy - (dy - oldY) / oldScale * newScale,
  scale: newScale
};
```

The position is clamped by `aG()` which enforces bounds based on tree extents (`sp.current`).

After zoom, a 160 ms "settling" timer fires a full re-render pass.

### Touch gestures
- **Pinch zoom**: Two-finger distance ratio drives scale. Center of pinch is the zoom origin.
- **Single-finger pan**: Tracks touch position, updates `Z.current.x/y` with clamping.
- **Momentum/inertia**: On touch release, velocity is tracked via an exponential decay (`0.92` per frame). The fling loop runs via `requestAnimationFrame` until velocity < 10.
- **Double-tap to zoom**: Detects two taps within 350 ms and < 30 px apart. Zooms to 2x current scale.

## Sprite Atlas System

### Atlas loading
The tree uses sprite atlases (texture sheets) loaded as images. Each atlas has a coordinate map:
```js
coords = {
  "PassiveSkillScreenDexNodeInactive": { x: 0, y: 0, w: 64, h: 64 },
  "PassiveSkillScreenStrNodeAllocated": { x: 64, y: 0, w: 64, h: 64 },
  ...
}
```

### Atlases loaded
| Atlas | Image file | Purpose |
|-------|-----------|---------|
| normalActiveAtlas | skills-3.jpg | Active (allocated) small nodes |
| notableActiveAtlas | skills-3.jpg | Active notable nodes |
| keystoneActiveAtlas | skills-3.jpg | Active keystone nodes |
| normalInactiveAtlas | skills-disabled-3.jpg | Inactive small nodes |
| notableInactiveAtlas | skills-disabled-3.jpg | Inactive notable nodes |
| keystoneInactiveAtlas | skills-disabled-3.jpg | Inactive keystone nodes |
| masteryInactiveAtlas | mastery-3.png | Inactive mastery nodes |
| masteryActiveSelectedAtlas | mastery-active-selected-3.png | Selected mastery nodes |
| masteryConnectedAtlas | mastery-connected-3.png | Connected mastery nodes |
| masteryActiveEffectAtlas | mastery-active-effect-3.png | Active mastery effect glow |
| frameAtlas | frame-3.png | Node frames (rings) |
| lineAtlas | line-3.png | Connection line textures |
| backgroundAtlas | background-3.png | Tree background texture |
| groupBackgroundAtlas | group-background-3.png | Group orbit ring backgrounds |

### Atlas coordinate remapping
If the actual loaded image dimensions differ from the manifest, coordinates are remapped:
```js
function eo(coords, image, expectedW, expectedH) {
  let scaleX = actualW < expectedW ? actualW / expectedW : 1;
  let scaleY = actualH < expectedH ? actualH / expectedH : 1;
  // Remap each sprite rect
}
```

### Active image brightness boosting
Active node atlases are enhanced via Canvas `filter`:
```js
// Active nodes: boost brightness/contrast
a(activeImage, "brightness(1.08) contrast(1.1)");
// Inactive nodes: stronger boost when used as "preview" overlays
a(inactiveImage, "brightness(1.22) contrast(1.22) saturate(1.15)");
```

## Node Position Calculation

Nodes are positioned using PoE's orbit system. Each node belongs to a group and has an orbit index:
```js
function R(node) {
  let group = groups[node.group];
  let radius = orbitRadii[node.orbit || 0];
  let angle = orbitAngles[node.orbit]?.[node.orbitIndex] || 0;
  
  // Two formats: new (radians from north) or classic (radians from east)
  if (newFormat) {
    return { x: group.x + radius * Math.sin(angle), y: group.y - radius * Math.cos(angle) };
  } else {
    return { x: group.x + radius * Math.cos(angle), y: group.y + radius * Math.sin(angle) };
  }
}
```

### Spatial index for hit testing
Nodes are bucketed into a grid (200-unit cells) for fast lookup:
```js
function rD(nodes) {
  let grid = new Map();
  for (let node of nodes) {
    let key = `${Math.floor(node.x / 200)},${Math.floor(node.y / 200)}`;
    grid.get(key)?.push(node) ?? grid.set(key, [node]);
  }
  return grid;
}
```

Hit testing queries the grid cell and neighbors:
```js
function nk(clientX, clientY) {
  // Transform client coords to world coords
  let worldX = (localX - canvasW / 2 - camera.x) / camera.scale;
  let worldY = (localY - canvasH / 2 - camera.y) / camera.scale;
  
  // Search nearby grid cells
  let hitRadius = Math.max(60, 15 / camera.scale); // larger at low zoom
  // Find closest node within hit radius
}
```

## Background Sky Rendering

The background is a pre-rendered canvas with multiple procedural layers, generated once (function `a7`):

### Layer 1: Void fill
Solid fill with `voidColor` (default: `#070b14`).

### Layer 2: Nebula pools (radial gradients)
Three elliptical nebula pools placed at fixed positions with radial gradients:
```js
a(0.5, 0.45, 1.4, 1.1, [[0, "#090d18"], [0.55, "#060a11"], [1, "#04060b"]]);
a(0.55, 0.45, 0.7, 0.6, [[0, "rgba(46, 140, 172, 0.05)"], ...]);
a(0.80, 0.78, 0.85, 0.75, [[0, "rgba(118, 96, 224, 0.08)"], ...]);
```

### Layer 3: Procedural nebulae (per-pixel)
Three nebula clouds with procedural noise:
- **Noise**: Multi-octave value noise on a 384x384 grid, smoothstep interpolated
- **Colors**: Two-color blend per nebula (e.g. `[70,120,255]` to `[142,105,255]`)
- **Compositing**: Alpha-blended per-pixel into an ImageData buffer
- **Dithering**: Bayer 8x8 ordered dither pattern applied to avoid banding

### Layer 4: Aurora (optional)
Vertical gradient bands along the top of the canvas:
```js
// Color varies by position: cyan to purple gradient
let r = Math.round(56 + 94 * t);
let g = Math.round(198 - 102 * t);
let b = Math.round(208 + 47 * t);
// Drawn as thin vertical rectangles with linear gradient fill
```
Includes shimmer animation data for animated aurora strips (up to 64 strips).

### Layer 5: Stars
Procedural star field with:
- **Color distribution**: blue-white spectrum (176,196,255 at 42%; 255,255,255 at 20%; etc.)
- **Clustering**: 7 random cluster centers, stars drawn from Gaussian distribution around clusters
- **Size**: 0.4-1.2 px radius, with radial gradient glow
- **Density**: Configurable via `starDensity` (default: canvas_area / 2400 stars)
- **Bright stars**: 11 larger stars (1-1.8 px) placed randomly

### Layer 6: Shooting stars (animated)
Two repeating shooting star configs with different cycle times:
```js
[
  { cycleMs: 41000, delayMs: 9000, activeFrac: 0.03, angleDeg: 19, dist: 0.28 },
  { cycleMs: 67000, delayMs: 31000, activeFrac: 0.025, angleDeg: 158, dist: 0.24 }
]
```

## Theme System (Dark + Day)

Two complete theme configs: `a3` (dark/night) and `a6` (day/light). Each defines all rendering colors:

### Dark theme (selected colors)
```js
a3 = {
  edgeUnalloc: "#37476b",
  edgePreview: "#8aa6d8",
  allocBloomCols: ["#6fb4ff", "#8ecdff", "#bfe0ff"],
  allocCore: "#f0f8ff",
  dotUnalloc: "#2c333d",
  dotAlloc: "#c8ced5",
  hoverGlow: "rgba(232, 236, 240, 0.3)",
  suggestAddGlow: "#00ff44",
  suggestRemoveGlow: "#ff2222",
  // ... 60+ properties
}
```

### Day theme changes
- Inverted brightness: darker nodes on light background
- Alloc bloom shifts from light blue to deep blue
- Stage fallback: `#d5d2c9` (warm grey)
- `starCoreWhitePull: false` (stars don't brighten)

Theme switches on `tb` (the theme name). Special "nostalgia" and "daybreak" modes supported.

## Node Rendering

Drawing uses `ctx.drawImage(atlas, sx, sy, sw, sh, dx, dy, dw, dh)` to blit sprite regions.

### Node types and their visual states
| Type | Inactive | Allocated | Hover | Node Power |
|------|----------|-----------|-------|------------|
| small | Grey dot | Bright dot + bloom | Glow ring | Color overlay |
| notable | Grey icon | Icon + bloom + halo | Glow ring | Color overlay |
| keystone | Grey icon | Icon + large bloom | Glow ring | Color overlay |
| mastery | Dim ring | Selected ring + effect glow | Popup glow | N/A |
| jewel | Socket frame | Socket + jewel icon | Tooltip | N/A |
| class start | Class emblem | Class emblem (lit) | N/A | N/A |

### Allocated node bloom effect
Multi-layer radial gradient glow:
```js
allocGlowBigStops: [
  [0, "rgba(180, 224, 255, 0.55)"],
  [0.45, "rgba(120, 185, 255, 0.15)"],
  [1, "rgba(120, 185, 255, 0)"]
]
```

### Edge drawing
Edges between nodes use the `lineAtlas` sprite for textured connections. Edge colors depend on state:
- Unallocated: `edgeUnalloc` (#37476b dark)
- Preview (hover path): `edgePreview` (#8aa6d8)
- Allocated: bloom animation with multiple passes

## Node Power Heatmap

Node power data arrives as a map from the engine (`nodePowerData` prop). The component receives:
- `nodePowerMode`: "off" | "dps" | "defence" | "both"
- `nodePowerData`: Map of nodeId -> { o: number, d: number } (offence/defence deltas)
- `nodePowerMetric`: specific stat key or null (combined offence+defence)
- `nodePowerSweeping`: boolean (animation while computing)

The heat value maps a normalized 0-1 range to a color gradient (orange for low to green for high values, matching the UI's color bar).

## Node Selection / Path Finding

When a user clicks an unallocated node, the tree calculates the shortest path from the current allocation to that node:

```js
function rN(targetId, isDealloc, currentAllocation, nodeMap, reachabilityFn, ...) {
  if (isDealloc) {
    // Remove node, check if tree stays connected
    let newSet = new Set(currentAllocation);
    newSet.delete(targetId);
    let reachable = reachabilityFn(newSet);
    for (let id of newSet) if (!reachable.has(id)) newSet.delete(id);
    return newSet;
  }
  
  // BFS from target to any allocated node
  let queue = [targetId];
  let visited = new Map([[targetId, null]]);
  while (queue.length) {
    let current = queue.shift();
    if (currentAllocation.has(current)) {
      // Trace path back
      let path = new Set(currentAllocation);
      let node = current;
      while (node) { path.add(node); node = visited.get(node); }
      return path;
    }
    for (let neighbor of nodeMap.get(current).connections) {
      if (!visited.has(neighbor)) { visited.set(neighbor, current); queue.push(neighbor); }
    }
  }
}
```

## Stat Delta Preview on Hover

When hovering an unallocated node, the component:
1. Computes the proposed allocation (current + path to hovered node)
2. Sends both current and proposed node sets to the engine
3. Engine returns `BuildStats` for both
4. UI computes deltas:

```js
function rd(oldStats, newStats) {
  let deltas = [];
  // Full DPS delta
  let fullDpsDelta = getDisplayedFullDps(newStats) - getDisplayedFullDps(oldStats);
  // Combined DPS delta
  let combinedDelta = getSelectedCombinedDps(newStats) - getSelectedCombinedDps(oldStats);
  
  // Check each stat:
  // Life, ES, Mana, Armour, Evasion, Crit,
  // Fire/Cold/Lightning/Chaos Res,
  // Phys Reduction, Block, Spell Block, Suppression,
  // Life Regen, Move Speed, Str/Dex/Int
  
  for (let [label, key, format] of statList) {
    let delta = newStats[key] - oldStats[key];
    if (Math.abs(delta) > 0.01) deltas.push({ label, value: delta, format });
  }
  return deltas;
}
```

The preview uses a debounced 120 ms timer to avoid excessive engine calls during fast mouse movement.

## Performance Optimizations

### DPR (Device Pixel Ratio) scaling
Quality levels: `[1.5, 1.25, 1]`. Low-perf mode forces 1x.

### Render path classification
The renderer tracks which render path was used:
```js
paths: { blit: 0, overlay: 0, cheap: 0, full: 0 }
```
- **blit**: Fast path, just blit cached layer
- **overlay**: Redraw overlay layer only (hover changes)
- **cheap**: Partial redraw (nearby nodes only)
- **full**: Complete redraw (zoom/pan changes, theme switch)

### FPS tracking
```js
th.current = { frames: 0, lastTime: performance.now(), fps: 0, frameMs: 0, edges: 0, nodes: 0, ... }
```
Target frame rate: 24 fps (`a9 = 1000/24`).

### Cache invalidation
Multiple generation counters (`tU.current++`) track when cached layers need rebuilding. Camera "settling" uses a 200 ms debounce before triggering full render.

## Timeless Jewel / Legion Overlays

Timeless jewel overrides are rendered as a separate sprite layer loaded on demand:
- Legion sprite manifests fetched separately
- `tattooActiveEffect` atlas for tattoo glows
- Special rendering for split personality jewels, leap jewels, and abyss jewels
- Each type has its own bloom and edge colors in the theme config

## Key Takeaways for Reimplementation

1. **Canvas 2D is sufficient.** No WebGL needed for good performance. The main optimization is caching the background and only redrawing changed layers.

2. **Sprite atlases are the standard approach.** GGG provides the sprite sheets; the coordinate maps define which rect to blit for each node state.

3. **The spatial index (grid bucketing) is essential** for performant hit testing at any zoom level.

4. **The procedural sky is purely cosmetic** but adds a lot of visual polish. A simpler background would be fine for v1.

5. **The zoom math is standard** for infinite-canvas UIs: exponential zoom centered on cursor, with clamped bounds.

6. **Two theme configs** means every color is parameterized. This is good practice for any implementation.

7. **Node power overlay** is just a color-mapped overlay on top of the normal node rendering. The expensive part is the engine computation, not the rendering.
