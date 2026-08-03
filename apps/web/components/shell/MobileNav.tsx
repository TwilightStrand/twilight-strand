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

export function MobileNav() {
  const { activeTab, setActiveTab } = useUiStore();

  return (
    <nav
      className="md:hidden border-t border-border-divider bg-bg-surface/90 backdrop-blur-sm"
      role="tablist"
    >
      <div className="flex items-center px-2 py-1 gap-1 border-b border-border-subtle">
        <span className="text-life font-mono text-xs font-bold tabular-nums">
          60
        </span>
        <span className="text-[9px] text-text-dim">HP</span>
        <span className="text-mana font-mono text-xs font-bold tabular-nums ml-2">
          50
        </span>
        <span className="text-[9px] text-text-dim">MP</span>
        <span className="flex-1" />
        <span className="text-[9px] font-mono text-text-dim">
          Lv.1 Scion
        </span>
      </div>
      <div className="flex items-stretch">
        {TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`
              flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-mono transition-colors
              ${
                activeTab === tab
                  ? "text-accent"
                  : "text-text-dim"
              }
            `}
          >
            <span className="text-sm">{TAB_ICONS[tab]}</span>
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>
    </nav>
  );
}
