"use client";

import { useState } from "react";
import type { BuildGuide, LevelingStep } from "@/engine/guide-types";
import { LevelScrubber } from "./LevelScrubber";

function StepCard({ step }: { step: LevelingStep }) {
  return (
    <div className="border border-border-card rounded-lg p-3 bg-bg-card">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-accent font-mono font-bold text-sm">Lv {step.level}</span>
        <span className="text-xs font-mono text-text-primary">{step.label}</span>
      </div>

      {step.gems.length > 0 && (
        <div className="mb-2">
          <span className="text-[9px] font-mono text-text-dim uppercase">Gems</span>
          <div className="mt-0.5 space-y-0.5">
            {step.gems.map((g, i) => (
              <div key={i} className="text-[10px] font-mono text-text-dim">
                <span className="text-text-primary">{g.name}</span>
                {g.links.length > 0 && (
                  <span className="text-text-dim/60"> + {g.links.join(", ")}</span>
                )}
                {g.slot && <span className="text-text-dim/40"> ({g.slot})</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {step.treePoints && (
        <div className="text-[10px] font-mono text-text-dim/70">
          Tree: {step.treePoints}
        </div>
      )}

      {step.notes && (
        <div className="text-[10px] font-mono text-amber-400/60 mt-1">
          {step.notes}
        </div>
      )}
    </div>
  );
}

export function GuideViewer({
  guide,
  onImport,
}: {
  guide: BuildGuide;
  onImport?: (code: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-mono font-bold text-text-heading">{guide.name}</h3>
        <div className="flex flex-wrap gap-2 mt-0.5">
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-accent/10 text-accent">
            {guide.difficulty}
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400">
            {guide.budget} budget
          </span>
          <span className="text-[9px] font-mono text-text-dim">{guide.playstyle}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-[9px] font-mono text-green-400/70 uppercase">Pros</span>
          {guide.pros.map((p, i) => (
            <div key={i} className="text-[10px] font-mono text-text-dim">
              + {p}
            </div>
          ))}
        </div>
        <div>
          <span className="text-[9px] font-mono text-red-400/70 uppercase">Cons</span>
          {guide.cons.map((c, i) => (
            <div key={i} className="text-[10px] font-mono text-text-dim">
              - {c}
            </div>
          ))}
        </div>
      </div>

      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-mono text-accent hover:text-accent/80 mb-2"
        >
          {expanded ? "Hide" : "Show"} Leveling Guide ({guide.leveling.length} steps)
        </button>

        {expanded && (
          <div className="space-y-4">
            <LevelScrubber steps={guide.leveling} />
            <div className="border-t border-border-subtle pt-3 space-y-2">
              <span className="text-[9px] font-mono text-text-dim uppercase">All Steps</span>
              {guide.leveling.map((step, i) => (
                <StepCard key={i} step={step} />
              ))}
            </div>
          </div>
        )}
      </div>

      {guide.endgamePobCode && onImport && (
        <button
          onClick={() => onImport(guide.endgamePobCode!)}
          className="w-full text-xs font-mono px-3 py-1.5 rounded bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 transition-colors"
        >
          Import Endgame Build
        </button>
      )}
    </div>
  );
}
