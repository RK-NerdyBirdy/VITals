import { RecordViewer } from "@/components/records/RecordViewer";
import { Badge } from "@/components/ui/badge";
import { apiFetchServer } from "@/lib/api";

type RecordDetailPageProps = {
  params: { recordId: string };
};

type RecordType = "PRESCRIPTION" | "REPORT" | "DISCHARGE_SUMMARY" | "VACCINATION";

type RecordItem = {
  id: string;
  title: string;
  type: RecordType;
  description: string | null;
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

function formatSize(sizeBytes: number | null): string {
  if (sizeBytes === null) return "Unknown size";
  return `${(sizeBytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(dateRaw: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateRaw));
}

export default async function RecordDetailPage({ params }: RecordDetailPageProps) {
  const records = await safeFetch<RecordItem[]>("/api/records", []);
  const record = records.find((item) => item.id === params.recordId) ?? null;

  if (!record) {
    return (
      <main className="frosted rounded-2xl p-6 text-sm text-vitals-charcoal/70">
        <h1 className="font-display text-3xl text-vitals-charcoal">Record not found</h1>
        <p className="mt-2">This record may be unavailable or your access has expired.</p>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <section className="frosted rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-4xl">{record.title}</h1>
            <p className="mt-2 text-sm text-vitals-charcoal/70">Record ID: {record.id}</p>
          </div>
          <Badge variant={record.type === "REPORT" ? "success" : "info"}>{record.type.replaceAll("_", " ")}</Badge>
        </div>

        <div className="mt-4 grid gap-3 text-xs uppercase tracking-[0.18em] text-vitals-charcoal/55 sm:grid-cols-3">
          <p>Uploaded: {formatDate(record.created_at)}</p>
          <p>Size: {formatSize(record.file_size_bytes)}</p>
          <p>MIME: {record.mime_type ?? "unknown"}</p>
        </div>

        {record.description ? (
          <p className="mt-3 rounded-lg bg-vitals-charcoal/5 px-3 py-2 text-sm text-vitals-charcoal/80">{record.description}</p>
        ) : null}

        <a href={`/api/records/${record.id}/download`} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-semibold text-vitals-crimson">
          Open in new tab
        </a>
      </section>

      <RecordViewer url={`/api/records/${record.id}/download`} mimeType={record.mime_type ?? undefined} />
    </main>
  );
}
