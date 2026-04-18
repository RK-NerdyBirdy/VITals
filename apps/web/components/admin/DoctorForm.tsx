"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const doctorSchema = z.object({
  name: z.string().min(2),
  specialty: z.string().min(2),
  type: z.enum(["GENERAL", "SPECIALIST"]),
  fees: z.coerce.number().min(0),
  qualification: z.string().optional(),
  bio: z.string().optional(),
});

type DoctorFormValues = z.infer<typeof doctorSchema>;

type DoctorFormProps = {
  defaultValues?: Partial<DoctorFormValues>;
  onSubmit: (values: DoctorFormValues) => Promise<void> | void;
  submitLabel?: string;
};

export function DoctorForm({ defaultValues, onSubmit, submitLabel = "Save Doctor" }: DoctorFormProps) {
  const form = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      type: "GENERAL",
      fees: 0,
      ...defaultValues,
    },
  });

  useEffect(() => {
    form.reset({
      type: defaultValues?.type ?? "GENERAL",
      fees: defaultValues?.fees ?? 0,
      name: defaultValues?.name ?? "",
      specialty: defaultValues?.specialty ?? "",
      qualification: defaultValues?.qualification ?? "",
      bio: defaultValues?.bio ?? "",
    });
  }, [defaultValues, form]);

  return (
    <form onSubmit={form.handleSubmit((values) => onSubmit(values))} className="space-y-3">
      <Input placeholder="Doctor name" {...form.register("name")} />
      <Input placeholder="Specialty" {...form.register("specialty")} />
      <select className="h-10 w-full rounded-lg border border-vitals-charcoal/20 px-3 text-sm" {...form.register("type")}>
        <option value="GENERAL">General</option>
        <option value="SPECIALIST">Specialist</option>
      </select>
      <Input type="number" step="0.01" placeholder="Fees" {...form.register("fees")} />
      <Input placeholder="Qualification" {...form.register("qualification")} />
      <Textarea placeholder="Bio" {...form.register("bio")} />
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
