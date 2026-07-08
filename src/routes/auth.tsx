import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LogoMark } from "@/components/app/Logo";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign In — Kushal Enterprises" }] }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(160),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

/**
 * Checks whether the current user has the admin role, retrying briefly to
 * absorb the tiny delay between the auth user being created and the DB
 * trigger inserting the admin role row for the first 5 signups.
 */
async function waitForAdminRole(attempts = 4, delayMs = 400): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  for (let i = 0; i < attempts; i++) {
    const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (data) return true;
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: window.location.origin + "/" },
        });
        if (error) throw error;
        // If email confirmation is enabled there is no session yet — the user
        // must confirm before they can sign in.
        if (!data.session) {
          toast.success("Account created. Check your email to confirm, then sign in.");
          setMode("signin");
          setPassword("");
          return;
        }
        toast.success("Account created. Signing you in...");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
      }

      // Route by role: admins go to the dashboard, customers return to the app.
      // The first 5 signups are made admins by a DB trigger that runs right
      // after the auth user is created, so on a fresh signup the role row may
      // land a moment later — retry a few times before giving up.
      const isAdmin = await waitForAdminRole();
      toast.success("Login successful.");
      navigate({ to: isAdmin ? "/authenticated/admin" : "/wishlist" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[oklch(0.13_0.024_258)] px-5">
      <div className="pointer-events-none absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[oklch(0.81_0.13_84/0.15)] blur-3xl" />
      <div className="relative w-full max-w-sm">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-xs font-600 text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to app
        </Link>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-luxury">
          <div className="flex flex-col items-center text-center">
            <LogoMark className="h-16 w-16" />
            <div className="mt-3 flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-600 text-gold">
              <ShieldCheck className="h-3.5 w-3.5" /> Secure Login
            </div>
            <h1 className="mt-3 font-display text-xl font-800 text-foreground">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">Kushal Enterprises</p>
          </div>

          <form onSubmit={submit} className="mt-5 space-y-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-600 text-muted-foreground">Email</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" className={inputCls} placeholder="admin@kushal.com" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-600 text-muted-foreground">Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="••••••••" />
            </label>
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-gold py-3 text-sm font-800 text-primary-foreground shadow-gold disabled:opacity-70">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <button
            onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
            className="mt-4 w-full text-center text-xs text-muted-foreground"
          >
            {mode === "signin" ? "Need an account? " : "Already have an account? "}
            <span className="font-700 text-gold">{mode === "signin" ? "Sign up" : "Sign in"}</span>
          </button>
        </div>
        <p className="mt-4 text-center text-[10px] text-muted-foreground">
          Log in to save properties to your wishlist. Browsing the app needs no account.
        </p>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none";
