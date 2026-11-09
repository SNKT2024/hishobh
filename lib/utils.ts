import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines Tailwind classes with clsx and twMerge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Currency formatter helper
 */
export function formatCurrency(
  amount: number,
  currency: string = "INR",
  locale: string = "en-IN"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Date formatter helper
 */
export function formatDate(
  date: Date | string | number,
  locale: string = "en-IN",
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return new Intl.DateTimeFormat(
    locale,
    options || {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(d);
}
