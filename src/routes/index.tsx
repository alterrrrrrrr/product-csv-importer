import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { ProductModal } from "@/components/ProductModal";
import {
  useAgents,
  useCategories,
  useProducts,
  shuffleProducts,
  type Product,
} from "@/lib/store";
import { useLang } from "@/lib/i18n";

/** Ile kafelków renderujemy w jednej porcji — reszta doładowuje się na żądanie. */
const PAGE_SIZE = 48;

/** „Best batch” / „Best” — jakość lub batch produktu zawiera słowo „best”. */
function isBest(p: Product) {
  return `${p.quality ?? ""} ${p.batch ?? ""}`.toLowerCase().includes("best");
}


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Product Finder — PKMREPS Agent & QC Finds" },
      {
        name: "description",
        content:
          "Znajdź najlepsze findsy, sprawdź zdjęcia QC i kup przez Litbuy, Kakaobuy lub USFans.",
      },
      { property: "og:title", content: "Product Finder — PKMREPS" },
      {
        property: "og:description",
        content: "Wyszukiwarka findsów z QC i bezpośrednimi linkami do agentów.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: products } = useProducts();
  const { data: agents } = useAgents();
  const { data: categories } = useCategories();
  const { t } = useLang();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [bestOnly, setBestOnly] = useState(false);
  const [girlOnly, setGirlOnly] = useState(false);
  const [detail, setDetail] = useState<Product | null>(null);

  // Product Finder shows only global (admin) products — seller items live in their stores.
  // Kolejność jest losowa (stała w obrębie sesji), więc nowe produkty trafiają w losowe miejsce.
  const all = useMemo(
    () => shuffleProducts((products ?? []).filter((p) => !p.seller_id || p.show_on_home)),
    [products],
  );

  const filtered = useMemo(() => {
    const lo = min === "" ? -Infinity : Number(min);
    const hi = max === "" ? Infinity : Number(max);
    const needle = q.trim().toLowerCase();
    return all.filter(
      (p) =>
        (needle === "" ||
          `${p.title} ${p.batch ?? ""} ${p.quality ?? ""} ${p.category ?? ""}`
            .toLowerCase()
            .includes(needle)) &&
        (cat === "" || p.category === cat) &&
        (!bestOnly || isBest(p)) &&
        (!girlOnly || p.for_women) &&
        Number(p.price) >= lo &&
        Number(p.price) <= hi,
    );
  }, [all, q, cat, min, max, bestOnly, girlOnly]);

  const [limit, setLimit] = useState(PAGE_SIZE);

  // Każda zmiana filtrów zaczyna listę od pierwszej porcji.
  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [q, cat, min, max, bestOnly, girlOnly]);

  const visible = useMemo(() => filtered.slice(0, limit), [filtered, limit]);
  const remaining = filtered.length - visible.length;

  const inputCls =
    "w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none focus:border-primary focus:glow-ring";


  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <section className="mb-8 rounded-3xl border border-border bg-surface/60 p-8 text-center glow-ring">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
          {t("home.kicker")}
        </p>
        <h1 className="mt-3 text-3xl font-black sm:text-5xl">
          {t("home.title1")} <span className="text-gradient-brand">{t("home.title2")}</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">{t("home.subtitle")}</p>
        <div className="mx-auto mt-6 flex max-w-xl gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("finder.search")}
            className={inputCls}
          />
        </div>
      </section>

      <Link
        to="/outfity"
        className="group mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/40 bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-primary hover:glow-ring-strong"
      >
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-primary/50 bg-secondary text-2xl transition-transform group-hover:rotate-12">
            🎲
          </span>
          <div>
            <p className="text-base font-black">{t("home.outfitTitle")}</p>
            <p className="text-xs text-muted-foreground">{t("home.outfitDesc")}</p>
          </div>
        </div>
        <span className="rounded-lg gradient-brand px-5 py-2.5 text-xs font-extrabold uppercase tracking-wide text-surface-deep transition-transform group-hover:scale-105">
          {t("home.outfitCta")}
        </span>
      </Link>



      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-end">
        <label className="flex-1 text-xs font-semibold text-muted-foreground">
          {t("finder.priceFrom")}
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={min}
            onChange={(e) => setMin(e.target.value)}
            placeholder="0"
            className={`${inputCls} mt-1`}
          />
        </label>
        <label className="flex-1 text-xs font-semibold text-muted-foreground">
          {t("finder.priceTo")}
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={max}
            onChange={(e) => setMax(e.target.value)}
            placeholder="9999"
            className={`${inputCls} mt-1`}
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={bestOnly}
            onClick={() => setBestOnly(!bestOnly)}
            className={`group flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-extrabold uppercase tracking-wide transition-all active:scale-95 ${bestOnly ? "gradient-brand border-transparent text-surface-deep glow-ring" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}
          >
            <span className="text-sm leading-none">🔥</span>
            {t("finder.bestOnly", "Best batch only")}
          </button>
          <button
            type="button"
            aria-pressed={girlOnly}
            onClick={() => setGirlOnly(!girlOnly)}
            className={`group flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-extrabold uppercase tracking-wide transition-all active:scale-95 ${girlOnly ? "gradient-brand border-transparent text-surface-deep glow-ring" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}
          >
            <span className="text-sm leading-none">👛</span>
            {t("finder.girlZone", "Girl Zone")}
          </button>

          <button
            onClick={() => {
              setQ("");
              setCat("");
              setMin("");
              setMax("");
              setBestOnly(false);
              setGirlOnly(false);
            }}
            className="rounded-xl border border-border px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {t("finder.clear")}
          </button>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-bold">
        {t("finder.all")}
      </h2>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setCat("")}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${cat === "" ? "border-primary text-primary glow-ring" : "border-border text-muted-foreground"}`}
        >
          {t("finder.allCats")}
        </button>
        {(categories ?? []).map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.name)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${cat === c.name ? "border-primary text-primary glow-ring" : "border-border text-muted-foreground"}`}
          >
            {t(`cat.${c.name}`, c.name)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted-foreground">
          {t("finder.empty")}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} onDetails={setDetail} />
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-2">
            {remaining > 0 ? (
              <button
                onClick={() => setLimit((l) => l + PAGE_SIZE)}
                className="rounded-xl gradient-brand px-8 py-3 text-xs font-extrabold uppercase tracking-wide text-surface-deep transition-transform hover:-translate-y-0.5 hover:glow-ring-strong"
              >
                {t("finder.loadMore")}
              </button>
            ) : null}
          </div>
        </>
      )}


      {detail ? (
        <ProductModal product={detail} agents={agents ?? []} onClose={() => setDetail(null)} />
      ) : null}
    </div>
  );
}
