import { createServerFn } from "@tanstack/react-start";
import { extractSourceLink, type SourcePlatform } from "@/lib/linkConverter";

/** Kanał produktu w otwartym API agenta (1688 / Taobao / Weidian). */
const CHANNEL: Record<SourcePlatform, string> = { "1688": "1", taobao: "2", weidian: "3" };

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36";

type AgentDetails = {
  title: string;
  priceCny: number;
  images: string[];
  /** Zdjęcia wariantów kolorystycznych (jedno na kolor). */
  colorImages: string[];
  /** Zdjęcia QC z magazynu agenta — mogą być puste. */
  qcImages: string[];
  sizes: string[];
};

async function getJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    return json?.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Pobiera dane produktu z otwartego API agenta (USFans) na podstawie linku
 * źródłowego lub linku agenta (USFans / Kakobuy / Litbuy — każdy jest najpierw
 * sprowadzany do linku źródłowego Weidian / Taobao / 1688).
 * Zwraca null, gdy linku nie da się rozpoznać albo API nie zna produktu.
 */
async function fetchAgentDetails(rawUrl: string): Promise<AgentDetails | null> {
  const parsed = extractSourceLink(rawUrl);
  if (!parsed) return null;

  const [info, estimate] = await Promise.all([
    getJson(
      `https://www.usfans.com/api/goods/info?channel=${CHANNEL[parsed.platform]}&goodsId=${parsed.id}`,
    ),
    getJson(`https://www.usfans.com/api/goods/estimate-info?goodsId=${parsed.id}`),
  ]);
  if (!info?.goodsId) return null;

  const gallery: string[] = Array.isArray(info.images) ? info.images.map(String) : [];

  // Warianty kolorystyczne i rozmiary z listy właściwości produktu.
  const colorImages: string[] = [];
  const sizes: string[] = [];
  const props = Array.isArray(info.properties) ? info.properties : [];
  for (const p of props) {
    const name = String(p?.propNameEn ?? p?.propName ?? "").toLowerCase();
    const values = Array.isArray(p?.valuesList) ? p.valuesList : [];
    const isColor = /color|colour|颜色|款式|style/.test(name);
    const isSize = /size|尺码|尺寸|rozmiar/.test(name);
    for (const v of values) {
      if (isColor && v?.picUrl) colorImages.push(String(v.picUrl));
      if (isSize) {
        const label = String(v?.valueNameEn ?? v?.valueName ?? "").trim();
        if (label) sizes.push(label);
      }
    }
  }
  // Zapasowo: zdjęcia SKU jako kolorystyki, gdy właściwości nie mają zdjęć.
  if (!colorImages.length && Array.isArray(info.skuList)) {
    for (const s of info.skuList) if (s?.imgUrl) colorImages.push(String(s.imgUrl));
  }

  // Rozmiary bez zdjęć — z uproszczonej listy propertiesVOList.
  if (!sizes.length && Array.isArray(info.propertiesVOList)) {
    for (const v of info.propertiesVOList) {
      if (/size/i.test(String(v?.propName ?? ""))) {
        const label = String(v?.valueName ?? "").trim();
        if (label) sizes.push(label);
      }
    }
  }

  const qcImages: string[] = Array.isArray(estimate?.qcImages)
    ? estimate.qcImages.map(String).filter(Boolean)
    : [];

  const price =
    Number(info.price) ||
    (Array.isArray(info.skuList)
      ? Math.min(
          ...info.skuList.map((s: any) => Number(s?.discountPrice ?? s?.price) || Infinity),
        )
      : Infinity);

  return {
    title: String(info.titleEn || info.title || "").trim(),
    priceCny: Number.isFinite(price) ? Number(price) : 0,
    images: Array.from(new Set([...gallery, ...colorImages])).slice(0, 20),
    colorImages: Array.from(new Set(colorImages)).slice(0, 20),
    qcImages: Array.from(new Set(qcImages)),
    sizes: Array.from(new Set(sizes)).slice(0, 30),
  };
}

/** Fetch a product page and best-effort parse title, images and price. */
export const scrapeProduct = createServerFn({ method: "POST" })
  .inputValidator((data: { url: string }) => {
    if (!data?.url || !/^https?:\/\//i.test(data.url)) throw new Error("Nieprawidłowy link.");
    return { url: data.url };
  })
  .handler(async ({ data }) => {
    // 1) Otwarte API agenta — najpewniejsze źródło (zdjęcia, QC, kolorystyki, rozmiary).
    const agent = await fetchAgentDetails(data.url).catch(() => null);
    if (agent && (agent.images.length || agent.title)) {
      return { ok: true as const, ...agent };
    }

    // 2) Zapas: parsowanie HTML strony źródłowej.
    const sourceUrl = extractSourceLink(data.url)?.url ?? data.url;
    const res = await fetch(sourceUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
        "Accept-Language": "en,pl;q=0.8",
      },
    });
    if (!res.ok) return { ok: false as const, error: `HTTP ${res.status}` };
    const html = await res.text();

    const meta = (prop: string) => {
      const re = new RegExp(
        `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
        "i",
      );
      const alt = new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,
        "i",
      );
      return html.match(re)?.[1] ?? html.match(alt)?.[1] ?? "";
    };

    // JSON-LD is the most reliable source when a shop provides it.
    let ldTitle = "";
    let ldImages: string[] = [];
    let ldPrice = 0;
    for (const m of html.matchAll(
      /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi,
    )) {
      try {
        const parsed = JSON.parse((m[1] ?? "").trim());
        const nodes = Array.isArray(parsed) ? parsed : [parsed, ...(parsed["@graph"] ?? [])];
        for (const node of nodes) {
          if (!node || typeof node !== "object") continue;
          if (node.name && !ldTitle) ldTitle = String(node.name);
          const img = node.image;
          if (img) ldImages.push(...(Array.isArray(img) ? img.map(String) : [String(img)]));
          const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
          if (offers?.price && !ldPrice) ldPrice = Number(offers.price) || 0;
        }
      } catch {
        /* ignore malformed JSON-LD */
      }
    }

    const title = (
      ldTitle ||
      meta("og:title") ||
      html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ||
      ""
    )
      .replace(/\s+/g, " ")
      .trim();

    const junk =
      /(logo|icon|avatar|sprite|placeholder|banner|qrcode|wechat|footer|header|flag|payment)/i;

    const images = Array.from(
      new Set(
        [
          ...ldImages,
          meta("og:image"),
          ...Array.from(
            html.matchAll(
              /<img[^>]+(?:data-src|data-original|data-lazy-src|src)=["'](https?:\/\/[^"']+?\.(?:jpe?g|png|webp))/gi,
            ),
          ).map((m) => m[1] as string),
          ...Array.from(
            html.matchAll(/["'](https?:\/\/[^"']*?(?:img|image|pic|cdn)[^"']*?\.(?:jpe?g|png|webp))["']/gi),
          ).map((m) => m[1] as string),
        ]
          .filter(Boolean)
          .map((u) => u.replace(/&amp;/g, "&"))
          .filter((u) => !junk.test(u)),
      ),
    ).slice(0, 10);

    const priceRaw =
      meta("og:price:amount") ||
      meta("product:price:amount") ||
      html.match(/["'](?:price|salePrice|minPrice|price_min)["']\s*:\s*["']?([0-9]+(?:\.[0-9]+)?)/i)?.[1] ||
      "";
    const priceCny = ldPrice || Number(priceRaw) || 0;

    // Rozmiary odzieżowe (S/M/L) oraz liczbowe rozmiary butów / spodni (np. 40, 42.5).
    const letterSizes = Array.from(html.matchAll(/\b(XXS|XS|S|M|L|XL|XXL|XXXL|3XL|4XL)\b/g)).map(
      (m) => m[1] as string,
    );
    const numericSizes = Array.from(html.matchAll(/\b(\d{2}(?:\.5)?)\b/g))
      .map((m) => m[1] as string)
      .filter((v) => {
        const n = Number(v);
        return n >= 26 && n <= 50;
      });
    const sizes = Array.from(new Set([...letterSizes, ...numericSizes])).slice(0, 30);

    return {
      ok: true as const,
      title,
      images,
      priceCny,
      sizes,
      colorImages: [] as string[],
      qcImages: [] as string[],
    };
  });

