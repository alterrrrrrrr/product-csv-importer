/**
 * Lokalne konta panelu (admin + sprzedawcy).
 *
 * Plik jest server-only (`.server.ts`), więc hasła/hashe NIE trafiają do
 * przeglądarki. Dzięki temu logowanie działa również tam, gdzie nie ma
 * połączenia z bazą (np. hosting zewnętrzny bez kluczy Supabase).
 *
 * Hash = SHA-256 hasła zapisany w hex (małe litery).
 * Nowy hash wygenerujesz np. w konsoli przeglądarki:
 *   crypto.subtle.digest('SHA-256', new TextEncoder().encode('haslo'))
 */

export type LocalAdmin = { username: string; passwordHash: string };

export type LocalSellerAccount = {
  id: string;
  username: string;
  passwordHash: string;
  active: boolean;
};

/** Konto administratora. Hasło: Replika271431Enjoyer$ */
export const LOCAL_ADMIN: LocalAdmin = {
  username: "replikaenjoyeradmin",
  passwordHash: "a90f1de0e4b918c302344237e041c27e7c06dc37f48115be40f528ad5fa90880",
};

/**
 * Konta sprzedawców. `id` musi odpowiadać wpisowi w `src/data/local-sellers.ts`.
 * Domyślne konto — login: sprzedawca / hasło: Sprzedawca123!
 */
export const LOCAL_SELLERS: LocalSellerAccount[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    username: "sprzedawca",
    passwordHash: "25716186d916be706a883d3c088011ed7451865b57e2cfe02f8a61927ac3729a",
    active: true,
  },
];
