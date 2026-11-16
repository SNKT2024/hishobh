"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  CreateDebtDTO,
  CreateDebtSettlementDTO,
  Debt,
  DebtSummaryMetrics,
  DebtType,
  Person,
} from "@/types";
import { DebtCard } from "./DebtCard";
import { AddDebtModal } from "./AddDebtModal";
import { RecordPaymentModal } from "./RecordPaymentModal";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  createDebtAction,
  createDebtSettlementAction,
  deleteDebtAction,
  getDebtsAction,
} from "@/lib/actions/debts";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  HandCoins,
  Percent,
  Plus,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DebtsClientProps {
  initialDebts: Debt[];
  initialMetrics: DebtSummaryMetrics;
  people: Person[];
  currency?: string;
}

export function DebtsClient({
  initialDebts,
  initialMetrics,
  people: initialPeople,
  currency = "INR",
}: DebtsClientProps) {
  const [debts, setDebts] = useState<Debt[]>(initialDebts);
  const [metrics, setMetrics] = useState<DebtSummaryMetrics>(initialMetrics);
  const [people, setPeople] = useState<Person[]>(initialPeople);

  const [activeTab, setActiveTab] = useState<DebtType>("lend");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "settled">("active");
  const [searchQuery, setSearchQuery] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState<Debt | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter debts by tab, status, and search query
  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      // 1. Tab check
      if (d.type !== activeTab) return false;

      // 2. Status check
      if (filterStatus === "active" && d.status === "settled") return false;
      if (filterStatus === "settled" && d.status !== "settled") return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const personMatch = d.person?.name.toLowerCase().includes(q);
        const descMatch = d.description?.toLowerCase().includes(q);
        return personMatch || descMatch;
      }

      return true;
    });
  }, [debts, activeTab, filterStatus, searchQuery]);

  // Refresh data after mutation
  const refreshDebts = async () => {
    const data = await getDebtsAction();
    setDebts(data.debts);
    setMetrics(data.metrics);
  };

  // Handle Add Debt
  const handleAddDebt = async (dto: CreateDebtDTO) => {
    await createDebtAction(dto);
    await refreshDebts();
  };

  // Handle Record Payment
  const handleRecordPayment = async (dto: CreateDebtSettlementDTO) => {
    await createDebtSettlementAction(dto);
    await refreshDebts();
  };

  // Handle Delete
  const handleDeleteDebt = async (id: string) => {
    if (!confirm("Are you sure you want to delete this debt record?")) return;
    startTransition(async () => {
      await deleteDebtAction(id);
      await refreshDebts();
    });
  };

  return (
    <div
      className="w-full flex flex-col space-y-6 pb-24 sm:pb-28 pt-2"
      suppressHydrationWarning
    >
      {/* Top Header */}
      <div className="flex flex-col gap-2" suppressHydrationWarning>
        <div className="flex items-center justify-between">
          <Link
            href="/settings"
            prefetch={true}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground py-1.5 px-2 -ml-2 rounded-xl hover:bg-secondary transition-colors"
            aria-label="Back to Settings"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Settings</span>
          </Link>

          <Button
            onClick={() => setIsAddModalOpen(true)}
            size="sm"
            className="gap-1.5 shadow-sm text-xs font-semibold rounded-xl h-9 px-3.5"
          >
            <Plus className="h-4 w-4" />
            <span>New Record</span>
          </Button>
        </div>

        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Lend & Borrow Ledger
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Isolated counterparty registry for tracking loans, IOUs, and repayments
          </p>
        </div>
      </div>

      {/* Top Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Total Lent (Receivable) */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Lent (To Collect)
            </span>
            <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            {formatCurrency(metrics.total_lent, currency)}
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            {metrics.active_lend_count} active counterparty loans
          </span>
        </div>

        {/* Card 2: Total Borrowed (Payable) */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Borrowed (To Pay)
            </span>
            <div className="h-7 w-7 rounded-lg bg-amber-600/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            {formatCurrency(metrics.total_borrowed, currency)}
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            {metrics.active_borrow_count} active debts owed
          </span>
        </div>

        {/* Card 3: Recovered to Date */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Recovered to Date
            </span>
            <div className="h-7 w-7 rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatCurrency(metrics.total_lent_recovered, currency)}
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            {metrics.recovery_percentage}% of total lent principal
          </span>
        </div>
      </div>

      {/* Two Distinct Tabs: Lent to Others vs Borrowed by Me */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-secondary rounded-2xl">
        <button
          onClick={() => setActiveTab("lend")}
          className={cn(
            "flex items-center justify-center gap-1.5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all text-center",
            activeTab === "lend"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ArrowUpRight className="h-4 w-4 text-violet-500 shrink-0" />
          <span className="hidden sm:inline">Lent to Others (Receivable)</span>
          <span className="sm:hidden">I Lent (Collect)</span>
        </button>

        <button
          onClick={() => setActiveTab("borrow")}
          className={cn(
            "flex items-center justify-center gap-1.5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all text-center",
            activeTab === "borrow"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ArrowDownLeft className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="hidden sm:inline">Borrowed by Me (Payable)</span>
          <span className="sm:hidden">I Borrowed (Pay)</span>
        </button>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by counterparty name or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {[
            { id: "active", label: "Active" },
            { id: "settled", label: "Settled" },
            { id: "all", label: "All" },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setFilterStatus(s.id as any)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                filterStatus === s.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground hover:text-foreground border-border/80"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Debts List */}
      <div className="space-y-3">
        {filteredDebts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredDebts.map((debt) => (
              <DebtCard
                key={debt.id}
                debt={debt}
                currency={currency}
                onOpenRecordPayment={(d) => setSelectedDebtForPayment(d)}
                onDeleteDebt={handleDeleteDebt}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-10 sm:p-14 rounded-3xl border border-dashed border-border text-center bg-card/40 my-2">
            <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
              <HandCoins className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-foreground text-base">
              No records found
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              {activeTab === "lend"
                ? "You haven't logged any money lent to others in this filter."
                : "You have no records of money borrowed from others in this filter."}
            </p>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              size="sm"
              className="mt-4 gap-1.5 rounded-xl text-xs font-semibold"
            >
              <Plus className="h-4 w-4" />
              Add Record
            </Button>
          </div>
        )}

        {/* Guaranteed bottom clearance spacer so records never clip behind BottomNav */}
        <div className="h-24 sm:h-28 shrink-0 pointer-events-none" aria-hidden="true" />
      </div>

      {/* Modals */}
      <AddDebtModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        people={people}
        onAddDebt={handleAddDebt}
        onPersonCreated={(np) => setPeople((prev) => [np, ...prev])}
      />

      <RecordPaymentModal
        isOpen={Boolean(selectedDebtForPayment)}
        onClose={() => setSelectedDebtForPayment(null)}
        debt={selectedDebtForPayment}
        currency={currency}
        onRecordPayment={handleRecordPayment}
      />
    </div>
  );
}
