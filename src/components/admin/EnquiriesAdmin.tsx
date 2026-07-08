import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Phone, MessageCircle, Mail, Search, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminEnquiries } from "@/lib/adminData";
import { telLink, whatsappLink, defaultEnquiryMessage } from "@/lib/brand";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Enquiry } from "@/lib/types";

const STATUSES = ["new", "contacted", "visited", "closed"];
const statusColor: Record<string, string> = {
  new: "bg-gold/20 text-gold",
  contacted: "bg-blue-500/20 text-blue-400",
  visited: "bg-purple-500/20 text-purple-400",
  closed: "bg-emerald/20 text-emerald",
};

export function EnquiriesAdmin() {
  const { data: enquiries = [], isLoading } = useAdminEnquiries();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [live, setLive] = useState(false);

  // Real-time leads: refresh the list the instant a new enquiry is inserted or
  // updated, so the admin sees walk-in leads without reloading.
  useEffect(() => {
    const channel = supabase
      .channel("admin-enquiries")
      .on("postgres_changes", { event: "*", schema: "public", table: "enquiries" }, (payload) => {
        qc.invalidateQueries({ queryKey: ["admin", "enquiries"] });
        qc.invalidateQueries({ queryKey: ["admin", "count", "enquiries"] });
        qc.invalidateQueries({ queryKey: ["admin", "overview", "enquiries"] });
        if (payload.eventType === "INSERT") toast.success("New enquiry received");
      })
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return enquiries.filter((e) => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (!term) return true;
      return `${e.name} ${e.phone} ${e.email ?? ""} ${e.property_title ?? ""} ${e.preferred_location ?? ""}`
        .toLowerCase()
        .includes(term);
    });
  }, [enquiries, search, statusFilter]);

  const updateStatus = async (e: Enquiry, status: string) => {
    const { error } = await supabase.from("enquiries").update({ status }).eq("id", e.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin", "enquiries"] });
    qc.invalidateQueries({ queryKey: ["admin", "count", "enquiries"] });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-xl font-700 text-foreground">Enquiries</h2>
        <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-600", live ? "bg-emerald/15 text-emerald" : "bg-secondary text-muted-foreground")}>
          <Radio className="h-3 w-3" /> {live ? "Live" : "Connecting…"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{filtered.length} of {enquiries.length} leads</p>

      {/* Search + status filter */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, property…"
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["all", ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-600 capitalize transition",
                statusFilter === s ? "bg-gradient-gold text-primary-foreground shadow-gold" : "bg-secondary text-muted-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-card" />
      ) : filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">No enquiries match.</p>
      ) : (
        <div className="mt-5 space-y-3">
          {filtered.map((e) => (
            <div key={e.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-700 text-foreground">{e.name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString("en-IN")}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-600 capitalize ${statusColor[e.status] ?? "bg-secondary"}`}>{e.status}</span>
              </div>

              {e.property_title && <p className="mt-2 rounded-lg bg-secondary px-2.5 py-1.5 text-xs text-gold">Property: {e.property_title}</p>}
              {e.message && <p className="mt-2 text-sm text-foreground">{e.message}</p>}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>📞 {e.phone}</span>
                {e.email && <span>✉ {e.email}</span>}
                {e.budget && <span>💰 {e.budget}</span>}
                {e.preferred_location && <span>📍 {e.preferred_location}</span>}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a href={telLink(e.phone)} className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-600 text-gold"><Phone className="h-3.5 w-3.5" /> Call</a>
                <a href={whatsappLink(e.phone, defaultEnquiryMessage(e.property_title ?? undefined))} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg bg-[oklch(0.74_0.15_162)] px-3 py-1.5 text-xs font-600 text-primary-foreground"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>
                {e.email && <a href={`mailto:${e.email}`} className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-600 text-foreground"><Mail className="h-3.5 w-3.5" /> Email</a>}
                <select value={e.status} onChange={(ev) => updateStatus(e, ev.target.value)} className="ml-auto rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs capitalize text-foreground">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
