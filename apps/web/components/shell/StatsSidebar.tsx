"use client";

import { useBuildStore } from "@/stores/build-store";

function StatSection({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <h3
        className="text-[10px] font-mono font-bold uppercase tracking-widest mb-1"
        style={{ color }}
      >
        {title}
      </h3>
      <div className="space-y-px">{children}</div>
    </div>
  );
}

function StatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex justify-between items-baseline text-xs font-mono">
      <span className="text-text-dim">{label}</span>
      <span className="tabular-nums" style={color ? { color } : undefined}>
        {value}
      </span>
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

export function StatsSidebar() {
  const stats = useBuildStore((s) => s.stats);

  const life = stats?.life ?? 60;
  const es = stats?.energy_shield ?? 0;
  const mana = stats?.mana ?? 50;

  const dps = stats?.combined_dps ?? stats?.total_dps ?? 0;
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
    <aside className="w-48 min-w-48 hidden md:block border-r border-border-subtle bg-bg-deep/80 overflow-y-auto p-3">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border-subtle">
        <span className="text-life font-mono text-sm font-bold tabular-nums">
          {fmtNum(life)}
        </span>
        <span className="text-[10px] text-text-dim uppercase">Life</span>
        <span className="text-es font-mono text-sm font-bold tabular-nums">
          {fmtNum(es)}
        </span>
        <span className="text-[10px] text-text-dim uppercase">ES</span>
        <span className="text-mana font-mono text-sm font-bold tabular-nums">
          {fmtNum(mana)}
        </span>
        <span className="text-[10px] text-text-dim uppercase">Mana</span>
      </div>

      <StatSection title="Offence" color="var(--color-offence)">
        <StatRow label="Skill DPS" value={fmtNum(dps)} />
        <StatRow label="Crit Chance" value={`${fmtNum(critChance, 1)}%`} />
        <StatRow label="Crit Multi" value={`${fmtNum(critMulti)}%`} />
        <StatRow label="Attack Speed" value={`${fmtNum(atkSpd, 2)}/s`} />
        <StatRow label="Hit Chance" value={`${fmtNum(hitChance)}%`} />
      </StatSection>

      <StatSection title="Attributes" color="var(--color-text-heading)">
        <StatRow label="Str" value={fmtNum(str)} color="var(--color-strength)" />
        <StatRow label="Dex" value={fmtNum(dex)} color="var(--color-dexterity)" />
        <StatRow label="Int" value={fmtNum(int)} color="var(--color-intelligence)" />
      </StatSection>

      <StatSection title="Defence" color="var(--color-defence)">
        <StatRow label="Armour" value={fmtNum(armour)} />
        <StatRow label="Evasion" value={fmtNum(evasion)} />
        <StatRow label="Evade" value={`${fmtNum(evade)}%`} />
        <StatRow label="Life Regen/s" value={fmtNum(lifeRegen, 1)} />
      </StatSection>

      <StatSection title="Resistances" color="var(--color-blood)">
        <StatRow
          label="Fire"
          value={`${fmtNum(fireRes)} /${fireMax}%`}
          color={resColor(fireRes, fireMax)}
        />
        <StatRow
          label="Cold"
          value={`${fmtNum(coldRes)} /${coldMax}%`}
          color={resColor(coldRes, coldMax)}
        />
        <StatRow
          label="Lightning"
          value={`${fmtNum(lightRes)} /${lightMax}%`}
          color={resColor(lightRes, lightMax)}
        />
        <StatRow
          label="Chaos"
          value={`${fmtNum(chaosRes)} /${chaosMax}%`}
          color={resColor(chaosRes, chaosMax)}
        />
      </StatSection>

      <StatSection title="Mitigation" color="var(--color-defence)">
        <StatRow label="Atk Block" value={`${fmtNum(atkBlock)}%`} />
        <StatRow label="Spell Block" value={`${fmtNum(spellBlock)}%`} />
        <StatRow label="Suppression" value={`${fmtNum(suppress)}%`} />
        <StatRow label="Phys Reduction" value={`${fmtNum(physRed)}%`} />
      </StatSection>
    </aside>
  );
}
