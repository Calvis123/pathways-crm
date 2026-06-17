import { cn } from "@/lib/utils";

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold tracking-wide ring-1 ring-inset",
        className
      )}
    >
      {children}
    </span>
  );
}
