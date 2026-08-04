"use client";

import { useBuildStore } from "@/stores/build-store";
import type { SkillGroup, GemData } from "@/engine/types";

function gemColor(gem: GemData): string {
  const id = gem.skillId.toLowerCase();
  if (id.includes("str") || id.includes("melee") || id.includes("slam"))
    return "var(--color-strength)";
  if (id.includes("dex") || id.includes("projectile") || id.includes("bow"))
    return "var(--color-dexterity)";
  if (id.includes("int") || id.includes("spell") || id.includes("curse"))
    return "var(--color-intelligence)";
  if (gem.isSupport) return "var(--color-text-dim)";
  return "var(--color-accent)";
}

function GemSlot({ gem }: { gem: GemData }) {
  return (
    <div
      className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-mono ${
        gem.enabled ? "" : "opacity-40"
      }`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: gemColor(gem) }}
      />
      <span className="flex-1 min-w-0 truncate text-text-primary">
        {gem.name || gem.skillId}
      </span>
      {gem.isSupport && (
        <span className="text-[9px] uppercase tracking-wider text-text-dim bg-bg-hover px-1 rounded">
          sup
        </span>
      )}
      <span className="text-text-dim tabular-nums shrink-0">
        {gem.level}/{gem.quality}
      </span>
    </div>
  );
}

function SocketGroupCard({ group, index, isMain }: { group: SkillGroup; index: number; isMain: boolean }) {
  const activeGem = group.gems.find((g) => !g.isSupport);
  const supports = group.gems.filter((g) => g.isSupport);

  return (
    <div
      className={`border rounded-lg overflow-hidden ${
        group.enabled
          ? isMain
            ? "border-accent/40 bg-bg-card"
            : "border-border-card bg-bg-card"
          : "border-border-subtle bg-bg-card/50 opacity-60"
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-bg-card-alt/50">
        <span className="text-[10px] font-mono text-text-dim tabular-nums w-4">
          {index + 1}
        </span>
        <span className="text-sm font-mono text-text-heading truncate flex-1">
          {group.label}
        </span>
        {isMain && (
          <span className="text-[9px] font-mono uppercase tracking-wider text-accent bg-accent/10 px-1.5 rounded">
            main
          </span>
        )}
        {group.dps !== undefined && group.dps > 0 && (
          <span className="text-[10px] font-mono text-accent tabular-nums">
            {group.dps >= 1e6 ? `${(group.dps / 1e6).toFixed(1)}M` : group.dps >= 1e3 ? `${Math.round(group.dps / 1e3)}k` : Math.round(group.dps)} DPS
          </span>
        )}
        {group.slot && (
          <span className="text-[10px] font-mono text-text-dim truncate">
            {group.slot}
          </span>
        )}
        {!group.enabled && (
          <span className="text-[9px] uppercase tracking-wider text-blood">
            off
          </span>
        )}
      </div>
      <div className="py-1">
        {activeGem && <GemSlot gem={activeGem} />}
        {supports.map((gem, i) => (
          <GemSlot key={i} gem={gem} />
        ))}
      </div>
    </div>
  );
}

export function SkillsTab() {
  const skills = useBuildStore((s) => s.skills);
  const mainSocketGroup = useBuildStore((s) => s.stats?.main_socket_group ?? 0);

  if (skills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
        <p className="text-text-dim font-mono text-sm">No socket groups</p>
        <p className="text-text-dim/60 text-xs text-center max-w-xs">
          A socket group holds an active skill gem and the support gems linked
          to it. Import a build or add one manually.
        </p>
        <button className="mt-2 px-4 py-1.5 text-sm font-mono bg-bg-card border border-border-card rounded hover:border-accent/50 text-text-dim hover:text-accent transition-colors">
          + Add socket group
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-mono uppercase tracking-widest text-text-dim">
          Socket Groups
        </h2>
        <button className="text-xs font-mono text-text-dim hover:text-accent transition-colors">
          + Add group
        </button>
      </div>
      <div className="space-y-2 max-w-2xl">
        {skills.map((group, i) => (
          <SocketGroupCard key={i} group={group} index={i} isMain={i + 1 === mainSocketGroup} />
        ))}
      </div>
    </div>
  );
}
