"use client";

function fmtNum(n: number): string {
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(Math.round(n));
}

interface BuildCardProps {
  name: string;
  className?: string;
  ascendancy?: string;
  level: number;
  dps?: number;
  life?: number;
  es?: number;
  onClick?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}

export function BuildCard({ name, className, ascendancy, level, dps, life, es, onClick, onDelete, compact }: BuildCardProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 rounded border border-border-subtle hover:border-accent/30 hover:bg-bg-hover/50 transition-colors cursor-pointer ${compact ? "px-2 py-1.5" : "px-3 py-2"}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`font-mono text-text-primary truncate ${compact ? "text-[10px]" : "text-xs"}`}>
            {name}
          </span>
          <span className={`font-mono text-text-dim ${compact ? "text-[9px]" : "text-[10px]"}`}>
            Lv {level}
          </span>
        </div>
        {(ascendancy || className) && (
          <div className={`font-mono text-text-dim/60 ${compact ? "text-[8px]" : "text-[9px]"}`}>
            {ascendancy || className}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {dps !== undefined && dps > 0 && (
          <span className={`font-mono text-accent tabular-nums ${compact ? "text-[9px]" : "text-[10px]"}`}>
            {fmtNum(dps)} DPS
          </span>
        )}
        {(life !== undefined || es !== undefined) && (
          <div className={`font-mono tabular-nums ${compact ? "text-[8px]" : "text-[9px]"}`}>
            {life !== undefined && life > 1 && <span className="text-life">{fmtNum(life)}</span>}
            {life !== undefined && life > 1 && es !== undefined && es > 0 && <span className="text-text-dim/40"> / </span>}
            {es !== undefined && es > 0 && <span className="text-es">{fmtNum(es)}</span>}
          </div>
        )}
      </div>

      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-text-dim/40 hover:text-blood text-xs shrink-0 transition-colors"
        >
          x
        </button>
      )}
    </div>
  );
}
