"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Account } from "@/types";
import { ImportWizardModal } from "./ImportWizardModal";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  History,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";

interface ImportPageClientProps {
  accounts: Account[];
  currency?: string;
}

export function ImportPageClient({
  accounts,
  currency = "INR",
}: ImportPageClientProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <div
      className="max-w-2xl mx-auto w-full space-y-6 pb-24 sm:pb-28 pt-2"
      suppressHydrationWarning
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Bulk Importer
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Import historical transactions from CSV, Excel (.xlsx, .xls) files
          </p>
        </div>
      </div>

      {/* Hero Card */}
      <div className="rounded-3xl p-6 bg-card border border-border shadow-sm space-y-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">
              Client-Side Smart Data Parsing
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Import months or years of bank statements or notebook exports. Files are read 100% locally in your browser with automated counterparty matching and instant rollback protection.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
            <span>Local parsing only</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span>Smart column mapping</span>
          </div>
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary shrink-0" />
            <span>1-click Undo rollback</span>
          </div>
        </div>

        <div className="pt-2">
          <Button
            onClick={() => setIsModalOpen(true)}
            size="lg"
            className="w-full sm:w-auto gap-2 font-semibold rounded-xl"
          >
            <Upload className="h-4 w-4" />
            Launch Import Wizard
          </Button>
        </div>
      </div>

      {/* Guide Card */}
      <div className="rounded-3xl p-5 bg-card/60 border border-border/80 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Recommended Spreadsheet Columns
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/60">
            <span className="font-bold text-foreground block">Date</span>
            <span className="text-[11px] text-muted-foreground">
              YYYY-MM-DD or DD/MM/YYYY
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/60">
            <span className="font-bold text-foreground block">Amount</span>
            <span className="text-[11px] text-muted-foreground">
              Numbers with or without signs
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/60">
            <span className="font-bold text-foreground block">Description</span>
            <span className="text-[11px] text-muted-foreground">
              Title or payee memo
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/60">
            <span className="font-bold text-foreground block">Type</span>
            <span className="text-[11px] text-muted-foreground">
              Income / Expense / CR / DR
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/60">
            <span className="font-bold text-foreground block">Category</span>
            <span className="text-[11px] text-muted-foreground">
              Groceries, Salary, etc.
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/60">
            <span className="font-bold text-foreground block">Person</span>
            <span className="text-[11px] text-muted-foreground">
              Auto-links counterparties
            </span>
          </div>
        </div>
      </div>

      {/* Full Wizard Modal */}
      <ImportWizardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        accounts={accounts}
        currency={currency}
        onSuccess={() => {
          router.push("/dashboard");
        }}
      />
    </div>
  );
}
