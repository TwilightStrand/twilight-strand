
import { useBuildStore } from "@/stores/build-store";

export function EngineComparison() {
  const rustEvalTime = useBuildStore((s) => s.rustEvalTime);
  const rustModCount = useBuildStore((s) => s.rustModCount);
  const stats = useBuildStore((s) => s.stats);

  if (!stats) return null;

  return (
    <div>
      <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-text-dim mb-2">
        Engine Info
      </h3>
      <div className="bg-bg-card border border-border-card rounded-lg p-3">
        <div className="flex items-center gap-3 text-[10px] font-mono text-text-dim">
          <span>Rust WASM: {rustEvalTime ?? "?"}ms</span>
          <span>{rustModCount} mods parsed</span>
        </div>
      </div>
    </div>
  );
}
