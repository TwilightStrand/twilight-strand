"use client";

import { useState } from "react";
import { useBuildStore } from "@/stores/build-store";
import { renderMarkdown } from "@/lib/markdown";

export function NotesPanel() {
  const notes = useBuildStore((s) => s.notes);
  const setNotes = useBuildStore((s) => s.setNotes);
  const stats = useBuildStore((s) => s.stats);
  const [preview, setPreview] = useState(false);

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-mono uppercase tracking-widest text-text-dim">
          Build Notes
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(!preview)}
            className={`text-[10px] font-mono px-2 py-0.5 rounded ${preview ? "bg-accent/20 text-accent" : "text-text-dim hover:text-text-primary"}`}
          >
            {preview ? "Edit" : "Preview"}
          </button>
          <span className="text-[10px] font-mono text-text-dim/40">
            {notes.length} chars
          </span>
        </div>
      </div>

      {preview ? (
        <div className="flex-1 overflow-y-auto bg-bg-inset border border-border-subtle rounded px-3 py-2">
          {notes ? renderMarkdown(notes) : (
            <p className="text-xs font-mono text-text-dim/40 italic">Nothing to preview</p>
          )}
        </div>
      ) : (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={stats ? "Add notes about this build...\n\nSupports **markdown** formatting:\n- **bold**, *italic*, `code`\n- # Headers\n- Lists\n- Code blocks" : "Import a build first"}
          disabled={!stats}
          className="flex-1 w-full bg-bg-inset border border-border-subtle rounded px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-dim/40 resize-none focus:outline-none focus:border-accent disabled:opacity-40"
        />
      )}
    </div>
  );
}
