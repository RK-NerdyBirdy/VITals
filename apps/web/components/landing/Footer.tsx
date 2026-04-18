import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 rounded-t-[2rem] border border-vitals-charcoal/10 bg-white/70 px-6 py-12 backdrop-blur-xl md:px-10">
      <div className="grid gap-10 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl text-vitals-charcoal">
            VIT<span className="text-vitals-teal">als</span>
          </p>
          <p className="mt-3 text-sm text-vitals-charcoal/75">Your campus health, simplified.</p>
        </div>

        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-vitals-charcoal/60">Quick Links</p>
          <nav className="space-y-2 text-sm">
            <Link href="/dashboard/opd" className="block hover:text-vitals-crimson">
              OPD Booking
            </Link>
            <Link href="/dashboard/lab" className="block hover:text-vitals-crimson">
              Lab Tests
            </Link>
            <Link href="/dashboard/records" className="block hover:text-vitals-crimson">
              Medical Records
            </Link>
          </nav>
        </div>

        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-vitals-charcoal/60">Contact</p>
          <p className="text-sm">VIT Health Centre, Vellore Campus</p>
          <p className="text-sm text-vitals-charcoal/70">+91 416 220 2020</p>
          <p className="mt-4 text-xs text-vitals-charcoal/60">
            This platform is for VIT community members only.
          </p>
        </div>
      </div>
    </footer>
  );
}
