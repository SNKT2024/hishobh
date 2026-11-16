"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Account, CreateTransactionDTO, Person, TransactionType } from "@/types";
import { uploadReceiptAction } from "@/lib/actions/receipts";
import { getCurrentUserLocation, getMapUrl } from "@/lib/location";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  ExternalLink,
  ImageIcon,
  IndianRupee,
  Loader2,
  MapPin,
  RotateCcw,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  people?: Person[];
  onAddTransaction: (dto: CreateTransactionDTO) => Promise<void>;
}

function toDateTimeLocalString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export function AddTransactionModal({
  isOpen,
  onClose,
  accounts,
  people = [],
  onAddTransaction,
}: AddTransactionModalProps) {
  const [type, setType] = useState<TransactionType>("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [personId, setPersonId] = useState<string>("");
  const [category, setCategory] = useState("General");
  const [dateTime, setDateTime] = useState<string>(() =>
    toDateTimeLocalString(new Date())
  );
  const [keepOpen, setKeepOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Receipt upload state
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

  // Location state (User-allowed feature)
  const [hasLocation, setHasLocation] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Quick date shortcuts
  const applyQuickDate = (type: "today" | "yesterday" | "pastMonth") => {
    const d = new Date();
    if (type === "yesterday") {
      d.setDate(d.getDate() - 1);
    } else if (type === "pastMonth") {
      d.setMonth(d.getMonth() - 1);
    }
    setDateTime(toDateTimeLocalString(d));
  };

  // Handle receipt image selection
  const handleReceiptFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploadingReceipt(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadReceiptAction(formData);
      if (res.success && res.url) {
        setReceiptUrl(res.url);
      } else {
        setError(res.error || "Failed to upload receipt photo");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to process receipt image");
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  // Handle requesting current location
  const handleRequestLocation = async () => {
    setLocationError(null);
    setIsLocating(true);
    try {
      const res = await getCurrentUserLocation();
      setLatitude(res.latitude);
      setLongitude(res.longitude);
      setLocationName(res.locationName);
      setHasLocation(true);
    } catch (err: any) {
      setLocationError(err?.message || "Could not retrieve location.");
      setHasLocation(false);
    } finally {
      setIsLocating(false);
    }
  };

  const handleClearLocation = () => {
    setHasLocation(false);
    setLocationName("");
    setLatitude(null);
    setLongitude(null);
    setLocationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessBanner(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a title or description");
      return;
    }

    const targetAccount = accountId || accounts[0]?.id;
    if (!targetAccount) {
      setError("No valid account found");
      return;
    }

    const transactionDate = dateTime
      ? new Date(dateTime).toISOString()
      : new Date().toISOString();

    try {
      setIsSubmitting(true);
      await onAddTransaction({
        account_id: targetAccount,
        person_id: personId ? personId : null,
        title: title.trim(),
        amount: parsedAmount,
        type,
        category: category || "General",
        date: transactionDate,
        receipt_url: receiptUrl || null,
        location_name: locationName.trim() ? locationName.trim() : null,
        latitude: hasLocation && latitude ? latitude : null,
        longitude: hasLocation && longitude ? longitude : null,
      });

      if (keepOpen) {
        setSuccessBanner(
          `Recorded ₹${parsedAmount.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          })} for "${title.trim()}". Enter the next entry:`
        );
        setTitle("");
        setAmount("");
        setReceiptUrl(null);
        handleClearLocation();
        if (receiptInputRef.current) receiptInputRef.current.value = "";
      } else {
        // Reset & close
        setTitle("");
        setAmount("");
        setPersonId("");
        setReceiptUrl(null);
        handleClearLocation();
        setDateTime(toDateTimeLocalString(new Date()));
        setSuccessBanner(null);
        if (receiptInputRef.current) receiptInputRef.current.value = "";
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to add transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setSuccessBanner(null);
          setError(null);
          setLocationError(null);
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            <span>New Transaction</span>
            {keepOpen && (
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                Rapid Entry Mode
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {accounts.length === 0 ? (
          <div className="py-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              You must add at least one account (bank, card, cash, or wallet)
              before recording transactions.
            </p>
            <a href="/accounts" className="inline-block">
              <Button className="rounded-xl gap-1.5">Go to Accounts</Button>
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Rapid Entry Success Banner */}
            {successBanner && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="font-medium">{successBanner}</span>
              </div>
            )}

            {/* Type Toggle: Income vs Expense */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-secondary rounded-xl">
              <button
                type="button"
                onClick={() => setType("expense")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all",
                  type === "expense"
                    ? "bg-rose-500 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ArrowUpRight className="h-4 w-4" />
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType("income")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all",
                  type === "income"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ArrowDownLeft className="h-4 w-4" />
                Income
              </button>
            </div>

            {/* Amount Input */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <IndianRupee className="h-5 w-5" />
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                  required
                  className="w-full pl-9 pr-4 py-2.5 text-xl font-bold rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary shadow-sm text-foreground"
                />
              </div>
            </div>

            {/* Title Input */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Title / Description
              </label>
              <input
                type="text"
                placeholder="e.g. Grocery Store, Client Payment"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm text-foreground"
              />
            </div>

            {/* Date & Time Picker with Backfill Shortcuts */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Date & Time
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => applyQuickDate("today")}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickDate("yesterday")}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Yesterday
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickDate("pastMonth")}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Past Month
                  </button>
                </div>
              </div>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm text-foreground"
              />
            </div>

            {/* Account Selector */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Account
              </label>
              <select
                value={accountId || accounts[0]?.id || ""}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm text-foreground"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.institution_name || acc.type.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Counterparty / Person Tag */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-primary" />
                  With Person (Optional)
                </label>
                {people.length === 0 && (
                  <a
                    href="/settings/people"
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    + Add people in Settings
                  </a>
                )}
              </div>
              <select
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm text-foreground"
              >
                <option value="">None (Personal transaction)</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.relationship ? `(${p.relationship})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Quick Selector */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm text-foreground"
              >
                <option value="General">General</option>
                <option value="Food & Dining">Food & Dining</option>
                <option value="Groceries">Groceries</option>
                <option value="Salary">Salary</option>
                <option value="Freelance">Freelance</option>
                <option value="Utilities">Utilities</option>
                <option value="Shopping">Shopping</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Transport">Transport</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Adjustment">Adjustment</option>
              </select>
            </div>

            {/* ================= ATTACH BILL / RECEIPT PHOTO ================= */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-primary" />
                Bill / Receipt Photo (Optional)
              </label>

              <input
                ref={receiptInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleReceiptFileChange}
                className="hidden"
              />

              {isUploadingReceipt ? (
                <div className="p-3 rounded-xl border border-border bg-secondary/40 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Attaching receipt photo...</span>
                </div>
              ) : receiptUrl ? (
                <div className="p-2.5 rounded-xl border border-border bg-secondary/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-12 w-12 rounded-lg overflow-hidden border border-border bg-background shrink-0">
                      <img
                        src={receiptUrl}
                        alt="Receipt"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 text-xs">
                      <span className="font-semibold text-foreground block truncate">
                        Receipt Attached
                      </span>
                      <span className="text-[11px] text-emerald-400 font-medium">
                        Photo ready to save
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptUrl(null);
                      if (receiptInputRef.current) receiptInputRef.current.value = "";
                    }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remove receipt"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => receiptInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-border hover:border-primary/50 bg-card hover:bg-secondary/40 text-xs font-medium text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-2"
                >
                  <Camera className="h-4 w-4 text-primary" />
                  <span>Attach Bill / Take Photo</span>
                </button>
              )}
            </div>

            {/* ================= PAYMENT LOCATION (USER ALLOWED & MANUAL ENTRY) ================= */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  Payment Location
                </label>
                {(hasLocation || locationName) && (
                  <button
                    type="button"
                    onClick={handleClearLocation}
                    className="text-[11px] text-muted-foreground hover:text-rose-400 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Flexible Location Row: Type manually OR click Detect */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => {
                      setLocationName(e.target.value);
                      if (e.target.value.trim()) {
                        setHasLocation(true);
                      }
                    }}
                    placeholder="Enter store/place name or click Detect..."
                    className="w-full h-10 px-3 pr-8 rounded-xl bg-card border border-border text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {(locationName || hasLocation) && (
                    <button
                      type="button"
                      onClick={handleClearLocation}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-rose-400"
                      title="Clear location"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRequestLocation}
                  disabled={isLocating}
                  className="h-10 px-3 rounded-xl gap-1.5 border-border hover:bg-secondary/60 text-xs shrink-0 font-medium"
                  title="Auto-detect current GPS/network location"
                >
                  {isLocating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  ) : (
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                  )}
                  <span>{isLocating ? "Detecting..." : "Detect"}</span>
                </Button>
              </div>

              {/* Detected Coordinates Feedback Badge */}
              {latitude && longitude && (
                <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3 w-3" />
                    GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </span>
                  <a
                    href={getMapUrl(latitude, longitude, locationName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                  >
                    <span>View Map</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              )}

              {locationError && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium px-1">
                  {locationError}
                </p>
              )}
            </div>

            {/* Notebook Backfill UX: Keep Open Checkbox */}
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/80 flex items-center gap-2.5">
              <input
                id="keepOpenCheckbox"
                type="checkbox"
                checked={keepOpen}
                onChange={(e) => setKeepOpen(e.target.checked)}
                className="h-4 w-4 rounded text-primary focus:ring-primary border-input cursor-pointer"
              />
              <label
                htmlFor="keepOpenCheckbox"
                className="text-xs font-medium text-foreground cursor-pointer select-none"
              >
                Keep open to add another{" "}
                <span className="text-muted-foreground">
                  (Rapid notebook backfill)
                </span>
              </label>
            </div>

            {error && (
              <p className="text-xs text-rose-500 font-medium">{error}</p>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
              >
                {keepOpen ? "Done" : "Cancel"}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isUploadingReceipt}
                className={cn(
                  "min-w-[120px]",
                  type === "expense"
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : keepOpen ? (
                  "Save & Add Next"
                ) : (
                  "Save Transaction"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
