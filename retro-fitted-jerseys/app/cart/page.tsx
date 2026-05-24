"use client";

import { useCartStore, customKey } from "@/app/lib/cart-store";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X, ShoppingBag, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

export default function CartPage() {
  const { items, removeItem, updateQty, clearCart, total, count } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleCheckout = async () => {
    setLoading(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const { url, error } = await res.json();
    if (url) {
      window.location.href = url;
    } else {
      console.error(error);
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const cartCount = count();
  const cartTotal = total();

  if (cartCount === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <ShoppingBag size={64} className="text-muted mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-cream mb-3">Your cart is empty</h1>
        <p className="text-muted mb-8">Add some retro jerseys to get started.</p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-semibold px-8 py-4 rounded-lg transition-colors"
        >
          Shop All Jerseys <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-cream mb-8">
        Your Cart ({cartCount} {cartCount === 1 ? "item" : "items"})
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const key = customKey(item.slug, item.size, item.customization);
            const c = item.customization;
            const addonTotal =
              (c?.name ? 3 : 0) + (c?.number ? 3 : 0) + (c?.patch ? 3 : 0);
            const unitTotal = item.price + addonTotal;

            return (
              <div
                key={key}
                className="flex gap-4 bg-surface rounded-xl border border-border p-4"
              >
                <Link href={`/product/${item.slug}`} className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </Link>

                <div className="flex-1 min-w-0">
                  <Link href={`/product/${item.slug}`}>
                    <h3 className="text-cream text-sm font-medium hover:text-brand transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                  </Link>
                  <p className="text-muted text-xs mt-1">Size: {item.size}</p>

                  {/* Customization details */}
                  {(c?.name || c?.number || c?.patch) && (
                    <div className="mt-1.5 space-y-0.5">
                      {c?.name && (
                        <p className="text-xs text-muted">
                          Name: <span className="text-cream uppercase">{c.name}</span>
                          <span className="text-brand ml-1">+$3.00</span>
                        </p>
                      )}
                      {c?.number && (
                        <p className="text-xs text-muted">
                          Number: <span className="text-cream">#{c.number}</span>
                          <span className="text-brand ml-1">+$3.00</span>
                        </p>
                      )}
                      {c?.patch && (
                        <p className="text-xs text-muted">
                          Patch: <span className="text-cream">{c.patch}</span>
                          <span className="text-brand ml-1">+$3.00</span>
                        </p>
                      )}
                    </div>
                  )}

                  <p className="text-brand font-bold mt-2">
                    ${(unitTotal * item.quantity).toFixed(2)}
                    {item.quantity > 1 && (
                      <span className="text-muted font-normal text-xs ml-1">
                        (${unitTotal.toFixed(2)} each)
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <button
                    onClick={() => removeItem(item.slug, item.size, key)}
                    className="text-muted hover:text-brand transition-colors"
                  >
                    <X size={16} />
                  </button>
                  <div className="flex items-center gap-1 border border-border rounded-lg">
                    <button
                      onClick={() => updateQty(item.slug, item.size, key, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-muted hover:text-cream transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-8 text-center text-sm text-cream">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.slug, item.size, key, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-muted hover:text-cream transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <button
            onClick={clearCart}
            className="text-muted hover:text-brand text-xs transition-colors mt-2"
          >
            Clear cart
          </button>
        </div>

        {/* Order summary */}
        <div className="bg-surface rounded-xl border border-border p-6 h-fit space-y-4">
          <h2 className="text-cream font-bold text-lg">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted">
              <span>Subtotal ({cartCount} items)</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
          </div>
          <div className="border-t border-border pt-4 flex justify-between text-cream font-bold">
            <span>Total</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-semibold py-4 rounded-lg transition-colors"
          >
            {loading ? "Redirecting…" : "Proceed to Checkout"}
            {!loading && <ArrowRight size={18} />}
          </button>
          <Link
            href="/shop"
            className="block text-center text-muted hover:text-cream text-sm transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
