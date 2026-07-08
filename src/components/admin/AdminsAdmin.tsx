import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { listAdmins, MAX_ADMINS, type AdminEntry } from "@/lib/admin.functions";
import { toast } from "sonner";

export function AdminsAdmin({ adminCount }: { adminCount: number }) {
  const [admins, setAdmins] = useState<AdminEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setAdmins(await listAdmins());
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load admins");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <h2 className="font-display text-xl font-700 text-foreground">Admin Access</h2>
      <p className="text-sm text-muted-foreground">{adminCount} of {MAX_ADMINS} admin seats used.</p>

      <div className="mt-5 max-w-md rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center gap-2 text-gold">
          <ShieldCheck className="h-5 w-5" />
          <h3 className="font-700 text-foreground">Current Admins</h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Admin access is granted automatically to the first {MAX_ADMINS} people who sign up —
          all {MAX_ADMINS} admins are equal, and there is no manual grant step.
        </p>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading admins…
            </div>
          ) : admins.length === 0 ? (
            <p className="text-sm text-muted-foreground">No admins yet.</p>
          ) : (
            <ul className="space-y-2">
              {admins.map((a) => (
                <li
                  key={a.user_id}
                  className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm"
                >
                  <span className="font-600 text-foreground">{a.email ?? a.user_id}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
