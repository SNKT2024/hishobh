"use client";

import { Transaction } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Repeat,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionItemProps {
  transaction: Transaction;
  currency?: string;
  onDelete?: (id: string) => void;
}

export function TransactionItem({
  transaction,
  currency = "USD",
  onDelete,
}: TransactionItemProps) {
  const isIncome = transaction.type === "income";
  const isExpense = transaction.type === "expense";

  const getIcon = () => {
    if (isIncome) {
      return (
        <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <ArrowDownLeft className="h-4 w-4" />
        </div>
      );
    }
    if (isExpense) {
      return (
        <div className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
          <ArrowUpRight className="h-4 w-4" />
        </div>
      );
    }
    return (
      <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Repeat className="h-4 w-4" />
      </div>
    );
  };

  const getAmountDisplay = () => {
    const formatted = formatCurrency(transaction.amount, currency);
    if (isIncome) return `+${formatted}`;
    if (isExpense) return `-${formatted}`;
    return formatted;
  };

  const formattedTime = new Date(transaction.date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-card border border-border/70 hover:border-border transition-all hover:shadow-sm">
      {/* Left side: Icon + Title + Account & Person subtext */}
      <div className="flex items-center gap-3 min-w-0">
        {getIcon()}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-semibold text-sm sm:text-base text-foreground truncate leading-snug">
              {transaction.title}
            </h4>
            {transaction.person && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-secondary/90 text-[10px] font-medium text-secondary-foreground border border-border/50 shrink-0">
                <User className="h-2.5 w-2.5 text-primary" />
                {transaction.person.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground truncate">
            <span>{transaction.account?.name || "Standard Account"}</span>
            {transaction.category && (
              <>
                <span>&bull;</span>
                <span className="capitalize">{transaction.category}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Amount + Date/Time */}
      <div className="text-right shrink-0 ml-3">
        <span
          className={cn(
            "font-bold text-sm sm:text-base block tracking-tight",
            isIncome && "text-emerald-500",
            isExpense && "text-rose-500",
            !isIncome && !isExpense && "text-foreground"
          )}
        >
          {getAmountDisplay()}
        </span>
        <span className="text-[11px] text-muted-foreground block mt-0.5">
          {formatDate(transaction.date)} &bull; {formattedTime}
        </span>
      </div>
    </div>
  );
}
