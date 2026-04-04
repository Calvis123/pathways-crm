"use client";

import { Moon, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const THEME_STORAGE_KEY = "barak-theme";

type Theme = "light" | "dark";

function getPreferredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === "dark" || storedTheme === "light" ? storedTheme : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function ThemeToggle({
  className,
  compact = false
}: {
  className?: string;
  compact?: boolean;
}) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const nextTheme = getPreferredTheme();
    setTheme(nextTheme);
    applyTheme(nextTheme);
    setMounted(true);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  const isDark = mounted ? theme === "dark" : false;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[#e6d6c6] bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 shadow-[0_14px_28px_rgba(15,23,42,0.08)] transition hover:border-[#d79366] hover:bg-[#fff3ea] dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/16",
        compact ? "h-11 w-11 justify-center px-0 py-0" : "",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {compact ? null : <span>{isDark ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
}
