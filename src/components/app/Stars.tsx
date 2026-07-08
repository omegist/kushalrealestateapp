import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only star rating display (supports halves via rounding to nearest). */
export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  const rounded = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={i <= rounded ? "fill-gold text-gold" : "fill-transparent text-border"}
        />
      ))}
    </span>
  );
}

/** Interactive star picker used in the review form. */
export function StarInput({ value, onChange, size = 28 }: { value: number; onChange: (v: number) => void; size?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
          onClick={() => onChange(i)}
          className="transition-transform active:scale-90"
        >
          <Star
            style={{ width: size, height: size }}
            className={i <= value ? "fill-gold text-gold" : "fill-transparent text-border"}
          />
        </button>
      ))}
    </div>
  );
}
