import { CalendarClock, Ticket } from "lucide-react";

import { BookingTicket } from "@/components/opd/BookingTicket";
import { Badge } from "@/components/ui/badge";
import { apiFetchServer } from "@/lib/api";

type Booking = {
  id: string;
  doctor_id: string;
  booking_date: string;
  booking_time: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
  symptoms: string | null;
  ticket_number: string | null;
  qr_code_data: string | null;
};

type Doctor = {
  id: string;
  name: string;
  specialty: string;
};

type Profile = {
  name: string;
};

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    return await apiFetchServer<T>(path);
  } catch {
    return fallback;
  }
}

function toDateLabel(dateRaw: string, timeRaw: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(`${dateRaw}T${timeRaw}`));
}

export default async function MyBookingsPage() {
  const [bookings, doctors, profile] = await Promise.all([
    safeFetch<Booking[]>("/api/opd/bookings?limit=100", []),
    safeFetch<Doctor[]>("/api/doctors?limit=200", []),
    safeFetch<Profile | null>("/api/auth/me", null),
  ]);

  const doctorMap = new Map(doctors.map((doctor) => [doctor.id, doctor]));
  const sorted = [...bookings].sort((a, b) => {
    const first = new Date(`${a.booking_date}T${a.booking_time}`).getTime();
    const second = new Date(`${b.booking_date}T${b.booking_time}`).getTime();
    return second - first;
  });

  const featured = sorted.find((booking) => booking.ticket_number && booking.status !== "CANCELLED") ?? null;

  return (
    <main className="space-y-6">
      <section className="frosted rounded-3xl p-6 md:p-8">
        <h1 className="font-display text-4xl md:text-5xl">My OPD Bookings</h1>
        <p className="mt-2 text-sm text-vitals-charcoal/70">All appointment tickets and statuses in one place.</p>
      </section>

      {featured ? (
        <BookingTicket
          patientName={profile?.name ?? "VITals User"}
          doctorName={doctorMap.get(featured.doctor_id)?.name ?? "Assigned Doctor"}
          specialty={doctorMap.get(featured.doctor_id)?.specialty ?? "General Consultation"}
          dateTimeLabel={toDateLabel(featured.booking_date, featured.booking_time)}
          ticketNumber={featured.ticket_number ?? "VIT-OPD-PENDING"}
          qrValue={
            featured.qr_code_data ??
            JSON.stringify({ type: "opd_booking", id: featured.id, ticket: featured.ticket_number ?? "pending" })
          }
        />
      ) : null}

      <section className="frosted rounded-2xl p-6">
        <h2 className="mb-4 font-display text-2xl">Booking History</h2>

        {sorted.length === 0 ? (
          <p className="rounded-xl border border-dashed border-vitals-charcoal/20 bg-white/65 px-4 py-5 text-sm text-vitals-charcoal/70">
            No OPD bookings yet. Visit the OPD page to reserve your first slot.
          </p>
        ) : (
          <div className="space-y-3">
            {sorted.map((booking) => {
              const doctor = doctorMap.get(booking.doctor_id);
              return (
                <article key={booking.id} className="rounded-xl border border-vitals-charcoal/12 bg-white/70 px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-vitals-charcoal">{doctor?.name ?? "Doctor unavailable"}</p>
                      <p className="text-xs text-vitals-charcoal/65">{doctor?.specialty ?? "Specialty unavailable"}</p>
                    </div>
                    <Badge
                      variant={
                        booking.status === "COMPLETED"
                          ? "success"
                          : booking.status === "CANCELLED"
                            ? "warning"
                            : "info"
                      }
                    >
                      {booking.status.replaceAll("_", " ")}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-vitals-charcoal/70">
                    <p className="inline-flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {toDateLabel(booking.booking_date, booking.booking_time)}
                    </p>
                    <p className="inline-flex items-center gap-1">
                      <Ticket className="h-3.5 w-3.5" />
                      {booking.ticket_number ?? "Ticket pending"}
                    </p>
                  </div>

                  {booking.symptoms ? (
                    <p className="mt-2 rounded-lg bg-vitals-charcoal/5 px-3 py-2 text-xs text-vitals-charcoal/75">
                      Symptoms noted: {booking.symptoms}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
