import { BRAND } from "@/constants/brand";
import { cn } from "@/lib/utils";

export function BrandLogo({
  compact = false,
  className,
  imageClassName,
}: {
  compact?: boolean;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-xl border bg-white shadow-sm",
        compact ? "h-10 w-10 p-1" : "h-12 w-36 p-1.5",
        className,
      )}
    >
      <img
        src={BRAND.logoUrl}
        alt={`${BRAND.companyName} logo`}
        className={cn("h-full w-full object-contain", imageClassName)}
      />
    </div>
  );
}
