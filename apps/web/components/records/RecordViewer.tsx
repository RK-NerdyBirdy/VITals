type RecordViewerProps = {
  url: string;
  mimeType?: string;
};

export function RecordViewer({ url, mimeType }: RecordViewerProps) {
  if (mimeType?.startsWith("image/")) {
    return (
      <div className="overflow-hidden rounded-2xl border border-vitals-charcoal/15 bg-white p-2">
        <img src={url} alt="Medical record" className="max-h-[70vh] w-full rounded-xl object-contain" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-vitals-charcoal/15 bg-white">
      <iframe src={url} className="h-[70vh] w-full" title="Record viewer" />
    </div>
  );
}
