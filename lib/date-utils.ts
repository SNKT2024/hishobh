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
