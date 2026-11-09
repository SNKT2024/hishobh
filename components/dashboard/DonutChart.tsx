"use client";

import { useMemo } from "react";
import { formatCurrency } from "@/lib/utils";

interface DonutChartProps {
  income: number;
  expense: number;
  currency?: string;
  size?: number;
  strokeWidth?: number;
}

export function DonutChart({
  income,
  expense,
  currency = "USD",
  size = 180,
  strokeWidth = 22,
}: DonutChartProps) {
  const total = income + expense;

  const { incomePct, expensePct, incomeOffset, expenseOffset, circumference } =
    useMemo(() => {
      const radius = (size - strokeWidth) / 2;
      const circ = 2 * Math.PI * radius;

      if (total <= 0) {
        return {
          incomePct: 50,
          expensePct: 50,
          incomeOffset: 0,
          expenseOffset: circ * 0.5,
          circumference: circ,
        };
      }

      const incRatio = income / total;
      const expRatio = expense / total;

      const incPct = Math.round(incRatio * 100);
      const expPct = 100 - incPct;

      const incLen = circ * incRatio;
      const expLen = circ * expRatio;

      return {
        incomePct: incPct,
        expensePct: expPct,
        incomeOffset: 0,
        expenseOffset: incLen,
        circumference: circ,
      };
    }, [income, expense, total, size, strokeWidth]);

  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <defs>
          <linearGradient id="incomeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="expenseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
        </defs>

        {/* Background track circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />

        {total > 0 ? (
          <>
            {/* Income segment */}
            {income > 0 && (
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="url(#incomeGrad)"
                strokeWidth={strokeWidth}
                strokeDasharray={`${(circumference * income) / total} ${circumference}`}
                strokeDashoffset={0}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            )}

            {/* Expense segment */}
            {expense > 0 && (
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="url(#expenseGrad)"
                strokeWidth={strokeWidth}
                strokeDasharray={`${(circumference * expense) / total} ${circumference}`}
                strokeDashoffset={-((circumference * income) / total)}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            )}
          </>
        ) : (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/40 stroke-dashed"
          />
        )}
      </svg>

      {/* Center Balance Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
          Net Flow
        </span>
        <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
          {formatCurrency(income - expense, currency)}
        </span>
        {total > 0 && (
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-medium">
            <span className="text-emerald-500 font-semibold">{incomePct}% In</span>
            <span className="text-muted-foreground">&bull;</span>
            <span className="text-rose-500 font-semibold">{expensePct}% Out</span>
          </div>
        )}
      </div>
    </div>
  );
}
