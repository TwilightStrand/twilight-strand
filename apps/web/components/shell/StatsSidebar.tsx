"use client";

import { useEffect, useRef, useState } from "react";
import type { BuildStats } from "@/engine/types";
import { calculateBuildScore } from "@/lib/build-score";
import { STAT_EXPLANATIONS } from "@/lib/stat-explanations";
import { useBuildStore } from "@/stores/build-store";
import { useUiStore } from "@/stores/ui-store";
import { BuildDiff } from "./BuildDiff";
import { StatsSkeleton } from "./Skeleton";

function StatSection({
  title,
  color,
  children,
  defaultOpen = true,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-widest mb-1"
        style={{ color }}
      >
        <span>{title}</span>
        <span className="text-[8px] text-text-dim">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="space-y-px">{children}</div>}
    </div>
  );
}

function AnimatedValue({ value, color }: { value: string; color?: string }) {
  const [flash, setFlash] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current !== value && prevRef.current !== "0" && value !== "0") {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 600);
      prevRef.current = value;
      return () => clearTimeout(timer);
    }
    prevRef.current = value;
  }, [value]);

  return (
    <span
      className={`tabular-nums transition-colors duration-300 ${flash ? "!text-accent" : ""}`}
      style={!flash && color ? { color } : undefined}
    >
      {value}
    </span>
  );
}

function StatRow({
  label,
  value,
  color,
  delta,
  title,
  statKey,
}: {
  label: string;
  value: string;
  color?: string;
  delta?: number;
  title?: string;
  statKey?: string;
}) {
  const tooltip = title || STAT_EXPLANATIONS[label];
  const togglePin = useUiStore((s) => s.togglePinnedStat);
  return (
    <div
      className="flex justify-between items-baseline text-xs font-mono"
      title={tooltip}
      onDoubleClick={() => statKey && togglePin(statKey)}
    >
      <span className="text-text-dim">{label}</span>
      <div className="flex items-center gap-1.5">
        <AnimatedValue value={value} color={color} />
        {delta !== undefined && delta !== 0 && (
          <span className={`text-[9px] tabular-nums ${delta > 0 ? "text-green-400" : "text-red-400"}`}>
            {delta > 0 ? "+" : ""}
            {Math.abs(delta) >= 1000 ? fmtNum(delta) : Math.round(delta)}
          </span>
        )}
      </div>
    </div>
  );
}

function fmtNum(n: number, decimals = 0): string {
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e4) return `${Math.round(n / 1e3)}k`;
  return decimals > 0 ? n.toFixed(decimals) : Math.round(n).toString();
}

function resColor(current: number, max: number): string {
  if (current >= max) return "var(--color-dexterity)";
  if (current >= 0) return "var(--color-gold)";
  return "var(--color-blood)";
}

function ResRow({ label, current, max }: { label: string; current: number; max: number }) {
  const overcap = Math.round(current - max);
  return (
    <div className="flex justify-between items-baseline text-xs font-mono">
      <span className="text-text-dim">{label}</span>
      <div className="flex items-center gap-1">
        <span className="tabular-nums" style={{ color: resColor(current, max) }}>
          {fmtNum(current)} /{max}%
        </span>
        {overcap > 0 && <span className="text-[9px] text-text-dim/50 tabular-nums">+{overcap}</span>}
      </div>
    </div>
  );
}

const STAT_DISPLAY: Record<string, string> = {
  total_dps: "Total DPS",
  combined_dps: "Combined DPS",
  total_ehp: "Total EHP",
  life: "Life",
  energy_shield: "Energy Shield",
  mana: "Mana",
  strength: "Strength",
  dexterity: "Dexterity",
  intelligence: "Intelligence",
  armour: "Armour",
  evasion: "Evasion",
  block_chance: "Block %",
  fire_res: "Fire Res",
  cold_res: "Cold Res",
  lightning_res: "Lightning Res",
  chaos_res: "Chaos Res",
  crit_chance: "Crit %",
  attack_speed: "Speed",
};

function PinnedStats({ stats }: { stats: BuildStats | null }) {
  const pinned = useUiStore((s) => s.pinnedStats);
  const togglePin = useUiStore((s) => s.togglePinnedStat);

  if (!stats || pinned.length === 0) return null;

  return (
    <div className="mb-3 pb-2 border-b border-accent/20">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-accent/60">Pinned</span>
      </div>
      <div className="space-y-px">
        {pinned.map((key) => {
          const val = (stats as unknown as Record<string, unknown>)[key];
          if (val === undefined || typeof val !== "number") return null;
          return (
            <div key={key} className="flex justify-between items-baseline text-xs font-mono group">
              <span className="text-text-dim">{STAT_DISPLAY[key] || key.replace(/_/g, " ")}</span>
              <div className="flex items-center gap-1">
                <span className="tabular-nums text-text-primary">{fmtNum(val)}</span>
                <button
                  onClick={() => togglePin(key)}
                  className="text-[8px] text-text-dim/0 group-hover:text-text-dim/60 hover:!text-blood transition-colors"
                  title="Unpin"
                >
                  x
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DpsBar({ stats }: { stats: BuildStats }) {
  const total = stats.total_dps || 1;
  const bleed = stats.bleed_dps || 0;
  const poison = stats.poison_dps || 0;
  const ignite = stats.ignite_dps || 0;
  const hit = Math.max(0, total - bleed - poison - ignite);

  if (total <= 0) return null;

  const segments = [
    { value: hit, color: "#06b6d4", label: "Hit" },
    { value: bleed, color: "#ef4444", label: "Bleed" },
    { value: poison, color: "#22c55e", label: "Poison" },
    { value: ignite, color: "#f97316", label: "Ignite" },
  ].filter((s) => s.value > 0);

  if (segments.length <= 1) return null;

  return (
    <div
      className="flex h-1 rounded-full overflow-hidden mt-0.5 mb-1"
      title={segments.map((s) => `${s.label}: ${Math.round((s.value / total) * 100)}%`).join(", ")}
    >
      {segments.map((s, i) => (
        <div key={i} style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }} />
      ))}
    </div>
  );
}

function BarStatRow({ label, value, max, color }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="mb-1.5">
      <div className="flex justify-between text-[9px] font-mono mb-0.5">
        <span className="text-text-dim">{label}</span>
        <span className="tabular-nums text-text-primary">{fmtNum(value)}</span>
      </div>
      <div className="h-1 bg-bg-hover rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color || "var(--color-accent)" }}
        />
      </div>
    </div>
  );
}

function PoolBar({ life, es }: { life: number; es: number }) {
  const total = life + es;
  if (total <= 0) return null;
  const lifePct = (life / total) * 100;
  const esPct = (es / total) * 100;

  return (
    <div
      className="flex h-1 rounded-full overflow-hidden w-full mt-1 mb-2"
      title={`Life: ${life} (${Math.round(lifePct)}%) | ES: ${es} (${Math.round(esPct)}%)`}
    >
      {life > 0 && <div style={{ width: `${lifePct}%` }} className="bg-life" />}
      {es > 0 && <div style={{ width: `${esPct}%` }} className="bg-es" />}
    </div>
  );
}

const AURA_KEYWORDS = [
  "herald",
  "purity",
  "determination",
  "grace",
  "discipline",
  "haste",
  "hatred",
  "anger",
  "wrath",
  "zealotry",
  "malevolence",
  "pride",
  "defiance",
  "clarity",
  "vitality",
  "precision",
  "tempest shield",
  "arctic armour",
  "flesh and stone",
  "blood and sand",
  "petrified blood",
];

function ActiveAuras() {
  const skills = useBuildStore((s) => s.skills);
  const activeAuras = skills
    .filter((g) => g.enabled)
    .flatMap((g) =>
      g.gems.filter((gem) => {
        if (!gem.enabled || gem.isSupport) return false;
        const name = gem.name.toLowerCase();
        return AURA_KEYWORDS.some((kw) => name.includes(kw));
      }),
    )
    .map((g) => g.name);

  if (activeAuras.length === 0) return null;

  return (
    <div className="mb-2">
      <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-text-dim">Auras</span>
      <div className="flex flex-wrap gap-1 mt-0.5">
        {activeAuras.map((name, i) => (
          <span key={i} className="text-[9px] font-mono text-accent/70 bg-accent/10 px-1.5 py-0.5 rounded">
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

function DefensiveLayers({ stats }: { stats: BuildStats }) {
  const layers: string[] = [];
  if (stats.armour > 1000) layers.push("Armour");
  if (stats.evasion > 1000) layers.push("Evasion");
  if (stats.block_chance > 20) layers.push("Block");
  if (stats.spell_block > 10) layers.push("Spell Block");
  if (stats.suppression > 50) layers.push("Suppression");
  if (stats.energy_shield > 500) layers.push("ES");
  if (stats.phys_reduction > 20) layers.push("Phys Mitigation");
  if (stats.life > 4000) layers.push("Life Pool");
  if (stats.life_regen > 100) layers.push("Regen");
  if (stats.life_leech_rate > 0) layers.push("Leech");

  if (layers.length === 0) return null;

  return (
    <div className="mt-2 pt-2 border-t border-border-subtle">
      <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-text-dim">
        {layers.length} Defensive Layer{layers.length !== 1 ? "s" : ""}
      </span>
      <div className="flex flex-wrap gap-1 mt-0.5">
        {layers.map((l) => (
          <span key={l} className="text-[9px] font-mono text-green-400/60 bg-green-400/5 px-1 rounded">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

function calcDelta(current: number, baseline: number | undefined): number | undefined {
  if (baseline === undefined) return undefined;
  const d = current - baseline;
  return Math.abs(d) < 0.01 ? undefined : d;
}

export function StatsSidebar() {
  const stats = useBuildStore((s) => s.stats);
  const engineStatus = useBuildStore((s) => s.engineStatus);
  const cmp = useBuildStore((s) => s.compareStats);
  const setCompareBaseline = useBuildStore((s) => s.setCompareBaseline);
  const clearCompare = useBuildStore((s) => s.clearCompare);
  const scrollRef = useRef<HTMLElement>(null);
  const scrollPositions = useRef<Record<string, number>>({});
  const activeTab = useUiStore((s) => s.activeTab);
  const compact = useUiStore((s) => s.sidebarCompact);
  const toggleCompact = useUiStore((s) => s.toggleSidebarCompact);
  const sidebarMode = useUiStore((s) => s.sidebarMode);
  const toggleSidebarMode = useUiStore((s) => s.toggleSidebarMode);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollPositions.current[activeTab] ?? 0;
    }
    return () => {
      if (scrollRef.current) {
        scrollPositions.current[activeTab] = scrollRef.current.scrollTop;
      }
    };
  }, [activeTab]);

  if (engineStatus === "loading" && !stats) {
    return (
      <aside className="w-48 min-w-48 p-3 hidden md:block border-r border-border-subtle bg-bg-deep/80">
        <div className="space-y-3 animate-pulse">
          <div className="text-center py-3">
            <div className="text-[9px] font-mono text-text-dim/40 uppercase tracking-widest">Waiting for build</div>
            <div className="text-[8px] font-mono text-text-dim/20 mt-1">Import a build to see stats</div>
          </div>
          {["Offence", "Defence", "Resistances"].map((s) => (
            <div key={s}>
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-dim/20 mb-1">{s}</div>
              <div className="space-y-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-3 bg-bg-hover/30 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  const life = stats?.life ?? 60;
  const es = stats?.energy_shield ?? 0;
  const mana = stats?.mana ?? 50;
  const manaUnreserved = stats?.mana_unreserved ?? mana;
  const manaReservedPct = stats?.mana_reserved_percent ?? 0;

  const dps = (stats?.full_dps && stats.full_dps > 0 ? stats.full_dps : null) ?? stats?.combined_dps ?? stats?.total_dps ?? 0;
  const critChance = stats?.crit_chance ?? 0;
  const critMulti = stats?.crit_multiplier ?? 150;
  const atkSpd = stats?.attack_speed ?? 1.2;
  const hitChance = stats?.hit_chance ?? 5;

  const str = stats?.strength ?? 20;
  const dex = stats?.dexterity ?? 20;
  const int = stats?.intelligence ?? 20;

  const armour = stats?.armour ?? 0;
  const evasion = stats?.evasion ?? 16;
  const evade = stats?.evade_chance ?? 0;
  const lifeRegen = stats?.life_regen ?? 0;

  const fireRes = stats?.fire_res ?? -60;
  const coldRes = stats?.cold_res ?? -60;
  const lightRes = stats?.lightning_res ?? -60;
  const chaosRes = stats?.chaos_res ?? -60;
  const fireMax = stats?.fire_res_max ?? 75;
  const coldMax = stats?.cold_res_max ?? 75;
  const lightMax = stats?.lightning_res_max ?? 75;
  const chaosMax = stats?.chaos_res_max ?? 75;

  const atkBlock = stats?.block_chance ?? 0;
  const spellBlock = stats?.spell_block ?? 0;
  const suppress = stats?.suppression ?? 0;
  const physRed = stats?.phys_reduction ?? 0;

  return (
    <aside
      ref={scrollRef}
      className={`${compact ? "w-36 min-w-36 p-2" : "w-48 min-w-48 p-3"} hidden md:block border-r border-border-subtle bg-bg-deep/80 overflow-y-auto`}
      aria-label="Build statistics"
    >
      {/* Hero stats - the 3 numbers that matter most */}
      <div className="mb-3 pb-3 border-b border-border-subtle">
        <div className="grid grid-cols-1 gap-1.5 mb-2">
          {dps > 0 && (
            <div className="bg-bg-inset rounded px-2 py-1.5 border border-border-subtle">
              <div className="text-[8px] font-mono uppercase tracking-widest text-offence/60">Skill DPS</div>
              <div className="text-lg font-mono font-bold tabular-nums text-offence leading-tight stat-value">{fmtNum(dps)}</div>
              <DpsBar stats={stats!} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="bg-bg-inset rounded px-2 py-1 border border-border-subtle">
              <div className="text-[8px] font-mono uppercase tracking-widest text-life/60">Life</div>
              <div className="text-sm font-mono font-bold tabular-nums text-life leading-tight stat-value">{fmtNum(life)}</div>
            </div>
            <div className="bg-bg-inset rounded px-2 py-1 border border-border-subtle">
              <div className="text-[8px] font-mono uppercase tracking-widest text-es/60">{es > life ? "ES" : "EHP"}</div>
              <div className="text-sm font-mono font-bold tabular-nums text-es leading-tight stat-value">
                {es > life ? fmtNum(es) : fmtNum(stats?.total_ehp ?? 0)}
              </div>
            </div>
          </div>
        </div>
        <PoolBar life={life} es={es} />
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2 text-[9px] font-mono text-text-dim/60">
            <span className="text-mana tabular-nums" title={`Reserved: ${fmtNum(manaReservedPct)}%`}>{fmtNum(manaUnreserved)}</span>
            <span>mana</span>
            {(stats?.ward ?? 0) > 0 && (
              <><span className="text-purple-400 tabular-nums">{fmtNum(stats?.ward ?? 0)}</span><span>ward</span></>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={toggleSidebarMode} className="text-[9px] font-mono text-text-dim/30 hover:text-text-dim transition-colors" title="Toggle display mode">
              {sidebarMode === "list" ? "bars" : "list"}
            </button>
            <button onClick={toggleCompact} className="text-[9px] font-mono text-text-dim/30 hover:text-text-dim transition-colors" title={compact ? "Normal" : "Compact"}>
              {compact ? "+" : "-"}
            </button>
          </div>
        </div>
        {stats &&
          (stats.total_dps > 0 || stats.life > 1) &&
          (() => {
            const { grade, score } = calculateBuildScore(stats);
            return (
              <div className="flex items-center justify-between mt-1.5 px-0.5" title={`Build score: ${score}/100`}>
                <span className="text-[9px] font-mono text-text-dim">Build Score</span>
                <div className="flex items-center gap-1">
                  <span
                    className={`text-sm font-mono font-bold ${
                      grade === "S"
                        ? "text-amber-400"
                        : grade === "A"
                          ? "text-green-400"
                          : grade === "B"
                            ? "text-accent"
                            : grade === "C"
                              ? "text-text-primary"
                              : "text-text-dim"
                    }`}
                  >
                    {grade}
                  </span>
                  <span className="text-[9px] font-mono text-text-dim/60">{score}/100</span>
                </div>
              </div>
            );
          })()}
      </div>

      {stats && (
        <div className="flex justify-end mb-2">
          <button
            onClick={() => (cmp ? clearCompare() : setCompareBaseline())}
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-colors ${
              cmp ? "bg-amber-400/20 text-amber-400" : "text-text-dim hover:text-accent"
            }`}
          >
            {cmp ? "Clear compare" : "Pin for compare"}
          </button>
        </div>
      )}

      <PinnedStats stats={stats} />
      <ActiveAuras />

      {sidebarMode === "bars" && stats && (
        <div className="mb-3">
          <BarStatRow label="Life" value={life} max={10000} color="var(--color-life)" />
          <BarStatRow label="ES" value={es} max={15000} color="var(--color-es)" />
          <BarStatRow label="DPS" value={dps} max={5000000} color="var(--color-offence)" />
          <BarStatRow label="Armour" value={armour} max={50000} />
          <BarStatRow label="Evasion" value={evasion} max={50000} />
          <BarStatRow label="Block" value={atkBlock} max={75} />
          <BarStatRow label="Phys Red" value={physRed} max={90} />
        </div>
      )}

      {sidebarMode === "list" && (
        <>
          <StatSection title="Offence" color="var(--color-offence)">
            <StatRow
              label="Skill DPS"
              value={fmtNum(dps)}
              statKey="total_dps"
              delta={cmp ? calcDelta(dps, cmp.combined_dps ?? cmp.total_dps) : undefined}
              title={`Full DPS: ${fmtNum(stats?.full_dps ?? 0)} | Combined: ${fmtNum(stats?.combined_dps ?? 0)} | Total: ${fmtNum(stats?.total_dps ?? 0)}`}
            />
            {stats && <DpsBar stats={stats} />}
            <StatRow
              label="Crit Chance"
              value={`${fmtNum(critChance, 1)}%`}
              statKey="crit_chance"
              delta={cmp ? calcDelta(critChance, cmp.crit_chance) : undefined}
            />
            <StatRow
              label="Crit Multi"
              value={`${fmtNum(critMulti)}%`}
              statKey="crit_multiplier"
              delta={cmp ? calcDelta(critMulti, cmp.crit_multiplier) : undefined}
            />
            <StatRow
              label="Attack Speed"
              value={`${fmtNum(atkSpd, 2)}/s`}
              statKey="attack_speed"
              delta={cmp ? calcDelta(atkSpd, cmp.attack_speed) : undefined}
            />
            <StatRow
              label="Hit Chance"
              value={`${fmtNum(hitChance)}%`}
              statKey="hit_chance"
              delta={cmp ? calcDelta(hitChance, cmp.hit_chance) : undefined}
            />
          </StatSection>

          <StatSection title="Attributes" color="var(--color-text-heading)">
            <StatRow
              label="Str"
              value={fmtNum(str)}
              color="var(--color-strength)"
              delta={cmp ? calcDelta(str, cmp.strength) : undefined}
            />
            <StatRow
              label="Dex"
              value={fmtNum(dex)}
              color="var(--color-dexterity)"
              delta={cmp ? calcDelta(dex, cmp.dexterity) : undefined}
            />
            <StatRow
              label="Int"
              value={fmtNum(int)}
              color="var(--color-intelligence)"
              delta={cmp ? calcDelta(int, cmp.intelligence) : undefined}
            />
          </StatSection>

          <StatSection title="Defence" color="var(--color-defence)">
            <StatRow label="Armour" value={fmtNum(armour)} delta={cmp ? calcDelta(armour, cmp.armour) : undefined} />
            <StatRow
              label="Evasion"
              value={fmtNum(evasion)}
              delta={cmp ? calcDelta(evasion, cmp.evasion) : undefined}
            />
            <StatRow
              label="Evade"
              value={`${fmtNum(evade)}%`}
              delta={cmp ? calcDelta(evade, cmp.evade_chance) : undefined}
            />
            <StatRow
              label="Life Regen/s"
              value={fmtNum(lifeRegen, 1)}
              delta={cmp ? calcDelta(lifeRegen, cmp.life_regen) : undefined}
            />
            {(stats?.es_regen ?? 0) > 0 && <StatRow label="ES Regen/s" value={fmtNum(stats?.es_regen ?? 0, 1)} />}
            {(stats?.es_recharge_rate ?? 0) > 0 && (
              <StatRow label="ES Recharge/s" value={fmtNum(stats?.es_recharge_rate ?? 0)} />
            )}
            {manaReservedPct > 0 && <StatRow label="Mana Reserved" value={`${fmtNum(manaReservedPct)}%`} />}
          </StatSection>

          <StatSection title="Resistances" color="var(--color-blood)">
            {(() => {
              const uncapped = [
                { name: "Fire", val: fireRes, max: fireMax },
                { name: "Cold", val: coldRes, max: coldMax },
                { name: "Lightning", val: lightRes, max: lightMax },
              ].filter((r) => r.val < r.max);
              return uncapped.length > 0 ? (
                <div className="text-[9px] font-mono text-blood/80 bg-blood/10 rounded px-2 py-1 mb-1">
                  {uncapped.map((r) => `${r.name} ${Math.round(r.max - r.val)}% short`).join(" | ")}
                </div>
              ) : null;
            })()}
            <ResRow label="Fire" current={fireRes} max={fireMax} />
            <ResRow label="Cold" current={coldRes} max={coldMax} />
            <ResRow label="Lightning" current={lightRes} max={lightMax} />
            <ResRow label="Chaos" current={chaosRes} max={chaosMax} />
            {chaosRes < -40 && (
              <div className="text-[9px] font-mono text-purple-400/70 bg-purple-400/5 rounded px-1.5 py-0.5 mt-0.5">
                Low chaos res ({Math.round(chaosRes)}%)
              </div>
            )}
          </StatSection>

          <StatSection title="Mitigation" color="var(--color-defence)">
            <StatRow label="Atk Block" value={`${fmtNum(atkBlock)}%`} />
            <StatRow label="Spell Block" value={`${fmtNum(spellBlock)}%`} />
            <StatRow label="Suppression" value={`${fmtNum(suppress)}%`} />
            <StatRow label="Phys Reduction" value={`${fmtNum(physRed)}%`} />
          </StatSection>
          {stats && <DefensiveLayers stats={stats} />}
        </>
      )}

      <BuildDiff />
    </aside>
  );
}
