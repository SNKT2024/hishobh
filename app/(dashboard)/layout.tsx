import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { PwaInstallButton } from "@/components/shared/PwaInstallButton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-[100dvh] max-h-[100dvh] flex flex-col bg-background selection:bg-primary/20 selection:text-primary overflow-hidden transition-colors duration-150">
      {/* Desktop Navigation Bar (hidden on mobile viewport for authentic native feel) */}
      <header className="hidden sm:flex shrink-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="container max-w-2xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <a href="/dashboard" className="flex items-center gap-2.5 font-bold text-lg tracking-tight group">
            <Image
              src="/icons/apple-icon.png"
              alt="Hishobh Logo"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg object-contain shadow-xs group-hover:scale-105 transition-transform"
              priority
            />
            <span className="font-extrabold tracking-tight">Hishobh</span>
          </a>

          <div className="flex items-center gap-2.5">
            <PwaInstallButton variant="header" />
            <ThemeToggle variant="icon" />
            <UserButton />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 container max-w-2xl mx-auto px-3 sm:px-4 pt-2 sm:pt-3 pb-0 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
