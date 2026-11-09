import { currentUser } from "@clerk/nextjs/server";
import {
  ChevronRight,
  CreditCard,
  HandCoins,
  Shield,
  User,
  Users,
} from "lucide-react";

export default async function SettingsPage() {
  const user = await currentUser();

  const settingsSections = [
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
          href: "/dashboard",
        },
        {
          title: "Lend & Borrow Ledger",
          description: "Isolated debts and settlement history",
          icon: HandCoins,
          href: "/dashboard",
          badge: "Phase 3",
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
    <div className="max-w-2xl mx-auto w-full space-y-6 pb-20 pt-2">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure counterparties, account types, and application preferences
        </p>
      </div>

      <div className="space-y-6">
        {settingsSections.map((section) => (
          <div key={section.title} className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
              {section.title}
            </h2>
            <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm divide-y divide-border/60">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.title}
                    href={item.href}
                    className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
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
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
