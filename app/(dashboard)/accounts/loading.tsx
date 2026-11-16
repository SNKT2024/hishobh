import { Skeleton } from "@/components/ui/skeleton";

export default function AccountsLoading() {
  return (
    <div className="w-full flex flex-col space-y-6 pb-28 pt-2 animate-in fade-in duration-150">
      {/* Top Header Skeleton */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-28 rounded-lg" />
          <Skeleton className="h-3.5 w-48 rounded-md" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>

      {/* Net Balance Card Skeleton */}
      <div className="rounded-3xl p-6 bg-card border border-border/80 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-28 rounded-md" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Skeleton className="h-10 w-44 rounded-xl" />
      </div>

      {/* Account Cards Section Skeleton */}
      <div className="space-y-6">
        {[1, 2].map((section) => (
          <div key={section} className="space-y-3">
            <Skeleton className="h-4 w-32 rounded-md" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2].map((card) => (
                <div
                  key={card}
                  className="p-4 rounded-2xl bg-card border border-border/80 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-xl" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-28 rounded-md" />
                        <Skeleton className="h-3 w-20 rounded-md" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-12 rounded-lg" />
                  </div>
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                    <Skeleton className="h-3 w-20 rounded-md" />
                    <Skeleton className="h-5 w-24 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
