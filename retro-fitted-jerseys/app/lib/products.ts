import productsData from "@/app/data/products.json";

export interface Product {
  id: string;
  slug: string;
  album_id: string;
  title: string;
  year: number | null;
  decade: string | null;
  team: string;
  league_or_country: string;
  group: string;
  kit_type: string;
  sleeve: string;
  price_usd: number;
  compare_at_price_usd: number;
  in_stock: boolean;
  available_sizes: string[];
  description: string;
  images: string[];
  featured: boolean;
  tags: string[];
}

export const allProducts: Product[] = productsData as Product[];

export function getFeatured(): Product[] {
  return allProducts.filter((p) => p.featured);
}

export function getBySlug(slug: string): Product | undefined {
  return allProducts.find((p) => p.slug === slug);
}

export function getGroups(): string[] {
  const s = new Set(allProducts.map((p) => p.group));
  return Array.from(s).sort();
}

export function getDecades(): string[] {
  const s = new Set(allProducts.map((p) => p.decade).filter(Boolean) as string[]);
  return Array.from(s).sort();
}

export function getKitTypes(): string[] {
  return ["home", "away", "third", "goalkeeper", "training"];
}

// Products sorted alphabetically within each year group
export function getGroupedProducts(): Record<string, Product[]> {
  const grouped: Record<string, Product[]> = {};
  for (const p of allProducts) {
    if (!grouped[p.group]) grouped[p.group] = [];
    grouped[p.group].push(p);
  }
  // Within each group: sort by year asc, then title alpha
  for (const g of Object.keys(grouped)) {
    grouped[g].sort((a, b) => {
      const yearDiff = (a.year ?? 0) - (b.year ?? 0);
      if (yearDiff !== 0) return yearDiff;
      return a.title.localeCompare(b.title);
    });
  }
  return grouped;
}

export interface Filters {
  group?: string;
  decade?: string;
  kit?: string;
  q?: string;
}

export function filterProducts(filters: Filters): Product[] {
  return allProducts
    .filter((p) => {
      if (filters.group && p.group !== filters.group) return false;
      if (filters.decade && p.decade !== filters.decade) return false;
      if (filters.kit && p.kit_type !== filters.kit) return false;
      if (filters.q) {
        const q = filters.q.toLowerCase();
        if (
          !p.title.toLowerCase().includes(q) &&
          !p.team.toLowerCase().includes(q) &&
          !(p.year?.toString() ?? "").includes(q)
        )
          return false;
      }
      return true;
    })
    .sort((a, b) => {
      const yearDiff = (a.year ?? 0) - (b.year ?? 0);
      if (yearDiff !== 0) return yearDiff;
      return a.title.localeCompare(b.title);
    });
}
