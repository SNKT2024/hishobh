"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Account, ReconcileAccountBalanceDTO } from "@/types";
import { reconcileAccountBalanceAction } from "@/lib/actions/accounts";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  HelpCircle,
  IndianRupee,
  Loader2,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReconcileBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account;
  onReconciled?: () => void;
  currency?: string;
}

export function ReconcileBalanceModal({
  isOpen,
  onClose,
  account,
  onReconciled,
  currency = "INR",
}: ReconcileBalanceModalProps) {
  const currentBalance = Number(account.balance ?? 0);
  const [targetBalance, setTargetBalance] = useState("");
  const [notes, setNotes] = useState("Balance Reconciliation Adjustment");
  const [reconciliationDate, setReconciliationDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTargetBalance(String(currentBalance));
      setNotes("Balance Reconciliation Adjustment");
      setReconciliationDate(new Date().toISOString().slice(0, 10));
      setError(null);
    }
  }, [isOpen, currentBalance]);

  const parsedTarget = parseFloat(targetBalance);
  const validTarget = isNaN(parsedTarget) ? currentBalance : parsedTarget;
  const difference = Math.round((validTarget - currentBalance) * 100) / 100;
  const isAdjustmentNeeded = Math.abs(difference) >= 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isNaN(parsedTarget)) {
      setError("Please enter a valid target balance number");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await reconcileAccountBalanceAction({
        account_id: account.id,
        target_balance: parsedTarget,
        reconciliation_date: new Date(reconciliationDate).toISOString(),
        notes: notes.trim(),
      });

      if (res?.success) {
        if (onReconciled) {
          onReconciled();
        }
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to reconcile balance");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Scale className="h-4 w-4" />
            </div>
            Adjust & Reconcile Balance
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Current Tracked vs Real-world Comparison */}
          <div className="p-3.5 rounded-2xl bg-secondary/60 border border-border/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Account</span>
              <span className="font-semibold text-foreground">
                {account.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Current App Balance
              </span>
              <span className="text-base font-bold text-foreground">
                {formatCurrency(currentBalance, currency)}
              </span>
            </div>
          </div>

          {/* Target Balance Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Actual Real-World Balance *
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={targetBalance}
                onChange={(e) => setTargetBalance(e.target.value)}
                autoFocus
                required
                className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-input bg-background text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary shadow-sm text-foreground"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Enter what your bank account statement or cash wallet physically holds right now.
            </p>
          </div>

          {/* Live Adjustment Calculation Result */}
          <div
            className={cn(
              "p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-colors",
              !isAdjustmentNeeded
                ? "bg-secondary/40 border-border/70 text-muted-foreground"
                : difference > 0
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
            )}
          >
            {!isAdjustmentNeeded ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Already in sync</p>
                  <p className="text-[11px] text-muted-foreground">
                    Target matches current tracked balance. No adjustment transaction is needed.
                  </p>
                </div>
              </>
            ) : difference > 0 ? (
              <>
                <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    + {formatCurrency(difference, currency)} (Income Adjustment)
                  </p>
                  <p className="text-[11px] opacity-90">
                    An income transaction will be recorded to bring your balance up to your real-world figure.
                  </p>
                </div>
              </>
            ) : (
              <>
                <ArrowUpRight className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    - {formatCurrency(Math.abs(difference), currency)} (Expense Adjustment)
                  </p>
                  <p className="text-[11px] opacity-90">
                    An expense transaction will be recorded to bring your balance down to your real-world figure.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Date of Reconciliation */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Reconciliation Date
            </label>
            <input
              type="date"
              value={reconciliationDate}
              onChange={(e) => setReconciliationDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm text-foreground"
            />
          </div>

          {/* Notes / Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description / Reason
            </label>
            <input
              type="text"
              placeholder="e.g. Notebook backfill cleanup, Statement sync"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm text-foreground"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-500 font-medium">{error}</p>
          )}

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/50">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isAdjustmentNeeded}
              className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[120px]"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Apply Adjustment"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
