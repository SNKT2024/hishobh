"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "icon" | "segmented";
  className?: string;
}

export function ThemeToggle({
  variant = "icon",
  className,
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          variant === "icon"
            ? "h-9 w-9 rounded-xl bg-secondary/60 animate-pulse"
            : "h-11 w-full rounded-2xl bg-secondary/60 animate-pulse",
          className
        )}
      />
    );
  }

  if (variant === "segmented") {
    const options = [
      { id: "light", label: "Light", icon: Sun },
      { id: "dark", label: "Dark", icon: Moon },
      { id: "system", label: "System", icon: Laptop },
    ];

    return (
      <div
        className={cn(
          "grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-secondary/60 border border-border/60",
          className
        )}
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              className={cn(
                "flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all select-none",
                isSelected
                  ? "bg-card text-foreground shadow-xs border border-border/80 text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              )}
            >
              <Icon className={cn("h-4 w-4", isSelected && "text-primary")} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Quick Icon Toggle Button
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all active:scale-95 border border-transparent hover:border-border/60",
        className
      )}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform rotate-0 scale-100" />
      ) : (
        <Moon className="h-4 w-4 text-primary transition-transform rotate-0 scale-100" />
      )}
    </button>
  );
}
