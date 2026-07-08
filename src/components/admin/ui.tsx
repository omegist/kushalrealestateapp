import type { ReactNode } from "react";
import { X } from "lucide-react";

export const adminInput =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none";

export const btnGold =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-gold px-4 py-2 text-sm font-700 text-primary-foreground shadow-gold disabled:opacity-60";

export const btnGhost =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-600 text-foreground";

export function AdminField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-600 text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className={`my-8 w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-2xl border border-border bg-card shadow-luxury`}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h3 className="font-display text-lg font-700 text-foreground">{title}</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-secondary">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
