"use client";

import type { TabId } from "@/stores/ui-store";
import { TABS, useUiStore } from "@/stores/ui-store";

const TAB_ICONS: Record<TabId, string> = {
  tree: "⬡",
  items: "⚔",
  skills: "◈",
  config: "⚙",
  calcs: "△",
  settings: "☰",
};

const TAB_LABELS: Record<TabId, string> = {
  tree: "Tree",
  items: "Items",
  skills: "Skills",
  config: "Config",
  calcs: "Calcs",
  settings: "Settings",
};

const TAB_SHORTCUTS: Record<TabId, string> = {
  tree: "1",
  items: "2",
  skills: "3",
  config: "4",
  calcs: "5",
  settings: "6",
};

export function ActivityBar() {
  const { activeTab, setActiveTab, setImportOpen } = useUiStore();

  return (
    <div className="hidden md:flex flex-col w-12 bg-bg-deep border-r border-border-subtle shrink-0">
      <div className="flex-1 flex flex-col items-center pt-2 gap-0.5">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              relative w-10 h-10 flex items-center justify-center rounded-lg text-lg transition-colors group
              ${activeTab === tab
                ? "text-accent bg-accent/10"
                : "text-text-dim/60 hover:text-text-primary hover:bg-bg-hover/50"
              }
            `}
            title={`${TAB_LABELS[tab]} (${TAB_SHORTCUTS[tab]})`}
          >
            {TAB_ICONS[tab]}
            {activeTab === tab && (
              <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-accent rounded-r" />
            )}
            <span className="absolute left-full ml-2 px-2 py-1 bg-bg-card border border-border-card rounded text-xs font-mono text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {TAB_LABELS[tab]} <span className="text-text-dim/40">{TAB_SHORTCUTS[tab]}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center pb-3 gap-1">
        <button
          onClick={() => setImportOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-accent/70 hover:text-accent hover:bg-accent/10 transition-colors text-sm font-mono group relative"
          title="Import (Ctrl+I)"
        >
          +
          <span className="absolute left-full ml-2 px-2 py-1 bg-bg-card border border-border-card rounded text-xs font-mono text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            Import <span className="text-text-dim/40">Ctrl+I</span>
          </span>
        </button>
      </div>
    </div>
  );
}
