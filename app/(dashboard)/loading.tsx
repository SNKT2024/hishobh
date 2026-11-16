import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="relative flex flex-col min-h-screen pb-28 pt-2 animate-in fade-in duration-150">
      {/* Top Bar Skeleton */}
      <div className="flex items-center justify-between mb-5 px-1">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-24 rounded-lg" />
          <Skeleton className="h-3.5 w-32 rounded-md" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>

      {/* Overview Carousel Card Skeleton */}
      <section className="mb-6">
        <div className="w-full rounded-3xl p-6 bg-card border border-border/80 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-24 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>

          <Skeleton className="h-10 w-44 rounded-xl" />

          <div className="pt-3 border-t border-border/40 grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16 rounded-md" />
              <Skeleton className="h-5 w-24 rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16 rounded-md" />
              <Skeleton className="h-5 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Transactions Section Skeleton */}
      <section className="flex-1 space-y-3">
        <div className="flex items-center justify-between px-1">
          <Skeleton className="h-5 w-28 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>

        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl bg-card border border-border/70 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
              </div>
              <div className="space-y-1.5 text-right">
                <Skeleton className="h-4 w-20 rounded-md ml-auto" />
                <Skeleton className="h-3 w-14 rounded-md ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
