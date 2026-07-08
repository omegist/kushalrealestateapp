// Image optimisation helper.
//
// For images we control (uploaded to Supabase Storage) we rewrite the public
// object URL to Supabase's on-the-fly image render endpoint. That endpoint
// resizes the image AND automatically serves modern formats (WebP/AVIF) when
// the browser advertises support via the Accept header — so we get "convert to
// WebP" + "reduce file size" for free, straight from the Supabase CDN.
//
// For third-party URLs we can't transform the bytes, so we return them
// untouched; callers still get native lazy-loading + async decoding via <Img>.

const PUBLIC_MARKER = "/storage/v1/object/public/";
const RENDER_MARKER = "/storage/v1/render/image/public/";

function isSupabaseStorage(url: string): boolean {
  return url.includes(PUBLIC_MARKER);
}

export type ImgOpts = {
  /** Target display width in CSS px; the CDN resizes to ~2x for crisp retina. */
  width?: number;
  /** 1–100. Lower = smaller file. Defaults to a high-but-lean 72. */
  quality?: number;
  resize?: "cover" | "contain" | "fill";
};

/** Return a single optimised URL (Supabase Storage only; passthrough otherwise). */
export function optimizedImage(url: string | null | undefined, opts: ImgOpts = {}): string {
  if (!url) return "";
  if (!isSupabaseStorage(url)) return url;

  const { width, quality = 72, resize = "cover" } = opts;
  const base = url.replace(PUBLIC_MARKER, RENDER_MARKER);
  const params = new URLSearchParams();
  if (width) params.set("width", String(Math.round(width * 2))); // retina
  params.set("quality", String(quality));
  params.set("resize", resize);
  return `${base}?${params.toString()}`;
}

/**
 * Build a responsive srcSet across common device widths. Returns undefined for
 * non-Supabase images (no point emitting identical candidates).
 */
export function srcSetFor(url: string | null | undefined, opts: ImgOpts = {}): string | undefined {
  if (!url || !isSupabaseStorage(url)) return undefined;
  const widths = [320, 480, 640, 828, 1080];
  const { quality = 72, resize = "cover" } = opts;
  return widths
    .map((w) => {
      const base = url.replace(PUBLIC_MARKER, RENDER_MARKER);
      const p = new URLSearchParams({ width: String(w), quality: String(quality), resize });
      return `${base}?${p.toString()} ${w}w`;
    })
    .join(", ");
}
