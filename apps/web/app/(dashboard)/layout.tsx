import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/opd", label: "OPD" },
  { href: "/dashboard/lab", label: "Lab" },
  { href: "/dashboard/records", label: "Records" },
  { href: "/dashboard/profile", label: "Profile" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-7xl gap-4 px-4 py-6 md:grid-cols-[240px_1fr] md:px-6">
      <aside className="frosted h-fit rounded-2xl p-4 md:sticky md:top-4">
        <p className="mb-4 font-display text-2xl text-vitals-charcoal">
          VIT<span className="text-vitals-teal">als</span>
        </p>
        <nav className="space-y-2 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="block rounded-lg px-3 py-2 hover:bg-vitals-crimson/10">
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div>{children}</div>
    </div>
  );
}
