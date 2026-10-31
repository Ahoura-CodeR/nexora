import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { CartItem, Product } from "../types";

type CartContextValue = { items: CartItem[]; count: number; totalCents: number; add: (product: Product) => void; remove: (productId: string) => void; setQuantity: (productId: string, quantity: number) => void; clear: () => void };
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem("nexora-cart") ?? "[]") as CartItem[]; } catch { return []; }
  });
  const update = (next: CartItem[]) => { setItems(next); localStorage.setItem("nexora-cart", JSON.stringify(next)); };
  const value = useMemo<CartContextValue>(() => ({
    items, count: items.reduce((sum, item) => sum + item.quantity, 0), totalCents: items.reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0),
    add: (product) => { const found = items.find((item) => item.product.id === product.id); update(found ? items.map((item) => item.product.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, Math.max(1, product.stock)) } : item) : [...items, { product, quantity: 1 }]); },
    remove: (productId) => update(items.filter((item) => item.product.id !== productId)),
    setQuantity: (productId, quantity) => update(items.map((item) => item.product.id === productId ? { ...item, quantity: Math.min(Math.max(1, quantity), item.product.stock) } : item)),
    clear: () => update([])
  }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() { const value = useContext(CartContext); if (!value) throw new Error("useCart must be used inside CartProvider"); return value; }
