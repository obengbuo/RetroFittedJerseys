"use client";

import { useCartStore, customKey } from "@/app/lib/cart-store";
import Image from "next/image";
import Link from "next/link";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, total, count } =
    useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleCheckout = async () => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  };

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md z-50 flex flex-col
          bg-surface border-l border-border
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-brand" />
            <h2 className="text-lg font-semibold text-cream">
              Cart ({mounted ? count() : 0})
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="text-muted hover:text-cream transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted">
              <ShoppingBag size={48} />
              <p>Your cart is empty</p>
              <button
                onClick={closeCart}
                className="text-brand hover:text-brand-dark text-sm"
              >
                Continue shopping
              </button>
            </div>
          ) : (
            items.map((item) => {
              const key = customKey(item.slug, item.size, item.customization);
              const c = item.customization;
              const addonTotal =
                (c?.name ? 3 : 0) + (c?.number ? 3 : 0) + (c?.patch ? 3 : 0);
              const itemTotal = (item.price + addonTotal) * item.quantity;

              return (
                <div
                  key={key}
                  className="flex gap-3 bg-surface-2 rounded-lg p-3"
                >
                  <div className="relative w-16 h-16 shrink-0 rounded overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-cream font-medium line-clamp-1">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted mt-0.5">Size: {item.size}</p>
                    {c?.name && (
                      <p className="text-xs text-muted">Name: <span className="text-cream uppercase">{c.name}</span> <span className="text-brand">+$3</span></p>
                    )}
                    {c?.number && (
                      <p className="text-xs text-muted">Number: <span className="text-cream">#{c.number}</span> <span className="text-brand">+$3</span></p>
                    )}
                    {c?.patch && (
                      <p className="text-xs text-muted">Patch: <span className="text-cream">{c.patch}</span> <span className="text-brand">+$3</span></p>
                    )}
                    <p className="text-sm text-brand font-semibold mt-1">
                      ${itemTotal.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => removeItem(item.slug, item.size, key)}
                      className="text-muted hover:text-brand transition-colors"
                    >
                      <X size={14} />
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          updateQty(item.slug, item.size, key, item.quantity - 1)
                        }
                        className="w-6 h-6 flex items-center justify-center border border-border rounded text-muted hover:text-cream transition-colors"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="w-6 text-center text-sm text-cream">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQty(item.slug, item.size, key, item.quantity + 1)
                        }
                        className="w-6 h-6 flex items-center justify-center border border-border rounded text-muted hover:text-cream transition-colors"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border p-5 space-y-4">
            <div className="flex items-center justify-between text-cream">
              <span className="text-muted text-sm">Subtotal</span>
              <span className="font-bold text-lg">${total().toFixed(2)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Checkout
            </button>
            <Link
              href="/cart"
              onClick={closeCart}
              className="block text-center text-sm text-muted hover:text-cream transition-colors"
            >
              View full cart
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
