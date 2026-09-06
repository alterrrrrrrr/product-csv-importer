import { useMemo, useState } from "react";
import { useAgents, useSettings } from "@/lib/store";
import bbdbuy from "@/assets/stickers/bbdbuy-logo-2.webp";
import ootdbuy from "@/assets/stickers/0x0_4-2.png";
import rizzitgo from "@/assets/stickers/logo-large-_Icw0HdY-2.png";
import gtbuy from "@/assets/stickers/0x0_1-2.png";
import usfans from "@/assets/stickers/unnamed_1-2.png";
import cssbuy from "@/assets/stickers/images-2.png";
import hipobuy from "@/assets/stickers/0x0-2.png";
import litbuy from "@/assets/stickers/litbuy1-bdwW2qsLt48MVVL4-2.avif";
import oopbuy from "@/assets/stickers/unnamed-2.png";
import kakobuy from "@/assets/stickers/0x0-Xl4HETrWr55mfEC9-2.avif";

/** Wgrane logotypy agentów — zawsze dostępne jako naklejki w tle. */
const AGENT_STICKERS = [
  bbdbuy,
  ootdbuy,
  rizzitgo,
  gtbuy,
  usfans,
  cssbuy,
  hipobuy,
  litbuy,
  oopbuy,
  kakobuy,
];

/** Deterministyczny pseudo-random (bez hydration mismatch). */
function rand(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Tło z rozproszonych naklejek zbudowanych z grafik wgranych w panelu admina.
 * Brak powtórzeń sąsiadujących: lista jest unikalna i przetasowana deterministycznie.
 */
export function StickersBackground() {
  const { data: agents } = useAgents();
  const { data: settings } = useSettings();
  const [broken, setBroken] = useState<string[]>([]);

  const stickers = useMemo(() => {
    const custom = (settings?.["bg_stickers"] ?? "").split("\n");
    const raw = [
      ...custom,
      ...AGENT_STICKERS,
      ...(agents ?? []).map((a) => a.avatar_url),
    ].filter((u): u is string => Boolean(u && u.trim()));

    const unique = Array.from(new Set(raw)).filter((u) => !broken.includes(u));
    // Deterministyczne tasowanie, aby układ był stabilny i różnorodny.
    return unique
      .map((url, i) => ({ url, k: rand(i + 1) }))
      .sort((a, b) => a.k - b.k)
      .map((s) => s.url)
      .slice(0, 24);
  }, [agents, settings, broken]);

  if (!stickers.length) return null;

  const cols = 4;
  const rows = Math.ceil(stickers.length / cols);
  const rowStep = 100 / rows;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {stickers.map((url, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        // Równomierna siatka + delikatny, deterministyczny jitter — brak nachodzenia.
        const left = (col + 0.5) * (100 / cols) + (rand(i * 3 + 1) - 0.5) * 8;
        const top = (row + 0.5) * rowStep + (rand(i * 5 + 2) - 0.5) * rowStep * 0.4;
        const rotate = Math.round((rand(i * 11 + 4) - 0.5) * 24);
        const size = 72 + Math.round(rand(i * 13 + 5) * 40);
        return (
          <img
            key={`${url}-${i}`}
            src={url}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setBroken((b) => (b.includes(url) ? b : [...b, url]))}
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
              transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
            }}
            className="absolute select-none rounded-2xl object-contain opacity-20"
          />
        );
      })}
    </div>
  );
}
