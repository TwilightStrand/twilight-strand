
import { useState } from "react";
import { useBuildStore } from "@/stores/build-store";
import type { TabId } from "@/stores/ui-store";
import { TAB_LABELS, TABS, useUiStore } from "@/stores/ui-store";

const TAB_ICONS: Record<TabId, string> = {
  tree: "⬡",
  items: "⚔",
  skills: "◈",
  config: "⚙",
  calcs: "△",
  settings: "☰",
};

function fmtNum(n: number): string {
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e4) return `${Math.round(n / 1e3)}k`;
  return Math.round(n).toString();
}

export function MobileNav() {
  const { activeTab, setActiveTab, setImportOpen } = useUiStore();
  const stats = useBuildStore((s) => s.stats);
  const [expanded, setExpanded] = useState(false);

  const life = stats?.life ?? 60;
  const es = stats?.energy_shield ?? 0;
  const mana = stats?.mana ?? 50;
  const dps = (stats?.full_dps && stats.full_dps > 0 ? stats.full_dps : null) ?? stats?.combined_dps ?? stats?.total_dps ?? 0;
  const level = stats?.level ?? 1;
  const className = stats?.ascendancy || stats?.class_name || "Scion";

  return (
    <nav className="md:hidden border-t border-border-divider bg-bg-surface/90 backdrop-blur-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center px-2 py-1.5 gap-1.5 border-b border-border-subtle"
      >
        <span className="text-life font-mono text-xs font-bold tabular-nums">{fmtNum(life)}</span>
        <span className="text-[8px] text-text-dim">HP</span>
        {es > 0 && (
          <>
            <span className="text-es font-mono text-xs font-bold tabular-nums">{fmtNum(es)}</span>
            <span className="text-[8px] text-text-dim">ES</span>
          </>
        )}
        {dps > 0 && (
          <>
            <span className="text-offence font-mono text-xs font-bold tabular-nums">{fmtNum(dps)}</span>
            <span className="text-[8px] text-text-dim">DPS</span>
          </>
        )}
        <span className="flex-1" />
        <button
          onClick={(e) => { e.stopPropagation(); setImportOpen(true); }}
          className="text-[9px] font-mono text-accent px-1.5 py-0.5 rounded border border-accent/30"
        >
          Import
        </button>
        <span className="text-[8px] text-text-dim/60">{expanded ? "▾" : "▸"}</span>
      </button>

      {expanded && stats && (
        <div className="px-3 py-2 bg-bg-deep/90 border-b border-border-subtle grid grid-cols-3 gap-2 text-[10px] font-mono">
          <div>
            <div className="text-text-dim/50 text-[8px] uppercase">Armour</div>
            <div className="text-text-primary tabular-nums">{fmtNum(stats.armour)}</div>
          </div>
          <div>
            <div className="text-text-dim/50 text-[8px] uppercase">Evasion</div>
            <div className="text-text-primary tabular-nums">{fmtNum(stats.evasion)}</div>
          </div>
          <div>
            <div className="text-text-dim/50 text-[8px] uppercase">EHP</div>
            <div className="text-text-primary tabular-nums">{fmtNum(stats.total_ehp)}</div>
          </div>
          <div>
            <div className="text-text-dim/50 text-[8px] uppercase">Fire</div>
            <div className="tabular-nums" style={{ color: stats.fire_res >= 75 ? "var(--color-dexterity)" : "var(--color-blood)" }}>{stats.fire_res}%</div>
          </div>
          <div>
            <div className="text-text-dim/50 text-[8px] uppercase">Cold</div>
            <div className="tabular-nums" style={{ color: stats.cold_res >= 75 ? "var(--color-dexterity)" : "var(--color-blood)" }}>{stats.cold_res}%</div>
          </div>
          <div>
            <div className="text-text-dim/50 text-[8px] uppercase">Light</div>
            <div className="tabular-nums" style={{ color: stats.lightning_res >= 75 ? "var(--color-dexterity)" : "var(--color-blood)" }}>{stats.lightning_res}%</div>
          </div>
          <div>
            <div className="text-text-dim/50 text-[8px] uppercase">Crit</div>
            <div className="text-text-primary tabular-nums">{stats.crit_chance.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-text-dim/50 text-[8px] uppercase">Speed</div>
            <div className="text-text-primary tabular-nums">{stats.attack_speed.toFixed(2)}/s</div>
          </div>
          <div>
            <div className="text-text-dim/50 text-[8px] uppercase">Block</div>
            <div className="text-text-primary tabular-nums">{stats.block_chance}%</div>
          </div>
        </div>
      )}
      <div className="flex items-stretch overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`
              flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-mono transition-colors
              ${activeTab === tab ? "text-accent" : "text-text-dim"}
            `}
          >
            <span className="text-sm">{TAB_ICONS[tab]}</span>
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>
    </nav>
  );
}
