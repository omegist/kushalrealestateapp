import { useState } from "react";
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
  const opts: ImgOpts = { width, quality, resize };

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
      className={cn("transition-opacity duration-500", loaded ? "opacity-100" : "opacity-0", className)}
      {...rest}
    />
  );
}
