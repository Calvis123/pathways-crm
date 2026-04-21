import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  imageClassName,
  priority = false
}: {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn("flex items-center", className)}>
      <Image
        src="/barak-pathways-logo.png"
        alt="Barak Pathways"
        width={560}
        height={421}
        priority={priority}
        className={cn(
          "block h-auto w-[112px] bg-transparent object-contain drop-shadow-[0_8px_18px_rgba(15,23,42,0.12)] dark:drop-shadow-[0_10px_22px_rgba(2,6,23,0.35)]",
          imageClassName
        )}
      />
    </div>
  );
}
