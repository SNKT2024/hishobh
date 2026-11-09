"use client";

import { usePathname, useRouter } from "next/navigation";
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
  onOpenAddModal: () => void;
}

export function BottomNav({
  activeTab: controlledActiveTab,
  onTabChange,
  onOpenAddModal,
}: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const getActiveTab = () => {
    if (controlledActiveTab) return controlledActiveTab;
    if (pathname?.startsWith("/settings")) return "settings";
    if (pathname?.startsWith("/accounts")) return "accounts";
    if (pathname?.startsWith("/stats")) return "stats";
    return "home";
  };

  const currentTab = getActiveTab();

  const tabs = [
    { id: "home", label: "Home", icon: Home, href: "/dashboard" },
    { id: "stats", label: "Stats", icon: BarChart3, href: "/dashboard" },
    { id: "add", label: "Add", icon: Plus, isAction: true },
    { id: "accounts", label: "Accounts", icon: WalletCards, href: "/dashboard" },
    { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
  ];

  const handleTabClick = (tab: (typeof tabs)[number]) => {
    if (onTabChange) {
      onTabChange(tab.id);
    }
    if (tab.href) {
      router.push(tab.href);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none pb-safe">
      <div className="max-w-md sm:max-w-xl mx-auto px-4 pb-3 sm:pb-5">
        <nav className="pointer-events-auto relative flex items-center justify-around h-16 rounded-2xl sm:rounded-3xl bg-background/95 backdrop-blur-md border border-border/80 shadow-lg px-2 sm:px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            if (tab.isAction) {
              return (
                <div key={tab.id} className="relative -top-5 flex flex-col items-center">
                  <button
                    onClick={onOpenAddModal}
                    className="flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/30 hover:scale-105 active:scale-95 transition-transform"
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
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-colors select-none",
                  isActive
                    ? "text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "p-1 rounded-xl transition-all",
                    isActive && "bg-primary/10"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive && "stroke-[2.2]")} />
                </div>
                <span className="text-[10px] sm:text-[11px] mt-0.5">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
