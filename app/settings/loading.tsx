import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto w-full space-y-6 pb-20 pt-2 animate-in fade-in duration-150">
      <div className="space-y-1.5">
        <Skeleton className="h-6 w-28 rounded-lg" />
        <Skeleton className="h-3.5 w-60 rounded-md" />
      </div>

      <div className="space-y-6">
        {[1, 2].map((sec) => (
          <div key={sec} className="space-y-2">
            <Skeleton className="h-3 w-36 rounded-md px-1" />
            <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm divide-y divide-border/60">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3.5">
                    <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32 rounded-md" />
                      <Skeleton className="h-3 w-48 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
