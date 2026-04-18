import { Clock3, Ticket } from "lucide-react";

import { OrderTicket } from "@/components/lab/OrderTicket";
import { Badge } from "@/components/ui/badge";
import { apiFetchServer } from "@/lib/api";

type LabOrder = {
  id: string;
  status: "PENDING" | "SAMPLE_COLLECTED" | "PROCESSING" | "COMPLETED" | "CANCELLED";
  total_amount: number;
  appointment_date: string | null;
  appointment_time: string | null;
  ticket_number: string | null;
  notes: string | null;
  qr_code_data: string | null;
  created_at: string;
  items: Array<{
    id: string;
    test_id: string;
    price_at_order: number;
    test: {
      id: string;
      name: string;
      category: string | null;
    } | null;
  }>;
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

function formatDateTime(order: LabOrder): string {
  if (order.appointment_date && order.appointment_time) {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(`${order.appointment_date}T${order.appointment_time}`));
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(order.created_at));
}

export default async function OrdersPage() {
  const [orders, profile] = await Promise.all([
    safeFetch<LabOrder[]>("/api/lab/orders?limit=100", []),
    safeFetch<Profile | null>("/api/auth/me", null),
  ]);

  const sorted = [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const featured = sorted.find((order) => order.ticket_number && order.status !== "CANCELLED") ?? null;

  return (
    <main className="space-y-6">
      <section className="frosted rounded-3xl p-6 md:p-8">
        <h1 className="font-display text-4xl md:text-5xl">My Lab Orders</h1>
        <p className="mt-2 text-sm text-vitals-charcoal/70">Track test processing from order placement to report completion.</p>
      </section>

      {featured ? (
        <OrderTicket
          patientName={profile?.name ?? "VITals User"}
          ticketNumber={featured.ticket_number ?? "VIT-LAB-PENDING"}
          totalAmount={featured.total_amount}
          tests={
            featured.items.length > 0
              ? featured.items.map((item) => item.test?.name ?? "Test")
              : [featured.notes ?? "Detailed test list is linked with your order history"]
          }
          qrValue={
            featured.qr_code_data ??
            JSON.stringify({ type: "lab_order", ticket: featured.ticket_number ?? "pending", id: featured.id })
          }
        />
      ) : null}

      <section className="frosted rounded-2xl p-6">
        <h2 className="mb-4 font-display text-2xl">Order History</h2>

        {sorted.length === 0 ? (
          <p className="rounded-xl border border-dashed border-vitals-charcoal/20 bg-white/65 px-4 py-5 text-sm text-vitals-charcoal/70">
            No lab orders yet. Add tests to cart from the Lab page to create your first order.
          </p>
        ) : (
          <div className="space-y-3">
            {sorted.map((order) => (
              <article key={order.id} className="rounded-xl border border-vitals-charcoal/12 bg-white/70 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-vitals-charcoal">{order.ticket_number ?? "Ticket pending"}</p>
                    <p className="text-xs text-vitals-charcoal/65">Total: Rs {order.total_amount.toFixed(2)}</p>
                  </div>
                  <Badge
                    variant={
                      order.status === "COMPLETED"
                        ? "success"
                        : order.status === "CANCELLED"
                          ? "warning"
                          : "info"
                    }
                  >
                    {order.status.replaceAll("_", " ")}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap gap-4 text-xs text-vitals-charcoal/70">
                  <p className="inline-flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatDateTime(order)}
                  </p>
                  <p className="inline-flex items-center gap-1">
                    <Ticket className="h-3.5 w-3.5" />
                    {order.ticket_number ?? "Unassigned"}
                  </p>
                </div>

                {order.notes ? (
                  <p className="mt-2 rounded-lg bg-vitals-charcoal/5 px-3 py-2 text-xs text-vitals-charcoal/75">
                    Notes: {order.notes}
                  </p>
                ) : null}

                {order.items.length > 0 ? (
                  <div className="mt-2 rounded-lg border border-vitals-charcoal/10 bg-white/75 px-3 py-2 text-xs text-vitals-charcoal/75">
                    <p className="mb-1 font-medium text-vitals-charcoal">Ordered tests</p>
                    <ul className="list-disc space-y-1 pl-4">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          {item.test?.name ?? "Test"} ({item.test?.category ?? "General"}) - Rs {item.price_at_order.toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
