export type SourcePlatform = "weidian" | "1688" | "taobao";

export type ParsedLink = { platform: SourcePlatform; id: string; url: string };

/**
 * Waliduje link źródłowy. Zwraca null, gdy link nie jest poprawnym linkiem
 * produktowym Weidian / 1688 / Taobao — wtedy NIE wolno go konwertować.
 */
export function parseSourceLink(raw: string): ParsedLink | null {
  const url = (raw ?? "").trim();
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname;

  // Weidian: weidian.com lub shopXXXX.v.weidian.com + itemID=
  if (host === "weidian.com" || host.endsWith(".weidian.com")) {
    const id =
      parsed.searchParams.get("itemID") ??
      parsed.searchParams.get("itemid") ??
      parsed.searchParams.get("itemId");
    if (id && /^\d+$/.test(id.trim())) return { platform: "weidian", id: id.trim(), url };
    return null;
  }

  // 1688: detail.1688.com/offer/<id>.html
  if (host.endsWith("1688.com")) {
    const m = path.match(/\/offer\/(\d+)/);
    if (host.startsWith("detail.") && m?.[1]) return { platform: "1688", id: m[1], url };
    return null;
  }

  // Taobao: item.taobao.com?id=
  if (host === "item.taobao.com" || host.endsWith(".item.taobao.com")) {
    const id = parsed.searchParams.get("id");
    if (id && /^\d+$/.test(id.trim())) return { platform: "taobao", id: id.trim(), url };
    return null;
  }

  return null;
}

const USFANS_PLATFORM: Record<SourcePlatform, string> = {
  "1688": "1",
  taobao: "2",
  weidian: "3",
};

const LITBUY_PLATFORM: Record<SourcePlatform, string> = {
  "1688": "0",
  taobao: "1",
  weidian: "weidian",
};

/** Buduje kanoniczny link źródłowy z platformy i ID. */
export function buildSourceUrl(platform: SourcePlatform, id: string): string {
  if (platform === "weidian") return `https://weidian.com/item.html?itemID=${id}`;
  if (platform === "taobao") return `https://item.taobao.com/item.htm?id=${id}`;
  return `https://detail.1688.com/offer/${id}.html`;
}

const CODE_MAPS: Record<string, Record<string, SourcePlatform>> = {
  usfans: { "1": "1688", "2": "taobao", "3": "weidian" },
  litbuy: { "0": "1688", "1": "taobao", weidian: "weidian" },
  generic: {
    "0": "1688",
    "1": "taobao",
    "2": "weidian",
    weidian: "weidian",
    taobao: "taobao",
    ali_1688: "1688",
    "1688": "1688",
  },
};

/**
 * Wyciąga link źródłowy (Weidian/1688/Taobao) z dowolnego linku — również z linku
 * agenta (USFANS, Kakobuy, Litbuy, CNFans, Mulebuy itp.). Zwraca null, gdy się nie da.
 */
export function extractSourceLink(raw: string): ParsedLink | null {
  const direct = parseSourceLink(raw);
  if (direct) return direct;

  const input = (raw ?? "").trim();
  if (!input) return null;

  let parsed: URL;
  try {
    parsed = new URL(input.startsWith("http") ? input : `https://${input}`);
  } catch {
    return null;
  }

  // 1) Agenci przekazujący pełny link w parametrze (kakobuy, cnfans, mulebuy, hoobuy...)
  for (const key of ["url", "link", "productLink", "itemUrl", "goodsUrl"]) {
    const val = parsed.searchParams.get(key);
    if (val) {
      const nested = parseSourceLink(decodeURIComponent(val));
      if (nested) return nested;
    }
  }

  // 2) Agenci ze wzorcem /product/{platforma}/{id} lub ?shop_type=&id=
  const host = parsed.hostname.toLowerCase();
  const map = host.includes("usfans")
    ? CODE_MAPS["usfans"]!
    : host.includes("litbuy")
      ? CODE_MAPS["litbuy"]!
      : CODE_MAPS["generic"]!;

  const m = parsed.pathname.match(/\/(?:product|item|goods)\/([a-z0-9_]+)\/(\d+)/i);
  if (m) {
    const platform = map[m[1]!.toLowerCase()];
    if (platform) return { platform, id: m[2]!, url: buildSourceUrl(platform, m[2]!) };
  }

  const shopType = (
    parsed.searchParams.get("shop_type") ??
    parsed.searchParams.get("platform") ??
    parsed.searchParams.get("channel") ??
    ""
  ).toLowerCase();
  const id = parsed.searchParams.get("id") ?? parsed.searchParams.get("itemID");
  if (shopType && id && /^\d+$/.test(id)) {
    const platform = CODE_MAPS["generic"]![shopType];
    if (platform) return { platform, id, url: buildSourceUrl(platform, id) };
  }

  return null;
}


/** Kod polecający Kakobuy — używany we wszystkich generowanych linkach. */
export const KAKOBUY_REF = "six7n";

/** Moje kody polecające — nadpisują cudze refy w linkach agentów. */
export const MY_REFS = { usfans: "5FTXZW", kakobuy: KAKOBUY_REF, litbuy: "PKMR" } as const;

/**
 * Podmienia kod polecający w DOWOLNYM linku agenta na mój ref.
 * Cudze refy (ref=, affcode=, inviteCode=, ikako.vip/r/<kod>) są nadpisywane;
 * linki bez rozpoznanego agenta zostają bez zmian.
 */
export function withMyRef(rawUrl: string): string {
  const input = (rawUrl ?? "").trim();
  if (!input) return input;
  let u: URL;
  try {
    u = new URL(input.startsWith("http") ? input : `https://${input}`);
  } catch {
    return input;
  }
  const host = u.hostname.toLowerCase();

  if (host.includes("usfans.com")) {
    u.searchParams.set("ref", MY_REFS.usfans);
    return u.toString();
  }
  if (host.includes("litbuy.com")) {
    u.searchParams.set("inviteCode", MY_REFS.litbuy);
    return u.toString();
  }
  if (host.includes("kakobuy.com")) {
    u.searchParams.set("affcode", MY_REFS.kakobuy);
    return u.toString();
  }
  if (host === "ikako.vip" || host.endsWith(".ikako.vip")) {
    // Link rejestracyjny /r/<kod> — podmieniamy kod na mój.
    if (u.pathname.startsWith("/r/")) return `https://ikako.vip/r/${MY_REFS.kakobuy}`;
    return input; // krótkie linki produktowe ikako.vip/<hash> — brak źródła do podmiany
  }
  return input;
}

function normalizeAgent(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Konwertuje zweryfikowany link na link afiliacyjny agenta.
 * Gdy link jest niepoprawny lub agent nieobsługiwany — zwraca oryginalny link bez zmian.
 */
export function convertLink(rawUrl: string, agentName: string, template?: string): string {
  const original = (rawUrl ?? "").trim();
  const parsed = extractSourceLink(original);
  if (!parsed) return original;


  const agent = normalizeAgent(agentName ?? "");

  if (agent === "usfans") {
    return `https://www.usfans.com/product/${USFANS_PLATFORM[parsed.platform]}/${parsed.id}?ref=5FTXZW`;
  }
  if (agent === "kakobuy" || agent === "kakaobuy") {
    return `https://item.kakobuy.com/item/details?url=${encodeURIComponent(parsed.url)}&affcode=${KAKOBUY_REF}`;
  }
  if (agent === "litbuy") {
    return `https://litbuy.com/product/${LITBUY_PLATFORM[parsed.platform]}/${parsed.id}?linkSearch=true&inviteCode=PKMR`;
  }

  const tpl = (template ?? "").trim();
  if (tpl) {
    return tpl
      .replaceAll("{platform}", parsed.platform === "1688" ? "ali_1688" : parsed.platform)
      .replaceAll("{id}", parsed.id)
      .replaceAll("{url}", encodeURIComponent(parsed.url));
  }

  // Brak reguły dla agenta — nie psujemy linku.
  return original;
}
