import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  count,
  size = 13,
}: {
  rating: number;
  count?: number;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={size}
            strokeWidth={1.2}
            className={cn(
              i < Math.round(rating) ? "fill-gold text-gold" : "fill-transparent text-line"
            )}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className="text-[11px] text-ink/40">
          {count > 0 ? `(${count})` : "No reviews"}
        </span>
      )}
    </div>
  );
}
