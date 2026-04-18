import { BellRing, IdCard, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";

import { FamilyManager } from "@/components/profile/FamilyManager";
import { Badge } from "@/components/ui/badge";
import { apiFetchServer } from "@/lib/api";

type Profile = {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "FACULTY" | "ADMIN";
  phone: string | null;
  reg_number: string | null;
  department: string | null;
};

type Booking = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
};

type LabOrder = {
  id: string;
  status: "PENDING" | "SAMPLE_COLLECTED" | "PROCESSING" | "COMPLETED" | "CANCELLED";
};

type RecordItem = {
  id: string;
};

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    return await apiFetchServer<T>(path);
  } catch {
    return fallback;
  }
}

export default async function ProfilePage() {
  const [profile, bookings, labOrders, records] = await Promise.all([
    safeFetch<Profile | null>("/api/auth/me", null),
    safeFetch<Booking[]>("/api/opd/bookings?limit=100", []),
    safeFetch<LabOrder[]>("/api/lab/orders?limit=100", []),
    safeFetch<RecordItem[]>("/api/records", []),
  ]);

  const activeBookings = bookings.filter((booking) => booking.status === "CONFIRMED" || booking.status === "PENDING").length;
  const activeOrders = labOrders.filter((order) =>
    ["PENDING", "SAMPLE_COLLECTED", "PROCESSING"].includes(order.status)
  ).length;

  return (
    <main className="space-y-6">
      <section className="frosted rounded-3xl p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-vitals-charcoal/55">Account</p>
            <h1 className="mt-2 font-display text-4xl text-vitals-charcoal md:text-5xl">Personal Profile</h1>
            <p className="mt-2 text-sm text-vitals-charcoal/70">
              Review role access, identity details, and your active healthcare workload.
            </p>
          </div>
          <Badge variant={profile?.role === "ADMIN" ? "warning" : profile?.role === "FACULTY" ? "info" : "success"}>
            {profile?.role ?? "STUDENT"}
          </Badge>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <article className="frosted rounded-2xl p-6">
          <h2 className="mb-4 font-display text-2xl">Identity Snapshot</h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 rounded-xl border border-vitals-charcoal/12 bg-white/70 px-4 py-3">
              <UserRound className="mt-0.5 h-4 w-4 text-vitals-crimson" />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-vitals-charcoal/55">Name</p>
                <p className="font-medium text-vitals-charcoal">{profile?.name ?? "Unknown User"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-vitals-charcoal/12 bg-white/70 px-4 py-3">
              <Mail className="mt-0.5 h-4 w-4 text-vitals-crimson" />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-vitals-charcoal/55">Email</p>
                <p className="font-medium text-vitals-charcoal">{profile?.email ?? "Not available"}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl border border-vitals-charcoal/12 bg-white/70 px-4 py-3">
                <Phone className="mt-0.5 h-4 w-4 text-vitals-crimson" />
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-vitals-charcoal/55">Phone</p>
                  <p className="font-medium text-vitals-charcoal">{profile?.phone ?? "Not added"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-vitals-charcoal/12 bg-white/70 px-4 py-3">
                <IdCard className="mt-0.5 h-4 w-4 text-vitals-crimson" />
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-vitals-charcoal/55">Registration</p>
                  <p className="font-medium text-vitals-charcoal">{profile?.reg_number ?? "Not linked"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-vitals-charcoal/12 bg-white/70 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-vitals-charcoal/55">Department</p>
              <p className="font-medium text-vitals-charcoal">{profile?.department ?? "Not provided"}</p>
            </div>
          </div>
        </article>

        <article className="space-y-4">
          <div className="frosted rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-vitals-teal" />
              <h3 className="font-display text-xl">Care Activity</h3>
            </div>
            <ul className="space-y-2 text-sm text-vitals-charcoal/80">
              <li className="rounded-lg border border-vitals-charcoal/10 bg-white/65 px-3 py-2">
                Active OPD bookings: <span className="font-semibold">{activeBookings}</span>
              </li>
              <li className="rounded-lg border border-vitals-charcoal/10 bg-white/65 px-3 py-2">
                Active lab orders: <span className="font-semibold">{activeOrders}</span>
              </li>
              <li className="rounded-lg border border-vitals-charcoal/10 bg-white/65 px-3 py-2">
                Records in vault: <span className="font-semibold">{records.length}</span>
              </li>
            </ul>
          </div>

          <div className="frosted rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <BellRing className="h-4 w-4 text-vitals-crimson" />
              <h3 className="font-display text-xl">Notification Defaults</h3>
            </div>
            <ul className="space-y-2 text-sm text-vitals-charcoal/80">
              <li className="rounded-lg border border-vitals-charcoal/10 bg-white/65 px-3 py-2">OPD reminders: enabled</li>
              <li className="rounded-lg border border-vitals-charcoal/10 bg-white/65 px-3 py-2">Lab status updates: enabled</li>
              <li className="rounded-lg border border-vitals-charcoal/10 bg-white/65 px-3 py-2">Record sharing alerts: enabled</li>
            </ul>
          </div>
        </article>
      </section>

      {profile?.role === "FACULTY" ? <FamilyManager userId={profile.id} /> : null}
    </main>
  );
}
