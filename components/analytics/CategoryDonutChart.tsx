"use client";

import { useState } from "react";
import { CategoryAnalytics } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Sector,
} from "recharts";
import {
  Utensils,
  ShoppingCart,
  Zap,
  Car,
  Film,
  HeartPulse,
  Briefcase,
  HelpCircle,
  LucideIcon,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface CategoryDonutChartProps {
  categories: CategoryAnalytics[];
  totalSpent: number;
}

// Icon mapper for categories
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Food & Dining": Utensils,
  Groceries: ShoppingCart,
  Shopping: ShoppingCart,
  Utilities: Zap,
  Bills: Zap,
  Transport: Car,
  Entertainment: Film,
  Healthcare: HeartPulse,
  General: HelpCircle,
};

function getCategoryIcon(name: string): LucideIcon {
  return CATEGORY_ICONS[name] || HelpCircle;
}

// Active slice shape renderer for hover effect
const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export function CategoryDonutChart({
  categories,
  totalSpent,
}: CategoryDonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const activeCategory =
    activeIndex !== null && categories[activeIndex]
      ? categories[activeIndex]
      : null;

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg">
          Category Breakdown
        </CardTitle>
        <CardDescription className="text-xs">
          Expense distribution ranked by highest spending
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        {categories.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No expense records found for this timeframe.
          </div>
        ) : (
          <div>
            {/* Donut Chart with Center Summary */}
            <div className="relative h-[220px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    {...({
                      activeIndex: activeIndex !== null ? activeIndex : undefined,
                      activeShape: renderActiveShape,
                    } as any)}
                    data={categories}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="amount"
                    nameKey="category"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {categories.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        className="transition-all duration-300 cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as CategoryAnalytics;
                        return (
                          <div className="rounded-xl border border-border/80 bg-background/95 p-2.5 shadow-xl backdrop-blur-md text-xs">
                            <p className="font-bold text-foreground">
                              {data.category}
                            </p>
                            <p className="text-muted-foreground">
                              {formatCurrency(data.amount)} ({data.percentage}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                {activeCategory ? (
                  <>
                    <span className="text-[11px] font-medium text-muted-foreground truncate max-w-[100px]">
                      {activeCategory.category}
                    </span>
                    <span className="text-base font-extrabold text-foreground">
                      {formatCurrency(activeCategory.amount)}
                    </span>
                    <span className="text-[10px] font-bold text-primary">
                      {activeCategory.percentage}%
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Total Spend
                    </span>
                    <span className="text-base sm:text-lg font-extrabold text-foreground">
                      {formatCurrency(totalSpent)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {categories.length} categories
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Ranked Category List Below */}
            <div className="mt-4 space-y-3">
              {categories.map((cat, idx) => {
                const Icon = getCategoryIcon(cat.category);
                const isHovered = activeIndex === idx;

                return (
                  <div
                    key={cat.category}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onMouseLeave={() => setActiveIndex(null)}
                    className={cn(
                      "p-2.5 rounded-xl transition-all cursor-pointer border",
                      isHovered
                        ? "bg-muted/70 border-border shadow-xs"
                        : "bg-transparent border-transparent hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: cat.color }}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">
                            {cat.category}
                          </span>
                          <span className="text-[11px] text-muted-foreground ml-2">
                            {cat.count} {cat.count === 1 ? "txn" : "txns"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-foreground">
                          {formatCurrency(cat.amount)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2 font-medium">
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-muted/80 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
