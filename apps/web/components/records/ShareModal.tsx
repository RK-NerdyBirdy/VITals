"use client";

import { QRCodeSVG } from "qrcode.react";

import { Button } from "@/components/ui/button";

type ShareModalProps = {
  open: boolean;
  onClose: () => void;
  shareUrl: string;
};

export function ShareModal({ open, onClose, shareUrl }: ShareModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="font-display text-2xl">Secure Share Link</h3>
        <p className="mt-2 text-sm text-vitals-charcoal/75">This link is time-limited and access-limited.</p>

        <div className="mt-4 flex justify-center">
          <QRCodeSVG value={shareUrl} size={180} />
        </div>

        <div className="mt-4 rounded-xl border border-vitals-charcoal/15 bg-slate-50 p-3 text-xs break-all">
          {shareUrl}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => navigator.clipboard.writeText(shareUrl)}>Copy Link</Button>
        </div>
      </div>
    </div>
  );
}
