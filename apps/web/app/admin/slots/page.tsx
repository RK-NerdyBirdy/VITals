"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SlotGeneratorForm } from "@/components/admin/SlotGeneratorForm";
import { apiFetchClient } from "@/lib/api";

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  type: "GENERAL" | "SPECIALIST";
};

type SlotValues = {
  doctorId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  slotMinutes: number;
};

export default function AdminSlotsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    apiFetchClient<Doctor[]>("/api/doctors?limit=300")
      .then((result) => setDoctors(result))
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Unable to load doctors");
      });
  }, []);

  async function handleSubmit(values: SlotValues) {
    try {
      const response = await apiFetchClient<{ created: number }>("/api/admin/slots/generate", {
        method: "POST",
        body: JSON.stringify({
          doctor_id: values.doctorId,
          start_date: values.startDate,
          end_date: values.endDate,
          start_time: values.startTime,
          end_time: values.endTime,
          slot_minutes: values.slotMinutes,
        }),
      });
      toast.success(`Generated ${response.created} slots`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to generate slots");
    }
  }

  return (
    <main className="frosted rounded-2xl p-6">
      <h1 className="font-display text-3xl">Slot Generator</h1>
      <p className="mt-2 text-sm text-vitals-charcoal/70">Pre-generate GP slots by date range.</p>
      <div className="mt-5 max-w-xl">
        <SlotGeneratorForm doctors={doctors} onSubmit={handleSubmit} />
      </div>
    </main>
  );
}
