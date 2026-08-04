"use client";

function HighlightText({ text, query }: { text: string; query?: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent/30 text-accent rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function CalcRow({
  label,
  value,
  color,
  suffix,
  filterQuery,
}: {
  label: string;
  value: number | string;
  color?: string;
  suffix?: string;
  filterQuery?: string;
}) {
  const formatted =
    typeof value === "number"
      ? Math.abs(value) >= 1e6
        ? `${(value / 1e6).toFixed(1)}M`
        : Math.abs(value) >= 1e4
          ? `${Math.round(value / 1e3)}k`
          : Number.isInteger(value)
            ? value.toLocaleString()
            : value.toFixed(2)
      : value;

  return (
    <div className="flex justify-between items-baseline text-xs font-mono py-0.5">
      <span className="text-text-dim">
        <HighlightText text={label} query={filterQuery} />
      </span>
      <span className="tabular-nums" style={color ? { color } : undefined}>
        {formatted}
        {suffix ?? ""}
      </span>
    </div>
  );
}

export function CalcSubheader({ label }: { label: string }) {
  return (
    <div className="text-[10px] font-mono text-text-dim/60 uppercase tracking-wider mt-2 mb-0.5">
      {label}
    </div>
  );
}
