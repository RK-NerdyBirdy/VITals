"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const recordSchema = z.object({
  patientId: z.string().uuid(),
  title: z.string().min(2),
  type: z.enum(["PRESCRIPTION", "REPORT", "DISCHARGE_SUMMARY", "VACCINATION"]),
  description: z.string().optional(),
  file: z.any(),
});

type RecordUploadValues = z.infer<typeof recordSchema>;
type PatientOption = {
  id: string;
  name: string;
  email: string;
};

type RecordUploadFormProps = {
  patients?: PatientOption[];
  onSubmit: (values: RecordUploadValues) => Promise<void> | void;
};

export function RecordUploadForm({ patients = [], onSubmit }: RecordUploadFormProps) {
  const form = useForm<RecordUploadValues>({
    resolver: zodResolver(recordSchema),
    defaultValues: { type: "REPORT", description: "" },
  });

  return (
    <form onSubmit={form.handleSubmit((values) => onSubmit(values))} className="space-y-3">
      {patients.length > 0 ? (
        <select className="h-10 w-full rounded-lg border border-vitals-charcoal/20 px-3 text-sm" {...form.register("patientId")}>
          <option value="">Select patient</option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.name} ({patient.email})
            </option>
          ))}
        </select>
      ) : (
        <Input placeholder="Patient UUID" {...form.register("patientId")} />
      )}
      <Input placeholder="Record title" {...form.register("title")} />
      <select className="h-10 w-full rounded-lg border border-vitals-charcoal/20 px-3 text-sm" {...form.register("type")}>
        <option value="PRESCRIPTION">Prescription</option>
        <option value="REPORT">Report</option>
        <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
        <option value="VACCINATION">Vaccination</option>
      </select>
      <Textarea placeholder="Description (optional)" {...form.register("description")} />
      <Input type="file" {...form.register("file")} />
      <Button type="submit">Upload Record</Button>
    </form>
  );
}
