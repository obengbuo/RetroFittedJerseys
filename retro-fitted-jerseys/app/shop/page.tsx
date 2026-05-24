"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { allProducts, getGroups, getDecades, getKitTypes } from "@/app/lib/products";
import ProductCard from "@/app/components/ProductCard";
import { useMemo, Suspense } from "react";
import { X, ChevronDown } from "lucide-react";

// Preferred display order for groups
const GROUP_ORDER = [
  "England", "Spain", "Italy", "Germany", "France",
  "Netherlands", "Portugal", "Scotland", "Turkey", "Belgium",
  "Argentina", "Brazil", "Uruguay", "South America",
  "International / National Teams", "Other",
];

function sortGroups(groups: string[]): string[] {
  return [...groups].sort((a, b) => {
    const ai = GROUP_ORDER.indexOf(a);
    const bi = GROUP_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const group = searchParams.get("group") ?? "";
  const decade = searchParams.get("decade") ?? "";
  const kit = searchParams.get("kit") ?? "";
  const q = searchParams.get("q") ?? "";

  const filtered = useMemo(() => {
    return allProducts
      .filter((p) => {
        if (group && p.group !== group) return false;
        if (decade && p.decade !== decade) return false;
        if (kit && p.kit_type !== kit) return false;
        if (q) {
          const lq = q.toLowerCase();
          if (
            !p.title.toLowerCase().includes(lq) &&
            !p.team.toLowerCase().includes(lq) &&
            !(p.year?.toString() ?? "").includes(lq)
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
  }, [group, decade, kit, q]);

  // When no filter active, group products for display
  const groupedForDisplay = useMemo(() => {
    if (group || decade || kit || q) return null;
    const map: Record<string, typeof allProducts> = {};
    for (const p of filtered) {
      if (!map[p.group]) map[p.group] = [];
      map[p.group].push(p);
    }
    return map;
  }, [filtered, group, decade, kit, q]);

  const groups = sortGroups(getGroups());
  const decades = getDecades();
  const kitTypes = getKitTypes();
  const hasFilters = group || decade || kit || q;

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.push(`/shop?${params.toString()}`);
  }

  function clearAll() { router.push("/shop"); }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-60 shrink-0 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-cream font-bold text-lg">Filters</h2>
            {hasFilters && (
              <button onClick={clearAll} className="text-brand text-xs flex items-center gap-1 hover:text-brand-dark">
                <X size={12} /> Clear all
              </button>
            )}
          </div>

          {/* Search */}
          <div>
            <label className="text-muted text-xs uppercase tracking-wider mb-2 block">Search</label>
            <input
              type="text"
              value={q}
              onChange={(e) => setFilter("q", e.target.value)}
              placeholder="Team, year…"
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-cream placeholder:text-muted focus:outline-none focus:border-brand"
            />
          </div>

          {/* League / Country */}
          <div>
            <label className="text-muted text-xs uppercase tracking-wider mb-2 block">League / Country</label>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {groups.map((g) => (
                <button
                  key={g}
                  onClick={() => setFilter("group", group === g ? "" : g)}
                  className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                    group === g
                      ? "bg-brand text-white"
                      : "text-muted hover:text-cream hover:bg-surface-2"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Decade */}
          <div>
            <label className="text-muted text-xs uppercase tracking-wider mb-2 block">Decade</label>
            <div className="space-y-1">
              {decades.map((d) => (
                <button
                  key={d}
                  onClick={() => setFilter("decade", decade === d ? "" : d)}
                  className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                    decade === d ? "bg-brand text-white" : "text-muted hover:text-cream hover:bg-surface-2"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Kit Type */}
          <div>
            <label className="text-muted text-xs uppercase tracking-wider mb-2 block">Kit Type</label>
            <div className="space-y-1">
              {kitTypes.map((k) => (
                <button
                  key={k}
                  onClick={() => setFilter("kit", kit === k ? "" : k)}
                  className={`w-full text-left px-3 py-1.5 rounded text-sm capitalize transition-colors ${
                    kit === k ? "bg-brand text-white" : "text-muted hover:text-cream hover:bg-surface-2"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1 min-w-0">
          {/* Active chips */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <p className="text-muted text-sm">
              <span className="text-cream font-semibold">{filtered.length}</span> jerseys
              {hasFilters && " found"}
            </p>
            <div className="flex flex-wrap gap-2">
              {group && (
                <span className="flex items-center gap-1 bg-brand/20 text-brand text-xs px-2 py-1 rounded-full">
                  {group} <button onClick={() => setFilter("group", "")}><X size={10} /></button>
                </span>
              )}
              {decade && (
                <span className="flex items-center gap-1 bg-brand/20 text-brand text-xs px-2 py-1 rounded-full">
                  {decade} <button onClick={() => setFilter("decade", "")}><X size={10} /></button>
                </span>
              )}
              {kit && (
                <span className="flex items-center gap-1 bg-brand/20 text-brand text-xs px-2 py-1 rounded-full capitalize">
                  {kit} <button onClick={() => setFilter("kit", "")}><X size={10} /></button>
                </span>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-24 text-muted">
              <p className="text-lg mb-2">No jerseys found</p>
              <button onClick={clearAll} className="text-brand text-sm">Clear filters</button>
            </div>
          ) : groupedForDisplay ? (
            /* Grouped view — default, no filters active */
            <div className="space-y-12">
              {sortGroups(Object.keys(groupedForDisplay)).map((g) => (
                <section key={g}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-cream font-bold text-xl">{g}</h2>
                    <button
                      onClick={() => setFilter("group", g)}
                      className="text-brand text-xs hover:text-brand-dark"
                    >
                      View all {groupedForDisplay[g].length} →
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {groupedForDisplay[g].slice(0, 8).map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            /* Filtered flat view */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-2 rounded w-48" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-surface-2 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
