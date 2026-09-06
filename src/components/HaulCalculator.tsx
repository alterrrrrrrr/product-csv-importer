import { useMemo, useState } from "react";
import {
  money,
  shippingCost,
  shippingCostWithCoupon,
  useAgents,
  useShippingRates,
  usdFromPln,
  type ShippingRate,
} from "@/lib/store";
import { useLang } from "@/lib/i18n";

const MIN_KG = 0.5;
const MAX_KG = 25;

/** Weight-based shipping comparison across agents, driven by admin-managed rates. */
export function HaulCalculator() {
  const { t } = useLang();
  const { data: rates } = useShippingRates();
  const { data: agents } = useAgents();
  const [kg, setKg] = useState(2);
  const [withCoupons, setWithCoupons] = useState(true);

  const avatarOf = (name: string) =>
    (agents ?? []).find((a) => a.name.toLowerCase() === name.toLowerCase())?.avatar_url ?? null;

  /** Link rejestracyjny agenta — z linii wysyłkowej, a w razie braku z profilu agenta. */
  const signupOf = (rate: ShippingRate) =>
    rate.signup_url ||
    (agents ?? []).find((a) => a.name.toLowerCase() === rate.agent_name.toLowerCase())
      ?.referral_url ||
    "";

  const results = useMemo(() => {
    const list: { rate: ShippingRate; cost: number; base: number }[] = [];
    for (const r of rates ?? []) {
      const base = shippingCost(r, kg);
      if (base === null) continue;
      const cost = withCoupons ? (shippingCostWithCoupon(r, kg) ?? base) : base;
      list.push({ rate: r, cost, base });
    }
    return list.sort((a, b) => a.cost - b.cost);
  }, [rates, kg, withCoupons]);

  const cheapest = results[0]?.cost ?? null;
  const pct = ((kg - MIN_KG) / (MAX_KG - MIN_KG)) * 100;

  const clamp = (v: number) => Math.min(MAX_KG, Math.max(MIN_KG, Math.round(v * 2) / 2));

  return (
    <section className="rounded-3xl border border-primary/30 bg-surface p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
            {t("calc.kicker")}
          </p>
          <h2 className="mt-1 text-xl font-black">{t("calc.title")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("calc.range")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label={t("calc.less")}
            onClick={() => setKg((v) => clamp(v - 0.5))}
            className="h-10 w-10 rounded-xl border border-border text-lg font-bold text-muted-foreground transition-all hover:border-primary hover:text-primary"
          >
            −
          </button>
          <div className="rounded-2xl border border-primary/40 bg-secondary/60 px-5 py-2 text-center glow-ring">
            <p className="font-display text-3xl font-black text-gradient-brand">{kg.toFixed(1)}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              {t("calc.kilograms")}
            </p>
          </div>
          <button
            aria-label={t("calc.more")}
            onClick={() => setKg((v) => clamp(v + 0.5))}
            className="h-10 w-10 rounded-xl border border-border text-lg font-bold text-muted-foreground transition-all hover:border-primary hover:text-primary"
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-6">
        <input
          type="range"
          min={MIN_KG}
          max={MAX_KG}
          step={0.5}
          value={kg}
          aria-label={t("calc.weightAria")}
          onChange={(e) => setKg(Number(e.target.value))}
          className="range-brand w-full cursor-pointer"
          style={{
            background: `linear-gradient(90deg, #00f2fe 0%, #0d9488 ${pct}%, rgba(148,163,184,0.18) ${pct}%, rgba(148,163,184,0.18) 100%)`,
          }}
        />
        <div className="mt-2 flex justify-between text-[10px] font-semibold text-muted-foreground">
          <span>{MIN_KG} kg</span>
          <span>{(MAX_KG / 2).toFixed(1)} kg</span>
          <span>{MAX_KG} kg</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[0.5, 1, 1.5, 2, 3, 5, 7.5, 10, 15, 20, 25].map((v) => (
            <button
              key={v}
              onClick={() => setKg(v)}
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-all ${
                kg === v
                  ? "border-primary text-primary glow-ring"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {v} kg
            </button>
          ))}
        </div>
      </div>


      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          {t("calc.prices")}
        </span>
        {[
          { on: true, label: t("calc.withCoupons") },
          { on: false, label: t("calc.withoutCoupons") },
        ].map((opt) => (
          <button
            key={String(opt.on)}
            onClick={() => setWithCoupons(opt.on)}
            className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-all ${
              withCoupons === opt.on
                ? "border-primary text-primary glow-ring"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <p className="mt-5 rounded-xl border border-border bg-secondary/50 p-5 text-center text-xs text-muted-foreground">
          {t("calc.empty")}
        </p>
      ) : (
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {results.map(({ rate, cost, base }) => {
            const best = cost === cheapest;
            const avatar = avatarOf(rate.agent_name);
            const signup = signupOf(rate);
            const Tile = signup ? "a" : "li";
            return (
              <Tile
                key={rate.id}
                {...(signup
                  ? { href: signup, target: "_blank", rel: "noreferrer", title: t("calc.signup") }
                  : {})}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${signup ? "cursor-pointer hover:-translate-y-0.5 hover:border-primary" : ""} ${best ? "border-primary bg-primary/10 glow-ring" : "border-border bg-secondary/50"}`}
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt=""
                    loading="lazy"
                    className="h-9 w-9 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border text-[11px] font-bold">
                    {rate.agent_name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{rate.agent_name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{rate.line_name}</p>
                  {best ? (
                    <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
                      {t("calc.cheapest")}
                    </p>
                  ) : null}
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-base font-bold">{money(cost)} PLN</p>
                  {withCoupons && cost < base ? (
                    <p className="text-[11px] text-muted-foreground line-through">
                      {money(base)} PLN
                    </p>
                  ) : null}
                  <p className="text-[11px] text-muted-foreground">≈ ${money(usdFromPln(cost))}</p>
                  {withCoupons && rate.coupon_code ? (
                    <p className="text-[11px] font-bold text-primary">{t("calc.code")} {rate.coupon_code}</p>
                  ) : null}
                </div>
              </Tile>
            );
          })}
        </ul>
      )}
    </section>
  );
}
