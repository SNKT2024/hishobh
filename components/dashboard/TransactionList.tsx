"use client";

import { useState } from "react";
import { Account, Person, Transaction, UpdateTransactionDTO } from "@/types";
import { TransactionItem } from "./TransactionItem";
import { TransactionDetailSheet } from "./TransactionDetailSheet";
import { ReceiptText, Sparkles } from "lucide-react";

interface TransactionListProps {
  transactions: Transaction[];
  accounts?: Account[];
  people?: Person[];
  selectedAccountName?: string;
  currency?: string;
  onOpenAddModal?: () => void;
  onUpdateTransaction?: (dto: UpdateTransactionDTO) => Promise<void>;
  onDeleteTransaction?: (transaction: Transaction) => void;
}

export function TransactionList({
  transactions,
  accounts = [],
  people = [],
  selectedAccountName = "All Accounts",
  currency = "INR",
  onOpenAddModal,
  onUpdateTransaction,
  onDeleteTransaction,
}: TransactionListProps) {
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetInitialEditMode, setSheetInitialEditMode] = useState(false);

  const handleCardClick = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setSheetInitialEditMode(false);
    setIsSheetOpen(true);
  };

  const handleEditRequest = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setSheetInitialEditMode(true);
    setIsSheetOpen(true);
  };

  const handleDeleteRequest = (tx: Transaction) => {
    if (onDeleteTransaction) {
      onDeleteTransaction(tx);
    }
  };

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-1 mb-2.5">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
            Transactions
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
            {transactions.length}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="hidden sm:inline text-[11px] opacity-75">
            Swipe left to delete, right to edit
          </span>
          <span>&bull;</span>
          <span className="font-medium">{selectedAccountName}</span>
        </div>
      </div>

      {/* Independent Scrollable Transaction List */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 pb-6 space-y-2 touch-pan-y scroll-smooth">
        {transactions.length > 0 ? (
          <>
            {transactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                currency={currency}
                onClick={handleCardClick}
                onEdit={handleEditRequest}
                onDelete={handleDeleteRequest}
              />
            ))}
            {/* Guaranteed bottom clearance spacer so last items are never hidden behind BottomNav */}
            <div className="h-24 sm:h-28 shrink-0 pointer-events-none" aria-hidden="true" />
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl border border-dashed border-border/80 text-center bg-card/40 my-1 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-2">
                <ReceiptText className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">
                No transactions recorded
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs mt-0.5">
                There are no transactions for this account in the selected timeframe.
              </p>
              {onOpenAddModal && (
                <button
                  onClick={onOpenAddModal}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Add your first transaction
                </button>
              )}
            </div>
            {/* Bottom clearance spacer for empty state */}
            <div className="h-20 sm:h-24 shrink-0 pointer-events-none" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Transaction Details & Edit Sheet */}
      {selectedTransaction && (
        <TransactionDetailSheet
          isOpen={isSheetOpen}
          onClose={() => {
            setIsSheetOpen(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
          accounts={accounts}
          people={people}
          currency={currency}
          initialEditMode={sheetInitialEditMode}
          onUpdate={async (dto) => {
            if (onUpdateTransaction) {
              await onUpdateTransaction(dto);
            }
          }}
          onDelete={(tx) => {
            handleDeleteRequest(tx);
          }}
        />
      )}
    </div>
  );
}