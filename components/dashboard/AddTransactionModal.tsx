"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Account, CreateTransactionDTO, TransactionType } from "@/types";
import { ArrowDownLeft, ArrowUpRight, DollarSign, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onAddTransaction: (dto: CreateTransactionDTO) => Promise<void>;
}

export function AddTransactionModal({
  isOpen,
  onClose,
  accounts,
  onAddTransaction,
}: AddTransactionModalProps) {
  const [type, setType] = useState<TransactionType>("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [category, setCategory] = useState("General");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a title or description");
      return;
    }

    const targetAccount = accountId || accounts[0]?.id;
    if (!targetAccount) {
      setError("No valid account found");
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddTransaction({
        account_id: targetAccount,
        title: title.trim(),
        amount: parsedAmount,
        type,
        category: category || "General",
        date: new Date().toISOString(),
      });

      // Reset & close
      setTitle("");
      setAmount("");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to add transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">New Transaction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Type Toggle: Income vs Expense */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-secondary rounded-xl">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all",
                type === "expense"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ArrowUpRight className="h-4 w-4" />
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all",
                type === "income"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ArrowDownLeft className="h-4 w-4" />
              Income
            </button>
          </div>

          {/* Amount Input */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <DollarSign className="h-5 w-5" />
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 text-xl font-bold rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Title / Description
            </label>
            <input
              type="text"
              placeholder="e.g. Grocery Store, Client Payment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Account Selector */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Account
            </label>
            <select
              value={accountId || accounts[0]?.id || ""}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type})
                </option>
              ))}
            </select>
          </div>

          {/* Category Quick Selector */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="General">General</option>
              <option value="Food & Dining">Food & Dining</option>
              <option value="Groceries">Groceries</option>
              <option value="Salary">Salary</option>
              <option value="Freelance">Freelance</option>
              <option value="Utilities">Utilities</option>
              <option value="Shopping">Shopping</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Transport">Transport</option>
              <option value="Healthcare">Healthcare</option>
            </select>
          </div>

          {error && (
            <p className="text-xs text-rose-500 font-medium">{error}</p>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
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
              className={cn(
                "min-w-[100px]",
                type === "expense"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save Transaction"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
