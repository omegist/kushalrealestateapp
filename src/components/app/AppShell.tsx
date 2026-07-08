import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[oklch(0.94_0.006_258)]">
      <div className="relative mx-auto min-h-screen w-full max-w-[480px] bg-background pb-28 shadow-luxury">

        {children}
        <BottomNav />
      </div>
    </div>
  );
}
