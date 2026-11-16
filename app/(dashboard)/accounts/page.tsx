import { getAccountsAction } from "@/lib/actions/accounts";
import { AccountsClient } from "@/components/accounts/AccountsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Accounts Management",
  description: "View and manage all cash reserves, bank accounts, digital wallets, and cards.",
};

export default async function AccountsPage() {
  const accounts = await getAccountsAction();

  return (
    <div className="max-w-md sm:max-w-xl md:max-w-2xl mx-auto w-full h-full flex-1 min-h-0 flex flex-col overflow-hidden">
      <AccountsClient initialAccounts={accounts} />
    </div>
  );
}
