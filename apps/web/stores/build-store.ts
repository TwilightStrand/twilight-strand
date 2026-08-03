import { create } from "zustand";
import type { BuildStats, ItemData, SkillGroup } from "@/engine/types";

function decodePobCode(code: string): string | null {
  // Inline the codec to avoid pulling in pako at module level
  // (the full codec is in engine/pob-codec.ts, loaded dynamically)
  return null; // placeholder - will be replaced by dynamic import
}

function classifyBuildInput(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith("<?xml") || trimmed.startsWith("<PathOfBuilding")) return "raw-xml";
  if (trimmed.includes("pastebin.com/")) return "pastebin-url";
  if (trimmed.includes("pobb.in/")) return "pobbin-url";
  const cleaned = trimmed.replace(/\s/g, "");
  if (cleaned.length >= 40 && /^[A-Za-z0-9+/=_-]+$/.test(cleaned)) return "pob-code";
  return "unknown";
}

interface BuildState {
  code: string | null;
  xml: string | null;
  stats: BuildStats | null;
  items: ItemData[];
  skills: SkillGroup[];
  loading: boolean;
  error: string | null;
  engineReady: boolean;

  initEngine: () => Promise<void>;
  importBuild: (input: string) => Promise<void>;
  clearBuild: () => void;
}

export const useBuildStore = create<BuildState>((set, get) => ({
  code: null,
  xml: null,
  stats: null,
  items: [],
  skills: [],
  loading: false,
  error: null,
  engineReady: false,

  async initEngine() {
    try {
      const { getEngineBridge } = await import("@/engine/bridge");
      const bridge = getEngineBridge();
      await bridge.init("poe1");
      set({ engineReady: true });
    } catch (e) {
      set({ error: `Engine init failed: ${e instanceof Error ? e.message : String(e)}` });
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

      // Parse XML client-side for immediate data extraction
      // (the full Lua engine will provide accurate calc results later)
      const { parsePobXml } = await import("@/engine/pob-xml-parser");
      const result = parsePobXml(xml);

      set({
        code: input,
        xml,
        stats: result.stats,
        items: result.items,
        skills: result.skills,
        loading: false,
      });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },

  clearBuild() {
    set({
      code: null,
      xml: null,
      stats: null,
      items: [],
      skills: [],
      error: null,
    });
  },
}));
