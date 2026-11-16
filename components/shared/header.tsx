import Image from "next/image";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { PwaInstallButton } from "@/components/shared/PwaInstallButton";

export function SharedHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-6xl mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
        <a href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight group">
          <Image
            src="/icons/apple-icon.png"
            alt="Hishobh Logo"
            width={36}
            height={36}
            className="h-9 w-9 rounded-xl object-contain shadow-xs group-hover:scale-105 transition-transform"
            priority
          />
          <span className="text-foreground font-black tracking-tight">
            Hishobh
          </span>
        </a>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <PwaInstallButton variant="header" />
          <ThemeToggle variant="icon" />
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm">Get Started</Button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <a href="/dashboard">
              <Button variant="outline" size="sm">
                Dashboard
              </Button>
            </a>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
