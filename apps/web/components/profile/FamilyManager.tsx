"use client";

import { FormEvent, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetchClient } from "@/lib/api";

type FamilyMember = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  reg_number: string | null;
  created_at: string;
};

type FamilyManagerProps = {
  userId: string;
};

type FamilyFormState = {
  name: string;
  email: string;
  phone: string;
  reg_number: string;
};

const initialFormState: FamilyFormState = {
  name: "",
  email: "",
  phone: "",
  reg_number: "",
};

function formatDate(dateRaw: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateRaw));
}

export function FamilyManager({ userId }: FamilyManagerProps) {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [formState, setFormState] = useState<FamilyFormState>(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  async function loadMembers() {
    try {
      const result = await apiFetchClient<FamilyMember[]>(`/api/users/${userId}/family`);
      setMembers(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load family members");
    }
  }

  useEffect(() => {
    loadMembers();
  }, [userId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await apiFetchClient(`/api/users/${userId}/family`, {
        method: "POST",
        body: JSON.stringify({
          name: formState.name,
          email: formState.email,
          phone: formState.phone || null,
          reg_number: formState.reg_number || null,
        }),
      });
      toast.success("Family member added");
      setFormState(initialFormState);
      await loadMembers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add family member");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(memberId: string) {
    try {
      await apiFetchClient(`/api/users/${userId}/family/${memberId}`, {
        method: "DELETE",
      });
      toast.success("Family member removed");
      await loadMembers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove family member");
    }
  }

  return (
    <section className="frosted rounded-2xl p-5">
      <h3 className="font-display text-xl">Family Members</h3>
      <p className="mt-1 text-sm text-vitals-charcoal/70">
        Faculty users can register dependent members under the same account.
      </p>

      <form className="mt-4 space-y-2" onSubmit={handleSubmit}>
        <Input
          placeholder="Member name"
          value={formState.name}
          onChange={(event) => setFormState((state) => ({ ...state, name: event.target.value }))}
          required
        />
        <Input
          placeholder="Email"
          type="email"
          value={formState.email}
          onChange={(event) => setFormState((state) => ({ ...state, email: event.target.value }))}
          required
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            placeholder="Phone"
            value={formState.phone}
            onChange={(event) => setFormState((state) => ({ ...state, phone: event.target.value }))}
          />
          <Input
            placeholder="Registration number"
            value={formState.reg_number}
            onChange={(event) => setFormState((state) => ({ ...state, reg_number: event.target.value }))}
          />
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Adding..." : "Add Family Member"}
        </Button>
      </form>

      <div className="mt-4 space-y-2">
        {members.length === 0 ? (
          <p className="text-sm text-vitals-charcoal/70">No family members added yet.</p>
        ) : (
          members.map((member) => (
            <article key={member.id} className="rounded-xl border border-vitals-charcoal/12 bg-white/70 px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-vitals-charcoal">{member.name}</p>
                  <p className="text-xs text-vitals-charcoal/70">{member.email}</p>
                  <p className="text-xs text-vitals-charcoal/65">
                    Added on {formatDate(member.created_at)}
                    {member.reg_number ? ` • ${member.reg_number}` : ""}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(member.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
