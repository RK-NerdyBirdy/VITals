"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { CalendarBooking } from "@/components/opd/CalendarBooking";
import { SlotGrid } from "@/components/opd/SlotGrid";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiFetchClient } from "@/lib/api";

type DoctorDetailPageProps = {
  params: { doctorId: string };
};

type Availability = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_patients: number;
};

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  type: "GENERAL" | "SPECIALIST";
  qualification: string | null;
  affiliation: string | null;
  fees: number;
  bio: string | null;
  availabilities: Availability[];
};

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type SlotPreview = {
  status: "AVAILABLE" | "LOCKED" | "BOOKED" | "CANCELLED";
};

function toLocalIsoDate(value: Date): string {
  const localDate = new Date(value);
  localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
  return localDate.toISOString().slice(0, 10);
}

function toTimeLabel(raw: string): string {
  const [hours, minutes] = raw.split(":");
  const hour = Number(hours);
  const suffix = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${minutes} ${suffix}`;
}

export default function DoctorDetailPage({ params }: DoctorDetailPageProps) {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    if (today.getDay() === 0) {
      today.setDate(today.getDate() + 1);
    }
    return toLocalIsoDate(today);
  });
  const minDate = useMemo(() => toLocalIsoDate(new Date()), []);

  useEffect(() => {
    setLoading(true);
    apiFetchClient<Doctor>(`/api/doctors/${params.doctorId}`)
      .then((result) => setDoctor(result))
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Unable to load doctor details");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params.doctorId]);

  useEffect(() => {
    if (!doctor || doctor.type !== "GENERAL") {
      return;
    }

    const doctorId = doctor.id;
    let cancelled = false;

    async function pickFirstAvailableDate() {
      const baseDate = new Date();

      for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
        const candidateDate = new Date(baseDate);
        candidateDate.setDate(baseDate.getDate() + dayOffset);
        const isoDate = toLocalIsoDate(candidateDate);

        try {
          const slots = await apiFetchClient<SlotPreview[]>(`/api/doctors/${doctorId}/slots?date=${isoDate}`);
          if (slots.some((slot) => slot.status === "AVAILABLE")) {
            if (!cancelled) {
              setSelectedDate(isoDate);
            }
            return;
          }
        } catch {
          // Ignore transient fetch errors while probing dates.
        }
      }
    }

    void pickFirstAvailableDate();

    return () => {
      cancelled = true;
    };
  }, [doctor?.id, doctor?.type]);

  async function handleSpecialistBooking(payload: { date: string; time: string; symptoms?: string }) {
    if (!doctor) return;
    try {
      const booking = await apiFetchClient<{ ticket_number: string | null }>("/api/opd/appointments", {
        method: "POST",
        body: JSON.stringify({
          doctor_id: doctor.id,
          booking_date: payload.date,
          booking_time: payload.time,
          symptoms: payload.symptoms,
        }),
      });
      toast.success(`Appointment booked${booking.ticket_number ? ` (${booking.ticket_number})` : ""}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to book specialist appointment");
    }
  }

  if (loading) {
    return (
      <main className="frosted rounded-2xl p-6 text-sm text-vitals-charcoal/70">
        Loading doctor profile...
      </main>
    );
  }

  if (!doctor) {
    return (
      <main className="frosted rounded-2xl p-6 text-sm text-vitals-charcoal/70">
        Doctor details are unavailable.
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <section className="frosted rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-4xl">{doctor.name}</h1>
            <p className="mt-1 text-sm text-vitals-charcoal/70">
              {doctor.specialty} • {doctor.qualification ?? "Qualification not listed"}
            </p>
            <p className="text-sm text-vitals-charcoal/70">{doctor.affiliation ?? "VIT Health Centre"}</p>
            <p className="mt-2 text-sm text-vitals-charcoal/80">{doctor.bio ?? "No bio available for this doctor."}</p>
          </div>
          <div className="text-right">
            <Badge variant={doctor.type === "GENERAL" ? "info" : "default"}>{doctor.type}</Badge>
            <p className="mt-2 text-sm text-vitals-charcoal/70">Consultation Fee</p>
            <p className="font-display text-3xl text-vitals-crimson">Rs {doctor.fees.toFixed(2)}</p>
          </div>
        </div>
      </section>

      {doctor.availabilities.length > 0 ? (
        <section className="frosted rounded-2xl p-6">
          <h2 className="mb-3 font-display text-2xl">Weekly Availability</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {doctor.availabilities.map((availability) => (
              <article key={availability.id} className="rounded-lg border border-vitals-charcoal/12 bg-white/70 px-3 py-2 text-sm">
                <p className="font-medium text-vitals-charcoal">{dayLabels[availability.day_of_week]}</p>
                <p className="text-vitals-charcoal/70">
                  {toTimeLabel(availability.start_time)} - {toTimeLabel(availability.end_time)}
                </p>
                <p className="text-xs text-vitals-charcoal/60">Max patients: {availability.max_patients}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {doctor.type === "GENERAL" ? (
        <section className="frosted rounded-2xl p-6">
          <h2 className="font-display text-2xl">General Physician Slots</h2>
          <p className="mb-4 mt-1 text-sm text-vitals-charcoal/70">Select and lock a slot for 5 minutes before confirming.</p>
          <div className="mb-4 max-w-xs">
            <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-vitals-charcoal/60">Choose date</label>
            <Input
              type="date"
              value={selectedDate}
              min={minDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>
          <SlotGrid doctorId={doctor.id} date={selectedDate} />
        </section>
      ) : (
        <CalendarBooking onSubmit={handleSpecialistBooking} />
      )}
    </main>
  );
}
