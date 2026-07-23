CREATE TABLE IF NOT EXISTS properties_map (
  property_id TEXT PRIMARY KEY,
  address     TEXT NOT NULL,
  lat         REAL NOT NULL,
  lng         REAL NOT NULL,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS routes_cache (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id  TEXT NOT NULL,
  origin_lat   REAL NOT NULL,
  origin_lng   REAL NOT NULL,
  route_json   TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_routes_cache_lookup
  ON routes_cache (property_id, origin_lat, origin_lng);