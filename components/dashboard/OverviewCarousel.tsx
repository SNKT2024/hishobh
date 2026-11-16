"use client";

import { useEffect, useRef, useState } from "react";
import { Account, AccountType, OverviewMetrics } from "@/types";
import { BrandLogo } from "@/components/accounts/BrandLogo";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Globe,
  Plus,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface OverviewCarouselProps {
  metrics: OverviewMetrics;
  accounts: Account[];
  selectedAccountId: string;
  onSelectAccount: (accountId: string) => void;
  currency?: string;
}

export function OverviewCarousel({
  metrics,
  accounts,
  selectedAccountId,
  onSelectAccount,
  currency = "INR",
}: OverviewCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (accounts.length === 0) {
    return (
      <div className="w-full rounded-2xl p-5 border border-dashed border-border bg-card/60 text-center flex flex-col items-center justify-center my-1 shadow-xs">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2.5">
          <WalletCards className="h-5 w-5" />
        </div>
        <h3 className="font-bold text-sm text-foreground">No accounts found</h3>
        <p className="text-xs text-muted-foreground max-w-sm mt-0.5 mb-3">
          Add a bank, card, digital wallet, or cash reserve to start tracking expenses.
        </p>
        <Link href="/accounts">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:bg-primary/90 transition-all active:scale-95 cursor-pointer">
            <Plus className="h-3.5 w-3.5" />
            Add Account
          </span>
        </Link>
      </div>
    );
  }

  // Combine "All Accounts" slide + individual accounts
  const slides = [
    {
      id: "all",
      name: "All Accounts",
      type: "overview",
      institution: "Combined Ledger",
      subtext: "Global Overview",
      color: null,
      income: metrics.total_income,
      expense: metrics.total_expense,
      balance: metrics.balance,
    },
    ...accounts.map((acc) => ({
      id: acc.id,
      name: acc.name,
      type: acc.type,
      institution: acc.institution_name || acc.name,
      subtext: acc.type.toUpperCase(),
      color: acc.color,
      income: acc.total_income || 0,
      expense: acc.total_expense || 0,
      balance: (acc.total_income || 0) - (acc.total_expense || 0),
    })),
  ];

  // Sync scroll position when selectedAccountId changes externally
  useEffect(() => {
    const idx = slides.findIndex((s) => s.id === selectedAccountId);
    if (idx !== -1 && idx !== activeIndex) {
      setActiveIndex(idx);
      scrollToIndex(idx);
    }
  }, [selectedAccountId]);

  const scrollToIndex = (index: number) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const card = container.children[index] as HTMLElement;
    if (card) {
      const scrollLeft =
        card.offsetLeft - (container.clientWidth - card.clientWidth) / 2;
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollLeft = container.scrollLeft;
    const cardWidth = container.children[0]?.clientWidth || 300;
    const newIndex = Math.round(scrollLeft / (cardWidth + 12));

    if (newIndex >= 0 && newIndex < slides.length && newIndex !== activeIndex) {
      setActiveIndex(newIndex);
      onSelectAccount(slides[newIndex].id);
    }
  };

  const nextSlide = () => {
    const next = Math.min(activeIndex + 1, slides.length - 1);
    scrollToIndex(next);
    setActiveIndex(next);
    onSelectAccount(slides[next].id);
  };

  const prevSlide = () => {
    const prev = Math.max(activeIndex - 1, 0);
    scrollToIndex(prev);
    setActiveIndex(prev);
    onSelectAccount(slides[prev].id);
  };

  return (
    <div className="relative w-full">
      {/* Compact Top Carousel Navigation Header */}
      <div className="flex items-center justify-between mb-1.5 px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {slides[activeIndex]?.name}
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-secondary font-medium text-secondary-foreground">
            {activeIndex === 0 ? "Global" : `${activeIndex} of ${accounts.length}`}
          </span>
        </div>

        {/* Carousel Arrow Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={prevSlide}
            disabled={activeIndex === 0}
            className="p-1 rounded-full hover:bg-secondary disabled:opacity-20 disabled:pointer-events-none transition-colors"
            aria-label="Previous Account"
          >
            <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={nextSlide}
            disabled={activeIndex === slides.length - 1}
            className="p-1 rounded-full hover:bg-secondary disabled:opacity-20 disabled:pointer-events-none transition-colors"
            aria-label="Next Account"
          >
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Snap Scrollable Compact Cards Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-1.5 pt-0.5 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {slides.map((slide, index) => {
          const isSelected = activeIndex === index;
          const totalFlow = slide.income + slide.expense;
          const incomePct = totalFlow > 0 ? (slide.income / totalFlow) * 100 : 50;
          const expensePct = totalFlow > 0 ? (slide.expense / totalFlow) * 100 : 50;

          return (
            <div
              key={slide.id}
              onClick={() => {
                scrollToIndex(index);
                setActiveIndex(index);
                onSelectAccount(slide.id);
              }}
              className={cn(
                "snap-center shrink-0 w-[88vw] sm:w-[350px] md:w-[380px] rounded-2xl p-4 transition-all duration-200 cursor-pointer border relative overflow-hidden",
                isSelected
                  ? "bg-card border-primary/60 shadow-md ring-1 ring-primary/20"
                  : "bg-card/70 border-border/70 opacity-70 hover:opacity-100"
              )}
            >
              {/* Optional brand accent line */}
              {slide.color && (
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: slide.color }}
                />
              )}

              {/* Card Header: Brand Icon + Title + Status Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  {slide.id === "all" ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <Globe className="h-4 w-4" />
                    </div>
                  ) : (
                    <BrandLogo
                      type={slide.type as AccountType}
                      institutionName={slide.institution}
                      name={slide.name}
                      size="sm"
                    />
                  )}
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-sm truncate leading-tight">
                      {slide.name}
                    </h3>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {slide.institution} &bull; {slide.subtext}
                    </p>
                  </div>
                </div>

                <span
                  className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0",
                    isSelected
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-secondary text-secondary-foreground border-border/50"
                  )}
                >
                  {isSelected ? "Selected" : "Tap to view"}
                </span>
              </div>

              {/* Main Balance Row */}
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                    {slide.id === "all" ? "Net Balance" : "Current Balance"}
                  </span>
                  <span
                    className={cn(
                      "text-xl sm:text-2xl font-black tracking-tight",
                      slide.balance >= 0 ? "text-foreground" : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {formatCurrency(slide.balance, currency)}
                  </span>
                </div>

                {/* Inline Income & Expense Micro-Stats */}
                <div className="flex items-center gap-2.5 text-right">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">Income</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-0.5">
                      <ArrowDownLeft className="h-3 w-3" />
                      {formatCurrency(slide.income, currency)}
                    </span>
                  </div>
                  <div className="h-6 w-px bg-border/80" />
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-medium">Expenses</span>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center justify-end gap-0.5">
                      <ArrowUpRight className="h-3 w-3" />
                      {formatCurrency(slide.expense, currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dual Cash Flow Ratio Progress Bar */}
              <div className="mt-2.5 w-full h-1.5 rounded-full bg-secondary/80 overflow-hidden flex">
                <div
                  style={{ width: `${incomePct}%` }}
                  className="h-full bg-emerald-500 rounded-l-full transition-all duration-300"
                  title={`Income: ${Math.round(incomePct)}%`}
                />
                <div
                  style={{ width: `${expensePct}%` }}
                  className="h-full bg-rose-500 rounded-r-full transition-all duration-300"
                  title={`Expenses: ${Math.round(expensePct)}%`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide Indicators (Dots) */}
      <div className="flex items-center justify-center gap-1 mt-1">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => {
              scrollToIndex(i);
              setActiveIndex(i);
              onSelectAccount(slide.id);
            }}
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              activeIndex === i
                ? "w-4 bg-primary"
                : "w-1 bg-muted-foreground/30 hover:bg-muted-foreground/60"
            )}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
