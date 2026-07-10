import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ImageOff, MapPin, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Img } from "@/components/app/Img";
import { formatPrice } from "@/lib/brand";
import type { Property } from "@/lib/types";
import { cn } from "@/lib/utils";

function usePropertyPhotos(propertyId: string, coverImage: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["property-photos", propertyId],
    enabled,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("property_images")
        .select("image_url")
        .eq("property_id", propertyId)
        .order("sort_order");
      if (error) throw error;
      return Array.from(
        new Set([coverImage, ...(data ?? []).map((row) => row.image_url)].filter(Boolean)),
      );
    },
  });
}

export function PropertyPhotosModal({
  property,
  onClose,
}: {
  property: Property;
  onClose: () => void;
}) {
  const { data: photos = [], isLoading } = usePropertyPhotos(
    property.id,
    property.cover_image,
    true,
  );
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const showPrevious = useCallback(
    () => setIndex((current) => (current === 0 ? photos.length - 1 : current - 1)),
    [photos.length],
  );
  const showNext = useCallback(
    () => setIndex((current) => (current === photos.length - 1 ? 0 : current + 1)),
    [photos.length],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (photos.length > 1 && event.key === "ArrowRight") showNext();
      if (photos.length > 1 && event.key === "ArrowLeft") showPrevious();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, photos.length, showNext, showPrevious]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex h-[min(720px,calc(100vh-1.5rem))] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl md:flex-row"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          ref={closeButtonRef}
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white"
          aria-label="Close photo viewer"
        >
          <X className="h-5 w-5" />
        </button>

        <div
          className="relative flex min-h-0 flex-1 items-center justify-center bg-secondary p-3 md:w-3/5"
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            const startX = touchStartX.current;
            const endX = event.changedTouches[0]?.clientX;
            touchStartX.current = null;
            if (photos.length < 2 || startX === null || endX === undefined) return;
            if (startX - endX > 50) showNext();
            if (endX - startX > 50) showPrevious();
          }}
        >
          {isLoading ? (
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-gold" />
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageOff className="h-10 w-10" />
              <p className="text-sm">No photos uploaded for this property yet.</p>
            </div>
          ) : (
            <>
              <Img
                src={photos[index]}
                alt={`${property.title} photo ${index + 1}`}
                eager
                width={1200}
                sizes="(max-width: 768px) 92vw, 60vw"
                className="max-h-full max-w-full select-none object-contain"
              />
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrevious}
                    className="absolute left-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={showNext}
                    className="absolute right-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </>
          )}
        </div>

        <aside className="flex min-h-0 w-full flex-col border-t border-border bg-card md:w-2/5 md:border-l md:border-t-0">
          <div className="p-5 pr-14">
            {property.contact_name && (
              <p className="text-xs font-700 uppercase tracking-wide text-gold">
                Listed by {property.contact_name}
              </p>
            )}
            <h2 className="mt-1 text-xl font-800 leading-tight text-foreground">
              {property.title}
            </h2>
            <p className="mt-2 text-2xl font-900 text-foreground">{formatPrice(property)}</p>
            <p className="mt-2 flex gap-1.5 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              {property.location}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-600 text-muted-foreground">
              {property.property_type && (
                <span className="rounded-full bg-secondary px-3 py-1.5">
                  {property.property_type}
                </span>
              )}
              {property.bedrooms && (
                <span className="rounded-full bg-secondary px-3 py-1.5">{property.bedrooms}</span>
              )}
              {property.builtup_area && (
                <span className="rounded-full bg-secondary px-3 py-1.5">
                  {property.builtup_area}
                </span>
              )}
            </div>
          </div>
          {photos.length > 0 && (
            <div className="min-h-0 flex-1 border-t border-border p-4">
              <p className="mb-3 text-xs font-700 text-muted-foreground">
                All photos — {index + 1} of {photos.length}
              </p>
              <div className="grid max-h-full grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4 md:grid-cols-3">
                {photos.map((url, photoIndex) => (
                  <button
                    key={`${url}-${photoIndex}`}
                    type="button"
                    onClick={() => setIndex(photoIndex)}
                    className={cn(
                      "aspect-[4/3] w-full overflow-hidden rounded-lg border-2",
                      photoIndex === index ? "border-gold" : "border-transparent opacity-60",
                    )}
                  >
                    <Img
                      src={url}
                      alt={`View photo ${photoIndex + 1}`}
                      width={64}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>,
    document.body,
  );
}
