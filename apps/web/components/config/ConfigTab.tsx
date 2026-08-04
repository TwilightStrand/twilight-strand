"use client";

import { useState } from "react";
import { useBuildStore } from "@/stores/build-store";

interface ConfigOption {
  id: string;
  label: string;
  type: "check" | "select" | "number";
  value: boolean | string | number;
  options?: string[];
  category: string;
}

const DEFAULT_CONFIG: ConfigOption[] = [
  // General
  { id: "enemyIsBoss", label: "Enemy is a Boss", type: "select", value: "None", options: ["None", "Pinnacle Boss", "Uber Pinnacle Boss", "Map Boss", "Guardian/Pinnacle", "Shaper/Elder"], category: "General" },
  { id: "enemyLevel", label: "Enemy Level", type: "number", value: 84, category: "General" },
  { id: "enemyPhysReduction", label: "Enemy Phys Reduction", type: "number", value: 0, category: "General" },
  { id: "enemyFireRes", label: "Enemy Fire Resistance", type: "number", value: 0, category: "General" },
  { id: "enemyColdRes", label: "Enemy Cold Resistance", type: "number", value: 0, category: "General" },
  { id: "enemyLightningRes", label: "Enemy Lightning Resistance", type: "number", value: 0, category: "General" },
  { id: "enemyChaosRes", label: "Enemy Chaos Resistance", type: "number", value: 0, category: "General" },
  // Charges
  { id: "usePowerCharges", label: "Use Power Charges", type: "check", value: false, category: "Charges" },
  { id: "useFrenzyCharges", label: "Use Frenzy Charges", type: "check", value: false, category: "Charges" },
  { id: "useEnduranceCharges", label: "Use Endurance Charges", type: "check", value: false, category: "Charges" },
  { id: "overridePowerCharges", label: "Power Charge Count", type: "number", value: 0, category: "Charges" },
  { id: "overrideFrenzyCharges", label: "Frenzy Charge Count", type: "number", value: 0, category: "Charges" },
  { id: "overrideEnduranceCharges", label: "Endurance Charge Count", type: "number", value: 0, category: "Charges" },
  // Combat
  { id: "conditionStationary", label: "Are you Stationary?", type: "check", value: false, category: "Combat" },
  { id: "conditionMoving", label: "Are you Moving?", type: "check", value: false, category: "Combat" },
  { id: "conditionFullLife", label: "Are you on Full Life?", type: "check", value: false, category: "Combat" },
  { id: "conditionLowLife", label: "Are you on Low Life?", type: "check", value: false, category: "Combat" },
  { id: "conditionFullEnergyShield", label: "Are you on Full Energy Shield?", type: "check", value: false, category: "Combat" },
  { id: "conditionLowEnergyShield", label: "Are you on Low Energy Shield?", type: "check", value: false, category: "Combat" },
  { id: "conditionFortified", label: "Are you Fortified?", type: "check", value: false, category: "Combat" },
  { id: "conditionElusive", label: "Are you Elusive?", type: "check", value: false, category: "Combat" },
  // Buffs
  { id: "conditionOnslaught", label: "Do you have Onslaught?", type: "check", value: false, category: "Buffs" },
  { id: "conditionUnholyMight", label: "Do you have Unholy Might?", type: "check", value: false, category: "Buffs" },
  { id: "buffTailwind", label: "Do you have Tailwind?", type: "check", value: false, category: "Buffs" },
  { id: "conditionOnConsecratedGround", label: "On Consecrated Ground?", type: "check", value: false, category: "Buffs" },
  { id: "conditionFocused", label: "Are you Focused?", type: "check", value: false, category: "Buffs" },
  { id: "conditionLeeching", label: "Are you Leeching?", type: "check", value: false, category: "Buffs" },
  // Enemy conditions
  { id: "conditionEnemyCursed", label: "Is the enemy Cursed?", type: "check", value: false, category: "Enemy" },
  { id: "conditionEnemyBlinded", label: "Is the enemy Blinded?", type: "check", value: false, category: "Enemy" },
  { id: "conditionEnemyMaimed", label: "Is the enemy Maimed?", type: "check", value: false, category: "Enemy" },
  { id: "conditionEnemyBurning", label: "Is the enemy Burning?", type: "check", value: false, category: "Enemy" },
  { id: "conditionEnemyChilled", label: "Is the enemy Chilled?", type: "check", value: false, category: "Enemy" },
  { id: "conditionEnemyFrozen", label: "Is the enemy Frozen?", type: "check", value: false, category: "Enemy" },
  { id: "conditionEnemyShocked", label: "Is the enemy Shocked?", type: "check", value: false, category: "Enemy" },
  { id: "conditionEnemyIntimidated", label: "Is the enemy Intimidated?", type: "check", value: false, category: "Enemy" },
  // Flasks
  { id: "flaskEffect", label: "Flask Effect Active", type: "check", value: false, category: "Flasks" },
];

function ConfigSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-accent-dim mb-2">
        {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function BuildInfoSection() {
  const xml = useBuildStore((s) => s.xml);
  const stats = useBuildStore((s) => s.stats);

  let bandit = "None";
  let pantheonMajor = "None";
  let pantheonMinor = "None";
  if (xml) {
    const banditMatch = xml.match(/bandit="([^"]+)"/);
    const majorMatch = xml.match(/pantheonMajorGod="([^"]+)"/);
    const minorMatch = xml.match(/pantheonMinorGod="([^"]+)"/);
    if (banditMatch) bandit = banditMatch[1];
    if (majorMatch) pantheonMajor = majorMatch[1];
    if (minorMatch) pantheonMinor = minorMatch[1];
  }

  if (!stats) return null;

  const fmtPantheon = (s: string) =>
    s === "None" ? "Not selected" : s.replace(/([A-Z])/g, " $1").trim();

  return (
    <ConfigSection title="Build Info">
      <div className="flex items-center justify-between py-1">
        <span className="text-xs font-mono text-text-primary">Class</span>
        <span className="text-xs font-mono text-text-dim">
          {stats.ascendancy || stats.class_name} (Lv {stats.level})
        </span>
      </div>
      <div className="flex items-center justify-between py-1">
        <span className="text-xs font-mono text-text-primary">Bandit</span>
        <span className="text-xs font-mono text-text-dim">
          {bandit === "None" ? "Kill All" : bandit}
        </span>
      </div>
      <div className="flex items-center justify-between py-1">
        <span className="text-xs font-mono text-text-primary">Major Pantheon</span>
        <span className="text-xs font-mono text-text-dim">{fmtPantheon(pantheonMajor)}</span>
      </div>
      <div className="flex items-center justify-between py-1">
        <span className="text-xs font-mono text-text-primary">Minor Pantheon</span>
        <span className="text-xs font-mono text-text-dim">{fmtPantheon(pantheonMinor)}</span>
      </div>
      <div className="flex items-center justify-between py-1">
        <span className="text-xs font-mono text-text-primary">Tree Version</span>
        <span className="text-xs font-mono text-text-dim">{stats.tree_version || "3_29"}</span>
      </div>
    </ConfigSection>
  );
}

const PRESETS: { name: string; config: Record<string, boolean | string | number> }[] = [
  {
    name: "Mapping",
    config: {
      usePowerCharges: true,
      useFrenzyCharges: true,
      conditionMoving: true,
      conditionOnslaught: true,
      enemyIsBoss: "None",
    },
  },
  {
    name: "Bossing",
    config: {
      usePowerCharges: true,
      conditionStationary: true,
      conditionFocused: true,
      enemyIsBoss: "Pinnacle Boss",
      conditionEnemyCursed: true,
    },
  },
  {
    name: "Default",
    config: {},
  },
];

export function ConfigTab() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [configDirty, setConfigDirty] = useState(false);
  const setConfigOverride = useBuildStore((s) => s.setConfigOverride);
  const reEvaluate = useBuildStore((s) => s.reEvaluate);
  const evaluating = useBuildStore((s) => s.evaluating);

  const updateValue = (id: string, value: boolean | string | number) => {
    setConfig((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, value } : opt))
    );
    setConfigOverride(id, value);
    setConfigDirty(true);
  };

  const applyPreset = (preset: typeof PRESETS[number]) => {
    // Reset all to defaults first
    setConfig(DEFAULT_CONFIG);
    // Then apply preset values
    for (const [key, value] of Object.entries(preset.config)) {
      updateValue(key, value);
    }
  };

  const categories = [...new Set(config.map((c) => c.category))];

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-2xl">
        <h2 className="text-text-heading font-display text-lg mb-4">
          Configuration
        </h2>

        <div className="flex items-center gap-1.5 mb-4">
          <span className="text-[10px] font-mono text-text-dim mr-1">Presets:</span>
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-bg-card border border-border-subtle text-text-dim hover:text-accent hover:border-accent/30 transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>

        {configDirty && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-400/10 border border-amber-400/20 rounded text-[10px] font-mono text-amber-400 mb-3">
            <span>Config changed.</span>
            <button
              onClick={() => { reEvaluate(); setConfigDirty(false); }}
              disabled={evaluating}
              className="underline hover:text-amber-300 disabled:opacity-40"
            >
              {evaluating ? "Calculating..." : "Recalculate"}
            </button>
            <button onClick={() => setConfigDirty(false)} className="text-text-dim hover:text-text-primary ml-auto">x</button>
          </div>
        )}

        <BuildInfoSection />

        {categories.map((cat) => (
          <ConfigSection key={cat} title={cat}>
            {config
              .filter((opt) => opt.category === cat)
              .map((opt) => (
                <div
                  key={opt.id}
                  className="flex items-center justify-between gap-4 py-1"
                >
                  <label
                    htmlFor={opt.id}
                    className="text-xs font-mono text-text-primary"
                  >
                    {opt.label}
                  </label>

                  {opt.type === "check" && (
                    <input
                      id={opt.id}
                      type="checkbox"
                      checked={opt.value as boolean}
                      onChange={(e) => updateValue(opt.id, e.target.checked)}
                      className="accent-accent w-4 h-4"
                    />
                  )}

                  {opt.type === "select" && (
                    <select
                      id={opt.id}
                      value={opt.value as string}
                      onChange={(e) => updateValue(opt.id, e.target.value)}
                      className="bg-bg-inset border border-border-subtle rounded px-2 py-0.5 text-xs font-mono text-text-primary"
                    >
                      {opt.options?.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  )}

                  {opt.type === "number" && (
                    <input
                      id={opt.id}
                      type="number"
                      value={opt.value as number}
                      onChange={(e) =>
                        updateValue(opt.id, parseFloat(e.target.value) || 0)
                      }
                      className="bg-bg-inset border border-border-subtle rounded px-2 py-0.5 text-xs font-mono text-text-primary w-20 text-right tabular-nums"
                    />
                  )}
                </div>
              ))}
          </ConfigSection>
        ))}

        <p className="text-text-dim text-[10px] font-mono mt-6">
          Config changes will trigger re-evaluation when the engine is connected.
        </p>
      </div>
    </div>
  );
}
