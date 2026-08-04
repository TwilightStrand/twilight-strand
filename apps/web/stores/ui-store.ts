import { create } from "zustand";

export const TABS = [
  "tree",
  "items",
  "skills",
  "config",
  "calcs",
  "settings",
] as const;

export type TabId = (typeof TABS)[number];

export const TAB_LABELS: Record<TabId, string> = {
  tree: "Tree",
  items: "Items",
  skills: "Skills",
  config: "Config",
  calcs: "Calcs",
  settings: "Settings",
};

interface UiState {
  activeTab: TabId;
  sidebarOpen: boolean;
  importOpen: boolean;
  theme: "dark" | "light";
  numberFormat: "us" | "eu";
  performanceMode: boolean;
  gameVersion: "poe1" | "poe2";
  setActiveTab: (tab: TabId) => void;
  toggleSidebar: () => void;
  setImportOpen: (open: boolean) => void;
  setTheme: (theme: "dark" | "light") => void;
  setNumberFormat: (format: "us" | "eu") => void;
  setPerformanceMode: (enabled: boolean) => void;
  setGameVersion: (version: "poe1" | "poe2") => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTab: "tree",
  sidebarOpen: true,
  importOpen: false,
  theme: "dark",
  numberFormat: "us",
  performanceMode: false,
  gameVersion: "poe1",
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setImportOpen: (open) => set({ importOpen: open }),
  setTheme: (theme) => {
    set({ theme });
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.className = theme;
    }
    try { localStorage.setItem("tsc-theme", theme); } catch {}
  },
  setNumberFormat: (format) => {
    set({ numberFormat: format });
    try { localStorage.setItem("tsc-numfmt", format); } catch {}
  },
  setPerformanceMode: (enabled) => {
    set({ performanceMode: enabled });
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("perf-mode", enabled);
    }
    try { localStorage.setItem("tsc-perf", String(enabled)); } catch {}
  },
  setGameVersion: (version) => {
    set({ gameVersion: version });
    try { localStorage.setItem("tsc-game", version); } catch {}
  },
}));
