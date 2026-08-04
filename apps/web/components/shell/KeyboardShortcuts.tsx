"use client";

import { useState, useEffect } from "react";

const SHORTCUTS = [
  { keys: ["Ctrl", "I"], action: "Open import dialog" },
  { keys: ["Ctrl", "S"], action: "Save build" },
  { keys: ["Ctrl", "Z"], action: "Undo tree change" },
  { keys: ["Ctrl", "Shift", "Z"], action: "Redo tree change" },
  { keys: ["?"], action: "Show shortcuts" },
  { keys: ["Esc"], action: "Close dialogs" },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (
        e.key === "?" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !(
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        )
      ) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-bg-card border border-border-card rounded-lg shadow-2xl w-full max-w-sm mx-4 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-text-heading font-display text-lg mb-4">
          Keyboard Shortcuts
        </h2>
        <div className="space-y-2">
          {SHORTCUTS.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-xs font-mono"
            >
              <span className="text-text-dim">{s.action}</span>
              <div className="flex gap-1">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="px-1.5 py-0.5 bg-bg-inset border border-border-subtle rounded text-text-primary text-[10px]"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[10px] font-mono text-text-dim/60 text-center">
          Press ? or Esc to close
        </p>
      </div>
    </div>
  );
}
