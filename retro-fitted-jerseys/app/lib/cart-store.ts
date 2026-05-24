"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItemCustomization {
  name?: string;      // up to 12 chars
  number?: number;    // 1–99
  patch?: string;     // patch label
}

export interface CartItem {
  slug: string;
  title: string;
  image: string;
  price: number;
  size: string;
  quantity: number;
  customization?: CartItemCustomization;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (slug: string, size: string, customKey: string) => void;
  updateQty: (slug: string, size: string, customKey: string, qty: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  total: () => number;
  count: () => number;
}

/** Stable key for a cart line (slug + size + customization combo) */
export function customKey(slug: string, size: string, c?: CartItemCustomization): string {
  return `${slug}|${size}|${c?.name ?? ""}|${c?.number ?? ""}|${c?.patch ?? ""}`;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) =>
        set((state) => {
          const key = customKey(item.slug, item.size, item.customization);
          const existing = state.items.find(
            (i) => customKey(i.slug, i.size, i.customization) === key
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                customKey(i.slug, i.size, i.customization) === key
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),

      removeItem: (slug, size, key) =>
        set((state) => ({
          items: state.items.filter(
            (i) => customKey(i.slug, i.size, i.customization) !== key
          ),
        })),

      updateQty: (slug, size, key, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter(
                  (i) => customKey(i.slug, i.size, i.customization) !== key
                )
              : state.items.map((i) =>
                  customKey(i.slug, i.size, i.customization) === key
                    ? { ...i, quantity: qty }
                    : i
                ),
        })),

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      total: () =>
        get().items.reduce((sum, i) => {
          const c = i.customization ?? {};
          const addons =
            (c.name ? 3 : 0) + (c.number ? 3 : 0) + (c.patch ? 3 : 0);
          return sum + (i.price + addons) * i.quantity;
        }, 0),

      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "rfj-cart" }
  )
);

export const PATCHES = [
  "UEFA Champions League",
  "UEFA Europa League",
  "FIFA World Cup",
  "UEFA European Championship (Euro)",
  "Copa América",
  "FA Cup",
  "Premier League",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "Ligue 1",
] as const;
