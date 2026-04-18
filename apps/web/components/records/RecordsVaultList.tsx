"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { RecordCard } from "@/components/records/RecordCard";
import { ShareModal } from "@/components/records/ShareModal";
import { apiFetchClient } from "@/lib/api";

type RecordType = "PRESCRIPTION" | "REPORT" | "DISCHARGE_SUMMARY" | "VACCINATION";

type RecordItem = {
  id: string;
  title: string;
  type: RecordType;
  file_size_bytes: number | null;
  mime_type: string | null;
  created_at: string;
};

type ShareResponse = {
  share_url: string;
};

type RecordsVaultListProps = {
  records: RecordItem[];
};

function formatDateLabel(dateRaw: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateRaw));
}

export function RecordsVaultList({ records }: RecordsVaultListProps) {
  const router = useRouter();
  const [shareUrl, setShareUrl] = useState("");
  const [openShareModal, setOpenShareModal] = useState(false);

  async function handleShare(recordId: string) {
    try {
      const response = await apiFetchClient<ShareResponse>(`/api/records/${recordId}/share`, {
        method: "POST",
      });
      setShareUrl(response.share_url);
      setOpenShareModal(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to generate share link");
    }
  }

  return (
    <>
      <section className="space-y-3">
        {records.map((record) => (
          <RecordCard
            key={record.id}
            title={record.title}
            type={record.type}
            uploadedDate={formatDateLabel(record.created_at)}
            fileSizeBytes={record.file_size_bytes ?? undefined}
            onView={() => router.push(`/dashboard/records/${record.id}`)}
            onDownload={() => window.open(`/api/records/${record.id}/download`, "_blank", "noopener,noreferrer")}
            onShare={() => void handleShare(record.id)}
          />
        ))}
      </section>

      <ShareModal open={openShareModal} onClose={() => setOpenShareModal(false)} shareUrl={shareUrl} />
    </>
  );
}
