import React from "react";
import {
  Skeleton,
  SkeletonChartPanel,
  SkeletonGeoList,
  SkeletonListItems,
  SkeletonMapPanel,
  SkeletonStatCard,
  SkeletonTableRows
} from "@/components/ui/Skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="p-8 rounded-3xl border border-primary/15 space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      <div className="glass-panel p-5 rounded-2xl flex items-center justify-between gap-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-12 w-48" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SkeletonChartPanel />
        <SkeletonChartPanel />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
          <Skeleton className="h-4 w-56" />
          <SkeletonListItems count={5} />
        </div>
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <Skeleton className="h-4 w-40" />
          <SkeletonListItems count={4} />
        </div>
      </div>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-8 w-56" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-40 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SkeletonChartPanel height="h-72" />
        <SkeletonChartPanel height="h-72" />
      </div>

      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <Skeleton className="h-4 w-44" />
        <SkeletonListItems count={3} />
      </div>
    </div>
  );
}

export function ClientsTableSkeleton() {
  return <SkeletonTableRows rows={6} cols={6} />;
}

export function ClientsPageSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 glass-panel p-5 rounded-2xl space-y-4">
        <Skeleton className="h-4 w-32" />
        <SkeletonGeoList count={8} />
      </div>
      <div className="lg:col-span-7">
        <SkeletonMapPanel />
      </div>
    </div>
  );
}

export function TargetsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      <SkeletonChartPanel height="h-[280px]" />

      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <Skeleton className="h-4 w-64" />
        <table className="w-full">
          <tbody>
            <SkeletonTableRows rows={5} cols={6} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
