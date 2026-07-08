import { Link } from "@tanstack/react-router";
import { Heart, MapPin, BedDouble, Bath, Maximize, BadgeCheck } from "lucide-react";
import type { Property } from "@/lib/types";
import { formatPrice } from "@/lib/brand";
import { useFavorites } from "@/lib/useFavorites";
import { Img } from "@/components/app/Img";
import { cn } from "@/lib/utils";

export function PropertyCard({ property, view = "grid" }: { property: Property; view?: "grid" | "list" }) {
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(property.id);

  const favBtn = (className: string) => (
    <button
      type="button"
      aria-label={fav ? "Remove from wishlist" : "Save to wishlist"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(property.id);
      }}
      className={cn(
        "z-10 flex items-center justify-center rounded-full bg-white/95 shadow-card backdrop-blur transition-transform active:scale-90",
        className,
      )}
    >
      <Heart
        className={cn("h-[18px] w-[18px] transition-colors", fav ? "fill-destructive text-destructive" : "text-foreground/70")}
      />
    </button>
  );

  const FavBtn = favBtn("absolute right-2.5 top-2.5 h-9 w-9");

  const VerifiedBadge = property.verified && (
    <span className="flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-700 text-emerald shadow-card backdrop-blur">
      <BadgeCheck className="h-3 w-3" /> Verified
    </span>
  );

  if (view === "list") {
    return (
      <Link
        to="/properties/$id"
        params={{ id: property.id }}
        className="group relative flex gap-3 overflow-hidden rounded-3xl border border-border bg-card p-2.5 shadow-card transition-transform active:scale-[0.99]"
      >
        {favBtn("absolute right-2.5 top-2.5 h-8 w-8")}
        <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl">
          <Img src={property.cover_image} alt={property.title} width={128} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1 py-0.5 pr-8">
          <div className="flex flex-wrap items-center gap-1.5">
            {property.property_type && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-700 text-foreground">
                {property.property_type}
              </span>
            )}
            {property.featured && (
              <span className="rounded-full bg-gradient-gold px-2 py-0.5 text-[10px] font-800 text-primary-foreground">
                Featured
              </span>
            )}
          </div>
          <h3 className="mt-1 line-clamp-1 text-[15px] font-800 text-foreground">{property.title}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs font-500 text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0 text-gold" />
            <span className="line-clamp-1">{property.location}</span>
          </p>
          <p className="mt-1.5 text-lg font-900 text-foreground">{formatPrice(property)}</p>
          <div className="mt-1.5 flex items-center gap-3 text-[11px] font-600 text-muted-foreground">
            {property.bedrooms && <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> {property.bedrooms}</span>}
            {property.builtup_area && <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" /> {property.builtup_area}</span>}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to="/properties/$id"
      params={{ id: property.id }}
      className="group relative block overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-luxury active:scale-[0.98]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {FavBtn}
        <Img
          src={property.cover_image}
          alt={property.title}
          width={280}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          {property.featured && (
            <span className="rounded-full bg-gradient-gold px-2 py-0.5 text-[10px] font-800 text-primary-foreground shadow-gold">
              Featured
            </span>
          )}
          {VerifiedBadge}
        </div>
      </div>
      <div className="p-3.5">
        <h3 className="line-clamp-1 text-[15px] font-800 leading-tight text-foreground">{property.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs font-500 text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0 text-gold" />
          <span className="line-clamp-1">{property.location}</span>
        </p>
        <p className="mt-2 text-xl font-900 tracking-tight text-foreground">{formatPrice(property)}</p>
        <div className="mt-2.5 flex items-center gap-3 border-t border-border pt-2.5 text-[11px] font-600 text-muted-foreground">
          {property.bedrooms && (
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5 text-primary/70" /> {property.bedrooms}
            </span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5 text-primary/70" /> {property.bathrooms}
            </span>
          )}
          {property.builtup_area && (
            <span className="flex items-center gap-1">
              <Maximize className="h-3.5 w-3.5 text-primary/70" /> {property.builtup_area}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
