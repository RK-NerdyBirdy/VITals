"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetchClient } from "@/lib/api";

type OrderStatus = "PENDING" | "SAMPLE_COLLECTED" | "PROCESSING" | "COMPLETED" | "CANCELLED";

type LabOrder = {
  id: string;
  patient_id: string;
  status: OrderStatus;
  total_amount: number;
  ticket_number: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  created_at: string;
  items: Array<{
    id: string;
    test: {
      id: string;
      name: string;
      category: string | null;
    } | null;
  }>;
};

type User = {
  id: string;
  name: string;
  email: string;
};

const statusOptions: OrderStatus[] = ["PENDING", "SAMPLE_COLLECTED", "PROCESSING", "COMPLETED", "CANCELLED"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState<Record<string, OrderStatus>>({});

  async function loadData() {
    setLoading(true);
    try {
      const [orderData, userData] = await Promise.all([
        apiFetchClient<LabOrder[]>("/api/admin/orders?limit=500"),
        apiFetchClient<User[]>("/api/admin/users?limit=500"),
      ]);
      setOrders(orderData);
      setUsers(userData);
      setStatusDraft(
        Object.fromEntries(orderData.map((order) => [order.id, order.status])) as Record<string, OrderStatus>
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const userMap = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);

  async function handleUpdateStatus(orderId: string) {
    const nextStatus = statusDraft[orderId];
    if (!nextStatus) return;

    setUpdatingOrderId(orderId);
    try {
      await apiFetchClient<LabOrder>(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus }),
      });
      toast.success("Order status updated");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update order status");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  return (
    <main className="frosted rounded-2xl p-6">
      <h1 className="font-display text-3xl">Lab Order Management</h1>
      <p className="mt-2 text-sm text-vitals-charcoal/70">Track and update all lab order lifecycle stages.</p>

      <section className="mt-5 space-y-3">
        {loading ? <p className="text-sm text-vitals-charcoal/70">Loading orders...</p> : null}
        {!loading && orders.length === 0 ? <p className="text-sm text-vitals-charcoal/70">No orders found.</p> : null}

        {orders.map((order) => {
          const patient = userMap.get(order.patient_id);
          return (
            <article key={order.id} className="rounded-xl border border-vitals-charcoal/12 bg-white/70 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-vitals-charcoal">{order.ticket_number ?? order.id}</p>
                  <p className="text-xs text-vitals-charcoal/70">
                    {patient?.name ?? "Unknown patient"} • {patient?.email ?? order.patient_id}
                  </p>
                  <p className="text-xs text-vitals-charcoal/60">
                    Total Rs {order.total_amount.toFixed(2)} • {new Date(order.created_at).toLocaleString("en-IN")}
                  </p>
                  {order.items.length > 0 ? (
                    <p className="mt-1 text-xs text-vitals-charcoal/70">
                      Tests: {order.items.map((item) => item.test?.name ?? "Test").join(", ")}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
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
                  <select
                    className="h-9 rounded-lg border border-vitals-charcoal/20 bg-white px-2 text-xs"
                    value={statusDraft[order.id] ?? order.status}
                    onChange={(event) =>
                      setStatusDraft((prev) => ({ ...prev, [order.id]: event.target.value as OrderStatus }))
                    }
                    disabled={updatingOrderId === order.id}
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
                    disabled={updatingOrderId === order.id || (statusDraft[order.id] ?? order.status) === order.status}
                    onClick={() => handleUpdateStatus(order.id)}
                  >
                    {updatingOrderId === order.id ? "Updating..." : "Update"}
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
