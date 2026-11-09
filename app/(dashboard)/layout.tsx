import { UserButton } from "@clerk/nextjs";
import { Wallet } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      {/* Desktop Navigation Bar (hidden on mobile PWA for authentic native feel) */}
      <header className="hidden sm:flex sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="container max-w-2xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <a href="/dashboard" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Wallet className="h-4 w-4" />
            </div>
            <span>Hishobh</span>
          </a>

          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-3 sm:py-6">
        {children}
      </main>
    </div>
  );
}
