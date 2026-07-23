let maplibrePromise: Promise<any> | null = null;

function loadMaplibre(): Promise<any> {
  if (maplibrePromise) return maplibrePromise;
  maplibrePromise = new Promise((resolve, reject) => {
    if ((window as any).maplibregl) {
      resolve((window as any).maplibregl);
      return;
    }
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.css";
    document.head.appendChild(css);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.js";
    script.async = true;
    script.onload = () => resolve((window as any).maplibregl);
    script.onerror = () => reject(new Error("Failed to load the map engine."));
    document.head.appendChild(script);
  });
  return maplibrePromise;
}

export async function createOlaMap(container: HTMLElement, opts: { center: [number, number]; zoom?: number }) {
  const apiKey = import.meta.env.VITE_OLA_MAPS_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error("Ola Maps API key is missing (VITE_OLA_MAPS_API_KEY in .env).");
  }
  const maplibregl = await loadMaplibre();
  return new maplibregl.Map({
    container,
    style: `https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json?api_key=${apiKey}`,
    center: opts.center,
    zoom: opts.zoom ?? 15,
  });
}

export async function getMaplibreGl() {
  return loadMaplibre();
}