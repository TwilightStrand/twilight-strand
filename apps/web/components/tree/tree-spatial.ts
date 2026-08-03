import type { TreeNode } from "./tree-data";

const CELL_SIZE = 200;

export class SpatialGrid {
  private cells = new Map<string, TreeNode[]>();
  private nodeRadius: Map<string, number>;

  constructor(nodes: Map<string, TreeNode>) {
    this.nodeRadius = new Map();

    for (const [nid, node] of nodes) {
      if (node.classStartIndex !== undefined && !node.name) continue;

      let radius = 26;
      if (node.isKeystone) radius = 52;
      else if (node.isNotable || node.isJewelSocket) radius = 38;
      else if (node.isMastery) radius = 40;

      this.nodeRadius.set(nid, radius);

      const minCX = Math.floor((node.x - radius) / CELL_SIZE);
      const maxCX = Math.floor((node.x + radius) / CELL_SIZE);
      const minCY = Math.floor((node.y - radius) / CELL_SIZE);
      const maxCY = Math.floor((node.y + radius) / CELL_SIZE);

      for (let cx = minCX; cx <= maxCX; cx++) {
        for (let cy = minCY; cy <= maxCY; cy++) {
          const key = `${cx},${cy}`;
          let cell = this.cells.get(key);
          if (!cell) {
            cell = [];
            this.cells.set(key, cell);
          }
          cell.push(node);
        }
      }
    }
  }

  findNodeAt(worldX: number, worldY: number): TreeNode | null {
    const cx = Math.floor(worldX / CELL_SIZE);
    const cy = Math.floor(worldY / CELL_SIZE);

    let closest: TreeNode | null = null;
    let closestDist = Infinity;

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const cell = this.cells.get(`${cx + dx},${cy + dy}`);
        if (!cell) continue;

        for (const node of cell) {
          const r = this.nodeRadius.get(node.id) ?? 26;
          const distSq = (node.x - worldX) ** 2 + (node.y - worldY) ** 2;
          if (distSq <= r * r && distSq < closestDist) {
            closest = node;
            closestDist = distSq;
          }
        }
      }
    }

    return closest;
  }
}
