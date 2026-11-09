"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreatePersonDTO, Person } from "@/types";
import { Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  personToEdit?: Person | null;
  onSave: (data: CreatePersonDTO, id?: string) => Promise<void>;
}

const RELATIONSHIP_OPTIONS = [
  "Friend",
  "Family",
  "Partner",
  "Colleague",
  "Work",
  "Other",
];

export function PersonModal({
  isOpen,
  onClose,
  personToEdit,
  onSave,
}: PersonModalProps) {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("Friend");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (personToEdit) {
      setName(personToEdit.name);
      setRelationship(personToEdit.relationship || "Other");
    } else {
      setName("");
      setRelationship("Friend");
    }
    setError(null);
  }, [personToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter the person's name");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(
        {
          name: name.trim(),
          relationship,
        },
        personToEdit?.id
      );
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save person");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {personToEdit ? "Edit Person" : "Add New Person"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Full Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>

          {/* Relationship Selection Pills */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Relationship Tag
            </label>
            <div className="flex flex-wrap gap-2">
              {RELATIONSHIP_OPTIONS.map((rel) => {
                const isSelected = relationship === rel;
                return (
                  <button
                    key={rel}
                    type="button"
                    onClick={() => setRelationship(rel)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm scale-105"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/40"
                    )}
                  >
                    {rel}
                  </button>
                );
              })}
            </div>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : personToEdit ? (
                "Save Changes"
              ) : (
                "Add Person"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
