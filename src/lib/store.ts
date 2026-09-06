import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getPanelToken } from "@/lib/panelToken";
import { uploadImage, getShippingRates } from "@/lib/secure.functions";
import { withMyRef } from "@/lib/linkConverter";

export type Agent = {
  id: string;
  name: string;
  avatar_url: string | null;
  referral_url: string;
  sort_order: number;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type Product = {
  id: string;
  title: string;
  category: string;
  price: number;
  image_url: string | null;
  qc_url: string | null;
  quality: string;
  views: number;
  /** Produkt sprzedawcy widoczny także na stronie głównej. */
  show_on_home: boolean;
  agent_links: Record<string, string>;
  sizes: string[];
  images: string[];
  /** Zdjęcia QC z magazynu agenta. */
  qc_images: string[];
  seller_id?: string | null;
  batch: string;
  display_order: number;
  tiktok_url: string | null;
  price_cny: number;
  promoted: boolean;
  /** Girl Zone — produkt oznaczony jako damski. */
  for_women: boolean;
  /** Produkt zweryfikowany — plakietka na karcie. */
  verified: boolean;
  store_url: string;
  store_name: string;
};

export type Promo = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  link_url: string;
  sort_order: number;
};

export type SocialLink = {
  id: string;
  label: string;
  url: string;
  icon: string;
  image_url: string | null;
  sort_order: number;
};

export type ShippingRate = {
  id: string;
  agent_name: string;
  line_name: string;
  base_price: number;
  price_per_kg: number;
  min_weight: number;
  max_weight: number;
  sort_order: number;
  /** Optional per-weight price map, e.g. { "0.5": 45, "1": 60, "1.5": 78 }. */
  price_table: Record<string, number>;
  /** Zniżka kuponowa w procentach (0–100) — używana w trybie „z kuponami”. */
  discount_percent: number;
  /** Nazwa / kod kuponu pokazywany użytkownikowi. */
  coupon_code: string;
  /** Link rejestracyjny (ref) agenta — kafelek w kalkulatorze prowadzi tutaj. */
  signup_url: string;
};



/** Fixed conversion rates used across the catalog. */
export const CNY_TO_PLN = 0.552421;
export const PLN_TO_USD = 0.25;

export function plnFromCny(cny: number) {
  return cny * CNY_TO_PLN;
}
export function cnyFromPln(pln: number) {
  return pln / CNY_TO_PLN;
}
export function usdFromPln(pln: number) {
  return pln * PLN_TO_USD;
}
/** "123.00 PLN" style formatting helper. */
export function money(value: number, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits) : "0.00";
}

export type Seller = {
  id: string;
  name: string;
  slug: string;
  username?: string;
  logo_url: string | null;
  banner_url: string | null;
  description: string;
  active: boolean;
  external_url: string;
  /** "agents" = pokazuj linki agentów, "external" = tylko zewnętrzny sklep / Yupoo. */
  link_mode: string;
};

export type GuideStep = {
  id: string;
  step_number: number;
  title: string;
  description: string;
  image_url: string | null;
};

export type Settings = Record<string, string>;

const SELLER_COLUMNS =
  "id, name, slug, logo_url, banner_url, description, active, external_url, link_mode";

export const useSellers = () =>
  useQuery({
    queryKey: ["sellers"],
    queryFn: async () => {
      const { LOCAL_SELLERS_PUBLIC } = await import("@/data/local-sellers");
      const { data, error } = await supabase
        .from("sellers")
        .select(SELLER_COLUMNS)
        .order("name")
        .then((r) => r, () => ({ data: null, error: new Error("offline") }));
      const remote = error ? [] : ((data ?? []) as Seller[]);
      // Konta lokalne uzupełniają listę z bazy (te same id nie są duplikowane).
      const merged = [...remote];
      for (const s of LOCAL_SELLERS_PUBLIC) if (!merged.some((r) => r.id === s.id)) merged.push(s);
      return merged;
    },
  });

/** Upload files through the server (bucket has no public write access) and return signed URLs. */
export async function uploadImages(files: File[], folder = "uploads"): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop() || "jpg";
    const buf = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    for (let i = 0; i < buf.length; i += 0x8000) {
      binary += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    }
    const { url } = await uploadImage({
      data: {
        token: getPanelToken(),
        folder,
        ext,
        contentType: file.type || "image/jpeg",
        base64: btoa(binary),
      },
    });
    urls.push(url);
  }
  return urls;
}



/** Klucz porównawczy nazwy agenta — usuwa różnice w wielkości liter i znakach. */
const agentKey = (name: string) => name.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

export const useAgents = () =>
  useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agents").select("*").order("sort_order");
      if (error) throw error;
      // Baza mogła zebrać duplikaty tego samego agenta — pokazujemy każdego raz.
      const seen = new Set<string>();
      const unique: Agent[] = [];
      for (const a of (data ?? []) as Agent[]) {
        const key = agentKey(a.name);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        // Wszystkie linki rejestracyjne zawsze z moim refem.
        unique.push({ ...a, referral_url: withMyRef(a.referral_url) });
      }
      return unique;
    },
  });


/** Surowa lista agentów (z duplikatami) — tylko do zarządzania w panelu admina. */
export const useAgentsRaw = () =>
  useQuery({
    queryKey: ["agents_raw"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agents").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Agent[];
    },
  });

export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });

export const useProducts = () =>
  useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((p) => {
        const main = p.image_url ?? null;
        // Galeria bywa zduplikowana (to samo zdjęcie kilka razy / kopia głównego).
        const extra = Array.from(new Set(((p.images ?? []) as string[]).filter(Boolean))).filter(
          (u) => u !== main,
        );
        return {
          ...p,
          image_url: main,
          // Linki "kup przez agenta" zawsze z moim refem.
          agent_links: Object.fromEntries(
            Object.entries((p.agent_links ?? {}) as Record<string, string>).map(([k, v]) => [
              k,
              withMyRef(v),
            ]),
          ),
          sizes: Array.from(new Set(((p.sizes ?? []) as string[]).filter(Boolean))),
          images: extra,
          batch: p.batch ?? "",
          display_order: p.display_order ?? 0,
          price_cny: Number(p.price_cny ?? 0),
          promoted: Boolean(p.promoted),
          for_women: Boolean((p as { for_women?: boolean }).for_women),
          verified: Boolean((p as { verified?: boolean }).verified),
          show_on_home: Boolean((p as { show_on_home?: boolean }).show_on_home),
          store_url: p.store_url ?? "",
          store_name: p.store_name ?? "",
        };
      }) as Product[];

    },
  });

export const useGuideSteps = () =>
  useQuery({
    queryKey: ["guide_steps"],
    queryFn: async () => {
      const { data, error } = await supabase.from("guide_steps").select("*").order("step_number");
      if (error) throw error;
      return (data ?? []) as GuideStep[];
    },
  });

export const useSettings = () =>
  useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*");
      if (error) throw error;
      const out: Settings = {};
      for (const row of data ?? []) out[row.key] = row.value;
      return out;
    },
  });

export function useRefresh() {
  const qc = useQueryClient();
  return (key: string) => qc.invalidateQueries({ queryKey: [key] });
}

export async function saveSetting(key: string, value: string) {
  const { panelDb } = await import("@/lib/panelDb");
  const { error } = await panelDb.from("settings").upsert({ key, value });
  if (error) throw new Error(error);
}

/** Parse a comma-separated string into a clean list of values. */
export function parseList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Safari/iOS private mode can throw on storage access — never let that crash the app. */
export const safeStorage = {
  get(key: string): string | null {
    try {
      return globalThis.sessionStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      globalThis.sessionStorage?.setItem(key, value);
    } catch {
      /* ignore */
    }
  },
  remove(key: string) {
    try {
      globalThis.sessionStorage?.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

/** SHA-256 hex digest with a pure-JS fallback for non-secure WebKit contexts. */
export async function sha256Hex(text: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    const buf = await subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return jsSha256(text);
}

function jsSha256(text: string): string {
  const K = new Uint32Array(64);
  const H = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const isPrime = (n: number) => {
    for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
    return true;
  };
  for (let n = 2, i = 0; i < 64; n++) {
    if (!isPrime(n)) continue;
    K[i++] = Math.floor((Math.cbrt(n) % 1) * 2 ** 32) >>> 0;
  }

  const input = new TextEncoder().encode(text);
  const bitLen = input.length * 8;
  const padded = new Uint8Array(Math.ceil((input.length + 9) / 64) * 64);
  padded.set(input);
  padded[input.length] = 0x80;
  for (let i = 0; i < 8; i++) {
    padded[padded.length - 1 - i] = Math.floor(bitLen / 2 ** (8 * i)) & 0xff;
  }

  const w = new Uint32Array(64);
  const rr = (x: number, n: number) => ((x >>> n) | (x << (32 - n))) >>> 0;

  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] =
        ((padded[off + i * 4]! << 24) |
          (padded[off + i * 4 + 1]! << 16) |
          (padded[off + i * 4 + 2]! << 8) |
          padded[off + i * 4 + 3]!) >>>
        0;
    }
    for (let i = 16; i < 64; i++) {
      const x = w[i - 15]!;
      const y = w[i - 2]!;
      const s0 = rr(x, 7) ^ rr(x, 18) ^ (x >>> 3);
      const s1 = rr(y, 17) ^ rr(y, 19) ^ (y >>> 10);
      w[i] = (w[i - 16]! + s0 + w[i - 7]! + s1) >>> 0;
    }

    let a = H[0]!, b = H[1]!, c = H[2]!, d = H[3]!;
    let e = H[4]!, f = H[5]!, g = H[6]!, h = H[7]!;

    for (let i = 0; i < 64; i++) {
      const S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i]! + w[i]!) >>> 0;
      const S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }

    const vals = [a, b, c, d, e, f, g, h];
    for (let i = 0; i < 8; i++) H[i] = (H[i]! + vals[i]!) >>> 0;
  }

  return Array.from(H)
    .map((x) => (x >>> 0).toString(16).padStart(8, "0"))
    .join("");
}


export const usePromos = () =>
  useQuery({
    queryKey: ["promos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("promos").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Promo[];
    },
  });

export const useSocialLinks = () =>
  useQuery({
    queryKey: ["social_links"],
    queryFn: async () => {
      const { data, error } = await supabase.from("social_links").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as SocialLink[];
    },
  });

export const useShippingRates = () =>
  useQuery({
    queryKey: ["shipping_rates"],
    queryFn: async () => {
      const { LOCAL_SHIPPING_RATES } = await import("@/data/localShipping");
      let data: any[] = [];
      try {
        const res = (await getShippingRates()) as any;
        if (Array.isArray(res)) data = res;
      } catch {
        data = [];
      }
      // Hosting bez działających funkcji serwerowych (np. Vercel) — cennik z kodu.
      if (!data.length) data = LOCAL_SHIPPING_RATES as any[];
      return (data ?? []).map((r) => ({

        ...r,
        base_price: Number(r.base_price),
        price_per_kg: Number(r.price_per_kg),
        min_weight: Number(r.min_weight),
        max_weight: Number(r.max_weight),
        price_table: (r.price_table ?? {}) as Record<string, number>,
        discount_percent: Number(r.discount_percent ?? 0),
        coupon_code: r.coupon_code ?? "",
        signup_url: withMyRef((r as { signup_url?: string }).signup_url ?? ""),
      })) as ShippingRate[];
    },
  });

/** Cena bazowa (bez kuponu) dla danej wagi, lub null gdy linia nie obsługuje wagi. */
export function shippingCost(rate: ShippingRate, kg: number): number | null {
  if (kg < rate.min_weight || kg > rate.max_weight) return null;
  const table = rate.price_table ?? {};
  const exact = table[String(kg)];
  if (typeof exact === "number" && exact > 0) return exact;
  const keys = Object.keys(table)
    .map(Number)
    .filter((k) => Number.isFinite(k) && Number(table[String(k)]) > 0)
    .sort((a, b) => a - b);
  if (keys.length) {
    const upper = keys.find((k) => k >= kg);
    if (upper !== undefined) return Number(table[String(upper)]);
    return Number(table[String(keys[keys.length - 1]!)]);
  }
  return rate.base_price + rate.price_per_kg * kg;
}

/** Cena po uwzględnieniu kuponu/zniżki przypisanej do linii wysyłkowej. */
export function shippingCostWithCoupon(rate: ShippingRate, kg: number): number | null {
  const base = shippingCost(rate, kg);
  if (base === null) return null;
  const pct = Math.min(100, Math.max(0, Number(rate.discount_percent) || 0));
  return Math.round(base * (1 - pct / 100) * 100) / 100;
}


/** Dostępne wagi: 0.5 kg – 25 kg co pół kilograma. */
export const WEIGHT_STEPS = Array.from({ length: 50 }, (_, i) => (i + 1) * 0.5);

/** Seed losowania — nowy przy każdym odświeżeniu strony, stały w trakcie przeglądania. */
const SHUFFLE_SEED = Math.floor(Math.random() * 1e9);
function shuffleSeed(): number {
  return SHUFFLE_SEED;
}

/** Deterministyczny hash id + seed — nowe produkty trafiają w losowe miejsce listy. */
function hashOrder(id: string, seed: number): number {
  let h = seed ^ 0x9e3779b9;
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h ^ id.charCodeAt(i), 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Miesza listę produktów w sposób stabilny w obrębie sesji. */
export function shuffleProducts<T extends { id: string }>(items: T[]): T[] {
  const seed = shuffleSeed();
  return [...items].sort((a, b) => hashOrder(a.id, seed) - hashOrder(b.id, seed));
}

