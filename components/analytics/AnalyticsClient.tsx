"use client";

import { useState, useTransition } from "react";
import {
  AnalyticsData,
  CreateTransactionDTO,
  TimeframeOption,
} from "@/types";
import { TimeframeFilter } from "@/components/dashboard/TimeframeFilter";
import dynamic from "next/dynamic";
import { MetricSummaryCards } from "./MetricSummaryCards";
import { SpentWithPeopleCard } from "./SpentWithPeopleCard";
import { AccountDistributionCard } from "./AccountDistributionCard";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { AddTransactionModal } from "@/components/dashboard/AddTransactionModal";
import { getAnalyticsData } from "@/lib/actions/analytics";
import { createTransactionAction } from "@/lib/actions/dashboard";
import { Loader2, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

// Performance Optimization: Dynamic lazy-loading of heavy Recharts modules
const CashFlowTrendsChart = dynamic(
  () => import("./CashFlowTrendsChart").then((mod) => mod.CashFlowTrendsChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 rounded-2xl border border-border/80 bg-card p-6 flex flex-col items-center justify-center gap-3 animate-pulse">
        <div className="h-4 w-40 bg-muted/60 rounded" />
        <div className="h-44 w-full bg-muted/30 rounded-xl" />
      </div>
    ),
  }
);

const CategoryDonutChart = dynamic(
  () => import("./CategoryDonutChart").then((mod) => mod.CategoryDonutChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 rounded-2xl border border-border/80 bg-card p-6 flex flex-col items-center justify-center gap-3 animate-pulse">
        <div className="h-4 w-40 bg-muted/60 rounded" />
        <div className="h-44 w-full bg-muted/30 rounded-xl" />
      </div>
    ),
  }
);

interface AnalyticsClientProps {
  initialData: AnalyticsData;
  userName?: string;
}

export function AnalyticsClient({
  initialData,
  userName = "there",
}: AnalyticsClientProps) {
  const [data, setData] = useState<AnalyticsData>(initialData);
  const [timeframe, setTimeframe] = useState<TimeframeOption>(
    initialData.timeframe
  );
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    initialData.selectedAccountId
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Handle Timeframe Change
  const handleTimeframeChange = (newTimeframe: TimeframeOption) => {
    setTimeframe(newTimeframe);
    startTransition(async () => {
      try {
        const fresh = await getAnalyticsData(newTimeframe, selectedAccountId);
        setData(fresh);
      } catch (err) {
        console.error("Failed to update analytics timeframe:", err);
      }
    });
  };

  // Handle Account Filter Switch
  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId);
    startTransition(async () => {
      try {
        const fresh = await getAnalyticsData(timeframe, accountId);
        setData(fresh);
      } catch (err) {
        console.error("Failed to update account filter:", err);
      }
    });
  };

  // Handle Adding a Transaction from the Floating '+' Button
  const handleAddTransaction = async (dto: CreateTransactionDTO) => {
    await createTransactionAction(dto);
    const fresh = await getAnalyticsData(timeframe, selectedAccountId);
    setData(fresh);
  };

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col overflow-y-auto overscroll-y-contain touch-pan-y pb-28 sm:pb-32 pt-2 pr-1 no-scrollbar">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-3 px-1 shrink-0 gap-2">
        <div className="min-w-0 pr-1">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground truncate">
            Analytics & Insights
          </h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
            {isPending ? (
              <span className="inline-flex items-center gap-1 text-primary">
                <Loader2 className="h-3 w-3 animate-spin" /> Aggregating data...
              </span>
            ) : (
              <span className="truncate">{data.date_range_label}</span>
            )}
          </p>
        </div>

        {/* Global Timeframe Selector Dropdown */}
        <div className="shrink-0">
          <TimeframeFilter
            value={timeframe}
            onChange={handleTimeframeChange}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Account Horizontal Filter Carousel */}
      {data.accounts.length > 0 && (
        <div className="shrink-0 mb-4 w-full">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-0.5">
            <button
              type="button"
              onClick={() => handleAccountChange("all")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0",
                selectedAccountId === "all"
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Layers className="h-3.5 w-3.5 shrink-0" />
              <span>All Accounts</span>
            </button>

            {data.accounts.map((acc) => (
              <button
                type="button"
                key={acc.id}
                onClick={() => handleAccountChange(acc.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0",
                  selectedAccountId === acc.id
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-card border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: acc.color || "#6366f1" }}
                />
                <span>{acc.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Content Grid */}
      <div className="space-y-5">
        {/* A. Metric Summary Cards */}
        <section>
          <MetricSummaryCards
            summary={data.summary}
            timeframe={data.timeframe}
          />
        </section>

        {/* B. Cash Flow & Trends Chart */}
        <section>
          <CashFlowTrendsChart
            trends={data.trends}
            timeframe={data.timeframe}
          />
        </section>

        {/* C. Category Breakdown Donut & Ranked List */}
        <section>
          <CategoryDonutChart
            categories={data.categories}
            totalSpent={data.summary.total_spent}
          />
        </section>

        {/* D. "Spent with People" Social Spending Analytics */}
        <section>
          <SpentWithPeopleCard
            peopleSpending={data.people_spending}
            totalSpent={data.summary.total_spent}
          />
        </section>

        {/* E. Account Payment Distribution */}
        {selectedAccountId === "all" && (
          <section>
            <AccountDistributionCard
              accounts={data.account_distribution}
              totalSpent={data.summary.total_spent}
            />
          </section>
        )}

        {/* Guaranteed bottom clearance spacer so charts never clip behind BottomNav */}
        <div className="h-24 sm:h-28 shrink-0 pointer-events-none" aria-hidden="true" />
      </div>

      {/* Bottom Navigation Dock */}
      <BottomNav
        activeTab="stats"
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Floating Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        accounts={data.accounts}
        people={data.people}
        onAddTransaction={handleAddTransaction}
      />
    </div>
  );
}

