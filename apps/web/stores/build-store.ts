import { create } from "zustand";
import type { BuildStats, ItemData, SkillGroup } from "@/engine/types";

type EngineStatus = "idle" | "loading" | "ready" | "error";

function classifyBuildInput(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith("<?xml") || trimmed.startsWith("<PathOfBuilding")) return "raw-xml";
  if (trimmed.includes("pastebin.com/")) return "pastebin-url";
  if (trimmed.includes("pobb.in/")) return "pobbin-url";
  const cleaned = trimmed.replace(/\s/g, "");
  if (cleaned.length >= 40 && /^[A-Za-z0-9+/=_-]+$/.test(cleaned)) return "pob-code";
  return "unknown";
}

export interface SavedBuild {
  name: string;
  code: string;
  savedAt: number;
  className: string;
  ascendancy: string;
  level: number;
}

interface BuildState {
  code: string | null;
  xml: string | null;
  stats: BuildStats | null;
  items: ItemData[];
  skills: SkillGroup[];
  loading: boolean;
  error: string | null;
  engineStatus: EngineStatus;
  engineProgress: string;
  evaluating: boolean;
  buildName: string;
  notes: string;
  savedBuilds: SavedBuild[];

  compareStats: BuildStats | null;
  setCompareBaseline: () => void;
  clearCompare: () => void;

  history: Array<{ action: string; timestamp: number }>;
  addHistory: (action: string) => void;

  configOverrides: Record<string, string | boolean | number>;
  setConfigOverride: (key: string, value: string | boolean | number) => void;

  initEngine: () => Promise<void>;
  importBuild: (input: string) => Promise<void>;
  clearBuild: () => void;
  setBuildName: (name: string) => void;
  setNotes: (notes: string) => void;
  saveBuild: () => void;
  loadSavedBuilds: () => void;
  deleteSavedBuild: (index: number) => void;
}

export const useBuildStore = create<BuildState>((set, get) => ({
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
  buildName: "Unnamed Build",
  notes: "",
  savedBuilds: [],
  compareStats: null,
  history: [],
  configOverrides: {},

  setConfigOverride(key: string, value: string | boolean | number) {
    set((s) => ({ configOverrides: { ...s.configOverrides, [key]: value } }));
  },

  addHistory(action: string) {
    set((s) => ({
      history: [{ action, timestamp: Date.now() }, ...s.history].slice(0, 50),
    }));
  },

  setCompareBaseline() {
    const s = get().stats;
    set({ compareStats: s ? { ...s } : null });
  },

  clearCompare() {
    set({ compareStats: null });
  },

  saveBuild() {
    const { code, stats, buildName } = get();
    if (!code) return;

    const saved: SavedBuild = {
      name: buildName || stats?.ascendancy || stats?.class_name || "Unnamed",
      code,
      savedAt: Date.now(),
      className: stats?.class_name || "",
      ascendancy: stats?.ascendancy || "",
      level: stats?.level || 1,
    };

    const builds = [...get().savedBuilds];
    const existing = builds.findIndex((b) => b.name === saved.name);
    if (existing >= 0) {
      builds[existing] = saved;
    } else {
      builds.unshift(saved);
    }

    set({ savedBuilds: builds });
    get().addHistory(`Saved build: ${saved.name}`);
    try {
      localStorage.setItem("tsc-saved-builds", JSON.stringify(builds));
    } catch {}
  },

  loadSavedBuilds() {
    try {
      const raw = localStorage.getItem("tsc-saved-builds");
      if (raw) {
        set({ savedBuilds: JSON.parse(raw) });
      }
    } catch {}
  },

  deleteSavedBuild(index: number) {
    const builds = [...get().savedBuilds];
    builds.splice(index, 1);
    set({ savedBuilds: builds });
    try {
      localStorage.setItem("tsc-saved-builds", JSON.stringify(builds));
    } catch {}
  },

  async initEngine() {
    if (get().engineStatus !== "idle") return;
    set({ engineStatus: "loading", engineProgress: "Starting engine..." });

    try {
      const { getEngineBridge } = await import("@/engine/bridge");
      const bridge = getEngineBridge();

      bridge.onProgress((stage) => {
        set({ engineProgress: stage });
      });

      await bridge.init("poe1");
      set({ engineStatus: "ready", engineProgress: "" });
    } catch (e) {
      set({
        engineStatus: "error",
        engineProgress: "",
        error: `Engine init failed: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  },

  async importBuild(input: string) {
    const kind = classifyBuildInput(input);
    set({ loading: true, error: null });

    try {
      const codec = await import("@/engine/pob-codec");
      let xml: string | null = null;

      switch (kind) {
        case "pob-code":
          xml = codec.decodePobCode(input);
          if (!xml) throw new Error("Failed to decode PoB code");
          break;
        case "raw-xml":
          xml = input;
          break;
        case "pastebin-url":
        case "pobbin-url": {
          const resp = await fetch(`/api/import?url=${encodeURIComponent(input)}`);
          if (!resp.ok) throw new Error(`Failed to fetch: ${resp.status}`);
          const data = await resp.json();
          xml = codec.decodePobCode(data.code);
          if (!xml) throw new Error("Failed to decode fetched code");
          break;
        }
        default:
          throw new Error("Unrecognized input format");
      }

      // Phase 1: instant client-side XML parse for immediate display
      const { parsePobXml } = await import("@/engine/pob-xml-parser");
      const result = parsePobXml(xml);

      const buildName = result.stats.ascendancy
        ? `${result.stats.ascendancy} ${result.stats.class_name}`
        : result.stats.class_name || "Unnamed Build";

      set({
        code: input,
        xml,
        stats: result.stats,
        items: result.items,
        skills: result.skills,
        notes: result.notes || "",
        loading: false,
        buildName,
      });

      get().addHistory(`Imported build: ${buildName}`);

      if (typeof window !== "undefined" && kind === "pob-code") {
        window.history.replaceState(null, "", `#${input}`);
      }

      // Phase 2: send to engine for accurate calcs (non-blocking)
      const { engineStatus } = get();
      if (engineStatus === "ready") {
        evaluateWithEngine(xml);
      } else if (engineStatus === "idle") {
        get().initEngine().then(() => {
          const currentXml = get().xml;
          if (currentXml) evaluateWithEngine(currentXml);
        });
      }
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },

  clearBuild() {
    get().addHistory("Cleared build");
    set({
      code: null,
      xml: null,
      stats: null,
      items: [],
      skills: [],
      error: null,
      evaluating: false,
      buildName: "Unnamed Build",
      notes: "",
    });
  },

  setBuildName(name: string) {
    set({ buildName: name });
  },

  setNotes(notes: string) {
    set({ notes });
  },
}));

async function evaluateWithEngine(xml: string) {
  const { setState, getState } = useBuildStore;
  setState({ evaluating: true });

  try {
    const { getEngineBridge } = await import("@/engine/bridge");
    const bridge = getEngineBridge();
    const result = await bridge.evaluate(xml);

    if (getState().xml !== xml) return;

    const prev = getState().stats;
    const eng = result.stats;

    // Merge: engine values win when they contain real data,
    // XML-parsed values are kept as fallback for fields the engine didn't compute
    const merged: typeof eng = { ...eng };
    if (prev) {
      if (merged.class_name === "?" && prev.class_name !== "?") merged.class_name = prev.class_name;
      if (!merged.ascendancy && prev.ascendancy) merged.ascendancy = prev.ascendancy;
      if (merged.level <= 1 && prev.level > 1) merged.level = prev.level;
      if (prev.allocated_nodes.length > 0 && merged.allocated_nodes.length === 0) {
        merged.allocated_nodes = prev.allocated_nodes;
      }
    }

    setState({
      stats: merged,
      items: result.items.length > 0 ? result.items : getState().items,
      skills: result.skills.length > 0 ? result.skills : getState().skills,
      evaluating: false,
    });

    if (merged.allocated_nodes.length > 0) {
      const { useTreeStore } = await import("@/stores/tree-store");
      useTreeStore.getState().setAllocatedNodes(
        new Set(merged.allocated_nodes.map(String))
      );
    }
  } catch (e) {
    console.warn("Engine evaluation failed, keeping XML-parsed results:", e);
    setState({ evaluating: false });
  }
}
