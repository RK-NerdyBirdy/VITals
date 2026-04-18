import { CalendarClock, FlaskConical, ShieldCheck } from "lucide-react";

const SERVICES = [
  {
    icon: CalendarClock,
    title: "OPD Booking",
    description: "Cinema-style slot picker for quick appointments and specialist schedules.",
  },
  {
    icon: FlaskConical,
    title: "Lab Tests",
    description: "Transparent pricing, profile bundles, and QR tickets for sample collection.",
  },
  {
    icon: ShieldCheck,
    title: "Medical Vault",
    description: "Encrypted record storage with controlled time-limited sharing links.",
  },
];

export function Features() {
  return (
    <section className="mt-24">
      <p className="text-xs uppercase tracking-[0.25em] text-vitals-charcoal/60">Services</p>
      <h2 className="font-display text-3xl text-vitals-charcoal md:text-4xl">Everything In One Campus Health Stack</h2>

      <div className="mt-8 grid gap-4 md:grid-cols-6">
        {SERVICES.map((service, index) => {
          const Icon = service.icon;
          return (
            <article
              key={service.title}
              className={`frosted rounded-2xl p-6 ${index === 0 ? "md:col-span-3 md:row-span-2" : "md:col-span-3"}`}
            >
              <div className="mb-6 inline-flex rounded-xl border border-vitals-crimson/20 bg-vitals-crimson/10 p-3 text-vitals-crimson">
                <Icon />
              </div>
              <h3 className="font-display text-2xl text-vitals-charcoal">{service.title}</h3>
              <p className="mt-3 max-w-md text-sm text-vitals-charcoal/80">{service.description}</p>
              <div className="mt-8 h-24 rounded-xl border border-dashed border-vitals-charcoal/20 bg-white/40" />
            </article>
          );
        })}
      </div>
    </section>
  );
}
