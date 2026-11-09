import { AccountType } from "@/types";

export interface InstitutionPreset {
  id: string;
  name: string;
  type: AccountType;
  color: string;
  badge?: string;
  keywords: string[];
}

export const INSTITUTION_PRESETS: InstitutionPreset[] = [
  // Banks
  {
    id: "chase",
    name: "Chase Bank",
    type: "bank",
    color: "#1170cf",
    badge: "Chase",
    keywords: ["chase", "jpmorgan", "checking"],
  },
  {
    id: "bofa",
    name: "Bank of America",
    type: "bank",
    color: "#e31837",
    badge: "BofA",
    keywords: ["bofa", "bank of america", "merrill"],
  },
  {
    id: "wells-fargo",
    name: "Wells Fargo",
    type: "bank",
    color: "#d71e28",
    badge: "Wells",
    keywords: ["wells", "wells fargo", "wf"],
  },
  {
    id: "citi",
    name: "Citibank",
    type: "bank",
    color: "#002d72",
    badge: "Citi",
    keywords: ["citi", "citibank"],
  },
  {
    id: "capital-one",
    name: "Capital One",
    type: "bank",
    color: "#d03027",
    badge: "CapOne",
    keywords: ["capital one", "capone", "360"],
  },
  {
    id: "hdfc",
    name: "HDFC Bank",
    type: "bank",
    color: "#004c8f",
    badge: "HDFC",
    keywords: ["hdfc", "hdfc bank"],
  },
  {
    id: "sbi",
    name: "State Bank of India (SBI)",
    type: "bank",
    color: "#224099",
    badge: "SBI",
    keywords: ["sbi", "state bank of india"],
  },
  {
    id: "barclays",
    name: "Barclays",
    type: "bank",
    color: "#00aeef",
    badge: "Barclays",
    keywords: ["barclays"],
  },
  {
    id: "hsbc",
    name: "HSBC",
    type: "bank",
    color: "#db0011",
    badge: "HSBC",
    keywords: ["hsbc"],
  },

  // Wallets
  {
    id: "apple-pay",
    name: "Apple Pay / Cash",
    type: "wallet",
    color: "#1c1c1e",
    badge: "Apple",
    keywords: ["apple", "apple pay", "apple cash"],
  },
  {
    id: "google-pay",
    name: "Google Pay",
    type: "wallet",
    color: "#4285f4",
    badge: "GPay",
    keywords: ["google", "google pay", "gpay"],
  },
  {
    id: "paypal",
    name: "PayPal",
    type: "wallet",
    color: "#003087",
    badge: "PayPal",
    keywords: ["paypal", "pypl"],
  },
  {
    id: "venmo",
    name: "Venmo",
    type: "wallet",
    color: "#008cff",
    badge: "Venmo",
    keywords: ["venmo"],
  },
  {
    id: "cash-app",
    name: "Cash App",
    type: "wallet",
    color: "#00d632",
    badge: "CashApp",
    keywords: ["cash app", "square", "cashapp"],
  },
  {
    id: "paytm",
    name: "Paytm",
    type: "wallet",
    color: "#002970",
    badge: "Paytm",
    keywords: ["paytm"],
  },

  // Cards
  {
    id: "visa",
    name: "Visa Card",
    type: "card",
    color: "#1a1f71",
    badge: "VISA",
    keywords: ["visa"],
  },
  {
    id: "mastercard",
    name: "Mastercard",
    type: "card",
    color: "#eb001b",
    badge: "Mastercard",
    keywords: ["mastercard", "mc"],
  },
  {
    id: "amex",
    name: "American Express",
    type: "card",
    color: "#006fcf",
    badge: "AMEX",
    keywords: ["amex", "american express"],
  },
  {
    id: "apple-card",
    name: "Apple Card",
    type: "card",
    color: "#475569",
    badge: "Titanium",
    keywords: ["apple card", "goldman"],
  },

  // Cash
  {
    id: "physical-cash",
    name: "Physical Cash",
    type: "cash",
    color: "#10b981",
    badge: "Cash",
    keywords: ["cash", "wallet", "paper money", "pocket money"],
  },
  {
    id: "emergency-cash",
    name: "Emergency Cash Reserve",
    type: "cash",
    color: "#059669",
    badge: "Safe",
    keywords: ["emergency", "safe", "reserve"],
  },
];

/**
 * Automatically match institution preset by name or query
 */
export function matchInstitution(query: string, type?: AccountType): InstitutionPreset | null {
  if (!query) return null;
  const q = query.toLowerCase().trim();

  const filtered = type
    ? INSTITUTION_PRESETS.filter((p) => p.type === type)
    : INSTITUTION_PRESETS;

  return (
    filtered.find(
      (p) =>
        p.id === q ||
        p.name.toLowerCase() === q ||
        p.keywords.some((k) => q.includes(k) || k.includes(q))
    ) || null
  );
}
