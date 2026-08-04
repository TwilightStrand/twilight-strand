import { create } from "zustand";

interface TreeState {
  allocatedNodes: Set<string>;
  hoveredNode: string | null;
  searchQuery: string;
  searchResults: Set<string>;
  undoStack: Set<string>[];
  redoStack: Set<string>[];
  toggleNode: (nodeId: string) => void;
  allocateNode: (nodeId: string) => void;
  deallocateNode: (nodeId: string) => void;
  setHoveredNode: (nodeId: string | null) => void;
  setAllocatedNodes: (nodes: Set<string>) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: Set<string>) => void;
  undo: () => void;
  redo: () => void;
}

export const useTreeStore = create<TreeState>((set) => ({
  allocatedNodes: new Set<string>(),
  hoveredNode: null,
  searchQuery: "",
  searchResults: new Set<string>(),
  undoStack: [],
  redoStack: [],
  toggleNode: (nodeId) =>
    set((s) => {
      const next = new Set(s.allocatedNodes);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return {
        allocatedNodes: next,
        undoStack: [...s.undoStack, s.allocatedNodes],
        redoStack: [],
      };
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
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),
  undo: () =>
    set((s) => {
      if (s.undoStack.length === 0) return s;
      const prev = s.undoStack[s.undoStack.length - 1];
      return {
        allocatedNodes: prev,
        undoStack: s.undoStack.slice(0, -1),
        redoStack: [...s.redoStack, s.allocatedNodes],
      };
    }),
  redo: () =>
    set((s) => {
      if (s.redoStack.length === 0) return s;
      const next = s.redoStack[s.redoStack.length - 1];
      return {
        allocatedNodes: next,
        redoStack: s.redoStack.slice(0, -1),
        undoStack: [...s.undoStack, s.allocatedNodes],
      };
    }),
}));
