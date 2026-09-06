import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { safeStorage, type Product } from "@/lib/store";
import { convertLink } from "@/lib/linkConverter";

export type CartItem = {
  id: string;
  title: string;
  image: string | null;
  price: number;
  /** Domyślny link do produktu (sklep / agent / QC). */
  url: string;
  /** Linki agentów (nazwa agenta -> link) — do wyboru agenta w koszyku. */
  agent_links?: Record<string, string>;
  store_url?: string;
};

/** Najlepszy dostępny link zakupowy dla produktu. */
export function productLink(p: Product): string {
  const agent = Object.values(p.agent_links ?? {}).find(Boolean);
  return p.store_url || agent || p.qc_url || "";
}

const agentKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Link dla pozycji koszyka u wybranego agenta (null = domyślny link). */
export function cartItemLink(item: CartItem, agentName: string | null): string {
  if (!agentName) return item.url;
  const links = item.agent_links ?? {};
  const want = agentKey(agentName);
  const direct = Object.entries(links).find(([k]) => agentKey(k) === want)?.[1];
  if (direct) return direct;
  // Brak gotowego linku — konwertujemy dowolny inny link źródłowy/agenta.
  const source = item.store_url || Object.values(links).find(Boolean) || item.url;
  if (!source) return "";
  const converted = convertLink(source, agentName);
  return converted !== source ? converted : item.url;
}

const KEY = "pkmr_cart";

const CartContext = createContext<{
  items: CartItem[];
  add: (p: Product) => void;
  remove: (id: string) => void;
  toggle: (p: Product) => void;
  clear: () => void;
  has: (id: string) => boolean;
}>({
  items: [],
  add: () => {},
  remove: () => {},
  toggle: () => {},
  clear: () => {},
  has: () => false,
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const raw = safeStorage.get(KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setItems(parsed as CartItem[]);
    } catch {
      /* ignore */
    }
  }, []);

  const save = (next: CartItem[]) => {
    setItems(next);
    safeStorage.set(KEY, JSON.stringify(next));
  };

  const add = (p: Product) => {
    if (items.some((i) => i.id === p.id)) return;
    save([
      ...items,
      {
        id: p.id,
        title: p.title,
        image: p.image_url,
        price: Number(p.price),
        url: productLink(p),
        agent_links: p.agent_links ?? {},
        store_url: p.store_url ?? "",
      },
    ]);
  };

  const remove = (id: string) => save(items.filter((i) => i.id !== id));
  const toggle = (p: Product) => (items.some((i) => i.id === p.id) ? remove(p.id) : add(p));
  const clear = () => save([]);
  const has = (id: string) => items.some((i) => i.id === id);

  return (
    <CartContext.Provider value={{ items, add, remove, toggle, clear, has }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
