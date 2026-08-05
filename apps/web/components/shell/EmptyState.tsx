"use client";

import { useUiStore } from "@/stores/ui-store";

const ICONS: Record<string, string> = {
  tree: "⬡",
  items: "⚔",
  skills: "◈",
  calcs: "△",
  default: "⬡",
};

const HINTS: Record<string, string[]> = {
  tree: [
    "Press Ctrl+I to import a PoB code",
    "Click nodes to allocate skill points",
    "Use scroll to zoom, drag to pan",
  ],
  items: [
    "Import a build to see equipment",
    "Browse 1,200+ unique items",
    "Craft mods at the bench",
  ],
  skills: [
    "Import a build to see gem setups",
    "Add socket groups manually",
    "Link support gems to actives",
  ],
  calcs: [
    "Import a build for full calculations",
    "Power Report ranks nearby nodes",
    "Unique Ranker finds best-in-slot items",
  ],
};

export function EmptyState({
  title,
  description,
  showImport = true,
  tab,
}: {
  title: string;
  description: string;
  showImport?: boolean;
  tab?: string;
}) {
  const setImportOpen = useUiStore((s) => s.setImportOpen);
  const icon = ICONS[tab ?? "default"] ?? ICONS.default;
  const hints = HINTS[tab ?? ""] ?? [];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 p-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border border-border-subtle flex items-center justify-center bg-bg-inset">
          <span className="text-3xl text-accent/30">{icon}</span>
        </div>
        <div className="absolute inset-0 w-16 h-16 rounded-full border border-accent/10 animate-ping" style={{ animationDuration: "3s" }} />
      </div>

      <div className="text-center max-w-sm">
        <h3 className="text-sm font-mono text-text-heading mb-1.5">{title}</h3>
        <p className="text-xs font-mono text-text-dim/60 leading-relaxed">{description}</p>
      </div>

      {hints.length > 0 && (
        <div className="flex flex-col gap-1.5 max-w-xs w-full">
          {hints.map((hint, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px] font-mono text-text-dim/40">
              <span className="text-accent/30 shrink-0">{i + 1}.</span>
              <span>{hint}</span>
            </div>
          ))}
        </div>
      )}

      {showImport && (
        <button
          onClick={() => setImportOpen(true)}
          className="px-5 py-2 text-sm font-mono bg-accent/15 text-accent rounded-lg border border-accent/25 hover:bg-accent/25 hover:border-accent/40 transition-all"
        >
          Import Build
        </button>
      )}
    </div>
  );
}
