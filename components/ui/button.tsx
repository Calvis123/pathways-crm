import type { Route } from "next";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const styles = {
  primary: "bg-[#213343] text-white shadow-sm hover:bg-[#2f495c] dark:bg-[#ff7a59] dark:text-white dark:hover:bg-[#ef6b49]",
  secondary:
    "bg-white text-[#213343] ring-1 ring-[#eadacc] shadow-sm hover:bg-[#fff6ef] dark:bg-white/[0.06] dark:text-slate-100 dark:ring-white/10 dark:hover:bg-white/[0.1]",
  ghost: "bg-transparent text-[#5f7182] hover:bg-[#fff6ef] dark:text-slate-300 dark:hover:bg-white/[0.08]"
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
        "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#ff7a59]/15 disabled:pointer-events-none disabled:opacity-55 dark:focus:ring-white/10",
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
        "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#ff7a59]/15 dark:focus:ring-white/10",
        styles[variant],
        className
      )}
    >
      {children}
    </Link>
  );
}
