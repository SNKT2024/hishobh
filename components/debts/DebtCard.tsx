"use client";

import { useState } from "react";
import { Debt } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  History,
  IndianRupee,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DebtCardProps {
  debt: Debt;
  currency?: string;
  onOpenRecordPayment: (debt: Debt) => void;
  onDeleteDebt: (id: string) => void;
}

export function DebtCard({
  debt,
  currency = "INR",
  onOpenRecordPayment,
  onDeleteDebt,
}: DebtCardProps) {
  const [showHistory, setShowHistory] = useState(false);

  const total = Number(debt.total_amount);
  const settled = Number(debt.settled_amount);
  const remaining = Math.max(0, total - settled);
  const percentSettled = total > 0 ? Math.min(100, Math.round((settled / total) * 100)) : 100;

  // Check if overdue
  const isOverdue =
    debt.due_date &&
    debt.status !== "settled" &&
    new Date(debt.due_date).getTime() < Date.now();

  const getInitials = (name?: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getStatusBadge = () => {
    if (debt.status === "settled") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
          <CheckCircle2 className="h-3 w-3" />
          Fully Settled
        </span>
      );
    }
    if (debt.status === "partially_settled") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20">
          <Clock className="h-3 w-3" />
          {percentSettled}% Repaid
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
        <Clock className="h-3 w-3" />
        Pending
      </span>
    );
  };

  return (
    <div className="flex flex-col p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-border transition-all">
      {/* Header: Person & Status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-2xl bg-secondary text-secondary-foreground font-bold flex items-center justify-center shrink-0 border border-border shadow-xs text-sm">
            {getInitials(debt.person?.name)}
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-sm sm:text-base text-foreground truncate">
              {debt.person?.name || "Counterparty"}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
              <span className="px-1.5 py-0.5 rounded-md bg-secondary text-[10px] font-medium border border-border/50">
                {debt.person?.relationship || "Other"}
              </span>
              <span>&bull;</span>
              <span>{formatDate(debt.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {getStatusBadge()}
          <button
            onClick={() => onDeleteDebt(debt.id)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors ml-1"
            title="Delete record"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Description if present */}
      {debt.description && (
        <p className="text-xs text-muted-foreground mb-3 bg-secondary/40 p-2.5 rounded-xl border border-border/40">
          {debt.description}
        </p>
      )}

      {/* Financial Numbers: Remaining vs Principal */}
      <div className="grid grid-cols-2 gap-2 my-2 p-3 rounded-xl bg-secondary/50 border border-border/50">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
            {debt.type === "lend" ? "Remaining to Collect" : "Remaining to Pay"}
          </span>
          <span
            className={cn(
              "text-lg sm:text-xl font-black tracking-tight block mt-0.5",
              debt.status === "settled"
                ? "text-muted-foreground line-through"
                : debt.type === "lend"
                ? "text-emerald-500"
                : "text-amber-500"
            )}
          >
            {formatCurrency(remaining, currency)}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Original Principal
          </span>
          <span className="text-sm sm:text-base font-bold text-foreground block mt-0.5">
            {formatCurrency(total, currency)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1 my-2">
        <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
          <span>Settled: {formatCurrency(settled, currency)}</span>
          <span>{percentSettled}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              debt.status === "settled"
                ? "bg-emerald-500"
                : debt.type === "lend"
                ? "bg-primary"
                : "bg-amber-500"
            )}
            style={{ width: `${percentSettled}%` }}
          />
        </div>
      </div>

      {/* Due Date Indicator & Action Button */}
      <div className="flex items-center justify-between pt-2 mt-1 border-t border-border/40 flex-wrap gap-2">
        {/* Due date tag */}
        {debt.due_date ? (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isOverdue
                ? "text-rose-500 font-bold"
                : "text-muted-foreground"
            )}
          >
            {isOverdue ? (
              <AlertCircle className="h-3.5 w-3.5" />
            ) : (
              <Calendar className="h-3.5 w-3.5" />
            )}
            <span>
              {isOverdue ? "Overdue: " : "Due: "}
              {formatDate(debt.due_date)}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground">No due date set</span>
        )}

        <div className="flex items-center gap-2">
          {/* Settlement history toggle */}
          {debt.settlements && debt.settlements.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-secondary"
            >
              <History className="h-3.5 w-3.5" />
              <span>{debt.settlements.length}</span>
              {showHistory ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          )}

          {/* Record Payment Button */}
          {debt.status !== "settled" && (
            <button
              onClick={() => onOpenRecordPayment(debt)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-transform active:scale-95"
            >
              <IndianRupee className="h-3.5 w-3.5" />
              Record Payment
            </button>
          )}
        </div>
      </div>

      {/* Expandable Settlements History */}
      {showHistory && debt.settlements && debt.settlements.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            Payment History
          </span>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {debt.settlements.map((set) => (
              <div
                key={set.id}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-secondary/60 border border-border/40"
              >
                <div>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(Number(set.amount), currency)}
                  </span>
                  {set.notes && (
                    <span className="text-muted-foreground ml-1.5">
                      &bull; {set.notes}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {formatDate(set.settlement_date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
