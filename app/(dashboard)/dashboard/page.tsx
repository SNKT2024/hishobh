import { currentUser } from "@clerk/nextjs/server";
import { getDashboardData } from "@/lib/actions/dashboard";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await currentUser();
  const initialData = await getDashboardData("monthly", "all");

  return (
    <div className="max-w-md sm:max-w-xl md:max-w-2xl mx-auto w-full">
      <DashboardClient
        initialData={initialData}
        userName={user?.firstName || user?.username || "there"}
      />
    </div>
  );
}
