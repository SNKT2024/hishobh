import { currentUser } from "@clerk/nextjs/server";
import { getAnalyticsData } from "@/lib/actions/analytics";
import { AnalyticsClient } from "@/components/analytics/AnalyticsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Analytics & Insights",
  description: "Deep visual analytics of spending, cash flow, category breakdowns, and social spending.",
};

export default async function StatsPage() {
  const user = await currentUser();
  const initialData = await getAnalyticsData("monthly", "all");

  return (
    <div className="max-w-md sm:max-w-xl md:max-w-2xl mx-auto w-full h-full flex-1 min-h-0 flex flex-col overflow-hidden">
      <AnalyticsClient
        initialData={initialData}
        userName={user?.firstName || user?.username || "there"}
      />
    </div>
  );
}

