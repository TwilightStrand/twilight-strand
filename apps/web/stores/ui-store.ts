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
  setActiveTab: (tab: TabId) => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTab: "tree",
  sidebarOpen: true,
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
