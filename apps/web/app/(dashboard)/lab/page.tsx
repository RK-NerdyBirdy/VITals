"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useEffect, useMemo } from "react";
import { ClipboardList, FlaskConical } from "lucide-react";
import { toast } from "sonner";

import { CartSidebar } from "@/components/lab/CartSidebar";
import { TestCard } from "@/components/lab/TestCard";
import { TestProfileCard } from "@/components/lab/TestProfileCard";
import { Button } from "@/components/ui/button";
import { apiFetchClient } from "@/lib/api";
import { useCartStore } from "@/lib/store";

type LabTest = {
  id: string;
  name: string;
  description: string | null;
  preparation: string | null;
  price: number;
  is_profile: boolean;
  turnaround_hrs: number;
  category: string | null;
};

type LabTestDetail = {
  id: string;
  profile_items: Array<{ id: string; name: string }>;
};

export default function LabPage() {
  const router = useRouter();
  const [tests, setTests] = useState<LabTest[]>([]);
  const [profileItemsByTestId, setProfileItemsByTestId] = useState<Record<string, string[]>>({});
  const [openCart, setOpenCart] = useState(false);
  const cartItems = useCartStore((state) => state.items);

  useEffect(() => {
    async function loadTests() {
      try {
        const result = await apiFetchClient<LabTest[]>("/api/lab/tests?limit=200");
        setTests(result);

        const profileTests = result.filter((test) => test.is_profile);
        const profileDetails = await Promise.all(
          profileTests.map((test) => apiFetchClient<LabTestDetail>(`/api/lab/tests/${test.id}`))
        );

        const nextMap: Record<string, string[]> = {};
        for (const detail of profileDetails) {
          nextMap[detail.id] = detail.profile_items.map((item) => item.name);
        }
        setProfileItemsByTestId(nextMap);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load tests");
      }
    }

    loadTests();
  }, []);

  const individualTests = useMemo(() => tests.filter((test) => !test.is_profile), [tests]);
  const profiles = useMemo(() => tests.filter((test) => test.is_profile), [tests]);

  return (
    <main className="space-y-6">
      <section className="frosted rounded-3xl p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-4xl md:text-5xl">Lab Tests</h1>
            <p className="mt-1 text-sm text-vitals-charcoal/70">Build your cart, compare test profiles, and place orders faster.</p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-vitals-charcoal/55">
              {tests.length} tests loaded • {cartItems.length} in cart
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/lab/orders">
              <Button variant="ghost">
                <ClipboardList className="mr-2 h-4 w-4" />
                My Orders
              </Button>
            </Link>
            <Button onClick={() => setOpenCart(true)}>Open Cart</Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="frosted rounded-2xl p-5">
          <p className="text-sm text-vitals-charcoal/65">Individual tests</p>
          <p className="font-display text-4xl text-vitals-charcoal">{individualTests.length}</p>
        </article>
        <article className="frosted rounded-2xl p-5">
          <p className="text-sm text-vitals-charcoal/65">Profile bundles</p>
          <p className="font-display text-4xl text-vitals-charcoal">{profiles.length}</p>
        </article>
        <article className="frosted rounded-2xl p-5">
          <p className="text-sm text-vitals-charcoal/65">Cart value</p>
          <p className="font-display text-4xl text-vitals-charcoal">
            Rs {cartItems.reduce((sum, item) => sum + item.price, 0).toFixed(0)}
          </p>
        </article>
      </section>

      {tests.length === 0 ? (
        <section className="frosted rounded-2xl p-6 text-sm text-vitals-charcoal/70">
          <p className="inline-flex items-center gap-2 font-medium text-vitals-charcoal">
            <FlaskConical className="h-4 w-4 text-vitals-crimson" />
            No lab tests available yet.
          </p>
          <p className="mt-2">Create tests from the admin panel or run the seed script in the API app.</p>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        {individualTests.map((test) => (
          <TestCard
            key={test.id}
            id={test.id}
            name={test.name}
            category={test.category ?? "General"}
            preparation={test.preparation}
            turnaroundHours={test.turnaround_hrs}
            price={test.price}
            isProfile={false}
          />
        ))}

        {profiles.map((profile) => (
          <TestProfileCard
            key={profile.id}
            id={profile.id}
            name={profile.name}
            category={profile.category ?? "Profile"}
            price={profile.price}
            turnaroundHours={profile.turnaround_hrs}
            tests={profileItemsByTestId[profile.id] ?? ["Includes bundled diagnostics"]}
          />
        ))}
      </section>

      <CartSidebar
        open={openCart}
        onClose={() => setOpenCart(false)}
        onCheckout={() => {
          setOpenCart(false);
          router.push("/dashboard/lab/cart");
        }}
      />
    </main>
  );
}
