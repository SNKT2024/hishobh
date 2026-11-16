"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  Home,
  Plus,
  Settings,
  WalletCards,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onOpenAddModal?: () => void;
}

export function BottomNav({
  activeTab: controlledActiveTab,
  onTabChange,
  onOpenAddModal,
}: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticTab, setOptimisticTab] = useState<string | null>(null);

  const getComputedActiveTab = () => {
    if (optimisticTab) return optimisticTab;
    if (controlledActiveTab) return controlledActiveTab;
    if (pathname?.startsWith("/settings")) return "settings";
    if (pathname?.startsWith("/accounts")) return "accounts";
    if (pathname?.startsWith("/stats")) return "stats";
    return "home";
  };

  const currentTab = getComputedActiveTab();

  // Reset optimistic tab when route settles
  useEffect(() => {
    setOptimisticTab(null);
  }, [pathname]);

  // Eager prefetch of all bottom tab routes on mobile mount
  useEffect(() => {
    router.prefetch("/dashboard");
    router.prefetch("/stats");
    router.prefetch("/accounts");
    router.prefetch("/settings");
  }, [router]);

  const tabs = [
    { id: "home", label: "Home", icon: Home, href: "/dashboard" },
    { id: "stats", label: "Stats", icon: BarChart3, href: "/stats" },
    { id: "add", label: "Add", icon: Plus, isAction: true },
    { id: "accounts", label: "Accounts", icon: WalletCards, href: "/accounts" },
    { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
  ];

  const handleActionClick = () => {
    if (onOpenAddModal) {
      onOpenAddModal();
    } else {
      router.push("/dashboard");
    }
  };

  const handleTabClick = (tabId: string, href?: string) => {
    setOptimisticTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
    if (href) {
      startTransition(() => {
        router.push(href);
      });
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none pb-safe"
      suppressHydrationWarning
    >
      <div
        className="max-w-md sm:max-w-xl mx-auto px-4 pb-2.5 sm:pb-3.5"
        suppressHydrationWarning
      >
        <nav
          className="pointer-events-auto relative flex items-center justify-around h-14 sm:h-16 rounded-2xl sm:rounded-3xl bg-card/90 backdrop-blur-xl border border-border shadow-2xl px-2 sm:px-4"
          suppressHydrationWarning
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            if (tab.isAction) {
              return (
                <div key={tab.id} className="relative -top-5 flex flex-col items-center">
                  <button
                    onClick={handleActionClick}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-transform border border-primary/20 shrink-0"
                    aria-label="Add Transaction"
                  >
                    <Plus className="h-6 w-6 stroke-[2.5]" />
                  </button>
                  <span className="text-[10px] font-semibold text-muted-foreground mt-1">
                    Add
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={tab.id}
                href={tab.href!}
                prefetch={true}
                onClick={() => {
                  setOptimisticTab(tab.id);
                  if (onTabChange) {
                    onTabChange(tab.id);
                  }
                }}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-colors select-none",
                  isActive
                    ? "text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "p-1 rounded-xl transition-all relative",
                    isActive && "bg-primary/10"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive && "stroke-[2.2]")} />
                  {isActive && isPending && (
                    <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                  )}
                </div>
                <span className="text-[10px] sm:text-[11px] mt-0.5">
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}