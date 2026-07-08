import { useQuery } from "@tanstack/react-query";
import { Building2, MessageSquare, Users, Star } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

function useCount(table: string, filter?: (q: any) => any) {
  return useQuery({
    queryKey: ["admin", "count", table, filter?.toString()],
    queryFn: async () => {
      let q = supabase.from(table as any).select("*", { count: "exact", head: true });
      if (filter) q = filter(q);
      const { count, error } = await q;
      if (error) throw error;
      return count ?? 0;
    },
  });
}

// Pull light rows for client-side aggregation (small admin dataset).
function useEnquiryRows() {
  return useQuery({
    queryKey: ["admin", "overview", "enquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enquiries")
        .select("id,name,status,property_title,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function usePropertyRows() {
  return useQuery({
    queryKey: ["admin", "overview", "properties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("properties").select("id,category_slug,status");
      if (error) throw error;
      return data ?? [];
    },
  });
}

const STATUS_ORDER = ["new", "contacted", "visited", "closed"];
const STATUS_COLORS: Record<string, string> = {
  new: "var(--gold)",
  contacted: "oklch(0.62 0.14 250)",
  visited: "oklch(0.55 0.16 300)",
  closed: "var(--emerald)",
};

export function Overview() {
  const props = useCount("properties");
  const featured = useCount("properties", (q) => q.eq("featured", true));
  const enquiries = useCount("enquiries");
  const newEnq = useCount("enquiries", (q) => q.eq("status", "new"));
  const team = useCount("team_members");
  const reviews = useCount("reviews");

  const { data: enqRows = [] } = useEnquiryRows();
  const { data: propRows = [] } = usePropertyRows();

  const cards = [
    { label: "Total Properties", value: props.data, icon: Building2, hint: `${featured.data ?? 0} featured` },
    { label: "Total Enquiries", value: enquiries.data, icon: MessageSquare, hint: `${newEnq.data ?? 0} new leads` },
    { label: "Reviews", value: reviews.data, icon: Star, hint: "Customer feedback" },
    { label: "Team Members", value: team.data, icon: Users, hint: "Active" },
  ];

  const enquiriesByStatus = STATUS_ORDER.map((s) => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    key: s,
    value: enqRows.filter((e: any) => e.status === s).length,
  }));

  const propsByCategory = Object.entries(
    propRows.reduce((acc: Record<string, number>, p: any) => {
      const k = p.category_slug || "other";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

  const recent = enqRows.slice(0, 5);

  return (
    <div>
      <h2 className="font-display text-xl font-700 text-foreground">Dashboard Overview</h2>
      <p className="text-sm text-muted-foreground">Welcome to the Kushal Enterprises admin panel.</p>

      {/* Stat cards */}
      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-gold">
              <c.icon className="h-5 w-5" />
            </span>
            <p className="mt-3 font-display text-3xl font-800 text-foreground">{c.value ?? "—"}</p>
            <p className="text-xs font-600 text-muted-foreground">{c.label}</p>
            <p className="mt-1 text-[11px] text-gold">{c.hint}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="font-display text-sm font-700 text-foreground">Leads by Status</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enquiriesByStatus} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "var(--secondary)" }} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {enquiriesByStatus.map((d) => (
                    <Cell key={d.key} fill={STATUS_COLORS[d.key] ?? "var(--gold)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="font-display text-sm font-700 text-foreground">Properties by Category</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={propsByCategory} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "var(--secondary)" }} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="var(--gold)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent enquiries */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-card">
        <h3 className="font-display text-sm font-700 text-foreground">Recent Enquiries</h3>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No enquiries yet.</p>
        ) : (
          <div className="mt-3 divide-y divide-border">
            {recent.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-600 text-foreground">{e.name}</p>
                  {e.property_title && <p className="truncate text-xs text-muted-foreground">{e.property_title}</p>}
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-600 capitalize text-gold">{e.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
