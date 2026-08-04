"use client";

import { useUiStore } from "@/stores/ui-store";

export function EmptyState({
  title,
  description,
  showImport = true,
}: {
  title: string;
  description: string;
  showImport?: boolean;
}) {
  const setImportOpen = useUiStore((s) => s.setImportOpen);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
      <div className="w-12 h-12 rounded-full bg-bg-hover flex items-center justify-center">
        <span className="text-2xl text-text-dim/40">?</span>
      </div>
      <div className="text-center">
        <h3 className="text-sm font-mono text-text-heading mb-1">{title}</h3>
        <p className="text-xs font-mono text-text-dim/60 max-w-xs">
          {description}
        </p>
      </div>
      {showImport && (
        <button
          onClick={() => setImportOpen(true)}
          className="px-4 py-1.5 text-sm font-mono bg-accent/20 text-accent rounded border border-accent/30 hover:bg-accent/30 transition-colors"
        >
          Import Build
        </button>
      )}
    </div>
  );
}
