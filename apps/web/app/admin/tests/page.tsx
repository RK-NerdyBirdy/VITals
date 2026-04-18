"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { TestForm } from "@/components/admin/TestForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetchClient } from "@/lib/api";

type LabTest = {
  id: string;
  name: string;
  description: string | null;
  preparation: string | null;
  category: string | null;
  price: number;
  is_profile: boolean;
  turnaround_hrs: number;
  is_active: boolean;
};

type LabTestDetail = LabTest & {
  profile_item_ids: string[];
};

type TestPayload = {
  name: string;
  category: string;
  price: number;
  turnaround_hrs: number;
  is_profile: boolean;
  preparation?: string;
  description?: string;
  profile_item_ids: string[];
};

export default function AdminTestsPage() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTest, setEditingTest] = useState<LabTestDetail | null>(null);

  async function loadTests() {
    setLoading(true);
    try {
      const result = await apiFetchClient<LabTest[]>("/api/admin/tests?include_inactive=true&limit=300");
      setTests(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load tests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTests();
  }, []);

  const selectableItems = useMemo(
    () =>
      tests
        .filter((test) => test.is_active)
        .map((test) => ({ id: test.id, name: test.name, is_profile: test.is_profile })),
    [tests]
  );

  async function handleCreate(values: TestPayload) {
    try {
      await apiFetchClient<LabTest>("/api/admin/tests", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success("Lab test created");
      await loadTests();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create lab test");
    }
  }

  async function handleDeactivate(testId: string) {
    try {
      await apiFetchClient<{ detail: string }>(`/api/admin/tests/${testId}`, {
        method: "DELETE",
      });
      toast.success("Lab test deactivated");
      await loadTests();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to deactivate lab test");
    }
  }

  async function handleRestore(testId: string) {
    try {
      await apiFetchClient<LabTest>(`/api/admin/tests/${testId}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: true }),
      });
      toast.success("Lab test restored");
      await loadTests();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to restore lab test");
    }
  }

  async function handleEdit(testId: string) {
    const current = tests.find((item) => item.id === testId);
    if (!current) {
      toast.error("Test not found");
      return;
    }

    if (!current.is_active) {
      setEditingTest({ ...current, profile_item_ids: [] });
      return;
    }

    try {
      const detail = await apiFetchClient<LabTestDetail>(`/api/lab/tests/${testId}`);
      setEditingTest(detail);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load test detail");
    }
  }

  async function handleUpdate(values: TestPayload) {
    if (!editingTest) return;

    try {
      await apiFetchClient<LabTest>(`/api/admin/tests/${editingTest.id}`, {
        method: "PUT",
        body: JSON.stringify(values),
      });
      toast.success("Lab test updated");
      setEditingTest(null);
      await loadTests();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update lab test");
    }
  }

  return (
    <main className="space-y-4">
      <section className="frosted rounded-2xl p-6">
        <h1 className="font-display text-3xl">Lab Test Management</h1>
        <p className="mt-2 text-sm text-vitals-charcoal/70">Create, update, deactivate, and restore catalog entries.</p>
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <div className="rounded-xl border border-vitals-charcoal/12 bg-white/60 p-4">
            <h2 className="mb-3 font-display text-2xl">Create Test</h2>
            <TestForm testOptions={selectableItems} onSubmit={handleCreate} submitLabel="Create Test" />
          </div>

          <div className="rounded-xl border border-vitals-charcoal/12 bg-white/60 p-4">
            <h2 className="mb-3 font-display text-2xl">Edit Test</h2>
            {editingTest ? (
              <>
                <TestForm
                  key={editingTest.id}
                  testOptions={selectableItems.filter((item) => item.id !== editingTest.id)}
                  defaultValues={{
                    name: editingTest.name,
                    category: editingTest.category ?? "General",
                    price: editingTest.price,
                    turnaround_hrs: editingTest.turnaround_hrs,
                    is_profile: editingTest.is_profile,
                    preparation: editingTest.preparation ?? "",
                    description: editingTest.description ?? "",
                    profile_item_ids: editingTest.profile_item_ids,
                  }}
                  onSubmit={handleUpdate}
                  submitLabel="Update Test"
                />
                <Button className="mt-3" variant="ghost" size="sm" onClick={() => setEditingTest(null)}>
                  Cancel editing
                </Button>
              </>
            ) : (
              <p className="text-sm text-vitals-charcoal/70">Select a test from the catalog to edit.</p>
            )}
          </div>
        </div>
      </section>

      <section className="frosted rounded-2xl p-6">
        <h2 className="mb-4 font-display text-2xl">Catalog</h2>
        {loading ? <p className="text-sm text-vitals-charcoal/70">Loading tests...</p> : null}
        {!loading && tests.length === 0 ? <p className="text-sm text-vitals-charcoal/70">No tests found.</p> : null}
        <div className="space-y-3">
          {tests.map((test) => (
            <article key={test.id} className="rounded-xl border border-vitals-charcoal/12 bg-white/70 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-vitals-charcoal">{test.name}</p>
                  <p className="text-xs text-vitals-charcoal/70">
                    {test.category ?? "General"} • {test.is_profile ? "Profile" : "Individual"} • Rs {test.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={test.is_active ? "success" : "warning"}>
                    {test.is_active ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(test.id)}>
                    Edit
                  </Button>
                  {test.is_active ? (
                    <Button variant="ghost" size="sm" onClick={() => handleDeactivate(test.id)}>
                      Deactivate
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => handleRestore(test.id)}>
                      Restore
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
