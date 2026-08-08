
import { useState, useRef, useEffect } from "react";
import { useBuildStore } from "@/stores/build-store";
import { getStatSources } from "@/lib/stat-sources";

export function StatBreakdown({ statKey, label }: { statKey: string; label: string }) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const stats = useBuildStore((s) => s.stats);
  const items = useBuildStore((s) => s.items);

  useEffect(() => {
    if (!show) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [show]);

  if (!stats) return null;

  const sources = show ? getStatSources(statKey, stats, items) : [];

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setShow(!show)}
        className="text-[8px] font-mono text-text-dim/30 hover:text-accent transition-colors leading-none"
        title="Show breakdown"
      >
        ?
      </button>

      {show && sources.length > 0 && (
        <div className="absolute left-0 top-full mt-1 z-30 bg-bg-card border border-border-card rounded-lg shadow-xl p-2.5 min-w-52 max-w-72">
          <div className="text-[9px] font-mono font-bold text-text-dim mb-1.5">{label} Sources</div>
          <div className="space-y-0.5">
            {sources.map((s, i) => (
              <div key={i} className="flex justify-between text-[10px] font-mono gap-3">
                <span className="text-text-dim truncate">{s.source}</span>
                <span
                  className={`shrink-0 tabular-nums ${
                    s.type === "base"
                      ? "text-text-primary"
                      : s.type === "flat"
                        ? "text-accent"
                        : s.type === "increased"
                          ? "text-green-400"
                          : "text-amber-400"
                  }`}
                >
                  {s.value}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2 text-[8px] font-mono text-text-dim/40">
            <span className="text-text-primary">base</span>
            <span className="text-accent">flat</span>
            <span className="text-green-400">inc%</span>
            <span className="text-amber-400">more</span>
          </div>
        </div>
      )}
    </div>
  );
}
