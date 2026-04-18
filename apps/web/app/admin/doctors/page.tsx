"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { DoctorForm } from "@/components/admin/DoctorForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetchClient } from "@/lib/api";

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  type: "GENERAL" | "SPECIALIST";
  fees: number;
  qualification: string | null;
  bio: string | null;
  is_active: boolean;
};

type DoctorPayload = {
  name: string;
  specialty: string;
  type: "GENERAL" | "SPECIALIST";
  fees: number;
  qualification?: string;
  bio?: string;
};

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  async function loadDoctors() {
    setLoading(true);
    try {
      const result = await apiFetchClient<Doctor[]>("/api/admin/doctors?limit=300");
      setDoctors(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load doctors");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  async function handleCreate(values: DoctorPayload) {
    try {
      await apiFetchClient<Doctor>("/api/doctors", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success("Doctor created");
      await loadDoctors();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create doctor");
    }
  }

  async function handleToggleActive(doctor: Doctor) {
    try {
      await apiFetchClient<Doctor>(`/api/doctors/${doctor.id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: !doctor.is_active }),
      });
      toast.success(doctor.is_active ? "Doctor deactivated" : "Doctor reactivated");
      await loadDoctors();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update doctor");
    }
  }

  async function handleUpdate(values: DoctorPayload) {
    if (!editingDoctor) return;

    try {
      await apiFetchClient<Doctor>(`/api/doctors/${editingDoctor.id}`, {
        method: "PUT",
        body: JSON.stringify(values),
      });
      toast.success("Doctor updated");
      setEditingDoctor(null);
      await loadDoctors();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update doctor");
    }
  }

  async function handleDelete(doctor: Doctor) {
    const confirmed = window.confirm(`Delete ${doctor.name}? This will deactivate the doctor.`);
    if (!confirmed) return;

    try {
      await apiFetchClient<{ detail: string }>(`/api/doctors/${doctor.id}`, {
        method: "DELETE",
      });
      toast.success("Doctor deleted");
      if (editingDoctor?.id === doctor.id) {
        setEditingDoctor(null);
      }
      await loadDoctors();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete doctor");
    }
  }

  return (
    <main className="space-y-4">
      <section className="frosted rounded-2xl p-6">
        <h1 className="font-display text-3xl">Doctor Management</h1>
        <p className="mt-2 text-sm text-vitals-charcoal/70">Create, update, deactivate, and review doctor profiles.</p>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <div className="rounded-xl border border-vitals-charcoal/12 bg-white/60 p-4">
            <h2 className="mb-3 font-display text-2xl">Create Doctor</h2>
            <DoctorForm onSubmit={handleCreate} submitLabel="Create Doctor" />
          </div>

          <div className="rounded-xl border border-vitals-charcoal/12 bg-white/60 p-4">
            <h2 className="mb-3 font-display text-2xl">Edit Doctor</h2>
            {editingDoctor ? (
              <>
                <DoctorForm
                  key={editingDoctor.id}
                  defaultValues={{
                    name: editingDoctor.name,
                    specialty: editingDoctor.specialty,
                    type: editingDoctor.type,
                    fees: editingDoctor.fees,
                    qualification: editingDoctor.qualification ?? "",
                    bio: editingDoctor.bio ?? "",
                  }}
                  onSubmit={handleUpdate}
                  submitLabel="Update Doctor"
                />
                <Button className="mt-3" variant="ghost" size="sm" onClick={() => setEditingDoctor(null)}>
                  Cancel editing
                </Button>
              </>
            ) : (
              <p className="text-sm text-vitals-charcoal/70">Select a doctor from the roster to edit.</p>
            )}
          </div>
        </div>
      </section>

      <section className="frosted rounded-2xl p-6">
        <h2 className="mb-4 font-display text-2xl">Doctor Roster</h2>
        {loading ? <p className="text-sm text-vitals-charcoal/70">Loading doctors...</p> : null}
        {!loading && doctors.length === 0 ? (
          <p className="text-sm text-vitals-charcoal/70">No doctors found.</p>
        ) : null}
        <div className="space-y-3">
          {doctors.map((doctor) => (
            <article key={doctor.id} className="rounded-xl border border-vitals-charcoal/12 bg-white/70 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-vitals-charcoal">{doctor.name}</p>
                  <p className="text-xs text-vitals-charcoal/70">
                    {doctor.specialty} • {doctor.type} • Rs {doctor.fees.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={doctor.is_active ? "success" : "warning"}>
                    {doctor.is_active ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => setEditingDoctor(doctor)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleToggleActive(doctor)}>
                    {doctor.is_active ? "Deactivate" : "Reactivate"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(doctor)}>
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
