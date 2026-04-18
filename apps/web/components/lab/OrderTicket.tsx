"use client";

import html2canvas from "html2canvas";
import { Download } from "lucide-react";
import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

import { Button } from "@/components/ui/button";

type OrderTicketProps = {
  patientName: string;
  ticketNumber: string;
  totalAmount: number;
  tests: string[];
  qrValue: string;
};

export function OrderTicket({ patientName, ticketNumber, totalAmount, tests, qrValue }: OrderTicketProps) {
  const ref = useRef<HTMLDivElement>(null);

  async function handleDownload() {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, { scale: 2, backgroundColor: "#fff" });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${ticketNumber}.png`;
    link.click();
  }

  return (
    <div className="space-y-4">
      <div ref={ref} className="rounded-2xl border border-dashed border-vitals-charcoal/25 bg-white p-6">
        <p className="font-display text-2xl">
          VIT<span className="text-vitals-teal">als</span> Lab Ticket
        </p>
        <p className="mt-2 text-sm">Patient: {patientName}</p>
        <p className="text-sm">Ticket: {ticketNumber}</p>
        <p className="text-sm">Amount: Rs {totalAmount.toFixed(2)}</p>

        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-vitals-charcoal/75">
          {tests.map((test) => (
            <li key={test}>{test}</li>
          ))}
        </ul>

        <div className="mt-4">
          <QRCodeSVG value={qrValue} size={120} />
        </div>
      </div>

      <Button onClick={handleDownload} variant="outline">
        <Download className="mr-2 h-4 w-4" />
        Download PNG
      </Button>
    </div>
  );
}
