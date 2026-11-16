"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Account,
  Person,
  Transaction,
  TransactionType,
  UpdateTransactionDTO,
} from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BrandLogo } from "@/components/accounts/BrandLogo";
import { uploadReceiptAction } from "@/lib/actions/receipts";
import { getCurrentUserLocation, getMapUrl } from "@/lib/location";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Edit2,
  ExternalLink,
  Eye,
  ImageIcon,
  IndianRupee,
  Loader2,
  MapPin,
  Repeat,
  Tag,
  Trash2,
  User,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  accounts: Account[];
  people?: Person[];
  currency?: string;
  onUpdate: (dto: UpdateTransactionDTO) => Promise<void>;
  onDelete: (transaction: Transaction) => void;
  initialEditMode?: boolean;
}

function toDateTimeLocalString(dateStr: string): string {
  const date = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export function TransactionDetailSheet({
  isOpen,
  onClose,
  transaction,
  accounts,
  people = [],
  currency = "INR",
  onUpdate,
  onDelete,
  initialEditMode = false,
}: TransactionDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Full-size image lightbox modal
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Edit form state
  const [type, setType] = useState<TransactionType>("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [personId, setPersonId] = useState("");
  const [category, setCategory] = useState("General");
  const [dateTime, setDateTime] = useState("");

  // Receipt upload in edit mode
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

  // Location in edit mode (User-allowed feature)
  const [hasLocation, setHasLocation] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Sync state when transaction or isOpen changes
  useEffect(() => {
    if (transaction && isOpen) {
      setType(transaction.type);
      setTitle(transaction.title);
      setAmount(String(transaction.amount));
      setAccountId(transaction.account_id);
      setPersonId(transaction.person_id || "");
      setCategory(transaction.category || "General");
      setDateTime(toDateTimeLocalString(transaction.date));
      setReceiptUrl(transaction.receipt_url || null);

      if (transaction.location_name || transaction.latitude) {
        setHasLocation(true);
        setLocationName(transaction.location_name || "");
        setLatitude(transaction.latitude || null);
        setLongitude(transaction.longitude || null);
      } else {
        setHasLocation(false);
        setLocationName("");
        setLatitude(null);
        setLongitude(null);
      }

      setIsEditing(initialEditMode);
      setError(null);
      setLocationError(null);
    }
  }, [transaction, isOpen, initialEditMode]);

  if (!transaction) return null;

  const isIncome = transaction.type === "income";
  const isExpense = transaction.type === "expense";
  const txAccount =
    transaction.account || accounts.find((a) => a.id === transaction.account_id);
  const txPerson =
    transaction.person || people.find((p) => p.id === transaction.person_id);

  const formattedTime = new Date(transaction.date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleReceiptChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setError(res.error || "Failed to upload receipt");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to process receipt image");
    } finally {
      setIsUploadingReceipt(false);
    }
  };

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a title or description");
      return;
    }

    try {
      setIsSubmitting(true);
      await onUpdate({
        id: transaction.id,
        account_id: accountId || transaction.account_id,
        person_id: personId ? personId : null,
        title: title.trim(),
        amount: parsedAmount,
        type,
        category: category || "General",
        date: dateTime ? new Date(dateTime).toISOString() : transaction.date,
        receipt_url: receiptUrl || null,
        location_name: locationName.trim() ? locationName.trim() : null,
        latitude: hasLocation && latitude ? latitude : null,
        longitude: hasLocation && longitude ? longitude : null,
      });

      setIsEditing(false);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    onDelete(transaction);
    onClose();
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="bottom"
          className="sm:max-w-lg sm:mx-auto border-t border-border bg-card p-5 sm:p-6 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          <SheetHeader className="text-left pb-2 border-b border-border/50">
            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase",
                    isIncome
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : isExpense
                      ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                      : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {transaction.type}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(transaction.date)}
                </span>
              </div>
              {isEditing && (
                <span className="text-xs font-semibold text-primary">
                  Edit Mode
                </span>
              )}
            </div>
            <SheetTitle className="text-lg font-bold text-foreground mt-1">
              {isEditing ? "Edit Transaction" : transaction.title}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              {isEditing
                ? "Modify the transaction values below and save changes."
                : "Detailed ledger record breakdown"}
            </SheetDescription>
          </SheetHeader>

          {!isEditing ? (
            /* ================= VIEW DETAILS MODE ================= */
            <div className="space-y-4 pt-3">
              {/* Amount Banner */}
              <div className="p-4 rounded-2xl bg-secondary/50 border border-border/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                    Amount
                  </span>
                  <span
                    className={cn(
                      "text-2xl sm:text-3xl font-black tracking-tight",
                      isIncome && "text-emerald-600 dark:text-emerald-400",
                      isExpense && "text-rose-600 dark:text-rose-400",
                      !isIncome && !isExpense && "text-foreground"
                    )}
                  >
                    {isIncome ? "+" : isExpense ? "-" : ""}
                    {formatCurrency(transaction.amount, currency)}
                  </span>
                </div>
                <div
                  className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
                    isIncome
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                  )}
                >
                  {isIncome ? (
                    <ArrowDownLeft className="h-6 w-6" />
                  ) : (
                    <ArrowUpRight className="h-6 w-6" />
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="space-y-2.5">
                {/* Account info */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/70 text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5 text-primary" />
                    Account
                  </span>
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    {txAccount && (
                      <BrandLogo
                        type={txAccount.type}
                        institutionName={txAccount.institution_name}
                        name={txAccount.name}
                        size="sm"
                      />
                    )}
                    <span>{txAccount?.name || "Account"}</span>
                    {txAccount?.mask_last4 && (
                      <span className="font-mono text-muted-foreground text-[10px]">
                        •••• {txAccount.mask_last4}
                      </span>
                    )}
                  </div>
                </div>

                {/* Category info */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/70 text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-primary" />
                    Category
                  </span>
                  <span className="font-semibold text-foreground px-2 py-0.5 rounded-lg bg-secondary">
                    {transaction.category || "General"}
                  </span>
                </div>

                {/* Person Tag (if any) */}
                {txPerson && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/70 text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-primary" />
                      With Person
                    </span>
                    <div className="flex items-center gap-1.5 font-semibold text-primary">
                      <span>{txPerson.name}</span>
                      {txPerson.relationship && (
                        <span className="text-[10px] text-muted-foreground font-normal">
                          ({txPerson.relationship})
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Date & Exact Time */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/70 text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    Date & Time
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatDate(transaction.date)} at {formattedTime}
                  </span>
                </div>

                {/* Payment Location (if recorded) */}
                {(transaction.location_name || transaction.latitude) && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/70 text-xs">
                    <div className="min-w-0 pr-2">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        Payment Location
                      </span>
                      <span className="font-semibold text-foreground block truncate mt-0.5">
                        {transaction.location_name || "Location tagged"}
                      </span>
                      {transaction.latitude && transaction.longitude && (
                        <span className="text-[10px] text-muted-foreground block">
                          GPS: {transaction.latitude.toFixed(4)},{" "}
                          {transaction.longitude.toFixed(4)}
                        </span>
                      )}
                    </div>
                    <a
                      href={getMapUrl(
                        transaction.latitude,
                        transaction.longitude,
                        transaction.location_name
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-primary flex items-center gap-1 text-[11px] font-semibold shrink-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Map</span>
                    </a>
                  </div>
                )}

                {/* Attached Bill / Receipt Photo (if recorded) */}
                {transaction.receipt_url && (
                  <div className="p-3 rounded-2xl bg-background border border-border/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                        <Camera className="h-3.5 w-3.5 text-primary" />
                        Attached Bill / Receipt
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsLightboxOpen(true)}
                        className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View Full
                      </button>
                    </div>

                    <div
                      onClick={() => setIsLightboxOpen(true)}
                      className="relative h-44 w-full rounded-xl overflow-hidden border border-border/80 bg-secondary/30 cursor-pointer group"
                    >
                      <img
                        src={transaction.receipt_url}
                        alt="Bill Receipt"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold">
                        <Eye className="h-4 w-4" />
                        <span>Tap to zoom</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Action Buttons */}
              <div className="pt-2 grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="rounded-xl gap-2 font-semibold text-xs border-primary/40 text-primary hover:bg-primary/10"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Transaction
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDeleteClick}
                  className="rounded-xl gap-2 font-semibold text-xs border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            /* ================= EDIT MODE FORM ================= */
            <form onSubmit={handleSave} className="space-y-4 pt-2">
              {/* Type Toggle: Income vs Expense */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-secondary rounded-xl">
                <button
                  type="button"
                  onClick={() => setType("expense")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all",
                    type === "expense"
                      ? "bg-rose-500 text-white shadow-xs"
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
                      ? "bg-emerald-500 text-white shadow-xs"
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
                    required
                    className="w-full pl-9 pr-4 py-2.5 text-xl font-bold rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary shadow-xs text-foreground"
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
                  className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-xs text-foreground"
                />
              </div>

              {/* Date & Time Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-xs text-foreground"
                />
              </div>

              {/* Account Selector */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Account
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-xs text-foreground"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.institution_name || acc.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Person Tag */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-primary" />
                  With Person (Optional)
                </label>
                <select
                  value={personId}
                  onChange={(e) => setPersonId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-xs text-foreground"
                >
                  <option value="">None (Personal transaction)</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.relationship ? `(${p.relationship})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Selector */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-xs text-foreground"
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

              {/* ================= EDIT RECEIPT ================= */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5 text-primary" />
                  Bill / Receipt Photo
                </label>

                <input
                  ref={receiptInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleReceiptChange}
                  className="hidden"
                />

                {isUploadingReceipt ? (
                  <div className="p-3 rounded-xl border border-border bg-secondary/40 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Uploading new receipt photo...</span>
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
                        <button
                          type="button"
                          onClick={() => receiptInputRef.current?.click()}
                          className="text-[11px] text-primary hover:underline"
                        >
                          Replace image
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReceiptUrl(null)}
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

              {/* ================= EDIT LOCATION (USER ALLOWED) ================= */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    Payment Location (User Allowed)
                  </label>
                  {hasLocation && (
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

              {error && (
                <p className="text-xs text-rose-500 font-medium">{error}</p>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/50">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                >
                  Back to Details
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isUploadingReceipt}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[120px]"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>

      {/* Lightbox Dialog to view full-size receipt photo */}
      {transaction.receipt_url && (
        <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
          <DialogContent className="sm:max-w-xl p-3 bg-black/95 border-none">
            <DialogHeader className="p-2">
              <DialogTitle className="text-sm font-semibold text-white/90">
                Receipt &bull; {transaction.title}
              </DialogTitle>
            </DialogHeader>
            <div className="relative max-h-[80vh] flex items-center justify-center overflow-hidden rounded-xl">
              <img
                src={transaction.receipt_url}
                alt="Bill Receipt Full"
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
            <div className="p-2 flex items-center justify-between text-xs text-white/70">
              <span>{formatDate(transaction.date)}</span>
              <span>{formatCurrency(transaction.amount, currency)}</span>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
