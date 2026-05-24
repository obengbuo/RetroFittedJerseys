"use client";

import { getBySlug, allProducts } from "@/app/lib/products";
import { useCartStore, PATCHES, customKey } from "@/app/lib/cart-store";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useState, use } from "react";
import { ShoppingBag } from "lucide-react";
import ProductCard from "@/app/components/ProductCard";

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  // All hooks unconditionally at the top
  const { addItem, openCart } = useCartStore();
  const [selectedSize, setSelectedSize] = useState("");
  const [mainImage, setMainImage] = useState(0);
  const [added, setAdded] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customNumber, setCustomNumber] = useState("");
  const [customPatch, setCustomPatch] = useState("");

  const product = getBySlug(slug);
  if (!product) notFound();
  const p = product!;

  const related = allProducts
    .filter(
      (x) =>
        x.slug !== p.slug &&
        (x.decade === p.decade || x.team === p.team) &&
        x.images.length > 0
    )
    .slice(0, 4);

  const addons = {
    ...(customName.trim() ? { name: customName.trim() } : {}),
    ...(customNumber && Number(customNumber) >= 1 && Number(customNumber) <= 99
      ? { number: Number(customNumber) }
      : {}),
    ...(customPatch ? { patch: customPatch } : {}),
  };
  const addonCount = Object.keys(addons).length;
  const addonTotal = addonCount * 3;
  const lineTotal = p.price_usd + addonTotal;

  function handleAddToCart() {
    if (!selectedSize) return;
    addItem({
      slug: p.slug,
      title: p.title,
      image: p.images[0],
      price: p.price_usd,
      size: selectedSize,
      customization: addonCount > 0 ? addons : undefined,
    });
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 2000);
  }

  const discount = Math.round(
    ((p.compare_at_price_usd - p.price_usd) / p.compare_at_price_usd) * 100
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted mb-6 flex-wrap">
        <Link href="/" className="hover:text-cream transition-colors">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-cream transition-colors">Shop</Link>
        <span>/</span>
        <Link
          href={`/shop?group=${encodeURIComponent(p.group)}`}
          className="hover:text-cream transition-colors"
        >
          {p.group}
        </Link>
        <span>/</span>
        <span className="text-cream line-clamp-1">{p.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Image gallery */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-surface-2">
            <Image
              src={p.images[mainImage] ?? p.images[0]}
              alt={p.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-brand text-white text-sm font-bold px-3 py-1 rounded-full">
                -{discount}%
              </span>
            )}
          </div>
          {p.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {p.images.slice(0, 10).map((img, i) => (
                <button
                  key={i}
                  onClick={() => setMainImage(i)}
                  className={`relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                    mainImage === i ? "border-brand" : "border-border hover:border-muted"
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Link
              href={`/shop?group=${encodeURIComponent(p.group)}`}
              className="text-brand text-xs font-semibold uppercase tracking-wider hover:text-brand-dark"
            >
              {p.group}
            </Link>
            {p.decade && <><span className="text-border">·</span><span className="text-muted text-xs">{p.decade}</span></>}
            <span className="text-border">·</span>
            <span className="text-muted text-xs capitalize">{p.kit_type}</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-cream mb-4 leading-tight">{p.title}</h1>

          {/* Pricing */}
          <div className="flex items-baseline gap-3 mb-6 flex-wrap">
            <span className="text-3xl font-black text-cream">${lineTotal.toFixed(2)}</span>
            {addonTotal > 0 && (
              <span className="text-muted text-sm">
                (${p.price_usd.toFixed(2)} + ${addonTotal.toFixed(2)} customization)
              </span>
            )}
            <span className="text-muted line-through text-lg">${p.compare_at_price_usd.toFixed(2)}</span>
            {discount > 0 && (
              <span className="bg-brand/20 text-brand text-sm font-semibold px-2 py-0.5 rounded">
                Save {discount}%
              </span>
            )}
          </div>

          {/* Size selector */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-cream text-sm font-medium">Size</label>
              {!selectedSize && <span className="text-brand text-xs">Select a size</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {p.available_sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    selectedSize === size
                      ? "bg-brand border-brand text-white"
                      : "border-border text-muted hover:border-cream hover:text-cream"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* ── Customization ── */}
          <div className="mb-6 space-y-4 border border-border rounded-xl p-4 bg-surface-2">
            <div className="flex items-center justify-between">
              <h3 className="text-cream font-semibold text-sm">Customisation <span className="text-muted font-normal">(optional)</span></h3>
              <span className="text-muted text-xs">Each add-on +$3.00</span>
            </div>

            {/* Name */}
            <div>
              <label className="text-muted text-xs uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Name on back</span>
                {customName && <span className="text-brand font-semibold">+$3.00</span>}
              </label>
              <input
                type="text"
                value={customName}
                maxLength={12}
                onChange={(e) => setCustomName(e.target.value.replace(/[^a-zA-Z0-9 ]/g, ""))}
                placeholder="e.g. HENRY  (max 12 chars)"
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-cream placeholder:text-muted focus:outline-none focus:border-brand uppercase"
              />
              <p className="text-muted text-xs mt-1">{customName.length}/12 characters</p>
            </div>

            {/* Number */}
            <div>
              <label className="text-muted text-xs uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Number on back</span>
                {customNumber && Number(customNumber) >= 1 && Number(customNumber) <= 99 && (
                  <span className="text-brand font-semibold">+$3.00</span>
                )}
              </label>
              <input
                type="number"
                value={customNumber}
                min={1}
                max={99}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "" || (Number(v) >= 1 && Number(v) <= 99)) setCustomNumber(v);
                }}
                placeholder="1 – 99"
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-cream placeholder:text-muted focus:outline-none focus:border-brand"
              />
            </div>

            {/* Patch */}
            <div>
              <label className="text-muted text-xs uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>League / tournament patch</span>
                {customPatch && <span className="text-brand font-semibold">+$3.00</span>}
              </label>
              <select
                value={customPatch}
                onChange={(e) => setCustomPatch(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-brand"
              >
                <option value="">No patch</option>
                {PATCHES.map((patch) => (
                  <option key={patch} value={patch}>{patch}</option>
                ))}
              </select>
            </div>

            {/* Summary */}
            {addonCount > 0 && (
              <div className="border-t border-border pt-3 text-xs text-muted space-y-1">
                {customName.trim() && <p>✓ Name: <span className="text-cream uppercase">{customName.trim()}</span> — $3.00</p>}
                {customNumber && Number(customNumber) >= 1 && Number(customNumber) <= 99 && (
                  <p>✓ Number: <span className="text-cream">#{customNumber}</span> — $3.00</p>
                )}
                {customPatch && <p>✓ Patch: <span className="text-cream">{customPatch}</span> — $3.00</p>}
              </div>
            )}
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={!selectedSize}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all ${
              !selectedSize
                ? "bg-surface-2 text-muted cursor-not-allowed"
                : added
                  ? "bg-green-600 text-white cursor-default"
                  : "bg-brand hover:bg-brand-dark text-white"
            }`}
          >
            <ShoppingBag size={20} />
            {added ? "Added to cart!" : `Add to Cart — $${lineTotal.toFixed(2)}`}
          </button>

          {/* Details */}
          <div className="mt-8 pt-8 border-t border-border space-y-6">
            <div>
              <h3 className="text-cream font-semibold mb-2">Description</h3>
              <p className="text-muted text-sm leading-relaxed">{p.description}</p>
            </div>
            <div>
              <h3 className="text-cream font-semibold mb-2">Authenticity &amp; Quality</h3>
              <ul className="text-muted text-sm space-y-1">
                <li>✓ Period-correct design faithful to the original</li>
                <li>✓ Premium quality polyester construction</li>
                <li>✓ Authentic embroidered crest and details</li>
                <li>✓ Available in sizes S through XXL</li>
              </ul>
            </div>
            <div>
              <h3 className="text-cream font-semibold mb-2">Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  { label: "Year", value: String(p.year ?? "Unknown") },
                  { label: "Team", value: p.team },
                  { label: "Kit Type", value: p.kit_type },
                  { label: "Sleeve", value: p.sleeve },
                  { label: "Group", value: p.group },
                  { label: "Decade", value: p.decade ?? "—" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <span className="text-muted">{label}:</span>{" "}
                    <span className="text-cream capitalize">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="text-xl font-bold text-cream mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((x) => (
              <ProductCard key={x.id} product={x} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
