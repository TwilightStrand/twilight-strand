"use client";

import { create } from "zustand";

export type NodePowerMode = "off" | "dps" | "defence" | "both";

interface NodePowerState {
  mode: NodePowerMode;
  depth: number;
  scoring: boolean;
  scoredCount: number;
  setMode: (mode: NodePowerMode) => void;
  setDepth: (depth: number) => void;
  setScoring: (scoring: boolean, count?: number) => void;
}

export const useNodePowerStore = create<NodePowerState>((set) => ({
  mode: "off",
  depth: 5,
  scoring: false,
  scoredCount: 0,
  setMode: (mode) => set({ mode }),
  setDepth: (depth) => set({ depth }),
  setScoring: (scoring, count) =>
    set({ scoring, scoredCount: count ?? 0 }),
}));

const DEPTHS = [5, 10, 15, -1] as const;
const DEPTH_LABELS: Record<number, string> = {
  5: "5",
  10: "10",
  15: "15",
  [-1]: "All",
};

export function NodePowerControls() {
  const { mode, setMode, depth, setDepth, scoring, scoredCount } =
    useNodePowerStore();

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-bg-card/90 backdrop-blur-sm border border-border-card rounded-lg px-3 py-2 z-10">
      <span className="text-[10px] font-mono text-text-dim uppercase tracking-wider mr-1">
        Node power
      </span>

      {(["off", "dps", "defence", "both"] as const).map((m) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
            mode === m
              ? "bg-accent/20 text-accent border border-accent/30"
              : "text-text-dim hover:text-text-primary border border-transparent"
          }`}
        >
          {m === "off" ? "Off" : m === "dps" ? "DPS" : m === "defence" ? "Defence" : "Both"}
        </button>
      ))}

      {mode !== "off" && (
        <>
          <span className="text-border-card">|</span>
          <span className="text-[10px] font-mono text-text-dim">Points</span>
          {DEPTHS.map((d) => (
            <button
              key={d}
              onClick={() => setDepth(d)}
              className={`px-1.5 py-0.5 text-xs font-mono rounded transition-colors ${
                depth === d
                  ? "bg-bg-hover text-text-primary"
                  : "text-text-dim hover:text-text-primary"
              }`}
            >
              {DEPTH_LABELS[d]}
            </button>
          ))}

          {scoring && (
            <span className="text-[10px] font-mono text-accent animate-pulse ml-2">
              Scoring...
            </span>
          )}
          {!scoring && scoredCount > 0 && (
            <span className="text-[10px] font-mono text-text-dim ml-2">
              {scoredCount} nodes scored
            </span>
          )}
        </>
      )}

      {mode !== "off" && (
        <>
          <span className="text-border-card">|</span>
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-mono text-text-dim">low</span>
            <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-orange-500 via-yellow-400 to-green-400" />
            <span className="text-[9px] font-mono text-text-dim">high</span>
          </div>
        </>
      )}
    </div>
  );
}
