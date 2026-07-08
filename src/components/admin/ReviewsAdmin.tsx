import { useQueryClient } from "@tanstack/react-query";
import { Star, Check, EyeOff, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminReviews, useAdminProperties } from "@/lib/adminData";
import { toast } from "sonner";
import type { Review } from "@/lib/types";

export function ReviewsAdmin() {
  const { data: reviews = [], isLoading } = useAdminReviews();
  const { data: properties = [] } = useAdminProperties();
  const qc = useQueryClient();

  const titleFor = (id: string | null) => properties.find((p) => p.id === id)?.title ?? "General";

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
    qc.invalidateQueries({ queryKey: ["reviews"] });
  };

  const setApproved = async (r: Review, approved: boolean) => {
    const { error } = await supabase.from("reviews").update({ approved }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success(approved ? "Review published" : "Review hidden");
    refresh();
  };

  const remove = async (r: Review) => {
    if (!confirm("Delete this review permanently?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Review deleted");
    refresh();
  };

  return (
    <div>
      <h2 className="font-display text-xl font-700 text-foreground">Reviews &amp; Ratings</h2>
      <p className="text-sm text-muted-foreground">{reviews.length} total reviews — publish, hide or remove customer feedback.</p>

      {isLoading ? (
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-card" />
      ) : reviews.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">No reviews yet.</p>
      ) : (
        <div className="mt-5 space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-700 text-foreground">{r.name}</p>
                    <span className="flex items-center gap-0.5 text-gold">
                      {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-gold" />)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("en-IN")} · <span className="capitalize">{r.review_type}</span> · {titleFor(r.property_id)}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-600 ${r.approved ? "bg-emerald/20 text-emerald" : "bg-gold/20 text-gold"}`}>
                  {r.approved ? "Published" : "Hidden"}
                </span>
              </div>
              {r.comment && <p className="mt-2 text-sm text-foreground">{r.comment}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {r.approved ? (
                  <button onClick={() => setApproved(r, false)} className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-600 text-gold"><EyeOff className="h-3.5 w-3.5" /> Hide</button>
                ) : (
                  <button onClick={() => setApproved(r, true)} className="flex items-center gap-1 rounded-lg bg-emerald/15 px-3 py-1.5 text-xs font-600 text-emerald"><Check className="h-3.5 w-3.5" /> Publish</button>
                )}
                <button onClick={() => remove(r)} className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-600 text-destructive"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
