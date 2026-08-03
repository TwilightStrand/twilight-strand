export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

const MIN_ZOOM = 0.015;
const MAX_ZOOM = 1.5;
const ZOOM_SPEED = 0.001;

export function createCamera(bounds: {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}): Camera {
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
    zoom: 0.04,
  };
}

export function zoomCamera(
  cam: Camera,
  delta: number,
  canvasX: number,
  canvasY: number,
  canvasW: number,
  canvasH: number
): Camera {
  const oldZoom = cam.zoom;
  const newZoom = Math.max(
    MIN_ZOOM,
    Math.min(MAX_ZOOM, oldZoom * Math.exp(-delta * ZOOM_SPEED))
  );

  const worldX = cam.x + (canvasX - canvasW / 2) / oldZoom;
  const worldY = cam.y + (canvasY - canvasH / 2) / oldZoom;

  return {
    x: worldX - (canvasX - canvasW / 2) / newZoom,
    y: worldY - (canvasY - canvasH / 2) / newZoom,
    zoom: newZoom,
  };
}

export function panCamera(
  cam: Camera,
  dx: number,
  dy: number
): Camera {
  return {
    x: cam.x - dx / cam.zoom,
    y: cam.y - dy / cam.zoom,
    zoom: cam.zoom,
  };
}

export function worldToScreen(
  cam: Camera,
  worldX: number,
  worldY: number,
  canvasW: number,
  canvasH: number
): { x: number; y: number } {
  return {
    x: (worldX - cam.x) * cam.zoom + canvasW / 2,
    y: (worldY - cam.y) * cam.zoom + canvasH / 2,
  };
}

export function screenToWorld(
  cam: Camera,
  screenX: number,
  screenY: number,
  canvasW: number,
  canvasH: number
): { x: number; y: number } {
  return {
    x: cam.x + (screenX - canvasW / 2) / cam.zoom,
    y: cam.y + (screenY - canvasH / 2) / cam.zoom,
  };
}
