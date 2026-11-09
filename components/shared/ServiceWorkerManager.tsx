"use client";

import { useEffect } from "react";

export function ServiceWorkerManager() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV === "development") {
      // In development: actively unregister any stale service workers left from previous production builds
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().then(() => {
            console.log("[PWA] Unregistered stale service worker in development mode.");
          });
        }
      });
    } else {
      // In production: register /sw.js
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => {
          console.error("[PWA] Service worker registration error:", err);
        });
    }
  }, []);

  return null;
}
