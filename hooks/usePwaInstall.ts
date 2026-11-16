"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isSecureContext, setIsSecureContext] = useState(true);
  const [platform, setPlatform] = useState<"desktop" | "mobile" | "unknown">("unknown");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect if running in a secure origin
    const isLocalhost = Boolean(
      window.location.hostname === "localhost" ||
        window.location.hostname === "[::1]" ||
        window.location.hostname.match(
          /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
        )
    );
    const secure = Boolean(window.isSecureContext || isLocalhost);
    setIsSecureContext(secure);

    // Detect if already running in standalone PWA window
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
      const isStandaloneNavigator = (window.navigator as any).standalone === true;
      return Boolean(isStandaloneMedia || isStandaloneNavigator);
    };

    if (checkStandalone()) {
      setIsInstalled(true);
    }

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isMobileDevice = /iphone|ipad|ipod|android|mobile/.test(userAgent);
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;

    setIsIos(isIosDevice);
    setPlatform(isMobileDevice ? "mobile" : "desktop");

    // Listen for beforeinstallprompt event (Chromium on Desktop & Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error("[PWA] Installation prompt error:", err);
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    isIos,
    isSecureContext,
    platform,
    promptInstall,
  };
}
