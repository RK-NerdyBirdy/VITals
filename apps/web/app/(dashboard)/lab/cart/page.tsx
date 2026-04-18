"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FlaskConical, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, apiFetchClient } from "@/lib/api";
import { useCartStore } from "@/lib/store";

type LabOrder = {
  id: string;
  ticket_number: string | null;
};

type LabTestListItem = {
  id: string;
};

export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const total = useCartStore((state) => state.total);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);

  const profileCount = items.filter((item) => item.isProfile).length;
  const individualCount = items.length - profileCount;

  async function pruneUnavailableItems(): Promise<string[]> {
    if (items.length === 0) return [];

    const tests = await apiFetchClient<LabTestListItem[]>("/api/lab/tests?limit=500");
    const availableTestIds = new Set(tests.map((test) => test.id));
    const unavailableItems = items.filter((item) => !availableTestIds.has(item.id));

    if (unavailableItems.length > 0) {
      for (const item of unavailableItems) {
        removeItem(item.id);
      }

      toast.warning(
        `${unavailableItems.length} test${unavailableItems.length > 1 ? "s were" : " was"} removed because they are no longer available.`
      );
    }

    return items.filter((item) => availableTestIds.has(item.id)).map((item) => item.id);
  }

  useEffect(() => {
    void pruneUnavailableItems().catch(() => {
      // Ignore preload pruning errors; checkout will retry validation.
    });
  }, []);

  async function placeOrder() {
    if (items.length === 0) {
      toast.error("Add tests before placing an order");
      return;
    }

    setPlacing(true);
    try {
      const validTestIds = await pruneUnavailableItems();
      if (validTestIds.length === 0) {
        toast.error("No valid tests are left in your cart. Add tests again before checkout.");
        return;
      }

      const order = await apiFetchClient<LabOrder>("/api/lab/orders", {
        method: "POST",
        body: JSON.stringify({
          test_ids: validTestIds,
          appointment_date: appointmentDate || null,
          appointment_time: appointmentTime || null,
          notes: notes.trim() || null,
        }),
      });
      clearCart();
      toast.success(`Order placed${order.ticket_number ? ` (${order.ticket_number})` : ""}`);
      router.push("/dashboard/lab/orders");
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        toast.error("Some selected tests are unavailable. Your cart was refreshed. Please review and retry.");
        return;
      }

      toast.error(error instanceof Error ? error.message : "Unable to place order");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <main className="space-y-6">
      <section className="frosted rounded-3xl p-6 md:p-8">
        <h1 className="font-display text-4xl md:text-5xl">Lab Cart</h1>
        <p className="mt-2 text-sm text-vitals-charcoal/70">
          Review selected tests, remove unnecessary items, and place an order when ready.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="frosted rounded-2xl p-5">
          <p className="text-sm text-vitals-charcoal/65">Items selected</p>
          <p className="font-display text-4xl text-vitals-charcoal">{items.length}</p>
        </article>
        <article className="frosted rounded-2xl p-5">
          <p className="text-sm text-vitals-charcoal/65">Profiles</p>
          <p className="font-display text-4xl text-vitals-charcoal">{profileCount}</p>
        </article>
        <article className="frosted rounded-2xl p-5">
          <p className="text-sm text-vitals-charcoal/65">Individual tests</p>
          <p className="font-display text-4xl text-vitals-charcoal">{individualCount}</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <article className="frosted rounded-2xl p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl">Selected Tests</h2>
            {items.length > 0 ? (
              <Button variant="ghost" onClick={clearCart}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear cart
              </Button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-vitals-charcoal/20 bg-white/65 px-4 py-6 text-sm text-vitals-charcoal/70">
              <p className="inline-flex items-center gap-2 font-medium text-vitals-charcoal">
                <FlaskConical className="h-4 w-4 text-vitals-crimson" />
                Your cart is empty.
              </p>
              <p className="mt-2">Browse tests and add the ones recommended by your clinician.</p>
              <Link href="/dashboard/lab" className="mt-3 inline-block text-sm font-semibold text-vitals-crimson">
                Go to Lab Tests
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-xl border border-vitals-charcoal/12 bg-white/70 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-vitals-charcoal">{item.name}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-vitals-charcoal/55">
                        {item.isProfile ? "Profile bundle" : "Individual test"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-2xl text-vitals-crimson">Rs {item.price.toFixed(2)}</p>
                      <button className="text-xs text-vitals-charcoal/70 hover:text-vitals-crimson" onClick={() => removeItem(item.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="frosted rounded-2xl p-6">
          <h2 className="font-display text-2xl">Checkout Summary</h2>
          <div className="mt-4 space-y-2 text-sm text-vitals-charcoal/80">
            <div className="flex items-center justify-between">
              <span>Sub-total</span>
              <span>Rs {total().toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Collection fee</span>
              <span>Rs 0.00</span>
            </div>
            <div className="flex items-center justify-between border-t border-vitals-charcoal/10 pt-2 font-semibold text-vitals-charcoal">
              <span>Total</span>
              <span>Rs {total().toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Input type="date" value={appointmentDate} onChange={(event) => setAppointmentDate(event.target.value)} />
            <Input type="time" value={appointmentTime} onChange={(event) => setAppointmentTime(event.target.value)} />
            <Input
              placeholder="Notes for collection desk (optional)"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          <Button className="mt-4 w-full" onClick={placeOrder} disabled={items.length === 0 || placing}>
            {placing ? "Placing Order..." : "Place Lab Order"}
          </Button>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/dashboard/lab">
              <Button variant="outline">Add more tests</Button>
            </Link>
            <Link href="/dashboard/lab/orders">
              <Button variant="ghost">View my orders</Button>
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
