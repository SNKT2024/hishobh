import Link from "next/dynamic";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

export function SharedHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-6xl mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
        <a href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Hishobh
          </span>
        </a>

        <div className="flex items-center gap-3">
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
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
