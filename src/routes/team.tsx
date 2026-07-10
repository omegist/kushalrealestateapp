import { createFileRoute } from "@tanstack/react-router";
import { Phone, MessageCircle, Mail } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Img } from "@/components/app/Img";
import { useTeam } from "@/lib/data";
import { telLink, whatsappLink, BRAND } from "@/lib/brand";
import { initials } from "@/lib/utils";
import founder from "@/assets/founder-anil.png";
import type { TeamMember } from "@/lib/types";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Our Team — Kushal Enterprises" },
      {
        name: "description",
        content:
          "Meet the Kushal Enterprises team of expert real estate consultants serving Thane, Kalwa and surrounding areas.",
      },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const { data: team = [], isLoading } = useTeam();
  const founderMember = team.find((m) => m.is_founder);
  const rest = team.filter((m) => !m.is_founder);

  return (
    <AppShell>
      <PageHeader title="Our Team" subtitle="Expert real estate consultants" />
      <main className="px-4 pt-4">
        {isLoading && <div className="h-40 animate-pulse rounded-3xl bg-card" />}

        {founderMember && (
          <div
            className="overflow-hidden rounded-3xl border border-border shadow-luxury"
            style={{ background: "var(--gradient-surface)" }}
          >
            <div className="flex flex-col items-center p-5 text-center">
              <img
                src={founder}
                alt={founderMember.name}
                className="h-28 w-24 rounded-2xl object-cover shadow-gold"
              />
              <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-gold">
                Founder & Real Estate Consultant
              </p>
              <h2 className="font-display text-xl font-800 text-foreground">
                {founderMember.name}
              </h2>
              <p className="text-sm text-emerald">Kushal Enterprises</p>
              <p className="mt-2 text-xs font-600 italic text-muted-foreground">
                “Built on the foundation of trust, transparency, and client satisfaction.”
              </p>
              <div className="mt-4 max-w-xl space-y-3 text-left text-xs leading-5 text-muted-foreground">
                <h3 className="text-sm font-700 text-foreground">About Me</h3>
                <p>
                  Born and raised in Kalwa, I have a deep-rooted understanding of the locality, its
                  community, and its real-estate dynamics. After my B.Com graduation in 2004, I
                  spent 8 to 10 years gaining corporate experience with Reliance Industries and 3i
                  Infotech.
                </p>
                <p>
                  For the past 15 years, I have helped hundreds of families find their ideal homes
                  across Kalwa and Thane. Through Kushal Enterprises, I combine local market
                  expertise with corporate-level professionalism for a seamless and transparent
                  buying or selling experience.
                </p>
                <p>
                  <span className="font-700 text-foreground">Core expertise:</span> Kalwa, Thane,
                  and surrounding areas
                </p>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {founderMember.phone && (
                  <a
                    href={telLink(founderMember.phone)}
                    className="flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-2 text-xs font-700 text-gold"
                  >
                    <Phone className="h-3.5 w-3.5" /> {founderMember.phone}
                  </a>
                )}
                <a
                  href={telLink("9326313320")}
                  className="flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-2 text-xs font-700 text-gold"
                >
                  <Phone className="h-3.5 w-3.5" /> +91 9326313320
                </a>
                {founderMember.whatsapp && (
                  <a
                    href={whatsappLink(founderMember.whatsapp)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-full bg-[oklch(0.74_0.15_162)] px-3.5 py-2 text-xs font-700 text-primary-foreground"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                )}
                {founderMember.email && (
                  <a
                    href={`mailto:${founderMember.email}`}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-700 text-foreground"
                  >
                    <Mail className="h-3.5 w-3.5" /> Email
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        <h3 className="mt-6 font-display text-lg font-700 text-foreground">Meet the Team</h3>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {rest.map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">{BRAND.address}</p>
      </main>
    </AppShell>
  );
}

function MemberCard({ member }: { member: TeamMember }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-4 text-center shadow-card">
      <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-gold font-display text-lg font-800 text-primary-foreground">
        {member.photo_url ? (
          <Img
            src={member.photo_url}
            alt={member.name}
            width={64}
            className="h-full w-full object-cover"
          />
        ) : (
          initials(member.name)
        )}
      </span>
      <h4 className="mt-2.5 font-display text-sm font-700 leading-tight text-foreground">
        {member.name}
      </h4>
      <p className="text-[11px] text-emerald">{member.designation}</p>
      {member.experience && (
        <p className="mt-0.5 text-[10px] text-muted-foreground">{member.experience}</p>
      )}
      <div className="mt-3 flex w-full gap-1.5">
        {member.phone && (
          <a
            href={telLink(member.phone)}
            className="flex flex-1 items-center justify-center rounded-lg bg-secondary py-2 text-gold"
          >
            <Phone className="h-4 w-4" />
          </a>
        )}
        {member.whatsapp && (
          <a
            href={whatsappLink(member.whatsapp)}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center rounded-lg bg-[oklch(0.74_0.15_162)] py-2 text-primary-foreground"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
        )}
        {member.email && (
          <a
            href={`mailto:${member.email}`}
            className="flex flex-1 items-center justify-center rounded-lg border border-border py-2 text-foreground"
          >
            <Mail className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}
