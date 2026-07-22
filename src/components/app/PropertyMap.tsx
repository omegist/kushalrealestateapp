import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/loadGoogleMaps";
import { MapPin } from "lucide-react";

export function PropertyMap({
  lat,
  lng,
  title,
}: {
  lat: number | null;
  lng: number | null;
  title: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lat == null || lng == null || !containerRef.current) return;
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const google = (window as any).google;
        const map = new google.maps.Map(containerRef.current, {
          center: { lat, lng },
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: true,
          streetViewControl: false,
        });
        new google.maps.Marker({ position: { lat, lng }, map, title });
      })
      .catch((err) => setError(err.message));

    return () => {
      cancelled = true;
    };
  }, [lat, lng, title]);

  if (lat == null || lng == null) {
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

  return <div ref={containerRef} className="h-48 w-full overflow-hidden rounded-2xl" />;
}