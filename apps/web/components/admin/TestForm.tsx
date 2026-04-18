"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const testSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  price: z.coerce.number().min(0),
  turnaround_hrs: z.coerce.number().int().min(1),
  is_profile: z.boolean().default(false),
  preparation: z.string().optional(),
  description: z.string().optional(),
  profile_item_ids: z.array(z.string().uuid()).default([]),
});

type TestFormValues = z.infer<typeof testSchema>;
type TestOption = { id: string; name: string; is_profile: boolean };

type TestFormProps = {
  testOptions?: TestOption[];
  onSubmit: (values: TestFormValues) => Promise<void> | void;
  defaultValues?: Partial<TestFormValues>;
  submitLabel?: string;
};

export function TestForm({ testOptions = [], onSubmit, defaultValues, submitLabel = "Save Test" }: TestFormProps) {
  const form = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      turnaround_hrs: 24,
      is_profile: false,
      profile_item_ids: [],
      ...defaultValues,
    },
  });

  useEffect(() => {
    form.reset({
      name: defaultValues?.name ?? "",
      category: defaultValues?.category ?? "",
      price: defaultValues?.price ?? 0,
      turnaround_hrs: defaultValues?.turnaround_hrs ?? 24,
      is_profile: defaultValues?.is_profile ?? false,
      preparation: defaultValues?.preparation ?? "",
      description: defaultValues?.description ?? "",
      profile_item_ids: defaultValues?.profile_item_ids ?? [],
    });
  }, [defaultValues, form]);

  const isProfile = form.watch("is_profile");
  const selectedProfileItemIds = form.watch("profile_item_ids");

  const selectableProfileItems = testOptions.filter((test) => !test.is_profile);

  function toggleProfileItem(testId: string, checked: boolean) {
    const next = checked
      ? [...selectedProfileItemIds, testId]
      : selectedProfileItemIds.filter((itemId) => itemId !== testId);
    form.setValue("profile_item_ids", next, { shouldDirty: true, shouldValidate: true });
  }

  return (
    <form onSubmit={form.handleSubmit((values) => onSubmit(values))} className="space-y-3">
      <Input placeholder="Test name" {...form.register("name")} />
      <Input placeholder="Category" {...form.register("category")} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input type="number" step="0.01" placeholder="Price" {...form.register("price")} />
        <Input type="number" placeholder="Turnaround hours" {...form.register("turnaround_hrs")} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register("is_profile")} />
        Is profile bundle
      </label>

      {isProfile ? (
        <div className="rounded-xl border border-vitals-charcoal/15 bg-white/70 p-3">
          <p className="mb-2 text-sm font-medium text-vitals-charcoal">Included individual tests</p>
          {selectableProfileItems.length === 0 ? (
            <p className="text-xs text-vitals-charcoal/70">No individual tests available yet.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {selectableProfileItems.map((test) => (
                <label key={test.id} className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedProfileItemIds.includes(test.id)}
                    onChange={(event) => toggleProfileItem(test.id, event.target.checked)}
                  />
                  {test.name}
                </label>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <Textarea placeholder="Preparation notes" {...form.register("preparation")} />
      <Textarea placeholder="Description" {...form.register("description")} />
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
