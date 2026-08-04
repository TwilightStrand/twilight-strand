import { describe, it, expect, beforeEach } from "vitest";
import { useBuildStore } from "../build-store";

describe("build-store", () => {
  beforeEach(() => {
    useBuildStore.setState({
      code: null,
      xml: null,
      stats: null,
      items: [],
      skills: [],
      loading: false,
      error: null,
      engineStatus: "idle",
      engineProgress: "",
      evaluating: false,
      notes: "",
      buildName: "Unnamed Build",
      compareStats: null,
      savedBuilds: [],
    });
  });

  it("should have initial state", () => {
    const state = useBuildStore.getState();
    expect(state.code).toBeNull();
    expect(state.stats).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.engineStatus).toBe("idle");
    expect(state.buildName).toBe("Unnamed Build");
  });

  it("should clear build state", () => {
    useBuildStore.setState({ code: "test", notes: "some notes" });
    useBuildStore.getState().clearBuild();
    expect(useBuildStore.getState().code).toBeNull();
    expect(useBuildStore.getState().notes).toBe("");
  });

  it("should set and clear notes", () => {
    useBuildStore.getState().setNotes("Test notes");
    expect(useBuildStore.getState().notes).toBe("Test notes");
    useBuildStore.getState().clearBuild();
    expect(useBuildStore.getState().notes).toBe("");
  });

  it("should set build name", () => {
    useBuildStore.getState().setBuildName("My WOrb Build");
    expect(useBuildStore.getState().buildName).toBe("My WOrb Build");
  });

  it("should manage compare stats", () => {
    expect(useBuildStore.getState().compareStats).toBeNull();
    useBuildStore.getState().clearCompare();
    expect(useBuildStore.getState().compareStats).toBeNull();
  });

  it("should manage saved builds with localStorage", () => {
    const storage: Record<string, string> = {};
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: (k: string) => storage[k] ?? null,
        setItem: (k: string, v: string) => {
          storage[k] = v;
        },
        removeItem: (k: string) => {
          delete storage[k];
        },
      },
      writable: true,
      configurable: true,
    });

    useBuildStore.getState().loadSavedBuilds();
    expect(useBuildStore.getState().savedBuilds).toEqual([]);
  });
});
