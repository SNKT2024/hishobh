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
  Calendar,
  Check,
  CheckSquare,
  HandCoins,
  IndianRupee,
  Loader2,
  Plus,
  Square,
  User,
  Users,
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
  const [isMultiPerson, setIsMultiPerson] = useState(false);
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);
  const [splitMode, setSplitMode] = useState<"equal_split" | "exact_per_person">("equal_split");

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick inline person creation state
  const [showInlineNewPerson, setShowInlineNewPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonRelationship, setNewPersonRelationship] = useState("Friend");
  const [isCreatingPerson, setIsCreatingPerson] = useState(false);

  // Toggle selection for multiple people
  const togglePersonSelection = (id: string) => {
    setSelectedPersonIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSelectAllPeople = () => {
    setSelectedPersonIds(people.map((p) => p.id));
  };

  const handleClearPeople = () => {
    setSelectedPersonIds([]);
  };

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
        if (isMultiPerson) {
          setSelectedPersonIds((prev) => [...prev, res.person!.id]);
        } else {
          setPersonId(res.person.id);
        }
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

    if (isMultiPerson) {
      if (selectedPersonIds.length === 0) {
        setError("Please select at least one counterparty person");
        return;
      }
    } else {
      const selectedPerson = personId || people[0]?.id;
      if (!selectedPerson) {
        setError("Please select or add a counterparty person");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      if (isMultiPerson) {
        await onAddDebt({
          person_ids: selectedPersonIds,
          split_mode: splitMode,
          type,
          total_amount: parsedAmount,
          date: date || new Date().toISOString().slice(0, 10),
          due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
          description: description.trim() || undefined,
        });
      } else {
        const selectedPerson = personId || people[0]?.id;
        await onAddDebt({
          person_id: selectedPerson,
          type,
          total_amount: parsedAmount,
          date: date || new Date().toISOString().slice(0, 10),
          due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
          description: description.trim() || undefined,
        });
      }

      // Reset
      setAmount("");
      setDescription("");
      setDueDate("");
      setSelectedPersonIds([]);
      setIsMultiPerson(false);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create debt record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedAmountNum = parseFloat(amount) || 0;
  const multiCount = selectedPersonIds.length;
  const perPersonSplit =
    multiCount > 0
      ? splitMode === "equal_split"
        ? (parsedAmountNum / multiCount).toFixed(2)
        : parsedAmountNum.toFixed(2)
      : "0.00";
  const totalMultiAmount =
    splitMode === "equal_split"
      ? parsedAmountNum.toFixed(2)
      : (parsedAmountNum * multiCount).toFixed(2);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6 rounded-2xl mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <HandCoins className="h-5 w-5 text-primary shrink-0" />
            <span>New Debt Record</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="w-full max-w-full overflow-x-hidden space-y-4 pt-1">
          {/* Segmented Control: I Lent vs I Borrowed */}
          <div className="space-y-1.5 min-w-0">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              Record Type *
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-secondary rounded-xl min-w-0 max-w-full">
              <button
                type="button"
                onClick={() => setType("lend")}
                className={cn(
                  "flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-2 px-1 text-xs font-semibold rounded-lg transition-all min-w-0 text-center",
                  type === "lend"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-1">
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                  <span>I Lent</span>
                </div>
                <span className="text-[10px] opacity-80 font-normal sm:font-semibold">
                  (Receivable)
                </span>
              </button>
              <button
                type="button"
                onClick={() => setType("borrow")}
                className={cn(
                  "flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-2 px-1 text-xs font-semibold rounded-lg transition-all min-w-0 text-center",
                  type === "borrow"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-1">
                  <ArrowDownLeft className="h-3.5 w-3.5 shrink-0" />
                  <span>I Borrowed</span>
                </div>
                <span className="text-[10px] opacity-80 font-normal sm:font-semibold">
                  (Payable)
                </span>
              </button>
            </div>
          </div>

          {/* Multiple Counterparty Toggle Pill */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/60 border border-border/60 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <Users className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-semibold text-foreground block truncate">
                  Multiple People (Optional)
                </span>
                <span className="text-[10px] sm:text-[11px] text-muted-foreground block truncate">
                  Split or record across multiple contacts
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextState = !isMultiPerson;
                setIsMultiPerson(nextState);
                if (nextState && selectedPersonIds.length === 0 && people.length > 0) {
                  setSelectedPersonIds([personId || people[0].id]);
                }
              }}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all shrink-0 ml-2",
                isMultiPerson
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              )}
            >
              {isMultiPerson ? "Multiple" : "Single"}
            </button>
          </div>

          {/* Counterparty Person Selection */}
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 truncate">
                <User className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate">
                  {isMultiPerson ? `Counterparty People (${multiCount} selected) *` : "Counterparty Person *"}
                </span>
              </label>
              <button
                type="button"
                onClick={() => setShowInlineNewPerson(!showInlineNewPerson)}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 shrink-0"
              >
                <Plus className="h-3 w-3" />
                <span>{showInlineNewPerson ? "Cancel" : "Add Contact"}</span>
              </button>
            </div>

            {/* Inline Quick Contact Creator */}
            {showInlineNewPerson && (
              <div className="p-3 rounded-xl border border-primary/40 bg-primary/5 space-y-2 mb-2 min-w-0">
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
            )}

            {/* Selection UI: Multi-person vs Single person */}
            {isMultiPerson ? (
              <div className="space-y-2 min-w-0">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
                  <span className="truncate">Tap people to include:</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleSelectAllPeople}
                      className="text-primary hover:underline font-semibold"
                    >
                      Select All
                    </button>
                    <span>&bull;</span>
                    <button
                      type="button"
                      onClick={handleClearPeople}
                      className="hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="max-h-36 overflow-y-auto overflow-x-hidden p-2 rounded-xl border border-input bg-background/50 space-y-1.5 min-w-0 max-w-full">
                  {people.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2 text-center">
                      No contacts yet. Click &quot;Add Contact&quot; above to create one.
                    </p>
                  ) : (
                    people.map((p) => {
                      const isSelected = selectedPersonIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => togglePersonSelection(p.id)}
                          className={cn(
                            "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border text-left min-w-0",
                            isSelected
                              ? "bg-primary/10 border-primary/50 text-foreground"
                              : "bg-card border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                            ) : (
                              <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <span className="font-semibold text-foreground truncate">
                              {p.name}
                            </span>
                            {p.relationship && (
                              <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded shrink-0">
                                {p.relationship}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Multi Split Mode Options */}
                {multiCount > 1 && (
                  <div className="grid grid-cols-2 gap-2 pt-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => setSplitMode("equal_split")}
                      className={cn(
                        "py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-all text-center min-w-0 truncate",
                        splitMode === "equal_split"
                          ? "bg-secondary border-primary/50 text-primary"
                          : "bg-card border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Split Equally
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitMode("exact_per_person")}
                      className={cn(
                        "py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-all text-center min-w-0 truncate",
                        splitMode === "exact_per_person"
                          ? "bg-secondary border-primary/50 text-primary"
                          : "bg-card border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Same Amount Each
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <select
                value={personId || people[0]?.id || ""}
                onChange={(e) => setPersonId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary shadow-sm min-w-0"
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
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
                {isMultiPerson && splitMode === "equal_split" ? "Total Principal Amount *" : "Principal Amount *"}
              </label>
              {isMultiPerson && multiCount > 0 && parsedAmountNum > 0 && (
                <span className="text-[11px] font-semibold text-primary shrink-0">
                  ₹{perPersonSplit} / person ({multiCount})
                </span>
              )}
            </div>
            <div className="relative min-w-0">
              <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-input bg-background text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary shadow-sm min-w-0"
              />
            </div>
          </div>

          {/* Date & Optional Due Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 max-w-full">
            {/* Occurrence Date */}
            <div className="space-y-1.5 min-w-0">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Transaction Date *</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full min-w-0 max-w-full px-3 py-2 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              />
            </div>

            {/* Optional Due Date */}
            <div className="space-y-1.5 min-w-0">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span>Due Date (Optional)</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full min-w-0 max-w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              />
            </div>
          </div>

          {/* Description / Note */}
          <div className="space-y-1.5 min-w-0">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              Description / Reason (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Vacation Airbnb share, Emergency loan"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm min-w-0"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-500 font-medium">{error}</p>
          )}

          {/* Action buttons (responsive stack on mobile) */}
          <div className="pt-3 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 border-t border-border/50">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full sm:w-auto font-semibold text-xs py-2.5 px-4",
                type === "lend"
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                  : "bg-amber-600 hover:bg-amber-700 text-white"
              )}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : isMultiPerson && multiCount > 1 ? (
                `Save ${multiCount} Records (₹${totalMultiAmount})`
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
