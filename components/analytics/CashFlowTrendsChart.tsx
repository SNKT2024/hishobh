"use client";

import { useState } from "react";
import { CashFlowTrendPoint, TimeframeOption } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { BarChart3, LineChart as LineChartIcon } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface CashFlowTrendsChartProps {
  trends: CashFlowTrendPoint[];
  timeframe: TimeframeOption;
}

// Custom Tooltip component for Recharts
function CustomTrendsTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const incomeItem = payload.find((p: any) => p.dataKey === "income");
    const expenseItem = payload.find((p: any) => p.dataKey === "expense");
    const incomeVal = incomeItem ? Number(incomeItem.value) : 0;
    const expenseVal = expenseItem ? Number(expenseItem.value) : 0;
    const netVal = incomeVal - expenseVal;

    return (
      <div className="rounded-xl border border-border/80 bg-background/95 p-3 shadow-xl backdrop-blur-md text-xs">
        <p className="font-bold text-foreground mb-1.5">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Income:
            </span>
            <span className="font-semibold text-foreground">
              {formatCurrency(incomeVal)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Expense:
            </span>
            <span className="font-semibold text-foreground">
              {formatCurrency(expenseVal)}
            </span>
          </div>
          <div className="border-t border-border/60 pt-1 mt-1 flex items-center justify-between gap-4">
            <span className="text-muted-foreground font-medium">Net Flow:</span>
            <span
              className={cn(
                "font-bold",
                netVal >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              )}
            >
              {netVal >= 0 ? "+" : "-"}{formatCurrency(Math.abs(netVal))}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function CashFlowTrendsChart({
  trends,
  timeframe,
}: CashFlowTrendsChartProps) {
  const [chartType, setChartType] = useState<"bar" | "area">("bar");

  const totalIncome = trends.reduce((acc, t) => acc + t.income, 0);
  const totalExpense = trends.reduce((acc, t) => acc + t.expense, 0);

  return (
    <Card className="border-border/80 shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base sm:text-lg">
            Cash Flow & Trends
          </CardTitle>
          <CardDescription className="text-xs">
            Income vs Expense flow across the selected timeframe
          </CardDescription>
        </div>

        {/* Chart View Toggle (Bar vs Area) */}
        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/60">
          <button
            onClick={() => setChartType("bar")}
            className={cn(
              "p-1.5 rounded-md text-xs font-medium transition-all",
              chartType === "bar"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Bar Chart View"
          >
            <BarChart3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setChartType("area")}
            className={cn(
              "p-1.5 rounded-md text-xs font-medium transition-all",
              chartType === "area"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Area Trend View"
          >
            <LineChartIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {/* Quick Summary Pill Bar */}
        <div className="flex items-center gap-3 mb-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            <span className="text-muted-foreground">Income:</span>
            <span className="font-semibold text-foreground">
              ${totalIncome.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
            <span className="text-muted-foreground">Expense:</span>
            <span className="font-semibold text-foreground">
              ${totalExpense.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Chart Area */}
        <div className="h-[240px] sm:h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart
                data={trends}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barGap={4}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border/40"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip content={<CustomTrendsTooltip />} />
                <Bar
                  dataKey="income"
                  name="Income"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="expense"
                  name="Expense"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            ) : (
              <AreaChart
                data={trends}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border/40"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip content={<CustomTrendsTooltip />} />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={0.2}
                  fill="#10b981"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Expense"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={0.2}
                  fill="#f43f5e"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

