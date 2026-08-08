
export function CalcSection({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-bg-card border border-border-subtle rounded p-3 mb-2">
      <h3
        className="text-[11px] font-mono font-bold uppercase tracking-widest mb-2 pb-1 border-b border-border-subtle"
        style={{ color }}
      >
        {title}
      </h3>
      <div className="space-y-px">{children}</div>
    </div>
  );
}
