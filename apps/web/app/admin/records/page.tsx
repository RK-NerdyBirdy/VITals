"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { RecordUploadForm } from "@/components/admin/RecordUploadForm";
import { apiFetchClient } from "@/lib/api";

type User = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "FACULTY" | "ADMIN";
};

type RecordUploadValues = {
  patientId: string;
  title: string;
  type: "PRESCRIPTION" | "REPORT" | "DISCHARGE_SUMMARY" | "VACCINATION";
  description?: string;
  file?: unknown;
};

export default function AdminRecordsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [records, setRecords] = useState<
    Array<{
      id: string;
      patient_id: string;
      title: string;
      type: "PRESCRIPTION" | "REPORT" | "DISCHARGE_SUMMARY" | "VACCINATION";
      created_at: string;
      is_active: boolean;
    }>
  >([]);

  async function loadUsers() {
    try {
      const result = await apiFetchClient<User[]>("/api/admin/users?limit=500");
      setUsers(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load users");
    }
  }

  async function loadRecords() {
    try {
      const result = await apiFetchClient<
        Array<{
          id: string;
          patient_id: string;
          title: string;
          type: "PRESCRIPTION" | "REPORT" | "DISCHARGE_SUMMARY" | "VACCINATION";
          created_at: string;
          is_active: boolean;
        }>
      >("/api/records");
      setRecords(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load records");
    }
  }

  useEffect(() => {
    void loadUsers();
    void loadRecords();
  }, []);

  const patientOptions = useMemo(
    () => users.filter((user) => user.role === "STUDENT" || user.role === "FACULTY"),
    [users]
  );

  async function handleSubmit(values: RecordUploadValues) {
    const fileValue = values.file as FileList | File | null | undefined;
    const file = fileValue instanceof File ? fileValue : fileValue?.[0];
    if (!file) {
      toast.error("Please choose a file to upload");
      return;
    }

    const payload = new FormData();
    payload.append("patient_id", values.patientId);
    payload.append("type", values.type);
    payload.append("title", values.title);
    if (values.description?.trim()) {
      payload.append("description", values.description.trim());
    }
    payload.append("file", file);

    try {
      await apiFetchClient("/api/records", {
        method: "POST",
        body: payload,
      });
      toast.success("Record uploaded");
      await loadRecords();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload record");
    }
  }

  async function handleDelete(recordId: string) {
    const confirmed = window.confirm("Delete this record?");
    if (!confirmed) return;

    try {
      await apiFetchClient<{ detail: string }>(`/api/records/${recordId}`, {
        method: "DELETE",
      });
      toast.success("Record deleted");
      await loadRecords();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete record");
    }
  }

  const userMap = new Map(users.map((user) => [user.id, user]));

  return (
    <main className="space-y-4">
      <section className="frosted rounded-2xl p-6">
        <h1 className="font-display text-3xl">Record Upload</h1>
        <p className="mt-2 text-sm text-vitals-charcoal/70">Upload encrypted records for patients.</p>
        <div className="mt-5 max-w-xl">
          <RecordUploadForm patients={patientOptions} onSubmit={handleSubmit} />
        </div>
      </section>

      <section className="frosted rounded-2xl p-6">
        <h2 className="mb-4 font-display text-2xl">Record Library</h2>
        {records.length === 0 ? <p className="text-sm text-vitals-charcoal/70">No records available.</p> : null}
        <div className="space-y-3">
          {records.map((record) => {
            const patient = userMap.get(record.patient_id);
            return (
              <article key={record.id} className="rounded-xl border border-vitals-charcoal/12 bg-white/70 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-vitals-charcoal">{record.title}</p>
                    <p className="text-xs text-vitals-charcoal/70">
                      {record.type.replaceAll("_", " ")} • {patient?.name ?? "Unknown patient"}
                    </p>
                    <p className="text-xs text-vitals-charcoal/60">{new Date(record.created_at).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-lg border border-vitals-charcoal/20 px-3 py-1.5 text-xs hover:bg-vitals-charcoal/5"
                      onClick={() => window.open(`/api/records/${record.id}/download`, "_blank", "noopener,noreferrer")}
                    >
                      Download
                    </button>
                    <button
                      className="rounded-lg border border-vitals-crimson/40 px-3 py-1.5 text-xs text-vitals-crimson hover:bg-vitals-crimson/10"
                      onClick={() => handleDelete(record.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
