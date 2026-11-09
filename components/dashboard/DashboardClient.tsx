"use client";

import { useState, useTransition } from "react";
import {
  CreateTransactionDTO,
  DashboardData,
  TimeframeOption,
} from "@/types";
import { TimeframeFilter } from "./TimeframeFilter";
import { OverviewCarousel } from "./OverviewCarousel";
import { TransactionList } from "./TransactionList";
import { BottomNav } from "./BottomNav";
import { AddTransactionModal } from "./AddTransactionModal";
import {
  createTransactionAction,
  getDashboardData,
} from "@/lib/actions/dashboard";
import { Loader2, RefreshCw } from "lucide-react";

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

  const selectedAccountName =
    selectedAccountId === "all"
      ? "All Accounts"
      : data.accounts.find((a) => a.id === selectedAccountId)?.name ||
        "Selected Account";

  return (
    <div className="relative flex flex-col min-h-screen pb-28 pt-2">
      {/* Top Bar: Home title + Global Timeframe Dropdown */}
      <div className="flex items-center justify-between mb-5 px-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            Home
          </h1>
          <p className="text-xs text-muted-foreground">
            {isPending ? (
              <span className="inline-flex items-center gap-1 text-primary">
                <Loader2 className="h-3 w-3 animate-spin" /> Updating...
              </span>
            ) : (
              `Hello, ${userName}`
            )}
          </p>
        </div>

        {/* Global Timeframe Filter (Top Right Dropdown) */}
        <TimeframeFilter
          value={timeframe}
          onChange={handleTimeframeChange}
          disabled={isPending}
        />
      </div>

      {/* Slideable Account Overview Section (Horizontal Carousel) */}
      <section className="mb-6">
        <OverviewCarousel
          metrics={data.metrics}
          accounts={data.accounts}
          selectedAccountId={selectedAccountId}
          onSelectAccount={handleSelectAccount}
        />
      </section>

      {/* Recent Transactions Section (Scrollable List) */}
      <section className="flex-1">
        <TransactionList
          transactions={data.transactions}
          selectedAccountName={selectedAccountName}
          onOpenAddModal={() => setIsAddModalOpen(true)}
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
        onAddTransaction={handleAddTransaction}
      />
    </div>
  );
}
