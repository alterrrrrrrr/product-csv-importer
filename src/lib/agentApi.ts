import { extractSourceLink, type SourcePlatform } from "@/lib/linkConverter";

/** Kanał produktu w otwartym API agenta (1688 / Taobao / Weidian). */
const CHANNEL: Record<SourcePlatform, string> = { "1688": "1", taobao: "2", weidian: "3" };

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36";

export type AgentDetails = {
  title: string;
  priceCny: number;
  images: string[];
  /** Zdjęcia wariantów kolorystycznych (jedno na kolor). */
  colorImages: string[];
  /** Zdjęcia QC z magazynu agenta — mogą być puste. */
  qcImages: string[];
  sizes: string[];
};

export async function getJson(url: string): Promise<any | null> {
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
 */
export async function fetchAgentDetails(rawUrl: string): Promise<AgentDetails | null> {
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
  if (!colorImages.length && Array.isArray(info.skuList)) {
    for (const s of info.skuList) if (s?.imgUrl) colorImages.push(String(s.imgUrl));
  }

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
      ? Math.min(...info.skuList.map((s: any) => Number(s?.discountPrice ?? s?.price) || Infinity))
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

/** Pierwszy link produktu, jaki da się rozpoznać (store_url → agent_links). */
export function productSourceUrl(p: {
  store_url?: string | null;
  qc_url?: string | null;
  agent_links?: Record<string, string> | null;
}): string {
  const candidates = [
    p.store_url ?? "",
    ...Object.values(p.agent_links ?? {}),
    p.qc_url ?? "",
  ].filter(Boolean);
  for (const c of candidates) if (extractSourceLink(c)) return c;
  return "";
}
