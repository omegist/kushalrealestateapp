import { useMemo, useRef, useState } from "react";
import { Search, X, MapPin, Home, TrendingUp, Clock } from "lucide-react";
import type { Property } from "@/lib/types";
import { cn } from "@/lib/utils";

const POPULAR = ["2 BHK in Thane", "Ready To Move", "Luxury Apartments", "Under 1 Cr", "Commercial"];

type Suggestion = { label: string; type: "location" | "property" | "popular"; icon: typeof Search };

export function SmartSearch({
  value,
  onChange,
  onSubmit,
  properties,
  placeholder = "Search area, property, budget...",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: (v: string) => void;
  properties: Property[];
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo<Suggestion[]>(() => {
    const term = value.trim().toLowerCase();
    if (!term) return [];
    const out: Suggestion[] = [];
    const seen = new Set<string>();

    const push = (label: string, type: Suggestion["type"], icon: typeof Search) => {
      const key = label.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ label, type, icon });
    };

    // Locations
    const locations = new Set<string>();
    properties.forEach((p) => {
      [p.location, p.city, p.locality].forEach((l) => {
        if (l && l.toLowerCase().includes(term)) locations.add(l);
      });
    });
    Array.from(locations).slice(0, 3).forEach((l) => push(l, "location", MapPin));

    // Properties
    properties
      .filter((p) => p.title.toLowerCase().includes(term))
      .slice(0, 3)
      .forEach((p) => push(p.title, "property", Home));

    // Popular / contextual
    POPULAR.filter((p) => p.toLowerCase().includes(term)).forEach((p) => push(p, "popular", TrendingUp));

    return out.slice(0, 7);
  }, [value, properties]);

  const commit = (v: string) => {
    onChange(v);
    onSubmit?.(v);
    setFocused(false);
    (document.activeElement as HTMLElement | null)?.blur();
  };

  const showPanel = focused && (value.trim().length > 0 ? suggestions.length > 0 : true);

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5">
        <Search className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => e.key === "Enter" && commit(value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm font-500 text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {value && (
          <button type="button" onClick={() => onChange("")} aria-label="Clear">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {showPanel && (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-border bg-popover shadow-luxury">
          {value.trim().length === 0 ? (
            <div className="p-2">
              <p className="px-2 py-1.5 text-[11px] font-700 uppercase tracking-wide text-muted-foreground">Popular searches</p>
              {POPULAR.map((p) => (
                <SuggestionRow key={p} icon={Clock} label={p} onClick={() => commit(p)} />
              ))}
            </div>
          ) : (
            <div className="p-2">
              {suggestions.map((s) => (
                <SuggestionRow key={s.label} icon={s.icon} label={s.label} tag={s.type} onClick={() => commit(s.label)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SuggestionRow({
  icon: Icon,
  label,
  tag,
  onClick,
}: {
  icon: typeof Search;
  label: string;
  tag?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-secondary"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
        <Icon className="h-4 w-4 text-primary" />
      </span>
      <span className="flex-1 truncate text-sm font-600 text-foreground">{label}</span>
      {tag && <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-700 capitalize", tag === "location" ? "bg-emerald/10 text-emerald" : "bg-secondary text-muted-foreground")}>{tag}</span>}
    </button>
  );
}
