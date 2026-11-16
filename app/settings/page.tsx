import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { PwaInstallButton } from "@/components/shared/PwaInstallButton";
import {
  ChevronRight,
  CreditCard,
  DownloadCloud,
  FileSpreadsheet,
  HandCoins,
  Palette,
  Shield,
  User,
  Users,
} from "lucide-react";

interface SettingsItem {
  title: string;
  description: string;
  icon: any;
  href: string;
  badge?: string;
}

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

export default async function SettingsPage() {
  const user = await currentUser();

  const settingsSections: SettingsSection[] = [
    {
      title: "Entities & Counterparties",
      items: [
        {
          title: "People & Contacts",
          description: "Manage friends, family, and colleagues for splits and lend/borrow",
          icon: Users,
          href: "/settings/people",
          badge: "Active",
        },
        {
          title: "Accounts & Cards",
          description: "Configure Cash, Bank accounts, Wallets, and Credit Cards",
          icon: CreditCard,
          href: "/accounts",
          badge: "Active",
        },
        {
          title: "Lend & Borrow Ledger",
          description: "Isolated debts and settlement history",
          icon: HandCoins,
          href: "/settings/lend-borrow",
          badge: "Active",
        },
      ],
    },
    {
      title: "Data & Backfilling",
      items: [
        {
          title: "Import Transactions",
          description: "Bulk import CSV or Excel (.xlsx) files with smart column mapping & undo",
          icon: FileSpreadsheet,
          href: "/settings/import",
          badge: "New",
        },
      ],
    },
    {
      title: "Account & Security",
      items: [
        {
          title: "User Profile",
          description: `${user?.primaryEmailAddress?.emailAddress || "Clerk Authenticated"}`,
          icon: User,
          href: "/sign-in",
        },
        {
          title: "Security & RLS",
          description: "Row-Level Security active via Clerk User ID",
          icon: Shield,
          href: "#",
        },
      ],
    },
  ];

  return (
    <div
      className="max-w-2xl mx-auto w-full space-y-6 pb-24 sm:pb-28 pt-2"
      suppressHydrationWarning
    >
      <div suppressHydrationWarning>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure counterparties, account types, and application preferences
        </p>
      </div>

      <div className="space-y-6" suppressHydrationWarning>
        {/* Appearance & Theme (Color Hunt Palette: #F3F8FF, #E26EE5, #7E30E1, #49108B) */}
        <div className="space-y-2" suppressHydrationWarning>
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-primary" />
                <span>Appearance & Theme</span>
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Lavender Purple & White palette with instant dark mode support
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#F3F8FF] border border-border" title="#F3F8FF Ice White" />
              <span className="h-3 w-3 rounded-full bg-[#E26EE5]" title="#E26EE5 Orchid Pink" />
              <span className="h-3 w-3 rounded-full bg-[#7E30E1]" title="#7E30E1 Lavender Purple" />
              <span className="h-3 w-3 rounded-full bg-[#49108B]" title="#49108B Royal Purple" />
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
            <ThemeToggle variant="segmented" />
          </div>
        </div>

        {/* Device & PWA Installation (Desktop / Laptop / Mobile) */}
        <div className="space-y-2" suppressHydrationWarning>
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <DownloadCloud className="h-3.5 w-3.5 text-primary" />
              <span>App Installation & Devices</span>
            </h2>
          </div>
          <PwaInstallButton variant="card" />
        </div>

        {settingsSections.map((section) => (
          <div key={section.title} className="space-y-2" suppressHydrationWarning>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
              {section.title}
            </h2>
            <div
              className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm divide-y divide-border/60"
              suppressHydrationWarning
            >
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    prefetch={true}
                    className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors group"
                    suppressHydrationWarning
                  >
                    <div className="flex items-center gap-3.5 min-w-0" suppressHydrationWarning>
                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm sm:text-base text-foreground leading-tight">
                            {item.title}
                          </h3>
                          {item.badge && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Guaranteed bottom clearance spacer so settings items never clip behind BottomNav */}
        <div className="h-24 sm:h-28 shrink-0 pointer-events-none" aria-hidden="true" />
      </div>
    </div>
  );
}
