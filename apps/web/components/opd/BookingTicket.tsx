"use client";

import html2canvas from "html2canvas";
import { Download, Share2 } from "lucide-react";
import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

import { Button } from "@/components/ui/button";

type BookingTicketProps = {
  patientName: string;
  doctorName: string;
  specialty: string;
  dateTimeLabel: string;
  ticketNumber: string;
  qrValue: string;
};

export function BookingTicket(props: BookingTicketProps) {
  const ticketRef = useRef<HTMLDivElement>(null);

  async function downloadAsPng() {
    if (!ticketRef.current) return;

    const canvas = await html2canvas(ticketRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
    });

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `${props.ticketNumber}.png`;
    link.click();
  }

  async function shareTicket() {
    if (!navigator.share) return;
    await navigator.share({
      title: "VITals Booking Ticket",
      text: `Ticket ${props.ticketNumber} for ${props.doctorName}`,
    });
  }

  return (
    <div className="space-y-4">
      <article ref={ticketRef} className="ticket-edge relative overflow-hidden rounded-2xl border border-dashed border-vitals-charcoal/30 bg-white p-6">
        <div className="grid gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <p className="font-display text-2xl text-vitals-charcoal">
              VIT<span className="text-vitals-teal">als</span>
            </p>
            <p className="mt-4 text-sm text-vitals-charcoal/75">Patient: {props.patientName}</p>
            <p className="text-sm text-vitals-charcoal/75">Doctor: {props.doctorName}</p>
            <p className="text-sm text-vitals-charcoal/75">Specialty: {props.specialty}</p>
            <p className="text-sm text-vitals-charcoal/75">Date & Time: {props.dateTimeLabel}</p>
            <p className="mt-3 text-sm font-semibold text-vitals-crimson">Ticket: {props.ticketNumber}</p>
          </div>

          <div className="border-l border-dashed border-vitals-charcoal/25 pl-6">
            <QRCodeSVG value={props.qrValue} size={128} />
            <p className="mt-2 text-xs text-vitals-charcoal/70">Show this at reception</p>
          </div>
        </div>
      </article>

      <div className="flex gap-2">
        <Button onClick={downloadAsPng} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download PNG
        </Button>
        <Button onClick={shareTicket} variant="ghost">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </div>
    </div>
  );
}
