"use client";

import { useMemo, useState, useTransition } from "react";
import { Account, AccountType, CreateAccountDTO } from "@/types";
import { BrandLogo } from "./BrandLogo";
import { AccountModal } from "./AccountModal";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  createAccountAction,
  deleteAccountAction,
  updateAccountAction,
} from "@/lib/actions/accounts";
import {
  Banknote,
  Building2,
  CreditCard,
  Edit2,
  Loader2,
  Plus,
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
  currency = "USD",
}: AccountsClientProps) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      });

      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === id
            ? {
                ...acc,
                name: data.name,
                type: data.type,
                institution_name: data.institution_name,
                color: data.color,
                mask_last4: data.mask_last4,
                initial_balance: data.initial_balance,
              }
            : acc
        )
      );
    } else {
      const res = await createAccountAction(data);
      if (res.account) {
        setAccounts((prev) => [...prev, res.account]);
      }
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
      } catch (err) {
        console.error("Failed to delete account:", err);
      } finally {
        setDeletingId(null);
      }
    });
  };

  return (
    <div className="w-full flex flex-col space-y-6 pb-28 pt-2">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            Accounts
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage your banks, cards, wallets, and cash reserves
          </p>
        </div>

        <Button
          onClick={() => {
            setAccountToEdit(null);
            setIsModalOpen(true);
          }}
          size="sm"
          className="gap-1.5 shadow-sm text-xs font-semibold rounded-xl"
        >
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </div>

      {/* Top Summary: Total Net Balance Across Accounts */}
      <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white shadow-lg border border-indigo-900/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 rounded-full bg-violet-600/10 blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
            Total Net Balance
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 font-medium">
            {accounts.length} Accounts Active
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            {formatCurrency(netBalance, currency)}
          </span>
        </div>
      </div>

      {/* Grouped Account Sections */}
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
                      className="group relative flex flex-col justify-between p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-border transition-all overflow-hidden"
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
                            <h4 className="font-semibold text-sm sm:text-base text-foreground truncate leading-snug">
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

                        {/* Actions: Edit & Delete */}
                        <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
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
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                          Current Balance
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
    </div>
  );
}
