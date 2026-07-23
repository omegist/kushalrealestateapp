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

/** Creates a MapLibre map using the no-key OpenFreeMap basemap. */
export async function createPropertyMap(
  container: HTMLElement,
  opts: { center: [number, number]; zoom?: number },
) {
  const maplibregl = await loadMaplibre();
  const map = new maplibregl.Map({
    container,
    style: "https://tiles.openfreemap.org/styles/liberty",
    center: opts.center,
    zoom: opts.zoom ?? 15,
  });
  // MapLibre creates the canvas before it has downloaded the style. Awaiting the
  // style prevents a successful-looking but completely blank map on a network failure.
  await new Promise<void>((resolve, reject) => {
    const onLoad = () => {
      cleanup();
      resolve();
    };
    const onError = (event: { error?: Error }) => {
      cleanup();
      map.remove();
      reject(event.error ?? new Error("The map could not load its map tiles."));
    };
    const cleanup = () => {
      map.off("load", onLoad);
      map.off("error", onError);
    };
    map.once("load", onLoad);
    map.once("error", onError);
  });
  return map;
}

export async function getMaplibreGl() {
  return loadMaplibre();
}
