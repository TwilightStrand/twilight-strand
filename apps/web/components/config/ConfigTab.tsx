"use client";

import { useState } from "react";

interface ConfigOption {
  id: string;
  label: string;
  type: "check" | "select" | "number";
  value: boolean | string | number;
  options?: string[];
  category: string;
}

const DEFAULT_CONFIG: ConfigOption[] = [
  { id: "enemyIsBoss", label: "Enemy is a Boss", type: "select", value: "None", options: ["None", "Pinnacle Boss", "Uber Pinnacle Boss", "Map Boss", "Guardian/Pinnacle", "Shaper/Elder"], category: "General" },
  { id: "enemyLevel", label: "Enemy Level", type: "number", value: 84, category: "General" },
  { id: "enemyPhysReduction", label: "Enemy Phys Reduction", type: "number", value: 0, category: "General" },
  { id: "enemyFireRes", label: "Enemy Fire Resistance", type: "number", value: 0, category: "General" },
  { id: "enemyColdRes", label: "Enemy Cold Resistance", type: "number", value: 0, category: "General" },
  { id: "enemyLightningRes", label: "Enemy Lightning Resistance", type: "number", value: 0, category: "General" },
  { id: "enemyChaosRes", label: "Enemy Chaos Resistance", type: "number", value: 0, category: "General" },
  { id: "usePowerCharges", label: "Use Power Charges", type: "check", value: false, category: "Charges" },
  { id: "useFrenzyCharges", label: "Use Frenzy Charges", type: "check", value: false, category: "Charges" },
  { id: "useEnduranceCharges", label: "Use Endurance Charges", type: "check", value: false, category: "Charges" },
  { id: "conditionOnConsecratedGround", label: "On Consecrated Ground", type: "check", value: false, category: "Skill Options" },
  { id: "conditionFocused", label: "Are you Focused?", type: "check", value: false, category: "Skill Options" },
  { id: "conditionOnslaught", label: "Do you have Onslaught?", type: "check", value: false, category: "Skill Options" },
  { id: "conditionUnholyMight", label: "Do you have Unholy Might?", type: "check", value: false, category: "Skill Options" },
  { id: "buffTailwind", label: "Do you have Tailwind?", type: "check", value: false, category: "Skill Options" },
  { id: "conditionLeeching", label: "Are you Leeching?", type: "check", value: false, category: "Skill Options" },
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

export function ConfigTab() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  const updateValue = (id: string, value: boolean | string | number) => {
    setConfig((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, value } : opt))
    );
  };

  const categories = [...new Set(config.map((c) => c.category))];

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-2xl">
        <h2 className="text-text-heading font-display text-lg mb-4">
          Configuration
        </h2>

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
