"use client";

import { useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Transaction } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Camera,
  Edit2,
  MapPin,
  Repeat,
  Trash2,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionItemProps {
  transaction: Transaction;
  currency?: string;
  onClick?: (transaction: Transaction) => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
}

export function TransactionItem({
  transaction,
  currency = "INR",
  onClick,
  onEdit,
  onDelete,
}: TransactionItemProps) {
  const isIncome = transaction.type === "income";
  const isExpense = transaction.type === "expense";
  const isDraggingRef = useRef(false);

  const x = useMotionValue(0);

  // Dynamic opacity for revealed action boxes based on drag direction
  const editOpacity = useTransform(x, [0, 50, 90], [0, 0.7, 1]);
  const deleteOpacity = useTransform(x, [-90, -50, 0], [1, 0.7, 0]);

  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  const handleDragEnd = (_: any, info: any) => {
    // If dragged right past threshold (> 65px), trigger edit
    if (info.offset.x > 65) {
      if (onEdit) onEdit(transaction);
    }
    // If dragged left past threshold (< -65px), trigger delete
    else if (info.offset.x < -65) {
      if (onDelete) onDelete(transaction);
    }

    // Reset dragging flag after a short tick so click doesn't accidentally trigger
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 150);
  };

  const handleClick = () => {
    if (!isDraggingRef.current && onClick) {
      onClick(transaction);
    }
  };

  const getIcon = () => {
    if (isIncome) {
      return (
        <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <ArrowDownLeft className="h-4 w-4" />
        </div>
      );
    }
    if (isExpense) {
      return (
        <div className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
          <ArrowUpRight className="h-4 w-4" />
        </div>
      );
    }
    return (
      <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Repeat className="h-4 w-4" />
      </div>
    );
  };

  const getAmountDisplay = () => {
    const formatted = formatCurrency(transaction.amount, currency);
    if (isIncome) return `+${formatted}`;
    if (isExpense) return `-${formatted}`;
    return formatted;
  };

  const formattedTime = new Date(transaction.date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="relative overflow-hidden rounded-2xl select-none group shrink-0 w-full min-h-[66px]">
      {/* Background Action Layer (Swipe Right -> Edit, Swipe Left -> Delete) */}
      <div className="absolute inset-0 flex items-center justify-between rounded-2xl overflow-hidden pointer-events-auto">
        {/* Left Action Box: EDIT (Revealed when swiped right) */}
        <motion.button
          type="button"
          style={{ opacity: editOpacity }}
          onClick={() => onEdit && onEdit(transaction)}
          className="h-full w-24 bg-primary/20 hover:bg-primary/30 text-primary flex flex-col items-center justify-center gap-1 font-semibold text-xs transition-colors"
        >
          <Edit2 className="h-4 w-4" />
          <span>Edit</span>
        </motion.button>

        {/* Right Action Box: DELETE (Revealed when swiped left) */}
        <motion.button
          type="button"
          style={{ opacity: deleteOpacity }}
          onClick={() => onDelete && onDelete(transaction)}
          className="h-full w-24 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 flex flex-col items-center justify-center gap-1 font-semibold text-xs ml-auto transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete</span>
        </motion.button>
      </div>

      {/* Foreground Draggable Transaction Card */}
      <motion.div
        style={{ x }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -100, right: 100 }}
        dragElastic={0.2}
        dragSnapToOrigin
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        className="relative z-10 flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-card border border-border/70 hover:border-border transition-colors cursor-pointer shadow-xs active:cursor-grabbing shrink-0 w-full min-h-[66px] touch-pan-y"
      >
        {/* Left side: Icon + Title + Account & Person subtext */}
        <div className="flex items-center gap-3 min-w-0">
          {getIcon()}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-semibold text-sm sm:text-base text-foreground truncate leading-snug">
                {transaction.title}
              </h4>
              {transaction.person && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-secondary text-[10px] font-medium text-secondary-foreground border border-border/50 shrink-0">
                  <User className="h-2.5 w-2.5 text-primary" />
                  {transaction.person.name}
                </span>
              )}
              {transaction.receipt_url && (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-primary/10 text-[10px] font-medium text-primary border border-primary/20 shrink-0"
                  title="Receipt attached"
                >
                  <Camera className="h-2.5 w-2.5" />
                  <span>Receipt</span>
                </span>
              )}
              {transaction.location_name && (
                <span
                  className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-secondary/80 text-[10px] text-muted-foreground border border-border/40 shrink-0 max-w-[120px] truncate"
                  title={transaction.location_name}
                >
                  <MapPin className="h-2.5 w-2.5 text-primary shrink-0" />
                  <span className="truncate">{transaction.location_name}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground truncate">
              <span>{transaction.account?.name || "Account"}</span>
              {transaction.category && (
                <>
                  <span>&bull;</span>
                  <span className="capitalize">{transaction.category}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Amount + Date/Time + Desktop Hover Icons */}
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <div className="text-right">
            <span
              className={cn(
                "font-bold text-sm sm:text-base block tracking-tight",
                isIncome && "text-emerald-600 dark:text-emerald-400",
                isExpense && "text-rose-600 dark:text-rose-400",
                !isIncome && !isExpense && "text-foreground"
              )}
            >
              {getAmountDisplay()}
            </span>
            <span className="text-[11px] text-muted-foreground block mt-0.5">
              {formatDate(transaction.date)} &bull; {formattedTime}
            </span>
          </div>

          {/* Desktop Hover Quick Action Buttons (Clutter-free: visible only on hover) */}
          <div
            className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => onEdit && onEdit(transaction)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Edit transaction"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete && onDelete(transaction)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Delete transaction"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}