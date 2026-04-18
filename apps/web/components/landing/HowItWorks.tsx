"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    title: "Login with VIT Email",
    description: "Use your official VIT student/faculty account to sign in securely.",
  },
  {
    title: "Book or Order",
    description: "Choose OPD slots or lab tests in a guided, mobile-ready flow.",
  },
  {
    title: "Get Your Ticket",
    description: "Receive a QR ticket instantly and show it at reception.",
  },
];

export function HowItWorks() {
  return (
    <section className="mt-24">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-vitals-charcoal/60">How It Works</p>
          <h2 className="font-display text-3xl text-vitals-charcoal md:text-4xl">Three Steps, Zero Friction</h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {STEPS.map((step, idx) => (
          <motion.article
            key={step.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            className="frosted relative rounded-2xl p-6"
          >
            <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-vitals-crimson text-sm font-semibold text-white">
              {idx + 1}
            </span>
            <h3 className="font-display text-2xl">{step.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-vitals-charcoal/75">{step.description}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
