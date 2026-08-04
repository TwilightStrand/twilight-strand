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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    node: TreeNode;
    x: number;
    y: number;
  } | null>(null);

  const { allocatedNodes, toggleNode, setHoveredNode } = useTreeStore();
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
    renderer.render(camera);
    setCameraState({ ...camera });
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      setCanvasDims({ w: rect.width, h: rect.height });
    }
  }, [allocatedNodes, searchResults]);

  useEffect(() => {
    draw();
  }, [allocatedNodes, draw]);

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
        className="w-full h-full block cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          isDraggingRef.current = false;
          setTooltip(null);
          setHoveredNode(null);
        }}
      />
      <TreeSearch treeData={treeData} />
      <TreeSpecBar />
      <div className="absolute bottom-14 left-3 z-10 flex gap-1">
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
          className="text-[10px] font-mono text-text-dim hover:text-accent px-2 py-1 rounded bg-bg-card/80 border border-border-subtle hover:border-accent/30 transition-colors"
          title="Center on allocated nodes"
        >
          Center
        </button>
      </div>
      <PointCounter />
      <NodePowerControls />
      {tooltip && (
        <div
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
