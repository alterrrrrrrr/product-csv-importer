import { createServerFn } from "@tanstack/react-start";
import { extractSourceLink } from "@/lib/linkConverter";
import { fetchAgentDetails } from "@/lib/agentApi";


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

