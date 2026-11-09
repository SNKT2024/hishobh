"use client";

import { Transaction } from "@/types";
import { TransactionItem } from "./TransactionItem";
import { ReceiptText, Sparkles } from "lucide-react";

interface TransactionListProps {
  transactions: Transaction[];
  selectedAccountName?: string;
  currency?: string;
  onOpenAddModal?: () => void;
}

export function TransactionList({
  transactions,
  selectedAccountName = "All Accounts",
  currency = "USD",
  onOpenAddModal,
}: TransactionListProps) {
  return (
    <div className="w-full flex flex-col space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
            Transactions
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
            {transactions.length}
          </span>
        </div>

        <span className="text-xs font-medium text-muted-foreground">
          {selectedAccountName}
        </span>
      </div>

      {/* Scrollable List Container */}
      <div className="flex flex-col space-y-2.5 overflow-y-auto max-h-[460px] no-scrollbar pr-0.5">
        {transactions.length > 0 ? (
          transactions.map((tx) => (
            <TransactionItem
              key={tx.id}
              transaction={tx}
              currency={currency}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-8 sm:p-12 rounded-3xl border border-dashed border-border text-center bg-card/40 my-2">
            <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
              <ReceiptText className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-foreground text-sm sm:text-base">
              No transactions recorded
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              There are no transactions for this account in the selected timeframe.
            </p>
            {onOpenAddModal && (
              <button
                onClick={onOpenAddModal}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Add your first transaction
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
