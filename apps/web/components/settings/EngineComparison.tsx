"use client";

import { useBuildStore } from "@/stores/build-store";

export function EngineComparison() {
  const divergences = useBuildStore((s) => s.engineDivergences);
  const rustEvalTime = useBuildStore((s) => s.rustEvalTime);
  const luaEvalTime = useBuildStore((s) => s.engineEvalTime);
  const rustModCount = useBuildStore((s) => s.rustModCount);
  const stats = useBuildStore((s) => s.stats);

  if (!stats) return null;

  const significant = divergences.filter((d) => Math.abs(d.pctDiff) > 5);
  const matched = divergences.filter((d) => Math.abs(d.pctDiff) <= 1);
  const close = divergences.filter((d) => Math.abs(d.pctDiff) > 1 && Math.abs(d.pctDiff) <= 5);
  const debugInfo = (stats as Record<string, unknown>)?._debug as string | undefined;

  return (
    <div>
      <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-text-dim mb-2">
        Dual Engine Validation
      </h3>
      {debugInfo && (
        <div className="bg-amber-400/5 border border-amber-400/20 rounded px-2 py-1 mb-2 text-[9px] font-mono text-amber-400/80 break-all">
          {debugInfo}
        </div>
      )}
      <div className="bg-bg-card border border-border-card rounded-lg p-3">
        {divergences.length === 0 ? (
          <p className="text-[10px] font-mono text-text-dim/60 text-center py-2">
            {rustEvalTime === null ? "Rust engine not loaded; import a build to compare" : "Waiting for evaluation..."}
          </p>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-2 text-[10px] font-mono text-text-dim">
              <span>Lua: {luaEvalTime ?? "?"}ms</span>
              <span>Rust: {rustEvalTime ?? "?"}ms</span>
              <span>{rustModCount} mods parsed</span>
            </div>

            <div className="flex gap-2 mb-2 text-[10px] font-mono">
              <span className="text-green-400">{matched.length} match</span>
              <span className="text-amber-400">{close.length} close</span>
              <span className="text-red-400">{significant.length} diverge</span>
            </div>

            <div className="space-y-0.5 max-h-64 overflow-y-auto">
              <div className="flex text-[9px] font-mono text-text-dim/60 border-b border-border-subtle pb-0.5 mb-1 sticky top-0 bg-bg-card">
                <span className="flex-1">Stat</span>
                <span className="w-20 text-right">Lua</span>
                <span className="w-20 text-right">Rust</span>
                <span className="w-14 text-right">Diff%</span>
              </div>
              {divergences.map((d) => {
                const absPct = Math.abs(d.pctDiff);
                const color = absPct <= 1 ? "text-green-400" : absPct <= 5 ? "text-amber-400" : "text-red-400";
                return (
                  <div key={d.stat} className="flex text-[10px] font-mono">
                    <span className="flex-1 text-text-dim truncate">{d.stat}</span>
                    <span className="w-20 text-right tabular-nums text-text-primary">{formatVal(d.lua)}</span>
                    <span className="w-20 text-right tabular-nums text-text-primary">{formatVal(d.rust)}</span>
                    <span className={`w-14 text-right tabular-nums ${color}`}>
                      {absPct < 0.1 ? "=" : `${d.pctDiff > 0 ? "+" : ""}${d.pctDiff.toFixed(1)}%`}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function formatVal(v: number): string {
  if (Math.abs(v) >= 1000) return Math.round(v).toLocaleString();
  if (Math.abs(v) >= 10) return Math.round(v).toString();
  if (Math.abs(v) >= 1) return v.toFixed(1);
  return v.toFixed(2);
}
