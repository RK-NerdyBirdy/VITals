"use client";

import { Eye, Share2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RecordType = "PRESCRIPTION" | "REPORT" | "DISCHARGE_SUMMARY" | "VACCINATION";

type RecordCardProps = {
  title: string;
  type: RecordType;
  uploadedDate: string;
  fileSizeBytes?: number;
  onView?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
};

const badgeVariant: Record<RecordType, "info" | "success" | "warning" | "default"> = {
  PRESCRIPTION: "info",
  REPORT: "success",
  DISCHARGE_SUMMARY: "warning",
  VACCINATION: "default",
};

export function RecordCard({ title, type, uploadedDate, fileSizeBytes, onView, onShare, onDownload }: RecordCardProps) {
  const fileSizeLabel = fileSizeBytes ? `${(fileSizeBytes / 1024 / 1024).toFixed(2)} MB` : "Unknown size";

  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <div className="mb-2 flex items-center justify-between">
          <Badge variant={badgeVariant[type]}>{type.replaceAll("_", " ")}</Badge>
          <p className="text-xs text-vitals-charcoal/60">{uploadedDate}</p>
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <p className="mb-4 text-sm text-vitals-charcoal/70">{fileSizeLabel}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={onView}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>
          <Button variant="outline" onClick={onShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" onClick={onDownload}>
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
