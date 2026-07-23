import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  Layers,
  CalendarClock,
  Phone,
  MessageCircle,
  Share2,
  BadgeCheck,
  Heart,
  Video,
} from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { useProperty } from "@/lib/data";
import { formatPrice, telLink, whatsappLink, defaultEnquiryMessage, BRAND } from "@/lib/brand";
import { useFavorites } from "@/lib/useFavorites";
import { Img } from "@/components/app/Img";
import { PropertyVideo } from "@/components/app/PropertyVideo";
import { ReviewsSection } from "@/components/app/ReviewsSection";
import { ScheduleVisit } from "@/components/app/ScheduleVisit";
import { NeighborhoodHighlights } from "@/components/app/NeighborhoodHighlights";
import { PropertyMap } from "@/components/app/PropertyMap";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/properties/$id")({
  component: PropertyDetails,
});

function PropertyDetails() {
  const { id } = useParams({
    from: "/properties/$id",
  });

  const { data, isLoading } = useProperty(id);

  const { isFavorite, toggle } = useFavorites();

  const [activeImg, setActiveImg] = useState(0);

  if (isLoading) {
    return (
      <AppShell>
        <PageHeader title="Loading..." />
        <div className="p-4 space-y-4">
          <div className="aspect-[4/3] bg-card rounded-3xl animate-pulse" />
          <div className="h-6 bg-card rounded animate-pulse" />
        </div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <PageHeader title="Property" />
        <div className="p-10 text-center">
          <h2 className="font-display text-xl">Property not found</h2>

          <Link
            to="/properties"
            className="mt-4 inline-block bg-gradient-gold px-5 py-2 rounded-full"
          >
            Browse
          </Link>
        </div>
      </AppShell>
    );
  }

  const { property, images } = data;

  const gallery = Array.from(
    new Set([property.cover_image, ...images.map((image) => image.image_url)].filter(Boolean)),
  ) as string[];

  const fav = isFavorite(property.id);

  const wa = whatsappLink(
    property.contact_phone ?? BRAND.phone,
    defaultEnquiryMessage(property.title, property.contact_name ?? BRAND.name),
  );

  const specs = [
    property.bedrooms && {
      icon: BedDouble,
      label: "Beds",
      value: property.bedrooms,
    },

    property.bathrooms && {
      icon: Bath,
      label: "Bath",
      value: String(property.bathrooms),
    },

    property.builtup_area && {
      icon: Maximize,
      label: "Area",
      value: property.builtup_area,
    },

    property.floor_info && {
      icon: Layers,
      label: "Floor",
      value: property.floor_info,
    },

    property.construction_age && {
      icon: CalendarClock,
      label: "Age",
      value: property.construction_age,
    },
  ].filter(Boolean) as any[];

  const share = async () => {
    const url = window.location.href;

    if (navigator.share) {
      await navigator.share({
        title: property.title,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title={property.property_type ?? "Property"}

        subtitle={property.city ?? "Thane"}

        action={
          <div className="flex gap-2">
            <button
              onClick={() => toggle(property.id)}
              className="h-10 w-10 rounded-full border bg-card flex items-center justify-center"
            >
              <Heart className={cn("h-5", fav && "fill-destructive text-destructive")} />
            </button>

            <button
              onClick={share}
              className="h-10 w-10 rounded-full border bg-card flex items-center justify-center"
            >
              <Share2 />
            </button>
          </div>
        }
      />

      <main className="pb-28">
        <div className="px-4 pt-4">
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-luxury">
            <Img
              src={gallery[activeImg]}

              alt={property.title}

              eager

              width={480}

              sizes="(max-width: 480px) 100vw, 480px"

              className="w-full h-full object-cover"
            />

            <div className="absolute top-3 left-3 flex gap-2">
              {property.verified && (
                <span className="bg-white rounded-full px-3 py-1 text-xs text-emerald flex gap-1">
                  <BadgeCheck size={14} /> Verified
                </span>
              )}
            </div>

            {gallery.length > 0 && (
              <span className="absolute bottom-3 right-3 rounded-full bg-black/65 px-3 py-1.5 text-xs font-700 text-white">
                {activeImg + 1} / {gallery.length} photos
              </span>
            )}
          </div>

          <div className="mt-3">
            <p className="mb-2 text-xs font-700 text-muted-foreground">
              All photos ({gallery.length}) — scroll to view more
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {gallery.map((g, i) => (
                <button
                  key={g}

                  onClick={() => setActiveImg(i)}

                  className={cn(
                    "h-16 w-20 shrink-0 rounded-xl overflow-hidden border-2",
                    i === activeImg && "border-gold",
                    i !== activeImg && "border-transparent",
                  )}
                >
                  <Img src={g} alt="" width={80} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <section className="px-4 pt-5">
          <h1 className="font-display text-2xl font-bold">{property.title}</h1>

          <p className="flex gap-2 text-sm text-muted-foreground mt-2">
            <MapPin className="text-gold" />

            {property.location}
          </p>

          <p className="text-3xl font-bold text-gold mt-3">{formatPrice(property)}</p>
        </section>

        <section className="px-4 pt-5 grid grid-cols-3 gap-3">
          {specs.map((s) => (
            <div key={s.label} className="bg-card border rounded-2xl p-3">
              <s.icon className="text-gold" />

              <p className="text-xs text-muted">{s.label}</p>

              <p className="font-bold">{s.value}</p>
            </div>
          ))}
        </section>

        {property.description && (
          <section className="px-4 pt-6">
            <h2 className="font-display text-lg">About</h2>

            <p className="text-sm text-muted-foreground mt-2">{property.description}</p>
          </section>
        )}

        {property.video_url && (
          <section className="px-4 pt-6">
            <h2 className="font-display text-lg flex gap-2 items-center mb-3">
              <Video className="text-gold h-5 w-5" />
              Property Video
            </h2>

            <PropertyVideo
              url={property.video_url}
              poster={property.cover_image}
              title={property.title}
            />
          </section>
        )}

        <div className="px-4 pt-6">
          <ScheduleVisit propertyId={property.id} propertyTitle={property.title} />
        </div>

        <ReviewsSection propertyId={property.id} />

        <section className="px-4 pt-6">
          <h2 className="font-display text-lg">Amenities</h2>

          <div className="flex flex-wrap gap-2 mt-3">
            {property.amenities.map((a) => (
              <span key={a} className="px-3 py-2 rounded-full border bg-card text-xs">
                {a}
              </span>
            ))}
          </div>
        </section>

        {(property.nearby_hospital || property.nearby_school || property.nearby_highway || property.nearby_market) && (
          <section className="px-4 pt-6">
            <h2 className="font-display text-lg">Neighborhood Highlights</h2>
            <div className="mt-3">
              <NeighborhoodHighlights property={property} />
            </div>
          </section>
        )}

        {property.virtual_tour_url && (
          <section className="px-4 pt-6">
            <h2 className="font-display text-lg">3D / Virtual Tour</h2>
            <div className="mt-3 overflow-hidden rounded-2xl border border-border">
              <iframe
                src={property.virtual_tour_url}
                title="Virtual tour"
                className="aspect-video w-full"
                allow="xr-spatial-tracking; gyroscope; accelerometer"
                allowFullScreen
              />
            </div>
          </section>
        )}

        <section className="px-4 pt-6">
          <h2 className="font-display text-lg">Location on Map</h2>
          <div className="mt-3">
            <PropertyMap
              propertyId={property.id}
              title={property.title}
              fallbackLat={property.map_lat}
              fallbackLng={property.map_lng}
            />
          </div>
        </section>
      </main>

      <div className="fixed bottom-24 left-0 right-0 px-4">
        <div className="max-w-[480px] mx-auto glass rounded-2xl p-2 flex gap-2">
          <a
            href={telLink(property.contact_phone ?? BRAND.phone)}

            className="flex-1 bg-card rounded-xl py-3 text-center text-gold"
          >
            <Phone className="inline" /> Call
          </a>

          <a
            href={wa}
            target="_blank"
            rel="noreferrer"

            className="flex-1 bg-emerald text-white rounded-xl py-3 text-center"
          >
            <MessageCircle className="inline" /> WhatsApp
          </a>

          <Link
            to="/contact"

            search={{
              propertyId: property.id,
              title: property.title,
            }}

            className="flex-1 bg-gradient-gold rounded-xl py-3 text-center"
          >
            Enquire
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
