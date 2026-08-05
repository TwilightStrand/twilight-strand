import { create } from "zustand";
import type { BuildStats, ItemData, SkillGroup } from "@/engine/types";
import type { EngineDivergence } from "@/engine/rust-converter";
import { classifyBuildInput, parseAccountCharFromUrl, gggDataToXml } from "@/engine/import-export";
import type { BuildInputKind } from "@/engine/import-export";

type EngineStatus = "idle" | "loading" | "ready" | "error";

export type ExportFormat = "tsc" | "pob" | "xml" | "json" | "pastebin";

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

  cloudBuildId: string | null;
  lastSaved: number | null;
  engineInitTime: number | null;
  engineEvalTime: number | null;
  rustEvalTime: number | null;
  engineDivergences: EngineDivergence[];
  rustModCount: number;

  history: Array<{ action: string; timestamp: number }>;
  addHistory: (action: string) => void;

  configOverrides: Record<string, string | boolean | number>;
  setConfigOverride: (key: string, value: string | boolean | number) => void;

  importScope: "full" | "tree" | "items" | "skills";
  setImportScope: (scope: "full" | "tree" | "items" | "skills") => void;

  loadouts: Array<{ name: string; items: ItemData[] }>;
  activeLoadout: number;
  addLoadout: (name?: string) => void;
  switchLoadout: (index: number) => void;
  deleteLoadout: (index: number) => void;

  initEngine: () => Promise<void>;
  importBuild: (input: string) => Promise<void>;
  exportBuild: (format: ExportFormat) => Promise<string>;
  reEvaluate: () => Promise<void>;
  recalcFromTree: (allocatedNodes: Set<string>) => void;
  clearBuild: () => void;
  setBuildName: (name: string) => void;
  setNotes: (notes: string) => void;
  saveBuild: () => void;
  loadSavedBuilds: () => void;
  deleteSavedBuild: (index: number) => void;
  saveToCloud: () => Promise<void>;
  loadCloudBuilds: () => Promise<SavedBuild[]>;
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
  cloudBuildId: null,
  lastSaved: null,
  engineInitTime: null,
  engineEvalTime: null,
  rustEvalTime: null,
  engineDivergences: [],
  rustModCount: 0,
  history: [],
  configOverrides: {},
  importScope: "full",
  loadouts: [{ name: "Default", items: [] }],
  activeLoadout: 0,

  setImportScope: (scope) => set({ importScope: scope }),

  addLoadout: (name) =>
    set((s) => {
      const newLoadout = { name: name || `Set ${s.loadouts.length + 1}`, items: [...s.items] };
      return { loadouts: [...s.loadouts, newLoadout], activeLoadout: s.loadouts.length };
    }),

  switchLoadout: (index) =>
    set((s) => {
      if (index < 0 || index >= s.loadouts.length) return s;
      const loadouts = [...s.loadouts];
      loadouts[s.activeLoadout] = { ...loadouts[s.activeLoadout], items: s.items };
      return { loadouts, activeLoadout: index, items: loadouts[index].items };
    }),

  deleteLoadout: (index) =>
    set((s) => {
      if (s.loadouts.length <= 1) return s;
      const loadouts = s.loadouts.filter((_, i) => i !== index);
      const newIndex = Math.min(s.activeLoadout, loadouts.length - 1);
      return { loadouts, activeLoadout: newIndex, items: loadouts[newIndex].items };
    }),

  setConfigOverride(key: string, value: string | boolean | number) {
    set((s) => ({ configOverrides: { ...s.configOverrides, [key]: value } }));
  },

  async reEvaluate() {
    const { xml, stats, items, skills, engineStatus } = get();
    if (!xml) return;
    if (stats) runRustEval(stats, items, skills);
    if (engineStatus === "ready") evaluateWithLua(xml);
  },

  recalcFromTree(allocatedNodes: Set<string>) {
    const { stats, items, skills } = get();
    if (!stats) return;
    const updated = { ...stats, allocated_nodes: Array.from(allocatedNodes).map(Number).filter(Number.isFinite) };
    set({ stats: updated });
    runRustEval(updated, items, skills);
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

    set({ savedBuilds: builds, lastSaved: Date.now() });
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

  async saveToCloud() {
    const { code, stats, buildName } = get();
    if (!code || !stats) return;
    try {
      const resp = await fetch("/api/builds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: buildName,
          pobCode: code,
          className: stats.class_name,
          ascendancy: stats.ascendancy,
          level: stats.level,
          totalDps: stats.total_dps,
          life: stats.life,
          energyShield: stats.energy_shield,
          treeVersion: stats.tree_version,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.build?.id) {
          set({ cloudBuildId: data.build.id });
        }
        get().addHistory("Saved to cloud");
      }
    } catch {}
  },

  async loadCloudBuilds() {
    try {
      const resp = await fetch("/api/builds");
      if (!resp.ok) return [];
      const data = await resp.json();
      return (data.builds || []).map((b: Record<string, unknown>) => ({
        name: String(b.name || ""),
        code: String(b.pobCode || ""),
        savedAt: new Date(b.createdAt as string).getTime(),
        className: String(b.className || ""),
        ascendancy: String(b.ascendancy || ""),
        level: Number(b.level || 1),
      }));
    } catch {
      return [];
    }
  },

  async initEngine() {
    if (get().engineStatus !== "idle") return;
    set({ engineStatus: "loading", engineProgress: "Starting engine..." });

    try {
      const initStart = performance.now();
      const { getEngineBridge } = await import("@/engine/bridge");
      const bridge = getEngineBridge();

      bridge.onProgress((stage) => {
        set({ engineProgress: stage });
      });

      await bridge.init("poe1");
      set({ engineStatus: "ready", engineProgress: "", engineInitTime: Math.round(performance.now() - initStart) });

      // Also init Rust WASM engine (non-blocking, used for fast node power calcs)
      import("@/engine/rust-bridge").then(m => m.initRustEngine()).catch(() => {});
    } catch (e) {
      set({
        engineStatus: "error",
        engineProgress: "",
        error: `Engine init failed: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  },

  async exportBuild(format: ExportFormat) {
    const { xml, stats, items, skills, buildName, notes } = get();
    if (!stats) throw new Error("No build loaded");

    if (format === "xml") {
      if (xml) return xml;
      const { buildToXml } = await import("@tsc/build-codec");
      return buildToXml({
        level: stats.level, className: stats.class_name, ascendancy: stats.ascendancy,
        mainSocketGroup: stats.main_socket_group, treeVersion: stats.tree_version,
        allocatedNodes: stats.allocated_nodes,
        items: items.map(i => ({ ...i })), skills: skills.map(s => ({ ...s })),
        config: [], notes,
      });
    }

    if (format === "pob") {
      const exportXml = await get().exportBuild("xml");
      const { encodePobCode } = await import("@/engine/pob-codec");
      return encodePobCode(exportXml);
    }

    if (format === "tsc") {
      const { encodeBuildCode } = await import("@tsc/build-codec");
      return encodeBuildCode({
        level: stats.level, className: stats.class_name, ascendancy: stats.ascendancy,
        mainSocketGroup: stats.main_socket_group, treeVersion: stats.tree_version,
        allocatedNodes: stats.allocated_nodes,
        items: items.map(i => ({ ...i })), skills: skills.map(s => ({ ...s })),
        config: [], notes,
      });
    }

    if (format === "json") {
      return JSON.stringify({
        name: buildName, level: stats.level,
        class: stats.class_name, ascendancy: stats.ascendancy,
        stats, items, skills, notes,
      }, null, 2);
    }

    if (format === "pastebin") {
      const pobCode = await get().exportBuild("pob");
      const resp = await fetch("https://pastebin.com/api/api_post.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          api_dev_key: "public",
          api_option: "paste",
          api_paste_code: pobCode,
          api_paste_name: buildName,
          api_paste_expire_date: "1M",
        }),
      });
      if (!resp.ok) throw new Error("Pastebin upload failed");
      return resp.text();
    }

    throw new Error(`Unknown export format: ${format}`);
  },

  async importBuild(input: string) {
    const kind = classifyBuildInput(input);
    set({ loading: true, error: null });

    try {
      let xml: string | null = null;

      if (kind === "tsc-code") {
        const { decodeBuildCode, buildToXml } = await import("@tsc/build-codec");
        const build = await decodeBuildCode(input);
        xml = buildToXml(build);
      } else if (kind === "poe-profile-url" || kind === "poe-ninja-url") {
        xml = await importFromProfile(input, kind);
      } else {
        const codec = await import("@/engine/pob-codec");

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
      }

      if (!xml) throw new Error("Failed to get build XML");

      // Phase 1: instant client-side XML parse for immediate display
      const { parsePobXml } = await import("@/engine/pob-xml-parser");
      const result = parsePobXml(xml);

      const buildName = result.stats.ascendancy
        ? `${result.stats.ascendancy} ${result.stats.class_name}`
        : result.stats.class_name || "Unnamed Build";

      const scope = get().importScope;
      if (scope === "tree") {
        const prev = get().stats;
        set({
          xml,
          loading: false,
          stats: prev
            ? { ...prev, allocated_nodes: result.stats.allocated_nodes, level: result.stats.level, class_name: result.stats.class_name, ascendancy: result.stats.ascendancy }
            : result.stats,
        });
      } else if (scope === "items") {
        set({ xml, items: result.items, loading: false });
      } else if (scope === "skills") {
        set({ xml, skills: result.skills, loading: false });
      } else {
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
      }

      get().addHistory(`Imported build: ${buildName}`);

      if (typeof window !== "undefined" && (kind === "pob-code" || kind === "tsc-code")) {
        window.history.replaceState(null, "", `#${input}`);
      }

      // Phase 1.5: instant Rust eval for immediate accurate stats
      runRustEval(result.stats, result.items, result.skills);

      // Phase 2: Lua engine for full validation (non-blocking)
      const { engineStatus } = get();
      if (engineStatus === "ready") {
        evaluateWithLua(xml);
      } else if (engineStatus === "idle") {
        get().initEngine().then(() => {
          const currentXml = get().xml;
          if (currentXml) evaluateWithLua(currentXml);
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
      engineDivergences: [],
      rustModCount: 0,
      rustEvalTime: null,
    });
  },

  setBuildName(name: string) {
    set({ buildName: name });
  },

  setNotes(notes: string) {
    set({ notes });
  },
}));

async function importFromProfile(input: string, kind: BuildInputKind): Promise<string> {
  const { account, character } = parseAccountCharFromUrl(input, kind);
  if (!account) throw new Error("Could not parse account name from URL");

  // If no character specified, fetch character list and use the first/highest level
  let charName = character;
  if (!charName) {
    const listResp = await fetch(`/api/character?account=${encodeURIComponent(account)}`);
    if (!listResp.ok) throw new Error("Failed to fetch characters. Profile may be private.");
    const listData = await listResp.json();
    const chars = listData.characters as Array<{ name: string; level: number; class: string }>;
    if (!chars?.length) throw new Error("No characters found for this account");
    chars.sort((a, b) => b.level - a.level);
    charName = chars[0].name;
  }

  const resp = await fetch(`/api/character?account=${encodeURIComponent(account)}&character=${encodeURIComponent(charName)}`);
  if (!resp.ok) throw new Error("Failed to fetch character data. Profile may be private.");
  const data = await resp.json();

  return gggDataToXml(data.items, data.passives, charName);
}

async function runRustEval(
  xmlStats: BuildStats,
  items: ItemData[],
  skills: SkillGroup[],
) {
  const { setState } = useBuildStore;
  try {
    const [
      { isRustEngineReady, initRustEngine, evaluateBuildRust, parseStatLine },
      { ensureTreeData, convertToRustInput, rustOutputToBuildStats },
    ] = await Promise.all([
      import("@/engine/rust-bridge"),
      import("@/engine/rust-converter"),
    ]);

    await initRustEngine();
    if (!isRustEngineReady()) return;

    const treeNodes = await ensureTreeData();
    const rustInput = convertToRustInput(xmlStats, items, skills, treeNodes, parseStatLine);
    const rustStart = performance.now();
    const rustOutput = evaluateBuildRust(rustInput);
    const rustTime = Math.round(performance.now() - rustStart);

    if (!rustOutput) return;

    const rustStats = rustOutputToBuildStats(xmlStats, rustOutput);
    setState({
      stats: rustStats,
      rustEvalTime: rustTime,
      rustModCount: rustInput.modifiers.length,
    });
  } catch (e) {
    console.warn("[rust-engine] Fast eval failed, XML stats remain:", e);
  }
}

async function evaluateWithLua(xml: string) {
  const { setState, getState } = useBuildStore;
  setState({ evaluating: true });

  try {
    const evalStart = performance.now();
    const { getEngineBridge } = await import("@/engine/bridge");
    const bridge = getEngineBridge();
    const config = getState().configOverrides;
    const result = await bridge.evaluate(xml, Object.keys(config).length > 0 ? config : undefined);

    if (getState().xml !== xml) return;

    const prev = getState().stats;
    const eng = result.stats;

    const merged: typeof eng = { ...eng };
    if (prev) {
      if (merged.class_name === "?" && prev.class_name !== "?") merged.class_name = prev.class_name;
      if (!merged.ascendancy && prev.ascendancy) merged.ascendancy = prev.ascendancy;
      if (merged.level <= 1 && prev.level > 1) merged.level = prev.level;
      if (prev.allocated_nodes.length > 0 && merged.allocated_nodes.length === 0) {
        merged.allocated_nodes = prev.allocated_nodes;
      }
    }

    const finalItems = result.items.length > 0 ? result.items : getState().items;
    const finalSkills = result.skills.length > 0 ? result.skills : getState().skills;

    // Lua is ground truth: overwrite Rust stats
    setState({
      stats: merged,
      items: finalItems,
      skills: finalSkills,
      evaluating: false,
      engineEvalTime: Math.round(performance.now() - evalStart),
    });

    if (merged.allocated_nodes.length > 0) {
      const { useTreeStore } = await import("@/stores/tree-store");
      useTreeStore.getState().setAllocatedNodes(
        new Set(merged.allocated_nodes.map(String))
      );
    }

    // Compare Rust vs Lua for divergence tracking
    runDivergenceCheck(merged, finalItems, finalSkills);
  } catch (e) {
    console.warn("Lua evaluation failed, keeping Rust/XML stats:", e);
    setState({ evaluating: false });
  }
}

async function runDivergenceCheck(
  luaStats: BuildStats,
  items: ItemData[],
  skills: SkillGroup[],
) {
  const { setState } = useBuildStore;
  try {
    const [
      { isRustEngineReady, evaluateBuildRust, parseStatLine },
      { ensureTreeData, convertToRustInput, compareLuaVsRust },
    ] = await Promise.all([
      import("@/engine/rust-bridge"),
      import("@/engine/rust-converter"),
    ]);

    if (!isRustEngineReady()) return;

    const treeNodes = await ensureTreeData();
    const rustInput = convertToRustInput(luaStats, items, skills, treeNodes, parseStatLine);
    const rustOutput = evaluateBuildRust(rustInput);

    if (!rustOutput) {
      setState({ engineDivergences: [] });
      return;
    }

    const divergences = compareLuaVsRust(luaStats, rustOutput as unknown as Record<string, number>);
    setState({ engineDivergences: divergences });

    const significant = divergences.filter((d) => Math.abs(d.pctDiff) > 5);
    if (significant.length > 0) {
      console.warn(
        `[dual-engine] ${significant.length} divergences >5%:`,
        significant.map((d) => `${d.stat}: lua=${d.lua.toFixed(1)} rust=${d.rust.toFixed(1)} (${d.pctDiff.toFixed(1)}%)`),
      );
    }
  } catch (e) {
    console.warn("[dual-engine] Divergence check failed:", e);
  }
}
