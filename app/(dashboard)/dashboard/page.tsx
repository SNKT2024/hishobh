import { currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Welcome back, {user?.firstName ?? "there"}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Hishobh foundational architecture is active and ready for Phase 1 screens.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card/40">
        <h3 className="font-semibold text-lg text-foreground">Phase 0 Baseline Complete</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto mt-2">
          Clerk Authentication, Supabase Client/Server RLS integration, Tailwind CSS, shadcn/ui, and PWA foundation have been configured.
        </p>
      </div>
    </div>
  );
}
