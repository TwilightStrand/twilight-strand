"use client";

import { useBuildStore } from "@/stores/build-store";

export function NotesPanel() {
  const notes = useBuildStore((s) => s.notes);
  const setNotes = useBuildStore((s) => s.setNotes);
  const stats = useBuildStore((s) => s.stats);

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-mono uppercase tracking-widest text-text-dim">
          Build Notes
        </h2>
        {notes.length > 0 && (
          <span className="text-[10px] font-mono text-text-dim/40">
            {notes.length} chars
          </span>
        )}
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={stats ? "Add notes about this build..." : "Import a build first"}
        disabled={!stats}
        className="flex-1 w-full bg-bg-inset border border-border-subtle rounded px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-dim/40 resize-none focus:outline-none focus:border-accent disabled:opacity-40"
      />
    </div>
  );
}
