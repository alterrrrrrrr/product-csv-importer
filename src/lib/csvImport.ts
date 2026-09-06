/** Prosty parser CSV / TSV (obsługuje cudzysłowy i wielolinijkowe pola). */
export function parseDelimited(text: string): string[][] {
  const src = text.replace(/\r\n?/g, "\n").trim();
  if (!src) return [];
  const delimiter = (src.split("\n")[0] ?? "").includes("\t") ? "\t" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i]!;
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === delimiter) {
      row.push(cell);
      cell = "";
    } else if (c === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  row.push(cell);
  rows.push(row);
  return rows.filter((r) => r.some((v) => v.trim()));
}

/** Nagłówki, które rozumiemy przy imporcie produktów (PL i EN). */
const HEADER_ALIASES: Record<string, string> = {
  title: "title",
  nazwa: "title",
  tytul: "title",
  produkt: "title",
  category: "category",
  kategoria: "category",
  price: "price",
  cena: "price",
  cenapln: "price",
  pricepln: "price",
  pricecny: "price_cny",
  cenacny: "price_cny",
  cny: "price_cny",
  image: "image_url",
  imageurl: "image_url",
  zdjecie: "image_url",
  images: "images",
  zdjecia: "images",
  galeria: "images",
  qc: "qc_url",
  qcurl: "qc_url",
  link: "store_url",
  url: "store_url",
  storeurl: "store_url",
  sklep: "store_url",
  storename: "store_name",
  nazwasklepu: "store_name",
  quality: "quality",
  jakosc: "quality",
  batch: "batch",
  sizes: "sizes",
  rozmiary: "sizes",
  tiktok: "tiktok_url",
  tiktokurl: "tiktok_url",
  agentlinks: "agent_links",
  linkiagentow: "agent_links",
};

const norm = (h: string) =>
  h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

export type ImportedRow = {
  title: string;
  category: string;
  price: number;
  price_cny: number;
  image_url: string | null;
  images: string[];
  qc_url: string | null;
  store_url: string;
  store_name: string;
  quality: string;
  batch: string;
  sizes: string[];
  tiktok_url: string | null;
  agent_links: Record<string, string>;
};

const num = (v: string) => {
  const n = Number(String(v).replace(/[^\d.,-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

const list = (v: string) =>
  Array.from(new Set(v.split(/[,;|\n]/).map((s) => s.trim()).filter(Boolean)));

export const DEFAULT_SHIRT_SIZES = ["S", "M", "L", "XL"];

export function isShirt(title: string, category: string): boolean {
  return /(^|\W)(koszul(?:a|ka|ki|ek)?|t[ -]?shirt|shirt|tee)(\W|$)/i.test(`${title} ${category}`);
}

function links(value: string): Record<string, string> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>)
        .filter(([, url]) => typeof url === "string" && url.trim())
        .map(([agent, url]) => [agent, String(url).trim()]),
    );
  } catch {
    return {};
  }
}

/** Zamienia arkusz (CSV/TSV z nagłówkiem) na wiersze produktów. */
export function rowsToProducts(rows: string[][]): ImportedRow[] {
  if (rows.length < 2) return [];
  const headers = (rows[0] ?? []).map((h) => HEADER_ALIASES[norm(h)] ?? "");
  const out: ImportedRow[] = [];

  for (const r of rows.slice(1)) {
    const get = (field: string) => {
      const idx = headers.indexOf(field);
      return idx >= 0 ? (r[idx] ?? "").trim() : "";
    };
    const title = get("title");
    if (!title) continue;
    const images = list(get("images"));
    const main = get("image_url") || images[0] || "";
    const sizes = list(get("sizes"));
    out.push({
      title,
      category: get("category"),
      price: num(get("price")),
      price_cny: num(get("price_cny")),
      image_url: main || null,
      images: images.filter((u) => u !== main),
      qc_url: get("qc_url") || null,
      store_url: get("store_url"),
      store_name: get("store_name"),
      quality: get("quality") || "Best",
      batch: get("batch"),
      sizes: sizes.length || !isShirt(title, get("category")) ? sizes : [...DEFAULT_SHIRT_SIZES],
      tiktok_url: get("tiktok_url") || null,
      agent_links: links(get("agent_links")),
    });
  }
  return out;
}
