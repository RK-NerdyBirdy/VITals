import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { apiFetchServer } from "@/lib/api";

type Doctor = { id: string; is_active: boolean };
type LabOrder = { id: string; status: "PENDING" | "SAMPLE_COLLECTED" | "PROCESSING" | "COMPLETED" | "CANCELLED" };
type RecordItem = { id: string };
type Booking = { id: string; status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW" };

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    return await apiFetchServer<T>(path);
  } catch {
    return fallback;
  }
}

export default async function AdminOverviewPage() {
  const [doctors, orders, records, bookings] = await Promise.all([
    safeFetch<Doctor[]>("/api/doctors?limit=500", []),
    safeFetch<LabOrder[]>("/api/admin/orders?limit=200", []),
    safeFetch<RecordItem[]>("/api/records", []),
    safeFetch<Booking[]>("/api/admin/bookings?limit=200", []),
  ]);

  const activeDoctors = doctors.filter((doctor) => doctor.is_active).length;
  const pendingOrders = orders.filter((order) =>
    ["PENDING", "SAMPLE_COLLECTED", "PROCESSING"].includes(order.status)
  ).length;
  const activeBookings = bookings.filter((booking) => booking.status === "CONFIRMED" || booking.status === "PENDING").length;

  return (
    <main className="space-y-4">
      <section className="grid gap-4 md:grid-cols-4">
        <article className="frosted rounded-2xl p-5">
          <p className="text-sm text-vitals-charcoal/70">Active Doctors</p>
          <p className="font-display text-4xl">{activeDoctors}</p>
        </article>
        <article className="frosted rounded-2xl p-5">
          <p className="text-sm text-vitals-charcoal/70">Pending Lab Orders</p>
          <p className="font-display text-4xl">{pendingOrders}</p>
        </article>
        <article className="frosted rounded-2xl p-5">
          <p className="text-sm text-vitals-charcoal/70">Active OPD Bookings</p>
          <p className="font-display text-4xl">{activeBookings}</p>
        </article>
        <article className="frosted rounded-2xl p-5">
          <p className="text-sm text-vitals-charcoal/70">Records Uploaded</p>
          <p className="font-display text-4xl">{records.length}</p>
        </article>
      </section>

      <section className="frosted rounded-2xl p-6">
        <h2 className="font-display text-2xl">Operational Shortcuts</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Link href="/admin/doctors" className="rounded-xl border border-vitals-charcoal/12 bg-white/70 px-4 py-3">
            <p className="font-medium">Manage Doctors</p>
            <p className="mt-1 text-sm text-vitals-charcoal/65">Create/update doctor records and specialties.</p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-vitals-crimson">
              Open <ArrowRight className="h-3.5 w-3.5" />
            </p>
          </Link>
          <Link href="/admin/slots" className="rounded-xl border border-vitals-charcoal/12 bg-white/70 px-4 py-3">
            <p className="font-medium">Generate GP Slots</p>
            <p className="mt-1 text-sm text-vitals-charcoal/65">Batch-create upcoming general physician slots.</p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-vitals-crimson">
              Open <ArrowRight className="h-3.5 w-3.5" />
            </p>
          </Link>
          <Link href="/admin/tests" className="rounded-xl border border-vitals-charcoal/12 bg-white/70 px-4 py-3">
            <p className="font-medium">Lab Catalog</p>
            <p className="mt-1 text-sm text-vitals-charcoal/65">Maintain test profiles and pricing information.</p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-vitals-crimson">
              Open <ArrowRight className="h-3.5 w-3.5" />
            </p>
          </Link>
          <Link href="/admin/orders" className="rounded-xl border border-vitals-charcoal/12 bg-white/70 px-4 py-3">
            <p className="font-medium">Lab Orders</p>
            <p className="mt-1 text-sm text-vitals-charcoal/65">Advance orders through collection and completion stages.</p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-vitals-crimson">
              Open <ArrowRight className="h-3.5 w-3.5" />
            </p>
          </Link>
          <Link href="/admin/bookings" className="rounded-xl border border-vitals-charcoal/12 bg-white/70 px-4 py-3">
            <p className="font-medium">OPD Bookings</p>
            <p className="mt-1 text-sm text-vitals-charcoal/65">Review and update booking statuses for OPD appointments.</p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-vitals-crimson">
              Open <ArrowRight className="h-3.5 w-3.5" />
            </p>
          </Link>
          <Link href="/admin/records" className="rounded-xl border border-vitals-charcoal/12 bg-white/70 px-4 py-3">
            <p className="font-medium">Upload Records</p>
            <p className="mt-1 text-sm text-vitals-charcoal/65">Push encrypted patient documents to the vault.</p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-vitals-crimson">
              Open <ArrowRight className="h-3.5 w-3.5" />
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
