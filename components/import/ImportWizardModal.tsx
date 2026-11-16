"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Account, ColumnMapping, ParsedImportRow } from "@/types";
import { BrandLogo } from "@/components/accounts/BrandLogo";
import {
  autoDetectColumnMapping,
  parseAndValidateRows,
  parseSpreadsheetFile,
} from "@/lib/import-parser";
import {
  bulkImportTransactionsAction,
  rollbackImportBatchAction,
} from "@/lib/actions/import";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Loader2,
  RotateCcw,
  Tag,
  Upload,
  User,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ImportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  currency?: string;
  onSuccess?: () => void;
}

type WizardStep = 1 | 2 | 3;

export function ImportWizardModal({
  isOpen,
  onClose,
  accounts,
  currency = "INR",
  onSuccess,
}: ImportWizardModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<WizardStep>(1);
  const [selectedAccountId, setSelectedAccountId] = useState(
    accounts[0]?.id || ""
  );

  // File parse state
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    date: "",
    title: "",
    amount: "",
    type: "",
    category: "",
    person: "",
  });

  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setIsParsing(true);
    try {
      const parsed = await parseSpreadsheetFile(selectedFile);
      if (parsed.headers.length === 0 || parsed.rawRows.length === 0) {
        throw new Error(
          "The uploaded file is empty or could not be read properly."
        );
      }

      setFile(selectedFile);
      setHeaders(parsed.headers);
      setRawRows(parsed.rawRows);

      // Auto-detect mappings
      const detected = autoDetectColumnMapping(parsed.headers);
      setMapping(detected);
    } catch (err: any) {
      setError(err?.message || "Failed to parse spreadsheet file");
      setFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  // Parsed and validated rows
  const parsedRows: ParsedImportRow[] = useMemo(() => {
    if (rawRows.length === 0) return [];
    return parseAndValidateRows(rawRows, mapping);
  }, [rawRows, mapping]);

  const validRows = useMemo(
    () => parsedRows.filter((r) => r.is_valid),
    [parsedRows]
  );
  const invalidRows = useMemo(
    () => parsedRows.filter((r) => !r.is_valid),
    [parsedRows]
  );

  // Check if step 2 can proceed
  const isMappingValid = Boolean(mapping.date && mapping.title && mapping.amount);

  // Reset modal state
  const handleReset = () => {
    setStep(1);
    setFile(null);
    setHeaders([]);
    setRawRows([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Execute Import
  const handleExecuteImport = async () => {
    if (validRows.length === 0) {
      setError("There are no valid transactions to import.");
      return;
    }

    const targetAccount = selectedAccountId || accounts[0]?.id;
    if (!targetAccount) {
      setError("Please select a target account for the import.");
      return;
    }

    const batchId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `batch-${Date.now()}`;

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await bulkImportTransactionsAction({
        batch_id: batchId,
        default_account_id: targetAccount,
        rows: validRows,
      });

      if (res.success) {
        // Show success notification with Undo capability
        toast.success(`Imported ${res.inserted_count} transactions`, {
          description: "Transactions have been saved to your account ledger.",
          duration: 8000,
          action: {
            label: "Undo Import",
            onClick: async () => {
              try {
                await rollbackImportBatchAction(batchId);
                toast("Import rolled back", {
                  description: `All ${res.inserted_count} transactions were deleted.`,
                });
                if (onSuccess) onSuccess();
                router.refresh();
              } catch (err) {
                console.error("Rollback failed:", err);
                toast.error("Failed to undo import");
              }
            },
          },
        });

        handleReset();
        onClose();
        if (onSuccess) onSuccess();
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to complete bulk import");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleReset();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Bulk Import Transactions
            </DialogTitle>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
              Step {step} of 3
            </span>
          </div>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ================= STEP 1: UPLOAD & ACCOUNT ================= */}
        {step === 1 && (
          <div className="space-y-4 pt-1">
            {/* Target Account Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 text-primary" />
                Select Target Account *
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.institution_name || acc.type.toUpperCase()})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                All imported entries will be credited or debited to this account.
              </p>
            </div>

            {/* File Upload Zone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Spreadsheet File (CSV or Excel) *
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2",
                  file
                    ? "border-primary/60 bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-secondary/40"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {isParsing ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      Reading spreadsheet on device...
                    </span>
                  </div>
                ) : file ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-1">
                      <FileText className="h-6 w-6" />
                    </div>
                    <span className="font-bold text-sm text-foreground">
                      {file.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {rawRows.length} rows &bull; {headers.length} columns detected
                    </span>
                    <span className="text-[11px] text-primary hover:underline mt-1">
                      Click to choose another file
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="h-12 w-12 rounded-2xl bg-secondary text-primary flex items-center justify-center mb-1">
                      <Upload className="h-6 w-6" />
                    </div>
                    <span className="font-semibold text-sm text-foreground">
                      Drop CSV or Excel (.xlsx) file here
                    </span>
                    <span className="text-xs text-muted-foreground max-w-xs">
                      Files are parsed 100% locally on your browser without uploading raw sheets.
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/50">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!file || rawRows.length === 0 || isParsing}
                onClick={() => setStep(2)}
                className="gap-1.5"
              >
                Next: Map Columns
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: COLUMN MAPPING ================= */}
        {step === 2 && (
          <div className="space-y-4 pt-1">
            <p className="text-xs text-muted-foreground">
              Match the columns from your spreadsheet to the ledger transaction fields.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center justify-between">
                  <span>Date *</span>
                  <span className="text-[10px] text-primary">Required</span>
                </label>
                <select
                  value={mapping.date}
                  onChange={(e) =>
                    setMapping((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-primary shadow-xs"
                >
                  <option value="">-- Select Date Column --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title / Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center justify-between">
                  <span>Title / Description *</span>
                  <span className="text-[10px] text-primary">Required</span>
                </label>
                <select
                  value={mapping.title}
                  onChange={(e) =>
                    setMapping((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-primary shadow-xs"
                >
                  <option value="">-- Select Title Column --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center justify-between">
                  <span>Amount *</span>
                  <span className="text-[10px] text-primary">Required</span>
                </label>
                <select
                  value={mapping.amount}
                  onChange={(e) =>
                    setMapping((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-primary shadow-xs"
                >
                  <option value="">-- Select Amount Column --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type (Optional) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Type (CR / DR)</span>
                  <span className="text-[10px] text-muted-foreground">
                    Optional
                  </span>
                </label>
                <select
                  value={mapping.type || ""}
                  onChange={(e) =>
                    setMapping((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-primary shadow-xs"
                >
                  <option value="">-- Auto-detect from signs --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category (Optional) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Category</span>
                  <span className="text-[10px] text-muted-foreground">
                    Optional
                  </span>
                </label>
                <select
                  value={mapping.category || ""}
                  onChange={(e) =>
                    setMapping((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-primary shadow-xs"
                >
                  <option value="">-- Default to "General" --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Person (Optional) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Counterparty / Person</span>
                  <span className="text-[10px] text-muted-foreground">
                    Optional
                  </span>
                </label>
                <select
                  value={mapping.person || ""}
                  onChange={(e) =>
                    setMapping((prev) => ({ ...prev, person: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-primary shadow-xs"
                >
                  <option value="">-- None --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-border/50">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(1)}
                className="gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                disabled={!isMappingValid}
                onClick={() => setStep(3)}
                className="gap-1.5"
              >
                Next: Preview Data
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: PREVIEW & VALIDATION ================= */}
        {step === 3 && (
          <div className="space-y-4 pt-1">
            {/* Validation Metrics Summary */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/70">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
                  Total Parsed
                </span>
                <span className="text-lg font-bold text-foreground">
                  {parsedRows.length}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider block">
                  Valid Rows
                </span>
                <span className="text-lg font-bold text-emerald-400">
                  {validRows.length}
                </span>
              </div>
              <div
                className={cn(
                  "p-3 rounded-xl border",
                  invalidRows.length > 0
                    ? "bg-rose-500/10 border-rose-500/30"
                    : "bg-secondary/40 border-border/70"
                )}
              >
                <span
                  className={cn(
                    "text-[10px] font-medium uppercase tracking-wider block",
                    invalidRows.length > 0
                      ? "text-rose-400"
                      : "text-muted-foreground"
                  )}
                >
                  Invalid Rows
                </span>
                <span
                  className={cn(
                    "text-lg font-bold",
                    invalidRows.length > 0
                      ? "text-rose-400"
                      : "text-muted-foreground"
                  )}
                >
                  {invalidRows.length}
                </span>
              </div>
            </div>

            {/* Warnings on Invalid Rows */}
            {invalidRows.length > 0 && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 space-y-1 max-h-24 overflow-y-auto">
                <span className="font-semibold block">
                  {invalidRows.length} row(s) contain errors and will be skipped:
                </span>
                {invalidRows.slice(0, 3).map((r) => (
                  <p key={r.raw_row_index} className="text-[11px] opacity-90">
                    &bull; Row #{r.raw_row_index}: {r.error_message}
                  </p>
                ))}
                {invalidRows.length > 3 && (
                  <p className="text-[10px] opacity-75">
                    ...and {invalidRows.length - 3} more invalid rows
                  </p>
                )}
              </div>
            )}

            {/* Preview of first 5 records */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                First 5 Parsed Records Preview
              </span>
              <div className="rounded-2xl border border-border/80 bg-card overflow-hidden divide-y divide-border/60">
                {validRows.slice(0, 5).map((row, idx) => (
                  <div
                    key={idx}
                    className="p-3 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground truncate">
                          {row.title}
                        </span>
                        {row.person_name && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-primary font-medium shrink-0">
                            {row.person_name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                        <span>{row.formatted_date}</span>
                        <span>&bull;</span>
                        <span>{row.category}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={cn(
                          "font-bold",
                          row.type === "income"
                            ? "text-emerald-400"
                            : "text-foreground"
                        )}
                      >
                        {row.type === "income" ? "+" : "-"}
                        {formatCurrency(row.amount, currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Account Summary */}
            {selectedAccount && (
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/70 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Import Destination</span>
                <span className="font-semibold text-foreground">
                  {selectedAccount.name}
                </span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-border/50">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(2)}
                disabled={isSubmitting}
                className="gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                disabled={validRows.length === 0 || isSubmitting}
                onClick={handleExecuteImport}
                className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[160px]"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  `Confirm & Import ${validRows.length} Items`
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
