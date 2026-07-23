import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { createPropertyMap, getMaplibreGl } from "@/lib/loadOlaMaps";
import { getAllPropertyCoords } from "@/lib/mapsWorker";
import { formatPrice } from "@/lib/brand";
import type { Property } from "@/lib/types";

export function PropertiesMap({ properties }: { properties: Property[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pinCount, setPinCount] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        const coords = await getAllPropertyCoords();
        const byId = new Map(coords.map((c) => [c.property_id, c]));
        const pinned = properties
          .map((p) => ({ property: p, coord: byId.get(p.id) }))
          .filter((x): x is { property: Property; coord: { property_id: string; lat: number; lng: number } } => !!x.coord);

        if (cancelled) return;
        setPinCount(pinned.length);
        if (pinned.length === 0) {
          setLoading(false);
          return;
        }

        const center: [number, number] = [pinned[0].coord.lng, pinned[0].coord.lat];
        const map = await createPropertyMap(containerRef.current!, { center, zoom: 11 });
        const maplibregl = await getMaplibreGl();

        const bounds = new maplibregl.LngLatBounds();
        pinned.forEach(({ property, coord }) => {
          bounds.extend([coord.lng, coord.lat]);
          const popup = new maplibregl.Popup({ offset: 20 }).setHTML(
            `<div style="font-family:sans-serif;min-width:170px">
               <p style="font-weight:700;font-size:13px;margin:0 0 4px">${property.title}</p>
               <p style="font-size:12px;color:#666;margin:0 0 4px">${property.location}</p>
               <p style="font-weight:800;font-size:13px;margin:0 0 6px">${formatPrice(property)}</p>
               <a href="/properties/${property.id}" style="font-size:12px;font-weight:700;color:#b8860b;text-decoration:none">View Details →</a>
             </div>`,
          );
          new maplibregl.Marker({ color: "#0f172a" })
            .setLngLat([coord.lng, coord.lat])
            .setPopup(popup)
            .addTo(map);
        });
        if (pinned.length > 1) map.fitBounds(bounds, { padding: 50 });
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Couldn't load map");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [properties]);

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center rounded-2xl bg-secondary text-muted-foreground text-xs">Loading map…</div>;
  }

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-1.5 rounded-2xl bg-secondary px-4 text-center text-muted-foreground">
        <MapPin className="h-6 w-6" />
        <p className="text-xs">Map unavailable: {error}</p>
      </div>
    );
  }

  if (pinCount === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-1.5 rounded-2xl bg-secondary text-muted-foreground">
        <MapPin className="h-6 w-6" />
        <p className="text-xs">No properties have a map location set yet.</p>
      </div>
    );
  }

  return <div ref={containerRef} className="h-[60vh] w-full overflow-hidden rounded-2xl" />;
}
