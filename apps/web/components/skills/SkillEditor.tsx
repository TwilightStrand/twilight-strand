"use client";

import { useState } from "react";
import type { SkillGroup, GemData } from "@/engine/types";
import { GemBrowser } from "./GemBrowser";

interface SkillEditorProps {
  group?: SkillGroup;
  index: number;
  onSave: (group: SkillGroup) => void;
  onCancel: () => void;
}

export function SkillEditor({ group, index, onSave, onCancel }: SkillEditorProps) {
  const [slot, setSlot] = useState(group?.slot || "");
  const [enabled, setEnabled] = useState(group?.enabled ?? true);
  const [gems, setGems] = useState<GemData[]>(group?.gems || []);
  const [browsingGem, setBrowsingGem] = useState<number | null>(null);
  const [browsingSupport, setBrowsingSupport] = useState(false);

  const updateGem = (i: number, updates: Partial<GemData>) => {
    setGems(gems.map((g, idx) => (idx === i ? { ...g, ...updates } : g)));
  };

  const removeGem = (i: number) => {
    setGems(gems.filter((_, idx) => idx !== i));
  };

  const handleBrowserSelect = (gem: { name: string; skillId: string; isSupport: boolean }) => {
    const newGem: GemData = {
      name: gem.name,
      level: 20,
      quality: 20,
      enabled: true,
      skillId: gem.skillId,
      isSupport: gem.isSupport,
    };

    if (browsingGem === -1) {
      setGems([...gems, newGem]);
    } else if (browsingGem !== null) {
      updateGem(browsingGem, newGem);
    }
    setBrowsingGem(null);
  };

  const handleSave = () => {
    const activeGem = gems.find((g) => !g.isSupport);
    onSave({
      slot,
      enabled,
      gems,
      label: activeGem?.name || slot || `Group ${index + 1}`,
    });
  };

  if (browsingGem !== null) {
    return (
      <GemBrowser
        supportOnly={browsingSupport}
        onSelect={handleBrowserSelect}
        onClose={() => setBrowsingGem(null)}
      />
    );
  }

  return (
    <div className="p-4 space-y-3 bg-bg-card border border-accent/30 rounded-lg max-w-2xl">
      <h3 className="text-sm font-mono font-bold text-text-heading">
        {group ? "Edit Socket Group" : "New Socket Group"}
      </h3>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] font-mono text-text-dim block mb-0.5">Slot</label>
          <input
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            placeholder="e.g., Body Armour"
            className="w-full bg-bg-inset border border-border-subtle rounded px-2 py-1 text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-[10px] font-mono text-text-dim block mb-0.5">Enabled</label>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`px-3 py-1 text-xs font-mono rounded ${enabled ? "bg-accent/20 text-accent" : "bg-bg-hover text-text-dim"}`}
          >
            {enabled ? "On" : "Off"}
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-mono text-text-dim">Gems</label>
          <div className="flex gap-2">
            <button
              onClick={() => { setBrowsingSupport(false); setBrowsingGem(-1); }}
              className="text-[9px] font-mono text-accent hover:text-accent/80"
            >
              + Active
            </button>
            <button
              onClick={() => { setBrowsingSupport(true); setBrowsingGem(-1); }}
              className="text-[9px] font-mono text-text-dim hover:text-accent"
            >
              + Support
            </button>
          </div>
        </div>

        <div className="space-y-1">
          {gems.map((gem, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-bg-inset rounded px-2 py-1">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${gem.isSupport ? "bg-text-dim/40" : "bg-accent"}`}
              />
              <button
                onClick={() => { setBrowsingSupport(gem.isSupport); setBrowsingGem(i); }}
                className="flex-1 text-left text-xs font-mono text-text-primary hover:text-accent transition-colors truncate min-w-0"
                title="Click to change gem"
              >
                {gem.name || "(click to select)"}
              </button>
              <input
                type="number"
                value={gem.level}
                onChange={(e) => updateGem(i, { level: parseInt(e.target.value) || 1 })}
                min={1}
                max={21}
                className="w-8 bg-transparent text-xs font-mono text-text-dim text-center"
                title="Level"
              />
              <span className="text-text-dim/30 text-[10px]">/</span>
              <input
                type="number"
                value={gem.quality}
                onChange={(e) => updateGem(i, { quality: parseInt(e.target.value) || 0 })}
                min={0}
                max={30}
                className="w-8 bg-transparent text-xs font-mono text-text-dim text-center"
                title="Quality"
              />
              <button
                onClick={() => removeGem(i)}
                className="text-text-dim/40 hover:text-blood text-xs transition-colors"
              >
                x
              </button>
            </div>
          ))}
          {gems.length === 0 && (
            <p className="text-[10px] font-mono text-text-dim/40 text-center py-2">
              No gems added yet
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-xs font-mono text-text-dim hover:text-text-primary border border-border-subtle rounded transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-1 text-xs font-mono bg-accent/20 text-accent border border-accent/30 rounded hover:bg-accent/30 transition-colors"
        >
          {group ? "Update" : "Create"}
        </button>
      </div>
    </div>
  );
}
