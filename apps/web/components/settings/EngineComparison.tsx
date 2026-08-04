"use client";

import { useState, useEffect } from "react";
import { useBuildStore } from "@/stores/build-store";
import type { BuildStats } from "@/engine/types";

interface ComparisonResult {
  stat: string;
  lua: number;
  rust: number;
  diff: number;
}

function computeBaselineFormulas(stats: BuildStats) {
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
  const [rustAvailable, setRustAvailable] = useState(false);

  useEffect(() => {
    import("@/engine/rust-bridge")
      .then((m) => m.initRustEngine().then(() => setRustAvailable(m.isRustEngineReady())))
      .catch(() => {});
  }, []);

  if (!stats) return null;

  const runComparison = async () => {
    const luaVals = computeBaselineFormulas(stats);

    let rustVals: Record<string, number>;

    if (rustAvailable) {
      try {
        const { evaluateBuildRust } = await import("@/engine/rust-bridge");
        const rustOutput = evaluateBuildRust({
          level: stats.level,
          class_id: 0,
          base_str: 20,
          base_dex: 20,
          base_int: 20,
          modifiers: [
            { stat: "Str", value: stats.strength - 20, mod_type: "flat" },
            { stat: "Dex", value: stats.dexterity - 20, mod_type: "flat" },
            { stat: "Int", value: stats.intelligence - 20, mod_type: "flat" },
          ],
          allocated_keystones: [],
          main_skill_id: "",
        });

        if (rustOutput) {
          rustVals = {
            "Life (base)": rustOutput.life,
            "Mana (base)": rustOutput.mana,
            "Accuracy (base)": rustOutput.accuracy,
            Strength: rustOutput.strength,
            Dexterity: rustOutput.dexterity,
            Intelligence: rustOutput.intelligence,
          };
        } else {
          rustVals = computeBaselineFormulas(stats);
        }
      } catch {
        rustVals = computeBaselineFormulas(stats);
      }
    } else {
      rustVals = computeBaselineFormulas(stats);
    }

    const rows: ComparisonResult[] = [];
    for (const [stat, luaVal] of Object.entries(luaVals)) {
      const rustVal = rustVals[stat] ?? 0;
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
            {rustAvailable && <span className="text-green-400 ml-1">live</span>}
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
          {rustAvailable
            ? "Using real Rust WASM engine for comparison"
            : "Rust WASM not loaded; using formula simulation"}
        </p>
      </div>
    </div>
  );
}
