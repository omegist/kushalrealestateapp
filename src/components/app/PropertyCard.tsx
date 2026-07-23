import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Heart, MapPin, BedDouble, Bath, Maximize, BadgeCheck, Images } from "lucide-react";
import type { Property } from "@/lib/types";
import { formatPrice } from "@/lib/brand";
import { useFavorites } from "@/lib/useFavorites";
import { Img } from "@/components/app/Img";
import { PropertyPhotosModal } from "@/components/app/PropertyPhotosModal";
import { cn } from "@/lib/utils";

export function PropertyCard({
  property,
  view = "grid",
}: {
  property: Property;
  view?: "grid" | "list";
}) {
  const navigate = useNavigate();
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(property.id);
  const [showPhotos, setShowPhotos] = useState(false);

  const openDetails = () => {
    navigate({ to: "/properties/$id", params: { id: property.id } });
  };

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    // Let the heart and photo buttons keep their own keyboard behavior.
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDetails();
    }
  };

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
        className={cn(
          "h-[18px] w-[18px] transition-colors",
          fav ? "fill-destructive text-destructive" : "text-foreground/70",
        )}
      />
    </button>
  );

  // Opens the full photo gallery without navigating to the detail page.
  const viewPhotosBtn = (className: string) => (
    <button
      type="button"
      aria-label="View all photos"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowPhotos(true);
      }}
      className={cn(
        "z-10 flex items-center gap-1 rounded-full bg-black/60 text-white backdrop-blur transition-transform active:scale-95",
        className,
      )}
    >
      <Images className="h-3.5 w-3.5" />
      <span className="text-[10px] font-700">View Photos</span>
    </button>
  );

  const FavBtn = favBtn("absolute right-2.5 top-2.5 h-9 w-9");

  const VerifiedBadge = property.verified && (
    <span className="flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-700 text-emerald shadow-card backdrop-blur">
      <BadgeCheck className="h-3 w-3" /> Verified
    </span>
  );

  const PhotosModal = showPhotos && (
    <PropertyPhotosModal property={property} onClose={() => setShowPhotos(false)} />
  );

  if (view === "list") {
    return (
      <article
        role="link"
        tabIndex={0}
        aria-label={`View details for ${property.title}`}
        onClick={openDetails}
        onKeyDown={handleCardKeyDown}
        className="group relative flex gap-3 overflow-hidden rounded-3xl border border-border bg-card p-2.5 shadow-card transition-transform active:scale-[0.99]"
      >
        {favBtn("absolute right-2.5 top-2.5 h-8 w-8")}
        <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl">
          <Img
            src={property.cover_image}
            alt={property.title}
            width={128}
            className="h-full w-full object-cover"
          />
          {viewPhotosBtn("absolute bottom-1.5 left-1.5 px-2 py-1")}
        </div>
        <div className="min-w-0 flex-1 py-0.5 pr-8">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-800",
                property.listing_type === "rent"
                  ? "bg-emerald/15 text-emerald"
                  : "bg-gradient-gold text-primary-foreground",
              )}
            >
              {property.listing_type === "rent" ? "For Rent" : "For Sale"}
            </span>
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
          {property.contact_name && (
            <p className="mt-1 text-[10px] font-700 uppercase tracking-wide text-gold">
              {property.contact_name}
            </p>
          )}
          <h3 className="mt-1 line-clamp-1 text-[15px] font-800 text-foreground">
            {property.title}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs font-500 text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0 text-gold" />
            <span className="line-clamp-1">{property.location}</span>
          </p>
          <p className="mt-1.5 text-lg font-900 text-foreground">{formatPrice(property)}</p>
          <div className="mt-1.5 flex items-center gap-3 text-[11px] font-600 text-muted-foreground">
            {property.bedrooms && (
              <span className="flex items-center gap-1">
                <BedDouble className="h-3.5 w-3.5" /> {property.bedrooms}
              </span>
            )}
            {property.builtup_area && (
              <span className="flex items-center gap-1">
                <Maximize className="h-3.5 w-3.5" /> {property.builtup_area}
              </span>
            )}
          </div>
        </div>
        {PhotosModal}
      </article>
    );
  }

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={`View details for ${property.title}`}
      onClick={openDetails}
      onKeyDown={handleCardKeyDown}
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
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-800 shadow-card",
              property.listing_type === "rent"
                ? "bg-emerald text-white"
                : "bg-gradient-gold text-primary-foreground shadow-gold",
            )}
          >
            {property.listing_type === "rent" ? "For Rent" : "For Sale"}
          </span>
          {property.featured && (
            <span className="rounded-full bg-gradient-gold px-2 py-0.5 text-[10px] font-800 text-primary-foreground shadow-gold">
              Featured
            </span>
          )}
          {VerifiedBadge}
        </div>
        {viewPhotosBtn("absolute bottom-2 right-2 px-2.5 py-1.5")}
      </div>
      <div className="p-3.5">
        {property.contact_name && (
          <p className="mb-1 text-[10px] font-700 uppercase tracking-wide text-gold">
            {property.contact_name}
          </p>
        )}
        <h3 className="line-clamp-1 text-[15px] font-800 leading-tight text-foreground">
          {property.title}
        </h3>
        <p className="mt-1 flex items-center gap-1 text-xs font-500 text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0 text-gold" />
          <span className="line-clamp-1">{property.location}</span>
        </p>
        <p className="mt-2 text-xl font-900 tracking-tight text-foreground">
          {formatPrice(property)}
        </p>
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
      {PhotosModal}
    </article>
  );
}
