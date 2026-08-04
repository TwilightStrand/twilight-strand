"use client";

import { useState } from "react";
import { useBuildStore } from "@/stores/build-store";

function fmtNum(n: number): string {
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(Math.round(n));
}

export function MobileStats() {
  const [expanded, setExpanded] = useState(false);
  const stats = useBuildStore((s) => s.stats);

  if (!stats) return null;

  const life = stats.life;
  const es = stats.energy_shield;
  const dps = stats.total_dps || stats.combined_dps || 0;

  return (
    <div className="md:hidden fixed bottom-14 left-0 right-0 z-30">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2 bg-bg-card/95 backdrop-blur border-t border-border-subtle"
      >
        <div className="flex items-center gap-3 text-xs font-mono">
          {life > 1 && <span className="text-life">{fmtNum(life)} HP</span>}
          {es > 0 && <span className="text-es">{fmtNum(es)} ES</span>}
          {dps > 0 && <span className="text-accent">{fmtNum(dps)} DPS</span>}
        </div>
        <span className="text-text-dim/40 text-xs">{expanded ? "v" : "^"}</span>
      </button>

      {expanded && (
        <div className="bg-bg-card/98 backdrop-blur border-t border-border-subtle px-4 py-3 max-h-64 overflow-y-auto">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-text-dim">Life</span>
              <span className="text-life tabular-nums">{fmtNum(life)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">ES</span>
              <span className="text-es tabular-nums">{fmtNum(es)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Mana</span>
              <span className="tabular-nums">{fmtNum(stats.mana)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">DPS</span>
              <span className="text-accent tabular-nums">{fmtNum(dps)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Armour</span>
              <span className="tabular-nums">{fmtNum(stats.armour)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Evasion</span>
              <span className="tabular-nums">{fmtNum(stats.evasion)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Fire</span>
              <span className="tabular-nums">{Math.round(stats.fire_res)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Cold</span>
              <span className="tabular-nums">{Math.round(stats.cold_res)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Light</span>
              <span className="tabular-nums">{Math.round(stats.lightning_res)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Chaos</span>
              <span className="tabular-nums">{Math.round(stats.chaos_res)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Block</span>
              <span className="tabular-nums">{Math.round(stats.block_chance)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">Suppress</span>
              <span className="tabular-nums">{Math.round(stats.suppression)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
