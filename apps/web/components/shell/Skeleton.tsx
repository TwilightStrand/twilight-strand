
export function SkeletonLine({ width = "100%" }: { width?: string }) {
  return (
    <div
      className="h-3 bg-bg-hover/50 rounded animate-pulse"
      style={{ width }}
    />
  );
}

export function StatsSkeleton() {
  return (
    <aside className="w-48 min-w-48 hidden md:block border-r border-border-subtle bg-bg-deep/80 p-3 space-y-3" aria-label="Loading build statistics">
      <div className="flex gap-2 mb-3 pb-2 border-b border-border-subtle">
        <SkeletonLine width="30px" />
        <SkeletonLine width="30px" />
        <SkeletonLine width="30px" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="space-y-1.5">
          <SkeletonLine width="60%" />
          <SkeletonLine width="100%" />
          <SkeletonLine width="100%" />
          <SkeletonLine width="80%" />
        </div>
      ))}
    </aside>
  );
}
