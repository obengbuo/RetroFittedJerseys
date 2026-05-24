import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/app/lib/products";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="bg-surface rounded-xl overflow-hidden border border-border hover:border-brand/50 transition-all duration-200 hover:shadow-lg hover:shadow-brand/5">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-surface-2">
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Decade badge */}
          {product.decade && (
            <span className="absolute top-2 left-2 bg-black/70 text-cream text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
              {product.decade}
            </span>
          )}
          {/* Kit type badge */}
          <span className="absolute top-2 right-2 bg-brand/90 text-white text-xs px-2 py-0.5 rounded-full uppercase tracking-wide">
            {product.kit_type}
          </span>
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-muted text-xs mb-1">{product.team}</p>
          <h3 className="text-cream text-sm font-medium line-clamp-2 leading-snug group-hover:text-white transition-colors">
            {product.title}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-cream font-bold">
              ${product.price_usd.toFixed(2)}
            </span>
            <span className="text-muted text-xs line-through">
              ${product.compare_at_price_usd.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
