import { useState } from "react";
import { CalendarClock, Loader2, CheckCircle2, X } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { VISIT_SLOTS } from "@/lib/options";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone: z.string().trim().regex(/^[0-9+\-\s]{8,15}$/, "Enter a valid phone number"),
  date: z.string().min(1, "Pick a date"),
  slot: z.string().min(1, "Pick a time slot"),
});

/**
 * "Schedule Visit" flow. A site-visit booking is captured straight into the
 * enquiries table (so it lands in the admin leads pipeline) with a formatted
 * message describing the requested slot.
 */
export function ScheduleVisit({ propertyId, propertyTitle }: { propertyId: string; propertyTitle: string }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", date: "", slot: VISIT_SLOTS[0] as string });

  // Don't allow booking a visit in the past.
  const today = new Date().toISOString().split("T")[0];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("enquiries").insert({
      name: parsed.data.name,
      phone: parsed.data.phone,
      property_id: propertyId,
      property_title: propertyTitle,
      message: `🗓️ Site visit requested for ${parsed.data.date}, ${parsed.data.slot}.`,
      status: "new",
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not schedule. Please try again.");
      return;
    }
    setDone(true);
    toast.success("Visit requested! Our team will confirm shortly.");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setDone(false); }}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-gold py-3.5 text-sm font-800 text-primary-foreground shadow-gold"
      >
        <CalendarClock className="h-4 w-4" /> Schedule a Visit
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-[480px] rounded-t-3xl border border-border bg-card p-5 shadow-luxury sm:rounded-3xl">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-lg font-700 text-foreground">
                <CalendarClock className="h-5 w-5 text-gold" /> Schedule a Visit
              </h3>
              <button onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-secondary">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {done ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald" />
                <p className="mt-3 font-display text-lg font-700 text-foreground">Visit requested!</p>
                <p className="mt-1 text-sm text-muted-foreground">Our team will call you to confirm your appointment.</p>
                <button onClick={() => setOpen(false)} className="mt-4 rounded-full bg-secondary px-5 py-2 text-sm font-700 text-gold">Done</button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-4 space-y-3">
                <p className="line-clamp-1 rounded-xl bg-secondary px-3 py-2 text-xs text-gold">{propertyTitle}</p>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Your name" />
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} inputMode="tel" className={inputCls} placeholder="Phone number" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" min={today} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className={cn(inputCls, !form.date && "text-muted-foreground")} />
                  <select value={form.slot} onChange={(e) => setForm((f) => ({ ...f, slot: e.target.value }))} className={inputCls}>
                    {VISIT_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-gold py-3 text-sm font-800 text-primary-foreground shadow-gold disabled:opacity-70">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
                  {submitting ? "Requesting..." : "Confirm Visit Request"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none";
