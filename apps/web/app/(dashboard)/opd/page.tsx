import Link from "next/link";
import { CalendarCheck2, Stethoscope } from "lucide-react";

import { DoctorCard } from "@/components/opd/DoctorCard";
import { Badge } from "@/components/ui/badge";
import { apiFetchServer } from "@/lib/api";

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  fees: number;
  type: "GENERAL" | "SPECIALIST";
  affiliation: string | null;
  is_active: boolean;
};

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    return await apiFetchServer<T>(path);
  } catch {
    return fallback;
  }
}

export default async function OpdPage() {
  const doctors = await safeFetch<Doctor[]>("/api/doctors?limit=200", []);
  const activeDoctors = doctors.filter((doctor) => doctor.is_active);
  const generalCount = activeDoctors.filter((doctor) => doctor.type === "GENERAL").length;
  const specialistCount = activeDoctors.filter((doctor) => doctor.type === "SPECIALIST").length;

  return (
    <main className="space-y-6">
      <section className="frosted rounded-3xl p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl md:text-5xl">OPD Booking</h1>
            <p className="mt-2 text-sm text-vitals-charcoal/70">Choose a doctor, check slot availability, and reserve instantly.</p>
          </div>
          <Badge variant="info">{activeDoctors.length} Doctors Available</Badge>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="frosted rounded-2xl p-5">
          <p className="text-sm text-vitals-charcoal/65">General physicians</p>
          <p className="font-display text-4xl text-vitals-charcoal">{generalCount}</p>
        </article>
        <article className="frosted rounded-2xl p-5">
          <p className="text-sm text-vitals-charcoal/65">Specialists</p>
          <p className="font-display text-4xl text-vitals-charcoal">{specialistCount}</p>
        </article>
        <article className="frosted rounded-2xl p-5">
          <p className="text-sm text-vitals-charcoal/65">My bookings</p>
          <Link href="/dashboard/opd/bookings" className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-vitals-crimson">
            <CalendarCheck2 className="h-4 w-4" />
            Open tickets
          </Link>
        </article>
      </section>

      {activeDoctors.length === 0 ? (
        <section className="frosted rounded-2xl p-6 text-sm text-vitals-charcoal/70">
          <p className="inline-flex items-center gap-2 font-medium text-vitals-charcoal">
            <Stethoscope className="h-4 w-4 text-vitals-crimson" />
            No doctors are available yet.
          </p>
          <p className="mt-2">Run the seed script from the API app to populate doctors and generated slots for local testing.</p>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        {activeDoctors.map((doctor) => (
          <Link href={`/dashboard/opd/${doctor.id}`} key={doctor.id}>
            <DoctorCard
              name={doctor.name}
              specialty={doctor.specialty}
              fees={doctor.fees}
              type={doctor.type}
              affiliation={doctor.affiliation ?? "VIT Health Centre"}
            />
          </Link>
        ))}
      </section>
    </main>
  );
}
