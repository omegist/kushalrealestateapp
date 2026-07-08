import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Star, PencilLine, Loader2, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useReviews } from "@/lib/data";
import { Stars, StarInput } from "@/components/app/Stars";
import { cn } from "@/lib/utils";

// Reviews can describe the property itself, the society/building, or the area.
const REVIEW_TYPES = [
  { value: "property", label: "Property" },
  { value: "society", label: "Society" },
  { value: "area", label: "Area" },
] as const;

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  rating: z.number().int().min(1, "Pick a rating").max(5),
  review_type: z.string(),
  comment: z.string().trim().max(600).optional().or(z.literal("")),
});

export function ReviewsSection({ propertyId }: { propertyId: string }) {
  const { data: reviews = [], isLoading } = useReviews(propertyId);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ name: "", rating: 5, review_type: "property", comment: "" });

  const average = useMemo(
    () => (reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0),
    [reviews],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      property_id: propertyId,
      name: parsed.data.name,
      rating: parsed.data.rating,
      review_type: parsed.data.review_type,
      comment: parsed.data.comment || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not submit review. Please try again.");
      return;
    }
    setDone(true);
    setForm({ name: "", rating: 5, review_type: "property", comment: "" });
    qc.invalidateQueries({ queryKey: ["reviews", propertyId] });
    toast.success("Thanks! Your review has been posted.");
  };

  return (
    <section className="px-4 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-700 text-foreground">
          <Star className="h-5 w-5 text-gold" /> Reviews &amp; Ratings
        </h2>
        <button
          type="button"
          onClick={() => { setOpen((o) => !o); setDone(false); }}
          className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-700 text-gold"
        >
          <PencilLine className="h-3.5 w-3.5" /> Write a review
        </button>
      </div>

      {/* Aggregate */}
      {reviews.length > 0 && (
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="text-center">
            <p className="font-display text-3xl font-900 text-foreground">{average.toFixed(1)}</p>
            <Stars value={average} />
          </div>
          <div className="border-l border-border pl-3 text-xs text-muted-foreground">
            Based on <span className="font-700 text-foreground">{reviews.length}</span> verified{" "}
            {reviews.length === 1 ? "review" : "reviews"}
          </div>
        </div>
      )}

      {/* Review form */}
      {open && (
        done ? (
          <div className="mt-3 flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center shadow-card">
            <CheckCircle2 className="h-10 w-10 text-emerald" />
            <p className="mt-2 text-sm font-600 text-foreground">Review posted. Thank you!</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-3 space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card">
            <div>
              <span className="mb-1.5 block text-[11px] font-600 text-muted-foreground">Your rating</span>
              <StarInput value={form.rating} onChange={(rating) => setForm((f) => ({ ...f, rating }))} />
            </div>
            <div className="flex flex-wrap gap-2">
              {REVIEW_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, review_type: t.value }))}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-700 transition",
                    form.review_type === t.value
                      ? "border-transparent bg-gradient-gold text-primary-foreground shadow-gold"
                      : "border-border bg-background text-muted-foreground",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputCls}
              placeholder="Your name"
            />
            <textarea
              value={form.comment}
              onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              rows={3}
              className={inputCls}
              placeholder="Share your experience with this property, society or area..."
            />
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-gold py-3 text-sm font-800 text-primary-foreground shadow-gold disabled:opacity-70"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PencilLine className="h-4 w-4" />}
              {submitting ? "Posting..." : "Post Review"}
            </button>
          </form>
        )
      )}

      {/* List */}
      <div className="mt-3 space-y-2.5">
        {isLoading ? (
          <div className="h-20 animate-pulse rounded-2xl bg-card" />
        ) : reviews.length === 0 ? (
          !open && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">No reviews yet. Be the first to share your experience.</p>
            </div>
          )
        ) : (
          reviews.map((r) => {
            const type = REVIEW_TYPES.find((t) => t.value === r.review_type);
            return (
              <div key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-gold text-xs font-800 text-primary-foreground">
                      {r.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-700 leading-tight text-foreground">{r.name}</p>
                      <Stars value={r.rating} size={12} />
                    </div>
                  </div>
                  {type && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-700 text-gold">{type.label}</span>
                  )}
                </div>
                {r.comment && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.comment}</p>}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none";
