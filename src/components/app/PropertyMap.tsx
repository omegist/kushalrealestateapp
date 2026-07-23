import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { createPropertyMap, getMaplibreGl } from "@/lib/loadOlaMaps";
import { getPropertyCoords, getRoute } from "@/lib/mapsWorker";

export function PropertyMap({
  propertyId,
  title,
  fallbackLat,
  fallbackLng,
}: {
  propertyId: string;
  title: string;
  fallbackLat?: number | null;
  fallbackLng?: number | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [routing, setRouting] = useState(false);
  const fallbackCoords =
    fallbackLat != null && fallbackLng != null ? { lat: fallbackLat, lng: fallbackLng } : null;

  useEffect(() => {
    let cancelled = false;
    // Coordinates saved with the listing are the source of truth. This avoids an
    // old geocoding record (for example, a same-named place in another state)
    // replacing a manually verified property pin.
    if (fallbackCoords) {
      setCoords(fallbackCoords);
      return () => {
        cancelled = true;
      };
    }

    getPropertyCoords(propertyId)
      .then((c) => !cancelled && setCoords(c ?? null))
      .catch((err) => {
        if (cancelled) return;
        if (fallbackCoords) {
          setCoords(fallbackCoords);
          return;
        }
        setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [propertyId, fallbackLat, fallbackLng]);

  useEffect(() => {
    if (!coords || !containerRef.current) return;
    const { lat, lng } = coords;
    let cancelled = false;

    createPropertyMap(containerRef.current, { center: [lng, lat], zoom: 15 })
      .then(async (map) => {
        if (cancelled) return;
        mapRef.current = map;
        const maplibregl = await getMaplibreGl();
        new maplibregl.Marker({ color: "#0f172a" }).setLngLat([lng, lat]).addTo(map);
      })
      .catch((err) => setError(err.message));

    return () => {
      cancelled = true;
      mapRef.current?.remove?.();
    };
  }, [coords]);

  const showRouteInApp = () => {
    if (!coords) return;
    if (!navigator.geolocation) {
      setError("Location access is required to show directions.");
      return;
    }
    setRouting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const route = await getRoute({
            propertyId,
            originLat: pos.coords.latitude,
            originLng: pos.coords.longitude,
            destLat: coords.lat,
            destLng: coords.lng,
          });
          const maplibregl = await getMaplibreGl();
          const routeCoords = route?.routes?.[0]?.geometry?.coordinates;
          if (mapRef.current && routeCoords) {
            if (mapRef.current.getSource("route")) {
              mapRef.current
                .getSource("route")
                .setData({
                  type: "Feature",
                  geometry: { type: "LineString", coordinates: routeCoords },
                });
            } else {
              mapRef.current.addSource("route", {
                type: "geojson",
                data: {
                  type: "Feature",
                  geometry: { type: "LineString", coordinates: routeCoords },
                },
              });
              mapRef.current.addLayer({
                id: "route",
                type: "line",
                source: "route",
                paint: { "line-color": "#c9a24b", "line-width": 5 },
              });
            }
            const bounds = routeCoords.reduce(
              (b: any, c: [number, number]) => b.extend(c),
              new maplibregl.LngLatBounds(routeCoords[0], routeCoords[0]),
            );
            mapRef.current.fitBounds(bounds, { padding: 40 });
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Couldn't load directions.");
        } finally {
          setRouting(false);
        }
      },
      () => {
        setRouting(false);
        setError("Location access is required to show directions.");
      },
    );
  };

  if (coords === undefined && !error) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl bg-secondary text-xs text-muted-foreground">
        Loading map…
      </div>
    );
  }

  if (!coords) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-1.5 rounded-2xl bg-secondary text-muted-foreground">
        <MapPin className="h-6 w-6" />
        <p className="text-xs">Map location not set for this property yet.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-1.5 rounded-2xl bg-secondary px-4 text-center text-muted-foreground">
        <MapPin className="h-6 w-6" />
        <p className="text-xs">Map unavailable: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <div ref={containerRef} className="h-48 w-full overflow-hidden rounded-2xl" />
      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
          onClick={showRouteInApp}
          disabled={routing}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-secondary py-2.5 text-xs font-700 text-foreground disabled:opacity-60"
        >
          {routing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Navigation className="h-3.5 w-3.5" />
          )}
          Directions (in-app)
        </button>
      </div>
    </div>
  );
}
