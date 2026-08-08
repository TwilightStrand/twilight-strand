
import { useRef, useEffect, useCallback } from "react";
import { useTreeStore } from "@/stores/tree-store";
import type { Camera } from "./tree-camera";

interface MinimapNode {
  x: number;
  y: number;
  id: string;
}

interface MinimapProps {
  nodes: MinimapNode[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  camera: Camera | null;
  canvasWidth: number;
  canvasHeight: number;
  onNavigate?: (worldX: number, worldY: number) => void;
}

const SIZE = 130;
const PAD = 4;

export function TreeMinimap({ nodes, bounds, camera, canvasWidth, canvasHeight, onNavigate }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const allocatedNodes = useTreeStore((s) => s.allocatedNodes);

  const treeW = bounds.maxX - bounds.minX;
  const treeH = bounds.maxY - bounds.minY;
  const scale = Math.min((SIZE - PAD * 2) / treeW, (SIZE - PAD * 2) / treeH);
  const offX = (SIZE - treeW * scale) / 2;
  const offY = (SIZE - treeH * scale) / 2;

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !nodes.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, SIZE, SIZE);

    ctx.fillStyle = "rgba(5, 8, 16, 0.9)";
    ctx.fillRect(0, 0, SIZE, SIZE);

    for (const node of nodes) {
      const x = (node.x - bounds.minX) * scale + offX;
      const y = (node.y - bounds.minY) * scale + offY;
      const isAlloc = allocatedNodes.has(node.id);
      ctx.fillStyle = isAlloc ? "#d4a024" : "rgba(100, 120, 140, 0.25)";
      const s = isAlloc ? 2 : 1;
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
    }

    if (camera && canvasWidth > 0 && canvasHeight > 0) {
      const vpW = canvasWidth / camera.zoom;
      const vpH = canvasHeight / camera.zoom;
      const vpX = (camera.x - vpW / 2 - bounds.minX) * scale + offX;
      const vpY = (camera.y - vpH / 2 - bounds.minY) * scale + offY;

      ctx.strokeStyle = "rgba(6, 182, 212, 0.5)";
      ctx.lineWidth = 1;
      ctx.strokeRect(vpX, vpY, vpW * scale, vpH * scale);
    }
  }, [nodes, bounds, camera, canvasWidth, canvasHeight, allocatedNodes, scale, offX, offY]);

  useEffect(() => {
    paint();
  }, [paint]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onNavigate) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const worldX = (mx - offX) / scale + bounds.minX;
      const worldY = (my - offY) / scale + bounds.minY;
      onNavigate(worldX, worldY);
    },
    [onNavigate, scale, offX, offY, bounds]
  );

  if (!nodes.length) return null;

  return (
    <canvas
      ref={canvasRef}
      width={SIZE}
      height={SIZE}
      onClick={handleClick}
      className="absolute bottom-3 right-3 z-10 border border-border-subtle rounded cursor-crosshair"
      style={{ imageRendering: "pixelated", width: SIZE, height: SIZE }}
    />
  );
}
