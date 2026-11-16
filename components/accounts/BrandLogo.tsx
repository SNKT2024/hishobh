"use client";

import { AccountType } from "@/types";
import { matchInstitution } from "@/lib/constants/institutions";
import {
  Banknote,
  Building2,
  CreditCard,
  WalletCards,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  type: AccountType;
  institutionName?: string | null;
  name?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function BrandLogo({
  type,
  institutionName,
  name,
  className,
  size = "md",
}: BrandLogoProps) {
  const query = institutionName || name || "";
  const preset = matchInstitution(query, type);

  const sizeClasses = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-12 w-12 text-base",
  }[size];

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-6 w-6",
  }[size];

  // Specific Brand SVG Badges / Logos
  if (preset) {
    switch (preset.id) {
      case "chase":
        return (
          <div
            className={cn(
              "rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0 select-none",
              sizeClasses,
              className
            )}
            style={{ backgroundColor: preset.color }}
            title="Chase Bank"
          >
            <span className="tracking-tighter font-extrabold text-[11px] sm:text-xs">
              JPM
            </span>
          </div>
        );

      case "bofa":
        return (
          <div
            className={cn(
              "rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0 select-none",
              sizeClasses,
              className
            )}
            style={{ backgroundColor: preset.color }}
            title="Bank of America"
          >
            <span className="tracking-tighter font-extrabold text-[10px] sm:text-[11px]">
              BofA
            </span>
          </div>
        );

      case "paypal":
        return (
          <div
            className={cn(
              "rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0 select-none italic",
              sizeClasses,
              className
            )}
            style={{ backgroundColor: preset.color }}
            title="PayPal"
          >
            <span className="font-black text-sm">P</span>
          </div>
        );

      case "apple-pay":
      case "apple-card":
        return (
          <div
            className={cn(
              "rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0 select-none",
              sizeClasses,
              className
            )}
            style={{ backgroundColor: preset.color }}
            title="Apple"
          >
            <svg
              className={iconSizes}
              viewBox="0 0 170 170"
              fill="currentColor"
            >
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.71-7.97-12.03-14.68-6.19-9.64-10.9-20.27-14.14-31.9-3.24-11.63-4.86-22.38-4.86-32.25 0-14.33 3.65-26.04 10.94-35.13 7.3-9.09 16.48-13.75 27.56-13.98 5.76 0 12.01 1.49 18.75 4.46 6.74 2.97 10.74 4.52 12.02 4.64 1.8.12 5.92-1.57 12.38-5.07 6.46-3.5 12.44-5.08 17.95-4.75 13.68.79 24.38 5.64 32.11 14.54-12.01 7.27-17.89 17.26-17.65 29.98.24 10.15 4.19 18.66 11.85 25.53 7.66 6.87 16.79 10.74 27.39 11.61-2.22 6.84-4.88 13.78-7.97 20.82zM119.22 33.64c0-7.72 2.76-14.93 8.28-21.63 5.53-6.7 12.28-11.05 20.25-13.06-.99 7.94-4.04 15.17-9.16 21.68-5.11 6.51-11.59 10.84-19.37 13.01z" />
            </svg>
          </div>
        );

      case "google-pay":
        return (
          <div
            className={cn(
              "rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0 select-none",
              sizeClasses,
              className
            )}
            style={{ backgroundColor: preset.color }}
            title="Google Pay"
          >
            <span className="font-extrabold text-xs">G</span>
          </div>
        );

      case "visa":
        return (
          <div
            className={cn(
              "rounded-xl flex items-center justify-center font-extrabold text-white shadow-sm shrink-0 select-none tracking-tighter italic",
              sizeClasses,
              className
            )}
            style={{ backgroundColor: preset.color }}
            title="Visa"
          >
            <span className="text-[10px] sm:text-[11px] font-black">VISA</span>
          </div>
        );

      case "mastercard":
        return (
          <div
            className={cn(
              "rounded-xl flex items-center justify-center shadow-sm shrink-0 select-none relative overflow-hidden bg-slate-900",
              sizeClasses,
              className
            )}
            title="Mastercard"
          >
            <div className="flex -space-x-1.5 items-center">
              <div className="h-3.5 w-3.5 rounded-full bg-[#eb001b] opacity-90" />
              <div className="h-3.5 w-3.5 rounded-full bg-[#f79e1b] opacity-90" />
            </div>
          </div>
        );

      case "amex":
        return (
          <div
            className={cn(
              "rounded-xl flex items-center justify-center font-extrabold text-white shadow-sm shrink-0 select-none",
              sizeClasses,
              className
            )}
            style={{ backgroundColor: preset.color }}
            title="American Express"
          >
            <span className="text-[9px] font-black tracking-tighter">AMEX</span>
          </div>
        );

      case "physical-cash":
      case "emergency-cash":
        return (
          <div
            className={cn(
              "rounded-xl flex items-center justify-center text-white shadow-sm shrink-0",
              sizeClasses,
              className
            )}
            style={{ backgroundColor: preset.color }}
            title="Cash"
          >
            <Banknote className={iconSizes} />
          </div>
        );

      default:
        return (
          <div
            className={cn(
              "rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0 select-none",
              sizeClasses,
              className
            )}
            style={{ backgroundColor: preset.color }}
            title={preset.name}
          >
            <span className="text-[10px] font-bold uppercase truncate px-1">
              {preset.badge || preset.name.slice(0, 3)}
            </span>
          </div>
        );
    }
  }

  // Fallbacks by Account Type
  switch (type) {
    case "bank":
      return (
        <div
          className={cn(
            "rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20",
            sizeClasses,
            className
          )}
        >
          <Building2 className={iconSizes} />
        </div>
      );
    case "card":
      return (
        <div
          className={cn(
            "rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20",
            sizeClasses,
            className
          )}
        >
          <CreditCard className={iconSizes} />
        </div>
      );
    case "wallet":
      return (
        <div
          className={cn(
            "rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20",
            sizeClasses,
            className
          )}
        >
          <WalletCards className={iconSizes} />
        </div>
      );
    case "cash":
    default:
      return (
        <div
          className={cn(
            "rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20",
            sizeClasses,
            className
          )}
        >
          <Banknote className={iconSizes} />
        </div>
      );
  }
}
