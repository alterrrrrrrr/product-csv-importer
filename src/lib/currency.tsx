import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { safeStorage, cnyFromPln, usdFromPln, money } from "@/lib/store";

export type Currency = "PLN" | "USD" | "EUR" | "CNY";

export const CURRENCIES: { code: Currency; label: string; symbol: string }[] = [
  { code: "PLN", label: "Złoty", symbol: "zł" },
  { code: "USD", label: "Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "CNY", label: "Yuan", symbol: "¥" },
];

/** Kurs PLN → EUR (stały, jak pozostałe przeliczniki w katalogu). */
export const PLN_TO_EUR = 0.23;

export function convertFromPln(pln: number, currency: Currency): number {
  if (currency === "USD") return usdFromPln(pln);
  if (currency === "EUR") return pln * PLN_TO_EUR;
  if (currency === "CNY") return cnyFromPln(pln);
  return pln;
}

/** Sformatowana cena w wybranej walucie, np. „129.00 zł” / „$32.25”. */
export function formatPrice(pln: number, currency: Currency): string {
  const value = money(convertFromPln(pln, currency));
  if (currency === "PLN") return `${value} zł`;
  if (currency === "USD") return `$${value}`;
  if (currency === "EUR") return `€${value}`;
  return `¥${value}`;
}

const CurrencyContext = createContext<{ currency: Currency; setCurrency: (c: Currency) => void }>({
  currency: "PLN",
  setCurrency: () => {},
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setState] = useState<Currency>("PLN");

  useEffect(() => {
    const saved = safeStorage.get("pkmr_currency");
    if (saved && CURRENCIES.some((c) => c.code === saved)) setState(saved as Currency);
  }, []);

  const setCurrency = (c: Currency) => {
    setState(c);
    safeStorage.set("pkmr_currency", c);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
