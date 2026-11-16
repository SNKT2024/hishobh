"use client";

import { AccountUsageAnalytics } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WalletCards, Landmark, CreditCard, Banknote, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface AccountDistributionCardProps {
  accounts: AccountUsageAnalytics[];
  totalSpent: number;
}

function getAccountTypeIcon(type: string) {
  switch (type) {
    case "card":
      return CreditCard;
    case "cash":
      return Banknote;
    case "wallet":
      return Wallet;
    case "bank":
    default:
      return Landmark;
  }
}

export function AccountDistributionCard({
  accounts,
  totalSpent,
}: AccountDistributionCardProps) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <WalletCards className="h-4 w-4 text-primary" />
              Account Distribution
            </CardTitle>
            <CardDescription className="text-xs">
              Spending breakdown across payment methods and cards
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[11px] font-semibold">
            {accounts.length} {accounts.length === 1 ? "Account" : "Accounts"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {accounts.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No expense account usage in this timeframe.
          </div>
        ) : (
          <div className="space-y-3.5">
            {accounts.map((acc) => {
              const Icon = getAccountTypeIcon(acc.type);

              return (
                <div key={acc.account_id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="h-8 w-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: acc.color || "#7E30E1" }}
                      >
                        {acc.logo_url ? (
                          <img
                            src={acc.logo_url}
                            alt={acc.name}
                            className="h-5 w-5 object-contain"
                          />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0 pr-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground truncate">
                            {acc.name}
                          </span>
                          {acc.institution_name && (
                            <span className="text-[11px] text-muted-foreground hidden sm:inline shrink-0">
                              • {acc.institution_name}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground capitalize block truncate">
                          {acc.type} • {acc.transaction_count}{" "}
                          {acc.transaction_count === 1 ? "expense" : "expenses"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-foreground">
                        {formatCurrency(acc.total_spent)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2 font-medium">
                        {acc.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="h-2 w-full bg-muted/80 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${acc.percentage}%`,
                        backgroundColor: acc.color || "#6366f1",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

