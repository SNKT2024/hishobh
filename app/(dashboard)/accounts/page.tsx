import { getAccountsAction } from "@/lib/actions/accounts";
import { AccountsClient } from "@/components/accounts/AccountsClient";
import { BottomNav } from "@/components/dashboard/BottomNav";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Accounts Management",
  description: "View and manage all cash reserves, bank accounts, digital wallets, and cards.",
};

export default async function AccountsPage() {
  const accounts = await getAccountsAction();

  return (
    <div className="max-w-md sm:max-w-xl md:max-w-2xl mx-auto w-full">
      <AccountsClient initialAccounts={accounts} />
      <BottomNav onOpenAddModal={() => {}} />
    </div>
  );
}
