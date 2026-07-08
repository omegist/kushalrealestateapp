import { useState } from "react";
import { Play } from "lucide-react";
import { Img } from "@/components/app/Img";

/** Extract a YouTube video id from the common URL shapes. */
function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}
function vimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

/**
 * Lazy, CDN-backed video player for property tours.
 *  - YouTube/Vimeo: shows a lightweight poster "facade" and only injects the
 *    iframe (and its CDN player) after the user taps play — no upfront buffering.
 *  - Direct video files: native <video> with preload="none" + poster, so nothing
 *    downloads until the user chooses to watch. Serve these from a CDN URL.
 */
export function PropertyVideo({ url, poster, title }: { url: string; poster?: string | null; title?: string }) {
  const [playing, setPlaying] = useState(false);
  const yt = youtubeId(url);
  const vim = vimeoId(url);

  if (yt || vim) {
    const embed = yt
      ? `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0`
      : `https://player.vimeo.com/video/${vim}?autoplay=1`;
    const ytPoster = yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : poster ?? "";

    return (
      <div className="relative aspect-video overflow-hidden rounded-3xl bg-black shadow-luxury">
        {playing ? (
          <iframe
            src={embed}
            title={title ?? "Property video"}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button type="button" onClick={() => setPlaying(true)} className="group relative h-full w-full" aria-label="Play video">
            <Img src={ytPoster || poster || ""} alt={title ?? "Property video"} className="h-full w-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/35">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-luxury transition-transform group-active:scale-90">
                <Play className="ml-1 h-7 w-7 text-foreground" fill="currentColor" />
              </span>
            </span>
          </button>
        )}
      </div>
    );
  }

  // Direct video file (host it on a CDN for smooth streaming).
  return (
    <video
      controls
      preload="none"
      playsInline
      poster={poster ?? undefined}
      className="aspect-video w-full rounded-3xl bg-black object-cover shadow-luxury"
    >
      <source src={url} />
    </video>
  );
}
