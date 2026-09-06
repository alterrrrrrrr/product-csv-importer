import { createServerFn } from "@tanstack/react-start";

/** Etapy drogi paczki + orientacyjny czas pozostały do doręczenia. */
const STAGES = [
  { key: "s7", min: 0, max: 0, match: /(dostarcz|delivered|signed|签收)/i },
  { key: "s6", min: 0, max: 1, match: /(out for delivery|doręcz|kurier w drodze|paczkomat|ready for pickup|do odbioru)/i },
  { key: "s5", min: 1, max: 2, match: /(poland|polska|polsk|warsaw|warszaw|sortown|inpost|dpd|dhl parcel|local courier|delivery center)/i },
  { key: "s4", min: 2, max: 4, match: /(customs|clearance|odpraw|cło|clo|import scan|arrived in destination|handed over to)/i },
  { key: "s3", min: 4, max: 7, match: /(transit|flight|linehaul|arrived at|departed from|in transport|transport)/i },
  { key: "s2", min: 7, max: 11, match: /(shipped|departed|export|left|dispatch|wysłan|takeoff|accepted by airline)/i },
  { key: "s1", min: 10, max: 14, match: /(warehouse|magazyn|packed|awaiting|received by|order|created|oczek|spakowan)/i },
] as const;

export type TrackResult = {
  ok: boolean;
  error?: string;
  code?: string;
  source?: string;
  stageKey?: string;
  minDays?: number;
  maxDays?: number;
  lastStatus?: string;
  lastTime?: string;
  /** true = brak danych na żywo, szacunek na podstawie przewoźnika */
  estimated?: boolean;
};

/** Szacunek na podstawie formatu numeru, gdy przewoźnik nie udostępnia danych. */
function guessFromCode(code: string) {
  const c = code.toUpperCase();
  if (/^CJ/.test(c)) return { source: "CJPacket", stageKey: "s2", min: 9, max: 15 };
  if (/^(YT|YUN)/.test(c)) return { source: "Yun Express", stageKey: "s2", min: 8, max: 14 };
  if (/^(SF|SFC)/.test(c)) return { source: "SF Express", stageKey: "s2", min: 5, max: 9 };
  if (/^(LP|UF|GV|SY|4PX)/.test(c)) return { source: "Cainiao / 4PX", stageKey: "s2", min: 10, max: 16 };
  if (/(PL|PLA)$/.test(c) || /^(6|00)\d{9,}$/.test(c)) return { source: "Kurier PL", stageKey: "s5", min: 1, max: 2 };
  if (/CN$/.test(c)) return { source: "China Post", stageKey: "s2", min: 12, max: 20 };
  return { source: "Auto-detect", stageKey: "s3", min: 6, max: 12 };
}

function classify(text: string) {
  for (const s of STAGES) if (s.match.test(text)) return s;
  return STAGES[6];
}


/** Cainiao global tracking — darmowe API pokrywające większość przesyłek z Chin. */
async function fromCainiao(code: string) {
  const url = `https://global.cainiao.com/global/detail.json?mailNos=${encodeURIComponent(code)}&lang=en-US`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
      Accept: "application/json,text/plain,*/*",
    },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as any;
  const mod = json?.module?.[0];
  const list = mod?.detailList;
  if (!Array.isArray(list) || list.length === 0) return null;
  const last = list[0];
  return {
    source: "Cainiao / 17track network",
    lastStatus: String(last?.desc ?? last?.standerdDesc ?? "").trim(),
    lastTime: String(last?.time ?? last?.timeStr ?? "").trim(),
  };
}

/** Fallback: publiczna strona ParcelsApp — wyciągamy ostatni opis statusu. */
async function fromParcelsApp(code: string) {
  const res = await fetch(`https://parcelsapp.com/en/tracking/${encodeURIComponent(code)}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
      "Accept-Language": "en",
    },
  });
  if (!res.ok) return null;
  const html = await res.text();
  const m =
    html.match(/<span class="event-content">([\s\S]*?)<\/span>/i) ??
    html.match(/"status"\s*:\s*"([^"]{6,120})"/i);
  const text = (m?.[1] ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return null;
  return { source: "ParcelsApp", lastStatus: text, lastTime: "" };
}

export const trackParcel = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string }) => {
    const code = String(data?.code ?? "").trim();
    if (code.length < 6) throw new Error("SHORT_CODE");
    return { code: code.slice(0, 64) };
  })
  .handler(async ({ data }): Promise<TrackResult> => {
    let hit: { source: string; lastStatus: string; lastTime: string } | null = null;
    for (const fn of [fromCainiao, fromParcelsApp]) {
      try {
        hit = await fn(data.code);
      } catch {
        hit = null;
      }
      if (hit?.lastStatus) break;
    }
    if (!hit?.lastStatus) {
      const g = guessFromCode(data.code);
      return {
        ok: true,
        estimated: true,
        code: data.code,
        source: g.source,
        stageKey: g.stageKey,
        minDays: g.min,
        maxDays: g.max,
      };
    }


    const stage = classify(`${hit.lastStatus}`);
    return {
      ok: true,
      code: data.code,
      source: hit.source,
      stageKey: stage.key,
      minDays: stage.min,
      maxDays: stage.max,
      lastStatus: hit.lastStatus,
      lastTime: hit.lastTime,
    };
  });
