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
  // Skill Options
  { id: "conditionChannelling", label: "Are you Channelling?", type: "check", value: false, category: "Skill Options" },
  { id: "conditionAttacking", label: "Are you Attacking?", type: "check", value: false, category: "Skill Options" },
  { id: "conditionCasting", label: "Are you Casting?", type: "check", value: false, category: "Skill Options" },
  { id: "conditionUsedSkillRecently", label: "Used a Skill Recently?", type: "check", value: false, category: "Skill Options" },
  { id: "conditionKilledRecently", label: "Killed Recently?", type: "check", value: false, category: "Skill Options" },
  { id: "conditionKilledAffectedByDoT", label: "Killed DoT enemy Recently?", type: "check", value: false, category: "Skill Options" },
  { id: "conditionCritRecently", label: "Crit Recently?", type: "check", value: false, category: "Skill Options" },
  { id: "conditionNonCritRecently", label: "Non-Crit Recently?", type: "check", value: false, category: "Skill Options" },
  { id: "conditionBlockedRecently", label: "Blocked Recently?", type: "check", value: false, category: "Skill Options" },
  { id: "conditionTakenHitRecently", label: "Taken Hit Recently?", type: "check", value: false, category: "Skill Options" },
  { id: "conditionHitByFireRecently", label: "Hit by Fire Recently?", type: "check", value: false, category: "Skill Options" },
  { id: "conditionHitByColdRecently", label: "Hit by Cold Recently?", type: "check", value: false, category: "Skill Options" },
  { id: "conditionHitByLightningRecently", label: "Hit by Lightning Recently?", type: "check", value: false, category: "Skill Options" },
  // More Buffs
  { id: "buffTailwind", label: "Tailwind", type: "check", value: false, category: "Buffs" },
  { id: "conditionAdrenaline", label: "Adrenaline", type: "check", value: false, category: "Buffs" },
  { id: "conditionArcaneSurge", label: "Arcane Surge", type: "check", value: false, category: "Buffs" },
  { id: "conditionRage", label: "Rage Active", type: "check", value: false, category: "Buffs" },
  { id: "rageCount", label: "Rage Stacks", type: "number", value: 0, category: "Buffs" },
  { id: "conditionInspiration", label: "Inspiration Charges", type: "check", value: false, category: "Buffs" },
  { id: "conditionBrittle", label: "Enemy has Brittle", type: "check", value: false, category: "Buffs" },
  { id: "conditionSapped", label: "Enemy is Sapped", type: "check", value: false, category: "Buffs" },
  { id: "conditionScorched", label: "Enemy is Scorched", type: "check", value: false, category: "Buffs" },
  // Defences
  { id: "conditionUsedGuardRecently", label: "Used Guard Skill Recently?", type: "check", value: false, category: "Defences" },
  { id: "conditionHavePhysAegis", label: "Physical Aegis Active?", type: "check", value: false, category: "Defences" },
  { id: "conditionHaveEleAegis", label: "Elemental Aegis Active?", type: "check", value: false, category: "Defences" },
  { id: "conditionLeechingLife", label: "Leeching Life?", type: "check", value: false, category: "Defences" },
  { id: "conditionLeechingES", label: "Leeching Energy Shield?", type: "check", value: false, category: "Defences" },
  { id: "conditionOnBurningGround", label: "On Burning Ground?", type: "check", value: false, category: "Defences" },
  { id: "conditionOnChilledGround", label: "On Chilled Ground?", type: "check", value: false, category: "Defences" },
  { id: "conditionOnShockedGround", label: "On Shocked Ground?", type: "check", value: false, category: "Defences" },
  // Map Mods
  { id: "mapModPlayerDamagePenalty", label: "Players deal X% less Damage", type: "number", value: 0, category: "Map Mods" },
  { id: "mapModEnemyExtraDamage", label: "Monsters deal X% extra Damage", type: "number", value: 0, category: "Map Mods" },
  { id: "mapModEnemySpeed", label: "Monsters have X% inc. Speed", type: "number", value: 0, category: "Map Mods" },
  { id: "mapModEnemyCritChance", label: "Monsters have X% inc. Crit", type: "number", value: 0, category: "Map Mods" },
  { id: "mapModNoLeech", label: "Cannot Leech", type: "check", value: false, category: "Map Mods" },
  { id: "mapModNoRegen", label: "No Regeneration", type: "check", value: false, category: "Map Mods" },
  { id: "mapModLessRecovery", label: "60% Less Recovery", type: "check", value: false, category: "Map Mods" },
  { id: "mapModReflectPhys", label: "Phys Reflect", type: "check", value: false, category: "Map Mods" },
  { id: "mapModReflectEle", label: "Ele Reflect", type: "check", value: false, category: "Map Mods" },
  { id: "mapModNoFlasks", label: "Players cannot use Flasks", type: "check", value: false, category: "Map Mods" },
  { id: "mapModAvoidAilments", label: "Monsters avoid Ailments", type: "check", value: false, category: "Map Mods" },
  { id: "mapModEnemyExtraFire", label: "Extra Fire Damage", type: "check", value: false, category: "Map Mods" },
  { id: "mapModEnemyExtraCold", label: "Extra Cold Damage", type: "check", value: false, category: "Map Mods" },
  { id: "mapModEnemyExtraLightning", label: "Extra Lightning Damage", type: "check", value: false, category: "Map Mods" },
  // Minions
  { id: "conditionMinionFullLife", label: "Minions on Full Life?", type: "check", value: false, category: "Minions" },
  { id: "conditionMinionKilledRecently", label: "Minion Killed Recently?", type: "check", value: false, category: "Minions" },
  { id: "conditionHaveMinionSkill", label: "Using Minion Skill?", type: "check", value: false, category: "Minions" },
  { id: "minionCount", label: "Number of Minions", type: "number", value: 0, category: "Minions" },
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
      conditionKilledRecently: true,
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
    name: "Uber Boss",
    config: {
      usePowerCharges: true,
      conditionStationary: true,
      conditionFocused: true,
      enemyIsBoss: "Uber Pinnacle Boss",
      conditionEnemyCursed: true,
    },
  },
  {
    name: "Default",
    config: {},
  },
];

const MAP_PRESETS: { name: string; config: Record<string, boolean | string | number> }[] = [
  { name: "Alch & Go", config: {} },
  { name: "Juiced", config: { mapModEnemyExtraDamage: 30, mapModEnemySpeed: 20 } },
  { name: "No Regen", config: { mapModNoRegen: true } },
  { name: "Less Recovery", config: { mapModLessRecovery: true } },
  { name: "Phys Reflect", config: { mapModReflectPhys: true } },
  { name: "Ele Reflect", config: { mapModReflectEle: true } },
];

export function ConfigTab() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [configDirty, setConfigDirty] = useState(false);
  const [customMods, setCustomMods] = useState("");
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

  const [configFilter, setConfigFilter] = useState("");

  const filteredConfig = configFilter.trim()
    ? config.filter(opt => opt.label.toLowerCase().includes(configFilter.toLowerCase()))
    : config;
  const categories = [...new Set(filteredConfig.map((c) => c.category))];

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

        <input
          type="text"
          value={configFilter}
          onChange={e => setConfigFilter(e.target.value)}
          placeholder="Filter options..."
          className="w-full bg-bg-inset border border-border-subtle rounded px-2.5 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-dim/40 focus:outline-none focus:border-accent mb-3"
        />

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
            {filteredConfig
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

        {categories.includes("Map Mods") && (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-[10px] font-mono text-text-dim mr-1">Map Presets:</span>
            {MAP_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  for (const [key, value] of Object.entries(preset.config)) {
                    updateValue(key, value);
                  }
                }}
                className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-bg-card border border-border-subtle text-text-dim hover:text-accent hover:border-accent/30 transition-colors"
              >
                {preset.name}
              </button>
            ))}
          </div>
        )}

        <ConfigSection title="Custom Modifiers">
          <textarea
            value={customMods}
            onChange={(e) => {
              setCustomMods(e.target.value);
              const lines = e.target.value.split("\n").filter((l: string) => l.trim());
              setConfigOverride("customMods", lines.join("|"));
              setConfigDirty(true);
            }}
            placeholder={"Enter one modifier per line:\n+100 to maximum Life\n20% increased Damage\n+30% to Fire Resistance"}
            rows={4}
            className="w-full bg-bg-inset border border-border-subtle rounded px-2 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-dim/30 resize-none focus:outline-none focus:border-accent"
          />
          <p className="text-[9px] font-mono text-text-dim/50 mt-1">
            Modifiers applied on recalculate. Same format as tree node stats.
          </p>
        </ConfigSection>

        <p className="text-text-dim text-[10px] font-mono mt-6">
          Config changes will trigger re-evaluation when the engine is connected.
        </p>
      </div>
    </div>
  );
}
