"use client";

import { TABS, TAB_LABELS, useUiStore } from "@/stores/ui-store";
import type { TabId } from "@/stores/ui-store";

const TAB_ICONS: Record<TabId, string> = {
  tree: "⬡",
  items: "⚔",
  skills: "◈",
  config: "⚙",
  calcs: "△",
  settings: "☰",
};

export function Header() {
  const { activeTab, setActiveTab } = useUiStore();

  return (
    <header className="h-12 min-h-12 md:h-14 md:min-h-14 border-b border-border-divider bg-bg-surface/60 backdrop-blur-sm flex items-center px-3 gap-2">
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        <span className="text-accent font-display text-lg font-bold tracking-tight hidden sm:inline">
          Twilight Strand
        </span>
        <span className="text-accent font-display text-lg font-bold sm:hidden">
          TS
        </span>

        <span className="text-border-card hidden sm:inline">|</span>

        <div className="flex items-center gap-1.5 text-xs font-mono text-text-dim">
          <span className="bg-bg-card px-1.5 py-0.5 rounded text-text-primary">
            PoE 1
          </span>
          <span className="text-text-dim">Scion</span>
          <span className="text-text-dim">Lv 1</span>
        </div>
      </div>

      <nav
        className="hidden md:flex items-center gap-0.5 ml-4"
        role="tablist"
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            id={`tab-${tab}`}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`
              relative flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-mono transition-colors
              ${
                activeTab === tab
                  ? "text-accent bg-bg-hover"
                  : "text-text-dim hover:text-text-primary hover:bg-bg-hover/50"
              }
            `}
          >
            <span className="text-xs">{TAB_ICONS[tab]}</span>
            {TAB_LABELS[tab]}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent rounded-full" />
            )}
          </button>
        ))}
      </nav>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <button className="text-xs font-mono text-text-dim hover:text-accent transition-colors px-2 py-1 rounded hover:bg-bg-hover">
          Import
        </button>
      </div>
    </header>
  );
}
