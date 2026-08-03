"use client";

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

export function StatsSidebar() {
  return (
    <aside className="w-48 min-w-48 hidden md:block border-r border-border-subtle bg-bg-deep/80 overflow-y-auto p-3">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border-subtle">
        <span className="text-life font-mono text-sm font-bold tabular-nums">
          60
        </span>
        <span className="text-[10px] text-text-dim uppercase">Life</span>
        <span className="text-es font-mono text-sm font-bold tabular-nums">
          0
        </span>
        <span className="text-[10px] text-text-dim uppercase">ES</span>
        <span className="text-mana font-mono text-sm font-bold tabular-nums">
          50
        </span>
        <span className="text-[10px] text-text-dim uppercase">Mana</span>
      </div>

      <StatSection title="Offence" color="var(--color-offence)">
        <StatRow label="Skill DPS" value="0" />
        <StatRow label="Crit Chance" value="0%" />
        <StatRow label="Crit Multi" value="150%" />
        <StatRow label="Attack Speed" value="1.20/s" />
        <StatRow label="Hit Chance" value="5%" />
      </StatSection>

      <StatSection title="Attributes" color="var(--color-text-heading)">
        <StatRow label="Str" value="20" color="var(--color-strength)" />
        <StatRow label="Dex" value="20" color="var(--color-dexterity)" />
        <StatRow label="Int" value="20" color="var(--color-intelligence)" />
      </StatSection>

      <StatSection title="Defence" color="var(--color-defence)">
        <StatRow label="Armour" value="0" />
        <StatRow label="Evasion" value="16" />
        <StatRow label="Evade" value="0%" />
        <StatRow label="Life Regen/s" value="0.0" />
      </StatSection>

      <StatSection title="Resistances" color="var(--color-blood)">
        <StatRow label="Fire" value="-60 /75%" color="var(--color-blood)" />
        <StatRow label="Cold" value="-60 /75%" color="var(--color-blood)" />
        <StatRow
          label="Lightning"
          value="-60 /75%"
          color="var(--color-blood)"
        />
        <StatRow label="Chaos" value="-60 /75%" color="var(--color-blood)" />
      </StatSection>

      <StatSection title="Mitigation" color="var(--color-defence)">
        <StatRow label="Atk Block" value="0%" />
        <StatRow label="Spell Block" value="0%" />
        <StatRow label="Suppression" value="0%" />
        <StatRow label="Phys Reduction" value="0%" />
      </StatSection>
    </aside>
  );
}
