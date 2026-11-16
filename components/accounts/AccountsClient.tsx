"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Account, AccountType, CreateAccountDTO } from "@/types";
import { BrandLogo } from "./BrandLogo";
import { AccountModal } from "./AccountModal";
import { ReconcileBalanceModal } from "./ReconcileBalanceModal";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  createAccountAction,
  deleteAccountAction,
  getAccountsAction,
  updateAccountAction,
} from "@/lib/actions/accounts";
import {
  Banknote,
  Building2,
  ChevronRight,
  CreditCard,
  Edit2,
  Loader2,
  Plus,
  Scale,
  Trash2,
  Wallet,
  WalletCards,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountsClientProps {
  initialAccounts: Account[];
  currency?: string;
}

export function AccountsClient({
  initialAccounts,
  currency = "INR",
}: AccountsClientProps) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  const [reconcilingAccount, setReconcilingAccount] = useState<Account | null>(
    null
  );
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Refresh accounts
  const refreshAccounts = async () => {
    startTransition(async () => {
      try {
        const fresh = await getAccountsAction();
        setAccounts(fresh);
      } catch (err) {
        console.error("Failed to refresh accounts:", err);
      }
    });
  };

  // Calculate Net Worth / Total Balance across all accounts
  const netBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + (acc.balance ?? 0), 0);
  }, [accounts]);

  // Group accounts by type
  const groupedAccounts = useMemo(() => {
    const banks = accounts.filter((a) => a.type === "bank");
    const cards = accounts.filter((a) => a.type === "card");
    const wallets = accounts.filter((a) => a.type === "wallet");
    const cash = accounts.filter((a) => a.type === "cash");

    return [
      {
        type: "bank" as AccountType,
        title: "Bank Accounts",
        icon: Building2,
        items: banks,
      },
      {
        type: "card" as AccountType,
        title: "Credit & Debit Cards",
        icon: CreditCard,
        items: cards,
      },
      {
        type: "wallet" as AccountType,
        title: "Digital Wallets",
        icon: WalletCards,
        items: wallets,
      },
      {
        type: "cash" as AccountType,
        title: "Cash Holdings",
        icon: Banknote,
        items: cash,
      },
    ];
  }, [accounts]);

  // Handle Save (Create or Update)
  const handleSaveAccount = async (data: CreateAccountDTO, id?: string) => {
    if (id) {
      await updateAccountAction({
        id,
        name: data.name,
        type: data.type,
        institution_name: data.institution_name,
        color: data.color,
        mask_last4: data.mask_last4,
        initial_balance: data.initial_balance,
        opening_balance: data.opening_balance,
        opening_balance_date: data.opening_balance_date,
      });
      await refreshAccounts();
    } else {
      const res = await createAccountAction(data);
      if (res.account) {
        setAccounts((prev) => [...prev, res.account]);
      }
      await refreshAccounts();
    }
  };

  // Handle Delete
  const handleDeleteAccount = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this account? Any associated transactions will also be removed."
      )
    ) {
      return;
    }

    setDeletingId(id);
    startTransition(async () => {
      try {
        await deleteAccountAction(id);
        setAccounts((prev) => prev.filter((a) => a.id !== id));
        await refreshAccounts();
      } catch (err: any) {
        console.error("Failed to delete account:", err);
        alert(err?.message || "Failed to delete account");
      } finally {
        setDeletingId(null);
      }
    });
  };

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col overflow-y-auto overscroll-y-contain touch-pan-y space-y-6 pb-28 sm:pb-32 pt-2 pr-1 no-scrollbar">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="min-w-0 pr-1">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground truncate">
            Accounts
          </h1>
          <p className="text-xs text-muted-foreground truncate">
            Manage your banks, cards, wallets, and cash reserves
          </p>
        </div>

        <Button
          onClick={() => {
            setAccountToEdit(null);
            setIsModalOpen(true);
          }}
          size="sm"
          className="gap-1.5 shadow-sm text-xs font-semibold rounded-xl shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </div>

      {/* Top Summary: Total Net Balance Across Accounts */}
      <div className="rounded-3xl p-6 bg-card border border-border shadow-sm text-foreground relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Net Balance
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
            {accounts.length} Accounts Active
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            {formatCurrency(netBalance, currency)}
          </span>
        </div>
      </div>

      {/* Grouped Account Sections / Empty State */}
      {accounts.length === 0 ? (
        <div className="w-full rounded-3xl p-8 sm:p-12 border border-dashed border-border bg-card/60 text-center flex flex-col items-center justify-center my-4 shadow-xs">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <WalletCards className="h-7 w-7" />
          </div>
          <h3 className="font-bold text-lg text-foreground">
            No accounts found
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-5">
            You don&apos;t have any accounts set up yet. Add a bank account, credit card, digital wallet, or cash reserve to get started.
          </p>
          <Button
            onClick={() => {
              setAccountToEdit(null);
              setIsModalOpen(true);
            }}
            className="gap-1.5 shadow-sm text-xs font-semibold rounded-xl"
          >
            <Plus className="h-4 w-4" />
            Add Account
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedAccounts.map((group) => {
            if (group.items.length === 0) return null;
            const GroupIcon = group.icon;

            return (
              <div key={group.type} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <GroupIcon className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {group.title} ({group.items.length})
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {group.items.map((acc) => {
                    const isDeleting = deletingId === acc.id;

                    return (
                      <div
                        key={acc.id}
                        onClick={() => router.push(`/accounts/${acc.id}`)}
                        className="group relative flex flex-col justify-between p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-primary/50 cursor-pointer transition-all overflow-hidden"
                      >
                        {/* Brand Accent top line */}
                        {acc.color && (
                          <div
                            className="absolute top-0 left-0 right-0 h-1"
                            style={{ backgroundColor: acc.color }}
                          />
                        )}

                        {/* Header with Logo + Name + Masked last 4 digits */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <BrandLogo
                              type={acc.type}
                              institutionName={acc.institution_name}
                              name={acc.name}
                              size="md"
                            />
                            <div className="min-w-0">
                              <h4 className="font-semibold text-sm sm:text-base text-foreground truncate leading-snug group-hover:text-primary transition-colors">
                                {acc.name}
                              </h4>
                              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                                <span>{acc.institution_name || acc.type.toUpperCase()}</span>
                                {acc.mask_last4 && (
                                  <>
                                    <span>&bull;</span>
                                    <span className="font-mono tracking-widest text-[11px]">
                                      •••• {acc.mask_last4}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions: Reconcile, Edit, Delete */}
                          <div
                            className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => setReconcilingAccount(acc)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              title="Reconcile balance"
                            >
                              <Scale className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setAccountToEdit(acc);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                              title="Edit account"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAccount(acc.id)}
                              disabled={isDeleting}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                              title="Delete account"
                            >
                              {isDeleting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-500" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Balance Bottom Display */}
                        <div className="pt-2 border-t border-border/40 flex items-baseline justify-between">
                          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            Current Balance
                            <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                          </span>
                          <span
                            className={cn(
                              "text-base sm:text-lg font-bold tracking-tight",
                              (acc.balance ?? 0) >= 0
                                ? "text-foreground"
                                : "text-rose-500"
                            )}
                          >
                            {formatCurrency(acc.balance ?? 0, currency)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Guaranteed bottom clearance spacer so last accounts card is never obscured by BottomNav */}
      <div className="h-24 sm:h-28 shrink-0 pointer-events-none" aria-hidden="true" />

      {/* Add / Edit Account Modal */}
      <AccountModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setAccountToEdit(null);
        }}
        accountToEdit={accountToEdit}
        onSave={handleSaveAccount}
      />

      {/* Quick Reconcile Balance Modal */}
      {reconcilingAccount && (
        <ReconcileBalanceModal
          isOpen={Boolean(reconcilingAccount)}
          onClose={() => setReconcilingAccount(null)}
          account={reconcilingAccount}
          onReconciled={refreshAccounts}
          currency={currency}
        />
      )}

      {/* Bottom Navigation Dock */}
      <BottomNav
        activeTab="accounts"
        onOpenAddModal={() => {
          setAccountToEdit(null);
          setIsModalOpen(true);
        }}
      />
    </div>
  );
}