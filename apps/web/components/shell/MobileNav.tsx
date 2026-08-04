"use client";

import { TABS, TAB_LABELS, useUiStore } from "@/stores/ui-store";
import type { TabId } from "@/stores/ui-store";
import { useBuildStore } from "@/stores/build-store";

const TAB_ICONS: Record<TabId, string> = {
  tree: "⬡",
  items: "⚔",
  skills: "◈",
  config: "⚙",
  calcs: "△",
  settings: "☰",
};

export function MobileNav() {
  const { activeTab, setActiveTab, setImportOpen } = useUiStore();
  const stats = useBuildStore((s) => s.stats);

  const life = stats?.life ?? 60;
  const es = stats?.energy_shield ?? 0;
  const mana = stats?.mana ?? 50;
  const level = stats?.level ?? 1;
  const className = stats?.ascendancy || stats?.class_name || "Scion";

  return (
    <nav
      className="md:hidden border-t border-border-divider bg-bg-surface/90 backdrop-blur-sm"
      role="tablist"
    >
      <div className="flex items-center px-2 py-1 gap-1 border-b border-border-subtle">
        <span className="text-life font-mono text-xs font-bold tabular-nums">
          {life}
        </span>
        <span className="text-[9px] text-text-dim">HP</span>
        {es > 0 && (
          <>
            <span className="text-es font-mono text-xs font-bold tabular-nums ml-1">
              {es}
            </span>
            <span className="text-[9px] text-text-dim">ES</span>
          </>
        )}
        <span className="text-mana font-mono text-xs font-bold tabular-nums ml-1">
          {mana}
        </span>
        <span className="text-[9px] text-text-dim">MP</span>
        <span className="flex-1" />
        <button
          onClick={() => setImportOpen(true)}
          className="text-[9px] font-mono text-accent px-1.5 py-0.5 rounded border border-accent/30 hover:bg-accent/10"
        >
          Import
        </button>
        <span className="text-[9px] font-mono text-text-dim ml-1">
          Lv.{level} {className}
        </span>
      </div>
      <div className="flex items-stretch overflow-x-auto no-scrollbar">
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
