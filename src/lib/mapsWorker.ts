import { supabase } from "@/integrations/supabase/client";

const WORKER_URL = import.meta.env.VITE_MAPS_WORKER_URL as string | undefined;

function requireWorkerUrl(): string {
  if (!WORKER_URL) {
    throw new Error("Maps Worker URL is missing (VITE_MAPS_WORKER_URL in .env).");
  }
  return WORKER_URL.replace(/\/+$/, "");
}

export async function geocodeAndStore(
  propertyId: string,
  address: string,
): Promise<{ lat: number; lng: number }> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session?.access_token) {
    throw new Error("Your admin session has expired. Please sign in again.");
  }

  const res = await fetch(`${requireWorkerUrl()}/api/geocode`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ property_id: propertyId, address }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Geocoding failed");
  return data;
}

export async function getPropertyCoords(
  propertyId: string,
): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(`${requireWorkerUrl()}/api/property-map/${propertyId}`);
  if (res.status === 404) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Couldn't load location");
  return data;
}

export async function getAllPropertyCoords(): Promise<
  { property_id: string; lat: number; lng: number }[]
> {
  const res = await fetch(`${requireWorkerUrl()}/api/properties-map`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Couldn't load map pins");
  return data.results ?? [];
}

export async function getRoute(params: {
  propertyId: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
}): Promise<any> {
  const res = await fetch(`${requireWorkerUrl()}/api/route`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      property_id: params.propertyId,
      origin_lat: params.originLat,
      origin_lng: params.originLng,
      dest_lat: params.destLat,
      dest_lng: params.destLng,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Couldn't get directions");
  return data.route;
}
