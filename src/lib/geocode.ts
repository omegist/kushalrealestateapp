export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error("Google Maps API key is missing (VITE_GOOGLE_MAPS_API_KEY in .env).");
  }
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== "OK" || !data.results?.[0]) {
    throw new Error(data.error_message || `Couldn't find that address (${data.status}).`);
  }
  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng };
}