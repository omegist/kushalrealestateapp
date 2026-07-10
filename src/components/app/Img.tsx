import { useState } from "react";
import { ImageOff } from "lucide-react";
import { optimizedImage, srcSetFor, type ImgOpts } from "@/lib/img";
import { cn } from "@/lib/utils";

type ImgProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet"> & {
  src: string | null | undefined;
  /** Target display width (px) — drives CDN resize + retina. */
  width?: number;
  quality?: number;
  resize?: ImgOpts["resize"];
  /** `sizes` attribute for responsive selection. Defaults to the display width. */
  sizes?: string;
  /** Load immediately (above-the-fold hero/LCP). Defaults to lazy. */
  eager?: boolean;
};

/**
 * Optimised image element:
 *  - Supabase Storage images are served as resized WebP/AVIF from the CDN.
 *  - Native `loading="lazy"` + `decoding="async"` on everything.
 *  - Responsive `srcSet`/`sizes` so phones download small files.
 *  - Blur-up: fades in once decoded to avoid layout flashes.
 *  - On error: shows a visible placeholder instead of staying invisible
 *    forever. Previously there was no onError handler, so a broken/blocked
 *    image URL just sat at opacity-0 permanently — indistinguishable from
 *    "no photo uploaded" even though the property actually had one.
 */
export function Img({
  src,
  width,
  quality,
  resize,
  sizes,
  eager,
  className,
  alt = "",
  ...rest
}: ImgProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const opts: ImgOpts = { width, quality, resize };

  if (!src || failed) {
    return (
      <div className={cn("flex items-center justify-center bg-secondary text-muted-foreground/50", className)}>
        <ImageOff className="h-1/4 w-1/4 min-h-4 min-w-4" />
      </div>
    );
  }

  return (
    <img
      src={optimizedImage(src, opts)}
      srcSet={srcSetFor(src, opts)}
      sizes={sizes ?? (width ? `${width}px` : undefined)}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      // @ts-expect-error fetchPriority is valid but not yet in this React types version
      fetchpriority={eager ? "high" : undefined}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={cn("transition-opacity duration-500", loaded ? "opacity-100" : "opacity-0", className)}
      {...rest}
    />
  );
}