import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { panelDb } from "@/lib/panelDb";
import { clearPanelToken, getPanelToken, setPanelToken } from "@/lib/panelToken";
import { sellerLogin } from "@/lib/secure.functions";
import { ProductCard } from "@/components/ProductCard";
import { ImageUploader } from "@/components/ImageUploader";
import { DEFAULT_SHIRT_SIZES, isShirt } from "@/lib/csvImport";
import {
  parseList,
  safeStorage,
  sha256Hex,
  useAgents,
  useCategories,
  useProducts,
  useRefresh,
  useSellers,
  type Product,
  type Seller,
} from "@/lib/store";

export const Route = createFileRoute("/seller")({
  head: () => ({
    meta: [
      { title: "Panel sprzedawcy — PKMREPS" },
      { name: "description", content: "Panel zarządzania sklepem dla sprzedawców PKMREPS." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Panel sprzedawcy — PKMREPS" },
      { property: "og:description", content: "Zarządzaj produktami i brandingiem swojego sklepu." },
    ],
  }),
  component: SellerPage,
});

const input =
  "w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm outline-none focus:border-primary";
const btn =
  "rounded-lg gradient-brand px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-surface-deep";
const btnGhost =
  "rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary";

function SellerPage() {
  const { data: sellers } = useSellers();
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    const saved = safeStorage.get("pkmr_seller");
    if (saved && getPanelToken()) setSellerId(saved);
  }, []);

  const seller = (sellers ?? []).find((s) => s.id === sellerId) ?? null;

  const login = async () => {
    setErr("");
    const res = await sellerLogin({
      data: { username: user.trim(), passwordHash: await sha256Hex(pass) },
    }).catch(() => ({ ok: false as const }));
    if (!res.ok || !("sellerId" in res)) {
      return;
    }
    if ("token" in res) setPanelToken(res.token);
    safeStorage.set("pkmr_seller", res.sellerId);
    setSellerId(res.sellerId);
  };


  if (!seller) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void login();
          }}
          className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-surface p-8 glow-ring"
        >
          <h1 className="text-xl font-black">Panel sprzedawcy</h1>
          <input
            className={input}
            placeholder="Login"
            autoCapitalize="none"
            autoCorrect="off"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
          <input
            className={input}
            type="password"
            placeholder="Hasło"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          {err ? <p className="text-xs text-destructive">{err}</p> : null}
          <button className={`${btn} w-full`}>Zaloguj</button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gradient-brand">Sklep: {seller.name}</h1>
        <div className="flex gap-2">
        <Link to="/" className={btnGhost}>
          ← Powrót do strony
        </Link>
        <button
          className={btnGhost}
          onClick={() => {
            clearPanelToken();
            safeStorage.remove("pkmr_seller");
            setSellerId(null);
          }}
        >
          Wyloguj
        </button>
        </div>
      </div>
      <div className="mt-6 space-y-6">
        <StoreBranding seller={seller} />
        <SellerProducts seller={seller} />
      </div>
    </div>
  );
}

function StoreBranding({ seller }: { seller: Seller }) {
  const refresh = useRefresh();
  const [form, setForm] = useState({
    name: seller.name,
    slug: seller.slug,
    description: seller.description,
    logo_url: seller.logo_url ?? "",
    banner_url: seller.banner_url ?? "",
    external_url: seller.external_url ?? "",
    link_mode: seller.link_mode ?? "agents",
  });
  const [msg, setMsg] = useState("");

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="mb-4 text-lg font-bold">Branding sklepu</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className={input}
          placeholder="Nazwa sklepu"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className={input}
          placeholder="Slug (np. momo-store)"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
        />
        <input
          className={input}
          placeholder="Logo URL"
          value={form.logo_url}
          onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
        />
        <input
          className={input}
          placeholder="Baner URL"
          value={form.banner_url}
          onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
        />
        <input
          className={input}
          placeholder="Zewnętrzny link sklepu (Yupoo itp.)"
          value={form.external_url}
          onChange={(e) => setForm({ ...form, external_url: e.target.value })}
        />
        <label className="text-xs font-semibold text-muted-foreground">
          Jak sprzedajesz?
          <select
            className={`${input} mt-1`}
            value={form.link_mode}
            onChange={(e) => setForm({ ...form, link_mode: e.target.value })}
          >
            <option value="agents">Linki agentów przy produktach</option>
            <option value="external">Tylko zewnętrzny sklep / Yupoo</option>
          </select>
        </label>
        <textarea
          className={`${input} min-h-20 sm:col-span-2`}
          placeholder="Opis sklepu"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <ImageUploader
          urls={form.logo_url ? [form.logo_url] : []}
          multiple={false}
          folder={`stores/${seller.id}`}
          label="Logo z urządzenia / galerii"
          onChange={(u) => setForm({ ...form, logo_url: u[0] ?? "" })}
        />
        <ImageUploader
          urls={form.banner_url ? [form.banner_url] : []}
          multiple={false}
          folder={`stores/${seller.id}`}
          label="Baner z urządzenia / galerii"
          onChange={(u) => setForm({ ...form, banner_url: u[0] ?? "" })}
        />
      </div>
      {msg ? <p className="mt-3 text-xs text-brand-cyan">{msg}</p> : null}
      <button
        className={`${btn} mt-5`}
        onClick={async () => {
          const slug = form.slug.trim().toLowerCase().replace(/\s+/g, "-");
          const { error } = await panelDb
            .from("sellers")
            .update({ ...form, slug })
            .eq("id", seller.id);
          setMsg(error ? "Nie udało się zapisać." : "Zapisano.");
          await refresh("sellers");
        }}
      >
        Zapisz sklep
      </button>
    </section>
  );
}

function SellerProducts({ seller }: { seller: Seller }) {
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const { data: agents } = useAgents();
  const refresh = useRefresh();

  const empty = {
    title: "",
    category: "",
    price: 0,
    image_url: "",
    qc_url: "",
    quality: "Best",
    batch: "",
    display_order: 0,
    sizes: "",
    images: "",
    store_url: "",
    store_name: "",
    agent_links: {} as Record<string, string>,
  };
  const [form, setForm] = useState<typeof empty & { id?: string }>(empty);
  const mine = (products ?? []).filter((p) => p.seller_id === seller.id);

  const galleryUrls = parseList(form.images);

  const save = async () => {
    if (!form.title) return;
    const enteredSizes = parseList(form.sizes);
    const payload = {
      title: form.title,
      category: form.category,
      price: Number(form.price) || 0,
      image_url: form.image_url,
      qc_url: form.qc_url,
      quality: form.quality,
      batch: form.batch,
      display_order: Number(form.display_order) || 0,
      sizes: enteredSizes.length || !isShirt(form.title, form.category) ? enteredSizes : DEFAULT_SHIRT_SIZES,
      images: galleryUrls,
      agent_links: form.agent_links,
      store_url: form.store_url,
      store_name: form.store_name,
      seller_id: seller.id,
    };
    if (form.id) await panelDb.from("products").update(payload).eq("id", form.id);
    else await panelDb.from("products").insert(payload);
    setForm(empty);
    await refresh("products");
  };

  const preview: Product = {
    id: "preview",
    qc_images: [],
    for_women: false,
    verified: false,
    show_on_home: false,
    title: form.title || "Nazwa produktu",
    category: form.category,
    price: Number(form.price) || 0,
    image_url: form.image_url || null,
    qc_url: form.qc_url || null,
    quality: form.quality,
    sizes: parseList(form.sizes),
    images: galleryUrls,
    views: 0,
    agent_links: form.agent_links,
    batch: form.batch,
    display_order: Number(form.display_order) || 0,
    tiktok_url: null,
    price_cny: 0,
    promoted: false,
    store_url: form.store_url,
    store_name: form.store_name,
  };

  return (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-4 text-lg font-bold">{form.id ? "Edytuj produkt" : "Dodaj produkt"}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className={input}
              placeholder="Tytuł"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <input
              className={input}
              placeholder="Link do Twojego Yupoo / sklepu (opcjonalnie)"
              value={form.store_url}
              onChange={(e) => setForm({ ...form, store_url: e.target.value })}
            />
            <input
              className={input}
              placeholder="Nazwa sklepu na przycisku (np. MOMO Yupoo)"
              value={form.store_name}
              onChange={(e) => setForm({ ...form, store_name: e.target.value })}
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
              type="number"
              placeholder="Cena PLN"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
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
            <input
              className={input}
              type="number"
              placeholder="Kolejność wyświetlania"
              value={form.display_order}
              onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
            />
            <input
              className={input}
              placeholder="Zdjęcie główne URL"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            />
            <input
              className={input}
              placeholder="Link do zdjęć QC"
              value={form.qc_url}
              onChange={(e) => setForm({ ...form, qc_url: e.target.value })}
            />
            <input
              className={input}
              placeholder="Rozmiary po przecinku (S, M, L)"
              value={form.sizes}
              onChange={(e) => setForm({ ...form, sizes: e.target.value })}
            />
            <input
              className={input}
              placeholder="Dodatkowe zdjęcia po przecinku (URL, URL)"
              value={form.images}
              onChange={(e) => setForm({ ...form, images: e.target.value })}
            />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <ImageUploader
              urls={form.image_url ? [form.image_url] : []}
              multiple={false}
              folder={`stores/${seller.id}`}
              label="Zdjęcie główne z urządzenia"
              onChange={(u) => setForm({ ...form, image_url: u[0] ?? "" })}
            />
            <ImageUploader
              urls={galleryUrls}
              folder={`stores/${seller.id}`}
              onChange={(u) => setForm({ ...form, images: u.join(", ") })}
            />
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

        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-4 text-lg font-bold">Podgląd na żywo</h2>
          <ProductCard product={preview} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-bold">Moje produkty ({mine.length})</h2>
        <ul className="space-y-2">
          {mine.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3"
            >
              {p.image_url ? (
                <img src={p.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
              ) : null}
              <span className="flex-1 text-sm font-semibold">{p.title}</span>
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
                onClick={() =>
                  setForm({
                    id: p.id,
                    title: p.title,
                    category: p.category,
                    price: p.price,
                    image_url: p.image_url ?? "",
                    qc_url: p.qc_url ?? "",
                    quality: p.quality,
                    batch: p.batch ?? "",
                    display_order: p.display_order ?? 0,
                    sizes: (p.sizes ?? []).join(", "),
                    images: (p.images ?? []).join(", "),
                    store_url: p.store_url ?? "",
                    store_name: p.store_name ?? "",
                    agent_links: p.agent_links ?? {},
                  })
                }
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
      </div>
    </section>
  );
}
