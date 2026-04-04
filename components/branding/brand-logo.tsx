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
        src="/barak-pathways-logo.jpeg"
        alt="Barak Pathways"
        width={188}
        height={54}
        priority={priority}
        unoptimized
        className={cn("block h-auto w-[148px] rounded-md bg-white object-contain", imageClassName)}
      />
    </div>
  );
}
