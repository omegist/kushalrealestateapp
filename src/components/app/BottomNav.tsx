import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Building2, Heart, Users, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/properties", label: "Explore", icon: Building2 },
  { to: "/wishlist", label: "Wishlist", icon: Heart },
  { to: "/team", label: "Team", icon: Users },
  { to: "/contact", label: "Enquire", icon: MessageSquare },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2">
      <div className="glass flex items-center justify-around rounded-2xl px-2 py-2 shadow-luxury">
        {items.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                  active && "bg-gradient-primary text-primary-foreground shadow-card",
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 2} />
              </span>

              <span className="text-[10px] font-600">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
