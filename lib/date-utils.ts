import { TimeframeOption } from "@/types";

/**
 * Returns ISO strings for the start and end of the chosen timeframe.
 */
export function getTimeframeRange(timeframe: TimeframeOption): {
  startDate: Date;
  endDate: Date;
} {
  const now = new Date();
  const endDate = new Date(now);
  let startDate = new Date(now);

  switch (timeframe) {
    case "weekly": {
      // Beginning of the current week (Monday)
      const day = now.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      startDate.setDate(now.getDate() + diffToMonday);
      startDate.setHours(0, 0, 0, 0);
      break;
    }
    case "monthly": {
      // 1st of current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
    }
    case "quarterly": {
      // Last 3 months
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate(), 0, 0, 0, 0);
      break;
    }
    case "6months": {
      // Last 6 months
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate(), 0, 0, 0, 0);
      break;
    }
    case "yearly": {
      // 1st of current year
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      break;
    }
    default: {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    }
  }

  return { startDate, endDate };
}

/**
 * Returns both the current and immediate prior timeframe ranges for comparison analytics.
 */
export function getComparisonTimeframeRange(timeframe: TimeframeOption): {
  current: { startDate: Date; endDate: Date };
  previous: { startDate: Date; endDate: Date };
} {
  const { startDate, endDate } = getTimeframeRange(timeframe);
  const now = new Date();

  let prevStart: Date;
  let prevEnd: Date;

  switch (timeframe) {
    case "weekly": {
      prevStart = new Date(startDate);
      prevStart.setDate(prevStart.getDate() - 7);
      prevEnd = new Date(endDate);
      prevEnd.setDate(prevEnd.getDate() - 7);
      break;
    }
    case "monthly": {
      // Previous calendar month
      const prevMonth = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1, 0, 0, 0, 0);
      prevStart = prevMonth;
      // Last day of previous month
      prevEnd = new Date(startDate.getFullYear(), startDate.getMonth(), 0, 23, 59, 59, 999);
      break;
    }
    case "quarterly": {
      const diffMs = endDate.getTime() - startDate.getTime();
      prevEnd = new Date(startDate.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - diffMs);
      break;
    }
    case "6months": {
      const diffMs = endDate.getTime() - startDate.getTime();
      prevEnd = new Date(startDate.getTime() - 1);
      prevStart = new Date(prevEnd.getTime() - diffMs);
      break;
    }
    case "yearly": {
      prevStart = new Date(startDate.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      prevEnd = new Date(startDate.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      break;
    }
    default: {
      const prevMonth = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1, 0, 0, 0, 0);
      prevStart = prevMonth;
      prevEnd = new Date(startDate.getFullYear(), startDate.getMonth(), 0, 23, 59, 59, 999);
    }
  }

  return {
    current: { startDate, endDate },
    previous: { startDate: prevStart, endDate: prevEnd },
  };
}

/**
 * Returns a clean readable date range string, e.g. "Nov 1 – Nov 30, 2026"
 */
export function formatDateRangeLabel(startDate: Date, endDate: Date): string {
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const yearOptions: Intl.DateTimeFormatOptions = { year: "numeric" };

  const startStr = startDate.toLocaleDateString("en-US", options);
  const endStr = endDate.toLocaleDateString("en-US", options);
  const yearStr = endDate.toLocaleDateString("en-US", yearOptions);

  return `${startStr} – ${endStr}, ${yearStr}`;
}
