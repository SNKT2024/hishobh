"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  CreateTransactionDTO,
  DashboardData,
  TimeframeOption,
  Transaction,
  UpdateTransactionDTO,
} from "@/types";
import { TimeframeFilter } from "./TimeframeFilter";
import { OverviewCarousel } from "./OverviewCarousel";
import { TransactionList } from "./TransactionList";
import { BottomNav } from "./BottomNav";
import { AddTransactionModal } from "./AddTransactionModal";
import {
  createTransactionAction,
  deleteTransactionAction,
  getDashboardData,
  updateTransactionAction,
} from "@/lib/actions/dashboard";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { PwaInstallButton } from "@/components/shared/PwaInstallButton";

interface DashboardClientProps {
  initialData: DashboardData;
  userName?: string;
}

export function DashboardClient({
  initialData,
  userName = "there",
}: DashboardClientProps) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [timeframe, setTimeframe] = useState<TimeframeOption>(
    initialData.timeframe
  );
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    initialData.selectedAccountId
  );
  const [activeTab, setActiveTab] = useState<string>("home");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Handle Timeframe Change
  const handleTimeframeChange = (newTimeframe: TimeframeOption) => {
    setTimeframe(newTimeframe);
    startTransition(async () => {
      try {
        const freshData = await getDashboardData(newTimeframe, selectedAccountId);
        setData(freshData);
      } catch (err) {
        console.error("Failed to update timeframe data:", err);
      }
    });
  };

  // Handle Account Selection / Slide Change
  const handleSelectAccount = (accountId: string) => {
    setSelectedAccountId(accountId);
    startTransition(async () => {
      try {
        const freshData = await getDashboardData(timeframe, accountId);
        setData(freshData);
      } catch (err) {
        console.error("Failed to switch account filter:", err);
      }
    });
  };

  // Handle Add Transaction
  const handleAddTransaction = async (dto: CreateTransactionDTO) => {
    await createTransactionAction(dto);
    const freshData = await getDashboardData(timeframe, selectedAccountId);
    setData(freshData);
  };

  // Handle Update Transaction
  const handleUpdateTransaction = async (dto: UpdateTransactionDTO) => {
    try {
      await updateTransactionAction(dto);
      const freshData = await getDashboardData(timeframe, selectedAccountId);
      setData(freshData);
      toast.success("Transaction updated successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update transaction");
      throw err;
    }
  };

  // Handle Delete Transaction with Optimistic UI & 5-Second Undo Toast
  const handleDeleteTransaction = async (transaction: Transaction) => {
    // 1. Optimistic removal from active list
    const previousTransactions = data.transactions;
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== transaction.id),
    }));

    let isUndone = false;

    // 2. Trigger 5-Second Undo Notification
    toast("Transaction deleted", {
      description: `"${transaction.title}" (${formatCurrency(
        transaction.amount,
        "INR"
      )}) removed.`,
      duration: 5000,
      action: {
        label: "Undo",
        onClick: async () => {
          isUndone = true;
          // Optimistically restore in state
          setData((prev) => ({
            ...prev,
            transactions: [transaction, ...prev.transactions].sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            ),
          }));

          // Re-insert into database
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
            const freshData = await getDashboardData(
              timeframe,
              selectedAccountId
            );
            setData(freshData);
            toast.success("Transaction restored");
          } catch (err) {
            console.error("Failed to restore transaction:", err);
            toast.error("Failed to restore transaction");
          }
        },
      },
    });

    // 3. Execute delete after initiating optimistic update
    try {
      await deleteTransactionAction(transaction.id);
      // Refresh dashboard aggregations if not undone
      if (!isUndone) {
        const freshData = await getDashboardData(timeframe, selectedAccountId);
        setData(freshData);
      }
    } catch (err) {
      if (!isUndone) {
        // Rollback state if server action failed
        setData((prev) => ({
          ...prev,
          transactions: previousTransactions,
        }));
        toast.error("Failed to delete transaction");
      }
    }
  };

  const selectedAccountName =
    selectedAccountId === "all"
      ? "All Accounts"
      : data.accounts.find((a) => a.id === selectedAccountId)?.name ||
      "Selected Account";

  return (
    <div className="relative flex flex-col h-full flex-1 min-h-0 overflow-hidden pt-1">
      {/* Top Bar: Home title + Global Timeframe Dropdown */}
      <div className="shrink-0 flex items-center justify-between mb-2 px-1 gap-2">
        <div className="min-w-0 pr-1 flex items-center gap-2">
          <Image
            src="/icons/apple-icon.png"
            alt="Hishobh"
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg object-contain shadow-xs shrink-0 sm:hidden"
            priority
          />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground truncate">
              Home
            </h1>
            <p className="text-[11px] text-muted-foreground font-medium truncate">
              {isPending ? (
                <span className="inline-flex items-center gap-1 text-primary">
                  <Loader2 className="h-3 w-3 animate-spin" /> Updating...
                </span>
              ) : (
                `Hello, ${userName}`
              )}
            </p>
          </div>
        </div>

        {/* Top Right Controls: PWA Install + Quick Theme Toggle + Global Timeframe Dropdown */}
        <div className="flex items-center gap-1.5 shrink-0">
          <PwaInstallButton variant="header" className="sm:hidden" />
          <ThemeToggle variant="icon" />
          <TimeframeFilter
            value={timeframe}
            onChange={handleTimeframeChange}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Slideable Account Overview Section (Horizontal Carousel) */}
      <section className="shrink-0 mb-2">
        <OverviewCarousel
          metrics={data.metrics}
          accounts={data.accounts}
          selectedAccountId={selectedAccountId}
          onSelectAccount={handleSelectAccount}
        />
      </section>

      {/* Recent Transactions Section (Independent Scrollable Subwindow) */}
      <section className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <TransactionList
          transactions={data.transactions}
          accounts={data.accounts}
          people={data.people || []}
          selectedAccountName={selectedAccountName}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onUpdateTransaction={handleUpdateTransaction}
          onDeleteTransaction={handleDeleteTransaction}
        />
      </section>

      {/* Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Add Transaction Dialog */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        accounts={data.accounts}
        people={data.people || []}
        onAddTransaction={handleAddTransaction}
      />
    </div>
  );
}