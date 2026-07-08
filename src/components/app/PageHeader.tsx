import { Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 glass px-3 pb-3 pt-[max(0.85rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.history.length > 1 ? router.history.back() : router.navigate({ to: "/" })}
          aria-label="Go back"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-lg font-700 text-foreground">{title}</h1>
          {subtitle && <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}

export function HomeLink() {
  return (
    <Link to="/" className="text-xs font-600 text-gold">
      Home
    </Link>
  );
}
