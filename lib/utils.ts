import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export function formatDate(value: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    ...(options ?? {})
  }).format(new Date(value));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeKenyanPhone(value: string) {
  const cleaned = value.replace(/[^\d+]/g, "");
  const pattern = /^(\+254|254|0)?([17]\d{8})$/;
  const match = cleaned.match(pattern);

  if (!match) return null;
  return `+254${match[2]}`;
}
