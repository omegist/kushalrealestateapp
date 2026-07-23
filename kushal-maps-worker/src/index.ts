export interface Env {
  MAPS_DB: D1Database;
  OLA_MAPS_SECRET_KEY: string;
  ALLOWED_ORIGINS: string;
}

function corsHeaders(origin: string | null, env: Env): HeadersInit {
  const allowed = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
  const allowOrigin = origin && allowed.includes(origin) ? origin : allowed[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data: unknown, status: number, origin: string | null, env: Env): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin, env) },
  });
}

function roundCoord(n: number): number {
  return Math.round(n * 10000) / 10000;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin, env) });
    }

    try {
      if (url.pathname === "/api/geocode" && request.method === "POST") {
        const { property_id, address } = await request.json<{
          property_id?: string;
          address?: string;
        }>();
        if (!property_id || !address) {
          return json({ error: "property_id and address are required" }, 400, origin, env);
        }

        const geoRes = await fetch(
          `https://api.olamaps.io/places/v1/geocode?address=${encodeURIComponent(address)}&api_key=${env.OLA_MAPS_SECRET_KEY}`,
          { headers: { "X-Request-Id": crypto.randomUUID() } },
        );
        const geoData = await geoRes.json<any>();
        if (!geoRes.ok) {
          return json(
            {
              error:
                geoRes.status === 401 || geoRes.status === 403
                  ? "Ola Maps authentication failed. Set a valid OLA_MAPS_SECRET_KEY Worker secret."
                  : "Ola Maps geocoding failed",
            },
            502,
            origin,
            env,
          );
        }
        const result = geoData?.geocodingResults?.[0] ?? geoData?.results?.[0];
        const location = result?.geometry?.location;
        if (!location) {
          return json({ error: "Address not found", raw: geoData }, 422, origin, env);
        }

        const lat = location.lat;
        const lng = location.lng;

        await env.MAPS_DB.prepare(
          `INSERT INTO properties_map (property_id, address, lat, lng, updated_at)
           VALUES (?, ?, ?, ?, datetime('now'))
           ON CONFLICT(property_id) DO UPDATE SET
             address = excluded.address, lat = excluded.lat, lng = excluded.lng, updated_at = datetime('now')`,
        )
          .bind(property_id, address, lat, lng)
          .run();

        return json({ lat, lng }, 200, origin, env);
      }

      if (url.pathname.startsWith("/api/property-map/") && request.method === "GET") {
        const propertyId = url.pathname.split("/").pop();
        const row = await env.MAPS_DB.prepare(
          "SELECT lat, lng FROM properties_map WHERE property_id = ?",
        )
          .bind(propertyId)
          .first();
        if (!row) return json({ error: "Not found" }, 404, origin, env);
        return json(row, 200, origin, env);
      }

      if (url.pathname === "/api/properties-map" && request.method === "GET") {
        const { results } = await env.MAPS_DB.prepare(
          "SELECT property_id, lat, lng FROM properties_map",
        ).all();
        return json({ results }, 200, origin, env);
      }

      if (url.pathname === "/api/route" && request.method === "POST") {
        const { property_id, origin_lat, origin_lng, dest_lat, dest_lng } = await request.json<{
          property_id?: string;
          origin_lat?: number;
          origin_lng?: number;
          dest_lat?: number;
          dest_lng?: number;
        }>();
        if (
          !property_id ||
          origin_lat == null ||
          origin_lng == null ||
          dest_lat == null ||
          dest_lng == null
        ) {
          return json(
            { error: "property_id, origin_lat, origin_lng, dest_lat, dest_lng are required" },
            400,
            origin,
            env,
          );
        }

        const roundedLat = roundCoord(origin_lat);
        const roundedLng = roundCoord(origin_lng);

        const cached = await env.MAPS_DB.prepare(
          `SELECT route_json FROM routes_cache
           WHERE property_id = ? AND origin_lat = ? AND origin_lng = ?
           ORDER BY created_at DESC LIMIT 1`,
        )
          .bind(property_id, roundedLat, roundedLng)
          .first<{ route_json: string }>();

        if (cached) {
          return json({ route: JSON.parse(cached.route_json), cached: true }, 200, origin, env);
        }

        const routeRes = await fetch(
          `https://api.olamaps.io/routing/v1/directions/basic?origin=${origin_lat},${origin_lng}&destination=${dest_lat},${dest_lng}&steps=true&overview=full&api_key=${env.OLA_MAPS_SECRET_KEY}`,
          { method: "POST", headers: { "X-Request-Id": crypto.randomUUID() } },
        );
        const routeData = await routeRes.json<any>();
        if (!routeRes.ok) {
          return json({ error: "Routing failed", raw: routeData }, 502, origin, env);
        }

        await env.MAPS_DB.prepare(
          `INSERT INTO routes_cache (property_id, origin_lat, origin_lng, route_json) VALUES (?, ?, ?, ?)`,
        )
          .bind(property_id, roundedLat, roundedLng, JSON.stringify(routeData))
          .run();

        return json({ route: routeData, cached: false }, 200, origin, env);
      }

      return json({ error: "Not found" }, 404, origin, env);
    } catch (err) {
      return json(
        { error: err instanceof Error ? err.message : "Unexpected error" },
        500,
        origin,
        env,
      );
    }
  },
};
