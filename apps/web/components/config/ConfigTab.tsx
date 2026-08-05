"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { CONFIG_OPTIONS, CONFIG_SECTIONS, type ConfigOptionDef } from "@/data/config-options.generated";
import { useBuildStore } from "@/stores/build-store";

function stripTrailingColon(s: string): string {
  return s.endsWith(":") ? s.slice(0, -1).trim() : s.trim();
}

function isOptionVisible(
  opt: ConfigOptionDef,
  activeSkills: Set<string>,
  activeConditions: Set<string>,
  activeFlags: Set<string>,
  showAll: boolean,
): boolean {
  if (showAll) return true;
  if (!opt.visibility) return true;

  const v = opt.visibility;

  if (v.ifSkill) {
    if (!v.ifSkill.some((s) => activeSkills.has(s))) return false;
  }
  if (v.ifCond) {
    if (!v.ifCond.some((c) => activeConditions.has(c))) return false;
  }
  if (v.ifFlag) {
    if (!v.ifFlag.some((f) => activeFlags.has(f))) return false;
  }

  return true;
}

function ConfigSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="mb-4">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1.5 w-full text-left mb-2 group"
      >
        <span className="text-[10px] text-text-dim group-hover:text-text-primary transition-colors">
          {collapsed ? "▸" : "▾"}
        </span>
        <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-accent-dim">{title}</h3>
      </button>
      {!collapsed && <div className="space-y-1">{children}</div>}
    </div>
  );
}

const ConfigControl = memo(function ConfigControl({
  opt,
  value,
  onChange,
}: {
  opt: ConfigOptionDef;
  value: boolean | string | number;
  onChange: (val: boolean | string | number) => void;
}) {
  const label = stripTrailingColon(opt.label);

  return (
    <div className="flex items-center justify-between gap-4 py-0.5 min-h-[28px]">
      <label htmlFor={opt.id} className="text-xs font-mono text-text-primary leading-tight flex-1">
        {label}
        {opt.visibility?.ifSkill && (
          <span className="text-text-dim/40 text-[9px] ml-1">({opt.visibility.ifSkill[0]})</span>
        )}
      </label>

      {opt.type === "check" && (
        <input
          id={opt.id}
          type="checkbox"
          checked={value as boolean}
          onChange={(e) => onChange(e.target.checked)}
          className="accent-accent w-4 h-4 shrink-0"
        />
      )}

      {opt.type === "select" && opt.options && (
        <select
          id={opt.id}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="bg-bg-inset border border-border-subtle rounded px-2 py-0.5 text-xs font-mono text-text-primary max-w-[180px] shrink-0"
        >
          {opt.options.map((o) => (
            <option key={String(o.val)} value={String(o.val)}>
              {o.label}
            </option>
          ))}
        </select>
      )}

      {opt.type === "number" && (
        <input
          id={opt.id}
          type="number"
          value={value as number}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="bg-bg-inset border border-border-subtle rounded px-2 py-0.5 text-xs font-mono text-text-primary w-20 text-right tabular-nums shrink-0"
        />
      )}

      {opt.type === "text" && (
        <input
          id={opt.id}
          type="text"
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          className="bg-bg-inset border border-border-subtle rounded px-2 py-0.5 text-xs font-mono text-text-primary w-40 shrink-0"
        />
      )}
    </div>
  );
});

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

  const fmtPantheon = (s: string) => (s === "None" ? "Not selected" : s.replace(/([A-Z])/g, " $1").trim());

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
        <span className="text-xs font-mono text-text-dim">{bandit === "None" ? "Kill All" : bandit}</span>
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

const PRESETS: {
  name: string;
  config: Record<string, boolean | string | number>;
}[] = [
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

function getDefaultValue(opt: ConfigOptionDef): boolean | string | number {
  switch (opt.type) {
    case "check":
      return false;
    case "number":
      return 0;
    case "select":
      if (opt.options && opt.defaultIndex) {
        return String(opt.options[opt.defaultIndex - 1]?.val ?? opt.options[0]?.val ?? "");
      }
      return opt.options ? String(opt.options[0]?.val ?? "") : "";
    case "text":
      return "";
  }
}

export function ConfigTab() {
  const configOverrides = useBuildStore((s) => s.configOverrides);
  const setConfigOverride = useBuildStore((s) => s.setConfigOverride);
  const reEvaluate = useBuildStore((s) => s.reEvaluate);
  const evaluating = useBuildStore((s) => s.evaluating);
  const skills = useBuildStore((s) => s.skills);
  const [configDirty, setConfigDirty] = useState(false);
  const [configFilter, setConfigFilter] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [customMods, setCustomMods] = useState("");

  const activeSkills = useMemo(() => {
    const set = new Set<string>();
    for (const group of skills) {
      for (const gem of group.gems) {
        if (gem.name) set.add(gem.name);
      }
    }
    return set;
  }, [skills]);

  // Conditions/flags that are active in the current build
  const activeConditions = useMemo(() => new Set<string>(), []);
  const activeFlags = useMemo(() => new Set<string>(), []);

  const visibleOptions = useMemo(() => {
    let opts = CONFIG_OPTIONS.filter((opt) =>
      isOptionVisible(opt, activeSkills, activeConditions, activeFlags, showAll),
    );
    if (configFilter.trim()) {
      const q = configFilter.toLowerCase();
      opts = opts.filter((opt) => opt.label.toLowerCase().includes(q));
    }
    return opts;
  }, [activeSkills, activeConditions, activeFlags, showAll, configFilter]);

  const sectionGroups = useMemo(() => {
    const groups: Record<string, ConfigOptionDef[]> = {};
    for (const opt of visibleOptions) {
      const section = opt.section;
      if (!groups[section]) groups[section] = [];
      groups[section].push(opt);
    }
    return groups;
  }, [visibleOptions]);

  const updateValue = useCallback(
    (id: string, value: boolean | string | number) => {
      setConfigOverride(id, value);
      setConfigDirty(true);
    },
    [setConfigOverride],
  );

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    for (const opt of CONFIG_OPTIONS) {
      if (!opt.visibility) {
        setConfigOverride(opt.id, getDefaultValue(opt));
      }
    }
    for (const [key, value] of Object.entries(preset.config)) {
      setConfigOverride(key, value);
    }
    setConfigDirty(true);
  };

  const totalCount = CONFIG_OPTIONS.length;
  const visibleCount = visibleOptions.length;
  const hiddenCount = totalCount - visibleCount;

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-heading font-display text-lg">Configuration</h2>
          <span className="text-[9px] font-mono text-text-dim/50">
            {visibleCount}/{totalCount} options
          </span>
        </div>

        <div className="flex items-center gap-1.5 mb-3">
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

        <div className="flex items-center gap-2 mb-3">
          <input
            type="text"
            value={configFilter}
            onChange={(e) => setConfigFilter(e.target.value)}
            placeholder="Filter options..."
            className="flex-1 bg-bg-inset border border-border-subtle rounded px-2.5 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-dim/40 focus:outline-none focus:border-accent"
          />
          <button
            onClick={() => setShowAll(!showAll)}
            className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${
              showAll
                ? "bg-accent/10 border-accent/30 text-accent"
                : "bg-bg-card border-border-subtle text-text-dim hover:text-text-primary"
            }`}
          >
            {showAll ? "All" : "Relevant"}
          </button>
        </div>

        {!showAll && hiddenCount > 0 && (
          <p className="text-[9px] font-mono text-text-dim/40 mb-3">
            {hiddenCount} skill-specific options hidden. Click "All" to show everything.
          </p>
        )}

        {configDirty && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-400/10 border border-amber-400/20 rounded text-[10px] font-mono text-amber-400 mb-3">
            <span>Config changed.</span>
            <button
              onClick={() => {
                reEvaluate();
                setConfigDirty(false);
              }}
              disabled={evaluating}
              className="underline hover:text-amber-300 disabled:opacity-40"
            >
              {evaluating ? "Calculating..." : "Recalculate"}
            </button>
            <button onClick={() => setConfigDirty(false)} className="text-text-dim hover:text-text-primary ml-auto">
              x
            </button>
          </div>
        )}

        <BuildInfoSection />

        {CONFIG_SECTIONS.filter((s) => sectionGroups[s]?.length).map((section) => (
          <ConfigSection key={section} title={section}>
            {sectionGroups[section].map((opt) => (
              <ConfigControl
                key={opt.id}
                opt={opt}
                value={configOverrides[opt.id] !== undefined ? configOverrides[opt.id] : getDefaultValue(opt)}
                onChange={(val) => updateValue(opt.id, val)}
              />
            ))}
          </ConfigSection>
        ))}

        <ConfigSection title="Custom Modifiers">
          <textarea
            value={customMods}
            onChange={(e) => {
              setCustomMods(e.target.value);
              const lines = e.target.value.split("\n").filter((l: string) => l.trim());
              setConfigOverride("customMods", lines.join("|"));
              setConfigDirty(true);
            }}
            placeholder={
              "Enter one modifier per line:\n+100 to maximum Life\n20% increased Damage\n+30% to Fire Resistance"
            }
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
