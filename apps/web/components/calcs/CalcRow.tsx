"use client";

export function CalcRow({
  label,
  value,
  color,
  suffix,
}: {
  label: string;
  value: number | string;
  color?: string;
  suffix?: string;
}) {
  const formatted =
    typeof value === "number"
      ? Number.isInteger(value)
        ? value.toLocaleString()
        : value.toFixed(2)
      : value;

  return (
    <div className="flex justify-between items-baseline text-xs font-mono py-0.5">
      <span className="text-text-dim">{label}</span>
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
