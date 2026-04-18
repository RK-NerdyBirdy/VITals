"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CalendarBookingProps = {
  onSubmit: (value: { date: string; time: string; symptoms?: string }) => Promise<void> | void;
};

export function CalendarBooking({ onSubmit }: CalendarBookingProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [symptoms, setSymptoms] = useState("");

  return (
    <div className="frosted rounded-2xl p-4">
      <p className="mb-3 font-display text-xl">Specialist Appointment</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <Input
        className="mt-3"
        placeholder="Symptoms (optional)"
        value={symptoms}
        onChange={(e) => setSymptoms(e.target.value)}
      />
      <Button
        className="mt-4"
        onClick={() => onSubmit({ date, time, symptoms: symptoms || undefined })}
        disabled={!date || !time}
      >
        Book Appointment
      </Button>
    </div>
  );
}
