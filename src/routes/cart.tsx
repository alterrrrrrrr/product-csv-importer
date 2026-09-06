import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart, cartItemLink } from "@/lib/cart";
import { useCurrency, formatPrice } from "@/lib/currency";
import { useLang } from "@/lib/i18n";
import { LOCAL_SHIPPING_RATES } from "@/data/localShipping";
import { safeStorage, useAgents } from "@/lib/store";
import { useEffect, useState } from "react";

const AGENT_KEY = "pkmr_cart_agent";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Koszyk — PKMREPS" },
      { name: "description", content: "Twój koszyk z findami i linkami do zakupu." },
      { property: "og:title", content: "Koszyk — PKMREPS" },
      { property: "og:description", content: "Twój koszyk z findami i linkami do zakupu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, remove, clear } = useCart();
  const { currency } = useCurrency();
  const { t } = useLang();
  const { data: agents = [] } = useAgents();
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [withBox, setWithBox] = useState(true);
  const [agent, setAgentState] = useState<string | null>(null);

  useEffect(() => {
    const saved = safeStorage.get(AGENT_KEY);
    if (saved) setAgentState(saved);
  }, []);
  const setAgent = (name: string) => {
    setAgentState(name);
    safeStorage.set(AGENT_KEY, name);
  };
  // Domyślnie pierwszy agent z listy (Litbuy), dopóki użytkownik nie wybierze innego.
  const activeAgent = agent ?? agents[0]?.name ?? null;

  const total = items.reduce((s, i) => s + i.price, 0);

  const shippingLines = LOCAL_SHIPPING_RATES.filter((r) => r.agent_name && r.line_name).sort(
    (a, b) => a.sort_order - b.sort_order
  );

  const selectedRate = shippingLines.find((r) => r.id === selectedLine);

  // Bez wag używamy orientacyjnego kosztu dla 1 kg z tabeli cenowej.
  const estimateWeightKg = 1;
  const priceFor1kg = (rate: (typeof LOCAL_SHIPPING_RATES)[number]) => {
    const table = rate.price_table ?? {};
    const key = String(estimateWeightKg);
    const val = table[key as keyof typeof table];
    return typeof val === "number" ? val : rate.base_price + rate.price_per_kg * estimateWeightKg;
  };
  const estimateShipping = selectedRate ? priceFor1kg(selectedRate) : null;

  return (
    <main className="min-h-screen px-4 pb-20 pt-6 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg glow-ring">
            <span className="text-2xl">🛒</span>
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
              {t("cart.title", "Koszyk")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {items.length} {t("cart.itemsLabel", "przedmiotów")} · {t("cart.shippingHint", "oblicz koszt wysyłki z Chin")}
            </p>
          </div>
        </div>

        {/* Items panel */}
        <section className="mb-6 rounded-3xl border border-border bg-surface p-4 shadow-xl sm:p-6">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <span>🛒</span>
              {t("cart.itemsTitle", "Przedmioty")} ({items.length})
            </h2>
            {items.length > 0 && (
              <button
                onClick={clear}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {t("cart.clear", "Wyczyść")}
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mb-3 text-4xl">🛒</div>
              <p className="text-lg font-semibold text-foreground">{t("cart.emptyTitle", "Koszyk jest pusty")}</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                {t("cart.emptyDesc", "Dodaj produkty z katalogu, aby zobaczyć je tutaj i wyliczyć wysyłkę.")}
              </p>
              <Link
                to="/"
                className="mt-5 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 glow-ring"
              >
                {t("cart.browse", "Przeglądaj produkty →")}
              </Link>
            </div>
          ) : (
            <>
            {agents.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t("cart.agent", "Agent (linki zakupowe)")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {agents.map((a) => {
                    const active = activeAgent === a.name;
                    return (
                      <button
                        key={a.id}
                        onClick={() => setAgent(a.name)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                          active
                            ? "border-primary bg-primary/10 text-primary glow-ring"
                            : "border-border bg-surface-deep text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {a.avatar_url ? (
                          <img src={a.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                        ) : null}
                        {a.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <ul className="space-y-3">
              {items.map((item) => {
                const link = cartItemLink(item, activeAgent);
                return (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-surface-deep p-3 transition-colors hover:border-primary/40"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-16 w-16 flex-shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-xl bg-secondary text-xl">
                      ?
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs font-medium text-primary">{formatPrice(item.price, currency)}</p>
                    {link ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-xs font-semibold text-brand-cyan underline hover:text-brand-sky"
                      >
                        {activeAgent
                          ? `${t("cart.openOn", "Otwórz w")} ${activeAgent} →`
                          : t("cart.openLink", "Otwórz link →")}
                      </a>
                    ) : null}
                  </div>
                  <button
                    onClick={() => remove(item.id)}
                    aria-label={t("cart.remove", "Usuń z koszyka")}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    ✕
                  </button>
                </li>
                );
              })}
            </ul>
            </>
          )}

          {items.length > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">{t("cart.total", "Łącznie")}</span>
              <span className="font-display text-xl font-bold text-primary">{formatPrice(total, currency)}</span>
            </div>
          )}
        </section>

        {/* Shipping panel */}
        {items.length > 0 && (
          <section className="rounded-3xl border border-border bg-surface p-4 shadow-xl sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <span>🌍</span>
              {t("cart.shippingTitle", "Kraj docelowy wysyłki")}
            </h2>

            <div className="mb-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t("cart.destination", "Kraj docelowy")}
              </p>
              <button className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface-deep px-4 py-3 text-left transition-colors hover:border-primary/40">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <span>🇵🇱</span> PL Polska
                </span>
                <span className="text-muted-foreground">›</span>
              </button>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => setWithBox(true)}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
                  withBox
                    ? "border-primary bg-primary/10 text-primary glow-ring"
                    : "border-border bg-surface-deep text-muted-foreground hover:border-primary/40"
                }`}
              >
                <span className="mr-1">📦</span>
                {t("cart.withBox", "Z pudełkiem")}
                <span className="ml-1 block text-[10px] font-normal opacity-80">+buty</span>
              </button>
              <button
                onClick={() => setWithBox(false)}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
                  !withBox
                    ? "border-primary bg-primary/10 text-primary glow-ring"
                    : "border-border bg-surface-deep text-muted-foreground hover:border-primary/40"
                }`}
              >
                <span className="mr-1">🎒</span>
                {t("cart.withoutBox", "Bez pudełka")}
                <span className="ml-1 block text-[10px] font-normal opacity-80">{t("cart.lighter")}</span>
              </button>
            </div>

            <div className="mb-5 space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t("cart.shippingLine", "Linia wysyłkowa")}
              </p>
              {shippingLines.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("cart.noShipping", "Brak dostępnych linii wysyłkowych.")}</p>
              ) : (
                shippingLines.map((rate) => {
                  const estimate = priceFor1kg(rate);
                  const active = selectedLine === rate.id;
                  return (
                    <button
                      key={rate.id}
                      onClick={() => setSelectedLine(rate.id)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all ${
                        active
                          ? "border-primary bg-primary/10 glow-ring"
                          : "border-border bg-surface-deep hover:border-primary/40"
                      }`}
                    >
                      <div>
                        <p className={`text-sm font-semibold ${active ? "text-primary" : "text-foreground"}`}>
                          {rate.agent_name} — {rate.line_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {rate.coupon_code ? `${t("cart.code", "kod")}: ${rate.coupon_code}` : t("cart.noCoupon", "bez kuponu")}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-primary">{formatPrice(estimate, currency)}</span>
                    </button>
                  );
                })
              )}
            </div>

            <button
              disabled={!selectedRate}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold transition-all ${
                selectedRate
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 glow-ring"
                  : "cursor-not-allowed bg-secondary text-muted-foreground"
              }`}
            >
              <span>🧮</span>
              {selectedRate
                ? `${t("cart.calculate", "Wylicz wysyłkę")} ${formatPrice(estimateShipping ?? 0, currency)}`
                : t("cart.selectLine", "Wybierz linię wysyłkową")}
            </button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              {t("cart.estimateNote", "Koszt orientacyjny dla 1 kg. Wagi produktów dodamy wkrótce.")}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
