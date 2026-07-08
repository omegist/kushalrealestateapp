import { useEffect, useState } from "react";
import { LogoMark } from "./Logo";

export function Splash() {
  const [done, setDone] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("kushal_splash_seen")) return;
    setDone(false);
    const t1 = setTimeout(() => {
      sessionStorage.setItem("kushal_splash_seen", "1");
      setDone(true);
    }, 2200);
    return () => clearTimeout(t1);
  }, []);

  if (done) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[oklch(0.13_0.024_258)]">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[oklch(0.81_0.13_84/0.18)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[oklch(0.74_0.15_162/0.12)] blur-3xl" />
      <div className="animate-splash-pop flex flex-col items-center">
        <LogoMark className="h-28 w-28 shadow-gold" />
        <h1 className="mt-6 font-display text-2xl font-700 text-foreground">Kushal Enterprises</h1>
        <p className="mt-1 text-[11px] uppercase tracking-[0.35em] text-gold">Real Estate Consultant</p>
      </div>
      <div className="absolute bottom-16 flex flex-col items-center gap-3">
        <div className="h-0.5 w-32 overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-full origin-left animate-[float-up_1.8s_ease-in-out] bg-gradient-gold" style={{ animation: "splash-pop 1.8s ease-out both" }} />
        </div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Trust • Transparency • Verified</p>
      </div>
    </div>
  );
}
