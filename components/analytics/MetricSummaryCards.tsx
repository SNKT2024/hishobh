"use client";

import { AnalyticsSummaryMetrics, TimeframeOption } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingDown,
  TrendingUp,
  ArrowUpRight,
  PiggyBank,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricSummaryCardsProps {
  summary: AnalyticsSummaryMetrics;
  timeframe: TimeframeOption;
}

const TIMEFRAME_PERIOD_NAMES: Record<TimeframeOption, string> = {
  weekly: "last week",
  monthly: "last month",
  quarterly: "last quarter",
  "6months": "prior 6 mo",
  yearly: "last year",
};

export function MetricSummaryCards({
  summary,
  timeframe,
}: MetricSummaryCardsProps) {
  const periodName = TIMEFRAME_PERIOD_NAMES[timeframe] || "prior period";

  const isSpentHigher = summary.spent_change_percentage > 0;
  const isSpentZero = summary.spent_change_percentage === 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {/* 1. Total Spent Card */}
      <Card className="relative overflow-hidden border-border/80 bg-card shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Spent
            </span>
            <div className="h-8 w-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {formatCurrency(summary.total_spent)}
            </span>
          </div>

          {/* Comparison indicator */}
          <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium">
            {!isSpentZero ? (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-semibold",
                  isSpentHigher
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                    : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                )}
              >
                {isSpentHigher ? (
                  <TrendingUp className="h-3 w-3 inline" />
                ) : (
                  <TrendingDown className="h-3 w-3 inline" />
                )}
                {Math.abs(summary.spent_change_percentage)}%
              </span>
            ) : (
              <span className="text-muted-foreground">0%</span>
            )}
            <span className="text-muted-foreground text-[11px] truncate">
              vs {periodName}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Total Earned & Net Savings Rate Card */}
      <Card className="relative overflow-hidden border-border/80 bg-card shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Earned
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {formatCurrency(summary.total_earned)}
            </span>
          </div>

          {/* Net savings rate */}
          <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
              <PiggyBank className="h-3 w-3 inline" />
              {summary.net_savings_rate}% saved
            </span>
            <span className="text-muted-foreground text-[11px]">
              net rate
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Top Spending Category Card */}
      <Card className="relative overflow-hidden border-border/80 bg-card shadow-sm sm:col-span-1 col-span-1">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Top Category
            </span>
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>

          {summary.top_spending_category ? (
            <div>
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate block">
                {summary.top_spending_category.name}
              </span>
              <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium">
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400 font-semibold">
                  <Sparkles className="h-3 w-3 inline" />
                  {summary.top_spending_category.percentage}% of spend
                </span>
                <span className="text-muted-foreground text-[11px]">
                  ({formatCurrency(summary.top_spending_category.amount)})
                </span>
              </div>
            </div>
          ) : (
            <div>
              <span className="text-lg font-medium text-muted-foreground">
                No expenses
              </span>
              <p className="text-xs text-muted-foreground mt-2">
                All clear this period
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

