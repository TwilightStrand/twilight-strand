"use client";

import { useState, useRef, useEffect } from "react";
import { useBuildStore } from "@/stores/build-store";

export function ImportDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { importBuild, loading, error, savedBuilds, loadSavedBuilds, deleteSavedBuild } = useBuildStore();

  useEffect(() => {
    if (open) {
      loadSavedBuilds();
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open, loadSavedBuilds]);

  if (!open) return null;

  const handleImport = async () => {
    if (!input.trim()) return;
    await importBuild(input.trim());
    if (!useBuildStore.getState().error) {
      setInput("");
      onClose();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text");
    if (pasted.length > 100) {
      e.preventDefault();
      setInput(pasted);
      setTimeout(() => {
        importBuild(pasted.trim()).then(() => {
          if (!useBuildStore.getState().error) {
            setInput("");
            onClose();
          }
        });
      }, 50);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-bg-card border border-border-card rounded-lg shadow-2xl w-full max-w-lg mx-4 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-heading font-display text-lg">
            Import Build
          </h2>
          <button
            onClick={onClose}
            className="text-text-dim hover:text-text-primary text-xl leading-none px-1"
            aria-label="Close"
          >
            x
          </button>
        </div>

        <p className="text-text-dim text-xs font-mono mb-3">
          Paste a PoB build code, pastebin URL, or pobb.in link
        </p>

        <div
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.dataTransfer.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => setInput(reader.result as string);
              reader.readAsText(file);
            }
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPaste={handlePaste}
            placeholder="Paste your build code here..."
            className="w-full h-32 bg-bg-inset border border-border-subtle rounded px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-dim/40 resize-none focus:outline-none focus:border-accent"
            disabled={loading}
          />
          <div className="mt-2 text-center">
            <label className="text-[10px] font-mono text-text-dim cursor-pointer hover:text-accent transition-colors">
              or <span className="underline">upload a .xml file</span>
              <input
                type="file"
                accept=".xml,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => setInput(reader.result as string);
                    reader.readAsText(file);
                  }
                }}
              />
            </label>
          </div>
        </div>

        {error && (
          <div className="mt-2 text-blood text-xs font-mono">{error}</div>
        )}

        {savedBuilds.length > 0 && (
          <div className="mt-3 border-t border-border-subtle pt-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-dim">
              Saved Builds
            </span>
            <div className="mt-1.5 space-y-1 max-h-32 overflow-y-auto">
              {savedBuilds.map((build, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-mono">
                  <button
                    onClick={() => {
                      importBuild(build.code).then(() => {
                        if (!useBuildStore.getState().error) {
                          setInput("");
                          onClose();
                        }
                      });
                    }}
                    className="flex-1 text-left text-text-primary hover:text-accent transition-colors truncate"
                  >
                    {build.name}{" "}
                    <span className="text-text-dim">Lv {build.level}</span>
                  </button>
                  <button
                    onClick={() => deleteSavedBuild(i)}
                    className="text-text-dim hover:text-blood transition-colors shrink-0 px-1"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm font-mono text-text-dim hover:text-text-primary rounded border border-border-subtle hover:border-border-card transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading || !input.trim()}
            className="px-4 py-1.5 text-sm font-mono bg-accent/20 text-accent rounded border border-accent/30 hover:bg-accent/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Importing..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
