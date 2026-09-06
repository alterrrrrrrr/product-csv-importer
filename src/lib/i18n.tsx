import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { safeStorage, useSettings } from "@/lib/store";
import { EXTRA_TRANSLATIONS } from "@/lib/i18n.translations";

export type Lang = "pl" | "en" | "de" | "fr" | "es" | "it" | "zh";

/** Lista języków w przełączniku (kod, etykieta, kod kraju flagi). */
export const LANGS: { code: Lang; label: string; flag: string; country: string }[] = [
  { code: "pl", label: "Polski", flag: "🇵🇱", country: "pl" },
  { code: "en", label: "English", flag: "🇬🇧", country: "gb" },
  { code: "de", label: "Deutsch", flag: "🇩🇪", country: "de" },
  { code: "fr", label: "Français", flag: "🇫🇷", country: "fr" },
  { code: "es", label: "Español", flag: "🇪🇸", country: "es" },
  { code: "it", label: "Italiano", flag: "🇮🇹", country: "it" },
  { code: "zh", label: "中文", flag: "🇨🇳", country: "cn" },
];

/** Obrazek flagi (SVG) – emoji flag nie wyświetla się na Windows. */
export function flagUrl(country: string): string {
  return `https://flagcdn.com/${country}.svg`;
}

const LANG_CODES = LANGS.map((l) => l.code);

/** Domyślne teksty. Admin może nadpisać każdy z nich w zakładce „Języki”. */
export const DICT: Record<string, Partial<Record<Lang, string>> & { pl: string; en: string }> = {
  "nav.finder": { pl: "Product Finder", en: "Product Finder" },
  "nav.outfits": { pl: "Losowanie outfitów", en: "Outfit roll" },
  "nav.sellers": { pl: "Sprzedawcy", en: "Stores" },
  "nav.agents": { pl: "Agenci", en: "Agents" },
  "nav.promos": { pl: "Promocje", en: "Deals" },
  "nav.guide": { pl: "Poradnik & Narzędzia", en: "Guides & Tools" },
  "nav.tiktok": { pl: "Linki z TikToka", en: "TikTok Links" },
  "finder.all": { pl: "Wszystkie produkty", en: "All products" },
  "finder.search": { pl: "Szukaj produktu...", en: "Search products..." },
  "finder.priceFrom": { pl: "Cena od (PLN)", en: "Price from (PLN)" },
  "finder.priceTo": { pl: "Cena do (PLN)", en: "Price to (PLN)" },
  "finder.clear": { pl: "Wyczyść filtry", en: "Clear filters" },
  "finder.empty": { pl: "Brak produktów do wyświetlenia.", en: "No products to display." },
  "finder.allCats": { pl: "Wszystkie", en: "All" },
  "finder.loadMore": { pl: "Załaduj więcej", en: "Load more" },
  "outfit.shoes": { pl: "Buty", en: "Shoes" },
  "outfit.bottoms": { pl: "Spodnie", en: "Bottoms" },
  "outfit.tops": { pl: "Koszulka / Bluza", en: "Tops & hoodies" },
  "outfit.acc": { pl: "Czapka / Akcesoria", en: "Caps & accessories" },
  "outfit.jacket": { pl: "Kurtka", en: "Jacket" },
  "outfit.addJacket": { pl: "+ Dodaj kurtkę", en: "+ Add jacket" },
  "outfit.removeJacket": { pl: "Usuń kurtkę", en: "Remove jacket" },
  "outfit.includeWomen": { pl: "Damskie produkty", en: "Women's items" },
  "outfit.kicker": { pl: "Losowanie outfitów", en: "Outfit roll" },
  "outfit.title1": { pl: "Wylosuj", en: "Roll a" },
  "outfit.title2": { pl: "kompletny zestaw", en: "complete fit" },
  "outfit.desc": {
    pl: "Buty · Spodnie · Góra · Czapka / akcesoria — losowane z katalogu.",
    en: "Shoes · Bottoms · Tops · Caps & accessories — rolled from the catalog.",
  },
  "outfit.rolling": { pl: "Losowanie...", en: "Rolling..." },
  "outfit.rollAgain": { pl: "Losuj ponownie 🎲", en: "Roll again 🎲" },
  "outfit.roll": { pl: "Losuj outfit 🎲", en: "Roll outfit 🎲" },
  "outfit.empty": { pl: "Brak produktów w tej kategorii", en: "No products in this category" },
  "outfit.clickRoll": { pl: "Kliknij Losuj", en: "Click Roll" },
  "outfit.preview": { pl: "Podejrzyj", en: "Preview" },
  "outfit.total": { pl: "Łączna cena zestawu", en: "Total fit price" },

  "home.kicker": { pl: "Agent & QC Finds", en: "Agent & QC Finds" },
  "home.title1": { pl: "Znajdź swoje", en: "Find your" },
  "home.title2": { pl: "najlepsze findsy", en: "best finds" },
  "home.subtitle": {
    pl: "Sprawdzone produkty, zdjęcia QC i bezpośrednie linki do zakupu przez Twojego agenta.",
    en: "Verified products, QC photos and direct buy links through your agent.",
  },
  "home.cats": { pl: "Kategorie produktów", en: "Product categories" },
  "home.outfitTitle": {
    pl: "Generator outfitów — wylosuj cały zestaw",
    en: "Outfit generator — roll a full fit",
  },
  "home.outfitDesc": {
    pl: "Buty, spodnie, góra i akcesoria w jednym losowaniu, z ceną w PLN, USD i CNY.",
    en: "Shoes, pants, top and accessories in one roll, priced in PLN, USD and CNY.",
  },
  "home.outfitCta": { pl: "Losuj outfit →", en: "Roll outfit →" },

  "guide.title1": { pl: "Poradnik", en: "Guides" },
  "guide.title2": { pl: "& Narzędzia", en: "& Tools" },
  "guide.subtitle": {
    pl: "Najpierw narzędzia, na dole pełne poradniki krok po kroku.",
    en: "Tools first, full step-by-step guides below.",
  },
  "guide.trackTitle": { pl: "📦 Śledzenie paczek", en: "📦 Package tracking" },
  "guide.trackDesc": {
    pl: "Wpisz numer przesyłki — pobierzemy status z sieci przewoźników i oszacujemy czas dostawy.",
    en: "Enter your tracking number — we fetch the carrier status and estimate the delivery time.",
  },
  "guide.trackPlaceholder": { pl: "Numer przesyłki", en: "Tracking number" },
  "guide.trackCta": { pl: "Sprawdź status", en: "Check status" },
  "guide.trackStageQ": { pl: "Ostatni status paczki:", en: "Latest parcel status:" },
  "guide.trackEta": { pl: "Przewidywany czas dostawy", en: "Estimated delivery time" },
  "guide.trackArrival": { pl: "Orientacyjna data", en: "Approximate date" },
  "guide.trackLoading": { pl: "Sprawdzam…", en: "Checking…" },
  "guide.trackShort": { pl: "Podaj poprawny numer przesyłki.", en: "Enter a valid tracking number." },
  "guide.trackNotFound": {
    pl: "Nie znaleziono danych dla tego numeru. Spróbuj ponownie za kilka godzin.",
    en: "No data found for this number. Try again in a few hours.",
  },
  "guide.trackSource": { pl: "Źródło", en: "Source" },
  "guide.trackEstimated": {
    pl: "Brak danych na żywo od przewoźnika — szacunek na podstawie typu przesyłki.",
    en: "No live carrier data — estimate based on the shipment type.",
  },

  "guide.trackOpen": { pl: "Otwórz w", en: "Open in" },
  "guide.trackDay": { pl: "dzień", en: "day" },
  "guide.trackDays": { pl: "dni", en: "days" },
  "guide.trackToday": { pl: "Paczka jest już u Ciebie 🎉", en: "Your parcel has arrived 🎉" },
  "guide.parcel": { pl: "Paczka", en: "Parcel" },

  "track.s1": { pl: "W magazynie agenta (Chiny)", en: "At agent's warehouse (China)" },
  "track.s1d": {
    pl: "Paczka czeka na wysyłkę lub jest pakowana w Chinach.",
    en: "The parcel is waiting to be packed and shipped from China.",
  },
  "track.s2": { pl: "Wysłana z Chin", en: "Shipped from China" },
  "track.s2d": {
    pl: "Paczka opuściła magazyn i czeka na odprawę eksportową / lot.",
    en: "The parcel left the warehouse and awaits export clearance / flight.",
  },
  "track.s3": { pl: "Transport międzynarodowy", en: "International transit" },
  "track.s3d": {
    pl: "Paczka jest w drodze do Europy — to najdłuższy etap.",
    en: "The parcel is en route to Europe — the longest stage.",
  },
  "track.s4": { pl: "Odprawa celna w UE", en: "EU customs clearance" },
  "track.s4d": {
    pl: "Paczka wylądowała w UE i przechodzi odprawę celną.",
    en: "The parcel landed in the EU and is going through customs.",
  },
  "track.s5": { pl: "W Polsce / u kuriera", en: "In Poland / with courier" },
  "track.s5d": {
    pl: "Paczka jest już w kraju — kurier doręczy ją maksymalnie w 2 dni.",
    en: "The parcel is in the country — the courier delivers within 2 days max.",
  },
  "track.s6": { pl: "Do odbioru / w doręczeniu", en: "Out for delivery / ready for pickup" },
  "track.s6d": {
    pl: "Kurier jedzie z paczką albo czeka ona w punkcie/paczkomacie.",
    en: "The courier is on the way or the parcel waits at a pickup point.",
  },
  "track.s7": { pl: "Dostarczona", en: "Delivered" },
  "track.s7d": { pl: "Paczka została dostarczona.", en: "The parcel has been delivered." },
  "guide.qcTitle": { pl: "🔍 QC Inspector / Finder", en: "🔍 QC Inspector / Finder" },
  "guide.qcDesc": {
    pl: "Wklej ID lub link produktu, aby otworzyć zdjęcia QC.",
    en: "Paste a product ID or link to open QC photos.",
  },
  "guide.qcPlaceholder": { pl: "ID produktu lub link", en: "Product ID or link" },
  "guide.qcCta": { pl: "Znajdź zdjęcia QC", en: "Find QC photos" },
  "guide.convTitle": { pl: "Link Converter", en: "Link Converter" },
  "guide.convDesc": {
    pl: "Wklej link z 1688 / Taobao / Weidian albo gotowy link agenta (USFANS, Kakobuy, Litbuy…) — zamienimy go na link u wybranego agenta.",
    en: "Paste a 1688 / Taobao / Weidian link or an existing agent link (USFANS, Kakobuy, Litbuy…) — we convert it for your agent of choice.",
  },
  "guide.convPlaceholder": {
    pl: "https://detail.1688.com/offer/123456789.html lub link agenta",
    en: "https://detail.1688.com/offer/123456789.html or an agent link",
  },
  "guide.convInvalid": {
    pl: "Nie rozpoznano linku produktu — obsługujemy Weidian, 1688, Taobao oraz linki agentów. Oryginalny link pozostaje bez zmian.",
    en: "Product link not recognised — we support Weidian, 1688, Taobao and agent links. The original link stays unchanged.",
  },
  "guide.source": { pl: "Źródło:", en: "Source:" },
  "guide.openIn": { pl: "Otwórz w", en: "Open in" },
  "guide.copy": { pl: "Kopiuj", en: "Copy" },
  "guide.stepsTitle1": { pl: "Poradniki", en: "Guides" },
  "guide.stepsTitle2": { pl: "krok po kroku", en: "step by step" },
  "guide.stepsSubtitle": {
    pl: "Poradnik Zamawiania · Poradnik Śledzenia Paczki · Poradnik Używania",
    en: "Ordering guide · Package tracking guide · Usage guide",
  },
  "guide.step": { pl: "Krok", en: "Step" },

  "calc.kicker": { pl: "Kalkulator wagi", en: "Weight calculator" },
  "calc.title": {
    pl: "Ile zapłacisz za wysyłkę haulu?",
    en: "How much will your haul shipping cost?",
  },
  "calc.range": { pl: "Minimum 0.5 kg, maksimum 25 kg.", en: "Minimum 0.5 kg, maximum 25 kg." },
  "calc.kilograms": { pl: "kilogramy", en: "kilograms" },
  "calc.less": { pl: "Mniej", en: "Less" },
  "calc.more": { pl: "Więcej", en: "More" },
  "calc.weightAria": { pl: "Waga paczki w kg", en: "Parcel weight in kg" },
  "calc.prices": { pl: "Ceny:", en: "Prices:" },
  "calc.withCoupons": { pl: "Z kuponami", en: "With coupons" },
  "calc.withoutCoupons": { pl: "Bez kuponów", en: "Without coupons" },
  "calc.empty": {
    pl: "Brak zdefiniowanych stawek wysyłki dla tej wagi.",
    en: "No shipping rates defined for this weight.",
  },
  "calc.cheapest": { pl: "Najtańsza opcja", en: "Cheapest option" },
  "calc.code": { pl: "kod", en: "code" },
  "calc.signup": { pl: "Zarejestruj się \u2192", en: "Sign up \u2192" },

  "cart.title": { pl: "Koszyk", en: "Cart" },
  "cart.itemsLabel": { pl: "przedmiotów", en: "items" },
  "cart.shippingHint": { pl: "oblicz koszt wysyłki z Chin", en: "calculate shipping from China" },
  "cart.itemsTitle": { pl: "Przedmioty", en: "Items" },
  "cart.clear": { pl: "Wyczyść", en: "Clear" },
  "cart.emptyTitle": { pl: "Koszyk jest pusty", en: "Your cart is empty" },
  "cart.emptyDesc": {
    pl: "Dodaj produkty z katalogu, aby zobaczyć je tutaj i wyliczyć wysyłkę.",
    en: "Add products from the catalog to see them here and calculate shipping.",
  },
  "cart.browse": { pl: "Przeglądaj produkty →", en: "Browse products →" },
  "cart.openLink": { pl: "Otwórz link →", en: "Open link →" },
  "cart.openOn": { pl: "Otwórz w", en: "Open on", de: "Öffnen bei", fr: "Ouvrir sur", es: "Abrir en", it: "Apri su", zh: "打开" },
  "cart.agent": { pl: "Agent (linki zakupowe)", en: "Agent (purchase links)", de: "Agent (Kauflinks)", fr: "Agent (liens d'achat)", es: "Agente (enlaces de compra)", it: "Agente (link d'acquisto)", zh: "代理（购买链接）" },
  "cart.remove": { pl: "Usuń z koszyka", en: "Remove from cart" },
  "cart.total": { pl: "Łącznie", en: "Total" },
  "cart.shippingTitle": { pl: "Kraj docelowy wysyłki", en: "Shipping destination" },
  "cart.destination": { pl: "Kraj docelowy", en: "Destination country" },
  "cart.withBox": { pl: "Z pudełkiem", en: "With box" },
  "cart.withoutBox": { pl: "Bez pudełka", en: "Without box" },
  "cart.shippingLine": { pl: "Linia wysyłkowa", en: "Shipping line" },
  "cart.noShipping": { pl: "Brak dostępnych linii wysyłkowych.", en: "No shipping lines available." },
  "cart.code": { pl: "kod", en: "code" },
  "cart.noCoupon": { pl: "bez kuponu", en: "no coupon" },
  "cart.calculate": { pl: "Wylicz wysyłkę", en: "Calculate shipping" },
  "cart.selectLine": { pl: "Wybierz linię wysyłkową", en: "Select a shipping line" },
  "cart.estimateNote": {
    pl: "Koszt orientacyjny dla 1 kg. Wagi produktów dodamy wkrótce.",
    en: "Estimated cost for 1 kg. Product weights coming soon.",
  },

  "promos.title1": { pl: "Aktualne", en: "Current" },
  "promos.title2": { pl: "promocje", en: "deals" },
  "promos.subtitle": {
    pl: "Sklepy i produkty z aktywnymi przecenami \u2014 dodawane na bie\u017c\u0105co.",
    en: "Stores and products with active discounts \u2014 updated regularly.",
  },
  "promos.empty": {
    pl: "Brak aktywnych promocji. Zajrzyj p\u00f3\u017aniej.",
    en: "No active deals right now. Check back later.",
  },
  "promos.cta": { pl: "Sprawd\u017a promocj\u0119 \u2192", en: "View deal \u2192" },

  "agents.title1": { pl: "Zaufani", en: "Trusted" },
  "agents.title2": { pl: "agenci", en: "agents" },
  "agents.subtitle": {
    pl: "Wybierz agenta, przez kt\u00f3rego chcesz robi\u0107 zakupy \u2014 poni\u017cej aktualne kupony i bonusy.",
    en: "Pick the agent you want to buy through \u2014 current coupons and bonuses below.",
  },
  "agents.discord": { pl: "Do\u0142\u0105cz na Discord", en: "Join our Discord" },
  "agents.limited": { pl: "Limitowana oferta", en: "Limited offer" },
  "agents.offer": { pl: "$450 w kuponach + 40% zni\u017cki", en: "$450 in coupons + 40% off" },
  "agents.useCode1": { pl: "U\u017cyj kodu", en: "Use code" },
  "agents.useCode2": { pl: "przy rejestracji.", en: "when signing up." },
  "agents.cardCta": {
    pl: "Zarejestruj si\u0119 i odbierz kupony",
    en: "Sign up and claim your coupons",
  },

  "stores.title1": { pl: "Sklepy", en: "Seller" },
  "stores.title2": { pl: "sprzedawc\u00f3w", en: "stores" },
  "stores.empty": { pl: "Brak aktywnych sklep\u00f3w.", en: "No active stores." },
  "stores.products": { pl: "produkt\u00f3w", en: "products" },
  "stores.enter": { pl: "Wejd\u017a \u2192", en: "Enter \u2192" },

  "ui.settings": { pl: "⚙️ Ustawienia", en: "⚙️ Settings" },
  "ui.currency": { pl: "Waluta", en: "Currency" },
  "ui.language": { pl: "Język", en: "Language" },
  "ui.close": { pl: "Zamknij", en: "Close" },
  "ui.closeSettings": { pl: "Zamknij ustawienia", en: "Close settings" },
  "ui.settingsAria": { pl: "Ustawienia (waluta i język)", en: "Settings (currency and language)" },
  "cart.lighter": { pl: "lżejsze", en: "lighter" },
  "product.noImage": { pl: "Brak zdjęcia", en: "No photo" },
  "product.check": { pl: "Sprawdź →", en: "View →" },
  "product.add": { pl: "Dodaj do koszyka", en: "Add to cart" },
  "product.qc": { pl: "📷 Zdjęcia QC", en: "📷 QC photos" },
  "product.enterStore": { pl: "Wejdź na sklep", en: "Visit store" },
  "tiktok.empty": {
    pl: "Brak produktów z TikToka w tej kategorii.",
    en: "No TikTok products in this category.",
  },
  "store.external": { pl: "Zewnętrzny sklep / Yupoo →", en: "External store / Yupoo →" },
  "store.noProducts": { pl: "Ten sklep nie ma jeszcze produktów.", en: "This store has no products yet." },
  "promo.kicker": {
    pl: "Limitowane czasowo bonusy na zakupy u agenta",
    en: "Limited-time bonuses for shopping with the agent",
  },
  "promo.title1": { pl: "Zgarnij bonusy", en: "Grab bonuses" },
  "promo.title2": { pl: "warte 3500 zł", en: "worth 3500 PLN" },
  "promo.desc": {
    pl: "Zarejestruj się przez nasz link i odbierz najlepsze bonusy powitalne oraz zniżki na wysyłkę.",
    en: "Sign up through our link and claim the best welcome bonuses and shipping discounts.",
  },
  "promo.row1": { pl: "Bonus powitalny na zakupy", en: "Welcome shopping bonus" },
  "promo.row2": { pl: "Zniżka na wysyłkę", en: "Shipping discount" },
  "promo.row3": { pl: "Kupony na kolejne zamówienia", en: "Coupons for future orders" },
  "promo.hours": { pl: "Godz", en: "Hrs" },
  "promo.minutes": { pl: "Min", en: "Min" },
  "promo.seconds": { pl: "Sek", en: "Sec" },
  "promo.cta": { pl: "⚡ Zarejestruj się i odbierz bonusy →", en: "⚡ Sign up and claim bonuses →" },
  "promo.decline": { pl: "Nie, rezygnuję z darmowych bonusów", en: "No thanks, skip the free bonuses" },
};

/** Tłumaczenia najważniejszych tekstów na pozostałe języki (reszta = angielski). */
const EXTRA: Partial<Record<Lang, Record<string, string>>> = {
  de: {
    "nav.finder": "Produktsuche",
    "nav.outfits": "Outfit-Roll",
    "nav.sellers": "Shops",
    "nav.agents": "Agenten",
    "nav.promos": "Angebote",
    "nav.guide": "Guides & Tools",
    "nav.tiktok": "TikTok-Links",
    "finder.all": "Alle Produkte",
    "finder.search": "Produkt suchen...",
    "finder.priceFrom": "Preis ab (PLN)",
    "finder.priceTo": "Preis bis (PLN)",
    "finder.clear": "Filter löschen",
    "finder.empty": "Keine Produkte gefunden.",
    "finder.allCats": "Alle",
    "finder.loadMore": "Mehr laden",
    "home.title1": "Finde deine",
    "home.title2": "besten Finds",
    "home.subtitle":
      "Geprüfte Produkte, QC-Fotos und direkte Kauflinks über deinen Agenten.",
    "home.cats": "Produktkategorien",
    "home.outfitCta": "Outfit rollen →",
  },
  fr: {
    "nav.finder": "Recherche produits",
    "nav.outfits": "Tirage d'outfit",
    "nav.sellers": "Boutiques",
    "nav.agents": "Agents",
    "nav.promos": "Promos",
    "nav.guide": "Guides & Outils",
    "nav.tiktok": "Liens TikTok",
    "finder.all": "Tous les produits",
    "finder.search": "Rechercher un produit...",
    "finder.priceFrom": "Prix à partir de (PLN)",
    "finder.priceTo": "Prix jusqu'à (PLN)",
    "finder.clear": "Effacer les filtres",
    "finder.empty": "Aucun produit à afficher.",
    "finder.allCats": "Tous",
    "finder.loadMore": "Charger plus",
    "home.title1": "Trouve tes",
    "home.title2": "meilleurs finds",
    "home.subtitle":
      "Produits vérifiés, photos QC et liens d'achat directs via ton agent.",
    "home.cats": "Catégories de produits",
    "home.outfitCta": "Tirer un outfit →",
  },
  es: {
    "nav.finder": "Buscador de productos",
    "nav.outfits": "Sorteo de outfits",
    "nav.sellers": "Tiendas",
    "nav.agents": "Agentes",
    "nav.promos": "Ofertas",
    "nav.guide": "Guías y herramientas",
    "nav.tiktok": "Enlaces de TikTok",
    "finder.all": "Todos los productos",
    "finder.search": "Buscar producto...",
    "finder.priceFrom": "Precio desde (PLN)",
    "finder.priceTo": "Precio hasta (PLN)",
    "finder.clear": "Borrar filtros",
    "finder.empty": "No hay productos para mostrar.",
    "finder.allCats": "Todos",
    "finder.loadMore": "Cargar más",
    "home.title1": "Encuentra tus",
    "home.title2": "mejores finds",
    "home.subtitle":
      "Productos verificados, fotos QC y enlaces de compra directos con tu agente.",
    "home.cats": "Categorías de productos",
    "home.outfitCta": "Sortear outfit →",
  },
  it: {
    "nav.finder": "Ricerca prodotti",
    "nav.outfits": "Estrazione outfit",
    "nav.sellers": "Negozi",
    "nav.agents": "Agenti",
    "nav.promos": "Offerte",
    "nav.guide": "Guide e strumenti",
    "nav.tiktok": "Link TikTok",
    "finder.all": "Tutti i prodotti",
    "finder.search": "Cerca prodotto...",
    "finder.priceFrom": "Prezzo da (PLN)",
    "finder.priceTo": "Prezzo fino a (PLN)",
    "finder.clear": "Cancella filtri",
    "finder.empty": "Nessun prodotto da mostrare.",
    "finder.allCats": "Tutti",
    "finder.loadMore": "Carica altro",
    "home.title1": "Trova i tuoi",
    "home.title2": "migliori finds",
    "home.subtitle":
      "Prodotti verificati, foto QC e link d'acquisto diretti tramite il tuo agente.",
    "home.cats": "Categorie di prodotti",
    "home.outfitCta": "Estrai outfit →",
  },
  zh: {
    "nav.finder": "找货",
    "nav.outfits": "随机穿搭",
    "nav.sellers": "店铺",
    "nav.agents": "代购",
    "nav.promos": "优惠",
    "nav.guide": "教程与工具",
    "nav.tiktok": "TikTok 链接",
    "finder.all": "全部商品",
    "finder.search": "搜索商品...",
    "finder.priceFrom": "最低价格 (PLN)",
    "finder.priceTo": "最高价格 (PLN)",
    "finder.clear": "清除筛选",
    "finder.empty": "暂无商品。",
    "finder.allCats": "全部",
    "finder.loadMore": "加载更多",
    "home.title1": "找到你的",
    "home.title2": "最佳好物",
    "home.subtitle": "已验证商品、QC 图片，以及通过代购的直接购买链接。",
    "home.cats": "商品分类",
    "home.outfitCta": "随机穿搭 →",
  },
};

// Pełne tłumaczenia DE/FR/ES/IT/ZH dla wszystkich kluczy.
for (const [key, langs] of Object.entries(EXTRA_TRANSLATIONS)) {
  if (!DICT[key]) continue;
  for (const [lang, value] of Object.entries(langs)) {
    if (value && value.trim()) DICT[key]![lang as Lang] = value;
  }
}

for (const [lang, entries] of Object.entries(EXTRA)) {
  for (const [key, value] of Object.entries(entries)) {
    if (DICT[key]) DICT[key]![lang as Lang] = value;
  }
}

export const DICT_KEYS = Object.keys(DICT);

export const i18nSettingKey = (lang: Lang, key: string) => `i18n_${lang}_${key}`;

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "pl",
  setLang: () => {},
});

/** Wybrany język pamiętamy na stałe (localStorage), z fallbackiem na sesję. */
function readSavedLang(): Lang | null {
  try {
    const stored = globalThis.localStorage?.getItem("pkmr_lang") ?? safeStorage.get("pkmr_lang");
    return stored && LANG_CODES.includes(stored as Lang) ? (stored as Lang) : null;
  } catch {
    return safeStorage.get("pkmr_lang") as Lang | null;
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pl");

  useEffect(() => {
    const saved = readSavedLang();
    if (saved) setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    safeStorage.set("pkmr_lang", l);
    try {
      globalThis.localStorage?.setItem("pkmr_lang", l);
    } catch {
      /* ignore */
    }
  };

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  const { lang, setLang } = useContext(LangContext);
  const { data: settings } = useSettings();

  /** Zwraca tekst: nadpisanie z panelu → domyślny słownik → fallback → klucz. */
  const t = (key: string, fallback?: string) => {
    const override = settings?.[i18nSettingKey(lang, key)];
    if (override && override.trim()) return override;
    return DICT[key]?.[lang] ?? DICT[key]?.en ?? fallback ?? key;
  };

  return { lang, setLang, t };
}
