import type { Camera } from "./tree-camera";
import { worldToScreen } from "./tree-camera";
import type { SpriteCoord, SpriteSheet, TreeData, TreeNode } from "./tree-data";

const NODE_RADIUS_NORMAL = 26;
const NODE_RADIUS_NOTABLE = 38;
const NODE_RADIUS_KEYSTONE = 52;
const NODE_RADIUS_MASTERY = 40;

const COLOR_LINE = "rgba(100, 120, 160, 0.35)";
const COLOR_LINE_ALLOCATED = "rgba(200, 180, 100, 0.8)";
const COLOR_NODE_NORMAL = "#2a3a5c";
const COLOR_NODE_NOTABLE = "#3a4a6c";
const COLOR_NODE_KEYSTONE = "#4a3a2c";
const COLOR_NODE_MASTERY = "#3c4c6e";
const COLOR_NODE_JEWEL = "#5a3a5c";
const COLOR_NODE_CLASS_START = "#2a4a3c";
const COLOR_NODE_BORDER = "rgba(100, 130, 180, 0.5)";
const COLOR_NODE_BORDER_NOTABLE = "rgba(180, 160, 100, 0.7)";
const COLOR_NODE_BORDER_KEYSTONE = "rgba(200, 170, 80, 0.8)";
const COLOR_BG = "#050810";

interface SpriteAtlas {
  image: HTMLImageElement;
  coords: Record<string, SpriteCoord>;
}

export class TreeRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tree: TreeData;
  private dpr: number;
  private atlases: Map<string, SpriteAtlas> = new Map();
  private allocatedNodes: Set<string> = new Set();
  private spriteSheets: Map<string, SpriteSheet> = new Map();
  private groupBgImages: Map<string, HTMLImageElement> = new Map();
  private nodePower: Map<string, number> = new Map();
  private nodePowerMode: "off" | "dps" | "defence" | "both" = "off";
  private searchResults: Set<string> = new Set();
  private hoveredNode: string | null = null;
  private animations: Array<{ x: number; y: number; startTime: number; type: "allocate" | "deallocate" }> = [];
  private staticCanvas: HTMLCanvasElement | null = null;
  private staticCtx: CanvasRenderingContext2D | null = null;
  private staticDirty = true;
  private lastStaticCam: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 0 };

  constructor(canvas: HTMLCanvasElement, tree: TreeData) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context not available");
    this.ctx = ctx;
    this.tree = tree;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.indexSpriteSheets();
  }

  private indexSpriteSheets(): void {
    const sprites = this.tree.sprites;
    const PREFERRED_ZOOM = "0.3835";
    const FALLBACK_ZOOM = "0.2972";

    for (const [category, zoomLevels] of Object.entries(sprites)) {
      if (typeof zoomLevels !== "object" || zoomLevels === null) continue;

      const levels = zoomLevels as Record<string, SpriteSheet | SpriteSheet[]>;
      const entry = levels[PREFERRED_ZOOM] ?? levels[FALLBACK_ZOOM] ?? Object.values(levels).pop();

      if (!entry) continue;

      // GGG tree JSON uses single objects per zoom level, not arrays
      const sheet: SpriteSheet = Array.isArray(entry) ? entry[0] : entry;
      if (sheet?.filename && sheet?.coords) {
        this.spriteSheets.set(category, sheet);
      }
    }
  }

  async loadSprites(): Promise<void> {
    const filenames = new Set<string>();
    for (const sheet of this.spriteSheets.values()) {
      if (sheet.filename) filenames.add(sheet.filename);
    }

    const loads = Array.from(filenames).map(async (url) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      const localUrl = this.resolveUrl(url);
      img.src = localUrl;
      await new Promise<void>((resolve, _reject) => {
        img.onload = () => resolve();
        img.onerror = () => {
          console.warn(`Failed to load sprite: ${localUrl}`);
          resolve();
        };
      });
      return { url, img };
    });

    const results = await Promise.all(loads);
    for (const { url, img } of results) {
      if (img.complete && img.naturalWidth > 0) {
        for (const [cat, sheet] of this.spriteSheets.entries()) {
          if (sheet.filename === url) {
            this.atlases.set(cat, { image: img, coords: sheet.coords });
          }
        }
      }
    }

    // Load group background images
    const bgFiles = ["PSGroupBackground1.png", "PSGroupBackground2.png", "PSGroupBackground3.png"];
    const bgLoads = bgFiles.map(async (name) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = `/data/pob/TreeData/${name}`;
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
      return { name, img };
    });
    const bgResults = await Promise.all(bgLoads);
    for (const { name, img } of bgResults) {
      if (img.complete && img.naturalWidth > 0) {
        this.groupBgImages.set(name, img);
      }
    }
  }

  private resolveUrl(url: string): string {
    if (url.startsWith("http")) {
      const filename = url.split("/").pop()?.split("?")[0] ?? "";
      return `/data/passive-skill/${filename}`;
    }
    return url;
  }

  setAllocatedNodes(nodes: Set<string>): void {
    if (nodes !== this.allocatedNodes) {
      this.allocatedNodes = nodes;
      this.staticDirty = true;
    }
  }

  setSearchResults(results: Set<string>): void {
    if (results !== this.searchResults) {
      this.searchResults = results;
      this.staticDirty = true;
    }
  }

  setNodePower(power: Map<string, number>, mode: "off" | "dps" | "defence" | "both"): void {
    this.nodePower = power;
    this.nodePowerMode = mode;
    this.staticDirty = true;
  }

  setHoveredNode(nodeId: string | null): void {
    this.hoveredNode = nodeId;
  }

  addAnimation(x: number, y: number, type: "allocate" | "deallocate"): void {
    this.animations.push({ x, y, startTime: performance.now(), type });
  }

  hasActiveAnimations(): boolean {
    return this.animations.length > 0;
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
  }

  render(camera: Camera): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    const cw = w / this.dpr;
    const ch = h / this.dpr;

    // Check if camera moved enough to invalidate static cache
    const camChanged =
      this.lastStaticCam.x !== camera.x || this.lastStaticCam.y !== camera.y || this.lastStaticCam.zoom !== camera.zoom;

    if (camChanged || this.staticDirty) {
      this.lastStaticCam = { x: camera.x, y: camera.y, zoom: camera.zoom };

      // Render static layer (backgrounds + connections + nodes)
      if (!this.staticCanvas || this.staticCanvas.width !== w || this.staticCanvas.height !== h) {
        this.staticCanvas = document.createElement("canvas");
        this.staticCanvas.width = w;
        this.staticCanvas.height = h;
        this.staticCtx = this.staticCanvas.getContext("2d");
      }

      const sctx = this.staticCtx!;
      sctx.clearRect(0, 0, w, h);
      sctx.save();
      sctx.scale(this.dpr, this.dpr);

      sctx.fillStyle = COLOR_BG;
      sctx.fillRect(0, 0, cw, ch);

      this.drawGroupBackgrounds(sctx, camera, cw, ch);
      this.drawClassStartAreas(sctx, camera, cw, ch);
      this.drawConnections(sctx, camera, cw, ch);
      this.drawNodes(sctx, camera, cw, ch);

      sctx.restore();
      this.staticDirty = false;
    }

    // Composite static layer
    ctx.resetTransform();
    if (this.staticCanvas) {
      ctx.drawImage(this.staticCanvas, 0, 0);
    }

    // Draw hover highlight on top (dynamic, not cached)
    ctx.scale(this.dpr, this.dpr);
    if (this.hoveredNode) {
      const hNode = this.tree.nodes.get(this.hoveredNode);
      if (hNode) {
        const hPos = worldToScreen(camera, hNode.x, hNode.y, cw, ch);
        const hRadius = this.getNodeRadius(hNode) * camera.zoom;
        ctx.strokeStyle = "rgba(6, 182, 212, 0.9)";
        ctx.lineWidth = Math.max(2, hRadius * 0.15);
        ctx.shadowColor = "rgba(6, 182, 212, 0.5)";
        ctx.shadowBlur = hRadius * 0.6;
        ctx.beginPath();
        ctx.arc(hPos.x, hPos.y, hRadius + 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }
    }

    this.drawAnimations(ctx, camera, cw, ch);

    ctx.restore();
  }

  private isVisible(sx: number, sy: number, radius: number, cw: number, ch: number): boolean {
    return sx + radius > 0 && sx - radius < cw && sy + radius > 0 && sy - radius < ch;
  }

  private drawGroupBackgrounds(ctx: CanvasRenderingContext2D, cam: Camera, cw: number, ch: number): void {
    if (this.groupBgImages.size === 0) return;

    const orbitRadii = this.tree.constants.orbitRadii;

    for (const [, group] of this.tree.groups) {
      if (!group.background) continue;

      const { x: sx, y: sy } = worldToScreen(cam, group.x, group.y, cw, ch);

      // Size based on the group's max orbit radius
      const maxOrbit = Math.max(...group.orbits, 0);
      const worldRadius = (orbitRadii[maxOrbit] ?? 150) + 60;
      const screenRadius = worldRadius * cam.zoom;

      if (!this.isVisible(sx, sy, screenRadius, cw, ch)) continue;
      if (screenRadius < 4) continue;

      const bgImage = group.background.image;
      let imgName: string;
      if (bgImage.includes("3") || bgImage.includes("Large")) {
        imgName = "PSGroupBackground3.png";
      } else if (bgImage.includes("2") || bgImage.includes("Medium")) {
        imgName = "PSGroupBackground2.png";
      } else {
        imgName = "PSGroupBackground1.png";
      }

      const img = this.groupBgImages.get(imgName);
      if (!img) continue;

      const size = screenRadius * 2;
      const halfImage = group.background.isHalfImage;

      ctx.save();
      ctx.globalAlpha = 0.15;
      if (halfImage) {
        ctx.drawImage(img, sx - size / 2, sy - size, size, size);
      } else {
        ctx.drawImage(img, sx - size / 2, sy - size / 2, size, size);
      }
      ctx.restore();
    }
  }

  private drawClassStartAreas(ctx: CanvasRenderingContext2D, cam: Camera, cw: number, ch: number): void {
    for (const [, nodeId] of this.tree.classStartNodes) {
      const node = this.tree.nodes.get(nodeId);
      if (!node) continue;
      const { x: sx, y: sy } = worldToScreen(cam, node.x, node.y, cw, ch);
      const radius = 120 * cam.zoom;
      if (!this.isVisible(sx, sy, radius, cw, ch)) continue;

      const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius);
      const isAlloc = this.allocatedNodes.has(nodeId);
      if (isAlloc) {
        gradient.addColorStop(0, "rgba(212, 160, 36, 0.08)");
        gradient.addColorStop(1, "rgba(212, 160, 36, 0)");
      } else {
        gradient.addColorStop(0, "rgba(100, 130, 180, 0.05)");
        gradient.addColorStop(1, "rgba(100, 130, 180, 0)");
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawConnections(ctx: CanvasRenderingContext2D, cam: Camera, cw: number, ch: number): void {
    // Batch connections by visual style to minimize stroke() calls
    const batches: Array<{
      style: string;
      width: number;
      path: Path2D;
    }> = [];

    const batchMap = new Map<string, { style: string; width: number; path: Path2D }>();

    const pad = 200;
    const hoverBatch = new Path2D();
    let hasHover = false;

    for (const conn of this.tree.connections) {
      const fromNode = this.tree.nodes.get(conn.from);
      const toNode = this.tree.nodes.get(conn.to);
      if (!fromNode || !toNode) continue;

      const from = worldToScreen(cam, fromNode.x, fromNode.y, cw, ch);
      const to = worldToScreen(cam, toNode.x, toNode.y, cw, ch);

      if (
        Math.max(from.x, to.x) < -pad ||
        Math.min(from.x, to.x) > cw + pad ||
        Math.max(from.y, to.y) < -pad ||
        Math.min(from.y, to.y) > ch + pad
      )
        continue;

      const isHoverConn = this.hoveredNode !== null && (conn.from === this.hoveredNode || conn.to === this.hoveredNode);

      if (isHoverConn) {
        hoverBatch.moveTo(from.x, from.y);
        hoverBatch.lineTo(to.x, to.y);
        hasHover = true;
        continue;
      }

      const fromAlloc = this.allocatedNodes.has(conn.from);
      const toAlloc = this.allocatedNodes.has(conn.to);
      const bothAllocated = fromAlloc && toAlloc;
      const oneAllocated = fromAlloc || toAlloc;
      const isAscendancy = !!(fromNode.ascendancyName || toNode.ascendancyName);

      let key: string;
      if (bothAllocated) {
        key = isAscendancy ? "alloc-asc" : "alloc";
      } else if (oneAllocated) {
        key = isAscendancy ? "half-asc" : "half";
      } else {
        key = isAscendancy ? "none-asc" : "none";
      }

      let batch = batchMap.get(key);
      if (!batch) {
        let style: string;
        let width: number;
        if (bothAllocated) {
          style = isAscendancy ? "rgba(212, 160, 36, 0.9)" : COLOR_LINE_ALLOCATED;
          width = Math.max(1.5, 2.5 * cam.zoom);
        } else if (oneAllocated) {
          style = isAscendancy ? "rgba(212, 160, 36, 0.3)" : "rgba(200, 180, 100, 0.35)";
          width = Math.max(1, 1.5 * cam.zoom);
        } else {
          style = isAscendancy ? "rgba(212, 160, 36, 0.12)" : COLOR_LINE;
          width = Math.max(1, 1 * cam.zoom);
        }
        batch = { style, width, path: new Path2D() };
        batchMap.set(key, batch);
        batches.push(batch);
      }

      batch.path.moveTo(from.x, from.y);
      batch.path.lineTo(to.x, to.y);
    }

    // Draw batched: unallocated first, then partial, then full, then hover on top
    for (const batch of batches) {
      ctx.strokeStyle = batch.style;
      ctx.lineWidth = batch.width;
      ctx.stroke(batch.path);
    }

    if (hasHover) {
      ctx.strokeStyle = "rgba(6, 182, 212, 0.8)";
      ctx.lineWidth = Math.max(2, 2.5 * cam.zoom);
      ctx.stroke(hoverBatch);
    }
  }

  private drawNodes(ctx: CanvasRenderingContext2D, cam: Camera, cw: number, ch: number): void {
    const minZoomForLabels = 0.15;
    const minZoomForIcons = 0.06;

    // Two-pass: batch unallocated normal nodes, then draw special/allocated individually
    const normalRadius = NODE_RADIUS_NORMAL * cam.zoom;
    const normalFillPath = new Path2D();
    const normalBorderPath = new Path2D();
    let hasNormalNodes = false;

    // Collect deferred items for second pass
    const deferred: Array<{ nid: string; node: TreeNode; sx: number; sy: number; radius: number; allocated: boolean }> =
      [];

    for (const [nid, node] of this.tree.nodes) {
      if (node.classStartIndex !== undefined && !node.name) continue;

      const screenPos = worldToScreen(cam, node.x, node.y, cw, ch);
      const radius = this.getNodeRadius(node) * cam.zoom;

      if (!this.isVisible(screenPos.x, screenPos.y, radius + 4, cw, ch)) continue;
      if (radius < 1) continue;

      const allocated = this.allocatedNodes.has(nid);
      const isSpecial =
        node.isNotable ||
        node.isKeystone ||
        node.isMastery ||
        node.isJewelSocket ||
        node.ascendancyName ||
        allocated ||
        (this.nodePowerMode !== "off" && this.nodePower.has(nid));

      if (!isSpecial) {
        // Batch into a single path
        normalFillPath.moveTo(screenPos.x + normalRadius, screenPos.y);
        normalFillPath.arc(screenPos.x, screenPos.y, normalRadius, 0, Math.PI * 2);
        normalBorderPath.moveTo(screenPos.x + normalRadius + 0.5, screenPos.y);
        normalBorderPath.arc(screenPos.x, screenPos.y, normalRadius + 0.5, 0, Math.PI * 2);
        hasNormalNodes = true;
      } else {
        deferred.push({ nid, node, sx: screenPos.x, sy: screenPos.y, radius, allocated });
      }
    }

    // Draw batched normal nodes (single fill + stroke)
    if (hasNormalNodes) {
      ctx.fillStyle = COLOR_NODE_NORMAL;
      ctx.fill(normalFillPath);
      ctx.strokeStyle = COLOR_NODE_BORDER;
      ctx.lineWidth = Math.max(0.5, normalRadius * 0.06);
      ctx.stroke(normalBorderPath);
    }

    // Draw special/allocated nodes individually
    for (const { nid, node, sx, sy, radius, allocated } of deferred) {
      if (this.nodePowerMode !== "off" && !allocated) {
        const power = this.nodePower.get(nid);
        if (power !== undefined) {
          this.drawHeatmapGlow(ctx, sx, sy, radius, power);
        }
      }

      if (node.isJewelSocket) {
        this.drawJewelSocket(ctx, sx, sy, radius, allocated);
      } else if (node.isMastery) {
        this.drawMasteryStar(ctx, sx, sy, radius, allocated);
      } else {
        this.drawNodeCircle(ctx, sx, sy, radius, node, allocated);
      }

      if (this.searchResults.size > 0 && this.searchResults.has(nid)) {
        ctx.save();
        ctx.strokeStyle = "rgba(0, 200, 255, 0.9)";
        ctx.lineWidth = Math.max(2, radius * 0.2);
        ctx.shadowColor = "rgba(0, 200, 255, 0.6)";
        ctx.shadowBlur = radius * 0.8;
        ctx.beginPath();
        ctx.arc(sx, sy, radius + 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Icons and labels in a separate pass (text rendering is expensive, group it)
    if (cam.zoom >= minZoomForIcons) {
      for (const { node, sx, sy, radius, allocated } of deferred) {
        if (node.icon) {
          this.drawNodeIcon(ctx, sx, sy, radius, node, allocated);
        }
      }
    }

    if (cam.zoom >= minZoomForLabels) {
      const fontSize = Math.max(9, (11 * cam.zoom) / 0.15);
      ctx.font = `${fontSize}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = "center";
      for (const { node, sx, sy, radius, allocated } of deferred) {
        if (node.name && (node.isNotable || node.isKeystone)) {
          ctx.fillStyle = allocated ? "rgba(255, 230, 150, 0.9)" : "rgba(180, 190, 210, 0.7)";
          ctx.fillText(node.name, sx, sy + radius + Math.max(10, (14 * cam.zoom) / 0.15));
        }
      }
    }
  }

  private getNodeRadius(node: TreeNode): number {
    if (node.isKeystone) return NODE_RADIUS_KEYSTONE;
    if (node.isNotable) return NODE_RADIUS_NOTABLE;
    if (node.isMastery) return NODE_RADIUS_MASTERY;
    if (node.isJewelSocket) return NODE_RADIUS_NOTABLE;
    return NODE_RADIUS_NORMAL;
  }

  private drawJewelSocket(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    allocated: boolean,
  ): void {
    const size = radius * 0.85;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);

    if (allocated) {
      ctx.shadowColor = "rgba(168, 85, 247, 0.5)";
      ctx.shadowBlur = radius * 0.8;
      ctx.fillStyle = "#6d28d9";
      ctx.strokeStyle = "#a78bfa";
    } else {
      ctx.fillStyle = "rgba(88, 48, 132, 0.25)";
      ctx.strokeStyle = "rgba(168, 85, 247, 0.45)";
    }

    ctx.lineWidth = Math.max(1.5, radius * 0.1);
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.strokeRect(-size / 2, -size / 2, size, size);

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawMasteryStar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    allocated: boolean,
  ): void {
    const spikes = 6;
    const outerR = radius * 0.85;
    const innerR = outerR * 0.5;

    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    if (allocated) {
      ctx.shadowColor = "rgba(245, 158, 11, 0.5)";
      ctx.shadowBlur = radius * 0.6;
      ctx.fillStyle = "#b45309";
      ctx.fill();
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = Math.max(1, radius * 0.08);
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(245, 158, 11, 0.08)";
      ctx.fill();
      ctx.strokeStyle = "rgba(245, 158, 11, 0.3)";
      ctx.lineWidth = Math.max(0.5, radius * 0.05);
      ctx.stroke();
    }

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
  }

  private drawNodeCircle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    node: TreeNode,
    allocated: boolean,
  ): void {
    let fill: string;
    let border: string;

    if (node.isKeystone) {
      fill = allocated ? "#5a4a2c" : COLOR_NODE_KEYSTONE;
      border = COLOR_NODE_BORDER_KEYSTONE;
    } else if (node.isNotable) {
      fill = allocated ? "#4a4a3c" : COLOR_NODE_NOTABLE;
      border = COLOR_NODE_BORDER_NOTABLE;
    } else if (node.isMastery) {
      fill = COLOR_NODE_MASTERY;
      border = "rgba(60, 76, 110, 0.6)";
    } else if (node.isJewelSocket) {
      fill = allocated ? "#6a4a6c" : COLOR_NODE_JEWEL;
      border = "rgba(160, 100, 160, 0.6)";
    } else if (node.classStartIndex !== undefined) {
      fill = COLOR_NODE_CLASS_START;
      border = "rgba(80, 160, 120, 0.5)";
    } else if (node.ascendancyName) {
      fill = allocated ? "#4a3a1c" : "#2a2218";
      border = allocated ? "rgba(212, 160, 36, 0.9)" : "rgba(212, 160, 36, 0.3)";
    } else {
      fill = allocated ? "#3a4a5c" : COLOR_NODE_NORMAL;
      border = COLOR_NODE_BORDER;
    }

    if (allocated) {
      ctx.shadowColor = "rgba(200, 180, 100, 0.4)";
      ctx.shadowBlur = radius * 0.6;
    }

    const power = this.nodePowerMode !== "off" ? this.nodePower.get(node.id) : undefined;
    if (power !== undefined && !allocated) {
      const hue = power * 120;
      fill = `hsl(${hue}, 70%, 25%)`;
      border = `hsl(${hue}, 80%, 45%)`;
      ctx.shadowColor = `hsla(${hue}, 90%, 50%, 0.5)`;
      ctx.shadowBlur = radius * 0.8;
    }

    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    ctx.strokeStyle = border;
    ctx.lineWidth = Math.max(1, radius * 0.08);
    ctx.stroke();
  }

  private drawNodeIcon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    node: TreeNode,
    allocated: boolean,
  ): void {
    if (!node.icon) return;

    const category = allocated ? "normalActive" : "normalInactive";
    if (node.isNotable) {
      const cat = allocated ? "notableActive" : "notableInactive";
      this.drawSpriteIcon(ctx, x, y, radius, node.icon, cat);
      return;
    }
    if (node.isKeystone) {
      const cat = allocated ? "keystoneActive" : "keystoneInactive";
      this.drawSpriteIcon(ctx, x, y, radius, node.icon, cat);
      return;
    }
    if (node.isMastery) {
      this.drawSpriteIcon(ctx, x, y, radius, node.icon, "mastery");
      return;
    }

    this.drawSpriteIcon(ctx, x, y, radius, node.icon, category);
  }

  private drawSpriteIcon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    iconPath: string,
    category: string,
  ): void {
    const atlas = this.atlases.get(category);
    if (!atlas) return;

    const coord = atlas.coords[iconPath];
    if (!coord) return;

    const iconSize = radius * 1.8;

    if (iconSize > 16) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.9, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(
        atlas.image,
        coord.x,
        coord.y,
        coord.w,
        coord.h,
        x - iconSize / 2,
        y - iconSize / 2,
        iconSize,
        iconSize,
      );
      ctx.restore();
    } else {
      ctx.drawImage(
        atlas.image,
        coord.x,
        coord.y,
        coord.w,
        coord.h,
        x - iconSize / 2,
        y - iconSize / 2,
        iconSize,
        iconSize,
      );
    }
  }

  private getHeatColor(value: number): string {
    const t = Math.max(0, Math.min(1, value));
    const alpha = 0.3 + t * 0.5;

    if (this.nodePowerMode === "dps") {
      // Orange -> Yellow -> Bright Green
      const r = Math.round(255 * (1 - t * 0.8));
      const g = Math.round(120 + 135 * t);
      const b = Math.round(40 * (1 - t));
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    if (this.nodePowerMode === "defence") {
      // Dim blue -> Bright cyan
      const r = Math.round(20 * (1 - t));
      const g = Math.round(140 + 80 * t);
      const b = Math.round(180 + 75 * t);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    // Combined: low=warm orange, high=bright green
    if (t < 0.5) {
      const r = 255;
      const g = Math.round(140 + 60 * (t * 2));
      const b = Math.round(50 * (1 - t * 2));
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    const r = Math.round(255 * (1 - (t - 0.5) * 2));
    const g = Math.round(200 + 55 * ((t - 0.5) * 2));
    const b = Math.round(60 * ((t - 0.5) * 2));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private drawHeatmapGlow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, value: number): void {
    const color = this.getHeatColor(value);
    const glowRadius = radius * 2.5;

    ctx.save();
    const gradient = ctx.createRadialGradient(x, y, radius * 0.5, x, y, glowRadius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawAnimations(ctx: CanvasRenderingContext2D, cam: Camera, cw: number, ch: number): void {
    const now = performance.now();
    const DURATION = 400;

    this.animations = this.animations.filter((anim) => {
      const elapsed = now - anim.startTime;
      if (elapsed > DURATION) return false;

      const progress = elapsed / DURATION;
      const { x: sx, y: sy } = worldToScreen(cam, anim.x, anim.y, cw, ch);

      if (!this.isVisible(sx, sy, 60, cw, ch)) return false;

      const radius = (10 + progress * 30) * cam.zoom;
      const alpha = 1 - progress;

      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.strokeStyle =
        anim.type === "allocate" ? `rgba(212, 160, 36, ${alpha * 0.6})` : `rgba(239, 68, 68, ${alpha * 0.4})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      return true;
    });
  }

  destroy(): void {
    this.atlases.clear();
  }
}
