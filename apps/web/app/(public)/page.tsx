import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { DoctorCard } from "@/components/opd/DoctorCard";
import { Button } from "@/components/ui/button";
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

const FALLBACK_DOCTORS: Doctor[] = [
  {
    id: "fallback-gp-1",
    name: "Dr. Ananya Rao",
    specialty: "General Medicine",
    fees: 180,
    type: "GENERAL",
    affiliation: "VIT Health Centre",
    is_active: true,
  },
  {
    id: "fallback-sp-1",
    name: "Dr. Karthik Menon",
    specialty: "Cardiology",
    fees: 620,
    type: "SPECIALIST",
    affiliation: "VIT Health Centre",
    is_active: true,
  },
  {
    id: "fallback-sp-2",
    name: "Dr. Priya Sharma",
    specialty: "Dermatology",
    fees: 540,
    type: "SPECIALIST",
    affiliation: "VIT Health Centre",
    is_active: true,
  },
];

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    return await apiFetchServer<T>(path);
  } catch {
    return fallback;
  }
}

export default async function LandingPage() {
  const doctors = await safeFetch<Doctor[]>("/api/doctors?limit=10", []);
  const featuredDoctors = doctors.filter((doctor) => doctor.is_active).slice(0, 8);
  const doctorsToRender = featuredDoctors.length > 0 ? featuredDoctors : FALLBACK_DOCTORS;

  return (
    <main className="mx-auto max-w-7xl px-4 pb-14 pt-6 sm:px-6 lg:px-8">
      <header className="sticky top-4 z-30 mb-8 rounded-2xl border border-white/70 bg-white/75 px-4 py-3 backdrop-blur-xl md:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="font-display text-2xl text-vitals-charcoal">
            VIT<span className="text-vitals-teal">als</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm md:flex">
            <Link href="/dashboard/opd" className="hover:text-vitals-crimson">
              OPD
            </Link>
            <Link href="/dashboard/lab" className="hover:text-vitals-crimson">
              Lab Tests
            </Link>
            <Link href="/dashboard/records" className="hover:text-vitals-crimson">
              Records
            </Link>
            <Link href="/login">
              <Button size="sm">Login</Button>
            </Link>
          </nav>

          <details className="md:hidden">
            <summary className="cursor-pointer list-none rounded-lg border border-vitals-charcoal/20 px-3 py-1 text-sm">
              Menu
            </summary>
            <div className="absolute right-4 mt-2 w-40 rounded-xl border border-vitals-charcoal/10 bg-white p-3 text-sm shadow-lg">
              <Link href="/dashboard/opd" className="block py-1.5">
                OPD
              </Link>
              <Link href="/dashboard/lab" className="block py-1.5">
                Lab Tests
              </Link>
              <Link href="/dashboard/records" className="block py-1.5">
                Records
              </Link>
              <Link href="/login" className="block py-1.5 text-vitals-crimson">
                Login
              </Link>
            </div>
          </details>
        </div>
      </header>

      <Hero />
      <HowItWorks />
      <Features />

      <section className="mt-24">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-vitals-charcoal/60">Doctors Preview</p>
            <h2 className="font-display text-3xl text-vitals-charcoal md:text-4xl">Meet Campus Specialists</h2>
          </div>
          <Link href="/dashboard/opd" className="inline-flex items-center gap-1 text-sm font-semibold text-vitals-crimson">
            View All Doctors <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2">
          {doctorsToRender.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              name={doctor.name}
              specialty={doctor.specialty}
              fees={doctor.fees}
              type={doctor.type}
              affiliation={doctor.affiliation ?? "VIT Health Centre"}
            />
          ))}
        </div>
        {featuredDoctors.length === 0 ? (
          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-vitals-charcoal/60">
            Showing preview doctors until live roster is available.
          </p>
        ) : null}
      </section>

      <Footer />
    </main>
  );
}
