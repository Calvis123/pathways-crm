import type { Route } from "next";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const styles = {
  primary: "bg-ink text-white hover:bg-ocean dark:bg-[#ff7a59] dark:text-white dark:hover:bg-[#ef6b49]",
  secondary:
    "bg-white text-ink ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:text-slate-100 dark:ring-white/10 dark:hover:bg-white/16",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
};

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof styles }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition duration-200",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  className
}: {
  href: Route;
  children: ReactNode;
  variant?: keyof typeof styles;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition duration-200",
        styles[variant],
        className
      )}
    >
      {children}
    </Link>
  );
}
