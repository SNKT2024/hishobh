"use client";

import { useEffect } from "react";

export function ServiceWorkerManager() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Verify whether the current browser session is in a secure context
    const isLocalhost = Boolean(
      window.location.hostname === "localhost" ||
        window.location.hostname === "[::1]" ||
        window.location.hostname.match(
          /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
        )
    );
    const isSecure = window.isSecureContext || isLocalhost;

    if (!isSecure) {
      console.warn(
        `[PWA Notice] Insecure origin: "${window.location.origin}". PWA Service Workers require HTTPS or literal "localhost". If testing from a mobile device over local Wi-Fi, use an HTTPS tunnel (e.g. ngrok / localtunnel / cloudflared) or Chrome USB remote port forwarding.`
      );
      return;
    }

    // Register /sw.js with fallback
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("[PWA] Service worker active:", reg.scope);
      })
      .catch((err) => {
        console.warn("[PWA] Service worker registration note:", err.message);
      });
  }, []);

  return null;
}
