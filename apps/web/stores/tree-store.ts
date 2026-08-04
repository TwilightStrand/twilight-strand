import { create } from "zustand";

interface TreeSpec {
  name: string;
  allocatedNodes: Set<string>;
}

interface TreeState {
  allocatedNodes: Set<string>;
  hoveredNode: string | null;
  searchQuery: string;
  searchResults: Set<string>;
  undoStack: Set<string>[];
  redoStack: Set<string>[];
  specs: TreeSpec[];
  activeSpecIndex: number;
  toggleNode: (nodeId: string) => void;
  allocateNode: (nodeId: string) => void;
  deallocateNode: (nodeId: string) => void;
  setHoveredNode: (nodeId: string | null) => void;
  setAllocatedNodes: (nodes: Set<string>) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: Set<string>) => void;
  undo: () => void;
  redo: () => void;
  resetTree: () => void;
  addSpec: (name?: string) => void;
  removeSpec: (index: number) => void;
  switchSpec: (index: number) => void;
  renameSpec: (index: number, name: string) => void;
}

export const useTreeStore = create<TreeState>((set) => ({
  allocatedNodes: new Set<string>(),
  hoveredNode: null,
  searchQuery: "",
  searchResults: new Set<string>(),
  undoStack: [],
  redoStack: [],
  specs: [{ name: "Default", allocatedNodes: new Set<string>() }],
  activeSpecIndex: 0,
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
  resetTree: () =>
    set((s) => ({
      allocatedNodes: new Set<string>(),
      undoStack: [...s.undoStack, s.allocatedNodes],
      redoStack: [],
    })),
  addSpec: (name) =>
    set((s) => {
      const newSpec: TreeSpec = {
        name: name || `Spec ${s.specs.length + 1}`,
        allocatedNodes: new Set(s.allocatedNodes),
      };
      return { specs: [...s.specs, newSpec], activeSpecIndex: s.specs.length };
    }),
  removeSpec: (index) =>
    set((s) => {
      if (s.specs.length <= 1) return s;
      const specs = s.specs.filter((_, i) => i !== index);
      const newIndex = Math.min(s.activeSpecIndex, specs.length - 1);
      return { specs, activeSpecIndex: newIndex, allocatedNodes: specs[newIndex].allocatedNodes };
    }),
  switchSpec: (index) =>
    set((s) => {
      if (index < 0 || index >= s.specs.length) return s;
      const specs = [...s.specs];
      specs[s.activeSpecIndex] = { ...specs[s.activeSpecIndex], allocatedNodes: s.allocatedNodes };
      return { specs, activeSpecIndex: index, allocatedNodes: specs[index].allocatedNodes };
    }),
  renameSpec: (index, name) =>
    set((s) => {
      const specs = [...s.specs];
      specs[index] = { ...specs[index], name };
      return { specs };
    }),
}));
