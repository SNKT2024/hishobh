import { getDebtsAction } from "@/lib/actions/debts";
import { getPeopleAction } from "@/lib/actions/people";
import { DebtsClient } from "@/components/debts/DebtsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lend & Borrow Ledger",
  description: "Track money lent to others and borrowed with settlement history.",
};

export default async function LendBorrowPage() {
  const [{ debts, metrics }, people] = await Promise.all([
    getDebtsAction(),
    getPeopleAction(),
  ]);

  return (
    <div className="max-w-2xl mx-auto w-full">
      <DebtsClient
        initialDebts={debts}
        initialMetrics={metrics}
        people={people}
      />
    </div>
  );
}
