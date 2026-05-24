"use client";

import Link from "next/link";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useCartStore } from "@/app/lib/cart-store";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { count, openCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const cartCount = mounted ? count() : 0;

  return (
    <nav className="sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-brand font-black text-xl tracking-tight">RFJ</span>
            <span className="hidden sm:block text-cream text-sm font-medium tracking-wide uppercase">
              Retro Fitted Jerseys
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/shop" className="text-muted hover:text-cream text-sm tracking-wide transition-colors">
              Shop
            </Link>
            <Link href="/shop?decade=1990s" className="text-muted hover:text-cream text-sm tracking-wide transition-colors">
              1990s
            </Link>
            <Link href="/shop?decade=1980s" className="text-muted hover:text-cream text-sm tracking-wide transition-colors">
              1980s
            </Link>
            <Link href="/about" className="text-muted hover:text-cream text-sm tracking-wide transition-colors">
              About
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button
              onClick={openCart}
              className="relative p-2 text-muted hover:text-cream transition-colors"
              aria-label="Open cart"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-muted hover:text-cream transition-colors"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-surface">
          <div className="px-4 py-4 space-y-3">
            {[
              { href: "/shop", label: "All Jerseys" },
              { href: "/shop?decade=1990s", label: "1990s" },
              { href: "/shop?decade=1980s", label: "1980s" },
              { href: "/shop?kit=home", label: "Home Kits" },
              { href: "/shop?kit=away", label: "Away Kits" },
              { href: "/about", label: "About" },
              { href: "/faq", label: "FAQ" },
              { href: "/shipping", label: "Shipping & Returns" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block text-muted hover:text-cream text-sm py-1 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
