import type { Seller } from "@/lib/store";

/**
 * Publiczne profile sprzedawców zapisane lokalnie w kodzie.
 * Używane, gdy baza jest niedostępna lub gdy sprzedawca ma konto lokalne
 * (patrz `src/data/local-accounts.server.ts` — te same `id`).
 */
export const LOCAL_SELLERS_PUBLIC: Seller[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Sprzedawca",
    slug: "sprzedawca",
    username: "sprzedawca",
    logo_url: null,
    banner_url: null,
    description: "",
    active: true,
    external_url: "",
    link_mode: "agents",
  },
];
