import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Building2, MessageSquare, Users, Images, ShieldCheck,
  Star, LogOut, Loader2, Menu, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAdminStatus } from "@/lib/admin.functions";
import { Logo } from "@/components/app/Logo";
import { Overview } from "@/components/admin/Overview";
import { PropertiesAdmin } from "@/components/admin/PropertiesAdmin";
import { EnquiriesAdmin } from "@/components/admin/EnquiriesAdmin";
import { TeamAdmin } from "@/components/admin/TeamAdmin";
import { BannersAdmin } from "@/components/admin/BannersAdmin";
import { ReviewsAdmin } from "@/components/admin/ReviewsAdmin";
import { btnGhost } from "@/components/admin/ui";
import { toast } from "sonner";

export const Route = createFileRoute("/authenticated/admin")(
  {
    head: () => ({ meta: [{ title: "Admin Dashboard — Kushal Enterprises" }] }),
    component: AdminDashboard,
  }
);

type Tab = "overview" | "properties" | "enquiries" | "reviews" | "team" | "banners";
const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "properties", label: "Properties", icon: Building2 },
  { id: "enquiries", label: "Enquiries", icon: MessageSquare },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "team", label: "Team", icon: Users },
  { id: "banners", label: "Banners", icon: Images },
];

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<{ isAdmin: boolean; adminCount: number } | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAdminStatus();
      setState(res);
    } catch {
      setState(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  if (!state?.isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <ShieldCheck className="h-12 w-12 text-gold" />
        <h1 className="mt-4 font-display text-xl font-800 text-foreground">No admin access</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          This account isn't one of the 5 admins. Admin access is granted automatically to the
          first 5 people who sign up — those 5 seats are already taken.
        </p>
        <div className="mt-5 flex gap-2">
          <Link to="/" className={btnGhost}>Back to App</Link>
          <button onClick={signOut} className={btnGhost}><LogOut className="h-4 w-4" /> Sign Out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-card transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <Logo compact />
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden"><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <nav className="space-y-1 p-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSidebarOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-600 transition ${tab === t.id ? "bg-gradient-gold text-primary-foreground shadow-gold" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
            >
              <t.icon className="h-4.5 w-4.5" /> {t.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full space-y-1 border-t border-border p-3">
          <Link to="/" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-600 text-muted-foreground hover:bg-secondary">
            <LayoutDashboard className="h-4.5 w-4.5" /> View App
          </Link>
          <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-600 text-destructive hover:bg-secondary">
            <LogOut className="h-4.5 w-4.5" /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/50 lg:hidden" />}

      {/* Main */}
      <div className="flex-1">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur lg:px-8">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden"><Menu className="h-5 w-5 text-foreground" /></button>
          <h1 className="font-display text-lg font-700 text-foreground">Admin Panel</h1>
          <span className="ml-auto rounded-full bg-secondary px-3 py-1 text-xs font-600 text-gold">Kushal Enterprises</span>
        </header>
        <main className="p-4 lg:p-8">
          {tab === "overview" && <Overview />}
          {tab === "properties" && <PropertiesAdmin />}
          {tab === "enquiries" && <EnquiriesAdmin />}
          {tab === "reviews" && <ReviewsAdmin />}
          {tab === "team" && <TeamAdmin />}
          {tab === "banners" && <BannersAdmin />}
        </main>
      </div>
    </div>
  );
}