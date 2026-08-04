import type { TreeData, TreeNode, SpriteSheet, SpriteCoord } from "./tree-data";
import type { Camera } from "./tree-camera";
import { worldToScreen } from "./tree-camera";

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
  private nodePower: Map<string, number> = new Map();
  private nodePowerMode: "off" | "dps" | "defence" | "both" = "off";
  private searchResults: Set<string> = new Set();
  private hoveredNode: string | null = null;
  private animations: Array<{ x: number; y: number; startTime: number; type: "allocate" | "deallocate" }> = [];

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
      const entry = levels[PREFERRED_ZOOM] ?? levels[FALLBACK_ZOOM] ??
        Object.values(levels).pop();

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
      await new Promise<void>((resolve, reject) => {
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
  }

  private resolveUrl(url: string): string {
    if (url.startsWith("http")) {
      const filename = url.split("/").pop()?.split("?")[0] ?? "";
      return `/data/passive-skill/${filename}`;
    }
    return url;
  }

  setAllocatedNodes(nodes: Set<string>): void {
    this.allocatedNodes = nodes;
  }

  setSearchResults(results: Set<string>): void {
    this.searchResults = results;
  }

  setNodePower(power: Map<string, number>, mode: "off" | "dps" | "defence" | "both"): void {
    this.nodePower = power;
    this.nodePowerMode = mode;
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

    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, cw, ch);

    this.drawClassStartAreas(ctx, camera, cw, ch);
    this.drawConnections(ctx, camera, cw, ch);
    this.drawNodes(ctx, camera, cw, ch);
    this.drawAnimations(ctx, camera, cw, ch);

    ctx.restore();
  }

  private isVisible(
    sx: number,
    sy: number,
    radius: number,
    cw: number,
    ch: number
  ): boolean {
    return (
      sx + radius > 0 &&
      sx - radius < cw &&
      sy + radius > 0 &&
      sy - radius < ch
    );
  }

  private drawClassStartAreas(
    ctx: CanvasRenderingContext2D,
    cam: Camera,
    cw: number,
    ch: number
  ): void {
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

  private drawConnections(
    ctx: CanvasRenderingContext2D,
    cam: Camera,
    cw: number,
    ch: number
  ): void {
    for (const conn of this.tree.connections) {
      const fromNode = this.tree.nodes.get(conn.from);
      const toNode = this.tree.nodes.get(conn.to);
      if (!fromNode || !toNode) continue;

      const from = worldToScreen(cam, fromNode.x, fromNode.y, cw, ch);
      const to = worldToScreen(cam, toNode.x, toNode.y, cw, ch);

      const pad = 200;
      if (
        Math.max(from.x, to.x) < -pad ||
        Math.min(from.x, to.x) > cw + pad ||
        Math.max(from.y, to.y) < -pad ||
        Math.min(from.y, to.y) > ch + pad
      ) continue;

      const fromAlloc = this.allocatedNodes.has(conn.from);
      const toAlloc = this.allocatedNodes.has(conn.to);
      const bothAllocated = fromAlloc && toAlloc;
      const oneAllocated = fromAlloc || toAlloc;

      const isAscendancy = !!(fromNode.ascendancyName || toNode.ascendancyName);
      const isHoverConn = this.hoveredNode !== null &&
        (conn.from === this.hoveredNode || conn.to === this.hoveredNode);

      if (isHoverConn) {
        ctx.strokeStyle = "rgba(6, 182, 212, 0.8)";
        ctx.lineWidth = Math.max(2, 2.5 * cam.zoom);
      } else if (bothAllocated) {
        ctx.strokeStyle = isAscendancy ? "rgba(212, 160, 36, 0.9)" : COLOR_LINE_ALLOCATED;
        ctx.lineWidth = Math.max(1.5, 2.5 * cam.zoom);
      } else if (oneAllocated) {
        ctx.strokeStyle = isAscendancy ? "rgba(212, 160, 36, 0.3)" : "rgba(200, 180, 100, 0.35)";
        ctx.lineWidth = Math.max(1, 1.5 * cam.zoom);
      } else {
        ctx.strokeStyle = isAscendancy ? "rgba(212, 160, 36, 0.12)" : COLOR_LINE;
        ctx.lineWidth = Math.max(1, 1 * cam.zoom);
      }
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
  }

  private drawNodes(
    ctx: CanvasRenderingContext2D,
    cam: Camera,
    cw: number,
    ch: number
  ): void {
    const minZoomForLabels = 0.15;
    const minZoomForIcons = 0.06;

    for (const [nid, node] of this.tree.nodes) {
      if (node.classStartIndex !== undefined && !node.name) continue;

      const screenPos = worldToScreen(cam, node.x, node.y, cw, ch);
      const radius = this.getNodeRadius(node) * cam.zoom;

      if (!this.isVisible(screenPos.x, screenPos.y, radius + 4, cw, ch))
        continue;

      if (radius < 1) continue;

      const allocated = this.allocatedNodes.has(nid);

      if (this.nodePowerMode !== "off" && !allocated) {
        const power = this.nodePower.get(nid);
        if (power !== undefined) {
          this.drawHeatmapGlow(ctx, screenPos.x, screenPos.y, radius, power);
        }
      }

      if (node.isJewelSocket) {
        this.drawJewelSocket(ctx, screenPos.x, screenPos.y, radius, allocated);
      } else if (node.isMastery) {
        this.drawMasteryStar(ctx, screenPos.x, screenPos.y, radius, allocated);
      } else {
        this.drawNodeCircle(ctx, screenPos.x, screenPos.y, radius, node, allocated);
      }

      if (this.searchResults.size > 0 && this.searchResults.has(nid)) {
        ctx.save();
        ctx.strokeStyle = "rgba(0, 200, 255, 0.9)";
        ctx.lineWidth = Math.max(2, radius * 0.2);
        ctx.shadowColor = "rgba(0, 200, 255, 0.6)";
        ctx.shadowBlur = radius * 0.8;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, radius + 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (cam.zoom >= minZoomForIcons && node.icon) {
        this.drawNodeIcon(ctx, screenPos.x, screenPos.y, radius, node, allocated);
      }

      if (cam.zoom >= minZoomForLabels && node.name && (node.isNotable || node.isKeystone)) {
        ctx.fillStyle = allocated
          ? "rgba(255, 230, 150, 0.9)"
          : "rgba(180, 190, 210, 0.7)";
        ctx.font = `${Math.max(9, 11 * cam.zoom / 0.15)}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(
          node.name,
          screenPos.x,
          screenPos.y + radius + Math.max(10, 14 * cam.zoom / 0.15)
        );
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
    allocated: boolean
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
    allocated: boolean
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
    allocated: boolean
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
    allocated: boolean
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
    category: string
  ): void {
    const atlas = this.atlases.get(category);
    if (!atlas) return;

    const coord = atlas.coords[iconPath];
    if (!coord) return;

    const iconSize = radius * 1.8;

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
      iconSize
    );
    ctx.restore();
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

  private drawHeatmapGlow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    value: number
  ): void {
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

  private drawAnimations(
    ctx: CanvasRenderingContext2D,
    cam: Camera,
    cw: number,
    ch: number
  ): void {
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
        anim.type === "allocate"
          ? `rgba(212, 160, 36, ${alpha * 0.6})`
          : `rgba(239, 68, 68, ${alpha * 0.4})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      return true;
    });
  }

  destroy(): void {
    this.atlases.clear();
  }
}
