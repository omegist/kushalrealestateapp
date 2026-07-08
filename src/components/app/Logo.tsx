import logo from "@/assets/kushal-logo.png";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm",
        className,
      )}
    >
      <img
        src={logo}
        alt="Kushal Enterprises logo"
        className="h-full w-full object-contain p-1"
        loading="eager"
      />
    </span>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark className="h-10 w-10 shrink-0" />
      {!compact && (
        <div className="leading-tight">
          <p className="font-display text-[15px] font-700 text-foreground">Kushal Enterprises</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-gold">Real Estate Consultant</p>
        </div>
      )}
    </div>
  );
}
