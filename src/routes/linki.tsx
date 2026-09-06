import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { ProductModal } from "@/components/ProductModal";
import { useAgents, useCategories, useProducts, type Product } from "@/lib/store";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/linki")({
  head: () => ({
    meta: [
      { title: "Linki z TikToka — PKMREPS" },
      {
        name: "description",
        content: "Wszystkie linki do produktów z naszych filmów na TikToku, w podziale na kategorie.",
      },
      { property: "og:title", content: "Linki z TikToka — PKMREPS" },
      {
        property: "og:description",
        content: "Produkty z TikToka z linkami do agentów i zdjęciami QC.",
      },
    ],
  }),
  component: LinkiPage,
});

function LinkiPage() {
  const { t } = useLang();
  const { data: products } = useProducts();
  const { data: agents } = useAgents();
  const { data: categories } = useCategories();
  const [cat, setCat] = useState("");
  const [detail, setDetail] = useState<Product | null>(null);

  // Only items actually featured on TikTok (they carry a video link).
  const filtered = useMemo(
    () =>
      (products ?? []).filter(
        (p) => (!p.seller_id || p.show_on_home) && p.tiktok_url && (cat === "" || p.category === cat),
      ),
    [products, cat],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-black">
        Linki z <span className="text-gradient-brand">TikToka</span>
      </h1>
      <div className="my-6 flex flex-wrap gap-2 border-b border-border pb-4">
        <button
          onClick={() => setCat("")}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${cat === "" ? "border-primary text-primary glow-ring" : "border-border text-muted-foreground"}`}
        >
          Wszystkie
        </button>
        {(categories ?? []).map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.name)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${cat === c.name ? "border-primary text-primary glow-ring" : "border-border text-muted-foreground"}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted-foreground">
          {t("tiktok.empty")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <div key={p.id} className="space-y-2">
              <ProductCard product={p} onDetails={setDetail} />
              {p.tiktok_url ? (
                <a
                  href={p.tiktok_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg border border-border bg-secondary px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-primary hover:border-primary"
                >
                  ▶ Zobacz film na TikToku
                </a>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {detail ? (
        <ProductModal product={detail} agents={agents ?? []} onClose={() => setDetail(null)} />
      ) : null}
    </div>
  );
}
