import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Hishobh - Personal Expense Tracker",
    template: "%s | Hishobh",
  },
  description: "Cross-platform personal expense tracker PWA for seamless financial control.",
  applicationName: "Hishobh",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hishobh",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider dynamic>
      <html lang="en">
        <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
