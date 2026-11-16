import { Skeleton } from "@/components/ui/skeleton";

export default function StatsLoading() {
  return (
    <div className="w-full flex flex-col space-y-6 pb-28 pt-2 animate-in fade-in duration-150">
      {/* Top Header Skeleton */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-36 rounded-lg" />
          <Skeleton className="h-3.5 w-48 rounded-md" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>

      {/* Metric Summary Cards Skeleton (3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-card border border-border/80 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-20 rounded-md" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton className="h-7 w-28 rounded-lg" />
            <Skeleton className="h-3 w-32 rounded-md" />
          </div>
        ))}
      </div>

      {/* Cash Flow Trends Chart Skeleton */}
      <div className="rounded-3xl p-5 bg-card border border-border/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-3.5 w-44 rounded-md" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-4 w-12 rounded-full" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-56 sm:h-64 w-full rounded-2xl" />
      </div>

      {/* Category Breakdown & Social Cards Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-3xl p-5 bg-card border border-border/80 space-y-4">
          <Skeleton className="h-5 w-36 rounded-md" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
        <div className="rounded-3xl p-5 bg-card border border-border/80 space-y-4">
          <Skeleton className="h-5 w-36 rounded-md" />
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-secondary/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-3 w-16 rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-4 w-16 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
