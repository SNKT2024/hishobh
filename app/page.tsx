import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { SharedHeader } from "@/components/shared/header";
import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone, ShieldCheck, Zap } from "lucide-react";
import { RedirectIfAuthenticated } from "@/components/auth/RedirectIfAuthenticated";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <RedirectIfAuthenticated />
      <SharedHeader />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-6">
          <Zap className="h-3.5 w-3.5" /> Next-Gen Cross-Platform PWA
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground max-w-2xl mb-4">
          Master your personal expenses with{" "}
          <span className="text-primary font-black">
            Hishobh
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mb-8">
          Seamless, real-time expense tracking across desktop and mobile. Fast, private, and always available offline.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <SignedIn>
            <a href="/dashboard">
              <Button size="lg" className="gap-2 text-base px-6">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </SignedIn>

          <SignedOut>
            <a href="/sign-up">
              <Button size="lg" className="gap-2 text-base px-6">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <a href="/sign-in">
              <Button variant="outline" size="lg" className="text-base px-6">
                Sign In
              </Button>
            </a>
          </SignedOut>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 text-left w-full">
          <div className="p-6 rounded-2xl border border-border bg-card/60 shadow-sm">
            <Smartphone className="h-6 w-6 text-primary mb-3" />
            <h3 className="font-semibold text-foreground text-lg mb-1">Installable PWA</h3>
            <p className="text-sm text-muted-foreground">
              Install directly to your iOS or Android home screen with responsive offline support.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card/60 shadow-sm">
            <Zap className="h-6 w-6 text-primary mb-3" />
            <h3 className="font-semibold text-foreground text-lg mb-1">Instant Sync</h3>
            <p className="text-sm text-muted-foreground">
              Powered by Supabase and Clerk for seamless multi-device financial records.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card/60 shadow-sm">
            <ShieldCheck className="h-6 w-6 text-primary mb-3" />
            <h3 className="font-semibold text-foreground text-lg mb-1">Row-Level Security</h3>
            <p className="text-sm text-muted-foreground">
              Strict database-level isolation ensuring only you have access to your private ledger.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        Hishobh &copy; {new Date().getFullYear()} &bull; Personal Expense Tracker PWA
      </footer>
    </div>
  );
}
