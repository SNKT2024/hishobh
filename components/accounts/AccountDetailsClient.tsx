"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Account,
  CreateAccountDTO,
  CreateTransactionDTO,
  Person,
  Transaction,
  UpdateTransactionDTO,
} from "@/types";
import { BrandLogo } from "./BrandLogo";
import { AccountModal } from "./AccountModal";
import { ReconcileBalanceModal } from "./ReconcileBalanceModal";
import { AddTransactionModal } from "@/components/dashboard/AddTransactionModal";
import { TransactionItem } from "@/components/dashboard/TransactionItem";
import { TransactionDetailSheet } from "@/components/dashboard/TransactionDetailSheet";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  updateAccountAction,
  getAccountByIdAction,
  getAccountTransactionsAction,
} from "@/lib/actions/accounts";
import {
  createTransactionAction,
  deleteTransactionAction,
  updateTransactionAction,
} from "@/lib/actions/dashboard";
import { toast } from "sonner";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Clock,
  Edit2,
  Filter,
  History,
  IndianRupee,
  Plus,
  Scale,
  Search,
  Tag,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountDetailsClientProps {
  account: Account;
  initialTransactions: Transaction[];
  people?: Person[];
  currency?: string;
}

export function AccountDetailsClient({
  account: initialAccount,
  initialTransactions,
  people = [],
  currency = "INR",
}: AccountDetailsClientProps) {
  const router = useRouter();
  const [account, setAccount] = useState<Account>(initialAccount);
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);

  const [isReconcileOpen, setIsReconcileOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);

  // Sheet state
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetInitialEditMode, setSheetInitialEditMode] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">(
    "all"
  );
  const [isPending, startTransition] = useTransition();

  const openingDate = useMemo(() => {
    return account.opening_balance_date
      ? new Date(account.opening_balance_date)
      : null;
  }, [account.opening_balance_date]);

  // Refresh account and transaction data
  const refreshData = async () => {
    startTransition(async () => {
      try {
        const [updatedAcc, updatedTxs] = await Promise.all([
          getAccountByIdAction(account.id),
          getAccountTransactionsAction(account.id),
        ]);
        if (updatedAcc) setAccount(updatedAcc);
        if (updatedTxs) setTransactions(updatedTxs);
      } catch (err) {
        console.error("Failed to refresh account details:", err);
      }
    });
  };

  const handleSaveAccount = async (data: CreateAccountDTO) => {
    await updateAccountAction({
      id: account.id,
      name: data.name,
      type: data.type,
      institution_name: data.institution_name,
      color: data.color,
      mask_last4: data.mask_last4,
      initial_balance: data.initial_balance,
      opening_balance: data.opening_balance,
      opening_balance_date: data.opening_balance_date,
    });
    await refreshData();
  };

  const handleAddTransaction = async (dto: CreateTransactionDTO) => {
    await createTransactionAction(dto);
    await refreshData();
  };

  const handleUpdateTransaction = async (dto: UpdateTransactionDTO) => {
    try {
      await updateTransactionAction(dto);
      await refreshData();
      toast.success("Transaction updated successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update transaction");
      throw err;
    }
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    const previousTransactions = transactions;
    setTransactions((prev) => prev.filter((t) => t.id !== transaction.id));

    let isUndone = false;

    toast("Transaction deleted", {
      description: `"${transaction.title}" (${formatCurrency(
        transaction.amount,
        currency
      )}) removed.`,
      duration: 5000,
      action: {
        label: "Undo",
        onClick: async () => {
          isUndone = true;
          setTransactions((prev) =>
            [transaction, ...prev].sort(
              (a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            )
          );

          try {
            await createTransactionAction({
              account_id: transaction.account_id,
              person_id: transaction.person_id || null,
              title: transaction.title,
              amount: transaction.amount,
              type: transaction.type,
              category: transaction.category || "General",
              date: transaction.date,
            });
            await refreshData();
            toast.success("Transaction restored");
          } catch (err) {
            console.error("Failed to restore transaction:", err);
            toast.error("Failed to restore transaction");
          }
        },
      },
    });

    try {
      await deleteTransactionAction(transaction.id);
      if (!isUndone) {
        await refreshData();
      }
    } catch (err) {
      if (!isUndone) {
        setTransactions(previousTransactions);
        toast.error("Failed to delete transaction");
      }
    }
  };

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

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesType = typeFilter === "all" || t.type === typeFilter;
      const matchesSearch =
        searchQuery === "" ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.category &&
          t.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.person?.name &&
          t.person.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesType && matchesSearch;
    });
  }, [transactions, typeFilter, searchQuery]);

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col overflow-y-auto space-y-6 pb-24 sm:pb-28 pt-2 pr-1">
      {/* Top Navigation & Action Header */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 pr-1">
          <Link
            href="/accounts"
            className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandLogo
              type={account.type}
              institutionName={account.institution_name}
              name={account.name}
              size="md"
            />
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2 truncate">
                {account.name}
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                <span className="truncate">
                  {account.institution_name || account.type.toUpperCase()}
                </span>
                {account.mask_last4 && (
                  <>
                    <span>&bull;</span>
                    <span className="font-mono tracking-widest text-[11px] shrink-0">
                      •••• {account.mask_last4}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            onClick={() => setIsReconcileOpen(true)}
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs font-semibold rounded-xl border-primary/40 text-primary hover:bg-primary/10 shadow-xs"
          >
            <Scale className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Adjust / </span>Reconcile
          </Button>
          <Button
            onClick={() => setIsEditModalOpen(true)}
            size="sm"
            variant="ghost"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground shrink-0"
            title="Edit Account Details"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Account Balance Card */}
      <div className="rounded-3xl p-6 bg-card border border-border shadow-sm text-foreground relative overflow-hidden">
        {account.color && (
          <div
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{ backgroundColor: account.color }}
          />
        )}

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Current Running Balance
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium uppercase tracking-wider">
            {account.type}
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-4">
          <span
            className={cn(
              "text-3xl sm:text-4xl font-black tracking-tight",
              (account.balance ?? 0) >= 0 ? "text-foreground" : "text-rose-500"
            )}
          >
            {formatCurrency(account.balance ?? 0, currency)}
          </span>
        </div>

        {/* Opening Balance Anchor Subtext */}
        <div className="pt-3 border-t border-border/50 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-muted-foreground block">
              Opening Anchor Balance
            </span>
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <span>
                {formatCurrency(
                  account.opening_balance ?? account.initial_balance ?? 0,
                  currency
                )}
              </span>
              {openingDate && (
                <span className="text-[11px] font-normal text-muted-foreground">
                  (as of{" "}
                  {openingDate.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  )
                </span>
              )}
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-muted-foreground block">
              Total Inflow Recorded
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(account.total_income ?? 0, currency)}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-muted-foreground block">
              Total Outflow Recorded
            </span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              -{formatCurrency(account.total_expense ?? 0, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Account Ledger
            </h2>
            <p className="text-xs text-muted-foreground">
              {transactions.length} total entries &bull; Swipe left to delete, right to edit
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Type Filter */}
            <div className="flex items-center p-1 bg-secondary rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTypeFilter("all")}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-all",
                  typeFilter === "all"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("income")}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-all",
                  typeFilter === "income"
                    ? "bg-emerald-500 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                In
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("expense")}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-all",
                  typeFilter === "expense"
                    ? "bg-rose-500 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Out
              </button>
            </div>

            <Button
              onClick={() => setIsAddTxOpen(true)}
              size="sm"
              className="gap-1.5 text-xs font-semibold rounded-xl shadow-xs"
            >
              <Plus className="h-4 w-4" />
              Add Entry
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search account transactions by title, category, or person..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-input bg-card text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
          />
        </div>

        {/* Ledger Transaction List with Swipe and Click Sheet */}
        {filteredTransactions.length === 0 ? (
          <div className="w-full rounded-2xl p-8 border border-dashed border-border bg-card/60 text-center flex flex-col items-center justify-center shadow-xs">
            <History className="h-8 w-8 text-muted-foreground/60 mb-2" />
            <h4 className="font-semibold text-sm text-foreground">
              No transactions found
            </h4>
            <p className="text-xs text-muted-foreground max-w-xs mt-1 mb-4">
              {searchQuery
                ? "No entries match your search query."
                : "No transactions have been recorded for this account yet."}
            </p>
            <Button
              onClick={() => setIsAddTxOpen(true)}
              size="sm"
              className="gap-1.5 text-xs rounded-xl"
            >
              <Plus className="h-4 w-4" />
              Record First Entry
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                currency={currency}
                onClick={handleCardClick}
                onEdit={handleEditRequest}
                onDelete={handleDeleteTransaction}
              />
            ))}
          </div>
        )}

        {/* Guaranteed bottom clearance spacer so entries never clip behind BottomNav */}
        <div className="h-24 sm:h-28 shrink-0 pointer-events-none" aria-hidden="true" />
      </div>

      {/* Reconcile Balance Modal */}
      <ReconcileBalanceModal
        isOpen={isReconcileOpen}
        onClose={() => setIsReconcileOpen(false)}
        account={account}
        onReconciled={refreshData}
        currency={currency}
      />

      {/* Edit Account Modal */}
      <AccountModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        accountToEdit={account}
        onSave={handleSaveAccount}
      />

      {/* Add Transaction Modal with this account preselected */}
      <AddTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        accounts={[account]}
        people={people}
        onAddTransaction={handleAddTransaction}
      />

      {/* Transaction Details & Edit Sheet */}
      {selectedTransaction && (
        <TransactionDetailSheet
          isOpen={isSheetOpen}
          onClose={() => {
            setIsSheetOpen(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
          accounts={[account]}
          people={people}
          currency={currency}
          initialEditMode={sheetInitialEditMode}
          onUpdate={handleUpdateTransaction}
          onDelete={handleDeleteTransaction}
        />
      )}

      {/* Bottom Navigation Dock */}
      <BottomNav
        activeTab="accounts"
        onOpenAddModal={() => setIsAddTxOpen(true)}
      />
    </div>
  );
}