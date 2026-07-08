import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Phone, MessageCircle, Mail, MapPin, Send, Loader2, CheckCircle2, Lock } from "lucide-react";
import { z } from "zod";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { BRAND, telLink, whatsappLink, defaultEnquiryMessage } from "@/lib/brand";
import { BUDGET_OPTIONS, LOCATION_OPTIONS } from "@/lib/options";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import officeFront from "@/assets/office-front.jpg";

type Search = { propertyId?: string; title?: string };

export const Route = createFileRoute("/contact")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    propertyId: typeof s.propertyId === "string" ? s.propertyId : undefined,
    title: typeof s.title === "string" ? s.title : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Contact & Enquiry — Kushal Enterprises" },
      { name: "description", content: "Get in touch with Kushal Enterprises. Submit an enquiry, call or WhatsApp our team for verified properties in Thane." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone: z.string().trim().regex(/^[0-9+\-\s]{8,15}$/, "Enter a valid phone number"),
  email: z.string().trim().email("Invalid email").max(120).optional().or(z.literal("")),
  budget: z.string().trim().max(60).optional().or(z.literal("")),
  preferred_location: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(800).optional().or(z.literal("")),
});

function ContactPage() {
  const { propertyId, title } = Route.useSearch();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    budget: "",
    preferred_location: "",
    message: title ? `I am interested in "${title}".` : "",
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("enquiries").insert({
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      budget: parsed.data.budget || null,
      preferred_location: parsed.data.preferred_location || null,
      message: parsed.data.message || null,
      property_id: propertyId ?? null,
      property_title: title ?? null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not submit. Please try again.");
      return;
    }
    setDone(true);
    toast.success("Enquiry submitted! Our team will contact you soon.");
  };

  return (
    <AppShell>
      <PageHeader title="Contact Us" subtitle="We'd love to help you" />
      <main className="px-4 pt-4">
        {/* Quick contact */}
        <div className="grid grid-cols-3 gap-2.5">
          <a href={telLink(BRAND.phone)} className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card p-3 text-center">
            <Phone className="h-5 w-5 text-gold" />
            <span className="text-[10px] font-600 text-foreground">Call</span>
          </a>
          <a href={whatsappLink(BRAND.phone, defaultEnquiryMessage())} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card p-3 text-center">
            <MessageCircle className="h-5 w-5 text-emerald" />
            <span className="text-[10px] font-600 text-foreground">WhatsApp</span>
          </a>
          <a href={`mailto:${BRAND.email}`} className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card p-3 text-center">
            <Mail className="h-5 w-5 text-gold" />
            <span className="text-[10px] font-600 text-foreground">Email</span>
          </a>
        </div>

        {/* Office */}
        <div className="mt-4 overflow-hidden rounded-3xl border border-border shadow-card">
          <img src={officeFront} alt="Kushal Enterprises office" className="h-36 w-full object-cover" loading="lazy" />
          <div className="flex items-start gap-2 p-4">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <p className="text-xs leading-relaxed text-muted-foreground">{BRAND.address}</p>
          </div>
        </div>

        {/* Form */}
        {done ? (
          <div className="mt-5 flex flex-col items-center rounded-3xl border border-border bg-card p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald" />
            <h2 className="mt-3 font-display text-lg font-700 text-foreground">Thank you!</h2>
            <p className="mt-1 text-sm text-muted-foreground">Your enquiry has been received. Our team will reach out shortly.</p>
            <a href={whatsappLink(BRAND.phone, defaultEnquiryMessage(title))} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-1.5 rounded-full bg-[oklch(0.74_0.15_162)] px-4 py-2 text-xs font-700 text-primary-foreground">
              <MessageCircle className="h-3.5 w-3.5" /> Chat on WhatsApp
            </a>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5">
            <h2 className="font-display text-lg font-700 text-foreground">Send an Enquiry</h2>
            {title && (
              <p className="mt-1 rounded-xl bg-secondary px-3 py-2 text-xs text-gold">Interested in: {title}</p>
            )}
            <div className="mt-3 space-y-3">
              <Field label="Full Name *"><input value={form.name} onChange={update("name")} className={inputCls} placeholder="Your name" /></Field>
              <Field label="Phone Number *"><input value={form.phone} onChange={update("phone")} inputMode="tel" className={inputCls} placeholder="10-digit mobile number" /></Field>
              <Field label="Email"><input value={form.email} onChange={update("email")} inputMode="email" className={inputCls} placeholder="you@example.com" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Budget">
                  <select value={form.budget} onChange={update("budget")} className={cn(inputCls, !form.budget && "text-muted-foreground")}>
                    <option value="">Select budget</option>
                    {BUDGET_OPTIONS.map((b) => <option key={b} value={b} className="text-foreground">{b}</option>)}
                  </select>
                </Field>
                <Field label="Preferred Location">
                  <select value={form.preferred_location} onChange={update("preferred_location")} className={cn(inputCls, !form.preferred_location && "text-muted-foreground")}>
                    <option value="">Select location</option>
                    {LOCATION_OPTIONS.map((l) => <option key={l} value={l} className="text-foreground">{l}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Message"><textarea value={form.message} onChange={update("message")} rows={3} className={inputCls} placeholder="Tell us what you're looking for..." /></Field>
            </div>
            <button type="submit" disabled={submitting} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-gold py-3.5 text-sm font-800 text-primary-foreground shadow-gold disabled:opacity-70">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitting ? "Submitting..." : "Submit Enquiry"}
            </button>
          </form>
        )}

        {/* Discreet staff entry point — needed because an installed APK has no
            address bar to reach the admin dashboard by URL. */}
        <div className="mt-8 flex justify-center pb-2">
          <Link to="/auth" className="flex items-center gap-1.5 text-[11px] font-600 text-muted-foreground">
            <Lock className="h-3 w-3" /> Staff / Admin Login
          </Link>
        </div>
      </main>
    </AppShell>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-600 text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
