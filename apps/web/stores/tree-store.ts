import { create } from "zustand";

interface TreeState {
  allocatedNodes: Set<string>;
  hoveredNode: string | null;
  toggleNode: (nodeId: string) => void;
  allocateNode: (nodeId: string) => void;
  deallocateNode: (nodeId: string) => void;
  setHoveredNode: (nodeId: string | null) => void;
  setAllocatedNodes: (nodes: Set<string>) => void;
}

export const useTreeStore = create<TreeState>((set) => ({
  allocatedNodes: new Set<string>(),
  hoveredNode: null,
  toggleNode: (nodeId) =>
    set((s) => {
      const next = new Set(s.allocatedNodes);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return { allocatedNodes: next };
    }),
  allocateNode: (nodeId) =>
    set((s) => {
      if (s.allocatedNodes.has(nodeId)) return s;
      const next = new Set(s.allocatedNodes);
      next.add(nodeId);
      return { allocatedNodes: next };
    }),
  deallocateNode: (nodeId) =>
    set((s) => {
      if (!s.allocatedNodes.has(nodeId)) return s;
      const next = new Set(s.allocatedNodes);
      next.delete(nodeId);
      return { allocatedNodes: next };
    }),
  setHoveredNode: (nodeId) => set({ hoveredNode: nodeId }),
  setAllocatedNodes: (nodes) => set({ allocatedNodes: nodes }),
}));
