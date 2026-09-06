import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { panelDb } from "@/lib/panelDb";
import { adminExportProducts, adminLogin, adminSellerUsernames } from "@/lib/secure.functions";
import { clearPanelToken, getPanelToken, setPanelToken } from "@/lib/panelToken";
import { convertLink, extractSourceLink } from "@/lib/linkConverter";
import { ProductCard } from "@/components/ProductCard";
import { ImageUploader } from "@/components/ImageUploader";
import { scrapeProduct } from "@/lib/scrape.functions";
import { DICT, DICT_KEYS, i18nSettingKey } from "@/lib/i18n";
import { DEFAULT_SHIRT_SIZES, isShirt, parseDelimited, rowsToProducts } from "@/lib/csvImport";
import { fetchSheetCsv } from "@/lib/sheet.functions";
import { translateToEnglish } from "@/lib/translate.functions";
import {
  cnyFromPln,
  plnFromCny,
  parseList,
  safeStorage,
  saveSetting,
  sha256Hex,
  useAgents,
  useAgentsRaw,
  useCategories,
  useGuideSteps,
  useProducts,
  usePromos,
  useRefresh,
  useSellers,
  useSettings,
  useShippingRates,
  WEIGHT_STEPS,
  useSocialLinks,
  type Product,
} from "@/lib/store";

const DEFAULT_ADMIN_USER = "replikaenjoyeradmin";
const DEFAULT_ADMIN_HASH = "a90f1de0e4b918c302344237e041c27e7c06dc37f48115be40f528ad5fa90880";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel administratora — PKMREPS" },
      { name: "description", content: "Wewnętrzny panel zarządzania treścią serwisu." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Panel administratora — PKMREPS" },
      { property: "og:description", content: "Wewnętrzny panel zarządzania treścią serwisu." },
    ],
  }),
  component: AdminPage,
});

const input =
  "w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm outline-none focus:border-primary";
const btn =
  "rounded-lg gradient-brand px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-surface-deep";
const btnGhost =
  "rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary";

function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<
    | "branding"
    | "promos"
    | "agents"

    | "categories"
    | "products"
    | "import"
    | "sellers"
    | "shipping"
    | "guide"
    | "lang"
    | "security"

  >("branding");
  const { data: settings } = useSettings();

  useEffect(() => {
    if (safeStorage.get("pkmr_admin") === "1" && getPanelToken()) setAuthed(true);
  }, []);

  const login = async () => {
    setErr("");
    const res = await adminLogin({
      data: { username: user.trim(), passwordHash: await sha256Hex(pass) },
    }).catch(() => ({ ok: false as const }));
    if (!res.ok || !("token" in res)) {
      return;
    }
    setPanelToken(res.token);
    safeStorage.set("pkmr_admin", "1");
    setAuthed(true);
  };

  if (!authed) {
    return (
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(600px_circle_at_50%_20%,color-mix(in_oklab,var(--primary)_25%,transparent),transparent_70%)]" />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void login();
          }}
          className="relative w-full max-w-sm space-y-5 rounded-3xl border border-primary/40 bg-surface/95 p-8 shadow-2xl glow-ring backdrop-blur"
        >
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl gradient-brand text-2xl">
              🔐
            </div>
            <h1 className="text-xl font-black text-gradient-brand">Panel administratora</h1>
            <p className="mt-1 text-xs text-muted-foreground">Zaloguj się, aby zarządzać stroną</p>
          </div>
          <label className="block space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Login
            </span>
            <input
              className={input}
              placeholder="Login"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Hasło
            </span>
            <input
              className={input}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
          </label>
          {err ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {err}
            </p>
          ) : null}
          <button className={`${btn} w-full py-3`}>Zaloguj</button>
          <Link
            to="/"
            className="block text-center text-[11px] font-semibold text-muted-foreground hover:text-primary"
          >
            ← Powrót do strony
          </Link>
        </form>
      </div>
    );
  }

  const tabs = [
    ["branding", "Branding", "🎨"],
    ["promos", "Promocje", "🔥"],
    ["agents", "Agenci", "🤝"],
    ["categories", "Kategorie", "🗂️"],
    ["products", "Produkty", "👟"],
    ["import", "Import CSV", "📥"],
    ["sellers", "Sprzedawcy", "🏪"],
    ["shipping", "Wysyłki", "📦"],
    ["guide", "Poradnik", "📘"],
    ["lang", "Języki", "🌍"],
    ["security", "Bezpieczeństwo", "🛡️"],
  ] as const;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-surface/80 p-5 glow-ring">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-brand text-xl text-surface-deep">
            ⚙️
          </div>
          <div>
            <h1 className="text-2xl font-black text-gradient-brand">Panel administratora</h1>
            <p className="text-[11px] text-muted-foreground">
              Zarządzaj produktami, sprzedawcami i wyglądem strony
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/" className={btnGhost}>
            ← Podgląd strony
          </Link>
          <button
            className={btnGhost}
            onClick={() => {
              clearPanelToken();
              safeStorage.remove("pkmr_admin");
              setAuthed(false);
            }}
          >
            Wyloguj
          </button>
        </div>
      </div>

      <div className="my-6 flex flex-wrap gap-2 rounded-2xl border border-border bg-secondary/30 p-2">
        {tabs.map(([k, label, icon]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              tab === k
                ? "gradient-brand text-surface-deep shadow-lg"
                : "text-muted-foreground hover:bg-surface hover:text-foreground"
            }`}
          >
            <span aria-hidden="true">{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {tab === "branding" && <BrandingTab />}
      {tab === "promos" && <PromosTab />}
      {tab === "agents" && <AgentsTab />}
      {tab === "categories" && <CategoriesTab />}
      {tab === "products" && <ProductsTab />}
      {tab === "import" && <ImportTab />}
      {tab === "sellers" && <SellersTab />}
      {tab === "shipping" && <ShippingTab />}
      {tab === "guide" && <GuideTab />}
      {tab === "lang" && <LangTab />}
      {tab === "security" && <SecurityTab />}

    </div>
  );
}


const settingFields: [string, string][] = [
  ["agent_logo_url", "Logo agenta (URL)"],
  ["primary_agent_url", "Główny link rejestracyjny"],
  ["promo_banner_url", "Baner promo (URL)"],
  ["promo_code", "Kod promocyjny"],
];

function BrandingTab() {
  const { data } = useSettings();
  const refresh = useRefresh();
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  return (
    <section className="rounded-3xl border border-border bg-surface p-6 shadow-lg shadow-black/20">
      <h2 className="mb-4 text-lg font-bold">Branding</h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Social media dodajesz wyłącznie poniżej w „Socialne (dynamiczne)” — nic nie pojawia się tam
        automatycznie.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {settingFields.map(([key, label]) => (
          <label key={key} className="text-xs font-semibold text-muted-foreground">
            {label}
            <input
              className={`${input} mt-1`}
              value={form[key] ?? ""}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </label>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ImageUploader
          urls={form["agent_logo_url"] ? [form["agent_logo_url"]!] : []}
          multiple={false}
          folder="branding"
          label="Logo z urządzenia / galerii"
          onChange={(u) => setForm({ ...form, agent_logo_url: u[0] ?? "" })}
        />
        <ImageUploader
          urls={form["promo_banner_url"] ? [form["promo_banner_url"]!] : []}
          multiple={false}
          folder="branding"
          label="Baner promo z urządzenia / galerii"
          onChange={(u) => setForm({ ...form, promo_banner_url: u[0] ?? "" })}
        />
      </div>
      {form["agent_logo_url"] ? (
        <img
          src={form["agent_logo_url"]}
          alt="Podgląd logo"
          className="mt-5 h-16 w-16 rounded-xl object-cover glow-ring"
        />
      ) : null}
      <button
        className={`${btn} mt-6`}
        onClick={async () => {
          for (const [key] of settingFields) await saveSetting(key, form[key] ?? "");
          await refresh("settings");
        }}
      >
        Zapisz
      </button>

      <SocialLinksManager />
      <BackgroundStickersManager />
    </section>
  );
}

/** Zarządzanie zdjęciami/naklejkami w tle strony (settings.bg_stickers). */
function BackgroundStickersManager() {
  const { data } = useSettings();
  const refresh = useRefresh();
  const [urls, setUrls] = useState<string[]>([]);
  const [manual, setManual] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (data) setUrls((data["bg_stickers"] ?? "").split("\n").map((u) => u.trim()).filter(Boolean));
  }, [data]);

  const save = async (next: string[]) => {
    setUrls(next);
    await saveSetting("bg_stickers", next.join("\n"));
    await refresh("settings");
    setMsg("Zapisano tło.");
  };

  return (
    <div className="mt-8 border-t border-border pt-6">
      <h3 className="mb-1 text-base font-bold">Zdjęcia w tle</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Dodaj własne grafiki — pojawią się jako naklejki w tle całej strony.
      </p>
      <ImageUploader
        urls={urls}
        folder="background"
        label="Dodaj zdjęcia tła z urządzenia"
        onChange={(u) => void save(u)}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          className={`${input} sm:max-w-md`}
          placeholder="Albo wklej adres URL grafiki"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
        />
        <button
          className={btn}
          onClick={() => {
            if (!manual.trim()) return;
            void save([...urls, manual.trim()]);
            setManual("");
          }}
        >
          Dodaj URL
        </button>
      </div>
      {msg ? <p className="mt-3 text-xs text-brand-cyan">{msg}</p> : null}
    </div>
  );
}

function SocialLinksManager() {
  const { data: links } = useSocialLinks();
  const refresh = useRefresh();
  const empty = { label: "", url: "", icon: "", image_url: "", sort_order: 0 };
  const [form, setForm] = useState<typeof empty & { id?: string }>(empty);

  const save = async () => {
    if (!form.label.trim()) return;
    if (form.id) await panelDb.from("social_links").update(form).eq("id", form.id);
    else await panelDb.from("social_links").insert(form);
    setForm(empty);
    await refresh("social_links");
  };

  return (
    <div className="mt-8 border-t border-border pt-6">
      <h3 className="mb-1 text-base font-bold">Socialne (dynamiczne)</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Dodawaj, edytuj i usuwaj dowolne social media — pojawiają się na stronie i w pływającej
        wyspie.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          className={input}
          placeholder="Nazwa (TikTok)"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
        />
        <input
          className={input}
          placeholder="Adres URL"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
        />
        <input
          className={input}
          placeholder="Ikona / skrót (TT)"
          value={form.icon}
          onChange={(e) => setForm({ ...form, icon: e.target.value })}
        />
        <input
          className={input}
          placeholder="Własne zdjęcie / ikona (URL)"
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
        />
        <div className="sm:col-span-2">
          <ImageUploader
            urls={form.image_url ? [form.image_url] : []}
            multiple={false}
            folder="social"
            label="Zdjęcie ikony z urządzenia"
            onChange={(u) => setForm({ ...form, image_url: u[0] ?? "" })}
          />
        </div>
        <div className="flex gap-2">
          <button className={btn} onClick={() => void save()}>
            {form.id ? "Zapisz" : "Dodaj"}
          </button>
          {form.id ? (
            <button className={btnGhost} onClick={() => setForm(empty)}>
              Anuluj
            </button>
          ) : null}
        </div>
      </div>
      <ul className="mt-4 flex flex-wrap gap-2">
        {(links ?? []).map((l) => (
          <li
            key={l.id}
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-xs"
          >
            <span className="flex items-center gap-2 font-semibold">
              {l.image_url ? (
                <img src={l.image_url} alt="" className="h-5 w-5 rounded object-cover" />
              ) : (
                <span>{l.icon || "•"}</span>
              )}
              {l.label}
            </span>
            <button
              className="text-primary"
              onClick={() =>
                setForm({
                  id: l.id,
                  label: l.label,
                  url: l.url,
                  icon: l.icon,
                  image_url: l.image_url ?? "",
                  sort_order: l.sort_order,
                })
              }
            >
              edytuj
            </button>
            <button
              className="text-destructive"
              onClick={async () => {
                await panelDb.from("social_links").delete().eq("id", l.id);
                await refresh("social_links");
              }}
            >
              usuń
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PromosTab() {
  const { data: settings } = useSettings();
  const { data: promos } = usePromos();
  const refresh = useRefresh();
  const empty = { title: "", description: "", image_url: "", link_url: "", sort_order: 0 };
  const [form, setForm] = useState<typeof empty & { id?: string }>(empty);
  const code = settings?.["promo_code"] || "PKMR";

  const save = async () => {
    if (!form.title.trim()) return;
    if (form.id) await panelDb.from("promos").update(form).eq("id", form.id);
    else await panelDb.from("promos").insert(form);
    setForm(empty);
    await refresh("promos");
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-primary/40 bg-surface p-6 glow-ring">
        <h2 className="text-lg font-bold">Kupony i społeczność</h2>
        <p className="mt-2 text-sm">
          Kod promocyjny: <span className="font-mono font-bold text-primary">{code}</span> — $450 w
          kuponach + 40% zniżki przy rejestracji.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Linki social ustawisz w zakładce Branding → „Socialne (dynamiczne)”.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-lg shadow-black/20">
          <h2 className="mb-4 text-lg font-bold">
            {form.id ? "Edytuj promocję" : "Dodaj promocję / ogłoszenie sklepu"}
          </h2>
          <div className="space-y-3">
            <input
              className={input}
              placeholder="Tytuł"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <textarea
              className={`${input} min-h-20`}
              placeholder="Opis / ogłoszenie"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <input
              className={input}
              placeholder="Link rejestracyjny / do promocji"
              value={form.link_url}
              onChange={(e) => setForm({ ...form, link_url: e.target.value })}
            />
            <ImageUploader
              urls={form.image_url ? [form.image_url] : []}
              multiple={false}
              folder="promos"
              label="Grafika promocji z urządzenia"
              onChange={(u) => setForm({ ...form, image_url: u[0] ?? "" })}
            />
            <div className="flex gap-2">
              <button className={btn} onClick={() => void save()}>
                Zapisz
              </button>
              {form.id ? (
                <button className={btnGhost} onClick={() => setForm(empty)}>
                  Anuluj
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-surface p-6 shadow-lg shadow-black/20">
          <h2 className="mb-4 text-lg font-bold">Promocje</h2>
          <ul className="space-y-2">
            {(promos ?? []).map((pr) => (
              <li
                key={pr.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3"
              >
                {pr.image_url ? (
                  <img src={pr.image_url} alt="" className="h-8 w-8 rounded-lg object-cover" />
                ) : null}
                <span className="flex-1 text-sm font-semibold">{pr.title}</span>
                <button
                  className={btnGhost}
                  onClick={() =>
                    setForm({
                      id: pr.id,
                      title: pr.title,
                      description: pr.description,
                      image_url: pr.image_url ?? "",
                      link_url: pr.link_url,
                      sort_order: pr.sort_order,
                    })
                  }
                >
                  Edytuj
                </button>
                <button
                  className={btnGhost}
                  onClick={async () => {
                    await panelDb.from("promos").delete().eq("id", pr.id);
                    await refresh("promos");
                  }}
                >
                  Usuń
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

    </section>
  );
}

function ShippingTab() {
  const { data: rates } = useShippingRates();
  const { data: agents } = useAgents();
  const refresh = useRefresh();
  const empty = {
    agent_name: "",
    line_name: "Standard",
    base_price: 0,
    price_per_kg: 0,
    min_weight: 0.5,
    max_weight: 25,
    sort_order: 0,
    price_table: {} as Record<string, number>,
    discount_percent: 0,
    coupon_code: "",
    signup_url: "",
  };
  const [form, setForm] = useState<typeof empty & { id?: string }>(empty);


  const save = async () => {
    if (!form.agent_name.trim()) return;
    if (form.id) await panelDb.from("shipping_rates").update(form).eq("id", form.id);
    else await panelDb.from("shipping_rates").insert(form);
    setForm(empty);
    await refresh("shipping_rates");
  };

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-lg shadow-black/20">
        <h2 className="mb-1 text-lg font-bold">
          {form.id ? "Edytuj linię wysyłkową" : "Dodaj linię wysyłkową"}
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Koszt = cena bazowa + (cena za kg × waga), w granicach przedziału wagowego.
        </p>
        <div className="mb-4 rounded-xl border border-dashed border-primary/40 bg-secondary/40 p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Agenci wysyłki (nazwa + zdjęcie profilowe)
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            {(agents ?? []).map((a) => (
              <button
                key={a.id}
                onClick={() => setForm({ ...form, agent_name: a.name })}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all ${
                  form.agent_name === a.name
                    ? "border-primary text-primary glow-ring"
                    : "border-border text-muted-foreground hover:border-primary"
                }`}
              >
                {a.avatar_url ? (
                  <img src={a.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <span className="grid h-6 w-6 place-items-center rounded-full border border-border text-[9px]">
                    {a.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                {a.name}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Agentów dodajesz i edytujesz w zakładce „Agenci”.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className={input}
            list="agent-names"
            placeholder="Agent (np. Litbuy)"
            value={form.agent_name}
            onChange={(e) => setForm({ ...form, agent_name: e.target.value })}
          />
          <datalist id="agent-names">
            {(agents ?? []).map((a) => (
              <option key={a.id} value={a.name} />
            ))}
          </datalist>

          <input
            className={input}
            placeholder="Nazwa linii (np. EMS)"
            value={form.line_name}
            onChange={(e) => setForm({ ...form, line_name: e.target.value })}
          />
          <label className="text-xs font-semibold text-muted-foreground">
            Cena bazowa (PLN)
            <input
              className={`${input} mt-1`}
              type="number"
              value={form.base_price}
              onChange={(e) => setForm({ ...form, base_price: Number(e.target.value) })}
            />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Cena za kg (PLN)
            <input
              className={`${input} mt-1`}
              type="number"
              value={form.price_per_kg}
              onChange={(e) => setForm({ ...form, price_per_kg: Number(e.target.value) })}
            />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Waga min (kg)
            <input
              className={`${input} mt-1`}
              type="number"
              value={form.min_weight}
              onChange={(e) => setForm({ ...form, min_weight: Number(e.target.value) })}
            />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Waga max (kg)
            <input
              className={`${input} mt-1`}
              type="number"
              value={form.max_weight}
              onChange={(e) => setForm({ ...form, max_weight: Number(e.target.value) })}
            />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Zniżka / kupon (%)
            <input
              className={`${input} mt-1`}
              type="number"
              min={0}
              max={100}
              value={form.discount_percent}
              onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })}
            />
          </label>
          <label className="text-xs font-semibold text-muted-foreground">
            Kod kuponu
            <input
              className={`${input} mt-1`}
              placeholder="np. PKMR10"
              value={form.coupon_code}
              onChange={(e) => setForm({ ...form, coupon_code: e.target.value })}
            />
          </label>
          <label className="text-xs font-semibold text-muted-foreground sm:col-span-2">
            Link rejestracyjny (ref) — kafelek agenta w kalkulatorze prowadzi tutaj
            <input
              className={`${input} mt-1`}
              placeholder="https://..."
              value={form.signup_url}
              onChange={(e) => setForm({ ...form, signup_url: e.target.value })}
            />
          </label>
        </div>
        <div className="mt-5 rounded-xl border border-dashed border-border bg-secondary/40 p-3">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Ceny wg wagi (0.5 – 25 kg)
          </p>
          <p className="mb-3 text-[11px] text-muted-foreground">
            Wpisz cenę w PLN dla wybranych wag. Puste pola są pomijane — wtedy liczy się wzór
            bazowy.
          </p>
          <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
            {WEIGHT_STEPS.map((w) => (
              <label
                key={w}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2 py-1"
              >
                <span className="w-12 shrink-0 text-[11px] font-bold text-muted-foreground">
                  {w} kg
                </span>
                <input
                  className="w-full bg-transparent text-xs outline-none"
                  type="number"
                  min={0}
                  placeholder="—"
                  value={form.price_table[String(w)] ?? ""}
                  onChange={(e) => {
                    const next = { ...form.price_table };
                    if (e.target.value === "") delete next[String(w)];
                    else next[String(w)] = Number(e.target.value);
                    setForm({ ...form, price_table: next });
                  }}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button className={btn} onClick={() => void save()}>
            Zapisz
          </button>
          {form.id ? (
            <button className={btnGhost} onClick={() => setForm(empty)}>
              Anuluj
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-surface p-6 shadow-lg shadow-black/20">
        <h2 className="mb-4 text-lg font-bold">Stawki wysyłek</h2>
        <ul className="space-y-2">
          {(rates ?? []).map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3"
            >
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  {r.agent_name} · {r.line_name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {r.base_price} PLN + {r.price_per_kg} PLN/kg · {r.min_weight}–{r.max_weight} kg
                  {r.discount_percent ? ` · -${r.discount_percent}%` : ""}
                  {r.coupon_code ? ` (${r.coupon_code})` : ""}
                </p>
              </div>
              <button
                className={btnGhost}
                onClick={() =>
                  setForm({
                    id: r.id,
                    agent_name: r.agent_name,
                    line_name: r.line_name,
                    base_price: r.base_price,
                    price_per_kg: r.price_per_kg,
                    min_weight: r.min_weight,
                    max_weight: r.max_weight,
                    sort_order: r.sort_order,
                    price_table: r.price_table ?? {},
                    discount_percent: r.discount_percent ?? 0,
                    coupon_code: r.coupon_code ?? "",
                    signup_url: r.signup_url ?? "",
                  })
                }
              >
                Edytuj
              </button>
              <button
                className={btnGhost}
                onClick={async () => {
                  await panelDb.from("shipping_rates").delete().eq("id", r.id);
                  await refresh("shipping_rates");
                }}
              >
                Usuń
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function AgentsTab() {
  const { data: agents } = useAgentsRaw();
  const { data: settings } = useSettings();
  const refresh = useRefresh();
  const empty = { name: "", avatar_url: "", referral_url: "", sort_order: 0 };
  const [form, setForm] = useState<typeof empty & { id?: string }>(empty);
  const [template, setTemplate] = useState("");

  const save = async () => {
    if (!form.name) return;
    if (form.id) await panelDb.from("agents").update(form).eq("id", form.id);
    else await panelDb.from("agents").insert(form);
    await saveSetting(`converter_${form.name.trim().toLowerCase()}`, template);
    setForm(empty);
    setTemplate("");
    await refresh("agents");
    await refresh("agents_raw");
    await refresh("settings");
  };


  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-lg shadow-black/20">
        <h2 className="mb-4 text-lg font-bold">{form.id ? "Edytuj agenta" : "Dodaj agenta"}</h2>
        <div className="space-y-3">
          <input
            className={input}
            placeholder="Nazwa"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className={input}
            placeholder="Avatar URL"
            value={form.avatar_url ?? ""}
            onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
          />
          <ImageUploader
            urls={form.avatar_url ? [form.avatar_url] : []}
            multiple={false}
            folder="agents"
            label="Zdjęcie profilowe z urządzenia"
            onChange={(u) => setForm({ ...form, avatar_url: u[0] ?? "" })}
          />
          <input
            className={input}
            placeholder="Link referencyjny"
            value={form.referral_url}
            onChange={(e) => setForm({ ...form, referral_url: e.target.value })}
          />
          <label className="block text-xs font-semibold text-muted-foreground">
            Link konwertera (użyj {"{platform}"} i {"{id}"}), np.
            https://litbuy.com/product?platform={"{platform}"}&amp;id={"{id}"}&amp;ref=PKMR
            <input
              className={`${input} mt-1`}
              placeholder="https://agent.com/product?platform={platform}&id={id}&ref=TWOJ_REF"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            />
          </label>

          <div className="flex gap-2">
            <button className={btn} onClick={() => void save()}>
              Zapisz
            </button>
            {form.id ? (
              <button className={btnGhost} onClick={() => setForm(empty)}>
                Anuluj
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-surface p-6 shadow-lg shadow-black/20">
        <h2 className="mb-4 text-lg font-bold">Agenci</h2>
        <ul className="space-y-2">
          {(agents ?? []).map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3"
            >
              {a.avatar_url ? (
                <img src={a.avatar_url} alt="" className="h-8 w-8 rounded-lg object-cover" />
              ) : null}
              <span className="flex-1 text-sm font-semibold">{a.name}</span>
              <button
                className={btnGhost}
                onClick={() => {
                  setForm({
                    id: a.id,
                    name: a.name,
                    avatar_url: a.avatar_url ?? "",
                    referral_url: a.referral_url,
                    sort_order: a.sort_order,
                  });
                  setTemplate(settings?.[`converter_${a.name.trim().toLowerCase()}`] ?? "");
                }}

              >
                Edytuj
              </button>
              <button
                className={btnGhost}
                onClick={async () => {
                  await panelDb.from("agents").delete().eq("id", a.id);
                  await refresh("agents");
                  await refresh("agents_raw");
                }}
              >
                Usuń
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function CategoriesTab() {
  const { data: categories } = useCategories();
  const refresh = useRefresh();
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const save = async () => {
    if (!name.trim()) return;
    const slug = name.trim().toLowerCase().replace(/\s+/g, "-");
    if (editId) await panelDb.from("categories").update({ name, slug }).eq("id", editId);
    else await panelDb.from("categories").insert({ name, slug, sort_order: 99 });
    setName("");
    setEditId(null);
    await refresh("categories");
  };

  return (
    <section className="rounded-3xl border border-border bg-surface p-6 shadow-lg shadow-black/20">
      <h2 className="mb-4 text-lg font-bold">Zarządzanie kategoriami</h2>
      <div className="flex gap-2">
        <input
          className={input}
          placeholder="Nazwa kategorii"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className={btn} onClick={() => void save()}>
          {editId ? "Zapisz" : "Dodaj"}
        </button>
      </div>
      <ul className="mt-5 flex flex-wrap gap-2">
        {(categories ?? []).map((c) => (
          <li
            key={c.id}
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-xs"
          >
            <span className="font-semibold">{c.name}</span>
            <button
              className="text-primary"
              onClick={() => {
                setEditId(c.id);
                setName(c.name);
              }}
            >
              edytuj
            </button>
            <button
              className="text-destructive"
              onClick={async () => {
                await panelDb.from("categories").delete().eq("id", c.id);
                await refresh("categories");
              }}
            >
              usuń
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Ile produktów pokazujemy naraz na liście w panelu. */
const ADMIN_PAGE_SIZE = 50;

/** Okrągły przełącznik on/off dla flag produktu. */
function ToggleChip({
  icon,
  label,
  hint,
  checked,
  onToggle,
}: {
  icon: string;
  label: string;
  hint?: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onToggle}
      className={`flex items-center gap-2 rounded-lg border p-2 text-left transition-all duration-200 active:scale-[0.97] ${
        checked
          ? "border-primary/60 bg-primary/10"
          : "border-border bg-secondary/40 hover:border-primary/40"
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
          checked
            ? "border-primary bg-primary text-surface"
            : "border-muted-foreground/40 bg-transparent text-transparent hover:border-primary/60"
        }`}
      >
        <svg
          className="h-3 w-3"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      <span className="min-w-0">
        <span className={`block text-[11px] font-bold ${checked ? "text-primary" : "text-foreground"}`}>
          {icon} {label}
        </span>
        {hint ? <span className="block text-[10px] text-muted-foreground">{hint}</span> : null}
      </span>
    </button>
  );
}

function ProductsTab() {

  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const { data: agents } = useAgents();
  const { data: settings } = useSettings();
  const { data: sellers } = useSellers();
  const refresh = useRefresh();

  const empty = {
    title: "",
    category: "",
    price: "" as string,

    image_url: "",
    qc_url: "",
    quality: "Best",
    batch: "",
    sizes: "",
    images: "",
    qc_images: "",
    seller_id: "",
    tiktok_url: "",
    display_order: 0,
    promoted: false,
    for_women: false,
    verified: false,
    show_on_home: false,
    views: 0,
    store_url: "",
    store_name: "",
    agent_links: {} as Record<string, string>,
  };
  const [form, setForm] = useState<typeof empty & { id?: string }>(empty);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scrapeMsg, setScrapeMsg] = useState("");
  const [cny, setCny] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(ADMIN_PAGE_SIZE);
  // Optymistyczna kolejność — lista przestawia się natychmiast, zapis leci w tle.
  const [orderIds, setOrderIds] = useState<string[] | null>(null);

  const ordered = useMemo(() => {
    const list = products ?? [];
    if (!orderIds) return list;
    const map = new Map(list.map((p) => [p.id, p]));
    const out = orderIds.map((id) => map.get(id)).filter(Boolean) as Product[];
    const seen = new Set(orderIds);
    for (const p of list) if (!seen.has(p.id)) out.push(p);
    return out;
  }, [products, orderIds]);

  const q = search.trim().toLowerCase();
  /** Produkt bez działającego zdjęcia — trafia na samą górę listy do poprawy. */
  const brokenImage = (p: Product) =>
    !p.image_url || p.image_url.startsWith("/api/public/product-image");

  const matched = useMemo(() => {
    const list = ordered.filter((p) =>
      q
        ? [p.title, p.category, p.batch, p.store_name].some((v) =>
            (v ?? "").toLowerCase().includes(q),
          )
        : true,
    );
    if (orderIds) return list;
    // Stabilne sortowanie: najpierw produkty bez zdjęcia.
    return list
      .map((p, i) => ({ p, i }))
      .sort((a, b) => Number(brokenImage(b.p)) - Number(brokenImage(a.p)) || a.i - b.i)
      .map((x) => x.p);
  }, [ordered, q, orderIds]);

  useEffect(() => {
    setLimit(ADMIN_PAGE_SIZE);
  }, [q]);

  const visible = matched.slice(0, limit);
  const remaining = matched.length - visible.length;




  /** Zbuduj komplet linków agentów z dowolnego linku źródłowego / agenta. */
  const buildAgentLinks = (
    sourceRaw: string,
    current: Record<string, string> = {},
  ): Record<string, string> => {
    const parsed = extractSourceLink(sourceRaw);
    if (!parsed) return current;
    const next = { ...current };
    for (const a of agents ?? []) {
      const tpl = settings?.[`converter_${a.name.trim().toLowerCase()}`];
      const link = convertLink(parsed.url, a.name, tpl);
      if (link && link !== parsed.url) next[a.name] = link;
    }
    return next;
  };

  /** Przenieś przeciągany produkt na pozycję docelową: najpierw UI, potem zapis. */
  const reorder = async (targetId: string) => {
    const list = [...ordered];
    const from = list.findIndex((p) => p.id === dragId);
    const to = list.findIndex((p) => p.id === targetId);
    setDragId(null);
    setOverId(null);
    if (from < 0 || to < 0 || from === to) return;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved!);
    setOrderIds(list.map((p) => p.id));

    // Zapisujemy tylko wiersze, których pozycja faktycznie się zmieniła.
    const lo = Math.min(from, to);
    const hi = Math.max(from, to);
    for (let i = lo; i <= hi; i++) {
      const p = list[i]!;
      if (p.display_order === i) continue;
      await panelDb.from("products").update({ display_order: i }).eq("id", p.id);
    }
    await refresh("products");
    setOrderIds(null);
  };

  const runScrape = async () => {
    setScrapeMsg("Pobieram dane...");
    try {
      const res = await scrapeProduct({ data: { url: scrapeUrl } });
      if (!res.ok) {
        setScrapeMsg("Nie udało się pobrać danych — uzupełnij ręcznie.");
        return;
      }
      setForm((f) => ({
        ...f,
        title: f.title || res.title,
        image_url: f.image_url || (res.images[0] ?? ""),
        images: f.images || res.images.slice(1).join(", "),
        qc_images: f.qc_images || res.qcImages.join(", "),
        sizes: f.sizes || res.sizes.join(", "),
        price: f.price || String(Math.round(plnFromCny(res.priceCny) * 100) / 100),
        agent_links: buildAgentLinks(scrapeUrl, f.agent_links),
      }));
      setScrapeMsg("Dane pobrane — sprawdź i zapisz.");
    } catch {
      setScrapeMsg("Nie udało się pobrać danych — uzupełnij ręcznie.");
    }
  };

  const save = async () => {
    if (!form.title) return;
    // Uzupełnij brakujących agentów na podstawie dowolnego znanego linku produktu.
    const source =
      [form.store_url, ...Object.values(form.agent_links)].find((u) => extractSourceLink(u)) ?? "";
    const agentLinks = source ? buildAgentLinks(source, form.agent_links) : form.agent_links;
    const enteredSizes = parseList(form.sizes);
    const payload = {
      title: form.title,
      category: form.category,
      price: Number(form.price) || 0,
      image_url: form.image_url,
      qc_url: form.qc_url,
      quality: form.quality,
      batch: form.batch,
      sizes: enteredSizes.length || !isShirt(form.title, form.category) ? enteredSizes : DEFAULT_SHIRT_SIZES,
      images: parseList(form.images),
      qc_images: parseList(form.qc_images),
      seller_id: form.seller_id || null,
      tiktok_url: form.tiktok_url || null,
      display_order: Number(form.display_order) || 0,
      promoted: form.promoted,
      for_women: form.for_women,
      verified: form.verified,
      show_on_home: form.show_on_home,
      price_cny: Math.round(cnyFromPln(Number(form.price) || 0) * 100) / 100,
      views: Number(form.views) || 0,
      store_url: form.store_url,
      store_name: form.store_name,
      agent_links: agentLinks,
    };
    if (form.id) await panelDb.from("products").update(payload).eq("id", form.id);
    else await panelDb.from("products").insert(payload);
    setForm(empty);
    await refresh("products");
  };

  const preview: Product = {
    id: "preview",
    verified: form.verified,
    show_on_home: form.show_on_home,
    title: form.title || "Nazwa produktu",
    category: form.category,
    price: Number(form.price) || 0,
    image_url: form.image_url || null,
    qc_url: form.qc_url || null,
    quality: form.quality,
    sizes: parseList(form.sizes),
    images: parseList(form.images),
    qc_images: parseList(form.qc_images),
    views: Number(form.views) || 0,
    agent_links: form.agent_links,
    batch: form.batch,
    display_order: Number(form.display_order) || 0,
    tiktok_url: form.tiktok_url || null,
    price_cny: cnyFromPln(Number(form.price) || 0),
    promoted: form.promoted,
    for_women: form.for_women,
    store_url: form.store_url ?? "",
    store_name: form.store_name ?? "",
  };

  return (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-lg shadow-black/20">
          <h2 className="mb-4 text-lg font-bold">
            {form.id ? "Edytuj produkt" : "Dodaj produkt"}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className={input}
              placeholder="Tytuł"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <select
              className={input}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="">— kategoria —</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              className={input}
              type="text"
              inputMode="decimal"
              placeholder="Cena PLN"
              value={form.price}
              onChange={(e) => {
                setCny("");
                setForm({ ...form, price: e.target.value.replace(",", ".") });
              }}
            />
            <input
              className={input}
              placeholder="Quality Tier (Best / Budget / Random)"
              value={form.quality}
              onChange={(e) => setForm({ ...form, quality: e.target.value })}
            />
            <input
              className={input}
              placeholder="Batch (GX, M, PK, MOMO)"
              value={form.batch}
              onChange={(e) => setForm({ ...form, batch: e.target.value })}
            />
            <label className="text-xs font-semibold text-muted-foreground">
              Cena CNY (¥) — przelicza PLN
              <input
                className={`${input} mt-1`}
                type="text"
                inputMode="decimal"
                value={
                  cny !== ""
                    ? cny
                    : form.price
                      ? String(Math.round(cnyFromPln(Number(form.price) || 0) * 100) / 100)
                      : ""
                }
                onChange={(e) => {
                  const v = e.target.value.replace(",", ".");
                  setCny(v);
                  setForm({
                    ...form,
                    price: v === "" ? "" : String(Math.round(plnFromCny(Number(v) || 0) * 100) / 100),
                  });
                }}
              />
            </label>

            <input
              className={input}
              placeholder="Link do filmu TikTok (opcjonalnie)"
              value={form.tiktok_url}
              onChange={(e) => setForm({ ...form, tiktok_url: e.target.value })}
            />
            <input
              className={input}
              type="number"
              placeholder="Kolejność wyświetlania"
              value={form.display_order}
              onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
            />
            <input
              className={input}
              placeholder="Zdjęcie URL"
              value={form.image_url ?? ""}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            />
            <input
              className={input}
              placeholder="Link do sklepu Yupoo (zamiast agenta, opcjonalnie)"
              value={form.store_url}
              onChange={(e) => setForm({ ...form, store_url: e.target.value })}
            />
            <input
              className={input}
              placeholder="Nazwa sklepu na przycisku (np. MOMO Yupoo)"
              value={form.store_name}
              onChange={(e) => setForm({ ...form, store_name: e.target.value })}
            />
            <input
              className={input}
              placeholder="Link do zdjęć QC"
              value={form.qc_url ?? ""}
              onChange={(e) => setForm({ ...form, qc_url: e.target.value })}
            />
            <input
              className={input}
              placeholder="Rozmiary po przecinku (S, M, L, XL)"
              value={form.sizes}
              onChange={(e) => setForm({ ...form, sizes: e.target.value })}
            />
            <input
              className={input}
              placeholder="Dodatkowe zdjęcia / kolorystyki po przecinku (URL, URL)"
              value={form.images}
              onChange={(e) => setForm({ ...form, images: e.target.value })}
            />
            <input
              className={input}
              placeholder="Zdjęcia QC po przecinku (URL, URL)"
              value={form.qc_images}
              onChange={(e) => setForm({ ...form, qc_images: e.target.value })}
            />
            <select
              className={input}
              value={form.seller_id}
              onChange={(e) => setForm({ ...form, seller_id: e.target.value })}
            >
              <option value="">— sprzedawca (opcjonalnie) —</option>
              {(sellers ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <ImageUploader
              urls={form.image_url ? [form.image_url] : []}
              multiple={false}
              folder="products"
              label="Zdjęcie główne z urządzenia"
              onChange={(u) => setForm({ ...form, image_url: u[0] ?? "" })}
            />
            <ImageUploader
              urls={parseList(form.images)}
              folder="products"
              onChange={(u) => setForm({ ...form, images: u.join(", ") })}
            />
          </div>

          <div className="mt-4 rounded-xl border border-dashed border-border bg-secondary/40 p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Pobierz dane z linku
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                className={`${input} flex-1`}
                placeholder="Wklej link do produktu (Taobao, Weidian, ...)"
                value={scrapeUrl}
                onChange={(e) => setScrapeUrl(e.target.value)}
              />
              <button className={btn} onClick={() => void runScrape()}>
                Pobierz
              </button>
            </div>
            {scrapeMsg ? <p className="mt-2 text-xs text-brand-cyan">{scrapeMsg}</p> : null}
          </div>

          <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Oznaczenia produktu
          </h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <ToggleChip
              icon="🛡"
              label="Zweryfikowany"
              hint="Znaczek w rogu produktu"
              checked={form.verified}
              onToggle={() => setForm({ ...form, verified: !form.verified })}
            />
            <ToggleChip
              icon="🔥"
              label="Promowany"
              hint="Wyżej na liście"
              checked={form.promoted}
              onToggle={() => setForm({ ...form, promoted: !form.promoted })}
            />
            <ToggleChip
              icon="👛"
              label="Girl Zone"
              hint="Produkt damski"
              checked={form.for_women}
              onToggle={() => setForm({ ...form, for_women: !form.for_women })}
            />
            <ToggleChip
              icon="🏠"
              label="Strona główna"
              hint="Produkt sprzedawcy też na głównej"
              checked={form.show_on_home}
              onToggle={() => setForm({ ...form, show_on_home: !form.show_on_home })}
            />
          </div>

          <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Statystyki (tylko Super Admin)
          </h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-4">
            <label className="text-xs font-semibold text-muted-foreground">
              👁 Wyświetlenia
              <input
                className={`${input} mt-1`}
                type="number"
                value={form.views}
                onChange={(e) => setForm({ ...form, views: Number(e.target.value) })}
              />
            </label>
          </div>



          <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Linki produktu u agentów
          </h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {(agents ?? []).map((a) => (
              <input
                key={a.id}
                className={input}
                placeholder={`Link ${a.name}`}
                value={form.agent_links[a.name] ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    agent_links: { ...form.agent_links, [a.name]: e.target.value },
                  })
                }
              />
            ))}
          </div>

          <div className="mt-5 flex gap-2">
            <button className={btn} onClick={() => void save()}>
              Zapisz produkt
            </button>
            {form.id ? (
              <button className={btnGhost} onClick={() => setForm(empty)}>
                Anuluj
              </button>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-surface p-6 shadow-lg shadow-black/20">
          <h2 className="mb-4 text-lg font-bold">Podgląd na żywo</h2>
          <ProductCard product={preview} />
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-surface p-6 shadow-lg shadow-black/20">
        <h2 className="mb-1 text-lg font-bold">Wszystkie produkty</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Przeciągnij kafelek myszką (uchwyt ⠿), aby zmienić kolejność — zapisuje się od razu.
        </p>
        <input
          className={`${input} mb-4`}
          placeholder="🔎 Szukaj produktu (nazwa, kategoria, batch, sklep)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <p className="mb-3 text-xs text-muted-foreground">
          Pokazano {visible.length} z {matched.length}
        </p>
        <ul className="space-y-2">
          {visible.map((p) => (

            <li
              key={p.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                setDragId(p.id);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (overId !== p.id) setOverId(p.id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                void reorder(p.id);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              className={`flex cursor-grab items-center gap-3 rounded-lg border bg-secondary p-3 transition-[border-color,transform,opacity] duration-150 will-change-transform active:cursor-grabbing ${
                dragId === p.id
                  ? "scale-[0.99] border-primary opacity-50"
                  : overId === p.id && dragId
                    ? "border-primary translate-y-0.5"
                    : "border-border"
              }`}
            >
              <span className="select-none text-base text-muted-foreground">⠿</span>

              {p.image_url ? (
                <img src={p.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
              ) : null}
              <span className="flex-1 text-sm font-semibold">{p.title}</span>
              <span className="text-xs text-muted-foreground">{p.category}</span>
              <button
                className={btnGhost}
                aria-label="W górę"
                onClick={async () => {
                  await panelDb
                    .from("products")
                    .update({ display_order: (p.display_order ?? 0) - 1 })
                    .eq("id", p.id);
                  await refresh("products");
                }}
              >
                ↑
              </button>
              <button
                className={btnGhost}
                aria-label="W dół"
                onClick={async () => {
                  await panelDb
                    .from("products")
                    .update({ display_order: (p.display_order ?? 0) + 1 })
                    .eq("id", p.id);
                  await refresh("products");
                }}
              >
                ↓
              </button>
              <button
                className={btnGhost}
                onClick={() => {
                  globalThis.scrollTo?.({ top: 0, behavior: "smooth" });
                  setForm({
                    id: p.id,
                    title: p.title,
                    category: p.category,
                    price: String(p.price),
                    image_url: p.image_url ?? "",
                    qc_url: p.qc_url ?? "",
                    quality: p.quality,
                    batch: p.batch ?? "",
                    sizes: (p.sizes ?? []).join(", "),
                    images: (p.images ?? []).join(", "),
                    qc_images: (p.qc_images ?? []).join(", "),
                    seller_id: p.seller_id ?? "",
                    tiktok_url: p.tiktok_url ?? "",
                    display_order: p.display_order ?? 0,
                    promoted: p.promoted,
                    for_women: p.for_women,
                    verified: p.verified,
                    show_on_home: p.show_on_home,
                    views: p.views,
                    store_url: p.store_url ?? "",
                    store_name: p.store_name ?? "",
                    agent_links: p.agent_links ?? {},
                  });
                }}
              >
                Edytuj
              </button>
              <button
                className={btnGhost}
                onClick={async () => {
                  await panelDb.from("products").delete().eq("id", p.id);
                  await refresh("products");
                }}
              >
                Usuń
              </button>
            </li>
          ))}
        </ul>
        {remaining > 0 ? (
          <button
            className={`${btn} mt-4 w-full`}
            onClick={() => setLimit((l) => l + ADMIN_PAGE_SIZE)}
          >
            Załaduj więcej ({Math.min(ADMIN_PAGE_SIZE, remaining)})
          </button>
        ) : null}
      </div>

    </section>
  );
}

function SellersTab() {
  const { data: sellers } = useSellers();
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  useEffect(() => {
    adminSellerUsernames({ data: { token: getPanelToken() } })
      .then((r) => setUsernames(r.usernames))
      .catch(() => setUsernames({}));
  }, [sellers]);
  const { data: products } = useProducts();
  const refresh = useRefresh();
  const empty = {
    name: "",
    slug: "",
    username: "",
    password: "",
    logo_url: "",
    banner_url: "",
    description: "",
    external_url: "",
    active: true,
  };
  const [form, setForm] = useState<typeof empty & { id?: string }>(empty);
  const [msg, setMsg] = useState("");

  const save = async () => {
    if (!form.name.trim() || !form.username.trim()) return;
    const slug =
      (form.slug || form.name).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const base = {
      name: form.name.trim(),
      slug,
      username: form.username.trim(),
      logo_url: form.logo_url,
      banner_url: form.banner_url,
      description: form.description,
      external_url: form.external_url,
      active: form.active,
    };
    const withPass = form.password
      ? { ...base, password_hash: await sha256Hex(form.password) }
      : base;
    const { error } = form.id
      ? await panelDb.from("sellers").update(withPass).eq("id", form.id)
      : await panelDb.from("sellers").insert(withPass);
    setMsg(error ? "Nie udało się zapisać sprzedawcy." : "Zapisano.");
    if (!error) setForm(empty);
    await refresh("sellers");
  };

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-lg shadow-black/20">
        <h2 className="mb-4 text-lg font-bold">
          {form.id ? "Edytuj sprzedawcę" : "Dodaj sprzedawcę"}
        </h2>
        <div className="space-y-3">
          <input
            className={input}
            placeholder="Nazwa sklepu"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className={input}
            placeholder="Slug URL (np. momo-store)"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
          <input
            className={input}
            placeholder="Login sprzedawcy"
            autoCapitalize="none"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <input
            className={input}
            type="password"
            placeholder={form.id ? "Nowe hasło (opcjonalnie)" : "Hasło"}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <input
            className={input}
            placeholder="Zewnętrzny link sklepu (Yupoo itp.)"
            value={form.external_url}
            onChange={(e) => setForm({ ...form, external_url: e.target.value })}
          />
          <textarea
            className={`${input} min-h-20`}
            placeholder="Opis sklepu"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <ImageUploader
              urls={form.logo_url ? [form.logo_url] : []}
              multiple={false}
              folder="stores"
              label="Logo sklepu"
              onChange={(u) => setForm({ ...form, logo_url: u[0] ?? "" })}
            />
            <ImageUploader
              urls={form.banner_url ? [form.banner_url] : []}
              multiple={false}
              folder="stores"
              label="Baner sklepu"
              onChange={(u) => setForm({ ...form, banner_url: u[0] ?? "" })}
            />
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Sklep aktywny
          </label>
          {msg ? <p className="text-xs text-brand-cyan">{msg}</p> : null}
          <div className="flex gap-2">
            <button className={btn} onClick={() => void save()}>
              Zapisz
            </button>
            {form.id ? (
              <button className={btnGhost} onClick={() => setForm(empty)}>
                Anuluj
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-surface p-6 shadow-lg shadow-black/20">
        <h2 className="mb-4 text-lg font-bold">Sprzedawcy</h2>
        <ul className="space-y-2">
          {(sellers ?? []).map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3"
            >
              {s.logo_url ? (
                <img src={s.logo_url} alt="" className="h-8 w-8 rounded-lg object-cover" />
              ) : null}
              <div className="flex-1">
                <p className="text-sm font-semibold">{s.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  /sklep/{s.slug} · {(products ?? []).filter((p) => p.seller_id === s.id).length}{" "}
                  produktów {s.active ? "" : "· nieaktywny"}
                </p>
              </div>
              <button
                className={btnGhost}
                onClick={() =>
                  setForm({
                    id: s.id,
                    name: s.name,
                    slug: s.slug,
                    username: usernames[s.id] ?? "",
                    password: "",
                    logo_url: s.logo_url ?? "",
                    banner_url: s.banner_url ?? "",
                    description: s.description,
                    external_url: s.external_url ?? "",
                    active: s.active,
                  })
                }
              >
                Edytuj
              </button>
              <button
                className={btnGhost}
                onClick={async () => {
                  await panelDb.from("sellers").delete().eq("id", s.id);
                  await refresh("sellers");
                  await refresh("products");
                }}
              >
                Usuń
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function GuideTab() {
  const { data: steps } = useGuideSteps();
  const refresh = useRefresh();
  const empty = { step_number: 1, title: "", description: "", image_url: "" };
  const [form, setForm] = useState<typeof empty & { id?: string }>(empty);

  const save = async () => {
    if (!form.title) return;
    if (form.id) await panelDb.from("guide_steps").update(form).eq("id", form.id);
    else await panelDb.from("guide_steps").insert(form);
    setForm(empty);
    await refresh("guide_steps");
  };

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-lg shadow-black/20">
        <h2 className="mb-4 text-lg font-bold">{form.id ? "Edytuj krok" : "Dodaj krok"}</h2>
        <div className="space-y-3">
          <input
            className={input}
            type="number"
            placeholder="Numer kroku"
            value={form.step_number}
            onChange={(e) => setForm({ ...form, step_number: Number(e.target.value) })}
          />
          <input
            className={input}
            placeholder="Tytuł"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            className={`${input} min-h-28`}
            placeholder="Opis"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            className={input}
            placeholder="Grafika URL"
            value={form.image_url ?? ""}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          />
          <ImageUploader
            urls={form.image_url ? [form.image_url] : []}
            multiple={false}
            folder="guide"
            label="Grafika z urządzenia / galerii"
            onChange={(u) => setForm({ ...form, image_url: u[0] ?? "" })}
          />

          <div className="flex gap-2">
            <button className={btn} onClick={() => void save()}>
              Zapisz
            </button>
            {form.id ? (
              <button className={btnGhost} onClick={() => setForm(empty)}>
                Anuluj
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-surface p-6 shadow-lg shadow-black/20">
        <h2 className="mb-4 text-lg font-bold">Kroki poradnika</h2>
        <ul className="space-y-2">
          {(steps ?? []).map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3"
            >
              <span className="text-primary">#{s.step_number}</span>
              <span className="flex-1 text-sm font-semibold">{s.title}</span>
              <button
                className={btnGhost}
                onClick={() =>
                  setForm({
                    id: s.id,
                    step_number: s.step_number,
                    title: s.title,
                    description: s.description,
                    image_url: s.image_url ?? "",
                  })
                }
              >
                Edytuj
              </button>
              <button
                className={btnGhost}
                onClick={async () => {
                  await panelDb.from("guide_steps").delete().eq("id", s.id);
                  await refresh("guide_steps");
                }}
              >
                Usuń
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SecurityTab() {
  const { data: settings } = useSettings();
  const refresh = useRefresh();
  const [username, setUsername] = useState("");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (settings) setUsername(settings["admin_username"] || DEFAULT_ADMIN_USER);
  }, [settings]);

  const submit = async () => {
    setMsg("");
    setErr("");
    const expectedHash = settings?.["admin_password_hash"] || DEFAULT_ADMIN_HASH;
    if ((await sha256Hex(current)) !== expectedHash) {
      setErr("Aktualne hasło jest nieprawidłowe.");
      return;
    }
    if (!username.trim()) {
      setErr("Login nie może być pusty.");
      return;
    }
    if (next && next.length < 8) {
      setErr("Nowe hasło musi mieć co najmniej 8 znaków.");
      return;
    }
    if (next !== confirm) {
      setErr("Nowe hasła nie są identyczne.");
      return;
    }
    await saveSetting("admin_username", username.trim());
    if (next) await saveSetting("admin_password_hash", await sha256Hex(next));
    setCurrent("");
    setNext("");
    setConfirm("");
    await refresh("settings");
    setMsg("Dane logowania zostały zaktualizowane.");
  };

  return (
    <section className="max-w-xl rounded-2xl border border-border bg-surface p-6">
      <h2 className="mb-1 text-lg font-bold">Bezpieczeństwo / Konto</h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Zmień login i hasło do panelu. Zmiany zapisywane są w bazie danych.
      </p>
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-muted-foreground">
          Login
          <input
            className={`${input} mt-1`}
            value={username}
            autoCapitalize="none"
            autoCorrect="off"
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label className="block text-xs font-semibold text-muted-foreground">
          Aktualne hasło
          <input
            className={`${input} mt-1`}
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </label>
        <label className="block text-xs font-semibold text-muted-foreground">
          Nowe hasło (opcjonalnie)
          <input
            className={`${input} mt-1`}
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </label>
        <label className="block text-xs font-semibold text-muted-foreground">
          Powtórz nowe hasło
          <input
            className={`${input} mt-1`}
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>
        {err ? <p className="text-xs text-destructive">{err}</p> : null}
        {msg ? <p className="text-xs text-brand-cyan">{msg}</p> : null}
        <button className={btn} onClick={() => void submit()}>
          Zapisz dane logowania
        </button>
      </div>
    </section>
  );
}

/** Edytor tekstów PL/EN — nadpisuje domyślny słownik oraz nazwy kategorii. */
function LangTab() {
  const { data: settings } = useSettings();
  const { data: categories } = useCategories();
  const refresh = useRefresh();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  const rows: { key: string; label: string; defPl: string; defEn: string }[] = [
    ...DICT_KEYS.map((k) => ({
      key: k,
      label: k,
      defPl: DICT[k]!.pl,
      defEn: DICT[k]!.en,
    })),
    ...(categories ?? []).map((c) => ({
      key: `cat.${c.name}`,
      label: `Kategoria: ${c.name}`,
      defPl: c.name,
      defEn: c.name,
    })),
  ];

  const valueOf = (lang: "pl" | "en", key: string, fallback: string) => {
    const sk = i18nSettingKey(lang, key);
    return draft[sk] ?? settings?.[sk] ?? fallback;
  };

  const saveAll = async () => {
    setMsg("Zapisuję...");
    await Promise.all(Object.entries(draft).map(([k, v]) => saveSetting(k, v)));
    setDraft({});
    await refresh("settings");
    setMsg("Zapisano tłumaczenia.");
  };

  /** Tłumaczy wszystkie polskie teksty na angielski i od razu zapisuje. */
  const autoTranslate = async () => {
    setMsg("Tłumaczę PL → EN...");
    try {
      const items = rows.map((r) => ({ key: r.key, text: valueOf("pl", r.key, r.defPl) }));
      const { translations } = await translateToEnglish({ data: { items } });
      const next: Record<string, string> = { ...draft };
      for (const [key, en] of Object.entries(translations)) next[i18nSettingKey("en", key)] = en;
      await Promise.all(Object.entries(next).map(([k, v]) => saveSetting(k, v)));
      setDraft({});
      await refresh("settings");
      setMsg(`Przetłumaczono i zapisano ${Object.keys(translations).length} tekstów.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Tłumaczenie nie powiodło się.");
    }
  };

  return (
    <section className="rounded-3xl border border-border bg-surface p-6 shadow-lg shadow-black/20">
      <h2 className="mb-1 text-lg font-bold">Języki (PL / EN)</h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Ustaw własne teksty dla obu wersji językowych — nagłówki, nawigacja i nazwy kategorii.
      </p>
      <button className={`${btnGhost} mb-4`} onClick={() => void autoTranslate()}>
        ✨ Przetłumacz automatycznie PL → EN
      </button>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.key} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr] sm:items-center">
            <span className="text-[11px] font-semibold text-muted-foreground">{r.label}</span>
            <input
              className={input}
              placeholder="Polski"
              value={valueOf("pl", r.key, r.defPl)}
              onChange={(e) =>
                setDraft({ ...draft, [i18nSettingKey("pl", r.key)]: e.target.value })
              }
            />
            <input
              className={input}
              placeholder="English"
              value={valueOf("en", r.key, r.defEn)}
              onChange={(e) =>
                setDraft({ ...draft, [i18nSettingKey("en", r.key)]: e.target.value })
              }
            />
          </div>
        ))}
      </div>
      {msg ? <p className="mt-3 text-xs text-brand-cyan">{msg}</p> : null}
      <button className={`${btn} mt-5`} onClick={() => void saveAll()}>
        Zapisz teksty
      </button>
    </section>
  );
}

/** Masowy import produktów z CSV / TSV / Google Sheets. */
/** Zamienia listę produktów na plik CSV do pobrania. */
function productsToCsv(products: Product[]): string {
  const cols = [
    "id","title","category","price","price_cny","image_url","images","qc_url","store_url",
    "store_name","quality","batch","sizes","tiktok_url","views","promoted","for_women",
    "verified","show_on_home","seller_id","display_order","agent_links",
  ] as const;
  const cell = (v: unknown) => {
    const s = Array.isArray(v)
      ? v.join(", ")
      : v && typeof v === "object"
        ? JSON.stringify(v)
        : v == null
          ? ""
          : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [cols.join(",")];
  for (const p of products) {
    lines.push(cols.map((c) => cell((p as unknown as Record<string, unknown>)[c])).join(","));
  }
  return lines.join("\n");
}

function ImportTab() {
  const { data: agents } = useAgents();
  const { data: sellers } = useSellers();
  const { data: allProducts } = useProducts();
  const [sellerId, setSellerId] = useState("");
  const [showOnHome, setShowOnHome] = useState(false);
  const refresh = useRefresh();

  const downloadCsv = async () => {
    setMsg("Przygotowuję pełny eksport...");
    const exported = await adminExportProducts({ data: { token: getPanelToken() } });
    const csv = productsToCsv(exported as Product[]);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `produkty-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg(`Pobrano ${exported.length} produktów wraz z linkami i zdjęciami.`);
  };
  const [text, setText] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const preview = useMemo(() => rowsToProducts(parseDelimited(text)), [text]);

  const loadSheet = async () => {
    setBusy(true);
    setMsg("Pobieram arkusz...");
    try {
      const { csv } = await fetchSheetCsv({ data: { url: sheetUrl.trim() } });
      setText(csv);
      setMsg("Arkusz wczytany — sprawdź podgląd poniżej.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Nie udało się pobrać arkusza.");
    } finally {
      setBusy(false);
    }
  };

  const importAll = async () => {
    if (!preview.length) return;
    setBusy(true);
    setMsg(`Importuję ${preview.length} produktów...`);
    try {
      const rows = preview.map((p, i) => {
        const links: Record<string, string> = { ...p.agent_links };
        const src = extractSourceLink(p.store_url);
        if (src) {
          for (const a of agents ?? []) {
            const url = convertLink(src.url, a.name, a.referral_url);
            if (url) links[a.name] = url;
          }
        }
        return {
          ...p,
          agent_links: links,
          display_order: i,
          seller_id: sellerId || null,
          show_on_home: sellerId ? showOnHome : true,
        };
      });
      for (let i = 0; i < rows.length; i += 200) {
        const { error } = await panelDb.from("products").insert(rows.slice(i, i + 200));
        if (error) throw error;
      }
      await refresh("products");
      setMsg(`Zaimportowano ${rows.length} produktów.`);
      setText("");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Import nie powiódł się.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-3xl border border-border bg-surface p-6 shadow-lg shadow-black/20">
      <h2 className="mb-1 text-lg font-bold">Szybki import produktów</h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Kolumny (nagłówek pierwszego wiersza): <b>title, category, price, price_cny, image_url,
        images, qc_url, store_url, store_name, quality, batch, sizes, tiktok_url, agent_links</b>. Kilka zdjęć /
        rozmiarów oddziel przecinkiem. Działa też po polsku (nazwa, kategoria, cena, zdjecia...).
      </p>

      <div className="mb-4 grid gap-3 rounded-xl border border-dashed border-primary/40 bg-secondary/40 p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
        <label className="text-xs font-semibold text-muted-foreground">
          Przypisz import do sprzedawcy
          <select
            className={`${input} mt-1`}
            value={sellerId}
            onChange={(e) => setSellerId(e.target.value)}
          >
            <option value="">Strona główna (bez sprzedawcy)</option>
            {(sellers ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <input
            type="checkbox"
            disabled={!sellerId}
            checked={showOnHome}
            onChange={(e) => setShowOnHome(e.target.checked)}
          />
          Pokaż też na stronie głównej
        </label>
        <button className={btnGhost} onClick={() => void downloadCsv()}>
          ⬇ Pobierz CSV produktów ({(allProducts ?? []).length})
        </button>
      </div>

      <label
        className="mb-3 flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-primary/50 bg-secondary/40 p-6 text-center transition-colors hover:border-primary hover:bg-secondary/70"
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) setText(await file.text());
        }}
      >
        <span className="text-2xl">📄</span>
        <span className="text-sm font-bold text-primary">Wgraj plik CSV z komputera / telefonu</span>
        <span className="text-[11px] text-muted-foreground">
          Kliknij, aby wybrać plik, albo przeciągnij go tutaj (.csv, .tsv, .txt)
        </span>
        <input
          type="file"
          accept=".csv,.tsv,.txt,text/csv,text/plain"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) setText(await file.text());
            e.target.value = "";
          }}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <input
          className={`${input} sm:max-w-lg`}
          placeholder="…lub link do Google Sheets / pliku CSV"
          value={sheetUrl}
          onChange={(e) => setSheetUrl(e.target.value)}
        />
        <button className={btn} disabled={busy} onClick={() => void loadSheet()}>
          Wczytaj arkusz
        </button>
      </div>




      <textarea
        className={`${input} mt-4 min-h-40 font-mono text-xs`}
        placeholder="...albo wklej dane skopiowane z Excela / Google Sheets"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {preview.length ? (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary text-muted-foreground">
              <tr>
                <th className="p-2">Tytuł</th>
                <th className="p-2">Kategoria</th>
                <th className="p-2">Cena</th>
                <th className="p-2">Zdjęcie</th>
              </tr>
            </thead>
            <tbody>
              {preview.slice(0, 10).map((p, i) => (
                <tr key={`${p.title}-${i}`} className="border-t border-border">
                  <td className="p-2">{p.title}</td>
                  <td className="p-2">{p.category}</td>
                  <td className="p-2">{p.price}</td>
                  <td className="p-2 truncate max-w-[180px]">{p.image_url ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {msg ? <p className="mt-3 text-xs text-brand-cyan">{msg}</p> : null}
      <button className={`${btn} mt-5`} disabled={busy || !preview.length} onClick={() => void importAll()}>
        Importuj {preview.length ? `(${preview.length})` : ""}
      </button>
    </section>
  );
}
