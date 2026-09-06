import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSettings } from "@/lib/store";
import { LANGS, flagUrl, useLang } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { SettingsPanel } from "@/components/FloatingIsland";

function HeaderActions() {
  const { items } = useCart();
  const { lang, t } = useLang();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0]!;

  return (
    <div className="relative ml-auto flex items-center gap-1.5 lg:ml-2">
      <Link
        to="/cart"
        aria-label="Koszyk"
        title="Koszyk"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-sm transition-all hover:border-primary hover:glow-ring-strong"
      >
        🛒
        {items.length ? (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-surface-deep">
            {items.length}
          </span>
        ) : null}
      </Link>

      <button
        onClick={() => setSettingsOpen((p) => !p)}
        aria-label={t("ui.settingsAria")}
        title={`Ustawienia · ${current.label}`}
        className={`flex h-9 items-center justify-center gap-1.5 rounded-lg border px-2 text-sm transition-all hover:border-primary hover:glow-ring-strong ${
          settingsOpen
            ? "border-primary bg-secondary glow-ring"
            : "border-border bg-surface"
        }`}
      >
        <img
          src={flagUrl(current.country)}
          alt={current.label}
          width={22}
          height={16}
          className="h-4 w-[22px] rounded-[3px] object-cover shadow-sm"
        />
        <span aria-hidden="true">⚙️</span>
      </button>

      {settingsOpen ? (
        <div className="absolute right-0 top-full z-50 mt-2">
          <SettingsPanel onClose={() => setSettingsOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}

const tabs = [
  { to: "/", key: "nav.finder", icon: "🏠" },
  { to: "/outfity", key: "nav.outfits", icon: "👕" },
  { to: "/sprzedawcy", key: "nav.sellers", icon: "🏬" },
  { to: "/agenci", key: "nav.agents", icon: "🧭" },
  { to: "/promocje", key: "nav.promos", icon: "🔥" },
  { to: "/poradnik", key: "nav.guide", icon: "📘" },
  { to: "/linki", key: "nav.tiktok", icon: "🎵" },
] as const;

export function Header() {
  const { data: settings } = useSettings();
  const { t } = useLang();
  const logo = settings?.["agent_logo_url"];

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6">
      {/* Na desktopie wyspa rozciąga się do szerokości menu (dłuższe tłumaczenia), zamiast nachodzić na logo. */}
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 rounded-2xl border border-border/60 bg-surface-deep/85 px-4 py-3 shadow-lg backdrop-blur-xl glow-ring sm:px-6 lg:w-fit lg:min-w-[min(100%,80rem)] lg:max-w-full">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex shrink-0 items-center gap-3">
            {logo ? (
              <img
                src={logo}
                alt="Logo agenta"
                className="h-10 w-10 rounded-xl object-cover glow-ring"
              />
            ) : null}
            <span className="font-display text-lg font-bold tracking-tight text-gradient-brand">
              PKMREPS
            </span>
          </Link>
          <nav className="ml-auto hidden shrink-0 flex-nowrap items-center justify-end gap-0.5 pl-4 lg:flex">
            {tabs.map((tb) => (
              <Link
                key={tb.to}
                to={tb.to}
                activeOptions={{ exact: tb.to === "/" }}
                className="whitespace-nowrap rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground xl:px-3 xl:text-sm"
                activeProps={{
                  className:
                    "whitespace-nowrap rounded-lg px-2.5 py-2 text-[13px] font-semibold text-primary bg-secondary glow-ring xl:px-3 xl:text-sm",
                }}
              >
                <span aria-hidden="true" className="mr-1.5 hidden xl:inline">
                  {tb.icon}
                </span>
                {t(tb.key)}
              </Link>
            ))}
          </nav>
          <HeaderActions />
        </div>
        <nav className="flex gap-1 overflow-x-auto pb-1 lg:hidden">
          {tabs.map((tb) => (
            <Link
              key={tb.to}
              to={tb.to}
              activeOptions={{ exact: tb.to === "/" }}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground"
              activeProps={{
                className:
                  "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold text-primary bg-secondary",
              }}
            >
              <span aria-hidden="true" className="mr-1">
                {tb.icon}
              </span>
              {t(tb.key)}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
