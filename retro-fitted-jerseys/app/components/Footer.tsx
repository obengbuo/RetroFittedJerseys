import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <span className="text-brand font-black text-2xl">RFJ</span>
            </Link>
            <p className="text-muted text-sm leading-relaxed">
              Premium retro football jerseys. Authentic designs from the golden
              eras of the beautiful game.
            </p>
          </div>
          <div>
            <h3 className="text-cream text-sm font-semibold uppercase tracking-wider mb-4">
              Shop
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/shop", label: "All Jerseys" },
                { href: "/shop?decade=1990s", label: "1990s" },
                { href: "/shop?decade=1980s", label: "1980s" },
                { href: "/shop?kit=home", label: "Home Kits" },
                { href: "/shop?kit=away", label: "Away Kits" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-muted hover:text-cream text-sm transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-cream text-sm font-semibold uppercase tracking-wider mb-4">
              Help
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/faq", label: "FAQ" },
                { href: "/shipping", label: "Shipping & Returns" },
                { href: "/about", label: "About Us" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-muted hover:text-cream text-sm transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-cream text-sm font-semibold uppercase tracking-wider mb-4">
              Decades
            </h3>
            <ul className="space-y-2">
              {["1970s", "1980s", "1990s", "2000s", "2010s"].map((d) => (
                <li key={d}>
                  <Link
                    href={`/shop?decade=${d}`}
                    className="text-muted hover:text-cream text-sm transition-colors"
                  >
                    {d}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted text-xs">
            © {new Date().getFullYear()} Retro Fitted Jerseys. All rights
            reserved.
          </p>
          <p className="text-muted text-xs">
            Payments secured by{" "}
            <span className="text-cream">Stripe</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
