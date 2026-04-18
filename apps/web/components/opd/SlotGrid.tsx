"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { apiFetchClient } from "@/lib/api";
import { cn } from "@/lib/utils";

type SlotStatus = "AVAILABLE" | "LOCKED" | "BOOKED" | "CANCELLED";

type SlotItem = {
  id: string;
  start_time: string;
  end_time: string;
  status: SlotStatus;
};

interface SlotProps {
  doctorId: string;
  date: string;
}

function parseTimeLabel(raw: string): string {
  const [hours, minutes] = raw.split(":");
  const hour = Number(hours);
  const suffix = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${minutes} ${suffix}`;
}

export function SlotGrid({ doctorId, date }: SlotProps) {
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [selected, setSelected] = useState<SlotItem | null>(null);
  const [lockToken, setLockToken] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(false);

  async function loadSlots() {
    const result = await apiFetchClient<SlotItem[]>(`/api/doctors/${doctorId}/slots?date=${date}`);
    setSlots(result);
  }

  useEffect(() => {
    loadSlots().catch(() => {
      toast.error("Unable to load slots");
    });
  }, [doctorId, date]);

  useEffect(() => {
    if (!secondsLeft) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  useEffect(() => {
    if (secondsLeft === 0 && lockToken) {
      setLockToken(null);
      setSelected(null);
      toast.info("Slot lock expired");
      loadSlots().catch(() => {
        toast.error("Unable to refresh slots");
      });
    }
  }, [secondsLeft, lockToken]);

  const columns = useMemo(() => "grid-cols-3 md:grid-cols-6", []);

  async function lockSelectedSlot(slot: SlotItem) {
    if (slot.status !== "AVAILABLE") return;
    setLoading(true);
    try {
      const lock = await apiFetchClient<{ lock_token: string; expires_at: string }>(
        `/api/opd/slots/${slot.id}/lock`,
        { method: "POST" }
      );
      setSelected(slot);
      setLockToken(lock.lock_token);
      setSecondsLeft(300);
      await loadSlots();
      toast.success("Slot locked for 5 minutes");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not lock slot");
    } finally {
      setLoading(false);
    }
  }

  async function confirmBooking() {
    if (!selected || !lockToken) return;
    setLoading(true);
    try {
      await apiFetchClient(`/api/opd/slots/${selected.id}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lock_token: lockToken }),
      });
      toast.success("Appointment booked successfully");
      setSelected(null);
      setLockToken(null);
      setSecondsLeft(0);
      await loadSlots();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to confirm booking");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {slots.length === 0 ? (
        <p className="rounded-xl border border-dashed border-vitals-charcoal/20 bg-white/70 px-4 py-3 text-sm text-vitals-charcoal/70">
          No slots available for this date. Try another date.
        </p>
      ) : null}

      <div className={cn("grid gap-3", columns)}>
        {slots.map((slot) => {
          const isSelected = selected?.id === slot.id;
          return (
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              key={slot.id}
              disabled={slot.status !== "AVAILABLE" || loading}
              onClick={() => lockSelectedSlot(slot)}
              className={cn(
                "rounded-xl border px-3 py-4 text-sm font-medium transition",
                slot.status === "AVAILABLE" && "border-emerald-300 bg-emerald-50 text-emerald-800",
                slot.status === "BOOKED" && "border-slate-300 bg-slate-100 text-slate-500",
                slot.status === "LOCKED" && "border-amber-300 bg-amber-50 text-amber-800",
                slot.status === "CANCELLED" && "border-slate-200 bg-slate-50 text-slate-400",
                isSelected && "border-blue-400 bg-blue-50 text-blue-700"
              )}
            >
              {parseTimeLabel(slot.start_time)}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {selected && lockToken ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="frosted rounded-xl p-4"
          >
            <p className="text-sm text-vitals-charcoal/80">
              Locked slot: <strong>{parseTimeLabel(selected.start_time)}</strong>
            </p>
            <p className="mt-1 text-sm text-vitals-crimson">Time left: {secondsLeft}s</p>
            <Button className="mt-3" disabled={loading} onClick={confirmBooking}>
              Confirm Booking
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
