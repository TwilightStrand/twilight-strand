"use client";

import { useState, useMemo } from "react";
import { useBuildStore } from "@/stores/build-store";
import { CalcSection } from "./CalcSection";
import { EmptyState } from "@/components/shell/EmptyState";
import { CalcRow, CalcSubheader } from "./CalcRow";
import { ClusterSearch } from "@/components/tree/ClusterSearch";
import type { BuildStats } from "@/engine/types";

function fmtNum(n: number): string {
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return String(Math.round(n));
}

function DpsChart({ stats }: { stats: BuildStats }) {
  const total = stats.total_dps || 1;
  const bars = [
    { label: "Hit DPS", value: Math.max(0, total - (stats.bleed_dps || 0) - (stats.poison_dps || 0) - (stats.ignite_dps || 0)), color: "#06b6d4" },
    { label: "Bleed", value: stats.bleed_dps || 0, color: "#ef4444" },
    { label: "Poison", value: stats.poison_dps || 0, color: "#22c55e" },
    { label: "Ignite", value: stats.ignite_dps || 0, color: "#f97316" },
    { label: "Impale", value: stats.impale_dps || 0, color: "#a855f7" },
  ].filter(b => b.value > 0);

  const maxVal = Math.max(...bars.map(b => b.value));

  if (bars.length === 0 || total <= 0) return null;

  return (
    <div className="mb-4 bg-bg-card border border-border-card rounded-lg p-3">
      <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-accent mb-2">DPS Breakdown</h3>
      <div className="space-y-1.5">
        {bars.map(bar => (
          <div key={bar.label}>
            <div className="flex justify-between text-[10px] font-mono mb-0.5">
              <span className="text-text-dim">{bar.label}</span>
              <span className="tabular-nums text-text-primary">{fmtNum(bar.value)}</span>
            </div>
            <div className="h-2 bg-bg-hover rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${(bar.value / maxVal) * 100}%`, backgroundColor: bar.color }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="text-[9px] font-mono text-text-dim/60 mt-1.5 text-right">
        Total: {fmtNum(total)}
      </div>
    </div>
  );
}

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
    statKey?: string;
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
    title: "Damage over Time",
    color: COLOR_OFFENCE,
    column: "left",
    rows: [
      { label: "Bleed DPS", key: "bleed_dps" },
      { label: "Poison DPS", key: "poison_dps" },
      { label: "Ignite DPS", key: "ignite_dps" },
      { label: "Impale DPS", key: "impale_dps" },
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
      { label: "Strength", key: "strength", color: COLOR_STRENGTH, statKey: "strength" },
      { label: "Dexterity", key: "dexterity", color: COLOR_DEXTERITY, statKey: "dexterity" },
      { label: "Intelligence", key: "intelligence", color: COLOR_INTELLIGENCE, statKey: "intelligence" },
    ],
  },
  {
    title: "Life",
    color: COLOR_LIFE,
    column: "right",
    rows: [{ label: "Life", key: "life", color: COLOR_LIFE, statKey: "life" }],
  },
  {
    title: "Mana",
    color: COLOR_MANA,
    column: "right",
    rows: [{ label: "Mana", key: "mana", color: COLOR_MANA, statKey: "mana" }],
  },
  {
    title: "Energy Shield",
    color: COLOR_ES,
    column: "right",
    rows: [{ label: "Energy Shield", key: "energy_shield", color: COLOR_ES, statKey: "energy_shield" }],
  },
  {
    title: "Resists",
    color: COLOR_BLOOD,
    column: "right",
    rows: [
      { label: "Fire", key: "fire_res_display", color: COLOR_BLOOD, statKey: "fire_res" },
      { label: "Cold", key: "cold_res_display", color: COLOR_BLOOD, statKey: "cold_res" },
      { label: "Lightning", key: "lightning_res_display", color: COLOR_BLOOD, statKey: "lightning_res" },
      { label: "Chaos", key: "chaos_res_display", color: COLOR_BLOOD, statKey: "chaos_res" },
    ],
  },
  {
    title: "Armour & Evasion",
    color: COLOR_DEFENCE,
    column: "right",
    rows: [
      { label: "Phys Damage Reduction", key: "phys_reduction", suffix: "%" },
      { label: "Evasion", key: "evasion", statKey: "evasion" },
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
    title: "Recovery",
    color: COLOR_DEFENCE,
    column: "right",
    rows: [
      { label: "Life Regen/s", key: "life_regen", color: COLOR_LIFE },
      { label: "Mana Regen/s", key: "mana_regen", color: COLOR_MANA },
      { label: "Life Leech/s", key: "life_leech_rate", color: COLOR_LIFE },
      { label: "ES Leech/s", key: "es_leech_rate", color: COLOR_ES },
    ],
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
      <EmptyState
        title="No Calculations"
        description="Import a build to see detailed DPS, defence, and stat breakdowns."
      />
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
        <button
          onClick={async () => {
            if (!stats) return;
            const fmt = (n: number) => {
              if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
              if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
              return String(Math.round(n));
            };
            const lines = [
              `${stats.class_name} ${stats.ascendancy} Lv ${stats.level}`,
              "",
              `DPS: ${fmt(stats.total_dps)}`,
              `Combined DPS: ${fmt(stats.combined_dps)}`,
              `Crit: ${stats.crit_chance.toFixed(1)}%`,
              `Speed: ${stats.attack_speed.toFixed(2)}/s`,
              "",
              `Life: ${stats.life} | ES: ${stats.energy_shield} | Mana: ${stats.mana}`,
              `EHP: ${fmt(stats.total_ehp)}`,
              "",
              `Str: ${stats.strength} | Dex: ${stats.dexterity} | Int: ${stats.intelligence}`,
              `Armour: ${stats.armour} | Evasion: ${stats.evasion}`,
              `Block: ${stats.block_chance}% | Spell Block: ${stats.spell_block}%`,
              "",
              `Fire: ${stats.fire_res}/${stats.fire_res_max}%`,
              `Cold: ${stats.cold_res}/${stats.cold_res_max}%`,
              `Lightning: ${stats.lightning_res}/${stats.lightning_res_max}%`,
              `Chaos: ${stats.chaos_res}/${stats.chaos_res_max}%`,
            ];
            await navigator.clipboard.writeText(lines.join("\n"));
            const { toast } = await import("@/components/shell/Toast");
            toast("Stats copied to clipboard");
          }}
          className="text-[10px] font-mono text-text-dim hover:text-accent transition-colors shrink-0"
        >
          Copy Stats
        </button>
        <button
          onClick={async () => {
            if (!stats) return;
            await navigator.clipboard.writeText(JSON.stringify(stats, null, 2));
            const { toast } = await import("@/components/shell/Toast");
            toast("JSON copied to clipboard");
          }}
          disabled={!stats}
          className="text-[10px] font-mono text-text-dim hover:text-accent transition-colors shrink-0"
        >
          JSON
        </button>
      </div>

      <DpsChart stats={stats} />

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
                    filterQuery={filter || undefined}
                    statKey={row.statKey}
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
                  statKey={row.statKey}
                />
              ))}
            </CalcSection>
          ))}
        </div>
      </div>
      <div className="border-t border-border-subtle mt-4 pt-4">
        <ClusterSearch />
      </div>
    </div>
  );
}
