import { useSocialLinks } from "@/lib/store";
import { useCart } from "@/lib/cart";
import { useCurrency, CURRENCIES, formatPrice } from "@/lib/currency";
import { LANGS, flagUrl, useLang } from "@/lib/i18n";

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={label}
      aria-label={label}
      className="group flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface text-primary transition-all hover:glow-ring-strong hover:border-primary"
    >
      {children}
    </a>
  );
}

export function CartPanel({ onClose }: { onClose: () => void }) {
  const { t } = useLang();
  const { items, remove, clear } = useCart();
  const { currency } = useCurrency();
  const total = items.reduce((s, i) => s + i.price, 0);

  return (
    <div className="w-72 rounded-2xl border border-border bg-surface-deep/95 p-3 backdrop-blur-xl glow-ring">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold">🛒 Koszyk</p>
        <button
          onClick={onClose}
          aria-label="Zamknij koszyk"
          className="text-xs text-muted-foreground hover:text-primary"
        >
          ✕
        </button>
      </div>

      {items.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">Koszyk jest pusty</p>
      ) : (
        <>
          <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {items.map((i) => (
              <li
                key={i.id}
                className="flex items-center gap-2 rounded-xl border border-border bg-surface p-2"
              >
                {i.image ? (
                  <img src={i.image} alt={i.title} className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-xs">
                    ?
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold">{i.title}</p>
                  <p className="text-[11px] text-primary">{formatPrice(i.price, currency)}</p>
                  {i.url ? (
                    <a
                      href={i.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-semibold text-brand-cyan underline"
                    >
                      {t("cart.openLink")}
                    </a>
                  ) : null}
                </div>
                <button
                  onClick={() => remove(i.id)}
                  aria-label={t("cart.remove")}
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs">
            <span className="font-bold">{formatPrice(total, currency)}</span>
            <button onClick={clear} className="text-muted-foreground hover:text-primary">
              {t("cart.clear")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { currency, setCurrency } = useCurrency();
  const { lang, setLang, t } = useLang();

  return (
    <div className="w-64 rounded-2xl border border-border bg-surface-deep/95 p-3 backdrop-blur-xl glow-ring">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold">{t("ui.settings")}</p>
        <button
          onClick={onClose}
          aria-label={t("ui.closeSettings")}
          className="text-xs text-muted-foreground hover:text-primary"
        >
          ✕
        </button>
      </div>

      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {t("ui.currency")}
      </p>
      <div className="mb-3 grid grid-cols-4 gap-1">
        {CURRENCIES.map((c) => (
          <button
            key={c.code}
            onClick={() => setCurrency(c.code)}
            className={`rounded-lg border px-1 py-1.5 text-[11px] font-bold transition-colors ${
              currency === c.code
                ? "border-primary bg-secondary text-primary glow-ring"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {c.symbol} {c.code}
          </button>
        ))}
      </div>

      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {t("ui.language")}
      </p>
      <div className="grid grid-cols-4 gap-1">
        {LANGS.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            title={l.label}
            aria-label={l.label}
            className={`flex items-center justify-center gap-1 rounded-lg border px-1 py-1.5 text-[11px] font-bold transition-colors ${
              lang === l.code
                ? "border-primary bg-secondary text-primary glow-ring"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <img
              src={flagUrl(l.country)}
              alt=""
              aria-hidden="true"
              width={22}
              height={16}
              className="h-4 w-[22px] rounded-[3px] object-cover shadow-sm"
            />
            <span className="uppercase">{l.code}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Prawa wyspa: linki social dodane ręcznie w panelu (Branding → Socialne).
 * Koszyk i ustawienia znajdują się w górnej wyspie (Header).
 */
export function FloatingIsland() {
  const { data: socials } = useSocialLinks();

  const links = (socials ?? []).filter((l) => l.url);

  if (!links.length) return null;

  return (
    <div className="fixed right-3 top-1/2 z-40 flex -translate-y-1/2 items-start gap-2">
      <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-surface-deep/80 p-1.5 backdrop-blur-xl glow-ring">
        {links.map((l) => (
          <IconLink key={l.id} href={l.url} label={l.label}>
            {l.image_url ? (
              <img
                src={l.image_url}
                alt={l.label}
                loading="lazy"
                className="h-5 w-5 rounded-md object-cover"
              />
            ) : (
              <span className="text-[9px] font-bold">
                {l.icon || l.label.slice(0, 2).toUpperCase()}
              </span>
            )}
          </IconLink>
        ))}
      </div>
    </div>
  );
}
