import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CalendarClock,
  FlaskConical,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetchServer } from "@/lib/api";

type Doctor = {
  id: string;
  is_active: boolean;
};

type Booking = {
  id: string;
  booking_date: string;
  booking_time: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
  ticket_number: string | null;
};

type LabOrder = {
  id: string;
  status: "PENDING" | "SAMPLE_COLLECTED" | "PROCESSING" | "COMPLETED" | "CANCELLED";
  ticket_number: string | null;
};

type RecordItem = {
  id: string;
  type: "PRESCRIPTION" | "REPORT" | "DISCHARGE_SUMMARY" | "VACCINATION";
};

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    return await apiFetchServer<T>(path);
  } catch {
    return fallback;
  }
}

function formatDateLabel(dateRaw: string, timeRaw: string): string {
  const parsed = new Date(`${dateRaw}T${timeRaw}`);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export default async function DashboardPage() {
  const [doctors, bookings, labOrders, records] = await Promise.all([
    safeFetch<Doctor[]>("/api/doctors?limit=100", []),
    safeFetch<Booking[]>("/api/opd/bookings?limit=50", []),
    safeFetch<LabOrder[]>("/api/lab/orders?limit=50", []),
    safeFetch<RecordItem[]>("/api/records", []),
  ]);

  const now = new Date();
  const activeDoctors = doctors.filter((doctor) => doctor.is_active).length;
  const upcomingBookings = bookings
    .filter((booking) => {
      const bookingAt = new Date(`${booking.booking_date}T${booking.booking_time}`);
      return booking.status !== "CANCELLED" && bookingAt >= now;
    })
    .sort((a, b) => {
      const first = new Date(`${a.booking_date}T${a.booking_time}`).getTime();
      const second = new Date(`${b.booking_date}T${b.booking_time}`).getTime();
      return first - second;
    });

  const pendingLabOrders = labOrders.filter((order) =>
    ["PENDING", "SAMPLE_COLLECTED", "PROCESSING"].includes(order.status)
  );

  const healthPulse = Math.min(
    100,
    30 + upcomingBookings.length * 12 + pendingLabOrders.length * 9 + records.length * 2
  );

  const metricCards = [
    {
      title: "Upcoming OPD",
      value: String(upcomingBookings.length),
      note: "next 30 days",
      icon: CalendarClock,
      accent: "text-cyan-700",
    },
    {
      title: "Lab Orders in Queue",
      value: String(pendingLabOrders.length),
      note: "awaiting completion",
      icon: FlaskConical,
      accent: "text-amber-700",
    },
    {
      title: "Secure Records",
      value: String(records.length),
      note: "encrypted vault items",
      icon: ShieldCheck,
      accent: "text-emerald-700",
    },
    {
      title: "Active Doctors",
      value: String(activeDoctors),
      note: "bookable now",
      icon: Stethoscope,
      accent: "text-vitals-crimson",
    },
  ];

  return (
    <main className="space-y-6">
      <section className="frosted relative overflow-hidden rounded-3xl border border-white/80 p-6 md:p-8">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-vitals-crimson/10 blur-3xl" />
        <div className="absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-vitals-teal/10 blur-3xl" />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <Badge className="mb-4" variant="default">
              Health Command Center
            </Badge>
            <h1 className="font-display text-4xl leading-tight text-vitals-charcoal md:text-5xl">
              Dashboard with live campus health signals.
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-vitals-charcoal/75 md:text-base">
              Track appointments, orders, and your encrypted records from one timeline-first view.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dashboard/opd">
                <Button>
                  Book OPD Slot <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard/lab">
                <Button variant="ghost">Explore Lab Tests</Button>
              </Link>
              <Link href="/dashboard/records">
                <Button variant="outline">Open Records Vault</Button>
              </Link>
            </div>
          </div>

          <article className="rounded-2xl border border-vitals-charcoal/10 bg-white/70 p-5 backdrop-blur-sm">
            <p className="text-sm font-medium text-vitals-charcoal/70">Health Pulse</p>
            <div className="mt-3 flex items-end justify-between">
              <p className="font-display text-5xl text-vitals-charcoal">{healthPulse}</p>
              <span className="text-xs uppercase tracking-[0.2em] text-vitals-charcoal/60">score</span>
            </div>
            <div className="mt-4 h-2 rounded-full bg-vitals-charcoal/10">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-vitals-crimson via-vitals-primary-soft to-vitals-teal"
                style={{ width: `${healthPulse}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-vitals-charcoal/65">
              Balanced from upcoming appointments, pending diagnostics, and records continuity.
            </p>
          </article>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <article key={metric.title} className="frosted rounded-2xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-vitals-charcoal/70">{metric.title}</p>
                <Icon className={`h-5 w-5 ${metric.accent}`} />
              </div>
              <p className="font-display text-4xl text-vitals-charcoal">{metric.value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-vitals-charcoal/55">{metric.note}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <article className="frosted rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl">Upcoming Appointments</h2>
            <Link href="/dashboard/opd/bookings" className="text-sm font-medium text-vitals-crimson">
              View all
            </Link>
          </div>

          {upcomingBookings.length === 0 ? (
            <p className="rounded-xl border border-dashed border-vitals-charcoal/20 bg-white/60 px-4 py-6 text-sm text-vitals-charcoal/70">
              No upcoming OPD bookings yet. Use the quick action above to reserve your first slot.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.slice(0, 4).map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-vitals-charcoal/10 bg-white/70 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-vitals-charcoal">{formatDateLabel(booking.booking_date, booking.booking_time)}</p>
                    <p className="text-xs text-vitals-charcoal/65">Ticket: {booking.ticket_number ?? "Pending generation"}</p>
                  </div>
                  <Badge variant={booking.status === "CONFIRMED" ? "success" : "info"}>{booking.status.replaceAll("_", " ")}</Badge>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="frosted rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-vitals-crimson" />
            <h2 className="font-display text-2xl">Today at a Glance</h2>
          </div>
          <ul className="space-y-3 text-sm text-vitals-charcoal/80">
            <li className="rounded-xl border border-vitals-charcoal/10 bg-white/65 px-3 py-2">
              <span className="font-medium">Bookings:</span> {upcomingBookings.length} upcoming
            </li>
            <li className="rounded-xl border border-vitals-charcoal/10 bg-white/65 px-3 py-2">
              <span className="font-medium">Lab queue:</span> {pendingLabOrders.length} active order(s)
            </li>
            <li className="rounded-xl border border-vitals-charcoal/10 bg-white/65 px-3 py-2">
              <span className="font-medium">Vault entries:</span> {records.length} encrypted record(s)
            </li>
            <li className="rounded-xl border border-vitals-charcoal/10 bg-white/65 px-3 py-2">
              <span className="font-medium">Campus roster:</span> {activeDoctors} available doctor(s)
            </li>
          </ul>

          <div className="mt-5 rounded-xl bg-vitals-charcoal px-4 py-3 text-xs text-white/90">
            <p className="inline-flex items-center gap-2 font-semibold text-white">
              <Activity className="h-4 w-4" />
              System Note
            </p>
            <p className="mt-2">Your dashboard auto-refreshes on navigation and keeps all API fetches uncached for latest status.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
