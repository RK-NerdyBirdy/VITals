"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetchClient } from "@/lib/api";

type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";

type Booking = {
  id: string;
  patient_id: string;
  doctor_id: string;
  booking_date: string;
  booking_time: string;
  status: BookingStatus;
  ticket_number: string | null;
  symptoms: string | null;
  notes: string | null;
};

type User = {
  id: string;
  name: string;
  email: string;
};

type Doctor = {
  id: string;
  name: string;
  specialty: string;
};

const statusOptions: BookingStatus[] = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState<Record<string, BookingStatus>>({});

  async function loadData() {
    setLoading(true);
    try {
      const [bookingData, userData, doctorData] = await Promise.all([
        apiFetchClient<Booking[]>("/api/admin/bookings?limit=500"),
        apiFetchClient<User[]>("/api/admin/users?limit=500"),
        apiFetchClient<Doctor[]>("/api/doctors?limit=500"),
      ]);
      setBookings(bookingData);
      setUsers(userData);
      setDoctors(doctorData);
      setStatusDraft(
        Object.fromEntries(bookingData.map((booking) => [booking.id, booking.status])) as Record<string, BookingStatus>
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load bookings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const userMap = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const doctorMap = useMemo(() => new Map(doctors.map((doctor) => [doctor.id, doctor])), [doctors]);

  async function handleUpdateStatus(bookingId: string) {
    const nextStatus = statusDraft[bookingId];
    if (!nextStatus) return;

    setUpdatingBookingId(bookingId);
    try {
      await apiFetchClient<Booking>(`/api/admin/bookings/${bookingId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus }),
      });
      toast.success("Booking status updated");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update booking status");
    } finally {
      setUpdatingBookingId(null);
    }
  }

  return (
    <main className="frosted rounded-2xl p-6">
      <h1 className="font-display text-3xl">OPD Booking Management</h1>
      <p className="mt-2 text-sm text-vitals-charcoal/70">Manage booking statuses across OPD consultations.</p>

      <section className="mt-5 space-y-3">
        {loading ? <p className="text-sm text-vitals-charcoal/70">Loading bookings...</p> : null}
        {!loading && bookings.length === 0 ? <p className="text-sm text-vitals-charcoal/70">No bookings found.</p> : null}

        {bookings.map((booking) => {
          const patient = userMap.get(booking.patient_id);
          const doctor = doctorMap.get(booking.doctor_id);
          const slotDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);

          return (
            <article key={booking.id} className="rounded-xl border border-vitals-charcoal/12 bg-white/70 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-vitals-charcoal">{booking.ticket_number ?? booking.id}</p>
                  <p className="text-xs text-vitals-charcoal/70">
                    {patient?.name ?? "Unknown patient"} • {doctor?.name ?? "Unknown doctor"}
                  </p>
                  <p className="text-xs text-vitals-charcoal/60">
                    {slotDateTime.toLocaleString("en-IN")} • {doctor?.specialty ?? "Specialty unavailable"}
                  </p>
                  {booking.symptoms ? (
                    <p className="mt-1 text-xs text-vitals-charcoal/70">Symptoms: {booking.symptoms}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      booking.status === "COMPLETED"
                        ? "success"
                        : booking.status === "CANCELLED" || booking.status === "NO_SHOW"
                          ? "warning"
                          : "info"
                    }
                  >
                    {booking.status.replaceAll("_", " ")}
                  </Badge>
                  <select
                    className="h-9 rounded-lg border border-vitals-charcoal/20 bg-white px-2 text-xs"
                    value={statusDraft[booking.id] ?? booking.status}
                    onChange={(event) =>
                      setStatusDraft((prev) => ({ ...prev, [booking.id]: event.target.value as BookingStatus }))
                    }
                    disabled={updatingBookingId === booking.id}
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updatingBookingId === booking.id || (statusDraft[booking.id] ?? booking.status) === booking.status}
                    onClick={() => handleUpdateStatus(booking.id)}
                  >
                    {updatingBookingId === booking.id ? "Updating..." : "Update"}
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
