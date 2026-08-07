"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useBuildStore } from "@/stores/build-store";
import { useTreeStore } from "@/stores/tree-store";
import { NodePowerControls, useNodePowerStore } from "./NodePowerControls";
import { TreeMinimap } from "./TreeMinimap";
import { TreeOptimizer } from "./TreeOptimizer";
import { TreeSearch } from "./TreeSearch";
import { TreeSpecBar } from "./TreeSpecBar";
import { type Camera, createCamera, frameBounds, panCamera, screenToWorld, zoomCamera } from "./tree-camera";
import type { TreeNode } from "./tree-data";
import { parseTreeData, type TreeData } from "./tree-data";
import { TreeRenderer } from "./tree-renderer";
import { SpatialGrid } from "./tree-spatial";

let cachedTreeData: TreeData | null = null;
let treeDataPromise: Promise<TreeData> | null = null;

function getTreeData(): Promise<TreeData> {
  if (cachedTreeData) return Promise.resolve(cachedTreeData);
  if (treeDataPromise) return treeDataPromise;
  treeDataPromise = (async () => {
    const resp = await fetch("/data/tree/tree-3_29.json");
    if (!resp.ok) throw new Error(`Failed to load tree data: ${resp.status}`);
    const raw = await resp.json();
    cachedTreeData = parseTreeData(raw);
    return cachedTreeData;
  })();
  return treeDataPromise;
}

function AllocatedKeystones({ treeData }: { treeData: TreeData | null }) {
  const allocatedNodes = useTreeStore((s) => s.allocatedNodes);

  if (!treeData || allocatedNodes.size === 0) return null;

  const keystones: Array<{ id: string; name: string }> = [];
  for (const nodeId of allocatedNodes) {
    const node = treeData.nodes.get(nodeId);
    if (node?.isKeystone) {
      keystones.push({ id: nodeId, name: node.name || nodeId });
    }
  }

  if (keystones.length === 0) return null;

  return (
    <div className="absolute top-14 left-3 z-10 bg-bg-card/90 backdrop-blur border border-border-subtle rounded p-2 max-w-48">
      <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-amber-400/70">Keystones</span>
      <div className="mt-1 space-y-0.5">
        {keystones.map((ks) => (
          <div key={ks.id} className="text-[10px] font-mono text-text-primary truncate">
            {ks.name}
          </div>
        ))}
      </div>
    </div>
  );
}

function PointCounter({ treeData }: { treeData: import("./tree-data").TreeData | null }) {
  const allocatedNodes = useTreeStore((s) => s.allocatedNodes);
  const level = useBuildStore((s) => s.stats?.level) ?? 1;
  const totalPoints = Math.max(0, level - 1) + 22;
  const usedPoints = allocatedNodes.size > 1 ? allocatedNodes.size - 1 : 0;

  if (usedPoints === 0 && level <= 1) return null;

  let normal = 0,
    notable = 0,
    keystone = 0,
    jewel = 0;
  if (treeData) {
    for (const nodeId of allocatedNodes) {
      const node = treeData.nodes.get(nodeId);
      if (!node) continue;
      if (node.isKeystone) keystone++;
      else if (node.isNotable) notable++;
      else if (node.isJewelSocket) jewel++;
      else normal++;
    }
    if (normal > 0) normal--; // subtract class start node
  }

  return (
    <div className="absolute bottom-3 left-3 z-10 bg-bg-card/90 backdrop-blur rounded px-2.5 py-1.5 text-xs font-mono text-text-dim border border-border-subtle">
      <div>
        <span className="text-text-primary">{usedPoints}</span>
        <span className="text-text-dim"> / {totalPoints} pts</span>
      </div>
      {treeData && allocatedNodes.size > 1 && (
        <div className="flex items-center gap-2 text-[9px] text-text-dim/60 mt-0.5">
          {normal > 0 && <span>{normal} small</span>}
          {notable > 0 && <span className="text-accent/60">{notable} notable</span>}
          {keystone > 0 && <span className="text-amber-400/60">{keystone} keystone</span>}
          {jewel > 0 && <span className="text-purple-400/60">{jewel} jewel</span>}
          {usedPoints > 0 && notable + keystone > 0 && (
            <span className="text-text-dim/40 ml-1" title="Notable+keystone ratio to total points">
              {Math.round(((notable + keystone * 2) / usedPoints) * 100)}% eff
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function TreeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<TreeRenderer | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const spatialRef = useRef<SpatialGrid | null>(null);
  const treeDataRef = useRef<TreeData | null>(null);
  const rafRef = useRef<number>(0);
  const cameraTargetRef = useRef<Camera | null>(null);
  const cameraAnimRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const dragDistRef = useRef(0);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const touchRef = useRef({
    lastDist: 0,
    startTime: 0,
    startPos: { x: 0, y: 0 },
    longPressTimer: 0 as ReturnType<typeof setTimeout> | 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    node: TreeNode;
    x: number;
    y: number;
  } | null>(null);

  const { allocatedNodes, toggleNode, setHoveredNode } = useTreeStore();
  const hoveredNode = useTreeStore((s) => s.hoveredNode);
  const searchResults = useTreeStore((s) => s.searchResults);
  const { mode: npMode, depth: npDepth } = useNodePowerStore();
  const nodePowerMode = useNodePowerStore((s) => s.mode);
  const _nodePowerDepth = useNodePowerStore((s) => s.depth);
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [cameraState, setCameraState] = useState<Camera | null>(null);
  const [canvasDims, setCanvasDims] = useState({ w: 0, h: 0 });
  const [nodeDelta, setNodeDelta] = useState<{ dps: number; life: number; es: number; ehp: number } | null>(null);
  const stats = useBuildStore((s) => s.stats);

  // Compute node power delta via Rust engine when hovering
  const rustBridgeRef = useRef<typeof import("@/engine/rust-bridge") | null>(null);
  useEffect(() => {
    import("@/engine/rust-bridge").then((mod) => {
      rustBridgeRef.current = mod;
    });
  }, []);

  useEffect(() => {
    setNodeDelta(null);
    if (!hoveredNode || !stats || !treeData) return;
    const node = treeData.nodes.get(hoveredNode);
    if (!node?.stats?.length || allocatedNodes.has(hoveredNode)) return;

    const bridge = rustBridgeRef.current;
    if (!bridge?.isRustEngineReady()) return;

    const baseMods: Array<{ stat: string; value: number; mod_type: string }> = [];
    const baseInput = bridge.defaultRustInput({
      level: stats.level,
      base_str: stats.strength,
      base_dex: stats.dexterity,
      base_int: stats.intelligence,
      modifiers: baseMods,
      ascendancy_name: stats.ascendancy || "",
    });
    const base = bridge.evaluateBuildRust(baseInput);
    if (!base) return;

    const nodeMods = (node.stats || []).flatMap((s: string) => bridge.parseStatLine(s));
    const withInput = { ...baseInput, modifiers: [...baseMods, ...nodeMods] };
    const withNode = bridge.evaluateBuildRust(withInput);
    if (!withNode) return;

    setNodeDelta({
      dps: withNode.total_dps - base.total_dps,
      life: withNode.life - base.life,
      es: withNode.energy_shield - base.energy_shield,
      ehp: withNode.total_ehp - base.total_ehp,
    });
  }, [hoveredNode, stats, treeData, allocatedNodes]);

  const lastCamUpdateRef = useRef(0);

  const draw = useCallback(() => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!renderer || !camera) return;
    renderer.setAllocatedNodes(allocatedNodes);
    renderer.setSearchResults(searchResults);
    renderer.setHoveredNode(hoveredNode);
    renderer.render(camera);

    // Throttle React state updates to max 30fps to avoid re-render churn
    const now = performance.now();
    if (now - lastCamUpdateRef.current > 33) {
      lastCamUpdateRef.current = now;
      setCameraState({ ...camera });
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        setCanvasDims({ w: rect.width, h: rect.height });
      }
    }
  }, [allocatedNodes, searchResults, hoveredNode]);

  const animateCameraTo = useCallback(
    (target: Camera) => {
      cameraTargetRef.current = target;
      if (cameraAnimRef.current) return;

      const step = () => {
        const t = cameraTargetRef.current;
        const cam = cameraRef.current;
        if (!t || !cam) {
          cameraAnimRef.current = null;
          return;
        }

        const LERP = 0.15;
        cam.x += (t.x - cam.x) * LERP;
        cam.y += (t.y - cam.y) * LERP;
        cam.zoom += (t.zoom - cam.zoom) * LERP;

        if (Math.abs(t.x - cam.x) < 1 && Math.abs(t.y - cam.y) < 1 && Math.abs(t.zoom - cam.zoom) < 0.001) {
          cam.x = t.x;
          cam.y = t.y;
          cam.zoom = t.zoom;
          cameraTargetRef.current = null;
          cameraAnimRef.current = null;
          draw();
          return;
        }
        draw();
        cameraAnimRef.current = requestAnimationFrame(step);
      };
      cameraAnimRef.current = requestAnimationFrame(step);
    },
    [draw],
  );

  const runAnimationLoop = useCallback(() => {
    const renderer = rendererRef.current;
    if (!renderer?.hasActiveAnimations()) return;
    draw();
    requestAnimationFrame(runAnimationLoop);
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const renderer = rendererRef.current;
    const tree = treeDataRef.current;
    if (!renderer || !tree) return;

    if (nodePowerMode === "off") {
      renderer.setNodePower(new Map(), "off");
      draw();
      return;
    }

    const { setScoring } = useNodePowerStore.getState();
    setScoring(true);

    // Use Rust WASM engine for real node power scoring
    (async () => {
      const power = new Map<string, number>();
      let scored = 0;

      try {
        const { isRustEngineReady, evaluateBuildRust, parseStatLine, defaultRustInput } = await import(
          "@/engine/rust-bridge"
        );
        const stats = useBuildStore.getState().stats;

        if (isRustEngineReady() && stats) {
          const baseInput = defaultRustInput({
            level: stats.level,
            ascendancy_name: stats.ascendancy || "",
          });

          const baseOutput = evaluateBuildRust(baseInput);

          if (baseOutput) {
            for (const [nid, node] of tree.nodes) {
              if (allocatedNodes.has(nid)) continue;
              if (node.ascendancyName) continue;
              if (!node.stats || node.stats.length === 0) continue;

              const nodeMods = node.stats.flatMap((s: string) => {
                const parsed = parseStatLine(s);
                return Array.isArray(parsed) ? parsed : [];
              });

              if (nodeMods.length === 0) continue;

              const withNode = evaluateBuildRust({
                ...baseInput,
                modifiers: nodeMods,
              });

              if (!withNode) continue;

              let val = 0;
              if (nodePowerMode === "dps") {
                val = baseOutput.total_dps > 0 ? (withNode.total_dps - baseOutput.total_dps) / baseOutput.total_dps : 0;
              } else if (nodePowerMode === "defence") {
                val = baseOutput.total_ehp > 0 ? (withNode.total_ehp - baseOutput.total_ehp) / baseOutput.total_ehp : 0;
              } else {
                const dpsPct =
                  baseOutput.total_dps > 0 ? (withNode.total_dps - baseOutput.total_dps) / baseOutput.total_dps : 0;
                const ehpPct =
                  baseOutput.total_ehp > 0 ? (withNode.total_ehp - baseOutput.total_ehp) / baseOutput.total_ehp : 0;
                val = dpsPct + ehpPct;
              }

              if (Math.abs(val) > 0.0001) {
                // Normalize: typical node gives 0-5%, scale to 0-1
                power.set(nid, Math.min(1, Math.max(0, val / 0.05)));
                scored++;
              }
            }
          }
        }
      } catch {
        // Rust engine not available - fall back to empty heatmap
      }

      // If Rust engine didn't score any nodes, heatmap stays empty
      // (Rust WASM must be loaded for real node power scoring)

      renderer.setNodePower(power, nodePowerMode);
      setScoring(false, scored);
      draw();
    })();
  }, [nodePowerMode, allocatedNodes, draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let destroyed = false;

    async function init() {
      try {
        // Skip if already initialized (prevents zoom reset on re-renders)
        if (rendererRef.current) {
          setLoading(false);
          return;
        }

        const treeData = await getTreeData();

        treeDataRef.current = treeData;

        const renderer = new TreeRenderer(canvas!, treeData);
        const spatial = new SpatialGrid(treeData.nodes);

        cameraRef.current = createCamera(treeData.bounds);
        rendererRef.current = renderer;
        spatialRef.current = spatial;

        renderer.resize();
        await renderer.loadSprites();

        renderer.render(cameraRef.current);
        if (!destroyed) {
          setTreeData(treeData);
          setLoading(false);
        }
      } catch (e) {
        if (!destroyed) setError(String(e));
      }
    }

    init();

    const handleResize = () => {
      rendererRef.current?.resize();
      draw();
    };
    window.addEventListener("resize", handleResize);

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cam = cameraRef.current;
      if (!cam || !canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      cameraRef.current = zoomCamera(cam, e.deltaY, x, y, rect.width, rect.height);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    };
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      destroyed = true;
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("wheel", handleWheel);
      cancelAnimationFrame(rafRef.current);
      rendererRef.current?.destroy();
    };
  }, [draw]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragDistRef.current = 0;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // synthetic events may not have a valid pointer id
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const cam = cameraRef.current;
      const canvas = canvasRef.current;

      if (isDraggingRef.current && cam) {
        const dx = e.clientX - lastMouseRef.current.x;
        const dy = e.clientY - lastMouseRef.current.y;
        dragDistRef.current += Math.abs(dx) + Math.abs(dy);
        lastMouseRef.current = { x: e.clientX, y: e.clientY };

        cameraRef.current = panCamera(cam, dx, dy);
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(draw);
        setTooltip(null);
        return;
      }

      if (!cam || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = screenToWorld(cam, sx, sy, rect.width, rect.height);
      const node = spatialRef.current?.findNodeAt(world.x, world.y) ?? null;

      setHoveredNode(node?.id ?? null);

      if (node?.name) {
        setTooltip({ node, x: e.clientX, y: e.clientY });
      } else {
        setTooltip(null);
      }
    },
    [draw, setHoveredNode],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const wasClick = dragDistRef.current < 5;
      isDraggingRef.current = false;

      if (!wasClick) return;

      const cam = cameraRef.current;
      const canvas = canvasRef.current;
      if (!cam || !canvas) return;

      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = screenToWorld(cam, sx, sy, rect.width, rect.height);
      const node = spatialRef.current?.findNodeAt(world.x, world.y) ?? null;

      if (node?.name) {
        const wasAllocated = allocatedNodes.has(node.id);
        toggleNode(node.id);
        if (rendererRef.current) {
          rendererRef.current.addAnimation(node.x, node.y, wasAllocated ? "deallocate" : "allocate");
          requestAnimationFrame(runAnimationLoop);
        }
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(draw);
      }
    },
    [toggleNode, draw, allocatedNodes, runAnimationLoop],
  );

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-deep z-10">
          <div className="text-center">
            <div className="text-accent font-mono text-sm animate-pulse">Loading passive tree...</div>
            <div className="text-text-dim text-xs mt-1 font-mono">3,390 nodes</div>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-deep z-10">
          <div className="text-blood font-mono text-sm">{error}</div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        tabIndex={0}
        aria-label="Passive skill tree"
        className="w-full h-full block cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          isDraggingRef.current = false;
          setTooltip(null);
          setHoveredNode(null);
        }}
        onTouchStart={(e) => {
          if (e.touches.length === 2) {
            e.preventDefault();
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            touchRef.current.lastDist = Math.sqrt(dx * dx + dy * dy);
          } else if (e.touches.length === 1) {
            touchRef.current.startTime = Date.now();
            touchRef.current.startPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            clearTimeout(touchRef.current.longPressTimer);
            const touch = e.touches[0];
            touchRef.current.longPressTimer = setTimeout(() => {
              const cam = cameraRef.current;
              const canvas = canvasRef.current;
              if (!cam || !canvas) return;
              const rect = canvas.getBoundingClientRect();
              const world = screenToWorld(
                cam,
                touch.clientX - rect.left,
                touch.clientY - rect.top,
                rect.width,
                rect.height,
              );
              const node = spatialRef.current?.findNodeAt(world.x, world.y) ?? null;
              if (node?.name) {
                toggleNode(node.id);
                cancelAnimationFrame(rafRef.current);
                rafRef.current = requestAnimationFrame(draw);
              }
            }, 500);
          }
        }}
        onTouchMove={(e) => {
          clearTimeout(touchRef.current.longPressTimer);
          if (e.touches.length === 2) {
            e.preventDefault();
            const cam = cameraRef.current;
            if (!cam) return;
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (touchRef.current.lastDist > 0) {
              const scale = dist / touchRef.current.lastDist;
              const _cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
              const _cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
              const rect = canvasRef.current?.getBoundingClientRect();
              if (rect) {
                const newZoom = Math.max(0.1, Math.min(5, cam.zoom * scale));
                cameraRef.current = { ...cam, zoom: newZoom };
                cancelAnimationFrame(rafRef.current);
                rafRef.current = requestAnimationFrame(draw);
              }
            }
            touchRef.current.lastDist = dist;
          }
        }}
        onTouchEnd={() => {
          clearTimeout(touchRef.current.longPressTimer);
          touchRef.current.lastDist = 0;
        }}
        onKeyDown={(e) => {
          const cam = cameraRef.current;
          if (!cam) return;
          const step = 50 / cam.zoom;
          switch (e.key) {
            case "ArrowUp":
              cameraRef.current = panCamera(cam, 0, step);
              break;
            case "ArrowDown":
              cameraRef.current = panCamera(cam, 0, -step);
              break;
            case "ArrowLeft":
              cameraRef.current = panCamera(cam, step, 0);
              break;
            case "ArrowRight":
              cameraRef.current = panCamera(cam, -step, 0);
              break;
            case "+":
            case "=":
              cameraRef.current = { ...cam, zoom: Math.min(5, cam.zoom * 1.15) };
              break;
            case "-":
              cameraRef.current = { ...cam, zoom: Math.max(0.1, cam.zoom / 1.15) };
              break;
            default:
              return;
          }
          e.preventDefault();
          cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(draw);
        }}
      />
      <TreeSearch
        treeData={treeData}
        onNavigateToNode={(nodeId) => {
          const tree = treeDataRef.current;
          if (!tree || !cameraRef.current) return;
          const node = tree.nodes.get(nodeId);
          if (!node) return;
          animateCameraTo({ x: node.x, y: node.y, zoom: Math.max(cameraRef.current.zoom, 0.6) });
        }}
      />
      <AllocatedKeystones treeData={treeData} />
      <TreeOptimizer />
      <TreeSpecBar />
      <div className="absolute bottom-14 left-3 z-10 flex items-center gap-1">
        <button
          onClick={() => {
            const cam = cameraRef.current;
            if (!cam) return;
            cameraRef.current = { ...cam, zoom: Math.min(5, cam.zoom * 1.25) };
            cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(draw);
          }}
          className="w-7 h-7 flex items-center justify-center bg-bg-card/90 backdrop-blur border border-border-subtle rounded text-text-dim hover:text-accent text-sm font-mono transition-colors"
          title="Zoom in"
        >
          +
        </button>
        <span className="text-[10px] font-mono text-text-dim bg-bg-card/90 px-1.5 py-1 rounded border border-border-subtle min-w-[40px] text-center tabular-nums">
          {cameraState ? `${Math.round(cameraState.zoom * 100)}%` : "..."}
        </span>
        <button
          onClick={() => {
            const cam = cameraRef.current;
            if (!cam) return;
            cameraRef.current = { ...cam, zoom: Math.max(0.1, cam.zoom / 1.25) };
            cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(draw);
          }}
          className="w-7 h-7 flex items-center justify-center bg-bg-card/90 backdrop-blur border border-border-subtle rounded text-text-dim hover:text-accent text-sm font-mono transition-colors"
          title="Zoom out"
        >
          -
        </button>
        <button
          onClick={() => {
            const tree = treeDataRef.current;
            const canvas = canvasRef.current;
            if (!tree || !canvas || allocatedNodes.size < 2) return;
            let minX = Infinity,
              maxX = -Infinity,
              minY = Infinity,
              maxY = -Infinity;
            for (const nid of allocatedNodes) {
              const node = tree.nodes.get(nid);
              if (!node) continue;
              minX = Math.min(minX, node.x);
              maxX = Math.max(maxX, node.x);
              minY = Math.min(minY, node.y);
              maxY = Math.max(maxY, node.y);
            }
            if (!Number.isFinite(minX)) return;
            const rect = canvas.getBoundingClientRect();
            animateCameraTo(frameBounds({ minX, maxX, minY, maxY }, rect.width, rect.height));
          }}
          className="text-[10px] font-mono text-text-dim hover:text-accent px-2 py-1 rounded bg-bg-card/90 border border-border-subtle hover:border-accent/30 transition-colors ml-1"
          title="Center on allocated nodes"
        >
          Center
        </button>
        <button
          onClick={() => {
            if (allocatedNodes.size > 1 && window.confirm("Reset all allocated nodes?")) {
              useTreeStore.getState().resetTree();
              draw();
            }
          }}
          className="text-[10px] font-mono text-text-dim hover:text-blood px-2 py-1 rounded bg-bg-card/90 border border-border-subtle hover:border-blood/30 transition-colors"
          title="Reset tree allocation"
        >
          Reset
        </button>
      </div>
      <PointCounter treeData={treeData} />
      <NodePowerControls />
      {tooltip && (
        <div
          ref={(el) => {
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            let left = tooltip.x + 16;
            let top = tooltip.y - 8;
            if (left + rect.width > vw - 8) left = tooltip.x - rect.width - 16;
            if (top + rect.height > vh - 8) top = vh - rect.height - 8;
            if (left < 8) left = 8;
            if (top < 8) top = 8;
            el.style.left = `${left}px`;
            el.style.top = `${top}px`;
          }}
          className="fixed z-20 pointer-events-none"
          style={{
            left: tooltip.x + 16,
            top: tooltip.y - 8,
          }}
        >
          <div className="bg-bg-card/95 backdrop-blur border border-border-card rounded-lg shadow-xl p-3 max-w-72">
            <div className="flex items-center gap-2 mb-1">
              {tooltip.node.isKeystone && (
                <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400 bg-amber-400/10 px-1.5 rounded">
                  Keystone
                </span>
              )}
              {tooltip.node.isNotable && !tooltip.node.isKeystone && (
                <span className="text-[9px] font-mono uppercase tracking-wider text-accent bg-accent/10 px-1.5 rounded">
                  Notable
                </span>
              )}
              {tooltip.node.isJewelSocket && (
                <span className="text-[9px] font-mono uppercase tracking-wider text-purple-400 bg-purple-400/10 px-1.5 rounded">
                  Jewel
                </span>
              )}
              {allocatedNodes.has(tooltip.node.id) && (
                <span className="text-[9px] font-mono uppercase tracking-wider text-green-400">Allocated</span>
              )}
            </div>
            <h4 className="text-sm font-mono font-bold text-text-heading mb-1.5">{tooltip.node.name}</h4>
            {tooltip.node.stats && tooltip.node.stats.length > 0 && (
              <div className="space-y-0.5">
                {tooltip.node.stats.map((stat, i) => (
                  <div key={i} className="text-xs font-mono text-accent-dim">
                    {stat}
                  </div>
                ))}
              </div>
            )}
            {nodeDelta &&
              !allocatedNodes.has(tooltip.node.id) &&
              (nodeDelta.dps !== 0 || nodeDelta.life !== 0 || nodeDelta.es !== 0) && (
                <div className="border-t border-border-subtle mt-1.5 pt-1.5 space-y-0.5">
                  <span className="text-[8px] font-mono text-text-dim/50 uppercase">Stat Delta (Rust)</span>
                  {nodeDelta.life !== 0 && (
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-text-dim">Life</span>
                      <span className={nodeDelta.life > 0 ? "text-green-400" : "text-red-400"}>
                        {nodeDelta.life > 0 ? "+" : ""}
                        {Math.round(nodeDelta.life)}
                      </span>
                    </div>
                  )}
                  {nodeDelta.es !== 0 && (
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-text-dim">ES</span>
                      <span className={nodeDelta.es > 0 ? "text-green-400" : "text-red-400"}>
                        {nodeDelta.es > 0 ? "+" : ""}
                        {Math.round(nodeDelta.es)}
                      </span>
                    </div>
                  )}
                  {nodeDelta.dps !== 0 && (
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-text-dim">DPS</span>
                      <span className={nodeDelta.dps > 0 ? "text-green-400" : "text-red-400"}>
                        {nodeDelta.dps > 0 ? "+" : ""}
                        {Math.round(nodeDelta.dps)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            {!allocatedNodes.has(tooltip.node.id) &&
              treeData &&
              (() => {
                const nodeId = tooltip.node.id;
                const adjacent = treeData.connections.some(
                  (c) =>
                    (c.from === nodeId && allocatedNodes.has(c.to)) || (c.to === nodeId && allocatedNodes.has(c.from)),
                );
                if (!adjacent && allocatedNodes.size > 1) {
                  // BFS up to depth 3
                  const visited = new Set([nodeId]);
                  let frontier = [nodeId];
                  for (let depth = 1; depth <= 3; depth++) {
                    const next: string[] = [];
                    for (const cur of frontier) {
                      for (const c of treeData.connections) {
                        const neighbor = c.from === cur ? c.to : c.to === cur ? c.from : null;
                        if (!neighbor || visited.has(neighbor)) continue;
                        if (allocatedNodes.has(neighbor)) {
                          return (
                            <span className="text-[9px] font-mono text-text-dim mt-1 block">
                              {depth} {depth === 1 ? "point" : "points"} away
                            </span>
                          );
                        }
                        visited.add(neighbor);
                        next.push(neighbor);
                      }
                    }
                    frontier = next;
                  }
                  return null;
                }
                return adjacent ? (
                  <span className="text-[9px] font-mono text-green-400/70 mt-1 block">Click to allocate</span>
                ) : null;
              })()}
          </div>
        </div>
      )}
      {treeData && (
        <TreeMinimap
          nodes={Array.from(treeData.nodes.values()).map((n) => ({ x: n.x, y: n.y, id: n.id }))}
          bounds={treeData.bounds}
          camera={cameraState}
          canvasWidth={canvasDims.w}
          canvasHeight={canvasDims.h}
          onNavigate={(wx, wy) => {
            if (!cameraRef.current) return;
            cameraRef.current = { ...cameraRef.current, x: wx, y: wy };
            cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(draw);
          }}
        />
      )}
    </div>
  );
}
