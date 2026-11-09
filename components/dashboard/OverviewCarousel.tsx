"use client";

import { useEffect, useRef, useState } from "react";
import { Account, AccountType, OverviewMetrics } from "@/types";
import { DonutChart } from "./DonutChart";
import { BrandLogo } from "@/components/accounts/BrandLogo";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Globe,
} from "lucide-react";
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
  currency = "USD",
}: OverviewCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

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
    const cardWidth = container.children[0]?.clientWidth || 320;
    const newIndex = Math.round(scrollLeft / (cardWidth + 16));

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
      {/* Top Carousel Navigation Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {slides[activeIndex]?.name}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary font-medium text-secondary-foreground">
            {activeIndex === 0 ? "Global" : `Account ${activeIndex} of ${accounts.length}`}
          </span>
        </div>

        {/* Carousel Arrow Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={prevSlide}
            disabled={activeIndex === 0}
            className="p-1.5 rounded-full hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none transition-colors"
            aria-label="Previous Account"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextSlide}
            disabled={activeIndex === slides.length - 1}
            className="p-1.5 rounded-full hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none transition-colors"
            aria-label="Next Account"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Snap Scrollable Cards Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-3 pt-1 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {slides.map((slide, index) => {
          const isSelected = activeIndex === index;

          return (
            <div
              key={slide.id}
              onClick={() => {
                scrollToIndex(index);
                setActiveIndex(index);
                onSelectAccount(slide.id);
              }}
              className={cn(
                "snap-center shrink-0 w-[90vw] sm:w-[380px] md:w-[420px] rounded-3xl p-5 sm:p-6 transition-all duration-300 cursor-pointer border shadow-sm relative overflow-hidden",
                isSelected
                  ? "bg-gradient-to-b from-card via-card to-card/90 border-primary/40 shadow-md ring-1 ring-primary/20"
                  : "bg-card/60 border-border/70 opacity-70 hover:opacity-90"
              )}
            >
              {/* Optional brand accent line */}
              {slide.color && (
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: slide.color }}
                />
              )}

              {/* Card Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  {slide.id === "all" ? (
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <Globe className="h-4 w-4" />
                    </div>
                  ) : (
                    <BrandLogo
                      type={slide.type as AccountType}
                      institutionName={slide.institution}
                      name={slide.name}
                      size="md"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-foreground text-sm sm:text-base leading-tight">
                      {slide.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <span>{slide.institution}</span>
                      <span>&bull;</span>
                      <span className="font-medium">{slide.subtext}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                    Balance
                  </span>
                  <span
                    className={cn(
                      "text-sm sm:text-base font-bold",
                      slide.balance >= 0 ? "text-emerald-500" : "text-rose-500"
                    )}
                  >
                    {formatCurrency(slide.balance, currency)}
                  </span>
                </div>
              </div>

              {/* Dynamic Donut / Pie Chart */}
              <div className="py-2 flex justify-center">
                <DonutChart
                  income={slide.income}
                  expense={slide.expense}
                  currency={currency}
                  size={170}
                  strokeWidth={20}
                />
              </div>

              {/* Dual Summary Card (Matching wireframe gradient banner) */}
              <div className="mt-4 rounded-2xl p-3.5 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-md shadow-purple-500/10">
                <div className="grid grid-cols-2 divide-x divide-white/20">
                  {/* Income column */}
                  <div className="pr-3 flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <ArrowDownLeft className="h-4 w-4 text-emerald-200" />
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-white/80 block">
                        Income
                      </span>
                      <span className="text-sm sm:text-base font-bold tracking-tight text-white block">
                        {formatCurrency(slide.income, currency)}
                      </span>
                    </div>
                  </div>

                  {/* Expense column */}
                  <div className="pl-3 flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <ArrowUpRight className="h-4 w-4 text-rose-200" />
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-white/80 block">
                        Expenses
                      </span>
                      <span className="text-sm sm:text-base font-bold tracking-tight text-white block">
                        {formatCurrency(slide.expense, currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide Indicators (Dots) */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => {
              scrollToIndex(i);
              setActiveIndex(i);
              onSelectAccount(slide.id);
            }}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              activeIndex === i
                ? "w-6 bg-primary"
                : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
            )}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
