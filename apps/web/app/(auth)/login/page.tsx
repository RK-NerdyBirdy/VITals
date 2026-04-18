"use client";

import { HeartPulse } from "lucide-react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-xl items-center px-4 py-10">
      <section className="frosted w-full rounded-3xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-vitals-crimson text-white">
          <HeartPulse />
        </div>
        <h1 className="font-display text-4xl text-vitals-charcoal">Welcome to VITals</h1>
        <p className="mt-3 text-sm text-vitals-charcoal/75">
          Sign in with your official VIT account to access OPD booking, lab tests, and records.
        </p>
        <Button className="mt-8" size="lg" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
          Continue with Google
        </Button>
      </section>
    </main>
  );
}
