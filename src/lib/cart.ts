import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "./products";

export type CartItem = {
  key?: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  optionLabel?: string;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  add: (p: Product) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

export const cartItemKey = (item: Pick<CartItem, "slug" | "optionLabel">) =>
  item.optionLabel ? `${item.slug}:${item.optionLabel}` : item.slug;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      add: (p) =>
        set((s) => {
          const optionLabel = p.selectedOptionLabel;
          const key = cartItemKey({ slug: p.slug, optionLabel });
          const existing = s.items.find((i) => cartItemKey(i) === key);
          const items = existing
            ? s.items.map((i) => (cartItemKey(i) === key ? { ...i, quantity: i.quantity + 1 } : i))
            : [
                ...s.items,
                {
                  key,
                  slug: p.slug,
                  name: p.name,
                  price: p.price,
                  image: p.image,
                  quantity: 1,
                  optionLabel,
                },
              ];
          return { items, isOpen: true };
        }),
      remove: (key) => set((s) => ({ items: s.items.filter((i) => cartItemKey(i) !== key) })),
      setQty: (key, qty) =>
        set((s) => ({
          items: s.items
            .map((i) => (cartItemKey(i) === key ? { ...i, quantity: Math.max(0, qty) } : i))
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
    }),
    { name: "zxg-cart" },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);

export const cartTotal = (items: CartItem[]) => items.reduce((s, i) => s + i.price * i.quantity, 0);

export const SHIPPING_FEE = 10;
