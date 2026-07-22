import { Hospital, School, MapPinned, ShoppingBasket } from "lucide-react";
import type { Property } from "@/lib/types";

const ITEMS: { key: keyof Pick<Property, "nearby_hospital" | "nearby_school" | "nearby_highway" | "nearby_market">; label: string; icon: typeof Hospital }[] = [
  { key: "nearby_hospital", label: "Hospital", icon: Hospital },
  { key: "nearby_school", label: "School", icon: School },
  { key: "nearby_highway", label: "Highway", icon: MapPinned },
  { key: "nearby_market", label: "Market", icon: ShoppingBasket },
];

export function NeighborhoodHighlights({ property }: { property: Property }) {
  const entries = ITEMS.filter((item) => property[item.key]);
  if (entries.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {entries.map(({ key, label, icon: Icon }) => (
        <div key={key} className="flex items-center gap-2.5 rounded-2xl border border-border bg-card p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-gold">
            <Icon className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-600 text-muted-foreground">{label}</p>
            <p className="truncate text-xs font-800 text-foreground">{property[key]}</p>
          </div>
        </div>
      ))}
    </div>
  );
}