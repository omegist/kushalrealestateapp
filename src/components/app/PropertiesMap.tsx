import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/loadGoogleMaps";
import { formatPrice } from "@/lib/brand";
import type { Property } from "@/lib/types";
import { MapPin } from "lucide-react";

export function PropertiesMap({ properties }: { properties: Property[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  const pinned = properties.filter((p) => p.map_lat != null && p.map_lng != null);

  useEffect(() => {
    if (!containerRef.current || pinned.length === 0) return;
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const google = (window as any).google;
        const bounds = new google.maps.LatLngBounds();
        const map = new google.maps.Map(containerRef.current, {
          zoom: 12,
          disableDefaultUI: true,
          zoomControl: true,
        });
        const infoWindow = new google.maps.InfoWindow();

        pinned.forEach((p) => {
          const position = { lat: p.map_lat as number, lng: p.map_lng as number };
          bounds.extend(position);
          const marker = new google.maps.Marker({ position, map, title: p.title });
          marker.addListener("click", () => {
            infoWindow.setContent(
              `<div style="font-family:sans-serif;min-width:170px">
                 <p style="font-weight:700;font-size:13px;margin:0 0 4px">${p.title}</p>
                 <p style="font-size:12px;color:#666;margin:0 0 4px">${p.location}</p>
                 <p style="font-weight:800;font-size:13px;margin:0 0 6px">${formatPrice(p)}</p>
                 <a href="/properties/${p.id}" style="font-size:12px;font-weight:700;color:#b8860b;text-decoration:none">View Details →</a>
               </div>`,
            );
            infoWindow.open(map, marker);
          });
        });

        map.fitBounds(bounds);
        if (pinned.length === 1) map.setZoom(15);
      })
      .catch((err) => setError(err.message));

    return () => {
      cancelled = true;
    };
  }, [pinned.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (pinned.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-1.5 rounded-2xl bg-secondary text-muted-foreground">
        <MapPin className="h-6 w-6" />
        <p className="text-xs">No properties have a map location set yet.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-1.5 rounded-2xl bg-secondary px-4 text-center text-muted-foreground">
        <MapPin className="h-6 w-6" />
        <p className="text-xs">Map unavailable: {error}</p>
      </div>
    );
  }

  return <div ref={containerRef} className="h-[60vh] w-full overflow-hidden rounded-2xl" />;
}