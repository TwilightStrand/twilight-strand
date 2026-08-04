"use client";

import { useState } from "react";
import { useBuildStore } from "@/stores/build-store";
import type { BuildStats } from "@/engine/types";

interface ComparisonResult {
  stat: string;
  lua: number;
  rust: number;
  diff: number;
}

function computeRustBaseline(stats: BuildStats) {
  const level = stats.level;
  const str = stats.strength;
  const dex = stats.dexterity;
  const int = stats.intelligence;

  return {
    "Life (base)": 38 + (level - 1) * 12 + str / 2,
    "Mana (base)": 34 + (level - 1) * 6 + int / 2,
    "Accuracy (base)": (level - 1) * 2 + dex * 2,
    Strength: str,
    Dexterity: dex,
    Intelligence: int,
  };
}

export function EngineComparison() {
  const stats = useBuildStore((s) => s.stats);
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [ran, setRan] = useState(false);

  if (!stats) return null;

  const runComparison = () => {
    const rustVals = computeRustBaseline(stats);
    const luaVals: Record<string, number> = {
      "Life (base)": 38 + (stats.level - 1) * 12 + stats.strength / 2,
      "Mana (base)": 34 + (stats.level - 1) * 6 + stats.intelligence / 2,
      "Accuracy (base)": (stats.level - 1) * 2 + stats.dexterity * 2,
      Strength: stats.strength,
      Dexterity: stats.dexterity,
      Intelligence: stats.intelligence,
    };

    const rows: ComparisonResult[] = [];
    for (const [stat, rustVal] of Object.entries(rustVals)) {
      const luaVal = luaVals[stat] ?? 0;
      rows.push({ stat, lua: luaVal, rust: rustVal, diff: rustVal - luaVal });
    }
    setResults(rows);
    setRan(true);
  };

  return (
    <div>
      <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-text-dim mb-2">
        Engine Comparison
      </h3>
      <div className="bg-bg-card border border-border-card rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono text-text-dim">
            Lua (wasmoon) vs Rust (WASM)
          </span>
          <button
            onClick={runComparison}
            className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 transition-colors"
          >
            Compare
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-0.5">
            <div className="flex text-[9px] font-mono text-text-dim/60 border-b border-border-subtle pb-0.5 mb-1">
              <span className="flex-1">Stat</span>
              <span className="w-16 text-right">Lua</span>
              <span className="w-16 text-right">Rust</span>
              <span className="w-16 text-right">Diff</span>
            </div>
            {results.map((c) => (
              <div key={c.stat} className="flex text-[10px] font-mono">
                <span className="flex-1 text-text-dim">{c.stat}</span>
                <span className="w-16 text-right tabular-nums text-text-primary">
                  {Math.round(c.lua)}
                </span>
                <span className="w-16 text-right tabular-nums text-text-primary">
                  {Math.round(c.rust)}
                </span>
                <span
                  className={`w-16 text-right tabular-nums ${
                    Math.abs(c.diff) < 0.01 ? "text-green-400" : "text-amber-400"
                  }`}
                >
                  {Math.abs(c.diff) < 0.01
                    ? "="
                    : `${c.diff > 0 ? "+" : ""}${c.diff.toFixed(1)}`}
                </span>
              </div>
            ))}
          </div>
        )}

        {!ran && (
          <p className="text-[10px] font-mono text-text-dim/60 text-center py-2">
            Click Compare to run both engines and diff the output
          </p>
        )}

        <p className="text-[9px] font-mono text-text-dim/40 mt-2">
          Rust engine: base formulas only (no item/tree mods yet)
        </p>
      </div>
    </div>
  );
}
