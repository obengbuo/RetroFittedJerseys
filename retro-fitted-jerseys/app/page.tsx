import Image from "next/image";
import Link from "next/link";
import { getFeatured, allProducts, getDecades } from "@/app/lib/products";
import ProductCard from "@/app/components/ProductCard";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  const featured = getFeatured().slice(0, 8);
  const decades = getDecades().filter((d) =>
    ["1970s", "1980s", "1990s", "2000s", "2010s"].includes(d)
  );
  const totalProducts = allProducts.length;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-surface border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-2xl">
            <p className="text-brand text-sm font-semibold uppercase tracking-widest mb-4">
              Classic Football Shirts
            </p>
            <h1 className="text-5xl md:text-7xl font-black text-cream leading-none tracking-tight mb-6">
              The Kit You{" "}
              <span className="text-brand">Remember.</span>
            </h1>
            <p className="text-muted text-lg md:text-xl leading-relaxed mb-10 max-w-xl">
              Over {totalProducts.toLocaleString()} authentic retro jerseys from
              football&apos;s golden eras. Every badge, every colour, every memory.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-semibold px-8 py-4 rounded-lg transition-colors text-lg"
              >
                Shop All Jerseys
                <ArrowRight size={20} />
              </Link>
              <Link
                href="/shop?decade=1990s"
                className="inline-flex items-center gap-2 border border-border hover:border-cream text-cream px-8 py-4 rounded-lg transition-colors text-lg"
              >
                1990s Collection
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative hero image grid */}
        {featured.length >= 4 && (
          <div className="hidden lg:flex absolute right-0 top-0 bottom-0 w-2/5 gap-1 overflow-hidden opacity-25 pointer-events-none select-none">
            <div className="flex flex-col gap-1 w-1/2">
              {featured.slice(0, 2).map((p) => (
                <div key={p.id} className="relative flex-1">
                  <Image src={p.images[0]} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1 w-1/2 mt-8">
              {featured.slice(2, 4).map((p) => (
                <div key={p.id} className="relative flex-1">
                  <Image src={p.images[0]} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Shop by Decade */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-cream mb-8">Shop by Decade</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {decades.map((decade) => (
            <Link
              key={decade}
              href={`/shop?decade=${decade}`}
              className="group aspect-square rounded-xl border border-border hover:border-brand/60 bg-surface-2 flex items-center justify-center transition-all hover:bg-surface"
            >
              <span className="text-cream font-black text-2xl group-hover:text-brand transition-colors">
                {decade}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-cream">Featured Jerseys</h2>
          <Link
            href="/shop"
            className="text-brand hover:text-brand-dark text-sm flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Kit Types */}
      <section className="bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-cream mb-8 text-center">
            Browse by Kit Type
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { kit: "home", label: "Home Kits", desc: "Classic home colours" },
              { kit: "away", label: "Away Kits", desc: "Bold alternative strips" },
              { kit: "goalkeeper", label: "Goalkeeper", desc: "Between the sticks" },
              { kit: "training", label: "Training", desc: "Training day classics" },
            ].map(({ kit, label, desc }) => (
              <Link
                key={kit}
                href={`/shop?kit=${kit}`}
                className="group bg-surface-2 border border-border hover:border-brand/50 rounded-xl p-6 transition-all hover:bg-surface"
              >
                <h3 className="text-cream font-bold mb-1 group-hover:text-brand transition-colors">
                  {label}
                </h3>
                <p className="text-muted text-sm">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            {
              icon: "⚽",
              title: "1,300+ Jerseys",
              desc: "The largest retro catalog online",
            },
            {
              icon: "🔒",
              title: "Secure Checkout",
              desc: "256-bit SSL · Stripe payments",
            },
            {
              icon: "📦",
              title: "Fast Shipping",
              desc: "Worldwide delivery available",
            },
          ].map((item) => (
            <div key={item.title} className="space-y-2">
              <div className="text-4xl">{item.icon}</div>
              <h3 className="text-cream font-bold">{item.title}</h3>
              <p className="text-muted text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
