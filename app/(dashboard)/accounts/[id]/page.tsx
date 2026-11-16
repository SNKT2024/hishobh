import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import {
  getAccountByIdAction,
  getAccountTransactionsAction,
} from "@/lib/actions/accounts";
import { getPeopleAction } from "@/lib/actions/people";
import { AccountDetailsClient } from "@/components/accounts/AccountDetailsClient";

export const metadata = {
  title: "Account Details | Hishobh",
  description: "Account transaction ledger and balance reconciliation",
};

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();

  const account = await getAccountByIdAction(id);
  if (!account) {
    notFound();
  }

  const transactions = await getAccountTransactionsAction(id);
  const people = await getPeopleAction();

  return (
    <AccountDetailsClient
      account={account}
      initialTransactions={transactions}
      people={people}
      currency={account.currency || "INR"}
    />
  );
}

