"use client";

import { useState, useMemo } from "react";
import { useBuildStore } from "@/stores/build-store";
import { CalcSection } from "./CalcSection";
import { CalcRow, CalcSubheader } from "./CalcRow";

const COLOR_OFFENCE = "#cfe0ff";
const COLOR_DEFENCE = "#9fb0d8";
const COLOR_LIFE = "#ff5c45";
const COLOR_MANA = "#7d95ff";
const COLOR_ES = "#4fe3f7";
const COLOR_STRENGTH = "#ff4d3a";
const COLOR_DEXTERITY = "#5cf07a";
const COLOR_INTELLIGENCE = "#7d95ff";
const COLOR_BLOOD = "#ff6b6b";

interface SectionDef {
  title: string;
  color: string;
  column: "left" | "right";
  rows: Array<{
    label: string;
    key: string;
    color?: string;
    suffix?: string;
    sub?: string;
  }>;
}

const SECTIONS: SectionDef[] = [
  {
    title: "Hit Damage",
    color: COLOR_OFFENCE,
    column: "left",
    rows: [
      { label: "Average Damage", key: "average_damage" },
      { label: "Hit DPS", key: "total_dps" },
      { label: "Combined DPS", key: "combined_dps" },
    ],
  },
  {
    title: "Attack / Cast Rate",
    color: COLOR_OFFENCE,
    column: "left",
    rows: [{ label: "Attack / Cast Rate", key: "attack_speed", suffix: "/s" }],
  },
  {
    title: "Crits",
    color: COLOR_OFFENCE,
    column: "left",
    rows: [
      { label: "Crit Chance", key: "crit_chance", suffix: "%" },
      { label: "Crit Multiplier", key: "crit_multiplier", suffix: "%" },
    ],
  },
  {
    title: "Accuracy",
    color: COLOR_OFFENCE,
    column: "left",
    rows: [
      { label: "Hit Chance", key: "hit_chance", suffix: "%" },
      { label: "Accuracy Rating", key: "accuracy" },
    ],
  },
  {
    title: "Skill Mechanics",
    color: COLOR_OFFENCE,
    column: "left",
    rows: [
      { label: "Strike Targets", key: "strike_targets", sub: "Projectiles & Area" },
    ],
  },
  {
    title: "Speed",
    color: COLOR_OFFENCE,
    column: "left",
    rows: [
      { label: "Attack/Cast Rate", key: "attack_speed", suffix: "/s" },
      { label: "Mana Regen", key: "mana_regen", suffix: "/s" },
    ],
  },
  {
    title: "Attributes",
    color: COLOR_OFFENCE,
    column: "right",
    rows: [
      { label: "Strength", key: "strength", color: COLOR_STRENGTH },
      { label: "Dexterity", key: "dexterity", color: COLOR_DEXTERITY },
      { label: "Intelligence", key: "intelligence", color: COLOR_INTELLIGENCE },
    ],
  },
  {
    title: "Life",
    color: COLOR_LIFE,
    column: "right",
    rows: [{ label: "Life", key: "life", color: COLOR_LIFE }],
  },
  {
    title: "Mana",
    color: COLOR_MANA,
    column: "right",
    rows: [{ label: "Mana", key: "mana", color: COLOR_MANA }],
  },
  {
    title: "Energy Shield",
    color: COLOR_ES,
    column: "right",
    rows: [{ label: "Energy Shield", key: "energy_shield", color: COLOR_ES }],
  },
  {
    title: "Resists",
    color: COLOR_BLOOD,
    column: "right",
    rows: [
      { label: "Fire", key: "fire_res_display", color: COLOR_BLOOD },
      { label: "Cold", key: "cold_res_display", color: COLOR_BLOOD },
      { label: "Lightning", key: "lightning_res_display", color: COLOR_BLOOD },
      { label: "Chaos", key: "chaos_res_display", color: COLOR_BLOOD },
    ],
  },
  {
    title: "Armour & Evasion",
    color: COLOR_DEFENCE,
    column: "right",
    rows: [
      { label: "Phys Damage Reduction", key: "phys_reduction", suffix: "%" },
      { label: "Evasion", key: "evasion" },
    ],
  },
  {
    title: "Damage Avoidance",
    color: COLOR_DEFENCE,
    column: "right",
    rows: [
      { label: "Block Chance", key: "block_chance", suffix: "%" },
      { label: "Spell Block", key: "spell_block", suffix: "%" },
      { label: "Suppression", key: "suppression", suffix: "%" },
      { label: "Evade Chance", key: "evade_chance", suffix: "%" },
    ],
  },
  {
    title: "Max Hit Taken",
    color: COLOR_DEFENCE,
    column: "right",
    rows: [
      { label: "Physical", key: "max_hit_phys" },
      { label: "Elemental", key: "max_hit_ele" },
      { label: "Chaos", key: "max_hit_chaos" },
    ],
  },
  {
    title: "Effective HP",
    color: COLOR_DEFENCE,
    column: "right",
    rows: [{ label: "Total EHP", key: "total_ehp" }],
  },
  {
    title: "Charges & Rage",
    color: COLOR_DEFENCE,
    column: "right",
    rows: [],
  },
];

export function CalcsTab() {
  const stats = useBuildStore((s) => s.stats);
  const [filter, setFilter] = useState("");

  const resolvedValues = useMemo(() => {
    if (!stats) return {};
    const ehp = stats.total_ehp || 0;
    return {
      ...stats,
      average_damage: 0,
      strike_targets: 1,
      max_hit_phys: ehp > 0 ? Math.round(ehp * 0.3) : 0,
      max_hit_ele: ehp > 0 ? Math.round(ehp * 0.25) : 0,
      max_hit_chaos: ehp > 0 ? Math.round(ehp * 0.15) : 0,
      fire_res_display: `${stats.fire_res} /${stats.fire_res_max}%`,
      cold_res_display: `${stats.cold_res} /${stats.cold_res_max}%`,
      lightning_res_display: `${stats.lightning_res} /${stats.lightning_res_max}%`,
      chaos_res_display: `${stats.chaos_res} /${stats.chaos_res_max}%`,
    } as unknown as Record<string, number | string>;
  }, [stats]);

  const filterLower = filter.toLowerCase();
  const filtered = useMemo(
    () =>
      SECTIONS.map((section) => ({
        ...section,
        rows: section.rows.filter(
          (r) =>
            !filterLower ||
            r.label.toLowerCase().includes(filterLower) ||
            section.title.toLowerCase().includes(filterLower)
        ),
      })).filter((s) => s.rows.length > 0 || !filterLower),
    [filterLower]
  );

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full text-text-dim font-mono text-sm">
        Import a build to see calculations
      </div>
    );
  }

  const leftSections = filtered.filter((s) => s.column === "left");
  const rightSections = filtered.filter((s) => s.column === "right");

  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-text-heading font-display text-base">
          Calculations
        </h2>
        <input
          type="text"
          placeholder="Filter..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 max-w-xs bg-bg-inset border border-border-subtle rounded px-2 py-1 text-xs font-mono text-text-primary placeholder:text-text-dim/40 focus:outline-none focus:border-accent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-0">
          {leftSections.map((section) => (
            <CalcSection
              key={section.title}
              title={section.title}
              color={section.color}
            >
              {section.rows.map((row) => (
                <div key={row.label}>
                  {row.sub && <CalcSubheader label={row.sub} />}
                  <CalcRow
                    label={row.label}
                    value={resolvedValues[row.key] ?? 0}
                    color={row.color}
                    suffix={row.suffix}
                  />
                </div>
              ))}
            </CalcSection>
          ))}
        </div>
        <div className="space-y-0">
          {rightSections.map((section) => (
            <CalcSection
              key={section.title}
              title={section.title}
              color={section.color}
            >
              {section.rows.map((row) => (
                <CalcRow
                  key={row.label}
                  label={row.label}
                  value={resolvedValues[row.key] ?? 0}
                  color={row.color}
                  suffix={row.suffix}
                />
              ))}
            </CalcSection>
          ))}
        </div>
      </div>
    </div>
  );
}
