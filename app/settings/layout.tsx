import { BottomNav } from "@/components/dashboard/BottomNav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-3 sm:py-6">
        {children}
      </main>
      <BottomNav onOpenAddModal={() => {}} />
    </div>
  );
}
