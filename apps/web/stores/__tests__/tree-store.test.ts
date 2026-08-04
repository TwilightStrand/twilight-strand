import { describe, it, expect, beforeEach } from "vitest";
import { useTreeStore } from "../tree-store";

describe("tree-store", () => {
  beforeEach(() => {
    useTreeStore.setState({
      allocatedNodes: new Set(),
      hoveredNode: null,
      searchQuery: "",
      searchResults: new Set(),
      undoStack: [],
      redoStack: [],
      specs: [{ name: "Default", allocatedNodes: new Set() }],
      activeSpecIndex: 0,
    });
  });

  it("should toggle nodes", () => {
    useTreeStore.getState().toggleNode("123");
    expect(useTreeStore.getState().allocatedNodes.has("123")).toBe(true);
    useTreeStore.getState().toggleNode("123");
    expect(useTreeStore.getState().allocatedNodes.has("123")).toBe(false);
  });

  it("should support undo/redo", () => {
    useTreeStore.getState().toggleNode("100");
    useTreeStore.getState().toggleNode("200");
    expect(useTreeStore.getState().allocatedNodes.size).toBe(2);

    useTreeStore.getState().undo();
    expect(useTreeStore.getState().allocatedNodes.size).toBe(1);
    expect(useTreeStore.getState().allocatedNodes.has("100")).toBe(true);

    useTreeStore.getState().redo();
    expect(useTreeStore.getState().allocatedNodes.size).toBe(2);
  });

  it("should not undo past empty stack", () => {
    useTreeStore.getState().undo();
    expect(useTreeStore.getState().allocatedNodes.size).toBe(0);
  });

  it("should clear redo stack on new toggle", () => {
    useTreeStore.getState().toggleNode("100");
    useTreeStore.getState().undo();
    expect(useTreeStore.getState().redoStack.length).toBe(1);

    useTreeStore.getState().toggleNode("200");
    expect(useTreeStore.getState().redoStack.length).toBe(0);
  });

  it("should manage search", () => {
    useTreeStore.getState().setSearchQuery("life");
    expect(useTreeStore.getState().searchQuery).toBe("life");

    useTreeStore.getState().setSearchResults(new Set(["1", "2"]));
    expect(useTreeStore.getState().searchResults.size).toBe(2);
  });

  it("should manage specs", () => {
    useTreeStore.getState().addSpec("Leveling");
    expect(useTreeStore.getState().specs.length).toBe(2);
    expect(useTreeStore.getState().specs[1].name).toBe("Leveling");
    expect(useTreeStore.getState().activeSpecIndex).toBe(1);

    useTreeStore.getState().switchSpec(0);
    expect(useTreeStore.getState().activeSpecIndex).toBe(0);

    useTreeStore.getState().renameSpec(1, "Mapping");
    expect(useTreeStore.getState().specs[1].name).toBe("Mapping");
  });

  it("should not remove last spec", () => {
    useTreeStore.getState().removeSpec(0);
    expect(useTreeStore.getState().specs.length).toBe(1);
  });

  it("should remove non-last spec", () => {
    useTreeStore.getState().addSpec("Second");
    useTreeStore.getState().switchSpec(0);
    useTreeStore.getState().removeSpec(1);
    expect(useTreeStore.getState().specs.length).toBe(1);
    expect(useTreeStore.getState().specs[0].name).toBe("Default");
  });

  it("should set allocated nodes in bulk", () => {
    useTreeStore.getState().setAllocatedNodes(new Set(["1", "2", "3"]));
    expect(useTreeStore.getState().allocatedNodes.size).toBe(3);
  });

  it("should save current allocation when switching specs", () => {
    useTreeStore.getState().toggleNode("42");
    useTreeStore.getState().addSpec("Alt");
    useTreeStore.getState().switchSpec(0);
    expect(useTreeStore.getState().specs[1].allocatedNodes.has("42")).toBe(true);
  });
});
