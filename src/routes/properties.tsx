import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, LayoutGrid, List, SlidersHorizontal, X, Check } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { PropertyCard } from "@/components/app/PropertyCard";
import { SmartSearch } from "@/components/app/SmartSearch";
import { useProperties, useCategories } from "@/lib/data";
import { formatPrice } from "@/lib/brand";
import { cn } from "@/lib/utils";

type Search = {
  q?: string;
  category?: string;
  type?: string;
  config?: string;
  possession?: string;
  facing?: string;
  amenities?: string;
  location?: string;
  min?: number;
  max?: number;
};

function str(v: unknown) {
  return typeof v === "string" && v ? v : undefined;
}
function num(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export const Route = createFileRoute("/properties")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: str(s.q),
    category: str(s.category),
    type: str(s.type),
    config: str(s.config),
    possession: str(s.possession),
    facing: str(s.facing),
    amenities: str(s.amenities),
    location: str(s.location),
    min: num(s.min),
    max: num(s.max),
  }),
  head: () => ({
    meta: [
      { title: "All Properties — Kushal Enterprises" },
      { name: "description", content: "Explore all verified residential, commercial and plot listings across Thane with Kushal Enterprises." },
    ],
  }),
  component: PropertiesPage,
});

const CONFIGS = ["1 BHK", "2 BHK", "3 BHK", "4 BHK"];
const POSSESSION = ["Ready To Move", "Under Construction"];
const FACING = ["East", "West", "North", "South"];
const TYPES = ["Apartment", "Villa", "Flat", "Commercial", "Plot"];
const AMENITIES = ["Gym", "Swimming Pool", "Parking", "Security", "Club House", "Lift", "Garden"];
const PRICE_MIN = 0;
const PRICE_MAX = 30000000; // 3 Cr

function PropertiesPage() {
  const navigate = useNavigate({ from: "/properties" });
  const search = Route.useSearch();
  const { data: all = [], isLoading } = useProperties();
  const { data: categories = [] } = useCategories();

  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState(search.q ?? "");
  const [showFilters, setShowFilters] = useState(false);

  const activeCategory = search.category ?? "all";
  const selAmenities = (search.amenities ?? "").split(",").map((s: string) => s.trim()).filter(Boolean);

  const setCategory = (slug: string) => {
    navigate({ search: (p: Search) => ({ ...p, category: slug === "all" ? undefined : slug }) });
  };

  const activeFilterCount =
    (search.type ? 1 : 0) +
    (search.config ? 1 : 0) +
    (search.possession ? 1 : 0) +
    (search.facing ? 1 : 0) +
    (search.location ? 1 : 0) +
    (search.min || search.max ? 1 : 0) +
    selAmenities.length;

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return all.filter((p) => {
      if (activeCategory !== "all" && p.category_slug !== activeCategory) return false;
      if (search.min != null && p.price_value != null && p.price_value < search.min) return false;
      if (search.max != null && p.price_value != null && p.price_value > search.max) return false;
      if (search.type && !`${p.property_type ?? ""}`.toLowerCase().includes(search.type.toLowerCase())) return false;
      if (search.config && !`${p.bedrooms ?? ""} ${p.property_type ?? ""}`.toLowerCase().includes(search.config.toLowerCase())) return false;
      if (search.possession && `${p.possession_status ?? ""}`.toLowerCase() !== search.possession.toLowerCase()) return false;
      if (search.facing && !`${p.facing ?? ""}`.toLowerCase().includes(search.facing.toLowerCase())) return false;
      if (search.location) {
        const loc = `${p.location} ${p.city ?? ""} ${p.locality ?? ""}`.toLowerCase();
        if (!loc.includes(search.location.toLowerCase())) return false;
      }
      if (selAmenities.length) {
        const has = (p.amenities ?? []).map((a: string) => a.toLowerCase());
        if (!selAmenities.every((a: string) => has.some((h: string) => h.includes(a.toLowerCase())))) return false;
      }
      if (term) {
        const hay = `${p.title} ${p.location} ${p.city ?? ""} ${p.property_type ?? ""} ${p.locality ?? ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [all, activeCategory, query, search, selAmenities.join(",")]);

  return (
    <AppShell>
      <PageHeader
        title="All Properties"
        subtitle={`${results.length} listings available`}
        action={
          <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
            <button onClick={() => setView("grid")} className={cn("flex h-8 w-8 items-center justify-center rounded-full", view === "grid" && "bg-gradient-primary text-primary-foreground")}>
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button onClick={() => setView("list")} className={cn("flex h-8 w-8 items-center justify-center rounded-full", view === "list" && "bg-gradient-primary text-primary-foreground")}>
              <List className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <div className="sticky top-[68px] z-20 glass px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SmartSearch
              value={query}
              onChange={setQuery}
              properties={all}
              onSubmit={(v) => setQuery(v)}
            />
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className={cn("relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border", activeFilterCount ? "border-transparent bg-gradient-primary text-primary-foreground" : "border-border bg-card text-foreground")}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-800 text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto pb-0.5">
          {[{ name: "All", slug: "all" }, ...categories].map((c) => (
            <button
              key={c.slug}
              onClick={() => setCategory(c.slug)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-xs font-700 transition-colors",
                activeCategory === c.slug ? "border-transparent bg-gradient-primary text-primary-foreground" : "border-border bg-card text-muted-foreground",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <main className="px-4 pt-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-card" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="font-display text-lg font-700 text-foreground">No properties found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters or search.</p>
            {activeFilterCount > 0 && (
              <button
                onClick={() => navigate({ search: { q: query || undefined } as Search })}
                className="mt-4 rounded-full bg-gradient-primary px-5 py-2 text-sm font-700 text-primary-foreground"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 gap-3">
            {results.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {results.map((p) => (
              <PropertyCard key={p.id} property={p} view="list" />
            ))}
          </div>
        )}
      </main>

      {showFilters && (
        <FilterSheet
          search={search}
          onClose={() => setShowFilters(false)}
          onApply={(next) => {
            navigate({ search: (p: Search) => ({ ...p, ...next }) });
            setShowFilters(false);
          }}
          onClear={() => {
            navigate({ search: { q: query || undefined, category: search.category } as Search });
            setShowFilters(false);
          }}
        />
      )}
    </AppShell>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-2 text-xs font-700 transition-colors",
        active ? "border-transparent bg-gradient-primary text-primary-foreground" : "border-border bg-card text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function FilterSheet({
  search,
  onClose,
  onApply,
  onClear,
}: {
  search: Search;
  onClose: () => void;
  onApply: (next: Partial<Search>) => void;
  onClear: () => void;
}) {
  const [type, setType] = useState(search.type);
  const [config, setConfig] = useState(search.config);
  const [possession, setPossession] = useState(search.possession);
  const [facing, setFacing] = useState(search.facing);
  const [location, setLocation] = useState(search.location ?? "");
  const [min, setMin] = useState(search.min ?? PRICE_MIN);
  const [max, setMax] = useState(search.max ?? PRICE_MAX);
  const [amenities, setAmenities] = useState<string[]>(
    (search.amenities ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  );

  const toggleAmenity = (a: string) =>
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const toggleSingle = (cur: string | undefined, val: string, set: (v: string | undefined) => void) =>
    set(cur === val ? undefined : val);

  const apply = () => {
    onApply({
      type,
      config,
      possession,
      facing,
      location: location.trim() || undefined,
      amenities: amenities.length ? amenities.join(",") : undefined,
      min: min > PRICE_MIN ? min : undefined,
      max: max < PRICE_MAX ? max : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-float-up absolute inset-x-0 bottom-0 mx-auto max-h-[88vh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl bg-background p-5 pb-8 shadow-luxury">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-800 text-foreground">Filters</h2>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
            <X className="h-4 w-4 text-foreground" />
          </button>
        </div>

        <FilterGroup label="Budget">
          <div className="flex items-center justify-between text-sm font-700 text-foreground">
            <span>{formatPrice({ price_label: null, price_value: min })}</span>
            <span>{max >= PRICE_MAX ? "₹3 Cr+" : formatPrice({ price_label: null, price_value: max })}</span>
          </div>
          <div className="mt-3 space-y-3">
            <input
              type="range" min={PRICE_MIN} max={PRICE_MAX} step={500000} value={min}
              onChange={(e) => setMin(Math.min(Number(e.target.value), max))}
              className="w-full accent-[var(--primary)]"
            />
            <input
              type="range" min={PRICE_MIN} max={PRICE_MAX} step={500000} value={max}
              onChange={(e) => setMax(Math.max(Number(e.target.value), min))}
              className="w-full accent-[var(--primary)]"
            />
          </div>
        </FilterGroup>

        <FilterGroup label="Configuration">
          <div className="flex flex-wrap gap-2">
            {CONFIGS.map((c) => (
              <Chip key={c} active={config === c} onClick={() => toggleSingle(config, c, setConfig)}>{c}</Chip>
            ))}
          </div>
        </FilterGroup>

        <FilterGroup label="Property Type">
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <Chip key={t} active={type === t} onClick={() => toggleSingle(type, t, setType)}>{t}</Chip>
            ))}
          </div>
        </FilterGroup>

        <FilterGroup label="Possession Status">
          <div className="flex flex-wrap gap-2">
            {POSSESSION.map((p) => (
              <Chip key={p} active={possession === p} onClick={() => toggleSingle(possession, p, setPossession)}>{p}</Chip>
            ))}
          </div>
        </FilterGroup>

        <FilterGroup label="Facing Direction">
          <div className="flex flex-wrap gap-2">
            {FACING.map((f) => (
              <Chip key={f} active={facing === f} onClick={() => toggleSingle(facing, f, setFacing)}>{f} Facing</Chip>
            ))}
          </div>
        </FilterGroup>

        <FilterGroup label="Amenities">
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-700 transition-colors",
                  amenities.includes(a) ? "border-transparent bg-gradient-primary text-primary-foreground" : "border-border bg-card text-foreground",
                )}
              >
                {amenities.includes(a) && <Check className="h-3.5 w-3.5" />} {a}
              </button>
            ))}
          </div>
        </FilterGroup>

        <FilterGroup label="Location / Locality">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Thane, Dhokali, Kalwa"
            className="w-full rounded-xl border border-border bg-card px-3.5 py-3 text-sm font-500 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </FilterGroup>

        <div className="mt-6 flex gap-3">
          <button onClick={onClear} className="flex-1 rounded-full border border-border bg-card py-3 text-sm font-700 text-foreground">
            Clear all
          </button>
          <button onClick={apply} className="flex-[1.4] rounded-full bg-gradient-primary py-3 text-sm font-800 text-primary-foreground shadow-card">
            Show results
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border py-4 first:border-t-0 first:pt-0">
      <p className="mb-2.5 text-sm font-800 text-foreground">{label}</p>
      {children}
    </div>
  );
}
