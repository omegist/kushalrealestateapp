import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ImageOff, MapPin, MessageCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Img } from "@/components/app/Img";
import { BRAND, formatPrice, whatsappLink, defaultEnquiryMessage } from "@/lib/brand";
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

  const agencyName = property.contact_name || BRAND.name;
  const agencyPhone = property.contact_phone || BRAND.phone;
  const waLink = whatsappLink(agencyPhone, defaultEnquiryMessage(property.title, agencyName));

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/70 md:items-center md:p-3"
      onClick={onClose}
    >
      <div
        className="relative flex h-full w-full flex-col overflow-hidden bg-card shadow-2xl md:h-[min(760px,calc(100vh-1.5rem))] md:max-w-6xl md:flex-row md:rounded-2xl"
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
          className="relative flex min-h-0 shrink-0 basis-[62vh] items-center justify-center bg-black md:basis-auto md:flex-1 md:bg-secondary md:p-3"
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
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-gold md:border-muted-foreground/30" />
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center gap-2 text-white/70 md:text-muted-foreground">
              <ImageOff className="h-10 w-10" />
              <p className="text-sm">No photos uploaded for this property yet.</p>
            </div>
          ) : (
            <>
              <Img
                src={photos[index]}
                alt={`${property.title} photo ${index + 1}`}
                eager
                width={1600}
                sizes="100vw"
                className="h-full max-h-full w-full max-w-full select-none object-contain"
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
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-700 text-white">
                    {index + 1} / {photos.length}
                  </span>
                </>
              )}
            </>
          )}
        </div>

        <aside className="flex min-h-0 flex-1 flex-col overflow-y-auto border-t border-border bg-card md:w-2/5 md:flex-none md:border-l md:border-t-0">
          {photos.length > 1 && (
            <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-border p-3 md:hidden">
              {photos.map((url, photoIndex) => (
                <button
                  key={`m-${url}-${photoIndex}`}
                  type="button"
                  onClick={() => setIndex(photoIndex)}
                  className={cn(
                    "h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2",
                    photoIndex === index ? "border-gold" : "border-transparent opacity-60",
                  )}
                >
                  <Img src={url} alt="" width={56} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="p-5 pr-14">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-800 uppercase tracking-wide",
                  property.listing_type === "rent"
                    ? "bg-emerald/15 text-emerald"
                    : "bg-gradient-gold text-primary-foreground",
                )}
              >
                {property.listing_type === "rent" ? "For Rent" : "For Sale"}
              </span>
              {agencyName && (
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-700 text-foreground">
                  Listed by {agencyName}
                </span>
              )}
            </div>
            <h2 className="mt-2 text-xl font-800 leading-tight text-foreground">
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

            
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-700 text-white shadow-card transition-transform active:scale-[0.98]"
            >
              <MessageCircle className="h-4.5 w-4.5" />
              Chat with {agencyName} on WhatsApp
            </a>
          </div>

          {photos.length > 0 && (
            <div className="hidden min-h-0 flex-1 border-t border-border p-4 md:block">
              <p className="mb-3 text-xs font-700 text-muted-foreground">
                All photos — {index + 1} of {photos.length}
              </p>
              <div className="grid max-h-full grid-cols-3 gap-2 overflow-y-auto pr-1">
                {photos.map((url, photoIndex) => (
                  <button
                    key={`d-${url}-${photoIndex}`}
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
