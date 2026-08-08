
import { useState } from "react";
import type { BuildGuide, LevelingStep } from "@/engine/guide-types";

interface GuideEditorProps {
  initial?: BuildGuide;
  onSave: (guide: BuildGuide) => void;
  onClose: () => void;
}

const CLASSES = ["Marauder", "Ranger", "Witch", "Duelist", "Templar", "Shadow", "Scion"];
const ASCENDANCIES: Record<string, string[]> = {
  Marauder: ["Juggernaut", "Berserker", "Chieftain"],
  Ranger: ["Deadeye", "Raider", "Pathfinder"],
  Witch: ["Necromancer", "Elementalist", "Occultist"],
  Duelist: ["Slayer", "Gladiator", "Champion"],
  Templar: ["Inquisitor", "Hierophant", "Guardian"],
  Shadow: ["Assassin", "Saboteur", "Trickster"],
  Scion: ["Ascendant"],
};

function StepEditor({
  step,
  index,
  onChange,
  onRemove,
}: {
  step: LevelingStep;
  index: number;
  onChange: (step: LevelingStep) => void;
  onRemove: () => void;
}) {
  return (
    <div className="bg-bg-inset rounded p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-accent/70">
          Step {index + 1}
        </span>
        <button
          onClick={onRemove}
          className="text-[9px] font-mono text-red-400/60 hover:text-red-400"
        >
          Remove
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] font-mono text-text-dim block mb-0.5">Level</label>
          <input
            type="number"
            value={step.level}
            onChange={(e) => onChange({ ...step, level: parseInt(e.target.value) || 1 })}
            className="w-full bg-bg-card border border-border-subtle rounded px-2 py-1 text-xs font-mono text-text-primary"
          />
        </div>
        <div>
          <label className="text-[9px] font-mono text-text-dim block mb-0.5">Label</label>
          <input
            type="text"
            value={step.label}
            onChange={(e) => onChange({ ...step, label: e.target.value })}
            className="w-full bg-bg-card border border-border-subtle rounded px-2 py-1 text-xs font-mono text-text-primary"
          />
        </div>
      </div>

      <div>
        <label className="text-[9px] font-mono text-text-dim block mb-0.5">Tree Points</label>
        <input
          type="text"
          value={step.treePoints}
          onChange={(e) => onChange({ ...step, treePoints: e.target.value })}
          className="w-full bg-bg-card border border-border-subtle rounded px-2 py-1 text-xs font-mono text-text-primary"
        />
      </div>

      <div>
        <label className="text-[9px] font-mono text-text-dim block mb-0.5">Notes</label>
        <textarea
          value={step.notes || ""}
          onChange={(e) => onChange({ ...step, notes: e.target.value || undefined })}
          rows={2}
          className="w-full bg-bg-card border border-border-subtle rounded px-2 py-1 text-xs font-mono text-text-primary resize-none"
        />
      </div>
    </div>
  );
}

export function GuideEditor({ initial, onSave, onClose }: GuideEditorProps) {
  const [guide, setGuide] = useState<BuildGuide>(
    initial || {
      name: "",
      class: "Marauder",
      ascendancy: "Juggernaut",
      difficulty: "beginner",
      budget: "low",
      playstyle: "",
      pros: [""],
      cons: [""],
      leveling: [
        { level: 1, label: "Start", gems: [], treePoints: "" },
      ],
    }
  );

  const updateStep = (index: number, step: LevelingStep) => {
    const leveling = [...guide.leveling];
    leveling[index] = step;
    setGuide({ ...guide, leveling });
  };

  const addStep = () => {
    const lastLevel = guide.leveling[guide.leveling.length - 1]?.level || 1;
    setGuide({
      ...guide,
      leveling: [
        ...guide.leveling,
        { level: lastLevel + 10, label: "", gems: [], treePoints: "" },
      ],
    });
  };

  const removeStep = (index: number) => {
    setGuide({
      ...guide,
      leveling: guide.leveling.filter((_, i) => i !== index),
    });
  };

  const save = () => {
    if (!guide.name.trim()) return;
    onSave(guide);
  };

  return (
    <div className="p-4 max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-text-heading font-display text-lg">
          {initial ? "Edit Guide" : "Create Guide"}
        </h2>
        <div className="flex gap-1.5">
          <button
            onClick={save}
            disabled={!guide.name.trim()}
            className="text-[10px] font-mono px-3 py-1 rounded bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 disabled:opacity-40"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="text-[10px] font-mono px-3 py-1 rounded text-text-dim hover:text-text-primary"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] font-mono text-text-dim block mb-0.5">Guide Name</label>
          <input
            type="text"
            value={guide.name}
            onChange={(e) => setGuide({ ...guide, name: e.target.value })}
            placeholder="e.g. Lightning Arrow Deadeye"
            className="w-full bg-bg-inset border border-border-subtle rounded px-2.5 py-1.5 text-xs font-mono text-text-primary"
          />
        </div>
        <div>
          <label className="text-[9px] font-mono text-text-dim block mb-0.5">Playstyle</label>
          <input
            type="text"
            value={guide.playstyle}
            onChange={(e) => setGuide({ ...guide, playstyle: e.target.value })}
            placeholder="e.g. Fast clearing bow build"
            className="w-full bg-bg-inset border border-border-subtle rounded px-2.5 py-1.5 text-xs font-mono text-text-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="text-[9px] font-mono text-text-dim block mb-0.5">Class</label>
          <select
            value={guide.class}
            onChange={(e) => {
              const cls = e.target.value;
              setGuide({ ...guide, class: cls, ascendancy: ASCENDANCIES[cls]?.[0] || "" });
            }}
            className="w-full bg-bg-inset border border-border-subtle rounded px-2 py-1.5 text-xs font-mono text-text-primary"
          >
            {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[9px] font-mono text-text-dim block mb-0.5">Ascendancy</label>
          <select
            value={guide.ascendancy}
            onChange={(e) => setGuide({ ...guide, ascendancy: e.target.value })}
            className="w-full bg-bg-inset border border-border-subtle rounded px-2 py-1.5 text-xs font-mono text-text-primary"
          >
            {(ASCENDANCIES[guide.class] || []).map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[9px] font-mono text-text-dim block mb-0.5">Difficulty</label>
          <select
            value={guide.difficulty}
            onChange={(e) => setGuide({ ...guide, difficulty: e.target.value as BuildGuide["difficulty"] })}
            className="w-full bg-bg-inset border border-border-subtle rounded px-2 py-1.5 text-xs font-mono text-text-primary"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] font-mono text-text-dim block mb-0.5">Budget</label>
          <select
            value={guide.budget}
            onChange={(e) => setGuide({ ...guide, budget: e.target.value as BuildGuide["budget"] })}
            className="w-full bg-bg-inset border border-border-subtle rounded px-2 py-1.5 text-xs font-mono text-text-primary"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] font-mono text-text-dim block mb-0.5">Pros</label>
          {guide.pros.map((pro, i) => (
            <div key={i} className="flex gap-1 mb-1">
              <input
                type="text"
                value={pro}
                onChange={(e) => {
                  const pros = [...guide.pros];
                  pros[i] = e.target.value;
                  setGuide({ ...guide, pros });
                }}
                className="flex-1 bg-bg-inset border border-border-subtle rounded px-2 py-1 text-xs font-mono text-text-primary"
              />
              {i === guide.pros.length - 1 && (
                <button
                  onClick={() => setGuide({ ...guide, pros: [...guide.pros, ""] })}
                  className="text-accent text-xs px-1"
                >+</button>
              )}
            </div>
          ))}
        </div>
        <div>
          <label className="text-[9px] font-mono text-text-dim block mb-0.5">Cons</label>
          {guide.cons.map((con, i) => (
            <div key={i} className="flex gap-1 mb-1">
              <input
                type="text"
                value={con}
                onChange={(e) => {
                  const cons = [...guide.cons];
                  cons[i] = e.target.value;
                  setGuide({ ...guide, cons });
                }}
                className="flex-1 bg-bg-inset border border-border-subtle rounded px-2 py-1 text-xs font-mono text-text-primary"
              />
              {i === guide.cons.length - 1 && (
                <button
                  onClick={() => setGuide({ ...guide, cons: [...guide.cons, ""] })}
                  className="text-accent text-xs px-1"
                >+</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-text-dim">
            Leveling Steps
          </label>
          <button
            onClick={addStep}
            className="text-[9px] font-mono text-accent hover:text-accent/80"
          >
            + Add Step
          </button>
        </div>
        <div className="space-y-2">
          {guide.leveling.map((step, i) => (
            <StepEditor
              key={i}
              step={step}
              index={i}
              onChange={(s) => updateStep(i, s)}
              onRemove={() => removeStep(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
