import { getAccountsAction } from "@/lib/actions/accounts";
import { ImportPageClient } from "@/components/import/ImportPageClient";

export const metadata = {
  title: "Import Transactions | Hishobh",
  description: "Bulk import transactions from CSV and Excel files",
};

export default async function ImportSettingsPage() {
  const accounts = await getAccountsAction();

  return <ImportPageClient accounts={accounts} currency="INR" />;
}

