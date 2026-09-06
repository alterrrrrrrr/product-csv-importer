import { PriceTags, QualityBadges, VerifiedBadge } from "@/components/PriceTags";
import type { Product } from "@/lib/store";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/i18n";

/**
 * Lightweight grid card: single image + views, title, category, badges,
 * price and a "Sprawdź" CTA. Colorways / sizes / agent links live in the modal.
 */
export function ProductCard({
  product,
  onDetails,
}: {
  product: Product;
  onDetails?: (p: Product) => void;
}) {
  const { t } = useLang();
  const { has, toggle } = useCart();
  const inCart = has(product.id);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:-translate-y-1 hover:border-primary/60 hover:glow-ring">
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            loading="lazy"
            decoding="async"
            onClick={() => onDetails?.(product)}
            className="h-full w-full cursor-pointer object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            {t("product.noImage")}
          </div>
        )}

        <button
          aria-label={inCart ? t("cart.remove") : t("product.add")}
          title={inCart ? t("cart.remove") : t("product.add")}
          onClick={() => toggle(product)}
          className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-lg border bg-surface-deep/70 text-sm backdrop-blur transition-all hover:border-primary hover:glow-ring ${
            inCart ? "border-primary glow-ring" : "border-border"
          }`}
        >
          <span>{inCart ? "✅" : "🛒"}</span>
        </button>

        {product.verified ? <VerifiedBadge className="absolute left-2 top-2" /> : null}

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-end bg-surface-deep/80 px-3 py-1.5 text-[11px] text-muted-foreground backdrop-blur">
          <span>👁 {product.views}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold">{product.title}</h3>

        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-md border border-border bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
            {product.category || "Inne"}
          </span>
        </div>
        <QualityBadges quality={product.quality} batch={product.batch} />

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
          <PriceTags pln={Number(product.price)} />
          <button
            onClick={() => onDetails?.(product)}
            className="rounded-lg gradient-brand px-3 py-1.5 text-xs font-bold text-surface-deep transition-all hover:-translate-y-0.5 hover:glow-ring-strong hover:brightness-110"
          >
            {t("product.check")}
          </button>
        </div>
      </div>
    </article>
  );
}
