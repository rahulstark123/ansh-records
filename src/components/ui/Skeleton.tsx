import React from "react";

function cn(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("skeleton-shimmer rounded-lg", className)}
    />
  );
}

export function SkeletonStatCard() {
  return (
    <div className="glass-panel p-6 rounded-2xl space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
      </div>
      <Skeleton className="h-4 w-28" />
    </div>
  );
}

export function SkeletonChartPanel({ height = "h-64" }: { height?: string }) {
  return (
    <div className="glass-panel p-6 rounded-2xl space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <Skeleton className={cn("w-full rounded-xl", height)} />
    </div>
  );
}

export function SkeletonTableRows({
  rows = 5,
  cols = 6
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, row) => (
        <tr key={row}>
          {Array.from({ length: cols }).map((__, col) => (
            <td key={col} className="px-6 py-4">
              <Skeleton className={cn("h-4", col === 0 ? "w-12" : col === 1 ? "w-full max-w-[220px]" : "w-24")} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SkeletonListItems({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-3/4 max-w-[200px]" />
            <Skeleton className="h-2.5 w-1/2 max-w-[140px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonGeoList({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/80"
        >
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonMapPanel() {
  return (
    <div className="flex-1 min-h-[380px] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <Skeleton className="h-full w-full rounded-none" />
    </div>
  );
}
