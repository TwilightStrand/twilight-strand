
import { useState, useMemo } from "react";
import type { LevelingStep } from "@/engine/guide-types";

interface LevelScrubberProps {
  steps: LevelingStep[];
  onLevelChange?: (level: number) => void;
}

export function LevelScrubber({ steps, onLevelChange }: LevelScrubberProps) {
  const [level, setLevel] = useState(1);

  const currentStep = useMemo(() => {
    let best: LevelingStep | null = null;
    for (const step of steps) {
      if (step.level <= level) {
        if (!best || step.level > best.level) best = step;
      }
    }
    return best;
  }, [level, steps]);

  const nextStep = useMemo(() => {
    return steps.find(s => s.level > level) || null;
  }, [level, steps]);

  const handleChange = (newLevel: number) => {
    setLevel(newLevel);
    onLevelChange?.(newLevel);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-text-dim">Level</span>
          <span className="text-sm font-mono font-bold text-accent tabular-nums">{level}</span>
        </div>
        <input
          type="range"
          min={1}
          max={100}
          value={level}
          onChange={e => handleChange(parseInt(e.target.value))}
          className="w-full h-1.5 bg-bg-hover rounded-full appearance-none cursor-pointer accent-accent"
        />
        <div className="flex justify-between px-0.5">
          {steps.map(step => (
            <button
              key={step.level}
              onClick={() => handleChange(step.level)}
              className={`text-[8px] font-mono transition-colors ${
                step.level <= level ? "text-accent" : "text-text-dim/40"
              }`}
              title={`Lv ${step.level}: ${step.label}`}
            >
              {step.level}
            </button>
          ))}
        </div>
      </div>

      {currentStep && (
        <div className="bg-bg-card border border-border-card rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-accent font-mono font-bold">Lv {currentStep.level}</span>
            <span className="text-xs font-mono text-text-primary">{currentStep.label}</span>
          </div>

          {currentStep.gems.length > 0 && (
            <div className="mb-2">
              <span className="text-[9px] font-mono text-text-dim uppercase">Active Setup</span>
              <div className="mt-1 space-y-1">
                {currentStep.gems.map((g, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px] font-mono bg-bg-inset rounded px-2 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                    <span className="text-text-primary font-medium">{g.name}</span>
                    {g.links.length > 0 && (
                      <span className="text-text-dim/60">
                        {g.links.map((l, j) => (
                          <span key={j}>
                            {j > 0 && " - "}
                            {l}
                          </span>
                        ))}
                      </span>
                    )}
                    <span className="text-text-dim/40 ml-auto">{g.slot}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep.treePoints && (
            <div className="text-[10px] font-mono text-text-dim/70 mb-1">
              <span className="text-text-dim">Tree:</span> {currentStep.treePoints}
            </div>
          )}

          {currentStep.notes && (
            <div className="text-[10px] font-mono text-amber-400/60 bg-amber-400/5 rounded px-2 py-1 mt-1">
              {currentStep.notes}
            </div>
          )}
        </div>
      )}

      {nextStep && (
        <div className="text-[10px] font-mono text-text-dim/50">
          Next at Lv {nextStep.level}: {nextStep.label}
        </div>
      )}
    </div>
  );
}
