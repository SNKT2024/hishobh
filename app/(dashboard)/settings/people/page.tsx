import { getPeopleAction } from "@/lib/actions/people";
import { PeopleClient } from "@/components/people/PeopleClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "People Directory",
  description: "Manage contacts, counterparties, and friends for expense splitting and debt tracking.",
};

export default async function PeopleSettingsPage() {
  const people = await getPeopleAction();

  return (
    <div className="max-w-2xl mx-auto w-full">
      <PeopleClient initialPeople={people} />
    </div>
  );
}
