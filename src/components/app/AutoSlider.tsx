import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Continuous right-to-left auto-scrolling carousel (marquee style) — the
 * kind you see on most property/e-commerce apps for "Featured" rails.
 * Children are duplicated once so the loop wraps seamlessly; animation
 * pauses on touch/hover so people can actually tap a card.
 */
export function AutoSlider({
  children,
  itemWidth = 260,
  speedSecondsPerItem = 3.5,
  className,
}: {
  children: React.ReactNode[];
  /** Approx width (px) of each item — used to size the pause-safe drag area. */
  itemWidth?: number;
  /** Seconds it takes to scroll past one item's width — lower = faster. */
  speedSecondsPerItem?: number;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const count = Array.isArray(children) ? children.length : 0;
  const duration = Math.max(count * speedSecondsPerItem, 8);

  if (count === 0) return null;

  return (
    <div className={cn("group relative overflow-hidden", className)}>
      <div
        ref={trackRef}
        className="flex w-max gap-3.5 will-change-transform [animation:marquee_var(--marquee-duration)_linear_infinite] group-active:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]"
        style={{ ["--marquee-duration" as string]: `${duration}s` }}
      >
        {children}
        {/* Duplicate set for a seamless loop (track scrolls exactly -50%) */}
        {children}
      </div>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}