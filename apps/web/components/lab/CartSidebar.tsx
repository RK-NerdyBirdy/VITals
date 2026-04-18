"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";

type CartSidebarProps = {
  open: boolean;
  onClose: () => void;
  onCheckout?: () => void;
};

export function CartSidebar({ open, onClose, onCheckout }: CartSidebarProps) {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const total = useCartStore((state) => state.total);

  return (
    <aside
      className={`fixed right-0 top-0 z-40 h-full w-full max-w-md border-l border-vitals-charcoal/10 bg-white p-5 shadow-2xl transition-transform duration-300 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-display text-2xl">Cart</h3>
        <button onClick={onClose} aria-label="Close cart">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-vitals-charcoal/70">No tests selected.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-xl border border-vitals-charcoal/10 p-3">
              <p className="font-medium">{item.name}</p>
              <div className="mt-2 flex items-center justify-between text-sm">
                <p>Rs {item.price.toFixed(2)}</p>
                <button className="text-vitals-crimson" onClick={() => removeItem(item.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 border-t border-vitals-charcoal/10 pt-4">
        <div className="mb-4 flex items-center justify-between text-sm">
          <span>Total</span>
          <span className="font-display text-xl text-vitals-crimson">Rs {total().toFixed(2)}</span>
        </div>
        <Button type="button" disabled={items.length === 0 || !onCheckout} onClick={onCheckout} className="w-full">
          Proceed to Checkout
        </Button>
      </div>
    </aside>
  );
}
