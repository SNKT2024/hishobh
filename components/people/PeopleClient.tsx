"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CreatePersonDTO, Person } from "@/types";
import { PersonModal } from "./PersonModal";
import { Button } from "@/components/ui/button";
import {
  createPersonAction,
  deletePersonAction,
  updatePersonAction,
} from "@/lib/actions/people";
import {
  ArrowLeft,
  Edit2,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PeopleClientProps {
  initialPeople: Person[];
}

export function PeopleClient({ initialPeople }: PeopleClientProps) {
  const [people, setPeople] = useState<Person[]>(initialPeople);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Search filter
  const filteredPeople = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return people;
    return people.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.relationship && p.relationship.toLowerCase().includes(q))
    );
  }, [people, searchQuery]);

  // Handle Save (Create or Update)
  const handleSavePerson = async (data: CreatePersonDTO, id?: string) => {
    if (id) {
      // Update
      const res = await updatePersonAction({
        id,
        name: data.name,
        relationship: data.relationship,
      });
      setPeople((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, name: data.name, relationship: data.relationship || null }
            : p
        )
      );
    } else {
      // Create
      const res = await createPersonAction(data);
      if (res.person) {
        setPeople((prev) => [res.person, ...prev]);
      }
    }
  };

  // Handle Delete
  const handleDeletePerson = async (id: string) => {
    if (!confirm("Are you sure you want to remove this person?")) return;

    setDeletingId(id);
    startTransition(async () => {
      try {
        await deletePersonAction(id);
        setPeople((prev) => prev.filter((p) => p.id !== id));
      } catch (err) {
        console.error("Failed to delete person:", err);
      } finally {
        setDeletingId(null);
      }
    });
  };

  // Generate initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div
      className="w-full flex flex-col space-y-5 pb-24 sm:pb-28 pt-2"
      suppressHydrationWarning
    >
      {/* Top Header */}
      <div className="flex flex-col gap-2" suppressHydrationWarning>
        <div className="flex items-center justify-between">
          <Link
            href="/settings"
            prefetch={true}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground py-1.5 px-2 -ml-2 rounded-xl hover:bg-secondary transition-colors"
            aria-label="Back to Settings"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Settings</span>
          </Link>

          <Button
            onClick={() => {
              setPersonToEdit(null);
              setIsModalOpen(true);
            }}
            size="sm"
            className="gap-1.5 shadow-sm text-xs font-semibold rounded-xl h-9 px-3.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add Person</span>
          </Button>
        </div>

        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            People & Counterparties
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Manage contacts for split transactions, lending, and borrowing
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name or relationship (e.g. Alex, Friend)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
        />
      </div>

      {/* People Grid / List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Directory ({filteredPeople.length})
          </span>
        </div>

        {filteredPeople.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredPeople.map((person) => {
              const isDeleting = deletingId === person.id;

              return (
                <div
                  key={person.id}
                  className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-border transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Initials Avatar */}
                    <div className="h-11 w-11 rounded-2xl bg-secondary text-secondary-foreground font-bold flex items-center justify-center shrink-0 border border-border shadow-xs text-sm">
                      {getInitials(person.name)}
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm sm:text-base text-foreground truncate">
                        {person.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary font-medium text-secondary-foreground border border-border/50">
                          {person.relationship || "Other"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => {
                        setPersonToEdit(person);
                        setIsModalOpen(true);
                      }}
                      className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      title="Edit person"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePerson(person.id)}
                      disabled={isDeleting}
                      className="p-2 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                      title="Delete person"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-10 sm:p-14 rounded-3xl border border-dashed border-border text-center bg-card/40">
            <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-foreground text-base">
              {searchQuery ? "No matching contacts found" : "No people added yet"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              {searchQuery
                ? `No people matched "${searchQuery}". Try a different keyword.`
                : "Add friends, family, and colleagues to tag them in shared expenses and track debts."}
            </p>
            <Button
              onClick={() => {
                setPersonToEdit(null);
                setIsModalOpen(true);
              }}
              size="sm"
              className="mt-4 gap-1.5 rounded-xl text-xs font-semibold"
            >
              <Plus className="h-4 w-4" />
              Add Your First Contact
            </Button>
          </div>
        )}

        {/* Guaranteed bottom clearance spacer so contacts never clip behind BottomNav */}
        <div className="h-24 sm:h-28 shrink-0 pointer-events-none" aria-hidden="true" />
      </div>

      {/* Add / Edit Dialog */}
      <PersonModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPersonToEdit(null);
        }}
        personToEdit={personToEdit}
        onSave={handleSavePerson}
      />
    </div>
  );
}
