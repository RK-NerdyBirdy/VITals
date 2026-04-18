import { FileLock2 } from "lucide-react";

import { RecordsVaultList } from "@/components/records/RecordsVaultList";
import { apiFetchServer } from "@/lib/api";

type RecordType = "PRESCRIPTION" | "REPORT" | "DISCHARGE_SUMMARY" | "VACCINATION";

type RecordItem = {
  id: string;
  title: string;
  type: RecordType;
  file_size_bytes: number | null;
  mime_type: string | null;
  created_at: string;
};

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    return await apiFetchServer<T>(path);
  } catch {
    return fallback;
  }
}

export default async function RecordsPage() {
  const records = await safeFetch<RecordItem[]>("/api/records", []);

  const byType = records.reduce<Record<RecordType, number>>(
    (acc, item) => {
      acc[item.type] += 1;
      return acc;
    },
    {
      PRESCRIPTION: 0,
      REPORT: 0,
      DISCHARGE_SUMMARY: 0,
      VACCINATION: 0,
    }
  );

  return (
    <main className="space-y-6">
      <section className="frosted rounded-3xl p-6 md:p-8">
        <h1 className="font-display text-4xl md:text-5xl">Medical Records Vault</h1>
        <p className="mt-2 text-sm text-vitals-charcoal/70">Encrypted records with controlled viewing and secure ticketed sharing.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="frosted rounded-2xl p-5">
          <p className="text-sm text-vitals-charcoal/65">Total records</p>
          <p className="font-display text-4xl text-vitals-charcoal">{records.length}</p>
        </article>
        <article className="frosted rounded-2xl p-5">
          <p className="text-sm text-vitals-charcoal/65">Reports</p>
          <p className="font-display text-4xl text-vitals-charcoal">{byType.REPORT}</p>
        </article>
        <article className="frosted rounded-2xl p-5">
          <p className="text-sm text-vitals-charcoal/65">Prescriptions</p>
          <p className="font-display text-4xl text-vitals-charcoal">{byType.PRESCRIPTION}</p>
        </article>
        <article className="frosted rounded-2xl p-5">
          <p className="text-sm text-vitals-charcoal/65">Vaccinations</p>
          <p className="font-display text-4xl text-vitals-charcoal">{byType.VACCINATION}</p>
        </article>
      </section>

      <section className="space-y-3">
        {records.length === 0 ? (
          <article className="frosted rounded-2xl p-6 text-sm text-vitals-charcoal/70">
            <p className="inline-flex items-center gap-2 font-medium text-vitals-charcoal">
              <FileLock2 className="h-4 w-4 text-vitals-crimson" />
              No records found in your vault.
            </p>
            <p className="mt-2">Ask an admin to upload records or run the seed script to populate local test data.</p>
          </article>
        ) : (
          <RecordsVaultList records={records} />
        )}
      </section>
    </main>
  );
}
