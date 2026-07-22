let mapsPromise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (mapsPromise) return mapsPromise;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API key is missing (VITE_GOOGLE_MAPS_API_KEY in .env)."));
  }

  mapsPromise = new Promise((resolve, reject) => {
    if ((window as any).google?.maps) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps."));
    document.head.appendChild(script);
  });

  return mapsPromise;
}