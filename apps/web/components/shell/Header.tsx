"use client";

import { useEffect } from "react";
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

function EngineStatus() {
  const status = useBuildStore((s) => s.engineStatus);
  const progress = useBuildStore((s) => s.engineProgress);
  const evaluating = useBuildStore((s) => s.evaluating);

  if (status === "ready" && !evaluating) return null;

  const label =
    status === "loading"
      ? progress || "Starting engine..."
      : status === "error"
        ? "Engine error"
        : evaluating
          ? "Calculating..."
          : null;

  if (!label) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs font-mono text-text-dim">
      {(status === "loading" || evaluating) && (
        <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
      )}
      {status === "error" && (
        <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
      )}
      <span className="max-w-48 truncate">{label}</span>
    </div>
  );
}

export function Header() {
  const { activeTab, setActiveTab, setImportOpen } = useUiStore();
  const stats = useBuildStore((s) => s.stats);
  const initEngine = useBuildStore((s) => s.initEngine);
  const buildName = useBuildStore((s) => s.buildName);

  useEffect(() => {
    initEngine();
  }, [initEngine]);

  const level = stats?.level ?? 1;

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
          <span className="text-text-dim truncate max-w-32">{buildName}</span>
          <span className="text-text-dim/60 text-[10px]">Lv {level}</span>
        </div>
      </div>

      <EngineStatus />

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
        <button
          onClick={() => useBuildStore.getState().saveBuild()}
          disabled={!useBuildStore.getState().code}
          className="text-xs font-mono text-text-dim hover:text-accent transition-colors px-2 py-1 rounded hover:bg-bg-hover disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Save
        </button>
        <button
          onClick={() => setImportOpen(true)}
          className="text-xs font-mono text-text-dim hover:text-accent transition-colors px-2 py-1 rounded hover:bg-bg-hover"
        >
          Import
        </button>
      </div>
    </header>
  );
}
