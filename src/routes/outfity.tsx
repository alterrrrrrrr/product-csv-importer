import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { OutfitGenerator } from "@/components/OutfitGenerator";
import { ProductModal } from "@/components/ProductModal";
import { useAgents, useProducts, type Product } from "@/lib/store";

export const Route = createFileRoute("/outfity")({
  head: () => ({
    meta: [
      { title: "Losowanie outfitów — PKMREPS" },
      {
        name: "description",
        content:
          "Wylosuj kompletny zestaw: buty, spodnie, górę i akcesoria z katalogu findsów wraz z ceną w PLN, USD i CNY.",
      },
      { property: "og:title", content: "Losowanie outfitów — PKMREPS" },
      {
        property: "og:description",
        content: "Interaktywny generator kompletnych zestawów z katalogu findsów.",
      },
    ],
  }),
  component: OutfitPage,
});

function OutfitPage() {
  const { data: products } = useProducts();
  const { data: agents } = useAgents();
  const [detail, setDetail] = useState<Product | null>(null);

  const all = useMemo(() => (products ?? []).filter((p) => !p.seller_id || p.show_on_home), [products]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-black sm:text-4xl">
        Losowanie <span className="text-gradient-brand">outfitów</span>
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Kliknij losowanie, a wybierzemy dla Ciebie kompletny zestaw z katalogu.
      </p>

      <div className="mt-8">
        <OutfitGenerator products={all} agents={agents ?? []} onDetails={setDetail} />
      </div>

      {detail ? (
        <ProductModal product={detail} agents={agents ?? []} onClose={() => setDetail(null)} />
      ) : null}
    </div>
  );
}
