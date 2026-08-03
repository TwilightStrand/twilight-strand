"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { parseTreeData, type TreeData, type TreeNode } from "./tree-data";
import {
  createCamera,
  zoomCamera,
  panCamera,
  screenToWorld,
  type Camera,
} from "./tree-camera";
import { TreeRenderer } from "./tree-renderer";
import { SpatialGrid } from "./tree-spatial";
import { useTreeStore } from "@/stores/tree-store";

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

  const draw = useCallback(() => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!renderer || !camera) return;
    renderer.setAllocatedNodes(allocatedNodes);
    renderer.render(camera);
  }, [allocatedNodes]);

  useEffect(() => {
    draw();
  }, [allocatedNodes, draw]);

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
      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none px-3 py-2 rounded bg-bg-card border border-border-card shadow-lg max-w-xs"
          style={{
            left: tooltip.x + 16,
            top: tooltip.y - 8,
            transform: "translateY(-100%)",
          }}
        >
          <div className="font-mono text-xs font-bold text-text-heading">
            {tooltip.node.name}
          </div>
          {tooltip.node.isKeystone && (
            <span className="text-[9px] font-mono text-amber-400 uppercase tracking-wider">
              Keystone
            </span>
          )}
          {tooltip.node.isNotable && (
            <span className="text-[9px] font-mono text-gold uppercase tracking-wider">
              Notable
            </span>
          )}
          {tooltip.node.stats && tooltip.node.stats.length > 0 && (
            <div className="mt-1 space-y-px">
              {tooltip.node.stats.map((stat, i) => (
                <div key={i} className="text-[10px] text-text-primary">
                  {stat}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
