import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { PropertyCard } from "@/components/app/PropertyCard";
import { useFavoriteProperties } from "@/lib/data";
import { useFavorites } from "@/lib/useFavorites";

export const Route = createFileRoute("/wishlist")({
  component: Wishlist,
});

function Wishlist() {
  const { user, loading: authLoading } = useFavorites();
  const { data: properties = [], isLoading } = useFavoriteProperties();

  if (authLoading) {
    return (
      <AppShell>
        <PageHeader title="Wishlist" />
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-3xl bg-card animate-pulse" />
          ))}
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <PageHeader title="Wishlist" />
        <div className="flex flex-col items-center justify-center px-8 pt-24 text-center gap-5">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-card border border-border shadow-card">
            <Heart className="h-9 w-9 text-muted-foreground" />
          </span>
          <div>
            <h2 className="font-display text-xl font-700 text-foreground">Login to view saved properties</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Save your favourite properties and access them anytime.</p>
          </div>
          <Link
            to="/auth"
            className="bg-gradient-gold px-8 py-3 rounded-full text-sm font-700 text-primary-foreground shadow-gold"
          >
            Login
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title="Wishlist" subtitle={properties.length ? `${properties.length} saved` : undefined} />
      <main className="px-4 pb-28 pt-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-32 rounded-3xl bg-card animate-pulse" />)}
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-center gap-5">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-card border border-border shadow-card">
              <Heart className="h-9 w-9 text-muted-foreground" />
            </span>
            <div>
              <h2 className="font-display text-xl font-700 text-foreground">No saved properties yet</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Tap the heart on any property to save it here.</p>
            </div>
            <Link
              to="/properties"
              className="bg-gradient-gold px-8 py-3 rounded-full text-sm font-700 text-primary-foreground shadow-gold"
            >
              Browse properties
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} view="list" />
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}
