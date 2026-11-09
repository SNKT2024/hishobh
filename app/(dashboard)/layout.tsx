import { UserButton } from "@clerk/nextjs";
import { Wallet } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="container max-w-6xl mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          <a href="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Wallet className="h-5 w-5" />
            </div>
            <span>Hishobh</span>
          </a>

          <div className="flex items-center gap-4">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container max-w-6xl mx-auto p-4 sm:p-8">
        {children}
      </main>
    </div>
  );
}
