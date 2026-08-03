"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { parseTreeData, type TreeData } from "./tree-data";
import { createCamera, zoomCamera, panCamera, type Camera } from "./tree-camera";
import { TreeRenderer } from "./tree-renderer";

export function TreeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<TreeRenderer | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const rafRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const draw = useCallback(() => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!renderer || !camera) return;
    renderer.render(camera);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let destroyed = false;

    async function init() {
      try {
        const resp = await fetch("/data/tree/tree-3_29.json");
        if (!resp.ok) throw new Error(`Failed to load tree data: ${resp.status}`);
        const raw = await resp.json();
        if (destroyed) return;

        const treeData: TreeData = parseTreeData(raw);
        const renderer = new TreeRenderer(canvas!, treeData);

        cameraRef.current = createCamera(treeData.bounds);
        rendererRef.current = renderer;

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

    return () => {
      destroyed = true;
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(rafRef.current);
      rendererRef.current?.destroy();
    };
  }, [draw]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const cam = cameraRef.current;
      const canvas = canvasRef.current;
      if (!cam || !canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      cameraRef.current = zoomCamera(cam, e.deltaY, x, y, rect.width, rect.height);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    },
    [draw]
  );

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current || !cameraRef.current) return;

      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };

      cameraRef.current = panCamera(cameraRef.current, dx, dy);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    },
    [draw]
  );

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

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
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
}
