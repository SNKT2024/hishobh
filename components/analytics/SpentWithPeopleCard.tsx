"use client";

import { PersonSpendingAnalytics } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, User, HeartHandshake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface SpentWithPeopleCardProps {
  peopleSpending: PersonSpendingAnalytics[];
  totalSpent: number;
}

export function SpentWithPeopleCard({
  peopleSpending,
  totalSpent,
}: SpentWithPeopleCardProps) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Who You Spend With
            </CardTitle>
            <CardDescription className="text-xs">
              Social spending & shared transactions tagged with counterparties
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[11px] font-semibold">
            {peopleSpending.length} {peopleSpending.length === 1 ? "Person" : "People"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {peopleSpending.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground flex flex-col items-center">
            <HeartHandshake className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="font-medium text-foreground">No shared expenses tagged</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Tag a friend or colleague when adding an expense to see your shared spending analytics here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {peopleSpending.map((person, index) => {
              const initials = person.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={person.person_id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-card/60 hover:bg-muted/30 transition-colors gap-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Person Avatar or Initials Ring */}
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold text-xs border border-border shadow-xs">
                      {person.avatar_url ? (
                        <img
                          src={person.avatar_url}
                          alt={person.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <span>{initials || <User className="h-4 w-4" />}</span>
                      )}
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background border border-border text-[9px] font-bold text-muted-foreground">
                        #{index + 1}
                      </span>
                    </div>

                    <div className="min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm text-foreground truncate max-w-[140px] sm:max-w-none">
                          {person.name}
                        </span>
                        {person.relationship && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 h-4 font-normal shrink-0"
                          >
                            {person.relationship}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {person.transaction_count}{" "}
                        {person.transaction_count === 1
                          ? "shared expense"
                          : "shared expenses"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-sm text-foreground block">
                      {formatCurrency(person.total_amount)}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {person.percentage_of_total_expense}% of total
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

