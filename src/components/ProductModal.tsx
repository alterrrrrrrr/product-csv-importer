import { useEffect, useState } from "react";
import { PriceTags, QualityBadges, VerifiedBadge } from "@/components/PriceTags";
import type { Agent, Product } from "@/lib/store";
import { registerProductView } from "@/lib/secure.functions";
import { safeStorage } from "@/lib/store";
import { useLang } from "@/lib/i18n";

/** Interactive shopping modal: pick colorway + size, then buy through an agent. */
export function ProductModal({
  product,
  agents,
  onClose,
}: {
  product: Product;
  agents: Agent[];
  onClose: () => void;
}) {
  const gallery = [product.image_url, ...(product.images ?? [])].filter(
    (u): u is string => Boolean(u),
  );
  const { t } = useLang();
  const [active, setActive] = useState(0);
  const [size, setSize] = useState(product.sizes?.[0] ?? "");

  // Licznik wyświetleń: raz na produkt w ramach sesji przeglądarki.
  useEffect(() => {
    const key = `viewed_${product.id}`;
    if (safeStorage.get(key)) return;
    safeStorage.set(key, "1");
    void registerProductView({ data: { productId: product.id } }).catch(() => {});
  }, [product.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-surface-deep/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="my-8 w-full max-w-3xl overflow-hidden rounded-3xl border border-border bg-surface glow-ring"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold">{product.title}</h2>
            {product.verified ? <VerifiedBadge /> : null}
          </div>
          <button
            aria-label="Zamknij"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-all hover:border-primary hover:text-primary hover:glow-ring-strong"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-6 p-5 sm:grid-cols-2">
          <div>
            <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-secondary">
              {gallery[active] ? (
                <img
                  src={gallery[active]}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  {t("product.noImage")}
                </div>
              )}
            </div>
            {gallery.length > 1 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {gallery.map((u, i) => (
                  <button
                    key={`${u}-${i}`}
                    onClick={() => setActive(i)}
                    aria-label={`Kolorystyka ${i + 1}`}
                    className={`h-12 w-12 overflow-hidden rounded-lg border ${i === active ? "border-primary glow-ring" : "border-border"}`}
                  >
                    <img src={u} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <PriceTags pln={Number(product.price)} size="lg" />
            <QualityBadges quality={product.quality} batch={product.batch} />

            {product.sizes?.length ? (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Rozmiar
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${s === size ? "border-primary text-primary glow-ring" : "border-border text-muted-foreground"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid gap-2">
              {product.store_url ? (
                <a
                  href={product.store_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg gradient-brand px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-surface-deep transition-all hover:brightness-110"
                >
                  {t("product.enterStore")} {product.store_name || "Yupoo"} →
                </a>
              ) : null}
              {agents.map((a) => {
                const href = product.agent_links?.[a.name] || a.referral_url;
                return (
                  <a
                    key={a.id}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-lg gradient-brand px-3 py-2.5 text-xs font-extrabold uppercase tracking-wide text-surface-deep transition-all hover:brightness-110"
                  >
                    {a.avatar_url ? (
                      <img src={a.avatar_url} alt="" className="h-5 w-5 rounded-md object-cover" />
                    ) : null}
                    Kup przez {a.name}
                    {size ? ` · ${size}` : ""}
                  </a>
                );
              })}
            </div>


            {product.qc_images?.length ? (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  QC
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {product.qc_images.map((u, i) => (
                    <a
                      key={`${u}-${i}`}
                      href={u}
                      target="_blank"
                      rel="noreferrer"
                      className="aspect-square overflow-hidden rounded-lg border border-border hover:border-primary"
                    >
                      <img
                        src={u}
                        alt={`QC ${i + 1}`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {product.qc_url ? (
              <a
                href={product.qc_url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border border-border px-3 py-2 text-center text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
              >
                {t("product.qc")}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
