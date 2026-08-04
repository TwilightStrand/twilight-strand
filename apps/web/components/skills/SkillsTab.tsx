"use client";

import { useState } from "react";
import { useBuildStore } from "@/stores/build-store";
import { EmptyState } from "@/components/shell/EmptyState";
import type { SkillGroup, GemData } from "@/engine/types";

function fmtNum(n: number): string {
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(Math.round(n));
}

function gemColor(gem: GemData): string {
  const name = (gem.name || gem.skillId).toLowerCase();

  if (gem.isSupport) {
    if (name.includes("melee") || name.includes("ruthless") || name.includes("brutality") || name.includes("pulverise") || name.includes("fortify") || name.includes("rage") || name.includes("fist")) return "#c85c5c";
    if (name.includes("chain") || name.includes("pierce") || name.includes("fork") || name.includes("mirage") || name.includes("vicious") || name.includes("faster attacks") || name.includes("added cold") || name.includes("barrage")) return "#5cc85c";
    if (name.includes("spell") || name.includes("arcane") || name.includes("intensify") || name.includes("controlled") || name.includes("elemental focus") || name.includes("concentrated") || name.includes("infused") || name.includes("inspiration") || name.includes("cold penetration") || name.includes("minion")) return "#5c7cc8";
    return "#8888aa";
  }

  // Strength (red)
  if (name.includes("slam") || name.includes("strike") || name.includes("cleave") || name.includes("sunder") ||
      name.includes("earthquake") || name.includes("warcry") || name.includes("righteous fire") ||
      name.includes("molten") || name.includes("tectonic") || name.includes("infernal") ||
      name.includes("shield charge") || name.includes("leap slam") || name.includes("vigilant") ||
      name.includes("steelskin") || name.includes("enduring cry")) return "#c44";
  // Dexterity (green)
  if (name.includes("arrow") || name.includes("shot") || name.includes("rain of") || name.includes("barrage") ||
      name.includes("tornado") || name.includes("whirling") || name.includes("flicker") ||
      name.includes("trap") || name.includes("mine") || name.includes("viper") ||
      (name.includes("blade") && !name.includes("bladefall")) ||
      name.includes("dash") || name.includes("blink")) return "#4c4";
  // Intelligence (blue)
  if (name.includes("orb") || name.includes("bolt") || name.includes("nova") || name.includes("pulse") ||
      name.includes("storm") || name.includes("arc") || name.includes("spark") ||
      name.includes("curse") || name.includes("summon") || name.includes("raise") ||
      name.includes("ice") || name.includes("frost") || name.includes("cold snap") ||
      name.includes("detonate") || name.includes("desecrate") || name.includes("offering") ||
      name.includes("golem") || name.includes("flesh and stone") || name.includes("winter")) return "#44c";

  return "var(--color-accent)";
}

function GemSlot({ gem }: { gem: GemData }) {
  const isMaxLevel = gem.level >= 21;
  const isAwakened = (gem.name || "").toLowerCase().startsWith("awakened");
  const isVaal = (gem.name || "").toLowerCase().startsWith("vaal");

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-mono ${
        gem.enabled ? "" : "opacity-40"
      }`}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0 ring-1 ring-white/10"
        style={{ backgroundColor: gemColor(gem) }}
      />
      <span className="flex-1 min-w-0 truncate text-text-primary">
        {isVaal && <span className="text-red-400 mr-0.5">V</span>}
        {isAwakened && <span className="text-amber-400 mr-0.5">A</span>}
        {gem.name || gem.skillId}
      </span>
      {gem.isSupport && (
        <span className="text-[9px] uppercase tracking-wider text-text-dim bg-bg-hover px-1 rounded">
          sup
        </span>
      )}
      <span className="tabular-nums shrink-0">
        <span className={isMaxLevel ? "text-amber-400" : "text-text-dim"}>{gem.level}</span>
        <span className="text-text-dim/40">/</span>
        <span className={gem.quality >= 20 ? "text-accent" : "text-text-dim"}>{gem.quality}</span>
      </span>
    </div>
  );
}

function SocketGroupCard({ group, index, isMain, totalDps }: { group: SkillGroup; index: number; isMain: boolean; totalDps: number }) {
  const items = useBuildStore((s) => s.items);
  const equippedItem = items.find((item) => item.slot === group.slot);
  const allGems = group.gems;
  const [showTooltip, setShowTooltip] = useState(false);

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
      <div
        className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-bg-card-alt/50 relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {showTooltip && group.dps !== undefined && group.dps > 0 && (
          <div className="absolute top-full left-0 mt-1 z-20 bg-bg-card border border-border-card rounded-lg shadow-xl p-3 min-w-48">
            <div className="text-xs font-mono space-y-1">
              <div className="flex justify-between gap-4">
                <span className="text-text-dim">DPS</span>
                <span className="text-accent tabular-nums">{fmtNum(group.dps)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-text-dim">Active Gems</span>
                <span className="text-text-primary">{allGems.filter(g => !g.isSupport).length}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-text-dim">Supports</span>
                <span className="text-text-primary">{allGems.filter(g => g.isSupport).length}</span>
              </div>
              {equippedItem && (
                <div className="flex justify-between gap-4 border-t border-border-subtle pt-1 mt-1">
                  <span className="text-text-dim">Item</span>
                  <span className="text-text-primary truncate max-w-32">{equippedItem.name || equippedItem.base}</span>
                </div>
              )}
            </div>
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            const { skills } = useBuildStore.getState();
            const updated = skills.map((s, i) =>
              i === index ? { ...s, enabled: !s.enabled } : s
            );
            useBuildStore.setState({ skills: updated });
          }}
          className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold transition-colors ${
            group.enabled
              ? "bg-accent/20 text-accent border border-accent/40"
              : "bg-bg-hover text-text-dim/40 border border-border-subtle"
          }`}
          title={group.enabled ? "Disable group" : "Enable group"}
        >
          {group.enabled ? "E" : "D"}
        </button>
        <button
          onClick={() => {
            const { stats } = useBuildStore.getState();
            if (stats) {
              useBuildStore.setState({ stats: { ...stats, main_socket_group: index + 1 } });
            }
          }}
          className={`text-[10px] font-mono tabular-nums w-4 transition-colors ${
            isMain ? "text-accent" : "text-text-dim hover:text-accent"
          }`}
          title={isMain ? "Main skill" : "Click to set as main skill"}
        >
          {index + 1}
        </button>
        <span className="text-sm font-mono text-text-heading truncate flex-1">
          {group.label}
        </span>
        {isMain && (
          <span className="text-[9px] font-mono uppercase tracking-wider text-accent bg-accent/10 px-1.5 rounded">
            main
          </span>
        )}
        {group.dps !== undefined && group.dps > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-accent tabular-nums">
              {fmtNum(group.dps)} DPS
            </span>
            {totalDps > 0 && (
              <span className="text-[9px] font-mono text-text-dim/60 tabular-nums">
                ({Math.round((group.dps / totalDps) * 100)}%)
              </span>
            )}
          </div>
        )}
        {group.slot && (
          <span
            className="text-[10px] font-mono text-text-dim truncate"
            title={equippedItem ? `Equipped: ${equippedItem.name || equippedItem.base}` : `${group.slot}: Empty`}
          >
            {group.slot}
          </span>
        )}
        {!group.enabled && (
          <span className="text-[9px] uppercase tracking-wider text-blood">
            off
          </span>
        )}
        {group.enabled && allGems.length > 0 && !allGems.some(g => !g.isSupport && g.enabled) && (
          <span className="text-[9px] font-mono text-amber-400/70 bg-amber-400/10 px-1.5 rounded">
            No active skill
          </span>
        )}
      </div>
      <div className="py-1 relative">
        {allGems.length > 1 && (
          <div className="absolute left-4 top-3 bottom-3 w-px bg-border-card" />
        )}
        {allGems.map((gem, i) => (
          <div key={i} className="relative">
            {allGems.length > 1 && (
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full border border-border-card bg-bg-card z-10" />
            )}
            <div className={allGems.length > 1 ? "pl-4" : ""}>
              <GemSlot gem={gem} />
            </div>
          </div>
        ))}
      </div>
      {group.dps !== undefined && group.dps > 0 && totalDps > 0 && (
        <div className="h-0.5 bg-bg-hover rounded-full mx-2 mb-1.5">
          <div
            className="h-full bg-accent/40 rounded-full"
            style={{ width: `${(group.dps / totalDps) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function SkillsTab() {
  const skills = useBuildStore((s) => s.skills);
  const mainSocketGroup = useBuildStore((s) => s.stats?.main_socket_group ?? 0);
  const totalDps = skills.reduce((sum, g) => sum + (g.dps || 0), 0);

  if (skills.length === 0) {
    return (
      <EmptyState
        title="No Socket Groups"
        description="Socket groups hold active skill gems and support gems linked to them. Import a build to see your skills."
      />
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
          <SocketGroupCard key={i} group={group} index={i} isMain={i + 1 === mainSocketGroup} totalDps={totalDps} />
        ))}
      </div>
    </div>
  );
}
