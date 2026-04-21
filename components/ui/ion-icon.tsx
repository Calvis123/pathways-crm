"use client";

import { cn } from "@/lib/utils";

export function IonIcon({
  icon,
  className,
  title
}: {
  icon: string;
  className?: string;
  title?: string;
}) {
  return (
    <span
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn("inline-block shrink-0 bg-current align-middle", className)}
      style={{
        WebkitMaskImage: `url("${icon}")`,
        maskImage: `url("${icon}")`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain"
      }}
    />
  );
}
