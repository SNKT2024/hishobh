"use server";

import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getComparisonTimeframeRange,
  formatDateRangeLabel,
} from "@/lib/date-utils";
import {
  Account,
  AnalyticsData,
  AnalyticsSummaryMetrics,
  CashFlowTrendPoint,
  CategoryAnalytics,
  Person,
  PersonSpendingAnalytics,
  AccountUsageAnalytics,
  TimeframeOption,
  Transaction,
} from "@/types";
import { getAccountsAction } from "./accounts";
import { getPeopleAction } from "./people";

// Category vibrant color palette
const CATEGORY_COLORS: Record<string, string> = {
  "Food & Dining": "#f97316", // Orange
  Groceries: "#10b981", // Emerald
  Shopping: "#ec4899", // Pink
  Utilities: "#3b82f6", // Blue
  Bills: "#3b82f6",
  Transport: "#8b5cf6", // Violet
  Entertainment: "#f59e0b", // Amber
  Healthcare: "#ef4444", // Red
  Salary: "#059669", // Green
  Freelance: "#0d9488", // Teal
  General: "#64748b", // Slate
};

function getCategoryColor(category: string | null | undefined, index: number): string {
  if (category && CATEGORY_COLORS[category]) {
    return CATEGORY_COLORS[category];
  }
  const fallbackPalette = [
    "#f97316",
    "#10b981",
    "#ec4899",
    "#3b82f6",
    "#8b5cf6",
    "#f59e0b",
    "#06b6d4",
    "#ef4444",
    "#64748b",
  ];
  return fallbackPalette[index % fallbackPalette.length];
}

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      key &&
      !url.includes("your-project-ref") &&
      !key.includes("eyJhbGciOi...")
  );
}

// Demo fallback transactions for rich preview when local DB is empty
const DEMO_ANALYTICS_TRANSACTIONS: Array<{
  id: string;
  account_id: string;
  person_id?: string | null;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  daysAgo: number;
}> = [
  // Current Period (0 - 30 days ago)
  { id: "tx-1", account_id: "acc-bank-1", title: "Monthly Tech Salary", amount: 4850, type: "income", category: "Salary", daysAgo: 2 },
  { id: "tx-2", account_id: "acc-bank-1", person_id: "p-1", title: "Dinner & Drinks Split", amount: 165, type: "expense", category: "Food & Dining", daysAgo: 3 },
  { id: "tx-3", account_id: "acc-card-3", title: "Whole Foods Market", amount: 285, type: "expense", category: "Groceries", daysAgo: 5 },
  { id: "tx-4", account_id: "acc-wallet-4", person_id: "p-2", title: "Concert Tickets", amount: 220, type: "expense", category: "Entertainment", daysAgo: 8 },
  { id: "tx-5", account_id: "acc-bank-1", title: "Electricity & Gigabit Internet", amount: 195, type: "expense", category: "Utilities", daysAgo: 10 },
  { id: "tx-6", account_id: "acc-card-3", title: "Nike Running Gear", amount: 140, type: "expense", category: "Shopping", daysAgo: 12 },
  { id: "tx-7", account_id: "acc-cash-2", person_id: "p-3", title: "Team Lunch Outing", amount: 85, type: "expense", category: "Food & Dining", daysAgo: 14 },
  { id: "tx-8", account_id: "acc-wallet-4", title: "UI/UX Freelance Design", amount: 950, type: "income", category: "Freelance", daysAgo: 16 },
  { id: "tx-9", account_id: "acc-card-3", title: "Metro Transit Card Reload", amount: 90, type: "expense", category: "Transport", daysAgo: 18 },
  { id: "tx-10", account_id: "acc-bank-1", person_id: "p-1", title: "Weekend Road Trip Fuel & Food", amount: 210, type: "expense", category: "Food & Dining", daysAgo: 21 },
  { id: "tx-11", account_id: "acc-cash-2", title: "Pharmacy & Vitamins", amount: 65, type: "expense", category: "Healthcare", daysAgo: 23 },
  { id: "tx-12", account_id: "acc-card-3", title: "Trader Joe's Pantry Haul", amount: 180, type: "expense", category: "Groceries", daysAgo: 26 },

  // Previous Period (31 - 60 days ago) for Comparison Metrics
  { id: "tx-p1", account_id: "acc-bank-1", title: "Prior Month Salary", amount: 4850, type: "income", category: "Salary", daysAgo: 33 },
  { id: "tx-p2", account_id: "acc-card-3", title: "Prior Groceries", amount: 490, type: "expense", category: "Groceries", daysAgo: 35 },
  { id: "tx-p3", account_id: "acc-bank-1", title: "Prior Utilities", amount: 210, type: "expense", category: "Utilities", daysAgo: 40 },
  { id: "tx-p4", account_id: "acc-card-3", title: "Prior Shopping", amount: 350, type: "expense", category: "Shopping", daysAgo: 45 },
  { id: "tx-p5", account_id: "acc-cash-2", person_id: "p-1", title: "Prior Outing with Alex", amount: 140, type: "expense", category: "Food & Dining", daysAgo: 50 },
];

/**
 * Builds trend data buckets (daily, weekly, or monthly) across the timeframe.
 */
function buildTrendSeries(
  timeframe: TimeframeOption,
  startDate: Date,
  endDate: Date,
  transactions: Transaction[]
): CashFlowTrendPoint[] {
  const points: CashFlowTrendPoint[] = [];

  if (timeframe === "weekly") {
    // 7 Daily bars (Mon - Sun)
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const currentDay = new Date(startDate);

    for (let i = 0; i < 7; i++) {
      const dayDateStr = currentDay.toISOString().split("T")[0];
      const label = dayNames[i];

      const dayTxs = transactions.filter((t) => {
        const tDate = new Date(t.date).toISOString().split("T")[0];
        return tDate === dayDateStr;
      });

      const income = dayTxs
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const expense = dayTxs
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      points.push({
        label,
        date: dayDateStr,
        income,
        expense,
        net: income - expense,
      });

      currentDay.setDate(currentDay.getDate() + 1);
    }
  } else if (timeframe === "monthly") {
    // 4-5 Weekly intervals for current month
    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const intervals = [
      { label: "W1 (1-7)", startDay: 1, endDay: 7 },
      { label: "W2 (8-14)", startDay: 8, endDay: 14 },
      { label: "W3 (15-21)", startDay: 15, endDay: 21 },
      { label: "W4 (22-28)", startDay: 22, endDay: 28 },
      { label: "W5 (29+)", startDay: 29, endDay: 31 },
    ];

    for (const interval of intervals) {
      if (interval.startDay > totalDays && interval.startDay > 28) continue;

      const intervalTxs = transactions.filter((t) => {
        const d = new Date(t.date).getDate();
        return d >= interval.startDay && d <= interval.endDay;
      });

      const income = intervalTxs
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const expense = intervalTxs
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      points.push({
        label: interval.label,
        date: `Day ${interval.startDay}-${interval.endDay}`,
        income,
        expense,
        net: income - expense,
      });
    }
  } else {
    // Month-by-month bars for Quarterly, 6 Months, or Yearly
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const startMonth = startDate.getMonth();
    const startYear = startDate.getFullYear();
    const endMonth = endDate.getMonth();
    const endYear = endDate.getFullYear();

    const monthCount =
      (endYear - startYear) * 12 + (endMonth - startMonth) + 1;

    for (let i = 0; i < Math.max(1, monthCount); i++) {
      const d = new Date(startYear, startMonth + i, 1);
      const mIdx = d.getMonth();
      const y = d.getFullYear();
      const label = `${monthNames[mIdx]} '${String(y).slice(-2)}`;

      const monthTxs = transactions.filter((t) => {
        const td = new Date(t.date);
        return td.getMonth() === mIdx && td.getFullYear() === y;
      });

      const income = monthTxs
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const expense = monthTxs
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      points.push({
        label,
        date: d.toISOString(),
        income,
        expense,
        net: income - expense,
      });
    }
  }

  return points;
}

/**
 * Main Server Action to fetch analytics and aggregated stats.
 * Strict Isolation Guardrail: Completely excludes records from `debts` / `lend_borrow`.
 */
export async function getAnalyticsData(
  timeframe: TimeframeOption = "monthly",
  selectedAccountId: string = "all"
): Promise<AnalyticsData> {
  const { userId } = await auth();
  const { current, previous } = getComparisonTimeframeRange(timeframe);

  let accounts: Account[] = [];
  let people: Person[] = [];
  let currentTxs: Transaction[] = [];
  let prevTxs: Transaction[] = [];

  const supabaseReady = isSupabaseConfigured() && Boolean(userId);

  if (supabaseReady) {
    try {
      const supabase = await createServerSupabaseClient();

      // Query current period transactions (income and expense ONLY)
      let currentQuery = supabase
        .from("transactions")
        .select(
          `id, user_id, account_id, person_id, title, amount, type, category, date, created_at,
           account:accounts(id, name, type, institution_name, logo_url, color),
           person:people(id, name, relationship, avatar_url)`
        )
        .eq("user_id", userId!)
        .in("type", ["income", "expense"])
        .gte("date", current.startDate.toISOString())
        .lte("date", current.endDate.toISOString())
        .order("date", { ascending: false });

      if (selectedAccountId !== "all") {
        currentQuery = currentQuery.eq("account_id", selectedAccountId);
      }

      // Query previous period transactions for comparison calculation
      let prevQuery = supabase
        .from("transactions")
        .select("id, amount, type, date")
        .eq("user_id", userId!)
        .in("type", ["income", "expense"])
        .gte("date", previous.startDate.toISOString())
        .lte("date", previous.endDate.toISOString());

      if (selectedAccountId !== "all") {
        prevQuery = prevQuery.eq("account_id", selectedAccountId);
      }

      // Execute ALL 4 queries in PARALLEL!
      const [accList, pplList, currRes, prevRes] = await Promise.all([
        getAccountsAction(),
        getPeopleAction(),
        currentQuery,
        prevQuery,
      ]);

      accounts = accList;
      people = pplList;

      if (accounts.length === 0) {
        return {
          timeframe,
          date_range_label: formatDateRangeLabel(current.startDate, current.endDate),
          selectedAccountId,
          summary: {
            total_spent: 0,
            previous_total_spent: 0,
            spent_change_percentage: 0,
            total_earned: 0,
            previous_total_earned: 0,
            earned_change_percentage: 0,
            net_savings_rate: 0,
            top_spending_category: null,
          },
          trends: buildTrendSeries(timeframe, current.startDate, current.endDate, []),
          categories: [],
          people_spending: [],
          account_distribution: [],
          accounts: [],
          people,
        };
      }

      if (!currRes.error && currRes.data && currRes.data.length > 0) {
        currentTxs = currRes.data as unknown as Transaction[];
      }
      if (!prevRes.error && prevRes.data) {
        prevTxs = prevRes.data as unknown as Transaction[];
      }
    } catch (err) {
      console.warn("Failed fetching from Supabase, using demo analytics data:", err);
    }
  }

  // Fallback to fetch accounts & people if offline/demo
  if (accounts.length === 0) {
    accounts = await getAccountsAction();
    people = await getPeopleAction();
  }

  // Fallback to rich demo data if no records found or offline/unconfigured
  if (currentTxs.length === 0) {
    const now = Date.now();
    const demoMapped: Transaction[] = DEMO_ANALYTICS_TRANSACTIONS.map((dt) => {
      const acc = accounts.find((a) => a.id === dt.account_id) || accounts[0];
      const pers = dt.person_id ? people.find((p) => p.id === dt.person_id) : null;
      const txDate = new Date(now - dt.daysAgo * 86400000).toISOString();

      return {
        id: dt.id,
        user_id: userId || "demo-user",
        account_id: dt.account_id,
        person_id: dt.person_id,
        title: dt.title,
        amount: dt.amount,
        type: dt.type,
        category: dt.category,
        date: txDate,
        created_at: txDate,
        account: acc
          ? {
              id: acc.id,
              name: acc.name,
              type: acc.type,
              institution_name: acc.institution_name,
            }
          : null,
        person: pers
          ? {
              id: pers.id,
              name: pers.name,
              relationship: pers.relationship,
            }
          : null,
      };
    });

    // Filter by timeframe and account
    currentTxs = demoMapped.filter((t) => {
      const d = new Date(t.date);
      const inTime = d >= current.startDate && d <= current.endDate;
      const inAcc = selectedAccountId === "all" || t.account_id === selectedAccountId;
      return inTime && inAcc;
    });

    prevTxs = demoMapped.filter((t) => {
      const d = new Date(t.date);
      const inTime = d >= previous.startDate && d <= previous.endDate;
      const inAcc = selectedAccountId === "all" || t.account_id === selectedAccountId;
      return inTime && inAcc;
    });

    // If still empty (e.g. for weekly filter at beginning of week), ensure at least a few demo transactions show
    if (currentTxs.length === 0) {
      currentTxs = demoMapped.slice(0, 7);
    }
  }

  // 1. Metric Summaries
  const totalSpent = currentTxs
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const prevTotalSpent = prevTxs
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalEarned = currentTxs
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const prevTotalEarned = prevTxs
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const spentChangePercentage =
    prevTotalSpent > 0
      ? Math.round(((totalSpent - prevTotalSpent) / prevTotalSpent) * 100)
      : totalSpent > 0
      ? 100
      : 0;

  const earnedChangePercentage =
    prevTotalEarned > 0
      ? Math.round(((totalEarned - prevTotalEarned) / prevTotalEarned) * 100)
      : totalEarned > 0
      ? 100
      : 0;

  const netSavingsRate =
    totalEarned > 0
      ? Math.max(0, Math.round(((totalEarned - totalSpent) / totalEarned) * 100))
      : 0;

  // 2. Category Breakdown (Expenses strictly)
  const categoryMap = new Map<string, { amount: number; count: number }>();
  currentTxs
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const cat = t.category || "General";
      const existing = categoryMap.get(cat) || { amount: 0, count: 0 };
      categoryMap.set(cat, {
        amount: existing.amount + Number(t.amount),
        count: existing.count + 1,
      });
    });

  const categories: CategoryAnalytics[] = Array.from(categoryMap.entries())
    .map(([category, { amount, count }], idx) => ({
      category,
      amount,
      count,
      percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
      color: getCategoryColor(category, idx),
    }))
    .sort((a, b) => b.amount - a.amount);

  const topCategory =
    categories.length > 0
      ? {
          name: categories[0].category,
          amount: categories[0].amount,
          percentage: categories[0].percentage,
        }
      : null;

  const summary: AnalyticsSummaryMetrics = {
    total_spent: totalSpent,
    previous_total_spent: prevTotalSpent,
    spent_change_percentage: spentChangePercentage,
    total_earned: totalEarned,
    previous_total_earned: prevTotalEarned,
    earned_change_percentage: earnedChangePercentage,
    net_savings_rate: netSavingsRate,
    top_spending_category: topCategory,
  };

  // 3. Cash Flow Trends (Daily / Weekly / Monthly intervals)
  const trends = buildTrendSeries(
    timeframe,
    current.startDate,
    current.endDate,
    currentTxs
  );

  // 4. "Spent with People" Analytics (Social Spending Breakdown)
  const peopleMap = new Map<string, { amount: number; count: number }>();
  currentTxs
    .filter((t) => t.type === "expense" && t.person_id)
    .forEach((t) => {
      const pId = t.person_id!;
      const existing = peopleMap.get(pId) || { amount: 0, count: 0 };
      peopleMap.set(pId, {
        amount: existing.amount + Number(t.amount),
        count: existing.count + 1,
      });
    });

  const peopleSpending: PersonSpendingAnalytics[] = Array.from(
    peopleMap.entries()
  )
    .map(([personId, { amount, count }]) => {
      const personObj = people.find((p) => p.id === personId);
      return {
        person_id: personId,
        name: personObj?.name || "Friend",
        relationship: personObj?.relationship || "Contact",
        avatar_url: personObj?.avatar_url || null,
        total_amount: amount,
        transaction_count: count,
        percentage_of_total_expense:
          totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
      };
    })
    .sort((a, b) => b.total_amount - a.total_amount);

  // 5. Account Payment Distribution
  const accountMap = new Map<string, { amount: number; count: number }>();
  currentTxs
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const accId = t.account_id;
      const existing = accountMap.get(accId) || { amount: 0, count: 0 };
      accountMap.set(accId, {
        amount: existing.amount + Number(t.amount),
        count: existing.count + 1,
      });
    });

  const accountDistribution: AccountUsageAnalytics[] = Array.from(
    accountMap.entries()
  )
    .map(([accountId, { amount, count }]) => {
      const accObj = accounts.find((a) => a.id === accountId);
      return {
        account_id: accountId,
        name: accObj?.name || "Account",
        type: accObj?.type || "bank",
        institution_name: accObj?.institution_name || null,
        logo_url: accObj?.logo_url || null,
        color: accObj?.color || "#6366f1",
        total_spent: amount,
        transaction_count: count,
        percentage:
          totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
      };
    })
    .sort((a, b) => b.total_spent - a.total_spent);

  return {
    timeframe,
    selectedAccountId,
    date_range_label: formatDateRangeLabel(current.startDate, current.endDate),
    summary,
    trends,
    categories,
    people_spending: peopleSpending,
    account_distribution: accountDistribution,
    accounts,
    people,
  };
}
