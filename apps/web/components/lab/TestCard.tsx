"use client";

import { motion } from "framer-motion";
import { Clock3 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCartStore } from "@/lib/store";

type TestCardProps = {
  id: string;
  name: string;
  category: string;
  preparation?: string | null;
  turnaroundHours: number;
  price: number;
  isProfile: boolean;
  includedTests?: string[];
};

export function TestCard({
  id,
  name,
  category,
  preparation,
  turnaroundHours,
  price,
  isProfile,
  includedTests = [],
}: TestCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const contains = useCartStore((state) => state.contains);
  const inCart = contains(id);
  const [open, setOpen] = useState(false);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="mb-3 flex items-center justify-between">
          <Badge variant="info">{category}</Badge>
          {isProfile ? <Badge variant="warning">Profile</Badge> : null}
        </div>
        <CardTitle>{name}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {preparation ? <p className="text-sm text-vitals-charcoal/70">{preparation}</p> : null}

        <div className="flex items-center gap-2 text-sm text-vitals-charcoal/65">
          <Clock3 className="h-4 w-4" />
          {turnaroundHours}h turnaround
        </div>

        {isProfile && includedTests.length > 0 ? (
          <div className="rounded-xl border border-vitals-charcoal/15 bg-white/60 p-3 text-sm">
            <button className="font-medium" onClick={() => setOpen((state) => !state)}>
              {open ? "Hide included tests" : "Show included tests"}
            </button>
            {open ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-vitals-charcoal/70">
                {includedTests.map((test) => (
                  <li key={test}>{test}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <p className="font-display text-2xl text-vitals-crimson">Rs {price.toFixed(2)}</p>
          <motion.div whileTap={{ scale: 0.92 }}>
            <Button
              variant={inCart ? "ghost" : "default"}
              onClick={() => (inCart ? removeItem(id) : addItem({ id, name, price, isProfile }))}
            >
              {inCart ? "Remove" : "Add to Cart"}
            </Button>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
