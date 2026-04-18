"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const slotSchema = z.object({
  doctorId: z.string().uuid(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  slotMinutes: z.coerce.number().int().min(5).max(60).default(15),
});

type SlotFormValues = z.infer<typeof slotSchema>;
type DoctorOption = {
  id: string;
  name: string;
  specialty: string;
  type: "GENERAL" | "SPECIALIST";
};

type SlotGeneratorFormProps = {
  doctors?: DoctorOption[];
  onSubmit: (values: SlotFormValues) => Promise<void> | void;
};

export function SlotGeneratorForm({ doctors = [], onSubmit }: SlotGeneratorFormProps) {
  const form = useForm<SlotFormValues>({
    resolver: zodResolver(slotSchema),
    defaultValues: {
      slotMinutes: 15,
    },
  });

  return (
    <form onSubmit={form.handleSubmit((values) => onSubmit(values))} className="space-y-3">
      {doctors.length > 0 ? (
        <select className="h-10 w-full rounded-lg border border-vitals-charcoal/20 px-3 text-sm" {...form.register("doctorId")}>
          <option value="">Select doctor</option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.name} - {doctor.specialty} ({doctor.type})
            </option>
          ))}
        </select>
      ) : (
        <Input placeholder="Doctor UUID" {...form.register("doctorId")} />
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Input type="date" {...form.register("startDate")} />
        <Input type="date" {...form.register("endDate")} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Input type="time" {...form.register("startTime")} />
        <Input type="time" {...form.register("endTime")} />
        <Input type="number" {...form.register("slotMinutes")} />
      </div>
      <Button type="submit">Generate Slots</Button>
    </form>
  );
}
