"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreateDebtDTO, DebtType, Person } from "@/types";
import { createPersonAction } from "@/lib/actions/people";
import {
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  HandCoins,
  Loader2,
  Plus,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  onAddDebt: (dto: CreateDebtDTO) => Promise<void>;
  onPersonCreated?: (newPerson: Person) => void;
}

export function AddDebtModal({
  isOpen,
  onClose,
  people,
  onAddDebt,
  onPersonCreated,
}: AddDebtModalProps) {
  const [type, setType] = useState<DebtType>("lend");
  const [personId, setPersonId] = useState<string>(people[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick inline person creation state
  const [showInlineNewPerson, setShowInlineNewPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonRelationship, setNewPersonRelationship] = useState("Friend");
  const [isCreatingPerson, setIsCreatingPerson] = useState(false);

  const handleCreateInlinePerson = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;

    try {
      setIsCreatingPerson(true);
      const res = await createPersonAction({
        name: newPersonName.trim(),
        relationship: newPersonRelationship,
      });

      if (res.person) {
        onPersonCreated?.(res.person);
        setPersonId(res.person.id);
        setShowInlineNewPerson(false);
        setNewPersonName("");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create person");
    } finally {
      setIsCreatingPerson(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    const selectedPerson = personId || people[0]?.id;
    if (!selectedPerson) {
      setError("Please select or add a counterparty person");
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddDebt({
        person_id: selectedPerson,
        type,
        total_amount: parsedAmount,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        description: description.trim() || undefined,
      });

      // Reset
      setAmount("");
      setDescription("");
      setDueDate("");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create debt record");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <HandCoins className="h-5 w-5 text-primary" />
            New Debt Record
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Segmented Control: I Lent vs I Borrowed */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Record Type *
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-secondary rounded-xl">
              <button
                type="button"
                onClick={() => setType("lend")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition-all",
                  type === "lend"
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ArrowUpRight className="h-4 w-4" />
                I Lent Money (Receivable)
              </button>
              <button
                type="button"
                onClick={() => setType("borrow")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition-all",
                  type === "borrow"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ArrowDownLeft className="h-4 w-4" />
                I Borrowed Money (Payable)
              </button>
            </div>
          </div>

          {/* Counterparty Person Selection with inline Quick Add */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-primary" />
                Counterparty Person *
              </label>
              <button
                type="button"
                onClick={() => setShowInlineNewPerson(!showInlineNewPerson)}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                {showInlineNewPerson ? "Cancel" : "Add New Person"}
              </button>
            </div>

            {showInlineNewPerson ? (
              <div className="p-3 rounded-xl border border-primary/40 bg-primary/5 space-y-2">
                <span className="text-xs font-bold text-foreground block">
                  Quick Add Contact
                </span>
                <input
                  type="text"
                  placeholder="Person's Full Name"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-input bg-background"
                />
                <div className="flex items-center justify-between gap-2 pt-1">
                  <select
                    value={newPersonRelationship}
                    onChange={(e) => setNewPersonRelationship(e.target.value)}
                    className="px-2 py-1 text-xs rounded-lg border border-input bg-background"
                  >
                    <option value="Friend">Friend</option>
                    <option value="Family">Family</option>
                    <option value="Colleague">Colleague</option>
                    <option value="Partner">Partner</option>
                    <option value="Other">Other</option>
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateInlinePerson}
                    disabled={isCreatingPerson || !newPersonName.trim()}
                    className="h-7 text-xs"
                  >
                    {isCreatingPerson ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Save Contact"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <select
                value={personId || people[0]?.id || ""}
                onChange={(e) => setPersonId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              >
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.relationship ? `(${p.relationship})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Principal Amount *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-input bg-background text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              />
            </div>
          </div>

          {/* Optional Due Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Expected Settlement / Due Date (Optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>

          {/* Description / Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description / Reason
            </label>
            <input
              type="text"
              placeholder="e.g. Vacation Airbnb share, Emergency loan"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-500 font-medium">{error}</p>
          )}

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-border/50">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "font-semibold",
                type === "lend"
                  ? "bg-violet-600 hover:bg-violet-700"
                  : "bg-amber-600 hover:bg-amber-700"
              )}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save Record"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
