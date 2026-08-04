"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { parseTreeData, type TreeData } from "./tree-data";
import type { TreeNode } from "./tree-data";
import {
  createCamera,
  zoomCamera,
  panCamera,
  screenToWorld,
  frameBounds,
  type Camera,
} from "./tree-camera";
import { TreeRenderer } from "./tree-renderer";
import { SpatialGrid } from "./tree-spatial";
import { useTreeStore } from "@/stores/tree-store";
import { useBuildStore } from "@/stores/build-store";
import { NodePowerControls, useNodePowerStore } from "./NodePowerControls";
import { TreeSearch } from "./TreeSearch";
import { TreeSpecBar } from "./TreeSpecBar";
import { TreeMinimap } from "./TreeMinimap";

function PointCounter() {
  const allocatedNodes = useTreeStore((s) => s.allocatedNodes);
  const level = useBuildStore((s) => s.stats?.level) ?? 1;
  const totalPoints = Math.max(0, level - 1) + 22;
  const usedPoints = allocatedNodes.size > 1 ? allocatedNodes.size - 1 : 0;

  if (usedPoints === 0 && level <= 1) return null;

  return (
    <div className="absolute bottom-3 left-3 z-10 bg-bg-card/90 backdrop-blur rounded px-2.5 py-1.5 text-xs font-mono text-text-dim border border-border-subtle">
      <span className="text-text-primary">{usedPoints}</span>
      <span className="text-text-dim"> / {totalPoints} pts</span>
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
  const nodePowerDepth = useNodePowerStore((s) => s.depth);
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [cameraState, setCameraState] = useState<Camera | null>(null);
  const [canvasDims, setCanvasDims] = useState({ w: 0, h: 0 });

  const draw = useCallback(() => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!renderer || !camera) return;
    renderer.setAllocatedNodes(allocatedNodes);
    renderer.setSearchResults(searchResults);
    renderer.setHoveredNode(hoveredNode);
    renderer.render(camera);
    setCameraState({ ...camera });
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      setCanvasDims({ w: rect.width, h: rect.height });
    }
  }, [allocatedNodes, searchResults, hoveredNode]);

  useEffect(() => {
    draw();
  }, [allocatedNodes, hoveredNode, draw]);

  useEffect(() => {
    const renderer = rendererRef.current;
    const treeData = treeDataRef.current;
    if (!renderer || !treeData) return;

    if (npMode === "off") {
      renderer.setNodePower(new Map(), "off");
      draw();
      return;
    }

    // Mock node power scoring: assign random-ish values based on node stats
    const { setScoring } = useNodePowerStore.getState();
    setScoring(true);

    requestAnimationFrame(() => {
      const power = new Map<string, number>();
      let count = 0;
      for (const [nid, node] of treeData.nodes) {
        if (allocatedNodes.has(nid)) continue;
        if (!node.stats || node.stats.length === 0) continue;

        // Simple heuristic: score by number of stats and stat text length
        const score = node.stats.reduce((acc, s) => {
          const nums = s.match(/\d+/g);
          return acc + (nums ? nums.reduce((a, n) => a + parseInt(n), 0) : 1);
        }, 0);
        power.set(nid, score);
        count++;
      }

      // Normalize to 0-1
      const maxScore = Math.max(...power.values(), 1);
      for (const [nid, score] of power) {
        power.set(nid, score / maxScore);
      }

      renderer.setNodePower(power, npMode);
      setScoring(false, count);
      draw();
    });
  }, [npMode, npDepth, allocatedNodes, draw]);

  useEffect(() => {
    const renderer = rendererRef.current;
    const tree = treeDataRef.current;
    if (!renderer || !tree) return;

    if (nodePowerMode === "off") {
      renderer.setNodePower(new Map(), "off");
      draw();
      return;
    }

    // Stub heatmap: score nodes by proximity to tree center (placeholder for real engine scoring)
    const { setScoring } = useNodePowerStore.getState();
    setScoring(true);

    const power = new Map<string, number>();
    const cx = (tree.bounds.minX + tree.bounds.maxX) / 2;
    const cy = (tree.bounds.minY + tree.bounds.maxY) / 2;
    const maxDist = Math.max(tree.bounds.maxX - tree.bounds.minX, tree.bounds.maxY - tree.bounds.minY) / 2;

    let scored = 0;
    for (const [nid, node] of tree.nodes) {
      if (allocatedNodes.has(nid)) continue;
      if (node.ascendancyName) continue;
      if (!node.name) continue;

      const dist = Math.sqrt((node.x - cx) ** 2 + (node.y - cy) ** 2);
      const normalizedDist = Math.min(1, dist / maxDist);
      power.set(nid, 1 - normalizedDist);
      scored++;
    }

    renderer.setNodePower(power, nodePowerMode);
    setScoring(false, scored);
    draw();
  }, [nodePowerMode, nodePowerDepth, allocatedNodes, draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let destroyed = false;

    async function init() {
      try {
        const resp = await fetch("/data/tree/tree-3_29.json");
        if (!resp.ok)
          throw new Error(`Failed to load tree data: ${resp.status}`);
        const raw = await resp.json();
        if (destroyed) return;

        const treeData: TreeData = parseTreeData(raw);
        treeDataRef.current = treeData;
        setTreeData(treeData);

        const renderer = new TreeRenderer(canvas!, treeData);
        const spatial = new SpatialGrid(treeData.nodes);

        cameraRef.current = createCamera(treeData.bounds);
        rendererRef.current = renderer;
        spatialRef.current = spatial;

        renderer.resize();
        await renderer.loadSprites();
        if (destroyed) return;

        renderer.render(cameraRef.current);
        setLoading(false);
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

      cameraRef.current = zoomCamera(
        cam,
        e.deltaY,
        x,
        y,
        rect.width,
        rect.height
      );
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

      if (node && node.name) {
        setTooltip({ node, x: e.clientX, y: e.clientY });
      } else {
        setTooltip(null);
      }
    },
    [draw, setHoveredNode]
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

      if (node && node.name) {
        toggleNode(node.id);
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(draw);
      }
    },
    [toggleNode, draw]
  );

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-deep z-10">
          <div className="text-center">
            <div className="text-accent font-mono text-sm animate-pulse">
              Loading passive tree...
            </div>
            <div className="text-text-dim text-xs mt-1 font-mono">
              3,390 nodes
            </div>
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
        role="application"
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
              const world = screenToWorld(cam, touch.clientX - rect.left, touch.clientY - rect.top, rect.width, rect.height);
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
              const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
              const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
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
            case "ArrowUp": cameraRef.current = panCamera(cam, 0, step); break;
            case "ArrowDown": cameraRef.current = panCamera(cam, 0, -step); break;
            case "ArrowLeft": cameraRef.current = panCamera(cam, step, 0); break;
            case "ArrowRight": cameraRef.current = panCamera(cam, -step, 0); break;
            case "+": case "=": cameraRef.current = { ...cam, zoom: Math.min(5, cam.zoom * 1.15) }; break;
            case "-": cameraRef.current = { ...cam, zoom: Math.max(0.1, cam.zoom / 1.15) }; break;
            default: return;
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
          cameraRef.current = { ...cameraRef.current, x: node.x, y: node.y, zoom: Math.max(cameraRef.current.zoom, 0.6) };
          cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(draw);
        }}
      />
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
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            for (const nid of allocatedNodes) {
              const node = tree.nodes.get(nid);
              if (!node) continue;
              minX = Math.min(minX, node.x);
              maxX = Math.max(maxX, node.x);
              minY = Math.min(minY, node.y);
              maxY = Math.max(maxY, node.y);
            }
            if (!isFinite(minX)) return;
            const rect = canvas.getBoundingClientRect();
            cameraRef.current = frameBounds({ minX, maxX, minY, maxY }, rect.width, rect.height);
            draw();
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
      <PointCounter />
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
                <span className="text-[9px] font-mono uppercase tracking-wider text-green-400">
                  Allocated
                </span>
              )}
            </div>
            <h4 className="text-sm font-mono font-bold text-text-heading mb-1.5">
              {tooltip.node.name}
            </h4>
            {tooltip.node.stats && tooltip.node.stats.length > 0 && (
              <div className="space-y-0.5">
                {tooltip.node.stats.map((stat, i) => (
                  <div key={i} className="text-xs font-mono text-accent-dim">
                    {stat}
                  </div>
                ))}
              </div>
            )}
            {!allocatedNodes.has(tooltip.node.id) && treeData && (() => {
              const nodeId = tooltip.node.id;
              const adjacent = treeData.connections.some(
                c => (c.from === nodeId && allocatedNodes.has(c.to)) ||
                     (c.to === nodeId && allocatedNodes.has(c.from))
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
                        return <span className="text-[9px] font-mono text-text-dim mt-1 block">{depth} {depth === 1 ? "point" : "points"} away</span>;
                      }
                      visited.add(neighbor);
                      next.push(neighbor);
                    }
                  }
                  frontier = next;
                }
                return null;
              }
              return adjacent ? <span className="text-[9px] font-mono text-green-400/70 mt-1 block">Click to allocate</span> : null;
            })()}
          </div>
        </div>
      )}
      {treeData && (
        <TreeMinimap
          nodes={Array.from(treeData.nodes.values()).map(n => ({ x: n.x, y: n.y, id: n.id }))}
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
