import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { ProductModal } from "@/components/ProductModal";
import { useAgents, useProducts, useSellers, type Product } from "@/lib/store";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/sklep/$slug")({
  head: () => ({
    meta: [
      { title: "Sklep sprzedawcy — PKMREPS" },
      { name: "description", content: "Produkty wybranego sprzedawcy na platformie PKMREPS." },
      { property: "og:title", content: "Sklep sprzedawcy — PKMREPS" },
      {
        property: "og:description",
        content: "Zobacz asortyment sklepu prowadzonego przez sprzedawcę PKMREPS.",
      },
    ],
  }),
  component: StorePage,
});

function StorePage() {
  const { t } = useLang();
  const { slug } = Route.useParams();
  const { data: sellers } = useSellers();
  const { data: products } = useProducts();
  const { data: agents } = useAgents();
  const [detail, setDetail] = useState<Product | null>(null);

  const seller = (sellers ?? []).find((s) => s.slug === slug);
  const items = (products ?? []).filter((p) => seller && p.seller_id === seller.id);

  if (sellers && !seller) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-black">Nie znaleziono sklepu</h1>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="overflow-hidden rounded-3xl border border-border bg-surface glow-ring">
        {seller?.banner_url ? (
          <img src={seller.banner_url} alt="" className="h-40 w-full object-cover" />
        ) : (
          <div className="h-40 w-full gradient-brand opacity-40" />
        )}
        <div className="flex items-center gap-4 p-6">
          {seller?.logo_url ? (
            <img
              src={seller.logo_url}
              alt={seller.name}
              className="h-16 w-16 rounded-2xl object-cover glow-ring"
            />
          ) : null}
          <div>
            <h1 className="text-2xl font-black">{seller?.name ?? "Sklep"}</h1>
            <p className="text-sm text-muted-foreground">{seller?.description}</p>
            {seller?.external_url ? (
              <a
                href={seller.external_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block rounded-lg border border-primary/60 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-primary hover:glow-ring"
              >
                {t("store.external")}
              </a>
            ) : null}
          </div>
        </div>
      </header>

      {items.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted-foreground">
          {t("store.noProducts")}
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} onDetails={setDetail} />
          ))}
        </div>
      )}

      {detail ? (
        <ProductModal product={detail} agents={agents ?? []} onClose={() => setDetail(null)} />
      ) : null}
    </div>
  );
}
