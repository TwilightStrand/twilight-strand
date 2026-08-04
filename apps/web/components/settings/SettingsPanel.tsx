"use client";

import { useUiStore } from "@/stores/ui-store";
import { NotesPanel } from "@/components/shell/NotesPanel";

export function SettingsPanel() {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const numberFormat = useUiStore((s) => s.numberFormat);
  const setNumberFormat = useUiStore((s) => s.setNumberFormat);
  const performanceMode = useUiStore((s) => s.performanceMode);
  const setPerformanceMode = useUiStore((s) => s.setPerformanceMode);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 max-w-lg space-y-6">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-text-dim mb-2">
            Appearance
          </h3>
          <div className="bg-bg-card border border-border-card rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-text-primary">Theme</span>
              <div className="flex gap-1">
                {(["dark", "light"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`px-2.5 py-1 rounded capitalize transition-colors ${
                      theme === t
                        ? "bg-accent/20 text-accent border border-accent/30"
                        : "text-text-dim hover:text-text-primary border border-transparent"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-text-primary">Number Format</span>
              <div className="flex gap-1">
                {([
                  { value: "us" as const, label: "1,234.5" },
                  { value: "eu" as const, label: "1.234,5" },
                ]).map((fmt) => (
                  <button
                    key={fmt.value}
                    onClick={() => setNumberFormat(fmt.value)}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      numberFormat === fmt.value
                        ? "bg-accent/20 text-accent border border-accent/30"
                        : "text-text-dim hover:text-text-primary border border-transparent"
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-text-primary">Performance Mode</span>
              <button
                onClick={() => setPerformanceMode(!performanceMode)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  performanceMode
                    ? "bg-accent/20 text-accent border border-accent/30"
                    : "text-text-dim hover:text-text-primary border border-transparent"
                }`}
              >
                {performanceMode ? "On" : "Off"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <NotesPanel />
    </div>
  );
}
