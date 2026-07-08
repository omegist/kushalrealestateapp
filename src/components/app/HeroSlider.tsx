import { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Link } from "@tanstack/react-router";
import type { Banner } from "@/lib/types";
import { Img } from "@/components/app/Img";
import { cn } from "@/lib/utils";

export function HeroSlider({ banners }: { banners: Banner[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
    const id = setInterval(() => emblaApi.scrollNext(), 4200);
    return () => {
      clearInterval(id);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  if (banners.length === 0) return null;

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((b, idx) => (
            <div key={b.id} className="relative min-w-0 flex-[0_0_100%] px-4">
              <Link
                to={b.link_to ?? "/properties"}
                className="relative block aspect-[16/10] overflow-hidden rounded-3xl shadow-luxury"
              >
                <Img
                  src={b.image_url}
                  alt={b.title ?? "Property banner"}
                  width={480}
                  sizes="(max-width: 480px) 100vw, 480px"
                  eager={idx === 0}
                  className="h-full w-full animate-ken-burns object-cover"
                />
                <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h2 className="font-display text-xl font-700 leading-tight text-white drop-shadow">
                    {b.title}
                  </h2>
                  {b.subtitle && (
                    <p className="mt-1 line-clamp-1 text-xs text-white/80">{b.subtitle}</p>
                  )}
                  {b.cta_label && (
                    <span className="mt-3 inline-flex items-center rounded-full bg-gradient-gold px-4 py-1.5 text-xs font-700 text-primary-foreground shadow-gold">
                      {b.cta_label}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-1.5">
        {banners.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === selected ? "w-5 bg-gradient-gold" : "w-1.5 bg-border",
            )}
          />
        ))}
      </div>
    </div>
  );
}
