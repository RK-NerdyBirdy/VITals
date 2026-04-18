import Link from "next/link";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/doctors", label: "Doctors" },
  { href: "/admin/tests", label: "Tests" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/records", label: "Records" },
  { href: "/admin/slots", label: "Slots" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-7xl space-y-4 px-4 py-6 md:px-6">
      <header className="frosted rounded-2xl p-4">
        <p className="font-display text-3xl">Admin Control Center</p>
        <nav className="mt-3 flex flex-wrap gap-2 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-lg border border-vitals-charcoal/20 px-3 py-1.5 hover:bg-vitals-crimson/10">
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </div>
  );
}
