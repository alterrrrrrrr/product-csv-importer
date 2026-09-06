import { useMemo, useRef, useState } from "react";
import { PriceTags, QualityBadges } from "@/components/PriceTags";
import { cnyFromPln, money, usdFromPln, type Agent, type Product } from "@/lib/store";
import { useLang } from "@/lib/i18n";

type SlotKey = "shoes" | "bottoms" | "tops" | "jacket" | "acc";

type Slot = { key: SlotKey; label: string; match: string[] };

const ALL_SLOTS: Slot[] = [
  { key: "shoes", label: "Buty", match: ["but", "shoe", "sneak"] },
  { key: "bottoms", label: "Spodnie", match: ["spodni", "bottom", "pant", "short", "jean"] },
  { key: "tops", label: "Koszulka / Bluza", match: ["koszul", "bluz", "top", "hood", "tee"] },
  {
    key: "jacket",
    label: "Kurtka",
    match: ["kurtk", "jacket", "coat", "puffer", "parka", "płaszcz", "plaszcz"],
  },
  { key: "acc", label: "Czapka / Akcesoria", match: ["czap", "akces", "head", "cap", "hat", "zegar", "accessor"] },
];

const RAIN_MATCH = ["przeciwdeszcz", "rain"];

function pickPool(products: Product[], slot: Slot, womenOnly: boolean) {
  return products.filter((p) => {
    if (womenOnly ? !p.for_women : p.for_women) return false;
    const c = (p.category || "").toLowerCase();
    // Jacket slot: winter jackets only — exclude rain jackets.
    if (slot.key === "jacket" && RAIN_MATCH.some((m) => c.includes(m))) return false;
    return slot.match.some((m) => c.includes(m));
  });
}

function randomOf<T>(list: T[], exclude?: T): T | null {
  if (!list.length) return null;
  const pool = list.length > 1 && exclude ? list.filter((i) => i !== exclude) : list;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

/** Animated outfit randomizer picking one item per clothing slot. */
export function OutfitGenerator({
  products,
  agents,
  onDetails,
}: {
  products: Product[];
  agents: Agent[];
  onDetails?: (p: Product) => void;
}) {
  const { t } = useLang();
  const [jacketOn, setJacketOn] = useState(false);
  const [womenOnly, setWomenOnly] = useState(false);
  const pools = useMemo(
    () => ALL_SLOTS.map((slot) => ({ slot, items: pickPool(products, slot, womenOnly) })),
    [products, womenOnly],
  );
  const slots = useMemo(
    () => ALL_SLOTS.filter((s) => s.key !== "jacket" || jacketOn),
    [jacketOn],
  );
  const jacketPool = pools.find((p) => p.slot.key === "jacket")?.items ?? [];

  const [outfit, setOutfit] = useState<Partial<Record<SlotKey, Product | null>>>({});
  const [spinning, setSpinning] = useState(false);
  const [tick, setTick] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = slots.reduce((sum, s) => sum + Number(outfit[s.key]?.price ?? 0), 0);
  const hasResult = slots.some((s) => outfit[s.key]);

  const rollAll = (withJacket = jacketOn) => {
    if (spinning) return;
    setSpinning(true);
    let ticks = 0;
    timer.current = setInterval(() => {
      ticks += 1;
      const next: Partial<Record<SlotKey, Product | null>> = {};
      for (const { slot, items } of pools) {
        if (slot.key === "jacket" && !withJacket) continue;
        next[slot.key] = randomOf(items);
      }
      setOutfit(next);
      setTick((v) => v + 1);
      if (ticks >= 14) {
        if (timer.current) clearInterval(timer.current);
        setSpinning(false);
      }
    }, 110);
  };

  const rollOne = (key: SlotKey) => {
    const entry = pools.find((p) => p.slot.key === key);
    if (!entry) return;
    setOutfit((o) => ({ ...o, [key]: randomOf(entry.items, o[key] ?? undefined) }));
    setTick((v) => v + 1);
  };

  const addJacket = () => {
    setJacketOn(true);
  };


  const removeJacket = () => {
    setJacketOn(false);
    setOutfit((o) => ({ ...o, jacket: null }));
  };

  return (
    <section className="mb-8 rounded-3xl border border-primary/40 bg-surface p-6 glow-ring">
      <style>{`
        @keyframes slot-fall {
          from { transform: translateY(-110%); }
          to { transform: translateY(0); }
        }
        @keyframes slot-land {
          0% { transform: translateY(-120%) scale(1.05); }
          60% { transform: translateY(4%) scale(0.98); }
          80% { transform: translateY(-2%); }
          100% { transform: translateY(0) scale(1); }
        }
        .slot-fall { animation: slot-fall 130ms linear both; }
        .slot-land { animation: slot-land 450ms cubic-bezier(0.22, 1.4, 0.36, 1) both; }
      `}</style>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
            {t("outfit.kicker")}
          </p>
          <h2 className="mt-1 text-2xl font-black">
            {t("outfit.title1")}{" "}
            <span className="text-gradient-brand">{t("outfit.title2")}</span>
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("outfit.desc")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={womenOnly}
            onClick={() => {
              setWomenOnly((v) => !v);
              setOutfit({});
            }}
            className={`rounded-xl border px-4 py-3 text-xs font-bold uppercase tracking-wide transition-all active:scale-95 ${
              womenOnly
                ? "gradient-brand border-transparent text-surface-deep glow-ring"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            👛 {t("finder.girlZone", "Girl Zone")}
          </button>
          <button
            type="button"
            aria-pressed={jacketOn}
            onClick={() => (jacketOn ? removeJacket() : addJacket())}
            disabled={!jacketOn && jacketPool.length === 0}
            className={`rounded-xl border px-4 py-3 text-xs font-bold uppercase tracking-wide transition-all active:scale-95 disabled:opacity-40 ${
              jacketOn
                ? "gradient-brand border-transparent text-surface-deep glow-ring"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            🧥 {jacketOn ? t("outfit.removeJacket") : t("outfit.addJacket")}
          </button>
          <button
            onClick={() => rollAll()}
            disabled={spinning}
            className="rounded-xl gradient-brand px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-surface-deep disabled:opacity-60"
          >
            {spinning ? t("outfit.rolling") : hasResult ? t("outfit.rollAgain") : t("outfit.roll")}
          </button>
        </div>
      </div>
      <div className={`mt-6 grid gap-4 grid-cols-2 ${jacketOn ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
        {ALL_SLOTS.map((slot) => {
          if (slot.key === "jacket" && !jacketOn) return null;
          const item = outfit[slot.key] ?? null;
          const empty = pools.find((p) => p.slot.key === slot.key)?.items.length === 0;
          return (

            <div
              key={slot.key}
              className={`overflow-hidden rounded-2xl border bg-secondary/40 transition-all ${spinning ? "border-primary/60 opacity-80" : "border-border"}`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                <span>{t(`outfit.${slot.key}`, slot.label)}</span>
                {slot.key === "jacket" ? (
                  <button
                    onClick={removeJacket}
                    aria-label={t("outfit.removeJacket")}
                    className="rounded-md px-1 text-sm leading-none text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </button>
                ) : null}
              </div>
              <div className="aspect-square overflow-hidden bg-secondary">
                {item?.image_url ? (
                  <img
                    key={`${slot.key}-${tick}-${item.id}`}
                    src={item.image_url}
                    alt={item.title}
                    className={`h-full w-full object-cover ${spinning ? "slot-fall blur-[1px]" : "slot-land"}`}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-3 text-center text-[11px] text-muted-foreground">
                    {empty ? t("outfit.empty") : t("outfit.clickRoll")}
                  </div>
                )}
              </div>
              <div className="space-y-2 p-3">
                <p className="line-clamp-2 text-xs font-semibold">{item?.title ?? "—"}</p>
                {item ? (
                  <>
                    <PriceTags pln={Number(item.price)} size="sm" />
                    <QualityBadges quality={item.quality} batch={item.batch} />
                    <div className="flex gap-2">
                      <button
                        onClick={() => onDetails?.(item)}
                        className="flex-1 rounded-lg border border-border px-2 py-1.5 text-[11px] font-semibold text-muted-foreground hover:border-primary hover:text-primary"
                      >
                        {t("outfit.preview")}
                      </button>
                      <button
                        onClick={() => rollOne(slot.key)}
                        className="rounded-lg border border-primary/60 px-2 py-1.5 text-[11px] font-bold text-primary"
                      >
                        🎲
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {hasResult ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-secondary/50 p-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              {t("outfit.total")}
            </p>
            <p className="font-display text-2xl font-black">{money(total)} PLN</p>
            <p className="text-xs text-muted-foreground">
              ≈ ${money(usdFromPln(total))} · ¥{money(cnyFromPln(total))}
            </p>
          </div>
          <div className="flex gap-2">
            {agents.slice(0, 1).map((a) => (
              <a
                key={a.id}
                href={a.referral_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg gradient-brand px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-surface-deep"
              >
                Kup przez {a.name}
              </a>
            ))}
            <button
              onClick={() => rollAll()}
              className="rounded-lg border border-border px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:border-primary hover:text-primary"
            >
              Przelosuj wszystko
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
