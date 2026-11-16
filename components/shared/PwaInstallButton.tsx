"use client";

import { useState } from "react";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  Globe,
  Laptop,
  Radio,
  Share,
  Smartphone,
  Sparkles,
  Usb,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PwaInstallButtonProps {
  variant?: "header" | "card" | "compact";
  className?: string;
}

export function PwaInstallButton({
  variant = "header",
  className,
}: PwaInstallButtonProps) {
  const {
    isInstallable,
    isInstalled,
    isIos,
    isSecureContext,
    platform,
    promptInstall,
  } = usePwaInstall();
  const [isIosModalOpen, setIsIosModalOpen] = useState(false);
  const [isInsecureModalOpen, setIsInsecureModalOpen] = useState(false);

  const handleInstallClick = async () => {
    if (isInstalled) {
      toast.info("Hishobh is already installed and running on your device!");
      return;
    }

    if (!isSecureContext) {
      setIsInsecureModalOpen(true);
      return;
    }

    if (isIos) {
      setIsIosModalOpen(true);
      return;
    }

    if (isInstallable) {
      const installed = await promptInstall();
      if (installed) {
        toast.success("Hishobh was successfully installed on your device!");
      }
    } else {
      if (platform === "desktop") {
        toast.info(
          "To install on desktop, click the Install App icon (⊕ or laptop icon) in your browser address bar.",
          { duration: 5000 }
        );
      } else {
        setIsIosModalOpen(true);
      }
    }
  };

  // If rendering inside Settings as a rich card
  if (variant === "card") {
    return (
      <>
        <div
          className={cn(
            "rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all",
            className
          )}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                {platform === "desktop" ? (
                  <Laptop className="h-5 w-5" />
                ) : (
                  <Smartphone className="h-5 w-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">
                    {platform === "desktop" ? "Desktop Application" : "Mobile App"}
                  </h3>
                  {isInstalled ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Installed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      <Sparkles className="h-3 w-3" /> PWA Ready
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 max-w-md">
                  {isInstalled
                    ? "Hishobh is running as an installed standalone app with full offline capabilities and instant launching."
                    : platform === "desktop"
                    ? "Install Hishobh directly onto your PC / Mac / Laptop from the browser for a windowed, native desktop app experience."
                    : "Install Hishobh onto your home screen for instantaneous access, smooth gestures, and offline support."}
                </p>
              </div>
            </div>

            <div className="shrink-0 w-full sm:w-auto">
              {isInstalled ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="w-full sm:w-auto gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Installed on this Device
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleInstallClick}
                  className="w-full sm:w-auto gap-2 text-xs font-semibold shadow-xs"
                >
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                  {platform === "desktop" ? "Install on Laptop / PC" : "Install App"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* iOS Installation Help Dialog */}
        <Dialog open={isIosModalOpen} onOpenChange={setIsIosModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                How to Install Hishobh on iOS
              </DialogTitle>
              <DialogDescription>
                Install Hishobh directly without needing the App Store.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm text-foreground">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-border/60">
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                  1
                </div>
                <div>
                  <p className="font-semibold text-xs text-foreground">
                    Tap the Share Button
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    Tap <Share className="h-3.5 w-3.5 text-primary inline" /> in
                    the Safari toolbar (bottom on iPhone, top on iPad).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-border/60">
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                  2
                </div>
                <div>
                  <p className="font-semibold text-xs text-foreground">
                    Scroll down and select
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tap <span className="font-semibold text-foreground">"Add to Home Screen"</span> from the actions list.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-border/60">
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                  3
                </div>
                <div>
                  <p className="font-semibold text-xs text-foreground">
                    Confirm and Launch
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tap <span className="font-semibold text-foreground">"Add"</span> in the top right. Hishobh will appear on your home screen!
                  </p>
                </div>
              </div>
            </div>

            <Button
              className="w-full mt-2"
              onClick={() => setIsIosModalOpen(false)}
            >
              Got it
            </Button>
          </DialogContent>
        </Dialog>

        {/* Insecure Origin (LAN HTTP) Explanation Dialog */}
        <Dialog open={isInsecureModalOpen} onOpenChange={setIsInsecureModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
                Mobile PWA Requires HTTPS
              </DialogTitle>
              <DialogDescription>
                Mobile browsers strictly forbid installing PWAs over local network HTTP (e.g. 192.168.x.x).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs text-foreground">
              <p className="text-muted-foreground leading-relaxed">
                Chrome and Safari require an encrypted <span className="font-semibold text-foreground">HTTPS connection</span> (or literal <span className="font-mono bg-muted px-1.5 py-0.5 rounded">localhost</span> on the same computer) to enable Service Workers and PWA installation.
              </p>

              <div className="p-3 rounded-xl bg-muted/50 border border-border/60 space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-foreground">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  Option 1: Deploy to Production (Recommended)
                </p>
                <p className="text-muted-foreground">
                  Deploying to Vercel, Netlify, or your domain provides automatic HTTPS. Once opened on your phone, Chrome will immediately show the "Install App" prompt.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-muted/50 border border-border/60 space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-foreground">
                  <Radio className="h-3.5 w-3.5 text-primary" />
                  Option 2: Test Mobile Locally with HTTPS Tunnel
                </p>
                <p className="text-muted-foreground">
                  Run <code className="bg-background px-1.5 py-0.5 rounded font-mono text-primary font-semibold">npx localtunnel --port 3000</code> in your terminal. It gives you a temporary secure HTTPS link to open on your phone.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-muted/50 border border-border/60 space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-foreground">
                  <Usb className="h-3.5 w-3.5 text-primary" />
                  Option 3: USB Port Forwarding (Android)
                </p>
                <p className="text-muted-foreground">
                  Connect via USB, open <code className="bg-background px-1 py-0.5 rounded font-mono">chrome://inspect</code> on your PC, forward port 3000, and visit <code className="bg-background px-1 py-0.5 rounded font-mono">http://localhost:3000</code> directly on your phone.
                </p>
              </div>
            </div>

            <Button
              className="w-full mt-2"
              onClick={() => setIsInsecureModalOpen(false)}
            >
              Understood
            </Button>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Header / Compact Variant
  if (isInstalled) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleInstallClick}
        className={cn(
          "gap-1.5 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10 transition-colors shadow-xs shrink-0",
          className
        )}
        title={
          platform === "desktop"
            ? "Install Hishobh on your PC / Mac"
            : "Install Hishobh App"
        }
      >
        <ArrowDownToLine className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">
          {platform === "desktop" ? "Install on PC" : "Install App"}
        </span>
        <span className="sm:hidden">Install</span>
      </Button>

      {/* iOS Help Dialog */}
      <Dialog open={isIosModalOpen} onOpenChange={setIsIosModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              How to Install Hishobh
            </DialogTitle>
            <DialogDescription>
              Install Hishobh directly to your device.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm text-foreground">
            {platform === "desktop" ? (
              <div className="p-3 rounded-xl bg-muted/50 border border-border/60 text-xs space-y-2">
                <p className="font-semibold text-foreground">
                  Installing on Desktop (Chrome / Edge / Brave):
                </p>
                <p className="text-muted-foreground">
                  Look for the <span className="font-semibold text-primary">Install icon</span> (⊕ or monitor icon) located on the right side of your browser address bar, and click <span className="font-semibold text-foreground">Install</span>.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-border/60">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-foreground">
                      Tap the Share Button
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      Tap <Share className="h-3.5 w-3.5 text-primary inline" /> in
                      the Safari toolbar.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-border/60">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-foreground">
                      Tap "Add to Home Screen"
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Scroll down in the share sheet and select <span className="font-semibold text-foreground">"Add to Home Screen"</span>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-border/60">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-foreground">
                      Confirm & Open
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tap <span className="font-semibold text-foreground">"Add"</span>. The app is now installed on your home screen!
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <Button
            className="w-full mt-2"
            onClick={() => setIsIosModalOpen(false)}
          >
            Got it
          </Button>
        </DialogContent>
      </Dialog>

      {/* Insecure Origin (LAN HTTP) Explanation Dialog */}
      <Dialog open={isInsecureModalOpen} onOpenChange={setIsInsecureModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Mobile PWA Requires HTTPS
            </DialogTitle>
            <DialogDescription>
              Mobile browsers strictly forbid installing PWAs over local network HTTP (e.g. 192.168.x.x).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs text-foreground">
            <p className="text-muted-foreground leading-relaxed">
              Chrome and Safari require an encrypted <span className="font-semibold text-foreground">HTTPS connection</span> (or literal <span className="font-mono bg-muted px-1.5 py-0.5 rounded">localhost</span> on the same computer) to enable Service Workers and PWA installation.
            </p>

            <div className="p-3 rounded-xl bg-muted/50 border border-border/60 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-foreground">
                <Globe className="h-3.5 w-3.5 text-primary" />
                Option 1: Deploy to Production (Recommended)
              </p>
              <p className="text-muted-foreground">
                Deploying to Vercel, Netlify, or your domain provides automatic HTTPS. Once opened on your phone, Chrome will immediately show the "Install App" prompt.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-muted/50 border border-border/60 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-foreground">
                <Radio className="h-3.5 w-3.5 text-primary" />
                Option 2: Test Mobile Locally with HTTPS Tunnel
              </p>
              <p className="text-muted-foreground">
                Run <code className="bg-background px-1.5 py-0.5 rounded font-mono text-primary font-semibold">npx localtunnel --port 3000</code> in your terminal. It gives you a temporary secure HTTPS link to open on your phone.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-muted/50 border border-border/60 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-foreground">
                <Usb className="h-3.5 w-3.5 text-primary" />
                Option 3: USB Port Forwarding (Android)
              </p>
              <p className="text-muted-foreground">
                Connect via USB, open <code className="bg-background px-1 py-0.5 rounded font-mono">chrome://inspect</code> on your PC, forward port 3000, and visit <code className="bg-background px-1 py-0.5 rounded font-mono">http://localhost:3000</code> directly on your phone.
              </p>
            </div>
          </div>

          <Button
            className="w-full mt-2"
            onClick={() => setIsInsecureModalOpen(false)}
          >
            Understood
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
