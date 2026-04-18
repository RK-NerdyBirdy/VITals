"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

function CountUp({ to }: { to: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const duration = 1000;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.floor(progress * to));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to]);

  return <span>{value.toLocaleString()}</span>;
}

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-[2.25rem] border border-white/70 bg-white/70 px-6 py-16 shadow-ticket backdrop-blur-xl md:px-12 md:py-24">
      <div className="aurora" />
      <div className="grain" />

      <div className="relative mx-auto max-w-5xl">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-5 inline-flex rounded-full border border-vitals-crimson/20 bg-vitals-crimson/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-vitals-crimson"
        >
          VIT Health Centre Platform
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display text-4xl leading-tight text-vitals-charcoal md:text-6xl"
        >
          Your Campus Health, Simplified.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.22 }}
          className="mt-6 max-w-2xl text-base text-vitals-charcoal/80 md:text-lg"
        >
          Book OPD appointments, order lab tests, and access your medical records all in one secure hub
          made for VIT students and faculty.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.34 }}
          className="mt-9 flex flex-wrap items-center gap-3"
        >
          <Link href="/login">
            <Button size="lg">Login with Google</Button>
          </Link>
          <Link href="/dashboard/opd">
            <Button variant="outline" size="lg">Book Appointment</Button>
          </Link>
          <Link href="/dashboard/lab">
            <Button variant="ghost" size="lg">
              Browse Tests
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="mt-12 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3"
        >
          <div className="frosted rounded-xl px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-widest text-vitals-charcoal/60">Doctors</p>
            <p className="font-display text-2xl text-vitals-crimson">
              <CountUp to={36} />+
            </p>
          </div>
          <div className="frosted rounded-xl px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-widest text-vitals-charcoal/60">Lab Tests</p>
            <p className="font-display text-2xl text-vitals-crimson">
              <CountUp to={72} />+
            </p>
          </div>
          <div className="frosted rounded-xl px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-widest text-vitals-charcoal/60">Students Served</p>
            <p className="font-display text-2xl text-vitals-crimson">
              <CountUp to={5200} />+
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
