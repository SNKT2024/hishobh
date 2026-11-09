"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimeframeOption } from "@/types";
import { Calendar } from "lucide-react";

interface TimeframeFilterProps {
  value: TimeframeOption;
  onChange: (value: TimeframeOption) => void;
  disabled?: boolean;
}

const TIMEFRAME_LABELS: Record<TimeframeOption, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  "6months": "6 Months",
  yearly: "Yearly",
};

export function TimeframeFilter({
  value,
  onChange,
  disabled = false,
}: TimeframeFilterProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Select
        value={value}
        onValueChange={(val) => onChange(val as TimeframeOption)}
        disabled={disabled}
      >
        <SelectTrigger className="w-[125px] sm:w-[140px] bg-card border-border/80 shadow-sm text-xs sm:text-sm font-medium">
          <Calendar className="h-3.5 w-3.5 text-primary mr-1 shrink-0" />
          <SelectValue placeholder="Timeframe">
            {TIMEFRAME_LABELS[value]}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="weekly">Weekly</SelectItem>
          <SelectItem value="monthly">Monthly</SelectItem>
          <SelectItem value="quarterly">Quarterly</SelectItem>
          <SelectItem value="6months">6 Months</SelectItem>
          <SelectItem value="yearly">Yearly</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
