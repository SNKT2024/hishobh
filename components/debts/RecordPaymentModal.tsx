"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreateDebtSettlementDTO, Debt } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle2, DollarSign, Loader2 } from "lucide-react";

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt | null;
  currency?: string;
  onRecordPayment: (dto: CreateDebtSettlementDTO) => Promise<void>;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  debt,
  currency = "USD",
  onRecordPayment,
}: RecordPaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = debt
    ? Math.max(0, Number(debt.total_amount) - Number(debt.settled_amount))
    : 0;

  useEffect(() => {
    if (debt) {
      const rem = Math.max(
        0,
        Number(debt.total_amount) - Number(debt.settled_amount)
      );
      setAmount(rem > 0 ? String(rem) : "");
      setNotes("");
    }
    setError(null);
  }, [debt, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debt) return;
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    try {
      setIsSubmitting(true);
      await onRecordPayment({
        debt_id: debt.id,
        amount: parsedAmount,
        notes: notes.trim() || undefined,
        settlement_date: new Date().toISOString(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!debt) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            Record Payment
          </DialogTitle>
        </DialogHeader>

        {/* Counterparty & Remaining info banner */}
        <div className="p-3.5 rounded-2xl bg-secondary/80 border border-border/70 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground block">
              {debt.type === "lend" ? "Recovering from" : "Paying to"}
            </span>
            <span className="font-bold text-sm text-foreground">
              {debt.person?.name || "Counterparty"}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
              Remaining Due
            </span>
            <span className="font-extrabold text-sm sm:text-base text-foreground">
              {formatCurrency(remaining, currency)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Amount input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Payment Amount *
              </label>
              <button
                type="button"
                onClick={() => setAmount(String(remaining))}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Full Remaining ({formatCurrency(remaining, currency)})
              </button>
            </div>

            <div className="relative">
              <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-input bg-background text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              />
            </div>
          </div>

          {/* Payment Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Payment Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Bank transfer, Cash, Venmo"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-500 font-medium">{error}</p>
          )}

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-border/50">
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
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 font-semibold"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirm Payment"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
