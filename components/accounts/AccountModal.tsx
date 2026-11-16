"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Account, AccountType, CreateAccountDTO } from "@/types";
import {
  INSTITUTION_PRESETS,
  matchInstitution,
} from "@/lib/constants/institutions";
import { BrandLogo } from "./BrandLogo";
import {
  Banknote,
  Building2,
  Calendar,
  Check,
  CreditCard,
  IndianRupee,
  Loader2,
  WalletCards,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountToEdit?: Account | null;
  onSave: (data: CreateAccountDTO, id?: string) => Promise<void>;
}

const COLOR_SWATCHES = [
  { label: "Lavender Purple", hex: "#7E30E1" },
  { label: "Orchid Pink", hex: "#E26EE5" },
  { label: "Royal Purple", hex: "#49108B" },
  { label: "Chase Blue", hex: "#1170cf" },
  { label: "BofA Red", hex: "#e31837" },
  { label: "PayPal Navy", hex: "#003087" },
  { label: "Emerald Cash", hex: "#10b981" },
  { label: "Mastercard Orange", hex: "#eb001b" },
  { label: "Titanium Slate", hex: "#475569" },
  { label: "Onyx Black", hex: "#1c1c1e" },
];

export function AccountModal({
  isOpen,
  onClose,
  accountToEdit,
  onSave,
}: AccountModalProps) {
  const [type, setType] = useState<AccountType>("bank");
  const [name, setName] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [openingBalanceDate, setOpeningBalanceDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [maskLast4, setMaskLast4] = useState("");
  const [color, setColor] = useState("#7E30E1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accountToEdit) {
      setType(accountToEdit.type);
      setName(accountToEdit.name);
      setInstitutionName(accountToEdit.institution_name || "");
      const bal =
        accountToEdit.opening_balance ?? accountToEdit.initial_balance ?? 0;
      setOpeningBalance(String(bal));
      setOpeningBalanceDate(
        accountToEdit.opening_balance_date
          ? new Date(accountToEdit.opening_balance_date)
              .toISOString()
              .slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      );
      setMaskLast4(accountToEdit.mask_last4 || "");
      setColor(accountToEdit.color || "#7E30E1");
    } else {
      setType("bank");
      setName("");
      setInstitutionName("");
      setOpeningBalance("0");
      setOpeningBalanceDate(new Date().toISOString().slice(0, 10));
      setMaskLast4("");
      setColor("#7E30E1");
    }
    setError(null);
  }, [accountToEdit, isOpen]);

  // Handle Preset Selection
  const handleSelectPreset = (presetName: string, presetColor: string) => {
    setInstitutionName(presetName);
    if (!name) setName(presetName);
    setColor(presetColor);
  };

  // Filter presets by selected type
  const availablePresets = INSTITUTION_PRESETS.filter((p) => p.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Account name is required");
      return;
    }

    const parsedBalance = parseFloat(openingBalance);
    const validBalance = isNaN(parsedBalance) ? 0 : parsedBalance;
    const anchorDate = openingBalanceDate
      ? new Date(openingBalanceDate).toISOString()
      : new Date().toISOString();

    try {
      setIsSubmitting(true);
      await onSave(
        {
          name: name.trim(),
          type,
          institution_name: institutionName.trim() || undefined,
          color: color || undefined,
          mask_last4: maskLast4.trim() ? maskLast4.trim().slice(-4) : undefined,
          initial_balance: validBalance,
          opening_balance: validBalance,
          opening_balance_date: anchorDate,
        },
        accountToEdit?.id
      );
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <BrandLogo
              type={type}
              institutionName={institutionName || name}
              size="sm"
            />
            {accountToEdit ? "Edit Account" : "Add New Account"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* 1. Visual Type Radio Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Account Type *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "bank" as AccountType, label: "Bank", icon: Building2 },
                { id: "card" as AccountType, label: "Card", icon: CreditCard },
                { id: "wallet" as AccountType, label: "Wallet", icon: WalletCards },
                { id: "cash" as AccountType, label: "Cash", icon: Banknote },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = type === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setType(item.id);
                      // default color
                      if (item.id === "cash") setColor("#10b981");
                      if (item.id === "bank") setColor("#1170cf");
                      if (item.id === "card") setColor("#1a1f71");
                      if (item.id === "wallet") setColor("#003087");
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center",
                      isSelected
                        ? "bg-primary/10 border-primary text-primary font-bold shadow-sm"
                        : "bg-card border-border/80 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 mb-1" />
                    <span className="text-xs">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Presets for this Type */}
          {availablePresets.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">
                Popular Brands & Institutions
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availablePresets.slice(0, 6).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.name, preset.color)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5",
                      institutionName === preset.name
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/70 border-border/60 hover:bg-secondary text-secondary-foreground"
                    )}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: preset.color }}
                    />
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Account Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Account Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Chase Main Checking, Everyday Cash"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!institutionName) {
                  const match = matchInstitution(e.target.value, type);
                  if (match) setColor(match.color);
                }
              }}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary shadow-sm text-foreground"
            />
          </div>

          {/* Institution / Brand Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Institution / Brand Name
            </label>
            <input
              type="text"
              placeholder="e.g. Chase, Apple, PayPal, State Bank of India"
              value={institutionName}
              onChange={(e) => {
                setInstitutionName(e.target.value);
                const match = matchInstitution(e.target.value, type);
                if (match) setColor(match.color);
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Opening Balance */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Opening Balance
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-input bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary shadow-sm text-foreground"
                />
              </div>
            </div>

            {/* Opening Balance Anchor Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3 text-primary" />
                As Of Date
              </label>
              <input
                type="date"
                value={openingBalanceDate}
                onChange={(e) => setOpeningBalanceDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm text-foreground"
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Historical notebook entries backdated prior to this anchor date will be tracked in analytics without deducting from your opening balance.
          </p>

          {/* Last 4 Digits (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Last 4 Digits (Optional)
            </label>
            <input
              type="text"
              maxLength={4}
              placeholder="e.g. 4821"
              value={maskLast4}
              onChange={(e) => setMaskLast4(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary shadow-sm text-foreground"
            />
          </div>

          {/* Card Accent Color */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              Card Color Accent
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch.hex}
                  type="button"
                  onClick={() => setColor(swatch.hex)}
                  title={swatch.label}
                  className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center transition-transform",
                    color === swatch.hex
                      ? "ring-2 ring-primary ring-offset-2 scale-110"
                      : "hover:scale-105"
                  )}
                  style={{ backgroundColor: swatch.hex }}
                >
                  {color === swatch.hex && (
                    <Check className="h-3.5 w-3.5 text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-500 font-medium">{error}</p>
          )}

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-border/50">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : accountToEdit ? (
                "Save Changes"
              ) : (
                "Create Account"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}