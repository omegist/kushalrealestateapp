import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  Home as HomeIcon,
  Building2,
  LandPlot,
  Crown,
  ShieldCheck,
  FileCheck2,
  Landmark,
  Phone,
  KeyRound,
  Gem,
  TrendingUp,
  BedDouble,
  UserCircle2,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Splash } from "@/components/app/Splash";
import { Logo } from "@/components/app/Logo";
import { HeroSlider } from "@/components/app/HeroSlider";
import { PropertyCard } from "@/components/app/PropertyCard";
import { SmartSearch } from "@/components/app/SmartSearch";
import { NotificationsBell } from "@/components/app/NotificationsBell";
import { AutoSlider } from "@/components/app/AutoSlider";
import { useBanners, useCategories, useFeaturedProperties, useProperties } from "@/lib/data";
import { useFavorites } from "@/lib/useFavorites";
import { getAdminStatus } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { BRAND, telLink } from "@/lib/brand";
import founder from "@/assets/founder-anil.png";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kushal Enterprises — Premium Real Estate in Thane" },
      {
        name: "description",
        content:
          "Browse verified flats, villas, commercial spaces & plots in Thane. Kushal Enterprises offers expert guidance, legal support & home loan assistance.",
      },
    ],
  }),
  component: Home,
});

const categoryIcons: Record<string, typeof HomeIcon> = {
  residential: HomeIcon,
  commercial: Building2,
  plots: LandPlot,
  luxury: Crown,
};

function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { data: banners = [] } = useBanners();
  const { data: categories = [] } = useCategories();
  const { data: featured = [] } = useFeaturedProperties();
  const { data: all = [] } = useProperties();
  const { user } = useFavorites();

  // Only checked once someone is actually logged in — no point querying
  // user_roles for anonymous visitors.
  const { data: adminStatus } = useQuery({
    queryKey: ["admin-status", user?.id],
    queryFn: getAdminStatus,
    enabled: !!user,
  });
  const isAdmin = !!adminStatus?.isAdmin;

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const runSearch = (v: string) => {
    navigate({ to: "/properties", search: { q: v || undefined } as never });
  };

  return (
    <AppShell>
      <Splash />

      {/* Header */}
      <header className="sticky top-0 z-30 glass px-4 pb-3 pt-[max(0.85rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-2">
          <Logo />
          <div className="flex items-center gap-2">
            {!user ? (
              // Customers need an account to save favorites/enquire — a plain,
              // clearly-labeled Login here (not staff-only) is the normal way
              // in. The same first-5-signups-become-admin rule still applies
              // behind the scenes, this button is just the front door.
              <Link
                to="/auth"
                className="flex h-10 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-xs font-700 text-foreground"
              >
                <UserCircle2 className="h-4 w-4 text-gold" /> Login
              </Link>
            ) : (
              <>
                {isAdmin && (
                  <Link
                    to="/authenticated/admin"
                    className="flex h-10 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-xs font-700 text-foreground"
                  >
                    <LayoutDashboard className="h-4 w-4 text-gold" /> Back to Dashboard
                  </Link>
                )}
                <button
                  type="button"
                  onClick={signOut}
                  className="flex h-10 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-xs font-700 text-destructive"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </>
            )}
            <NotificationsBell />
          </div>
        </div>
        <div className="mt-3">
          <SmartSearch value={q} onChange={setQ} onSubmit={runSearch} properties={all} />
        </div>
      </header>


      <main>
        {/* Hero */}
        <section className="pt-4">
          <HeroSlider banners={banners} />
        </section>

        {/* Categories */}
        <section className="px-4 pt-6">
          <SectionHeader title="Browse by Category" />
          <div className="mt-3 grid grid-cols-4 gap-2.5">
            {categories.map((c) => {
              const Icon = categoryIcons[c.slug] ?? HomeIcon;
              return (
                <Link
                  key={c.id}
                  to="/properties"
                  search={{ category: c.slug, q: undefined } as never}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center shadow-card transition-transform active:scale-95"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-gold text-primary-foreground shadow-gold">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-[11px] font-600 leading-tight text-foreground">{c.name}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Quick Search shortcuts */}
        <section className="px-4 pt-7">
          <SectionHeader title="Quick Search" />
          <div className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto pb-1">
            {[
              { label: "1 BHK in Thane", icon: BedDouble, search: { config: "1 BHK", location: "Thane" } },
              { label: "2 BHK in Dhokali", icon: BedDouble, search: { config: "2 BHK", location: "Dhokali" } },
              { label: "Luxury Apartments", icon: Gem, search: { category: "luxury" } },
              { label: "Ready To Move", icon: KeyRound, search: { possession: "Ready To Move" } },
              { label: "Investment Plots", icon: TrendingUp, search: { category: "plots" } },
            ].map((c) => (
              <Link
                key={c.label}
                to="/properties"
                search={c.search as never}
                className="flex shrink-0 items-center gap-2 rounded-2xl border border-border bg-card px-3.5 py-3 shadow-card transition-transform active:scale-95"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                  <c.icon className="h-4.5 w-4.5" />
                </span>
                <span className="whitespace-nowrap text-xs font-700 text-foreground">{c.label}</span>
              </Link>
            ))}
          </div>
        </section>


        {/* Featured — auto-slides right to left. Falls back to the latest
            listings so this section is never empty just because no admin
            has checked "Featured on homepage" yet. */}
        {(featured.length > 0 || all.length > 0) && (
          <section className="pt-7">
            <div className="px-4">
              <SectionHeader
                title="Featured Properties"
                action={<Link to="/properties" className="flex items-center text-xs font-600 text-gold">View all <ChevronRight className="h-3.5 w-3.5" /></Link>}
              />
            </div>
            <div className="mt-3 pl-4">
              <AutoSlider itemWidth={260}>
                {(featured.length > 0 ? featured : all.slice(0, 8)).map((p) => (
                  <div key={p.id} className="w-[260px] shrink-0">
                    <PropertyCard property={p} />
                  </div>
                ))}
              </AutoSlider>
            </div>
          </section>
        )}

        {/* Founder / Trust banner */}
        <section className="px-4 pt-6">
          <Link to="/team" className="block overflow-hidden rounded-3xl border border-border shadow-card transition-transform active:scale-[0.99]" style={{ background: "var(--gradient-surface)" }}>
            <div className="flex gap-3 p-4">
              <img src={founder} alt="Anil Chandrakant Patil" className="h-24 w-20 shrink-0 rounded-2xl object-cover" loading="lazy" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.18em] text-gold">Founder & Consultant</p>
                <h3 className="font-display text-lg font-700 leading-tight text-foreground">Anil Chandrakant Patil</h3>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                  Helping hundreds of families find their ideal home in Kalwa & Thane on a foundation of trust, transparency and verified properties.
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-700 text-gold">Meet our team <ChevronRight className="h-3.5 w-3.5" /></span>
              </div>
            </div>
          </Link>
        </section>

        {/* Why choose us */}
        <section className="px-4 pt-7">
          <SectionHeader title="Why Kushal Enterprises" />
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            {[
              { icon: ShieldCheck, label: "Verified Properties" },
              { icon: FileCheck2, label: "Legal Support" },
              { icon: Landmark, label: "Loan Assistance" },
            ].map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center">
                <f.icon className="h-6 w-6 text-emerald" />
                <span className="text-[10.5px] font-600 leading-tight text-foreground">{f.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Latest listings */}
        <section className="px-4 pt-7">
          <SectionHeader
            title="Latest Listings"
            action={<Link to="/properties" className="flex items-center text-xs font-600 text-gold">View all <ChevronRight className="h-3.5 w-3.5" /></Link>}
          />
          <div className="mt-3 grid grid-cols-2 gap-3">
            {all.slice(0, 6).map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 pt-7">
          <div className="rounded-3xl bg-gradient-gold p-5 text-center shadow-gold">
            <h3 className="font-display text-lg font-800 text-primary-foreground">Looking for the right property?</h3>
            <p className="mt-1 text-xs text-primary-foreground/80">Talk to our experts for personalised guidance.</p>
            <div className="mt-4 flex justify-center gap-2.5">
              <a href={telLink(BRAND.phone)} className="flex items-center gap-1.5 rounded-full bg-[oklch(0.18_0.03_258)] px-4 py-2 text-xs font-700 text-gold">
                <Phone className="h-3.5 w-3.5" /> Call Now
              </a>
              <Link to="/contact" className="rounded-full border border-[oklch(0.18_0.03_258/0.3)] bg-[oklch(1_0_0/0.15)] px-4 py-2 text-xs font-700 text-primary-foreground">
                Send Enquiry
              </Link>
            </div>
          </div>
        </section>

        <p className="px-4 pt-6 text-center text-[10px] text-muted-foreground">{BRAND.address}</p>
      </main>
    </AppShell>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-display text-lg font-700 text-foreground">{title}</h2>
      {action}
    </div>
  );
}